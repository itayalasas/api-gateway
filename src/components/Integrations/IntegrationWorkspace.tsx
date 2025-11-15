import { useState, useEffect } from 'react';
import { Plus, Play, Square, ArrowRight, MoreVertical, FolderOpen, Globe } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { IntegrationForm } from './IntegrationForm';
import { IntegrationFlow } from './IntegrationFlow';
import { useAuth } from '../../contexts/AuthContext';
import { useProject } from '../../contexts/ProjectContext';

type Integration = Database['public']['Tables']['integrations']['Row'];
type API = Database['public']['Tables']['apis']['Row'];
type APIEndpoint = Database['public']['Tables']['api_endpoints']['Row'];
type Project = Database['public']['Tables']['projects']['Row'];

interface IntegrationWithAPIs extends Integration {
  source_api: API;
  target_api: API;
  source_endpoints?: APIEndpoint[];
  target_endpoint?: APIEndpoint;
}

interface GroupedIntegrations {
  project: Project | null;
  integrations: IntegrationWithAPIs[];
}

export function IntegrationWorkspace() {
  const { user, externalUser } = useAuth();
  const { selectedProject, projects } = useProject();
  const [integrations, setIntegrations] = useState<IntegrationWithAPIs[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationWithAPIs | null>(null);

  useEffect(() => {
    loadData();
  }, [user, externalUser, selectedProject]);

  useEffect(() => {
    const handleCreateIntegrationEvent = () => {
      setShowForm(true);
    };
    window.addEventListener('create-integration', handleCreateIntegrationEvent);
    return () => window.removeEventListener('create-integration', handleCreateIntegrationEvent);
  }, []);

  const loadData = async () => {
    const userId = externalUser?.id || user?.id;
    if (!userId) return;

    if (initialLoad) {
      setLoading(true);
    }

    // Load APIs with project filter
    let apisQuery = supabase.from('apis').select('*').eq('user_id', userId);
    if (selectedProject) {
      apisQuery = apisQuery.eq('project_id', selectedProject.id);
    }

    // Load integrations with project filter
    let integrationsQuery = supabase.from('integrations').select('*').eq('user_id', userId);
    if (selectedProject) {
      integrationsQuery = integrationsQuery.eq('project_id', selectedProject.id);
    }

    const [{ data: apisData }, { data: integrationsData }, { data: endpointsData }, { data: junctionData }] = await Promise.all([
      apisQuery,
      integrationsQuery,
      supabase.from('api_endpoints').select('*'),
      supabase.from('integration_source_endpoints').select('*')
    ]);

    if (apisData) setApis(apisData);

    if (integrationsData && apisData && endpointsData) {
      const integrationsWithAPIs = await Promise.all(integrationsData.map(async integration => {
        const sourceAPI = apisData.find(api => api.id === integration.source_api_id);
        const targetAPI = apisData.find(api => api.id === integration.target_api_id);

        // Get all source endpoints for this integration from junction table
        const sourceEndpointIds = junctionData
          ?.filter(j => j.integration_id === integration.id)
          .map(j => j.source_endpoint_id) || [];

        // If junction table has data, use that, otherwise fallback to direct column
        const sourceEndpoints = sourceEndpointIds.length > 0
          ? endpointsData?.filter(ep => sourceEndpointIds.includes(ep.id)) || []
          : integration.source_endpoint_id
            ? [endpointsData?.find(ep => ep.id === integration.source_endpoint_id)].filter(Boolean) as APIEndpoint[]
            : [];

        const targetEndpoint = endpointsData?.find(ep => ep.id === integration.target_endpoint_id);

        return {
          ...integration,
          source_api: sourceAPI!,
          target_api: targetAPI!,
          source_endpoints: sourceEndpoints,
          target_endpoint: targetEndpoint
        };
      }));

      setIntegrations(integrationsWithAPIs.filter(i => i.source_api && i.target_api));
    }

    if (initialLoad) {
      setInitialLoad(false);
    }
    setLoading(false);
  };

  const handleToggleActive = async (integration: Integration) => {
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: !integration.is_active })
      .eq('id', integration.id);

    if (!error) loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta integración?')) return;

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (!error) loadData();
  };

  const handleEdit = (integration: Integration) => {
    setEditingIntegration(integration);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingIntegration(null);
    loadData();
  };

  const handleContextMenu = (e: React.MouseEvent, projectId: string | null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ projectId, x: e.clientX, y: e.clientY });
  };

  const handleCreateIntegration = (projectId: string | null) => {
    if (projectId) {
      localStorage.setItem('tempProjectId', projectId);
    }
    setShowForm(true);
    setContextMenu(null);
  };

  // Agrupar integraciones por proyecto
  const groupedIntegrations: GroupedIntegrations[] = [];

  if (selectedProject) {
    // Si hay un proyecto seleccionado, mostrar solo ese proyecto
    groupedIntegrations.push({
      project: selectedProject,
      integrations: integrations
    });
  } else {
    // Mostrar todos los proyectos con sus integraciones
    // Primero las integraciones sin proyecto
    const integrationsWithoutProject = integrations.filter(int => !int.project_id);
    if (integrationsWithoutProject.length > 0) {
      groupedIntegrations.push({
        project: null,
        integrations: integrationsWithoutProject
      });
    }

    // Luego cada proyecto con sus integraciones
    projects.forEach(project => {
      const projectIntegrations = integrations.filter(int => int.project_id === project.id);
      if (projectIntegrations.length > 0) {
        groupedIntegrations.push({
          project,
          integrations: projectIntegrations
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

  if (selectedIntegration) {
    return (
      <IntegrationFlow
        integration={selectedIntegration}
        onBack={() => setSelectedIntegration(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Integraciones</h2>
        <p className="text-slate-400 mt-1">Conecta y gestiona integraciones entre endpoints por proyecto</p>
      </div>

      {apis.length < 2 && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            Necesitas al menos 2 APIs configuradas para crear una integración. Ve a la sección APIs para agregarlas.
          </p>
        </div>
      )}

      {groupedIntegrations.length === 0 && apis.length >= 2 ? (
        <div className="text-center py-16 bg-slate-800/30 rounded-xl border border-slate-700/50 border-dashed">
          <ArrowRight className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No hay integraciones</h3>
          <p className="text-slate-400">Usa el botón "Crear Integración" en cada proyecto para agregar integraciones</p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedIntegrations.map((group) => (
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
                    {group.integrations.length} {group.integrations.length === 1 ? 'Integración' : 'Integraciones'}
                  </span>
                </div>
                <button
                  onClick={(e) => handleContextMenu(e, group.project?.id || null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <MoreVertical className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              {/* Integrations Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-2.5">
                {group.integrations.map((integration) => (
                  <div
                    key={integration.id}
                    className="group bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700/50 hover:border-blue-500/50 transition-all duration-200 overflow-hidden cursor-pointer"
                    onClick={() => setSelectedIntegration(integration)}
                  >
                    <div className="p-3">
                      <div className="flex items-center gap-2.5 mb-2.5">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          integration.is_active ? 'bg-green-500/20 ring-1 ring-green-500/30' : 'bg-slate-700/50'
                        }`}>
                          {integration.is_active ? (
                            <Play className="w-3.5 h-3.5 text-green-400" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white text-sm truncate leading-tight">{integration.name}</h3>
                          <span className={`inline-flex items-center text-xs px-1.5 py-0.5 rounded mt-0.5 ${
                            integration.is_active
                              ? 'bg-green-500/10 text-green-400'
                              : 'bg-slate-700/50 text-slate-400'
                          }`}>
                            {integration.is_active ? 'Activa' : 'Inactiva'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="bg-slate-900/50 rounded-md p-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-slate-400">Origen</span>
                            {integration.source_endpoints && integration.source_endpoints.length > 1 && (
                              <span className="text-xs bg-slate-700/50 text-slate-300 px-1.5 py-0.5 rounded">
                                {integration.source_endpoints.length} endpoints
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-medium text-white truncate leading-tight">{integration.source_api.name}</p>
                          {integration.source_endpoints && integration.source_endpoints.length > 0 && (
                            <div className="mt-1">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-mono bg-green-500/20 text-green-400 px-1 py-0.5 rounded flex-shrink-0">
                                  {integration.source_endpoints[0].method}
                                </span>
                                <span className="text-xs font-mono text-slate-300 truncate">{integration.source_endpoints[0].path}</span>
                              </div>
                              {integration.source_endpoints.length > 1 && (
                                <span className="text-xs text-slate-500 mt-0.5 block">
                                  +{integration.source_endpoints.length - 1} más
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex justify-center py-0.5">
                          <ArrowRight className="w-3.5 h-3.5 text-blue-400" />
                        </div>

                        <div className="bg-slate-900/50 rounded-md p-2">
                          <span className="text-xs font-medium text-slate-400 block mb-1">Destino</span>
                          <p className="text-sm font-medium text-white truncate leading-tight">{integration.target_api.name}</p>
                          {integration.target_endpoint && (
                            <div className="flex items-center gap-1 mt-1">
                              <span className="text-xs font-mono bg-blue-500/20 text-blue-400 px-1 py-0.5 rounded flex-shrink-0">
                                {integration.target_endpoint.method}
                              </span>
                              <span className="text-xs font-mono text-slate-300 truncate">{integration.target_endpoint.path}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-700/50 bg-slate-800/30 p-1.5 flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleActive(integration);
                        }}
                        className={`flex-1 px-2 py-1.5 rounded text-xs font-medium flex items-center justify-center gap-1 transition-colors ${
                          integration.is_active
                            ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400'
                            : 'bg-green-500/10 hover:bg-green-500/20 text-green-400'
                        }`}
                      >
                        {integration.is_active ? (
                          <>
                            <Square className="w-3 h-3" />
                            Desactivar
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3" />
                            Activar
                          </>
                        )}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(integration);
                        }}
                        className="px-2.5 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 text-xs font-medium rounded transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(integration.id);
                        }}
                        className="px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded transition-colors"
                      >
                        Eliminar
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
            onClick={() => handleCreateIntegration(contextMenu.projectId)}
            className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 flex items-center gap-2"
            disabled={apis.length < 2}
          >
            <Plus className="w-4 h-4" />
            Crear Integración
          </button>
        </div>
      )}

      {showForm && (
        <IntegrationForm
          integration={editingIntegration}
          apis={apis}
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
