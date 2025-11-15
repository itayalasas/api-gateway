import { useState, useEffect } from 'react';
import { Globe, Plus, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database as DB } from '../../lib/database.types';
import { PublicAPIList } from './PublicAPIList';
import { PublicAPIForm } from './PublicAPIForm';

type Integration = DB['public']['Tables']['integrations']['Row'];
type API = DB['public']['Tables']['apis']['Row'];

export function PublicAPIs() {
  const [publicAPIs, setPublicAPIs] = useState<Integration[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setRefreshing(true);
    try {
      const [integrationsResult, apisResult] = await Promise.all([
        supabase
          .from('integrations')
          .select('*')
          .eq('integration_type', 'public_proxy')
          .order('created_at', { ascending: false }),
        supabase
          .from('apis')
          .select('*')
          .order('name')
      ]);

      if (integrationsResult.data) setPublicAPIs(integrationsResult.data);
      if (apisResult.data) setApis(apisResult.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
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
  }) => {
    const apiKey = generateApiKey();

    const targetAPI = apis.find(api => api.id === data.targetApiId);
    if (!targetAPI) {
      throw new Error('API interna no encontrada');
    }

    // Get the first endpoint of the target API
    const { data: endpoints, error: endpointsError } = await supabase
      .from('api_endpoints')
      .select('*')
      .eq('api_id', data.targetApiId)
      .limit(1);

    if (endpointsError || !endpoints || endpoints.length === 0) {
      throw new Error('La API target no tiene endpoints configurados. Por favor, agrega al menos un endpoint a la API primero.');
    }

    const targetEndpoint = endpoints[0];

    const { error } = await supabase.from('integrations').insert({
      name: data.name,
      description: data.description || '',
      user_id: targetAPI.user_id,
      source_api_id: targetAPI.id,
      target_api_id: data.targetApiId,
      target_endpoint_id: targetEndpoint.id,
      endpoint_path: targetEndpoint.path,
      method: targetEndpoint.method,
      integration_type: 'public_proxy',
      api_key: apiKey,
      is_active: true,
      transform_config: {
        proxy_type: 'public',
        auto_forward: true
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    await loadData();
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta API pública? Esta acción no se puede deshacer.')) {
      return;
    }

    const { error } = await supabase
      .from('integrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting public API:', error);
      alert('Error al eliminar la API pública');
      return;
    }

    await loadData();
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('integrations')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      console.error('Error toggling active status:', error);
      alert('Error al cambiar el estado de la API');
      return;
    }

    await loadData();
  };

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
          onSubmit={handleCreatePublicAPI}
          onCancel={() => setShowForm(false)}
        />
      )}

      <PublicAPIList
        publicAPIs={publicAPIs}
        apis={apis}
        onDelete={handleDelete}
        onToggleActive={handleToggleActive}
      />
    </div>
  );
}
