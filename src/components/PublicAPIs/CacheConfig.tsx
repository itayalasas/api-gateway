import { useState } from 'react';
import { Database, Clock, TrendingUp, Info } from 'lucide-react';

interface CacheConfigProps {
  enabled: boolean;
  ttlHours: number;
  onChange: (enabled: boolean, ttlHours: number) => void;
}

export function CacheConfig({ enabled, ttlHours, onChange }: CacheConfigProps) {
  const [cacheEnabled, setCacheEnabled] = useState(enabled);
  const [cacheTtl, setCacheTtl] = useState(ttlHours || 24);

  const handleEnabledChange = (checked: boolean) => {
    setCacheEnabled(checked);
    onChange(checked, cacheTtl);
  };

  const handleTtlChange = (hours: number) => {
    setCacheTtl(hours);
    onChange(cacheEnabled, hours);
  };

  const ttlPresets = [
    { label: '1 hora', value: 1 },
    { label: '6 horas', value: 6 },
    { label: '12 horas', value: 12 },
    { label: '24 horas', value: 24 },
    { label: '7 días', value: 168 },
    { label: '30 días', value: 720 },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5 text-blue-400" />
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={cacheEnabled}
                onChange={(e) => handleEnabledChange(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-700 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-slate-300">
                Habilitar Cache de Respuestas
              </span>
            </label>
            <p className="text-xs text-slate-500 mt-1 ml-6">
              Guarda las respuestas para evitar llamadas repetidas a la API externa
            </p>
          </div>
        </div>
      </div>

      {cacheEnabled && (
        <div className="space-y-4 pl-8">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
              <Clock className="w-4 h-4 text-slate-400" />
              Tiempo de Vida del Cache (TTL)
            </label>

            <div className="grid grid-cols-3 gap-2">
              {ttlPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => handleTtlChange(preset.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    cacheTtl === preset.value
                      ? 'bg-blue-600 text-white border-blue-500'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  } border`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 mt-3">
              <input
                type="number"
                min="1"
                max="8760"
                value={cacheTtl}
                onChange={(e) => handleTtlChange(parseInt(e.target.value) || 1)}
                className="w-24 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-sm text-slate-400">horas personalizadas</span>
            </div>
          </div>

          <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-100 space-y-1">
                <p className="font-semibold">Cómo funciona el cache:</p>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>La primera petición consulta la API externa y guarda la respuesta</li>
                  <li>Las siguientes peticiones devuelven la respuesta cacheada instantáneamente</li>
                  <li>Cuando el cache expira (después del TTL), se vuelve a consultar la API</li>
                  <li>Ideal para APIs que no cambian frecuentemente (países, catálogos, etc.)</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <TrendingUp className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-green-100">
                <p className="font-semibold mb-1">Beneficios:</p>
                <ul className="space-y-1 list-disc list-inside ml-2">
                  <li>Respuestas más rápidas (sin latencia de red)</li>
                  <li>Reduce costos de APIs externas con límites de peticiones</li>
                  <li>Mejora la confiabilidad (funciona aunque la API externa falle temporalmente)</li>
                  <li>Menor uso de ancho de banda</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
