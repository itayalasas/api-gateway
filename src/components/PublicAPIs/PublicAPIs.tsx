import { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw, FolderOpen } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database as DB } from '../../lib/database.types';
import { PublicAPIList } from './PublicAPIList';
import { PublicAPIForm } from './PublicAPIForm';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../UI/ConfirmDialog';
import { useProject } from '../../contexts/ProjectContext';
import { useAuth } from '../../contexts/AuthContext';

type Integration = DB['public']['Tables']['integrations']['Row'];
type API = DB['public']['Tables']['apis']['Row'];
type Project = DB['public']['Tables']['projects']['Row'];

interface GroupedPublicAPIs {
  project: Project | null;
  publicAPIs: Integration[];
}

export function PublicAPIs() {
  const { user, externalUser } = useAuth();
  const { selectedProject, projects } = useProject();
  const [publicAPIs, setPublicAPIs] = useState<Integration[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPublicAPI, setEditingPublicAPI] = useState<Integration | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const { success, error: showError, ToastContainer } = useToast();

  useEffect(() => {
    loadData();
  }, [user, externalUser, selectedProject]);

  useEffect(() => {
    const handleCreatePublicAPIEvent = () => {
      setShowForm(true);
    };
    window.addEventListener('create-public-api', handleCreatePublicAPIEvent);
    return () => window.removeEventListener('create-public-api', handleCreatePublicAPIEvent);
  }, []);

  const autoFixPublicAPIs = async (integrations: Integration[]) => {
    const fixPromises = integrations.map(async (integration) => {
      // Check if this integration is missing endpoint configuration
      if (integration.target_api_id && !integration.target_endpoint_id) {
        try {
          console.log(`Auto-fixing integration ${integration.name} (${integration.id})`);

          // Get the first endpoint for the target API
          const { data: endpoints } = await supabase
            .from('api_endpoints')
            .select('*')
            .eq('api_id', integration.target_api_id)
            .limit(1);

          if (endpoints && endpoints.length > 0) {
            const endpoint = endpoints[0];

            // Update the integration with the missing fields
            await supabase
              .from('integrations')
              .update({
                target_endpoint_id: endpoint.id,
                endpoint_path: endpoint.path,
                method: endpoint.method,
                updated_at: new Date().toISOString()
              })
              .eq('id', integration.id);

            console.log(`Fixed integration ${integration.name}`);
          }
        } catch (error) {
          console.error(`Failed to auto-fix integration ${integration.id}:`, error);
        }
      }
    });

    await Promise.all(fixPromises);
  };

  const loadData = async () => {
    const userId = externalUser?.id || user?.id;
    if (!userId) return;

    if (initialLoad) {
      setLoading(true);
    }
    setRefreshing(true);

    try {
      let integrationsQuery = supabase
        .from('integrations')
        .select('*')
        .eq('integration_type', 'public_proxy')
        .eq('user_id', userId);

      if (selectedProject) {
        integrationsQuery = integrationsQuery.eq('project_id', selectedProject.id);
      }

      const [integrationsResult, apisResult] = await Promise.all([
        integrationsQuery.order('created_at', { ascending: false }),
        supabase
          .from('apis')
          .select('*')
          .eq('user_id', userId)
          .order('name')
      ]);

      if (integrationsResult.data) {
        setPublicAPIs(integrationsResult.data);
        // Auto-fix any public APIs missing endpoint configuration
        await autoFixPublicAPIs(integrationsResult.data);
      }
      if (apisResult.data) setApis(apisResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (initialLoad) {
        setInitialLoad(false);
      }
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateApiKey = () => {
    return 'pub_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const handleCreatePublicAPI = async (data: {
    name: string;
    description: string;
    targetApiId: string;
    sourceType: 'api' | 'integration';
    projectId?: string;
  }) => {
    const apiKey = generateApiKey();

    // Remove prefix from targetApiId
    const cleanTargetId = data.targetApiId.replace(/^(api-|int-)/, '');

    let targetApiId: string;
    let targetEndpointId: string;
    let endpointPath: string;
    let method: string;
    let userId: string;

    if (data.sourceType === 'api') {
      // Source is a published API
      const targetAPI = apis.find(api => api.id === cleanTargetId);
      if (!targetAPI) {
        throw new Error('API interna no encontrada');
      }

      // Get the first endpoint of the target API
      const { data: endpoints, error: endpointsError } = await supabase
        .from('api_endpoints')
        .select('*')
        .eq('api_id', cleanTargetId)
        .limit(1);

      if (endpointsError || !endpoints || endpoints.length === 0) {
        throw new Error('La API target no tiene endpoints configurados. Por favor, agrega al menos un endpoint a la API primero.');
      }

      const targetEndpoint = endpoints[0];
      targetApiId = cleanTargetId;
      targetEndpointId = targetEndpoint.id;
      endpointPath = targetEndpoint.path;
      method = targetEndpoint.method;
      userId = targetAPI.user_id;
    } else {
      // Source is an existing public_proxy integration
      const sourceIntegration = publicAPIs.find(int => int.id === cleanTargetId);
      if (!sourceIntegration) {
        throw new Error('Integración pública no encontrada');
      }

      if (!sourceIntegration.target_api_id || !sourceIntegration.target_endpoint_id) {
        throw new Error('La integración seleccionada no tiene una API target configurada');
      }

      // Use the same target as the source integration
      targetApiId = sourceIntegration.target_api_id;
      targetEndpointId = sourceIntegration.target_endpoint_id;
      endpointPath = sourceIntegration.endpoint_path;
      method = sourceIntegration.method;
      userId = sourceIntegration.user_id;
    }

    const { error } = await supabase.from('integrations').insert({
      name: data.name,
      description: data.description || '',
      user_id: userId,
      project_id: data.projectId || null,
      source_api_id: targetApiId,
      target_api_id: targetApiId,
      target_endpoint_id: targetEndpointId,
      endpoint_path: endpointPath,
      method: method,
      integration_type: 'public_proxy',
      api_key: apiKey,
      is_active: true,
      transform_config: {
        proxy_type: 'public',
        auto_forward: true,
        source_type: data.sourceType
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    await loadData();
    setShowForm(false);
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', deleteConfirm.id);

    if (error) {
      console.error('Error deleting public API:', error);
      showError('Error al eliminar la API pública');
      return;
    }

    success('API pública eliminada correctamente');
    setDeleteConfirm(null);
    await loadData();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error toggling active status:', error);
      showError('Error al cambiar el estado de la API');
      return;
    }

    success(currentStatus ? 'API desactivada correctamente' : 'API activada correctamente');
    await loadData();
  };

  const handleEdit = (publicAPI: Integration) => {
    setEditingPublicAPI(publicAPI);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingPublicAPI(null);
  };

  const getGroupedPublicAPIs = (): GroupedPublicAPIs[] => {
    const grouped = new Map<string | null, Integration[]>();

    publicAPIs.forEach(api => {
      const projectId = api.project_id;
      if (!grouped.has(projectId)) {
        grouped.set(projectId, []);
      }
      grouped.get(projectId)!.push(api);
    });

    return Array.from(grouped.entries()).map(([projectId, apis]) => ({
      project: projectId ? projects.find(p => p.id === projectId) || null : null,
      publicAPIs: apis
    })).sort((a, b) => {
      if (!a.project && !b.project) return 0;
      if (!a.project) return 1;
      if (!b.project) return -1;
      return a.project.name.localeCompare(b.project.name);
    });
  };

  const groupedPublicAPIs = getGroupedPublicAPIs();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <Globe className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">APIs Públicas</h2>
              <p className="text-blue-100">Expón tus APIs internas para consumo de terceros</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={refreshing}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              title="Actualizar"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-semibold"
              >
                <Plus className="w-5 h-5" />
                Nueva API Pública
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-blue-400" />
            </div>
            <p className="text-sm text-slate-400">Total de APIs</p>
          </div>
          <p className="text-2xl font-bold text-white">{publicAPIs.length}</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-green-600/20 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-green-400" />
            </div>
            <p className="text-sm text-slate-400">APIs Activas</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {publicAPIs.filter(api => api.is_active).length}
          </p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 bg-slate-600/20 rounded-lg flex items-center justify-center">
              <Globe className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-sm text-slate-400">APIs Inactivas</p>
          </div>
          <p className="text-2xl font-bold text-white">
            {publicAPIs.filter(api => !api.is_active).length}
          </p>
        </div>
      </div>

      {showForm && (
        <PublicAPIForm
          apis={apis}
          publicAPIs={publicAPIs}
          editingPublicAPI={editingPublicAPI}
          onSubmit={handleCreatePublicAPI}
          onCancel={handleCloseForm}
        />
      )}

      {publicAPIs.length === 0 ? (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-12 text-center">
          <div className="w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            No hay APIs públicas aún
          </h3>
          <p className="text-slate-400 mb-6">
            Crea tu primera API pública para exponerla a terceros
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto transition-colors font-semibold"
          >
            <Plus className="w-5 h-5" />
            Nueva API Pública
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedPublicAPIs.map((group) => (
            <div key={group.project?.id || 'sin-proyecto'} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-700 bg-slate-800/50">
                <div className="flex items-center gap-3">
                  {group.project ? (
                    <>
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: group.project.color + '40' }}
                      >
                        <FolderOpen
                          className="w-4 h-4"
                          style={{ color: group.project.color }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{group.project.name}</h3>
                        {group.project.description && (
                          <p className="text-sm text-slate-400">{group.project.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 bg-slate-700 rounded-lg flex items-center justify-center">
                        <FolderOpen className="w-4 h-4 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-white">Sin Proyecto</h3>
                    </>
                  )}
                  <div className="px-3 py-1 bg-slate-700 rounded-full">
                    <span className="text-sm font-medium text-slate-300">{group.publicAPIs.length}</span>
                  </div>
                  {!showForm && group.project && (
                    <button
                      onClick={() => {
                        localStorage.setItem('tempProjectId', group.project!.id);
                        setShowForm(true);
                      }}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Crear API
                    </button>
                  )}
                </div>
              </div>
              <div className="p-6">
                <PublicAPIList
                  publicAPIs={group.publicAPIs}
                  apis={apis}
                  onDelete={handleDeleteClick}
                  onToggleActive={handleToggleActive}
                  onEdit={handleEdit}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {deleteConfirm && (
        <ConfirmDialog
          title="Eliminar API Pública"
          message={`¿Estás seguro de eliminar la API pública "${deleteConfirm.name}"? Esta acción no se puede deshacer y la API dejará de estar disponible públicamente.`}
          confirmText="Eliminar"
          cancelText="Cancelar"
          confirmVariant="danger"
          onConfirm={handleConfirmDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

      <ToastContainer />
    </div>
  );
}
