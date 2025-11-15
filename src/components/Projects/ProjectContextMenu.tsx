import { Edit, Share2, Power, Trash2, Plus, Globe, Link2 } from 'lucide-react';
import { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useProject } from '../../contexts/ProjectContext';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../UI/ConfirmDialog';

interface ProjectContextMenuProps {
  projectId: string;
  position: { x: number; y: number };
  onClose: () => void;
  onEdit: (id: string) => void;
  activeView?: string;
}

export function ProjectContextMenu({ projectId, position, onClose, onEdit, activeView }: ProjectContextMenuProps) {
  const { projects, refreshProjects, setSelectedProject, selectedProject } = useProject();
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const project = projects.find(p => p.id === projectId);
  const { success, error: showError, ToastContainer } = useToast();

  const handleCreateAPI = () => {
    localStorage.setItem('tempProjectId', projectId);
    window.dispatchEvent(new CustomEvent('create-api'));
    onClose();
  };

  const handleCreateIntegration = () => {
    localStorage.setItem('tempProjectId', projectId);
    window.dispatchEvent(new CustomEvent('create-integration'));
    onClose();
  };

  const handleCreatePublicAPI = () => {
    localStorage.setItem('tempProjectId', projectId);
    window.dispatchEvent(new CustomEvent('create-public-api'));
    onClose();
  };

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
      success(project.is_active ? 'Proyecto desactivado correctamente' : 'Proyecto activado correctamente');
      onClose();
    } catch (error) {
      console.error('Error toggling project:', error);
      showError('Error al actualizar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setShowDeleteConfirm(false);
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
      success('Proyecto eliminado correctamente');
      onClose();
    } catch (error) {
      console.error('Error deleting project:', error);
      showError('Error al eliminar el proyecto');
    } finally {
      setLoading(false);
    }
  };

  if (!project) return null;

  return (
    <>
      <ToastContainer />
    <div
      className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-1 z-50 min-w-[200px]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Opciones contextuales según la vista activa */}
      {activeView === 'apis' && (
        <>
          <button
            onClick={handleCreateAPI}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Crear API</span>
          </button>
          <div className="h-px bg-slate-700 my-1" />
        </>
      )}

      {activeView === 'integrations' && (
        <>
          <button
            onClick={handleCreateIntegration}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Crear Integración</span>
          </button>
          <div className="h-px bg-slate-700 my-1" />
        </>
      )}

      {activeView === 'public-apis' && (
        <>
          <button
            onClick={handleCreatePublicAPI}
            disabled={loading}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-blue-400 hover:bg-blue-500/10 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            <span>Crear API Pública</span>
          </button>
          <div className="h-px bg-slate-700 my-1" />
        </>
      )}

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
        onClick={handleDeleteClick}
        disabled={loading}
        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
      >
        <Trash2 className="w-4 h-4" />
        <span>Eliminar</span>
      </button>
    </div>

    {showDeleteConfirm && (
      <ConfirmDialog
        title="Eliminar Proyecto"
        message={`¿Estás seguro de eliminar el proyecto "${project.name}"? Esta acción no se puede deshacer y se eliminarán todas las APIs e integraciones asociadas.`}
        confirmText="Eliminar"
        cancelText="Cancelar"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    )}
    </>
  );
}
