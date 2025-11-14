import { useState } from 'react';
import { Save, X, AlertCircle, Globe } from 'lucide-react';
import { Database as DB } from '../../lib/database.types';

type API = DB['public']['Tables']['apis']['Row'];

interface PublicAPIFormProps {
  apis: API[];
  onSubmit: (data: {
    name: string;
    description: string;
    targetApiId: string;
  }) => Promise<void>;
  onCancel: () => void;
}

export function PublicAPIForm({ apis, onSubmit, onCancel }: PublicAPIFormProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [targetApiId, setTargetApiId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const publishedAPIs = apis.filter(api => api.type === 'published' && api.is_active);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!targetApiId) {
      setError('Debes seleccionar una API interna');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim(),
        targetApiId
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la API pública');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Nueva API Pública</h3>
          <p className="text-sm text-slate-400">Expón una API interna para consumo de terceros</p>
        </div>
      </div>

      {publishedAPIs.length === 0 && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-yellow-100">
              <p className="font-semibold mb-1">No hay APIs internas disponibles</p>
              <p className="text-yellow-200">
                Necesitas crear al menos una API interna (tipo "published") en la sección de APIs antes de poder crear una API pública.
              </p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Nombre de la API Pública *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ej. Public Payment API"
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Nombre descriptivo para identificar esta API pública
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            Descripción
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="ej. API pública para procesar pagos desde aplicaciones externas"
            rows={3}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
            disabled={loading}
          />
          <p className="text-xs text-slate-500 mt-1">
            Descripción opcional del propósito de esta API
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">
            API Interna (Destino) *
          </label>
          <select
            value={targetApiId}
            onChange={(e) => setTargetApiId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
            disabled={loading || publishedAPIs.length === 0}
          >
            <option value="">-- Selecciona una API interna --</option>
            {publishedAPIs.map((api) => (
              <option key={api.id} value={api.id}>
                {api.name} - {api.base_url}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            La API interna a la que se redirigirán las peticiones
          </p>
        </div>

        <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-400 mb-2">¿Cómo funciona?</h4>
          <ul className="text-xs text-blue-100 space-y-1">
            <li>• Se generará automáticamente una URL pública y una API Key</li>
            <li>• Los terceros usarán la URL pública con la API Key en el header</li>
            <li>• Todas las peticiones se redirigirán a tu API interna seleccionada</li>
            <li>• Puedes ver todos los logs y monitorear las peticiones en tiempo real</li>
          </ul>
        </div>

        {error && (
          <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={loading || publishedAPIs.length === 0}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Crear API Pública
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
