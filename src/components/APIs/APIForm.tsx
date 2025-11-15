import { useState, useEffect } from 'react';
import { X, Lock, Plus, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';

type API = Database['public']['Tables']['apis']['Row'];
type APIEndpoint = Database['public']['Tables']['api_endpoints']['Row'];
type AuthType = 'none' | 'api_key' | 'bearer_token' | 'basic_auth' | 'custom';

interface APIFormProps {
  api: API | null;
  onClose: () => void;
}

interface EndpointForm {
  id?: string;
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  description: string;
  is_active: boolean;
}

export function APIForm({ api, onClose }: APIFormProps) {
  const { user, externalUser } = useAuth();
  const { selectedProject } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [applicationOwner, setApplicationOwner] = useState('');
  const [type, setType] = useState<'published' | 'external'>('external');
  const [baseUrl, setBaseUrl] = useState('');
  const [authType, setAuthType] = useState<AuthType>('none');
  const [authConfig, setAuthConfig] = useState<Record<string, string>>({});
  const [customHeaders, setCustomHeaders] = useState<Array<{ key: string; value: string }>>([{ key: '', value: '' }]);
  const [endpoints, setEndpoints] = useState<EndpointForm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (api) {
      setName(api.name);
      setDescription(api.description);
      setApplicationOwner(api.application_owner);
      setType(api.type);
      setBaseUrl(api.base_url);
      loadSecurity(api.id);
      loadEndpoints(api.id);
    }
  }, [api]);

  const loadSecurity = async (apiId: string) => {
    const { data } = await supabase
      .from('api_security')
      .select('*')
      .eq('api_id', apiId)
      .maybeSingle();

    if (data) {
      setAuthType(data.auth_type);
      const config = data.auth_config as Record<string, any> || {};
      setAuthConfig(config);

      if (data.auth_type === 'custom' && config.headers && typeof config.headers === 'object') {
        const headers = Object.entries(config.headers).map(([key, value]) => ({
          key,
          value: String(value)
        }));
        setCustomHeaders(headers.length > 0 ? headers : [{ key: '', value: '' }]);
      }
    }
  };

  const loadEndpoints = async (apiId: string) => {
    const { data } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('api_id', apiId);

    if (data) {
      setEndpoints(data.map(e => ({
        id: e.id,
        path: e.path,
        method: e.method,
        description: e.description,
        is_active: e.is_active
      })));
    }
  };

  const handleAuthConfigChange = (key: string, value: string) => {
    setAuthConfig(prev => ({ ...prev, [key]: value }));
  };

  const addEndpoint = () => {
    setEndpoints([...endpoints, {
      path: '/api/endpoint',
      method: 'GET',
      description: '',
      is_active: true
    }]);
  };

  const removeEndpoint = (index: number) => {
    setEndpoints(endpoints.filter((_, i) => i !== index));
  };

  const updateEndpoint = (index: number, field: keyof EndpointForm, value: any) => {
    const newEndpoints = [...endpoints];
    newEndpoints[index] = { ...newEndpoints[index], [field]: value };
    setEndpoints(newEndpoints);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = externalUser?.id || user?.id;
    if (!userId) return;

    setError('');
    setLoading(true);

    try {
      const apiData = {
        user_id: userId,
        name,
        description,
        application_owner: applicationOwner,
        type,
        base_url: baseUrl,
        is_active: true
      };

      let apiId: string;

      if (api) {
        const { error: updateError } = await supabase
          .from('apis')
          .update(apiData)
          .eq('id', api.id);

        if (updateError) throw updateError;
        apiId = api.id;
      } else {
        const { data: newAPI, error: insertError } = await supabase
          .from('apis')
          .insert(apiData)
          .select()
          .single();

        if (insertError) throw insertError;
        apiId = newAPI.id;
      }

      const { data: existingSecurity } = await supabase
        .from('api_security')
        .select('id')
        .eq('api_id', apiId)
        .maybeSingle();

      let finalAuthConfig = authConfig;
      if (authType === 'custom') {
        const headersObject = customHeaders
          .filter(h => h.key.trim() !== '')
          .reduce((acc, h) => ({ ...acc, [h.key]: h.value }), {});
        finalAuthConfig = { headers: headersObject };
      }

      const securityData = {
        api_id: apiId,
        auth_type: authType,
        auth_config: finalAuthConfig
      };

      if (existingSecurity) {
        const { error: secError } = await supabase
          .from('api_security')
          .update(securityData)
          .eq('id', existingSecurity.id);

        if (secError) throw secError;
      } else {
        const { error: secError } = await supabase
          .from('api_security')
          .insert(securityData);

        if (secError) throw secError;
      }

      if (api) {
        await supabase
          .from('api_endpoints')
          .delete()
          .eq('api_id', apiId);
      }

      if (endpoints.length > 0) {
        const endpointsData = endpoints.map(ep => ({
          api_id: apiId,
          path: ep.path,
          method: ep.method,
          description: ep.description,
          is_active: ep.is_active
        }));

        const { error: endpointsError } = await supabase
          .from('api_endpoints')
          .insert(endpointsData);

        if (endpointsError) throw endpointsError;
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error');
    } finally {
      setLoading(false);
    }
  };

  const renderAuthFields = () => {
    switch (authType) {
      case 'api_key':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre del Header
              </label>
              <input
                type="text"
                value={authConfig.headerName || ''}
                onChange={(e) => handleAuthConfigChange('headerName', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="X-API-Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                API Key
              </label>
              <input
                type="password"
                value={authConfig.apiKey || ''}
                onChange={(e) => handleAuthConfigChange('apiKey', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="tu-api-key"
              />
            </div>
          </>
        );
      case 'bearer_token':
        return (
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Bearer Token
            </label>
            <input
              type="password"
              value={authConfig.token || ''}
              onChange={(e) => handleAuthConfigChange('token', e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="tu-bearer-token"
            />
          </div>
        );
      case 'basic_auth':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Usuario
              </label>
              <input
                type="text"
                value={authConfig.username || ''}
                onChange={(e) => handleAuthConfigChange('username', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="usuario"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={authConfig.password || ''}
                onChange={(e) => handleAuthConfigChange('password', e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="contraseña"
              />
            </div>
          </>
        );
      case 'custom':
        return (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Agrega los headers personalizados que se enviarán con cada solicitud a esta API
            </p>
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
                  placeholder="Nombre del Header (ej: Accept, User-Agent)"
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
                  placeholder="Valor del Header"
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
            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
              <p className="text-xs text-blue-300">
                <strong>Ejemplos:</strong> Accept: application/json, User-Agent: MiApp/1.0, X-Custom-Header: valor
              </p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">
            {api ? 'Editar API' : 'Nueva API'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Nombre de la API
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Mi API"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Aplicación Dueña
              </label>
              <input
                type="text"
                value={applicationOwner}
                onChange={(e) => setApplicationOwner(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Nombre de la aplicación"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Descripción de la API"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Tipo de API
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('external')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'external'
                    ? 'border-blue-600 bg-blue-600/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <p className="font-medium text-white">API Externa</p>
                <p className="text-xs text-slate-400 mt-1">API de terceros a integrar</p>
              </button>
              <button
                type="button"
                onClick={() => setType('published')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  type === 'published'
                    ? 'border-green-600 bg-green-600/10'
                    : 'border-slate-600 hover:border-slate-500'
                }`}
              >
                <p className="font-medium text-white">API Publicada</p>
                <p className="text-xs text-slate-400 mt-1">Tu API para que otros usen</p>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              URL Base
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://api.ejemplo.com"
              required
            />
          </div>

          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-white">Configuración de Seguridad</h3>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Tipo de Autenticación
                </label>
                <select
                  value={authType}
                  onChange={(e) => setAuthType(e.target.value as AuthType)}
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="none">Ninguna</option>
                  <option value="api_key">API Key</option>
                  <option value="bearer_token">Bearer Token</option>
                  <option value="basic_auth">Basic Auth</option>
                  <option value="custom">Headers Personalizados</option>
                </select>
              </div>

              {renderAuthFields()}
            </div>
          </div>

          <div className="border-t border-slate-700 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Endpoints</h3>
              <button
                type="button"
                onClick={addEndpoint}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Agregar Endpoint
              </button>
            </div>

            {endpoints.length === 0 ? (
              <div className="bg-slate-900 rounded-lg p-6 text-center">
                <p className="text-slate-400 text-sm">No hay endpoints configurados</p>
                <p className="text-slate-500 text-xs mt-1">Agrega endpoints para definir las rutas de esta API</p>
              </div>
            ) : (
              <div className="space-y-3">
                {endpoints.map((endpoint, index) => (
                  <div key={index} className="bg-slate-900 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                      <div className="md:col-span-5">
                        <input
                          type="text"
                          value={endpoint.path}
                          onChange={(e) => updateEndpoint(index, 'path', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="/api/endpoint"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <select
                          value={endpoint.method}
                          onChange={(e) => updateEndpoint(index, 'method', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="GET">GET</option>
                          <option value="POST">POST</option>
                          <option value="PUT">PUT</option>
                          <option value="PATCH">PATCH</option>
                          <option value="DELETE">DELETE</option>
                        </select>
                      </div>
                      <div className="md:col-span-4">
                        <input
                          type="text"
                          value={endpoint.description}
                          onChange={(e) => updateEndpoint(index, 'description', e.target.value)}
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Descripción"
                        />
                      </div>
                      <div className="md:col-span-1">
                        <button
                          type="button"
                          onClick={() => removeEndpoint(index)}
                          className="w-full h-full flex items-center justify-center text-red-400 hover:bg-red-600/20 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2.5 rounded-lg transition-colors"
            >
              {loading ? 'Guardando...' : api ? 'Actualizar API' : 'Crear API'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
