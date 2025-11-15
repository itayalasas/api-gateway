import { useState, useRef, useEffect } from 'react';
import { Folder, FolderOpen, Plus, MoreVertical, Edit, Share2, Power, Trash2, X } from 'lucide-react';
import { useProject } from '../../contexts/ProjectContext';
import { ProjectContextMenu } from './ProjectContextMenu';
import { ProjectFormModal } from './ProjectFormModal';

interface ProjectSelectorProps {
  activeView?: string;
}

export function ProjectSelector({ activeView }: ProjectSelectorProps) {
  const { projects, selectedProject, setSelectedProject } = useProject();
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    projectId: string;
  } | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProject, setEditingProject] = useState<string | null>(null);

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      projectId,
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu(null);
  };

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-4 mb-2">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Proyectos
        </h3>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
          title="Nuevo Proyecto"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1 px-2">
        {/* Opción "Todos" (sin filtro de proyecto) */}
        <button
          onClick={() => setSelectedProject(null)}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            !selectedProject
              ? 'bg-blue-600 text-white'
              : 'text-slate-300 hover:bg-slate-700/50'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          <span className="text-sm font-medium">Todos los proyectos</span>
        </button>

        {/* Lista de proyectos */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="relative group"
          >
            <div
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors cursor-pointer ${
                selectedProject?.id === project.id
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50'
              }`}
              onClick={() => setSelectedProject(project)}
              onContextMenu={(e) => handleContextMenu(e, project.id)}
              title={project.description || project.name}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: project.color + '40' }}
              >
                <Folder
                  className="w-3 h-3"
                  style={{ color: project.color }}
                />
              </div>
              <span className="text-sm font-medium truncate flex-1 text-left">
                {project.name}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e, project.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-600 rounded transition-opacity"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}

        {projects.length === 0 && (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-slate-500">
              No hay proyectos aún
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300"
            >
              Crear el primero
            </button>
          </div>
        )}
      </div>

      {contextMenu && (
        <ProjectContextMenu
          projectId={contextMenu.projectId}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={handleCloseContextMenu}
          onEdit={(id) => {
            setEditingProject(id);
            handleCloseContextMenu();
          }}
          activeView={activeView}
        />
      )}

      {showCreateModal && (
        <ProjectFormModal
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingProject && (
        <ProjectFormModal
          projectId={editingProject}
          onClose={() => setEditingProject(null)}
        />
      )}
    </div>
  );
}
