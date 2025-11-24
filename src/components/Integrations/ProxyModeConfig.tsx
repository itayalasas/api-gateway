import { ArrowRight, Database, RefreshCw } from 'lucide-react';

interface ProxyModeConfigProps {
  proxyMode: 'direct' | 'post_process' | 'fetch_and_forward';
  postProcessApiId: string;
  apis: Array<{ id: string; name: string }>;
  onChange: (mode: 'direct' | 'post_process' | 'fetch_and_forward', apiId: string) => void;
}

export function ProxyModeConfig({ proxyMode, postProcessApiId, apis, onChange }: ProxyModeConfigProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Modo de Operación</h3>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="proxy_mode"
              value="direct"
              checked={proxyMode === 'direct'}
              onChange={(e) => onChange(e.target.value as any, '')}
              className="text-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                Directo (Simple)
              </div>
              <p className="text-xs text-slate-400">
                Recibes datos del cliente → Los envías a la API destino → Devuelves la respuesta
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Cliente → Gateway → API Destino → Cliente
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="proxy_mode"
              value="post_process"
              checked={proxyMode === 'post_process'}
              onChange={(e) => onChange(e.target.value as any, postProcessApiId)}
              className="text-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                <Database className="w-4 h-4 text-green-400" />
                Con Procesamiento (Avanzado)
              </div>
              <p className="text-xs text-slate-400">
                Llamas a una API → Obtienes respuesta → La procesas con otra API → Devuelves el resultado final
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Cliente → Gateway → API 1 → Procesar → API 2 → Cliente
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="proxy_mode"
              value="fetch_and_forward"
              checked={proxyMode === 'fetch_and_forward'}
              onChange={(e) => onChange(e.target.value as any, '')}
              className="text-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                Obtener y Enviar (Modo Sincronización)
              </div>
              <p className="text-xs text-slate-400">
                El Gateway obtiene datos de una API origen → Los envía automáticamente a la API destino
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Cron/Cliente → Gateway → API Origen (GET) → API Destino (POST) → Cliente
              </div>
              <div className="mt-2 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1">
                <p className="text-xs text-purple-300">
                  <strong>Ideal para:</strong> Sincronizaciones automáticas, migración de datos, polling programado
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {proxyMode === 'post_process' && (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
          <label className="block text-sm font-medium text-white mb-2">
            API de Procesamiento
          </label>
          <select
            value={postProcessApiId}
            onChange={(e) => onChange(proxyMode, e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 text-sm"
          >
            <option value="">Selecciona la API que procesará la respuesta...</option>
            {apis.map(api => (
              <option key={api.id} value={api.id}>
                {api.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-2">
            Esta API recibirá la respuesta de la API destino y la procesará antes de devolver el resultado al cliente.
            El body que recibirá será: <code className="text-blue-400">{'{ original_request, target_response }'}</code>
          </p>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 space-y-2">
        <p className="font-medium">¿Cuándo usar cada modo?</p>
        <ul className="list-disc list-inside space-y-1 text-amber-400/80">
          <li><strong>Directo:</strong> Recibes un webhook o datos y los envías a tu API</li>
          <li><strong>Con Procesamiento:</strong> Necesitas transformar o enriquecer los datos antes de responder</li>
          <li><strong>Obtener y Enviar:</strong> Necesitas sincronizar datos automáticamente entre dos sistemas</li>
        </ul>
        <p className="text-amber-400/60 mt-2">
          <strong>Ejemplos:</strong><br/>
          • Directo: Recibir pago de Stripe → Enviarlo a tu sistema de facturación<br/>
          • Con Procesamiento: Obtener clima → Traducir → Guardar en cache → Responder<br/>
          • Obtener y Enviar: Cada hora, traer usuarios del Sistema A → Sincronizar al Sistema B
        </p>
      </div>
    </div>
  );
}
