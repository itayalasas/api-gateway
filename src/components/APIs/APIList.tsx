import { useState, useEffect } from 'react';
import { Plus, CreditCard as Edit, Trash2, Globe, Lock, MoreVertical, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { APIForm } from './APIForm';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';

type API = Database['public']['Tables']['apis']['Row'];
type APISecurity = Database['public']['Tables']['api_security']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface APIWithSecurity extends API {
  security?: APISecurity;
}

interface GroupedAPIs {
  project: Project | null;
  apis: APIWithSecurity[];
}

export function APIList() {
  const { user, externalUser } = useAuth();
  const { selectedProject, projects } = useProject();
  const [apis, setApis] = useState<APIWithSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAPI, setEditingAPI] = useState<API | null>(null);
  const [contextMenu, setContextMenu] = useState<{ projectId: string | null; x: number; y: number } | null>(null);

  useEffect(() => {
    loadAPIs();
  }, [user, externalUser, selectedProject]);

  useEffect(() => {
    const handleClickOutside = () => setContextMenu(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const loadAPIs = async () => {
    const userId = externalUser?.id || user?.id;

    if (!userId) {
      return;
    }

    if (initialLoad) {
      setLoading(true);
    }

    let query = supabase
      .from('apis')
      .select('*')
      .eq('user_id', userId);

    if (selectedProject) {
      query = query.eq('project_id', selectedProject.id);
    }

    const { data: apisData, error: apisError } = await query
      .order('created_at', { ascending: false });

    if (apisError) {
      console.error('Error loading APIs:', apisError);
      setLoading(false);
      return;
    }

    const { data: securityData } = await supabase
      .from('api_security')
      .select('*');

    const apisWithSecurity = apisData.map(api => ({
      ...api,
      security: securityData?.find(s => s.api_id === api.id)
    }));

    setApis(apisWithSecurity);
    if (initialLoad) {
      setInitialLoad(false);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta API?')) return;

    const { error } = await supabase
      .from('apis')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting API:', error);
      return;
    }

    loadAPIs();
  };

  const handleEdit = (api: API) => {
    setEditingAPI(api);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingAPI(null);
    loadAPIs();
  };

  const handleContextMenu = (e: React.MouseEvent, projectId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ projectId, x: e.clientX, y: e.clientY });
  };

  const handleCreateAPI = (projectId: string | null) => {
    // Si hay un proyecto seleccionado, crear API con ese proyecto pre-seleccionado
    if (projectId) {
      const project = projects.find(p => p.id === projectId);
      if (project) {
        // Temporal: guardar el proyecto en el estado para que APIForm lo use
        localStorage.setItem('tempProjectId', projectId);
      }
    }
    setShowForm(true);
    setContextMenu(null);
  };

  // Agrupar APIs por proyecto
  const groupedAPIs: GroupedAPIs[] = [];

  if (selectedProject) {
    // Si hay un proyecto seleccionado, mostrar solo ese proyecto
    groupedAPIs.push({
      project: selectedProject,
      apis: apis
    });
  } else {
    // Mostrar todos los proyectos con sus APIs
    // Primero las APIs sin proyecto
    const apisWithoutProject = apis.filter(api => !api.project_id);
    if (apisWithoutProject.length > 0) {
      groupedAPIs.push({
        project: null,
        apis: apisWithoutProject
      });
    }

    // Luego cada proyecto con sus APIs
    projects.forEach(project => {
      const projectAPIs = apis.filter(api => api.project_id === project.id);
      if (projectAPIs.length > 0) {
        groupedAPIs.push({
          project,
          apis: projectAPIs
        });
      }
    });
  }

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">APIs</h2>
        <p className="text-slate-400 mt-1">Gestiona tus configuraciones de API por proyecto</p>
      </div>

      {groupedAPIs.length === 0 ? (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay APIs</h3>
          <p className="text-slate-400">Usa el botón "Crear API" en cada proyecto para agregar APIs</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedAPIs.map((group, idx) => (
            <div key={group.project?.id || 'unassigned'} className="space-y-4">
              {/* Project Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: group.project?.color || '#64748b' }}
                  />
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    {group.project ? (
                      <>
                        <FolderOpen className="w-5 h-5" />
                        {group.project.name}
                      </>
                    ) : (
                      <>
                        <Globe className="w-5 h-5" />
                        Sin Proyecto
                      </>
                    )}
                  </h3>
                  <span className="text-sm text-slate-400">
                    {group.apis.length} {group.apis.length === 1 ? 'API' : 'APIs'}
                  </span>
                </div>
                <button
                  onClick={(e) => handleContextMenu(e, group.project?.id || null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* APIs Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.apis.map((api) => (
                  <div
                    key={api.id}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          api.type === 'published' ? 'bg-green-600/20' : 'bg-blue-600/20'
                        }`}>
                          <Globe className={`w-5 h-5 ${
                            api.type === 'published' ? 'text-green-400' : 'text-blue-400'
                          }`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{api.name}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            api.type === 'published'
                              ? 'bg-green-600/20 text-green-400'
                              : 'bg-blue-600/20 text-blue-400'
                          }`}>
                            {api.type}
                          </span>
                        </div>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        api.is_active ? 'bg-green-400' : 'bg-slate-600'
                      }`} />
                    </div>

                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">
                      {api.description || 'Sin descripción'}
                    </p>

                    <div className="bg-slate-900 rounded-lg p-3 mb-4">
                      <p className="text-xs text-slate-500 mb-1">Base URL</p>
                      <p className="text-sm text-slate-300 font-mono truncate">{api.base_url}</p>
                    </div>

                    {api.security && (
                      <div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
                        <Lock className="w-4 h-4" />
                        <span className="capitalize">{api.security.auth_type.replace('_', ' ')}</span>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(api)}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(api.id)}
                        className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-slate-800 border border-slate-700 rounded-lg shadow-xl py-2 z-50"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => handleCreateAPI(contextMenu.projectId)}
            className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Crear API
          </button>
        </div>
      )}

      {showForm && (
        <APIForm
          api={editingAPI}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
