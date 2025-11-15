import { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle, AlertCircle, Info, Folder } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProject } from '../../contexts/ProjectContext';

export function SystemSettings() {
  const { selectedProject } = useProject();
  const [gatewayDomain, setGatewayDomain] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_config')
        .select('config_value')
        .eq('config_key', 'gateway_domain')
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setGatewayDomain(data.config_value);
      }
    } catch (error) {
      console.error('Error loading config:', error);
      setMessage({ type: 'error', text: 'Error al cargar la configuración' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('system_config')
        .update({ config_value: gatewayDomain })
        .eq('config_key', 'gateway_domain');

      if (error) throw error;

      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Error saving config:', error);
      setMessage({ type: 'error', text: 'Error al guardar la configuración' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl p-6 text-white">
        <div className="flex items-center gap-3">
          <Settings className="w-8 h-8" />
          <div>
            <h2 className="text-2xl font-bold">Configuración del Sistema</h2>
            <p className="text-slate-300">Ajusta la configuración global de FlowBridge</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Configuración del Gateway</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Dominio del Gateway
            </label>
            <input
              type="text"
              value={gatewayDomain}
              onChange={(e) => setGatewayDomain(e.target.value)}
              placeholder="api.flowbridge.site"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-400 mt-2">
              Este dominio se usará para generar las URLs de los webhooks en lugar del dominio de Supabase Functions
            </p>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-100">
                <p className="font-semibold mb-2">Configuración de Dominio Personalizado</p>
                <ul className="list-disc list-inside space-y-1 text-blue-200">
                  <li>El dominio debe apuntar a tu edge function de Supabase</li>
                  <li>Configura un CNAME en tu DNS apuntando a Supabase</li>
                  <li>Ejemplo: <code className="text-blue-400">api.flowbridge.site</code> (sin https://)</li>
                  <li>Los webhooks usarán: <code className="text-blue-400">https://{'{'}dominio{'}'}/functions/v1/api-gateway/{'{'}integration-id{'}'}</code></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={saveConfig}
              disabled={saving || !gatewayDomain}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Guardar Configuración
                </>
              )}
            </button>

            {message && (
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                message.type === 'success'
                  ? 'bg-green-600/20 border border-green-600/40 text-green-400'
                  : 'bg-red-600/20 border border-red-600/40 text-red-400'
              }`}>
                {message.type === 'success' ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="text-sm font-medium">{message.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProject && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: selectedProject.color }}>
              <Folder className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Configuración del Proyecto</h3>
              <p className="text-sm text-slate-400">{selectedProject.name}</p>
            </div>
          </div>

          {selectedProject.gateway_domain ? (
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-sm font-medium text-white">Dominio Personalizado Configurado</p>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Este proyecto usa su propio dominio de gateway:
              </p>
              <code className="block bg-slate-950 px-4 py-3 rounded text-green-400 text-sm font-mono break-all">
                {selectedProject.gateway_domain}
              </code>
              <p className="text-xs text-slate-500 mt-3">
                Las URLs de las integraciones de este proyecto usarán este dominio en lugar del dominio del sistema.
              </p>
            </div>
          ) : (
            <div className="bg-slate-900 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-400" />
                <p className="text-sm font-medium text-white">Usando Dominio del Sistema</p>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Este proyecto usa el dominio del sistema. Para configurar un dominio personalizado, edita el proyecto.
              </p>
              <code className="block bg-slate-950 px-4 py-3 rounded text-blue-400 text-sm font-mono break-all">
                {gatewayDomain || 'Dominio del sistema no configurado'}
              </code>
            </div>
          )}
        </div>
      )}

      <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Vista Previa</h3>
        <div className="bg-slate-900 rounded-lg p-4">
          <p className="text-xs text-slate-400 mb-2">Ejemplo de URL generada (dominio del sistema):</p>
          <code className="block bg-slate-950 px-4 py-3 rounded text-blue-400 text-sm font-mono break-all">
            https://{gatewayDomain || 'tu-dominio.com'}/functions/v1/api-gateway/{'<integration-id>'}
          </code>
        </div>
      </div>
    </div>
  );
}
