import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Play, Clock, CheckCircle, XCircle, RefreshCw, Copy, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { LogStream } from '../Webhooks/LogStream';
import { LogFiltersComponent, LogFilters } from '../Webhooks/LogFilters';

type Integration = Database['public']['Tables']['integrations']['Row'];
type API = Database['public']['Tables']['apis']['Row'];
type APIEndpoint = Database['public']['Tables']['api_endpoints']['Row'];
type RequestLog = Database['public']['Tables']['request_logs']['Row'];

interface IntegrationWithAPIs extends Integration {
  source_api: API;
  target_api: API;
  source_endpoint?: APIEndpoint;
  target_endpoint?: APIEndpoint;
}

interface IntegrationFlowProps {
  integration: IntegrationWithAPIs;
  onBack: () => void;
}

export function IntegrationFlow({ integration, onBack }: IntegrationFlowProps) {
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showGatewayConfig, setShowGatewayConfig] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    status: '',
    method: '',
    dateFrom: '',
    dateTo: ''
  });
  const [stats, setStats] = useState({
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0
  });

  const gatewayUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api-gateway/${integration.id}`;

  useEffect(() => {
    loadLogs();

    const channel = supabase
      .channel(`integration_logs_${integration.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_logs',
          filter: `integration_id=eq.${integration.id}`
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [integration.id]);

  const loadLogs = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('request_logs')
      .select('*')
      .eq('integration_id', integration.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data);
      calculateStats(data);
    }

    setLoading(false);
  };

  const calculateStats = (logs: RequestLog[]) => {
    if (logs.length === 0) {
      setStats({ totalRequests: 0, successRate: 0, avgResponseTime: 0 });
      return;
    }

    const successfulRequests = logs.filter(
      log => log.response_status && log.response_status >= 200 && log.response_status < 400
    ).length;

    const avgTime = logs
      .filter(log => log.response_time_ms !== null)
      .reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logs.length;

    setStats({
      totalRequests: logs.length,
      successRate: Math.round((successfulRequests / logs.length) * 100),
      avgResponseTime: Math.round(avgTime)
    });
  };

  const regenerateApiKey = async () => {
    setRegeneratingKey(true);
    try {
      const newKey = 'int_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('integrations')
        .update({ api_key: newKey })
        .eq('id', integration.id);

      if (!error) {
        window.location.reload();
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
    } finally {
      setRegeneratingKey(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const pathMatch = log.path?.toLowerCase().includes(searchLower);
        const requestIdMatch = log.request_id?.toLowerCase().includes(searchLower);
        const requestMatch = log.body ? JSON.stringify(log.body).toLowerCase().includes(searchLower) : false;
        const responseMatch = log.response_body ? JSON.stringify(log.response_body).toLowerCase().includes(searchLower) : false;
        if (!pathMatch && !requestIdMatch && !requestMatch && !responseMatch) return false;
      }

      if (filters.status) {
        if (filters.status === '2xx') {
          if (!log.response_status || log.response_status < 200 || log.response_status >= 300) return false;
        } else if (filters.status === '4xx') {
          if (!log.response_status || log.response_status < 400 || log.response_status >= 500) return false;
        } else if (filters.status === '5xx') {
          if (!log.response_status || log.response_status < 500) return false;
        } else {
          if (log.response_status?.toString() !== filters.status) return false;
        }
      }

      if (filters.method && log.method !== filters.method) return false;

      if (filters.dateFrom) {
        const logDate = new Date(log.created_at);
        const fromDate = new Date(filters.dateFrom);
        if (logDate < fromDate) return false;
      }

      if (filters.dateTo) {
        const logDate = new Date(log.created_at);
        const toDate = new Date(filters.dateTo);
        if (logDate > toDate) return false;
      }

      return true;
    });
  }, [logs, filters]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onBack}
          className="text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white">{integration.name}</h2>
          <p className="text-slate-400 mt-1">Visualización y logs en tiempo real</p>
        </div>
        <button
          onClick={loadLogs}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Actualizar
        </button>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex-1">
            <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Play className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-green-100 mb-1">API Origen</p>
                  <h3 className="text-lg font-bold text-white">{integration.source_api.name}</h3>
                  <p className="text-xs text-green-200">{integration.source_api.application_owner}</p>
                </div>
              </div>
              {integration.source_endpoint && (
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-green-800/50 text-green-100 px-2 py-0.5 rounded">
                      {integration.source_endpoint.method}
                    </span>
                    <p className="text-xs text-green-100">Endpoint</p>
                  </div>
                  <p className="text-sm font-mono text-white">
                    {integration.source_endpoint.path}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center px-8">
            <div className="flex items-center gap-2">
              <div className="w-16 h-0.5 bg-blue-500" />
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-600/30">
                <Play className="w-6 h-6 text-white" />
              </div>
              <div className="w-16 h-0.5 bg-blue-500" />
            </div>
            <div className="mt-2 bg-slate-900 rounded-lg px-3 py-1">
              <p className="text-xs text-slate-400">Integración Activa</p>
            </div>
          </div>

          <div className="flex-1">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-xs text-blue-100 mb-1">API Destino</p>
                  <h3 className="text-lg font-bold text-white">{integration.target_api.name}</h3>
                  <p className="text-xs text-blue-200">{integration.target_api.application_owner}</p>
                </div>
              </div>
              {integration.target_endpoint && (
                <div className="bg-white/10 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-blue-800/50 text-blue-100 px-2 py-0.5 rounded">
                      {integration.target_endpoint.method}
                    </span>
                    <p className="text-xs text-blue-100">Endpoint</p>
                  </div>
                  <p className="text-sm font-mono text-white">
                    {integration.target_endpoint.path}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 grid grid-cols-3 gap-4 max-w-5xl mx-auto">
          <div className="bg-slate-900 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-green-600/20 rounded-lg mx-auto mb-2">
              <Clock className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Tiempo Promedio</p>
            <p className="text-2xl font-bold text-white">{stats.avgResponseTime}ms</p>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600/20 rounded-lg mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Tasa de Éxito</p>
            <p className="text-2xl font-bold text-white">{stats.successRate}%</p>
          </div>

          <div className="bg-slate-900 rounded-xl p-4 text-center">
            <div className="flex items-center justify-center w-10 h-10 bg-purple-600/20 rounded-lg mx-auto mb-2">
              <Play className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-xs text-slate-500 mb-1">Total Solicitudes</p>
            <p className="text-2xl font-bold text-white">{stats.totalRequests}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <div
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setShowGatewayConfig(!showGatewayConfig)}
        >
          <div>
            <h3 className="text-lg font-semibold text-white">Configuración del Gateway</h3>
            <p className="text-sm text-slate-400 mt-1">URL para configurar en tu sistema origen</p>
          </div>
          <button className="text-slate-400 hover:text-white transition-colors">
            {showGatewayConfig ? (
              <ChevronDown className="w-6 h-6" />
            ) : (
              <ChevronRight className="w-6 h-6" />
            )}
          </button>
        </div>

        {showGatewayConfig && (
          <div className="bg-slate-900 rounded-lg p-4 space-y-4 mt-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">URL del Gateway</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-white overflow-x-auto">
                {gatewayUrl}
              </div>
              <button
                onClick={() => copyToClipboard(gatewayUrl)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-2">API Key de la Integración</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 font-mono text-sm text-white overflow-x-auto break-all">
                {integration.api_key || 'No generada'}
              </div>
              <button
                onClick={() => {
                  if (integration.api_key) {
                    navigator.clipboard.writeText(integration.api_key);
                    setCopiedKey(true);
                    setTimeout(() => setCopiedKey(false), 2000);
                  }
                }}
                className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors flex-shrink-0"
                disabled={!integration.api_key}
                title="Copiar API Key"
              >
                {copiedKey ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedKey ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={regenerateApiKey}
                disabled={regeneratingKey}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors flex-shrink-0"
                title="Regenerar API Key"
              >
                <RefreshCw className={`w-4 h-4 ${regeneratingKey ? 'animate-spin' : ''}`} />
                {regeneratingKey ? 'Generando...' : 'Regenerar'}
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Usa este API key para autenticar tus requests al gateway (Header: X-Integration-Key)
            </p>
            {!integration.api_key && (
              <div className="mt-2 bg-yellow-600/20 border border-yellow-600/40 rounded px-3 py-2">
                <p className="text-xs text-yellow-200">
                  ⚠️ Esta integración no tiene API Key. Haz clic en "Regenerar" para crear una.
                </p>
              </div>
            )}
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
              <ExternalLink className="w-4 h-4" />
              Cómo usar este Gateway
            </h4>
            <div className="space-y-3 text-sm text-slate-300">
              <div>
                <p className="font-medium text-white mb-1">1. En tu Sistema Origen ({integration.source_api.application_owner}):</p>
                <p className="text-slate-400 ml-4">Configura esta URL como el endpoint de destino cuando quieras llamar al endpoint:</p>
                <div className="ml-4 mt-2 bg-slate-800 rounded px-3 py-2 font-mono text-xs text-blue-300">
                  {integration.source_endpoint?.method} {integration.source_endpoint?.path}
                </div>
              </div>

              <div>
                <p className="font-medium text-white mb-1">2. El Gateway automáticamente:</p>
                <ul className="ml-4 space-y-1 text-slate-400">
                  <li>• Recibe la petición de tu sistema origen</li>
                  <li>• Aplica la autenticación configurada</li>
                  <li>• Reenvía al sistema destino: {integration.target_api.name}</li>
                  <li>• Registra todo en los logs en tiempo real</li>
                  <li>• Devuelve la respuesta a tu sistema origen</li>
                </ul>
              </div>

              <div>
                <p className="font-medium text-white mb-1">3. Autenticación (Elige una opción):</p>
                <div className="ml-4 space-y-2">
                  <div className="bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Opción A: Usando API Key de Integración (Recomendado)</p>
                    <div className="font-mono text-xs text-slate-300">
                      <span className="text-purple-400">headers</span>: {'{'}<br/>
                      <span className="ml-4"><span className="text-green-300">'X-Integration-Key'</span>: <span className="text-green-300">'{integration.api_key?.slice(0, 20)}...'</span></span><br/>
                      {'}'}
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded p-3">
                    <p className="text-xs text-slate-400 mb-1">Opción B: Usando Supabase Anon Key</p>
                    <div className="font-mono text-xs text-slate-300">
                      <span className="text-purple-400">headers</span>: {'{'}<br/>
                      <span className="ml-4"><span className="text-green-300">'Authorization'</span>: <span className="text-green-300">'Bearer [SUPABASE_ANON_KEY]'</span></span><br/>
                      {'}'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <p className="font-medium text-white mb-1">4. Ejemplo completo:</p>
                <div className="ml-4 bg-slate-800 rounded p-3 font-mono text-xs space-y-2">
                  <div className="text-green-400">// JavaScript/TypeScript</div>
                  <div className="text-slate-300">
                    <span className="text-purple-400">const</span> response = <span className="text-purple-400">await</span> <span className="text-yellow-400">fetch</span>(<span className="text-green-300">'{gatewayUrl}'</span>, {'{'}<br/>
                    <span className="ml-4">method: <span className="text-green-300">'{integration.source_endpoint?.method || 'POST'}'</span>,</span><br/>
                    <span className="ml-4">headers: {'{'}</span><br/>
                    <span className="ml-8"><span className="text-green-300">'Content-Type'</span>: <span className="text-green-300">'application/json'</span>,</span><br/>
                    <span className="ml-8"><span className="text-green-300">'X-Integration-Key'</span>: <span className="text-green-300">'{integration.api_key?.slice(0, 20)}...'</span></span><br/>
                    <span className="ml-4">{'}'},</span><br/>
                    <span className="ml-4">body: <span className="text-yellow-400">JSON</span>.<span className="text-yellow-400">stringify</span>(data)</span><br/>
                    {'}'});
                  </div>
                </div>
              </div>

              <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-3 mt-3">
                <p className="text-yellow-400 text-xs">
                  <strong>Nota:</strong> Esta URL es única para esta integración. Todo el tráfico será monitoreado y aparecerá en los logs en tiempo real más abajo.
                </p>
              </div>
            </div>
          </div>
        </div>
        )}
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="border-b border-slate-700 p-4">
          <h3 className="text-lg font-semibold text-white">Logs de Solicitudes en Tiempo Real</h3>
          <p className="text-sm text-slate-400 mt-1">Monitoreo de requests y responses</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-4">
            <LogFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              totalLogs={logs.length}
              filteredLogs={filteredLogs.length}
            />
            <LogStream
              logs={filteredLogs}
              onLogClick={(logId) => setExpandedLog(expandedLog === logId ? null : logId)}
              expandedLog={expandedLog}
            />
          </div>
        )}
      </div>
    </div>
  );
}
