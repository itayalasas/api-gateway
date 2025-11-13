import { useState, useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
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
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [sourceApiId, setSourceApiId] = useState('');
  const [targetApiId, setTargetApiId] = useState('');
  const [sourceEndpointId, setSourceEndpointId] = useState('');
  const [targetEndpointId, setTargetEndpointId] = useState('');
  const [apisWithEndpoints, setApisWithEndpoints] = useState<APIWithEndpoints[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadEndpoints();
  }, [apis]);

  useEffect(() => {
    if (integration) {
      setName(integration.name);
      setSourceApiId(integration.source_api_id);
      setTargetApiId(integration.target_api_id);
      if (integration.source_endpoint_id) setSourceEndpointId(integration.source_endpoint_id);
      if (integration.target_endpoint_id) setTargetEndpointId(integration.target_endpoint_id);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!sourceEndpointId || !targetEndpointId) {
      setError('Debes seleccionar los endpoints de origen y destino');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const sourceEndpoint = apisWithEndpoints
        .find(a => a.id === sourceApiId)?.endpoints
        .find(e => e.id === sourceEndpointId);

      const targetEndpoint = apisWithEndpoints
        .find(a => a.id === targetApiId)?.endpoints
        .find(e => e.id === targetEndpointId);

      if (!sourceEndpoint || !targetEndpoint) {
        throw new Error('Endpoints no encontrados');
      }

      const integrationData = {
        user_id: user.id,
        name,
        source_api_id: sourceApiId,
        target_api_id: targetApiId,
        source_endpoint_id: sourceEndpointId,
        target_endpoint_id: targetEndpointId,
        endpoint_path: targetEndpoint.path,
        method: targetEndpoint.method,
        is_active: true,
        transform_config: {}
      };

      if (integration) {
        const { error: updateError } = await supabase
          .from('integrations')
          .update(integrationData)
          .eq('id', integration.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('integrations')
          .insert(integrationData);

        if (insertError) throw insertError;
      }

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

  const selectedSourceEndpoint = sourceEndpoints.find(e => e.id === sourceEndpointId);
  const selectedTargetEndpoint = targetEndpoints.find(e => e.id === targetEndpointId);

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
                      setSourceEndpointId('');
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
                        {sourceEndpoints.map(endpoint => (
                          <button
                            key={endpoint.id}
                            type="button"
                            onClick={() => setSourceEndpointId(endpoint.id)}
                            className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                              sourceEndpointId === endpoint.id
                                ? 'border-green-600 bg-green-600/10'
                                : 'border-slate-600 hover:border-slate-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-1 rounded text-xs font-mono ${
                                sourceEndpointId === endpoint.id
                                  ? 'bg-green-600 text-white'
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

            {selectedSourceEndpoint && selectedTargetEndpoint && (
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
