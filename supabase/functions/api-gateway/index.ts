import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey, X-Integration-Key, X-Integration-Id',
};

interface IntegrationConfig {
  id: string;
  source_api_id: string;
  target_api_id: string;
  source_endpoint_id: string | null;
  target_endpoint_id: string | null;
  is_active: boolean;
  transform_config: any;
}

interface APIConfig {
  id: string;
  base_url: string;
  type: string;
}

interface EndpointConfig {
  id: string;
  path: string;
  method: string;
}

interface APISecurityConfig {
  auth_type: string;
  auth_config: any;
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
    
    if (pathParts.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Integration ID is required in path: /api-gateway/{integration-id}' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const integrationId = pathParts[1];
    const requestId = crypto.randomUUID();
    const startTime = Date.now();

    // Check authentication: either Supabase anon key OR integration API key
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

    // Validate authentication
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
        response_body: { error: 'Unauthorized', message: 'Missing or invalid authentication' },
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

    const { data: targetApi } = await supabase
      .from('apis')
      .select('*')
      .eq('id', integration.target_api_id)
      .single();

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
      await logRequest(supabase, {
        integration_id: integrationId,
        request_id: requestId,
        method: req.method,
        path: url.pathname,
        headers: Object.fromEntries(req.headers.entries()),
        body: null,
        response_status: 500,
        response_body: { error: 'Target API configuration not found' },
        response_time_ms: Date.now() - startTime,
        error_message: 'Target API or endpoint not configured',
        created_at: new Date().toISOString()
      });

      return new Response(
        JSON.stringify({ error: 'Target API configuration not found' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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

    const targetUrl = `${targetApi.base_url}${targetEndpoint.path}`;

    const targetHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

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
      }
    }

    try {
      const targetResponse = await fetch(targetUrl, {
        method: targetEndpoint.method,
        headers: targetHeaders,
        body: requestBody || undefined,
      });

      const responseText = await targetResponse.text();
      let responseBody;
      try {
        responseBody = JSON.parse(responseText);
      } catch {
        responseBody = responseText;
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

async function logRequest(supabase: any, logData: any) {
  try {
    await supabase.from('request_logs').insert(logData);
  } catch (error) {
    console.error('Failed to log request:', error);
  }
}
