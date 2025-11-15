import { useState, useEffect } from 'react';
import { X, Save, Folder } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';

interface ProjectFormModalProps {
  projectId?: string;
  onClose: () => void;
}

const COLORS = [
  '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
];

export function ProjectFormModal({ projectId, onClose }: ProjectFormModalProps) {
  const { user } = useAuth();
  const { refreshProjects, projects } = useProject();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!projectId;
  const project = projects.find(p => p.id === projectId);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description || '');
      setColor(project.color);
    }
  }, [project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('El nombre es requerido');
      return;
    }

    if (!user) {
      setError('Usuario no autenticado');
      return;
    }

    setLoading(true);
    try {
      if (isEditing) {
        const { error: updateError } = await supabase
          .from('projects')
          .update({
            name: name.trim(),
            description: description.trim(),
            color,
          })
          .eq('id', projectId);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('projects')
          .insert({
            name: name.trim(),
            description: description.trim(),
            color,
            user_id: user.id,
          });

        if (insertError) throw insertError;
      }

      await refreshProjects();
      onClose();
    } catch (err) {
      console.error('Error saving project:', err);
      setError(err instanceof Error ? err.message : 'Error al guardar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-md">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">
                {isEditing ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </h3>
              <p className="text-sm text-slate-400">
                {isEditing ? 'Actualiza la información del proyecto' : 'Organiza tus APIs e integraciones'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Nombre del Proyecto *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ej. Mi Proyecto E-commerce"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="ej. Proyecto para integrar pagos y notificaciones"
              rows={3}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 resize-none"
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Color
            </label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-10 h-10 rounded-lg transition-all ${
                    color === c
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-800 scale-110'
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: c }}
                  disabled={loading}
                />
              ))}
            </div>
          </div>

          {error && (
            <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors font-semibold"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEditing ? 'Actualizando...' : 'Creando...'}
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  {isEditing ? 'Actualizar' : 'Crear Proyecto'}
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white px-4 py-3 rounded-lg flex items-center gap-2 transition-colors"
            >
              <X className="w-5 h-5" />
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
