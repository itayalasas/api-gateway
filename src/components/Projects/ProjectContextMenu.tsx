import { Edit, Share2, Power, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useProject } from '../../contexts/ProjectContext';

interface ProjectContextMenuProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (id: string) => void;
}

export function ProjectContextMenu({ projectId, position, onClose, onEdit }: ProjectContextMenuProps) {
  const { projects, refreshProjects, setSelectedProject, selectedProject } = useProject();
  const [loading, setLoading] = useState(false);
  const project = projects.find(p => p.id === projectId);

  const handleToggleActive = async () => {
    if (!project) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({ is_active: !project.is_active })
        .eq('id', projectId);

      if (error) throw error;

      if (selectedProject?.id === projectId && !project.is_active) {
        setSelectedProject(null);
      }

      await refreshProjects();
      onClose();
    } catch (error) {
      console.error('Error toggling project:', error);
      alert('Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('¿Estás seguro de eliminar este proyecto? Esta acción no se puede deshacer.')) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId);

      if (error) throw error;

      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
      }

      await refreshProjects();
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
      alert('Error al eliminar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <div
      className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={() => {
          onEdit(projectId);
          onClose();
        }}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        <Edit className="w-4 h-4" />
        <span>Editar</span>
      </button>

      <button
        onClick={handleToggleActive}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 transition-colors disabled:opacity-50"
      >
        <Power className="w-4 h-4" />
        <span>{project.is_active ? 'Desactivar' : 'Activar'}</span>
      </button>

      <div className="h-px bg-slate-700 my-1" />

      <button
        onClick={handleDelete}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        <span>Eliminar</span>
      </button>
    </div>
  );
}
