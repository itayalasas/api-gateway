import { useState, useEffect } from 'react';
import { X, ArrowRight, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type Integration = Database['public']['Tables']['integrations']['Row'];
type API = Database['public']['Tables']['apis']['Row'];
type APIEndpoint = Database['public']['Tables']['api_endpoints']['Row'];

interface IntegrationFormProps {
  integration: Integration | null;
  apis: API[];
  onClose: () => void;
}

interface APIWithEndpoints extends API {
  endpoints: APIEndpoint[];
}

export function IntegrationForm({ integration, apis, onClose }: IntegrationFormProps) {
  const { user, externalUser } = useAuth();
  const [name, setName] = useState('');
  const [sourceApiId, setSourceApiId] = useState('');
  const [targetApiId, setTargetApiId] = useState('');
  const [sourceEndpointIds, setSourceEndpointIds] = useState<string[]>([]);
  const [targetEndpointId, setTargetEndpointId] = useState('');
  const [apisWithEndpoints, setApisWithEndpoints] = useState<APIWithEndpoints[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [forwardHeaders, setForwardHeaders] = useState<string[]>(['']);
  const [pathParams, setPathParams] = useState<Array<{ param: string; source: string; path: string }>>([]);

  useEffect(() => {
    loadEndpoints();
  }, [apis]);

  useEffect(() => {
    if (integration) {
      setName(integration.name);
      setSourceApiId(integration.source_api_id);
      setTargetApiId(integration.target_api_id);
      if (integration.source_endpoint_id) {
        setSourceEndpointIds([integration.source_endpoint_id]);
        // Load additional source endpoints from junction table
        loadIntegrationSourceEndpoints(integration.id);
      }
      if (integration.target_endpoint_id) setTargetEndpointId(integration.target_endpoint_id);

      if (integration.custom_headers && typeof integration.custom_headers === 'object') {
        const headers = Object.entries(integration.custom_headers).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setCustomHeaders(headers.length > 0 ? headers : [{ key: '', value: '' }]);
      }

      if (integration.forward_headers && Array.isArray(integration.forward_headers)) {
        setForwardHeaders(integration.forward_headers.length > 0 ? integration.forward_headers : ['']);
      }

      if (integration.path_params && Array.isArray(integration.path_params)) {
        setPathParams(integration.path_params);
      }
    }
  }, [integration]);

  const loadEndpoints = async () => {
    const { data: endpoints } = await supabase
      .from('api_endpoints')
      .select('*');

    if (endpoints) {
      const apisWithEndpointsData = apis.map(api => ({
        ...api,
        endpoints: endpoints.filter(e => e.api_id === api.id)
      }));
      setApisWithEndpoints(apisWithEndpointsData);
    }
  };

  const loadIntegrationSourceEndpoints = async (integrationId: string) => {
    const { data } = await supabase
      .from('integration_source_endpoints')
      .select('source_endpoint_id')
      .eq('integration_id', integrationId);

    if (data && data.length > 0) {
      const endpointIds = data.map(d => d.source_endpoint_id);
      setSourceEndpointIds(endpointIds);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = externalUser?.id || user?.id;
    if (!userId) return;

    if (sourceEndpointIds.length === 0 || !targetEndpointId) {
      setError('Debes seleccionar al menos un endpoint de origen y un endpoint de destino');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const targetEndpoint = apisWithEndpoints
        .find(a => a.id === targetApiId)?.endpoints
        .find(e => e.id === targetEndpointId);

      if (!targetEndpoint) {
        throw new Error('Endpoint de destino no encontrado');
      }

      const headersObject = customHeaders
        .filter(h => h.key.trim() !== '')
        .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});

      const forwardHeadersList = forwardHeaders
        .filter(h => h.trim() !== '')
        .map(h => h.trim());

      const pathParamsConfig = pathParams
        .filter(p => p.path.trim() !== '')
        .map(p => ({
          param: p.param,
          source: p.source,
          path: p.path,
          format: p.format || ':'
        }));

      const integrationData = {
        user_id: userId,
        name,
        source_api_id: sourceApiId,
        target_api_id: targetApiId,
        source_endpoint_id: sourceEndpointIds[0],
        target_endpoint_id: targetEndpointId,
        endpoint_path: targetEndpoint.path,
        method: targetEndpoint.method,
        is_active: true,
        transform_config: {},
        custom_headers: headersObject,
        forward_headers: forwardHeadersList,
        path_params: pathParamsConfig
      };

      let integrationId: string;

      if (integration) {
        integrationId = integration.id;
        const { error: updateError } = await supabase
          .from('integrations')
          .update(integrationData)
          .eq('id', integration.id);

        if (updateError) throw updateError;

        // Delete existing source endpoints
        await supabase
          .from('integration_source_endpoints')
          .delete()
          .eq('integration_id', integrationId);
      } else {
        const { data: newIntegration, error: insertError } = await supabase
          .from('integrations')
          .insert(integrationData)
          .select()
          .single();

        if (insertError || !newIntegration) throw insertError || new Error('Failed to create integration');
        integrationId = newIntegration.id;
      }

      // Insert all source endpoints into junction table
      const sourceEndpointsData = sourceEndpointIds.map(endpointId => ({
        integration_id: integrationId,
        source_endpoint_id: endpointId
      }));

      const { error: junctionError } = await supabase
        .from('integration_source_endpoints')
        .insert(sourceEndpointsData);

      if (junctionError) throw junctionError;

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const publishedAPIs = apisWithEndpoints.filter(api => api.type === 'published');
  const externalAPIs = apisWithEndpoints.filter(api => api.type === 'external');

  const sourceEndpoints = apisWithEndpoints.find(a => a.id === sourceApiId)?.endpoints || [];
  const targetEndpoints = apisWithEndpoints.find(a => a.id === targetApiId)?.endpoints || [];

  const selectedSourceEndpoints = sourceEndpoints.filter(e => sourceEndpointIds.includes(e.id));
  const selectedTargetEndpoint = targetEndpoints.find(e => e.id === targetEndpointId);

  useEffect(() => {
    if (selectedTargetEndpoint) {
      const colonParamRegex = /\/:(\w+)/g;
      const dollarParamRegex = /\$\{(\w+)\}/g;

      const colonMatches = [...selectedTargetEndpoint.path.matchAll(colonParamRegex)];
      const dollarMatches = [...selectedTargetEndpoint.path.matchAll(dollarParamRegex)];

      const colonParams = colonMatches.map(match => ({ name: match[1], format: ':' }));
      const dollarParams = dollarMatches.map(match => ({ name: match[1], format: '${}' }));

      const allParams = [...colonParams, ...dollarParams];

      const currentParamNames = pathParams.map(p => p.param).sort().join(',');
      const newParamNames = allParams.map(p => p.name).sort().join(',');

      if (currentParamNames !== newParamNames) {
        setPathParams(allParams.map(p => ({
          param: p.name,
          source: 'body',
          path: '',
          format: p.format
        })));
      }
    } else if (pathParams.length > 0) {
      setPathParams([]);
    }
  }, [selectedTargetEndpoint]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {integration ? 'Editar Integración' : 'Nueva Integración'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre de la Integración
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Mi Integración"
              required
            />
          </div>

          <div className="bg-slate-900 rounded-xl p-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">1</span>
                Endpoint de Origen (Tu API Publicada)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Seleccionar API
                  </label>
                  <select
                    value={sourceApiId}
                    onChange={(e) => {
                      setSourceApiId(e.target.value);
                      setSourceEndpointIds([]);
                    }}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar API de origen</option>
                    {publishedAPIs.map(api => (
                      <option key={api.id} value={api.id}>
                        {api.name} - {api.application_owner}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Tu API que recibirá las solicitudes</p>
                </div>

                {sourceApiId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Seleccionar Endpoint
                    </label>
                    {sourceEndpoints.length > 0 ? (
                      <div className="space-y-2">
                        <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-3 mb-3">
                          <p className="text-xs text-blue-300">
                            <strong>Selección múltiple:</strong> Puedes seleccionar uno o más endpoints de origen.
                            Todos usarán el mismo endpoint de destino.
                          </p>
                        </div>
                        {sourceEndpoints.map(endpoint => {
                          const isSelected = sourceEndpointIds.includes(endpoint.id);
                          return (
                            <button
                              key={endpoint.id}
                              type="button"
                              onClick={() => {
                                if (isSelected) {
                                  setSourceEndpointIds(sourceEndpointIds.filter(id => id !== endpoint.id));
                                } else {
                                  setSourceEndpointIds([...sourceEndpointIds, endpoint.id]);
                                }
                              }}
                              className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                                isSelected
                                  ? 'border-green-600 bg-green-600/10'
                                  : 'border-slate-600 hover:border-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="w-4 h-4 text-green-600 bg-slate-700 border-slate-600 rounded focus:ring-green-500"
                                />
                                <span className={`px-2 py-1 rounded text-xs font-mono ${
                                  isSelected
                                    ? 'bg-green-600 text-white'
                                    : 'bg-slate-700 text-slate-300'
                                }`}>
                                  {endpoint.method}
                                </span>
                                <span className="font-mono text-white">{endpoint.path}</span>
                              </div>
                              {endpoint.description && (
                                <p className="text-sm text-slate-400 mt-2 ml-7">{endpoint.description}</p>
                              )}
                            </button>
                          );
                        })}
                        {sourceEndpointIds.length > 0 && (
                          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3 mt-3">
                            <p className="text-xs text-green-300">
                              <strong>{sourceEndpointIds.length}</strong> endpoint{sourceEndpointIds.length !== 1 ? 's' : ''} seleccionado{sourceEndpointIds.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                        <p className="text-yellow-400 text-sm">
                          Esta API no tiene endpoints configurados. Ve a la sección APIs para agregar endpoints.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedSourceEndpoints.length > 0 && selectedTargetEndpoint && (
              <div className="flex items-center justify-center py-2">
                <ArrowRight className="w-8 h-8 text-blue-400" />
              </div>
            )}

            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">2</span>
                Endpoint de Destino (API Externa)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Seleccionar API
                  </label>
                  <select
                    value={targetApiId}
                    onChange={(e) => {
                      setTargetApiId(e.target.value);
                      setTargetEndpointId('');
                    }}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Seleccionar API de destino</option>
                    {externalAPIs.map(api => (
                      <option key={api.id} value={api.id}>
                        {api.name} - {api.application_owner}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">API externa a la que se llamará</p>
                </div>

                {targetApiId && (
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Seleccionar Endpoint
                    </label>
                    {targetEndpoints.length > 0 ? (
                      <div className="space-y-2">
                        {targetEndpoints.map(endpoint => (
                          <button
                            key={endpoint.id}
                            type="button"
                            onClick={() => setTargetEndpointId(endpoint.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                              targetEndpointId === endpoint.id
                                ? 'border-blue-600 bg-blue-600/10'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-mono ${
                                targetEndpointId === endpoint.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-700 text-slate-300'
                              }`}>
                                {endpoint.method}
                              </span>
                              <span className="font-mono text-white">{endpoint.path}</span>
                            </div>
                            {endpoint.description && (
                              <p className="text-sm text-slate-400 mt-2">{endpoint.description}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                        <p className="text-yellow-400 text-sm">
                          Esta API no tiene endpoints configurados. Ve a la sección APIs para agregar endpoints.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {targetApiId && (
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-purple-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">3</span>
                Headers Personalizados (Opcional)
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Agrega headers personalizados que se enviarán con cada solicitud a la API de destino.
                Soporta templates: <code className="text-purple-400">${'${header.nombre}'}</code> o <code className="text-purple-400">${'${body.campo}'}</code>
              </p>

              <div className="space-y-3">
                {customHeaders.map((header, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={header.key}
                      onChange={(e) => {
                        const newHeaders = [...customHeaders];
                        newHeaders[index].key = e.target.value;
                        setCustomHeaders(newHeaders);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Nombre del Header (ej: Authorization, X-API-Key)"
                    />
                    <input
                      type="text"
                      value={header.value}
                      onChange={(e) => {
                        const newHeaders = [...customHeaders];
                        newHeaders[index].value = e.target.value;
                        setCustomHeaders(newHeaders);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Valor (ej: ${header.authorization}, Bearer ${body.token})"
                    />
                    {customHeaders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newHeaders = customHeaders.filter((_, i) => i !== index);
                          setCustomHeaders(newHeaders);
                        }}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setCustomHeaders([...customHeaders, { key: '', value: '' }])}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Header
                </button>

                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3 mt-3">
                  <p className="text-xs text-blue-300 mb-2">
                    <strong>Ejemplos comunes:</strong>
                  </p>
                  <ul className="text-xs text-blue-300 space-y-1">
                    <li>• <code>Authorization</code> → <code>${'${header.authorization}'}</code> (toma el header entrante)</li>
                    <li>• <code>X-API-Key</code> → <code>sk_live_12345</code> (valor fijo)</li>
                    <li>• <code>Content-Type</code> → <code>application/json</code></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {targetApiId && (
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-green-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">4</span>
                Headers a Reenviar (Opcional)
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Especifica qué headers de la petición de API 1 deben reenviarse a API 2. Estos headers llegarán con sus valores originales.
              </p>

              <div className="space-y-3">
                {forwardHeaders.map((headerName, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={headerName}
                      onChange={(e) => {
                        const newHeaders = [...forwardHeaders];
                        newHeaders[index] = e.target.value;
                        setForwardHeaders(newHeaders);
                      }}
                      className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Nombre del Header (ej: X-Custom-ID, X-User-Token)"
                    />
                    {forwardHeaders.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          const newHeaders = forwardHeaders.filter((_, i) => i !== index);
                          setForwardHeaders(newHeaders);
                        }}
                        className="p-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-400 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => setForwardHeaders([...forwardHeaders, ''])}
                  className="w-full py-2 bg-slate-700 hover:bg-slate-600 border border-slate-600 text-slate-300 rounded-lg flex items-center justify-center gap-2 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Agregar Header a Reenviar
                </button>

                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3 mt-3">
                  <p className="text-xs text-green-300 mb-2">
                    <strong>¿Cómo funciona?</strong>
                  </p>
                  <ul className="text-xs text-green-300 space-y-1 list-disc list-inside">
                    <li>API 1 envía: <code className="bg-slate-800 px-1 rounded">X-Custom-ID: 12345</code></li>
                    <li>Si agregas "X-Custom-ID" aquí, ese header se reenviará a API 2</li>
                    <li>Los headers de seguridad del Gateway NO se reenvían automáticamente</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {pathParams.length > 0 && (
            <div className="bg-slate-900 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <span className="bg-orange-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">5</span>
                Parámetros de Ruta Dinámicos
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                El endpoint de destino contiene parámetros dinámicos. Configura de dónde obtener sus valores.
              </p>

              <div className="space-y-4">
                {pathParams.map((paramConfig, index) => (
                  <div key={index} className="bg-slate-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-2">
                      <code className="px-2 py-1 bg-orange-600/20 border border-orange-600/40 text-orange-300 rounded text-sm font-mono">
                        {paramConfig.format === '${}' ? `\${${paramConfig.param}}` : `:${paramConfig.param}`}
                      </code>
                      <span className="text-slate-500 text-sm">→</span>
                      <span className="text-slate-400 text-sm">Configurar origen del valor</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Fuente de Datos
                        </label>
                        <select
                          value={paramConfig.source}
                          onChange={(e) => {
                            const newParams = [...pathParams];
                            newParams[index].source = e.target.value;
                            setPathParams(newParams);
                          }}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="body">Body (JSON)</option>
                          <option value="query">Query Parameter</option>
                          <option value="header">Header</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">
                          Ruta/Nombre del Campo
                        </label>
                        <input
                          type="text"
                          value={paramConfig.path}
                          onChange={(e) => {
                            const newParams = [...pathParams];
                            newParams[index].path = e.target.value;
                            setPathParams(newParams);
                          }}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                          placeholder={
                            paramConfig.source === 'body' ? 'data.projectId' :
                            paramConfig.source === 'query' ? 'projectId' :
                            'X-Project-ID'
                          }
                        />
                      </div>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-700 rounded p-2">
                      <p className="text-xs text-slate-400">
                        {paramConfig.source === 'body' && (
                          <>Ejemplo: Si API 1 envía <code className="text-orange-300">{"{ data: { projectId: '123' } }"}</code>, usa <code className="text-orange-300">data.projectId</code></>
                        )}
                        {paramConfig.source === 'query' && (
                          <>Ejemplo: Si API 1 envía <code className="text-orange-300">?projectId=123</code>, usa <code className="text-orange-300">projectId</code></>
                        )}
                        {paramConfig.source === 'header' && (
                          <>Ejemplo: Si API 1 envía header <code className="text-orange-300">X-Project-ID: 123</code>, usa <code className="text-orange-300">X-Project-ID</code></>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectedSourceEndpoint && selectedTargetEndpoint && (
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-2">Resumen de la Integración:</h4>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Origen:</span>
                  <span className="font-mono text-white">{selectedSourceEndpoint.method} {selectedSourceEndpoint.path}</span>
                </div>
                <ArrowRight className="w-4 h-4 text-blue-400" />
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">Destino:</span>
                  <span className="font-mono text-white">{selectedTargetEndpoint.method} {selectedTargetEndpoint.path}</span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !sourceEndpointId || !targetEndpointId}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Guardando...' : integration ? 'Actualizar' : 'Crear Integración'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
