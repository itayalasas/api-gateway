import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Integration-Key, X-Integration-Id',
};

interface WebhookConfig {
  database_query?: {
    enabled: boolean;
    table: string;
    select: string;
    filters?: Record<string, any>;
    order_by?: string;
    limit?: number;
  };
  data_mapping?: {
    enabled: boolean;
    mappings?: Array<{
      source: string;
      target: string;
      transform?: string;
    }>;
  };
  merge_strategy?: 'combine' | 'replace' | 'db_only';
}

interface QueryParamConfig {
  name: string;
  source: 'url_query' | 'body' | 'header';
  path: string;
  required?: boolean;
  default?: any;
}

interface TransformConfig extends WebhookConfig {
  query_params?: QueryParamConfig[];
  proxy_mode?: 'direct' | 'post_process';
  post_process_api_id?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(p => p);

    let integrationId: string;

    if (pathParts.includes('api-gateway')) {
      const gatewayIndex = pathParts.indexOf('api-gateway');
      if (gatewayIndex === -1 || pathParts.length <= gatewayIndex + 1) {
        return new Response(
          JSON.stringify({ error: 'Integration ID is required in path: /api-gateway/{integration-id}' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      integrationId = pathParts[gatewayIndex + 1];
    } else {
      return new Response(
        JSON.stringify({ error: 'requested path is invalid' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    const authHeader = req.headers.get('Authorization');
    const integrationKey = req.headers.get('X-Integration-Key');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const { data: integration, error: integrationError } = await supabase
      .from('integrations')
      .select('*')
      .eq('id', integrationId)
      .maybeSingle();

    if (integrationError || !integration) {
      return new Response(
        JSON.stringify({ error: 'Integration not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isValidAnonKey = authHeader === `Bearer ${anonKey}`;
    const isValidIntegrationKey = integrationKey === integration.api_key;

    if (!isValidAnonKey && !isValidIntegrationKey) {
      await logRequest(supabase, {
        integration_id: integrationId,
        request_id: requestId,
        method: req.method,
        path: url.pathname,
        headers: Object.fromEntries(req.headers.entries()),
        body: null,
        response_status: 401,
        response_body: { error: 'Unauthorized' },
        response_time_ms: Date.now() - startTime,
        error_message: 'Missing or invalid authentication header',
        created_at: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({
          error: 'Unauthorized',
          message: 'Please provide either Authorization header with Supabase anon key or X-Integration-Key header with integration API key'
        }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!integration.is_active) {
      return new Response(
        JSON.stringify({ error: 'Integration is not active' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const requestBody = req.method !== 'GET' && req.method !== 'HEAD'
      ? await req.text()
      : null;

    let parsedBody = null;
    try {
      parsedBody = requestBody ? JSON.parse(requestBody) : null;
    } catch {
      parsedBody = requestBody;
    }

    const integrationType = integration.integration_type || 'api_to_api';
    const webhookConfig = integration.webhook_config as WebhookConfig || {};
    const transformConfig = integration.transform_config as TransformConfig || {};

    let dataToSend = parsedBody || {};
    let dbResults = null;

    if ((integrationType === 'webhook' || integrationType === 'database_query') &&
        integration.allow_database_access &&
        webhookConfig.database_query?.enabled) {

      try {
        dbResults = await queryDatabase(supabase, webhookConfig.database_query, parsedBody);

        const mergeStrategy = webhookConfig.merge_strategy || 'combine';

        if (mergeStrategy === 'combine') {
          dataToSend = {
            ...parsedBody,
            db_results: dbResults
          };
        } else if (mergeStrategy === 'db_only') {
          dataToSend = dbResults;
        } else if (mergeStrategy === 'replace') {
          dataToSend = { ...parsedBody };
        }

        if (webhookConfig.data_mapping?.enabled && webhookConfig.data_mapping?.mappings) {
          dataToSend = applyDataMapping(dataToSend, webhookConfig.data_mapping.mappings, parsedBody, dbResults);
        }
      } catch (dbError) {
        const errorMessage = dbError instanceof Error ? dbError.message : 'Database query failed';
        await logRequest(supabase, {
          integration_id: integrationId,
          request_id: requestId,
          method: req.method,
          path: url.pathname,
          headers: Object.fromEntries(req.headers.entries()),
          body: parsedBody,
          response_status: 500,
          response_body: { error: 'Database query failed' },
          response_time_ms: Date.now() - startTime,
          error_message: errorMessage,
          created_at: new Date().toISOString()
        });

        return new Response(
          JSON.stringify({ error: 'Database query failed', details: errorMessage }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    if (integrationType === 'database_query') {
      const responseTime = Date.now() - startTime;

      await logRequest(supabase, {
        integration_id: integrationId,
        request_id: requestId,
        method: req.method,
        path: url.pathname,
        headers: Object.fromEntries(req.headers.entries()),
        body: parsedBody,
        response_status: 200,
        response_body: dataToSend,
        response_time_ms: responseTime,
        error_message: null,
        created_at: new Date().toISOString()
      });

      return new Response(JSON.stringify(dataToSend), {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-Request-Id': requestId,
          'X-Response-Time': `${responseTime}ms`,
        },
      });
    }

    const { data: targetApi } = await supabase
      .from('apis')
      .select('*')
      .eq('id', integration.target_api_id)
      .maybeSingle();

    const { data: targetEndpoint } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('id', integration.target_endpoint_id)
      .maybeSingle();

    const { data: security } = await supabase
      .from('api_security')
      .select('*')
      .eq('api_id', integration.target_api_id)
      .maybeSingle();

    if (!targetApi || !targetEndpoint) {
      const debugInfo = {
        target_api_id: integration.target_api_id,
        target_endpoint_id: integration.target_endpoint_id,
        targetApi_found: !!targetApi,
        targetEndpoint_found: !!targetEndpoint
      };

      await logRequest(supabase, {
        integration_id: integrationId,
        request_id: requestId,
        method: req.method,
        path: url.pathname,
        headers: Object.fromEntries(req.headers.entries()),
        body: parsedBody,
        response_status: 500,
        response_body: { error: 'Target API configuration not found', debug: debugInfo },
        response_time_ms: Date.now() - startTime,
        error_message: `Target API or endpoint not configured. Debug: ${JSON.stringify(debugInfo)}`,
        created_at: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({
          error: 'Target API configuration not found',
          message: 'The target API or endpoint is not properly configured for this integration',
          debug: debugInfo
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let targetPath = targetEndpoint.path;
    const queryParams = new URLSearchParams();

    // Handle query params from transform_config
    if (transformConfig.query_params && Array.isArray(transformConfig.query_params)) {
      for (const paramConfig of transformConfig.query_params) {
        let value: any = paramConfig.default;

        if (paramConfig.source === 'url_query') {
          value = url.searchParams.get(paramConfig.path) || value;
        } else if (paramConfig.source === 'body') {
          value = getNestedValue(parsedBody, paramConfig.path) || value;
        } else if (paramConfig.source === 'header') {
          value = req.headers.get(paramConfig.path) || value;
        }

        if (value !== null && value !== undefined) {
          queryParams.set(paramConfig.name, String(value));
        } else if (paramConfig.required) {
          await logRequest(supabase, {
            integration_id: integrationId,
            request_id: requestId,
            method: req.method,
            path: url.pathname,
            headers: Object.fromEntries(req.headers.entries()),
            body: parsedBody,
            response_status: 400,
            response_body: { error: `Required query parameter '${paramConfig.name}' is missing` },
            response_time_ms: Date.now() - startTime,
            error_message: `Missing required query parameter: ${paramConfig.name}`,
            created_at: new Date().toISOString()
          });

          return new Response(
            JSON.stringify({ error: `Required query parameter '${paramConfig.name}' is missing` }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
    }

    // Handle path params
    if (integration.path_params && Array.isArray(integration.path_params)) {
      const pathParams = integration.path_params as Array<{ param: string; source: string; path: string; format?: string }>;

      for (const paramConfig of pathParams) {
        let value: any;

        if (paramConfig.source === 'body') {
          value = getNestedValue(parsedBody, paramConfig.path);
        } else if (paramConfig.source === 'query') {
          value = url.searchParams.get(paramConfig.path);
        } else if (paramConfig.source === 'header') {
          value = req.headers.get(paramConfig.path);
        }

        console.log(`[PATH PARAM] ${paramConfig.param}: source=${paramConfig.source}, path=${paramConfig.path}, value=${value}`);

        if (value !== null && value !== undefined) {
          const format = paramConfig.format || ':';
          if (format === '${}') {
            const pattern = '${' + paramConfig.param + '}';
            targetPath = targetPath.replace(pattern, String(value));
          } else {
            targetPath = targetPath.replace(`:${paramConfig.param}`, String(value));
          }
        } else {
          // If path param is missing, check if it's required in the URL
          const format = paramConfig.format || ':';
          const pattern = format === '${}' ? '${' + paramConfig.param + '}' : `:${paramConfig.param}`;

          if (targetPath.includes(pattern)) {
            console.error(`[PATH PARAM ERROR] Required parameter '${paramConfig.param}' is missing. Source: ${paramConfig.source}, Path: ${paramConfig.path}`);

            await logRequest(supabase, {
              integration_id: integrationId,
              request_id: requestId,
              method: req.method,
              path: targetEndpoint.path,
              headers: Object.fromEntries(req.headers.entries()),
              body: parsedBody,
              response_status: 400,
              response_body: {
                error: `Required path parameter '${paramConfig.param}' is missing`,
                source: paramConfig.source,
                expected_location: paramConfig.path,
                available_headers: Object.fromEntries(req.headers.entries())
              },
              response_time_ms: Date.now() - startTime,
              error_message: `Missing required path parameter: ${paramConfig.param}`,
              created_at: new Date().toISOString()
            });

            return new Response(
              JSON.stringify({
                error: `Required path parameter '${paramConfig.param}' is missing`,
                details: {
                  source: paramConfig.source,
                  expected_location: paramConfig.path,
                  received_value: value,
                  hint: paramConfig.source === 'header'
                    ? `Make sure the header '${paramConfig.path}' is sent in the request`
                    : `Make sure the ${paramConfig.source} contains '${paramConfig.path}'`
                }
              }),
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // Build target URL with query params
    const queryString = queryParams.toString();
    const targetUrl = `${targetApi.base_url}${targetPath}${queryString ? '?' + queryString : ''}`;
    const targetHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (integration.forward_headers && Array.isArray(integration.forward_headers)) {
      const headersToForward = integration.forward_headers as string[];
      const excludedHeaders = ['authorization', 'x-integration-key', 'x-integration-id', 'host', 'connection'];

      for (const headerName of headersToForward) {
        if (headerName && !excludedHeaders.includes(headerName.toLowerCase())) {
          const headerValue = req.headers.get(headerName);
          if (headerValue) {
            targetHeaders[headerName] = headerValue;
          }
        }
      }
    }

    if (integration.custom_headers && typeof integration.custom_headers === 'object') {
      const customHeaders = integration.custom_headers as Record<string, string>;
      for (const [key, value] of Object.entries(customHeaders)) {
        if (key && value) {
          let finalValue = value;

          // Support ${header.name} template syntax
          const headerRegex = /\$\{header\.(\w+)\}/g;
          finalValue = finalValue.replace(headerRegex, (_, headerName) => {
            return req.headers.get(headerName) || '';
          });

          // Support ${body.path} template syntax
          const bodyRegex = /\$\{body\.([^}]+)\}/g;
          finalValue = finalValue.replace(bodyRegex, (_, path) => {
            const bodyValue = getNestedValue(parsedBody, path);
            return bodyValue !== undefined ? String(bodyValue) : '';
          });

          targetHeaders[key] = finalValue;
        }
      }
    }

    if (security && security.auth_type !== 'none') {
      const authConfig = security.auth_config as any;

      switch (security.auth_type) {
        case 'api_key':
          if (authConfig.headerName && authConfig.apiKey) {
            targetHeaders[authConfig.headerName] = authConfig.apiKey;
          }
          break;
        case 'bearer_token':
          if (authConfig.token) {
            targetHeaders['Authorization'] = `Bearer ${authConfig.token}`;
          }
          break;
        case 'basic_auth':
          if (authConfig.username && authConfig.password) {
            const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
            targetHeaders['Authorization'] = `Basic ${credentials}`;
          }
          break;
        case 'custom':
          if (authConfig.headers && typeof authConfig.headers === 'object') {
            for (const [key, value] of Object.entries(authConfig.headers)) {
              if (key && value) {
                targetHeaders[key] = String(value);
              }
            }
          }
          break;
      }
    }

    try {
      // GET, HEAD, and DELETE methods should not have a request body
      const methodsWithoutBody = ['GET', 'HEAD', 'DELETE'];
      const shouldIncludeBody = !methodsWithoutBody.includes(targetEndpoint.method.toUpperCase());

      const fetchOptions: RequestInit = {
        method: targetEndpoint.method,
        headers: targetHeaders,
      };

      // Only include body for POST, PUT, PATCH, etc.
      if (shouldIncludeBody && dataToSend && Object.keys(dataToSend).length > 0) {
        fetchOptions.body = JSON.stringify(dataToSend);
      }

      const targetResponse = await fetch(targetUrl, fetchOptions);

      const responseText = await targetResponse.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
      }

      // Check if we need to post-process
      const proxyMode = integration.proxy_mode || 'direct';
      if (proxyMode === 'post_process' && integration.post_process_api_id) {
        try {
          // Get post-process API configuration
          const { data: postProcessApi } = await supabase
            .from('apis')
            .select('*, api_endpoints(*), api_security(*)')
            .eq('id', integration.post_process_api_id)
            .maybeSingle();

          if (postProcessApi && postProcessApi.api_endpoints && postProcessApi.api_endpoints.length > 0) {
            const postEndpoint = postProcessApi.api_endpoints[0];
            const postSecurity = postProcessApi.api_security?.[0];
            const postUrl = `${postProcessApi.base_url}${postEndpoint.path}`;

            const postHeaders: Record<string, string> = {
              'Content-Type': 'application/json',
            };

            // Add authentication for post-process API
            if (postSecurity && postSecurity.auth_type !== 'none') {
              const authConfig = postSecurity.auth_config as any;
              switch (postSecurity.auth_type) {
                case 'api_key':
                  if (authConfig.headerName && authConfig.apiKey) {
                    postHeaders[authConfig.headerName] = authConfig.apiKey;
                  }
                  break;
                case 'bearer_token':
                  if (authConfig.token) {
                    postHeaders['Authorization'] = `Bearer ${authConfig.token}`;
                  }
                  break;
                case 'basic_auth':
                  if (authConfig.username && authConfig.password) {
                    const credentials = btoa(`${authConfig.username}:${authConfig.password}`);
                    postHeaders['Authorization'] = `Basic ${credentials}`;
                  }
                  break;
              }
            }

            // Forward the response from target API to post-process API
            const postResponse = await fetch(postUrl, {
              method: postEndpoint.method,
              headers: postHeaders,
              body: JSON.stringify({
                original_request: parsedBody,
                target_response: responseBody
              })
            });

            const postResponseText = await postResponse.text();
            let postResponseBody;
            try {
              postResponseBody = JSON.parse(postResponseText);
            } catch {
              postResponseBody = postResponseText;
            }

            const responseTime = Date.now() - startTime;

            await logRequest(supabase, {
              integration_id: integrationId,
              request_id: requestId,
              method: req.method,
              path: targetEndpoint.path,
              headers: Object.fromEntries(req.headers.entries()),
              body: parsedBody,
              response_status: postResponse.status,
              response_body: postResponseBody,
              response_time_ms: responseTime,
              error_message: null,
              created_at: new Date().toISOString()
            });

            return new Response(postResponseText, {
              status: postResponse.status,
              headers: {
                ...corsHeaders,
                'Content-Type': postResponse.headers.get('Content-Type') || 'application/json',
                'X-Request-Id': requestId,
                'X-Response-Time': `${responseTime}ms`,
                'X-Proxy-Mode': 'post_process',
              },
            });
          }
        } catch (postError) {
          console.error('Post-process error:', postError);
          // Fall through to return original response
        }
      }

      const responseTime = Date.now() - startTime;

      await logRequest(supabase, {
        integration_id: integrationId,
        request_id: requestId,
        method: req.method,
        path: targetEndpoint.path,
        headers: Object.fromEntries(req.headers.entries()),
        body: parsedBody,
        response_status: targetResponse.status,
        response_body: responseBody,
        response_time_ms: responseTime,
        error_message: null,
        created_at: new Date().toISOString()
      });

      return new Response(responseText, {
        status: targetResponse.status,
        headers: {
          ...corsHeaders,
          'Content-Type': targetResponse.headers.get('Content-Type') || 'application/json',
          'X-Request-Id': requestId,
          'X-Response-Time': `${responseTime}ms`,
          'X-Proxy-Mode': proxyMode,
        },
      });

    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      await logRequest(supabase, {
        integration_id: integrationId,
        request_id: requestId,
        method: req.method,
        path: targetEndpoint.path,
        headers: Object.fromEntries(req.headers.entries()),
        body: parsedBody,
        response_status: null,
        response_body: null,
        response_time_ms: responseTime,
        error_message: errorMessage,
        created_at: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({ error: 'Failed to proxy request', details: errorMessage }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Gateway error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal gateway error', details: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function queryDatabase(supabase: any, queryConfig: any, incomingData: any) {
  const { table, select, filters, order_by, limit } = queryConfig;

  let query = supabase.from(table).select(select || '*');

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (typeof value === 'string' && value.startsWith('${incoming.')) {
        const path = value.substring(11, value.length - 1);
        const actualValue = getNestedValue(incomingData, path);
        query = query.eq(key, actualValue);
      } else {
        query = query.eq(key, value);
      }
    }
  }

  if (order_by) {
    const [column, direction] = order_by.split(' ');
    query = query.order(column, { ascending: direction?.toLowerCase() !== 'desc' });
  }

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Database query error: ${error.message}`);
  }

  return data;
}

function applyDataMapping(
  currentData: any,
  mappings: Array<{ source: string; target: string; transform?: string }>,
  incomingData: any,
  dbResults: any
): any {
  const result = { ...currentData };

  for (const mapping of mappings) {
    let value;

    if (mapping.source.startsWith('incoming.')) {
      const path = mapping.source.substring(9);
      value = getNestedValue(incomingData, path);
    } else if (mapping.source.startsWith('db.')) {
      const path = mapping.source.substring(3);
      value = getNestedValue(dbResults, path);
    } else {
      value = getNestedValue(currentData, mapping.source);
    }

    setNestedValue(result, mapping.target, value);
  }

  return result;
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === null || current === undefined) return undefined;

    const arrayMatch = key.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, arrayName, index] = arrayMatch;
      return current[arrayName]?.[parseInt(index)];
    }

    return current[key];
  }, obj);
}

function setNestedValue(obj: any, path: string, value: any): void {
  const keys = path.split('.');
  const lastKey = keys.pop()!;

  const target = keys.reduce((current, key) => {
    if (!(key in current)) {
      current[key] = {};
    }
    return current[key];
  }, obj);

  target[lastKey] = value;
}

async function logRequest(supabase: any, logData: any) {
  try {
    await supabase.from('request_logs').insert(logData);
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}
