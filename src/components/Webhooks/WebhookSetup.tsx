import { useState, useEffect } from 'react';
import { Webhook, Database, Copy, CheckCircle, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database as DB } from '../../lib/database.types';

type Integration = DB['public']['Tables']['integrations']['Row'];
type API = DB['public']['Tables']['apis']['Row'];

export function WebhookSetup() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [selectedIntegration, setSelectedIntegration] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedIntegration && supabaseUrl) {
      const url = `${supabaseUrl}/functions/v1/api-gateway/${selectedIntegration}`;
      setWebhookUrl(url);
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
            <p className="text-blue-100">Guía paso a paso para conectar sistemas externos</p>
          </div>
        </div>
      </div>

      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-yellow-100">
            <p className="font-semibold mb-1">⚠️ Limitación Importante</p>
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
                <code className="flex-1 bg-slate-950 px-3 py-2 rounded text-green-400 text-xs font-mono">
                  {selectedInt.api_key || 'No generada'}
                </code>
                <button
                  onClick={copyKeyToClipboard}
                  disabled={!selectedInt?.api_key}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-1"
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
              </div>
              <p className="text-xs text-slate-400 mt-2">
                Incluye este header en tus requests: <code className="text-blue-400">X-Integration-Key: {selectedInt.api_key}</code>
              </p>
            </div>
          </div>

          <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">
              Paso 3: Configurar en {sourceApi?.name || 'Sistema Externo'}
            </h3>

            <div className="space-y-4">
              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-white mb-2">Ejemplo: Configuración en Stripe</p>
                <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
                  <li>Ve a Stripe Dashboard → Developers → Webhooks</li>
                  <li>Click en "Add endpoint"</li>
                  <li>Pega la URL del webhook arriba</li>
                  <li>Agrega el header personalizado:
                    <div className="bg-slate-950 px-3 py-2 rounded mt-1 font-mono text-xs">
                      Header: X-Integration-Key<br />
                      Value: {selectedInt.api_key}
                    </div>
                  </li>
                  <li>Selecciona los eventos que quieres recibir</li>
                  <li>Click en "Add endpoint"</li>
                </ol>
              </div>

              <div className="bg-slate-900 rounded-lg p-4">
                <p className="text-sm font-semibold text-white mb-2">Ejemplo: Configuración Generic con cURL</p>
                <div className="bg-slate-950 px-3 py-2 rounded overflow-x-auto">
                  <pre className="text-xs text-slate-300 font-mono">
{`curl -X POST \\
  '${webhookUrl}' \\
  -H 'X-Integration-Key: ${selectedInt.api_key}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "event": "test",
    "data": {
      "user_id": "123",
      "amount": 100
    }
  }'`}
                  </pre>
                </div>
              </div>
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

          <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-semibold text-green-400 mb-2">¿Cómo Funciona?</h3>
                <ol className="text-sm text-green-100 space-y-2 list-decimal list-inside">
                  <li>
                    <strong>{sourceApi?.name || 'Sistema externo'}</strong> envía datos al webhook URL
                  </li>
                  <li>
                    El API Gateway valida el API Key
                  </li>
                  {selectedInt.allow_database_access && (
                    <li>
                      Si está configurado, consulta tu <strong>base de datos Supabase</strong>
                    </li>
                  )}
                  <li>
                    Transforma y mapea los datos según la configuración
                  </li>
                  <li>
                    Envía los datos a <strong>{targetApi?.name || 'sistema destino'}</strong>
                  </li>
                  <li>
                    Todo se registra en los logs para debugging
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedIntegration && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <Webhook className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Selecciona una Integración</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            Elige una integración de la lista arriba para ver su configuración de webhook
            y la URL que debes usar en sistemas externos.
          </p>
        </div>
      )}
    </div>
  );
}
