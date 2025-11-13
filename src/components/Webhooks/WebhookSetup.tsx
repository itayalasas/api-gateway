import { useState, useEffect, useMemo } from 'react';
import { Webhook, Database, Copy, CheckCircle, AlertCircle, ExternalLink, Info, RefreshCw, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database as DB } from '../../lib/database.types';
import { LogStream } from './LogStream';
import { LogFiltersComponent, LogFilters } from './LogFilters';

type Integration = DB['public']['Tables']['integrations']['Row'];
type API = DB['public']['Tables']['apis']['Row'];
type RequestLog = DB['public']['Tables']['request_logs']['Row'];

export function WebhookSetup() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [regeneratingKey, setRegeneratingKey] = useState(false);
  const [logs, setLogs] = useState<RequestLog[]>([]);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState('{\n  "test": true,\n  "message": "Hello from webhook test"\n}');
  const [filters, setFilters] = useState<LogFilters>({
    search: '',
    status: '',
    method: '',
    dateFrom: '',
    dateTo: ''
  });
  const [sending, setSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedIntegration && supabaseUrl) {
      const url = `${supabaseUrl}/functions/v1/api-gateway/${selectedIntegration}`;
      setWebhookUrl(url);
      loadLogs();
      subscribeToLogs();
    }
  }, [selectedIntegration, supabaseUrl]);

  const loadData = async () => {
    const { data: integrationsData } = await supabase
      .from('integrations')
      .select('*')
      .order('created_at', { ascending: false });

    const { data: apisData } = await supabase
      .from('apis')
      .select('*');

    if (integrationsData) setIntegrations(integrationsData);
    if (apisData) setApis(apisData);
  };

  const loadLogs = async () => {
    if (!selectedIntegration) return;

    const { data } = await supabase
      .from('request_logs')
      .select('*')
      .eq('integration_id', selectedIntegration)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) setLogs(data);
  };

  const subscribeToLogs = () => {
    if (!selectedIntegration) return;

    const channel = supabase
      .channel(`webhook_logs_${selectedIntegration}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'request_logs',
          filter: `integration_id=eq.${selectedIntegration}`
        },
        () => {
          loadLogs();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const copyUrlToClipboard = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const copyKeyToClipboard = () => {
    if (selectedInt?.api_key) {
      navigator.clipboard.writeText(selectedInt.api_key);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  const regenerateApiKey = async () => {
    if (!selectedInt?.id) return;

    setRegeneratingKey(true);
    try {
      const newKey = 'int_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const { error } = await supabase
        .from('integrations')
        .update({ api_key: newKey })
        .eq('id', selectedInt.id);

      if (!error) {
        await loadData();
      }
    } catch (error) {
      console.error('Error regenerating API key:', error);
    } finally {
      setRegeneratingKey(false);
    }
  };

  const sendTestRequest = async () => {
    if (!selectedInt?.api_key || !webhookUrl) return;

    setSending(true);
    setTestResult(null);

    try {
      let payload;
      try {
        payload = JSON.parse(testPayload);
      } catch (e) {
        setTestResult({ success: false, message: 'JSON inválido en el payload' });
        setSending(false);
        return;
      }

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Integration-Key': selectedInt.api_key
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: `✓ Webhook ejecutado exitosamente (${response.status})`
        });
      } else {
        setTestResult({
          success: false,
          message: `✗ Error ${response.status}: ${result.message || 'Unknown error'}`
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setSending(false);
      loadLogs();
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const pathMatch = log.path?.toLowerCase().includes(searchLower);
        const requestMatch = JSON.stringify(log.request_body).toLowerCase().includes(searchLower);
        const responseMatch = JSON.stringify(log.response_body).toLowerCase().includes(searchLower);
        if (!pathMatch && !requestMatch && !responseMatch) return false;
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

  const selectedInt = integrations.find(i => i.id === selectedIntegration);
  const sourceApi = apis.find(a => a.id === selectedInt?.source_api_id);
  const targetApi = apis.find(a => a.id === selectedInt?.target_api_id);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-4">
          <Webhook className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Configuración de Webhooks</h2>
            <p className="text-blue-100">Configura y monitorea tus webhooks en tiempo real</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-100">
            <p className="font-semibold mb-1">Limitación Importante</p>
            <p className="text-yellow-200">
              Las consultas a base de datos SOLO funcionan con <strong>tu base de datos de Supabase</strong>.
              No puedes conectarte a bases de datos externas directamente.
            </p>
            <p className="text-yellow-200 mt-2">
              Si necesitas datos de otra BD, debes crear un API que los exponga primero.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          Paso 1: Selecciona una Integración
        </h3>

        <select
          value={selectedIntegration}
          onChange={(e) => setSelectedIntegration(e.target.value)}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
        >
          <option value="">-- Selecciona una integración --</option>
          {integrations.map((integration) => {
            const source = apis.find(a => a.id === integration.source_api_id);
            const target = apis.find(a => a.id === integration.target_api_id);
            return (
              <option key={integration.id} value={integration.id}>
                {integration.name} ({source?.name} → {target?.name})
              </option>
            );
          })}
        </select>

        {integrations.length === 0 && (
          <p className="text-slate-400 text-sm mt-2">
            No tienes integraciones creadas. Ve a la sección "Integraciones" para crear una.
          </p>
        )}
      </div>

      {selectedIntegration && selectedInt && (
        <>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <ExternalLink className="w-5 h-5" />
              Paso 2: URL del Webhook
            </h3>

            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <p className="text-xs text-slate-400 mb-2">Usa esta URL en {sourceApi?.name || 'el sistema externo'}:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-950 px-4 py-3 rounded text-blue-400 text-sm font-mono break-all">
                  {webhookUrl}
                </code>
                <button
                  onClick={copyUrlToClipboard}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors flex-shrink-0"
                >
                  {copiedUrl ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
              <p className="text-sm text-blue-100 font-semibold mb-2">API Key de Autenticación:</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-slate-950 px-3 py-2 rounded text-green-400 text-xs font-mono break-all">
                  {selectedInt.api_key || 'No generada'}
                </code>
                <button
                  onClick={copyKeyToClipboard}
                  disabled={!selectedInt?.api_key}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-1 flex-shrink-0"
                  title="Copiar API Key"
                >
                  {copiedKey ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs">✓</span>
                    </>
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={regenerateApiKey}
                  disabled={regeneratingKey}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-1 flex-shrink-0"
                  title="Regenerar API Key"
                >
                  <RefreshCw className={`w-4 h-4 ${regeneratingKey ? 'animate-spin' : ''}`} />
                  {regeneratingKey ? 'Generando...' : 'Regenerar'}
                </button>
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Incluye este header en tus requests: <code className="text-blue-400">X-Integration-Key: {selectedInt.api_key || '[TU-API-KEY]'}</code>
              </p>
              {!selectedInt.api_key && (
                <div className="mt-2 bg-yellow-600/20 border border-yellow-600/40 rounded px-3 py-2">
                  <p className="text-xs text-yellow-200">
                    ⚠️ Esta integración no tiene API Key. Haz clic en "Regenerar" para crear una.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Send className="w-5 h-5" />
              Paso 3: Probar Webhook
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Payload de Prueba (JSON):
                </label>
                <textarea
                  value={testPayload}
                  onChange={(e) => setTestPayload(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-blue-500 min-h-[120px]"
                  placeholder='{\n  "test": true\n}'
                />
              </div>

              <button
                onClick={sendTestRequest}
                disabled={sending || !selectedInt.api_key}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
              >
                {sending ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Petición de Prueba
                  </>
                )}
              </button>

              {testResult && (
                <div className={`rounded-lg p-4 ${testResult.success ? 'bg-green-600/10 border border-green-600/30' : 'bg-red-600/10 border border-red-600/30'}`}>
                  <p className={`text-sm font-semibold ${testResult.success ? 'text-green-400' : 'text-red-400'}`}>
                    {testResult.message}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Logs en Tiempo Real</h3>
            <LogFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
              totalLogs={logs.length}
              filteredLogs={filteredLogs.length}
            />
            <div className="mt-4">
              <LogStream
                logs={filteredLogs}
                onLogClick={(logId) => setExpandedLog(expandedLog === logId ? null : logId)}
                expandedLog={expandedLog}
              />
            </div>
          </div>

          {selectedInt.integration_type === 'webhook' && selectedInt.allow_database_access && (
            <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Consultas a Base de Datos
                </h3>
                <button
                  onClick={() => setShowConfig(!showConfig)}
                  className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
                >
                  {showConfig ? 'Ocultar' : 'Mostrar'} Configuración
                </button>
              </div>

              {showConfig && (
                <div className="bg-slate-900 rounded-lg p-4">
                  <p className="text-xs text-slate-400 mb-2">Configuración actual:</p>
                  <pre className="text-xs text-slate-300 font-mono overflow-x-auto bg-slate-950 p-3 rounded">
                    {JSON.stringify(selectedInt.webhook_config, null, 2)}
                  </pre>

                  <div className="mt-4 bg-blue-600/10 border border-blue-600/30 rounded p-3">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div className="text-xs text-blue-100">
                        <p className="font-semibold mb-1">Recuerda:</p>
                        <ul className="list-disc list-inside space-y-1 text-blue-200">
                          <li>Solo consulta tablas de TU base de datos Supabase</li>
                          <li>Las tablas deben tener RLS configurado correctamente</li>
                          <li>Usa filtros dinámicos con: <code className="text-blue-400">${'{'}incoming.field{'}'}</code></li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {!selectedIntegration && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <Webhook className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Selecciona una Integración</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Elige una integración de la lista arriba para configurar su webhook,
            enviar peticiones de prueba y ver los logs en tiempo real.
          </p>
        </div>
      )}
    </div>
  );
}
