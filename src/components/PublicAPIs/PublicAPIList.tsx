import { Globe, Copy, CheckCircle, Trash2, Power, PowerOff, ExternalLink, Activity, ChevronDown, ChevronUp, Edit, Terminal } from 'lucide-react';
import { Database as DB } from '../../lib/database.types';
import { useState, useEffect } from 'react';
import { useGatewayUrl } from '../../hooks/useGatewayUrl';
import { supabase } from '../../lib/supabase';
import { LogStream } from '../Webhooks/LogStream';

type Integration = DB['public']['Tables']['integrations']['Row'];
type API = DB['public']['Tables']['apis']['Row'];

interface PublicAPIListProps {
  publicAPIs: Integration[];
  apis: API[];
  onDelete: (id: string, name: string) => void;
  onToggleActive: (id: string, currentStatus: boolean) => void;
  onEdit?: (publicAPI: Integration) => void;
  onViewLogs?: (integrationId: string) => void;
}

type RequestLog = DB['public']['Tables']['request_logs']['Row'];

export function PublicAPIList({ publicAPIs, apis, onDelete, onToggleActive, onEdit, onViewLogs }: PublicAPIListProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<'url' | 'key' | 'curl' | null>(null);
  const [expandedAPIs, setExpandedAPIs] = useState<Set<string>>(new Set());
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);
  const [logs, setLogs] = useState<Record<string, RequestLog[]>>({});
  const [loadingLogs, setLoadingLogs] = useState<string | null>(null);
  const [expandedLogDetail, setExpandedLogDetail] = useState<string | null>(null);
  const { getGatewayUrl } = useGatewayUrl();

  const copyToClipboard = (text: string, id: string, type: 'url' | 'key' | 'curl') => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setCopiedType(type);
    setTimeout(() => {
      setCopiedId(null);
      setCopiedType(null);
    }, 2000);
  };

  const generateCurl = (publicAPI: Integration) => {
    const url = getGatewayUrl(publicAPI.id);
    const targetAPI = getTargetAPI(publicAPI.target_api_id);

    let curl = `curl -X GET "${url}"`;

    if (publicAPI.api_key) {
      curl += ` \\\n  -H "X-Integration-Key: ${publicAPI.api_key}"`;
    }

    curl += ` \\\n  -H "Content-Type: application/json"`;

    return curl;
  };

  const getTargetAPI = (targetId: string | null) => {
    return apis.find(api => api.id === targetId);
  };

  const toggleExpand = (apiId: string) => {
    const newExpanded = new Set(expandedAPIs);
    if (newExpanded.has(apiId)) {
      newExpanded.delete(apiId);
    } else {
      newExpanded.add(apiId);
    }
    setExpandedAPIs(newExpanded);
  };

  const toggleLogs = async (integrationId: string) => {
    if (expandedLogs === integrationId) {
      setExpandedLogs(null);
      return;
    }

    setExpandedLogs(integrationId);

    if (!logs[integrationId]) {
      setLoadingLogs(integrationId);
      await loadLogsForIntegration(integrationId);
      setLoadingLogs(null);
    }
  };

  const loadLogsForIntegration = async (integrationId: string) => {
    try {
      const { data, error } = await supabase
        .from('request_logs')
        .select('*')
        .eq('integration_id', integrationId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setLogs(prev => ({
        ...prev,
        [integrationId]: data || []
      }));
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  useEffect(() => {
    if (expandedLogs) {
      const subscription = supabase
        .channel(`logs-${expandedLogs}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'request_logs',
            filter: `integration_id=eq.${expandedLogs}`
          },
          (payload) => {
            setLogs(prev => ({
              ...prev,
              [expandedLogs]: [payload.new as RequestLog, ...(prev[expandedLogs] || [])].slice(0, 20)
            }));
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [expandedLogs]);

  return (
    <div className="space-y-3">
      {publicAPIs.map((publicAPI) => {
        const targetAPI = getTargetAPI(publicAPI.target_api_id);
        const publicUrl = getGatewayUrl(publicAPI.id);
        const isExpanded = expandedAPIs.has(publicAPI.id);

        return (
          <div
            key={publicAPI.id}
            className={`bg-slate-800 rounded-xl border transition-all ${
              publicAPI.is_active
                ? 'border-green-600/30 bg-slate-800/80'
                : 'border-slate-700 opacity-60'
            }`}
          >
            {/* Header - Always Visible */}
            <div className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={() => toggleExpand(publicAPI.id)}
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-300" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-300" />
                    )}
                  </button>

                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    publicAPI.is_active ? 'bg-green-600/20' : 'bg-slate-700/50'
                  }`}>
                    <Globe className={`w-5 h-5 ${
                      publicAPI.is_active ? 'text-green-400' : 'text-slate-500'
                    }`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-semibold text-white truncate">{publicAPI.name}</h3>
                    <div className="flex items-center gap-2 flex-wrap mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                        publicAPI.is_active
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}>
                        {publicAPI.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-600/20 text-blue-400 font-medium">
                        Proxy Público
                      </span>
                      {publicAPI.cache_enabled && (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-600/20 text-purple-400 font-medium">
                          Cache: {publicAPI.cache_ttl_hours}h
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleLogs(publicAPI.id)}
                    className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 p-2 rounded-lg transition-colors"
                    title="Ver Logs"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                  {onEdit && (
                    <button
                      onClick={() => onEdit(publicAPI)}
                      className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 p-2 rounded-lg transition-colors"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => onToggleActive(publicAPI.id, publicAPI.is_active)}
                    className={`p-2 rounded-lg transition-colors ${
                      publicAPI.is_active
                        ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400'
                        : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                    }`}
                    title={publicAPI.is_active ? 'Desactivar' : 'Activar'}
                  >
                    {publicAPI.is_active ? (
                      <PowerOff className="w-4 h-4" />
                    ) : (
                      <Power className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() => onDelete(publicAPI.id, publicAPI.name)}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 p-2 rounded-lg transition-colors"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && (
              <div className="px-4 pb-4 space-y-3 border-t border-slate-700 pt-4">
                {publicAPI.description && (
                  <p className="text-sm text-slate-400">{publicAPI.description}</p>
                )}

                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                    <p className="text-xs font-semibold text-slate-400">API Interna (Destino)</p>
                  </div>
                  {targetAPI ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm text-white font-medium">{targetAPI.name}</p>
                      <code className="text-xs text-slate-400 font-mono bg-slate-950 px-2 py-1 rounded">
                        {targetAPI.base_url}
                      </code>
                    </div>
                  ) : (
                    <p className="text-sm text-red-400">API no encontrada</p>
                  )}
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-400 mb-2">URL Pública</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-950 px-3 py-2 rounded text-blue-400 text-xs font-mono break-all">
                      {publicUrl}
                    </code>
                    <button
                      onClick={() => copyToClipboard(publicUrl, publicAPI.id, 'url')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition-colors flex items-center gap-1 flex-shrink-0"
                      title="Copiar URL"
                    >
                      {copiedId === publicAPI.id && copiedType === 'url' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">✓</span>
                        </>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3">
                  <p className="text-xs font-semibold text-slate-400 mb-2">API Key</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-slate-950 px-3 py-2 rounded text-green-400 text-xs font-mono break-all">
                      {publicAPI.api_key || 'No generada'}
                    </code>
                    <button
                      onClick={() => publicAPI.api_key && copyToClipboard(publicAPI.api_key, publicAPI.id, 'key')}
                      disabled={!publicAPI.api_key}
                      className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded transition-colors flex items-center gap-1 flex-shrink-0"
                      title="Copiar API Key"
                    >
                      {copiedId === publicAPI.id && copiedType === 'key' ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs">✓</span>
                        </>
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">
                    Header requerido: <code className="text-blue-400">X-Integration-Key: {publicAPI.api_key || '[API-KEY]'}</code>
                  </p>
                </div>

                <div className="bg-slate-900/50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-semibold text-slate-400">cURL Command</p>
                    <button
                      onClick={() => copyToClipboard(generateCurl(publicAPI), publicAPI.id, 'curl')}
                      className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1.5 rounded transition-colors flex items-center gap-2 text-xs"
                      title="Copiar comando cURL"
                    >
                      {copiedId === publicAPI.id && copiedType === 'curl' ? (
                        <>
                          <CheckCircle className="w-3.5 h-3.5" />
                          Copiado
                        </>
                      ) : (
                        <>
                          <Terminal className="w-3.5 h-3.5" />
                          Copiar cURL
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="bg-slate-950 px-3 py-2 rounded text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-all">
                    {generateCurl(publicAPI)}
                  </pre>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs bg-slate-900/50 rounded-lg p-3">
                  <div>
                    <p className="text-slate-500 mb-1">Creada</p>
                    <p className="text-slate-300">
                      {new Date(publicAPI.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Última actualización</p>
                    <p className="text-slate-300">
                      {new Date(publicAPI.updated_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Logs Section */}
            {expandedLogs === publicAPI.id && (
              <div className="border-t border-slate-700 p-4 bg-slate-900/30">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    Request Logs
                  </h4>
                  <button
                    onClick={() => setExpandedLogs(null)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
                {loadingLogs === publicAPI.id ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : logs[publicAPI.id] && logs[publicAPI.id].length > 0 ? (
                  <LogStream
                    logs={logs[publicAPI.id]}
                    onLogClick={(logId) => setExpandedLogDetail(expandedLogDetail === logId ? null : logId)}
                    expandedLog={expandedLogDetail}
                  />
                ) : (
                  <div className="text-center py-8 text-slate-500">
                    <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No hay logs disponibles</p>
                    <p className="text-xs mt-1">Los requests a esta API aparecerán aquí</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
