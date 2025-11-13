import { useState, useEffect } from 'react';
import { Plus, Play, Square, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { IntegrationForm } from './IntegrationForm';
import { IntegrationFlow } from './IntegrationFlow';

type Integration = Database['public']['Tables']['integrations']['Row'];
type API = Database['public']['Tables']['apis']['Row'];
type APIEndpoint = Database['public']['Tables']['api_endpoints']['Row'];

interface IntegrationWithAPIs extends Integration {
  source_api: API;
  target_api: API;
  source_endpoint?: APIEndpoint;
  target_endpoint?: APIEndpoint;
}

export function IntegrationWorkspace() {
  const [integrations, setIntegrations] = useState<IntegrationWithAPIs[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationWithAPIs | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    if (initialLoad) {
      setLoading(true);
    }

    const [{ data: apisData }, { data: integrationsData }, { data: endpointsData }] = await Promise.all([
      supabase.from('apis').select('*'),
      supabase.from('integrations').select('*'),
      supabase.from('api_endpoints').select('*')
    ]);

    if (apisData) setApis(apisData);

    if (integrationsData && apisData && endpointsData) {
      const integrationsWithAPIs = integrationsData.map(integration => {
        const sourceAPI = apisData.find(api => api.id === integration.source_api_id);
        const targetAPI = apisData.find(api => api.id === integration.target_api_id);
        const sourceEndpoint = endpointsData.find(ep => ep.id === integration.source_endpoint_id);
        const targetEndpoint = endpointsData.find(ep => ep.id === integration.target_endpoint_id);
        return {
          ...integration,
          source_api: sourceAPI!,
          target_api: targetAPI!,
          source_endpoint: sourceEndpoint,
          target_endpoint: targetEndpoint
        };
      }).filter(i => i.source_api && i.target_api);

      setIntegrations(integrationsWithAPIs);
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

  if (loading) {
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Integraciones</h2>
          <p className="text-slate-400 mt-1">Conecta y gestiona integraciones entre endpoints</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
          disabled={apis.length < 2}
        >
          <Plus className="w-5 h-5" />
          Nueva Integración
        </button>
      </div>

      {apis.length < 2 && (
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4">
          <p className="text-yellow-400 text-sm">
            Necesitas al menos 2 APIs configuradas para crear una integración. Ve a la sección APIs para agregarlas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {integrations.map((integration) => (
          <div
            key={integration.id}
            className="bg-slate-800 rounded-xl border border-slate-700 p-6 hover:border-slate-600 transition-all cursor-pointer"
            onClick={() => setSelectedIntegration(integration)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  integration.is_active ? 'bg-green-600/20' : 'bg-slate-700'
                }`}>
                  {integration.is_active ? (
                    <Play className="w-5 h-5 text-green-400" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg">{integration.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded ${
                      integration.is_active
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {integration.is_active ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Origen</p>
                <p className="text-sm font-medium text-white">{integration.source_api.name}</p>
                <p className="text-xs text-slate-400 mt-1">{integration.source_api.application_owner}</p>
                {integration.source_endpoint && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono bg-green-600/20 text-green-400 px-2 py-0.5 rounded">
                      {integration.source_endpoint.method}
                    </span>
                    <span className="text-xs font-mono text-slate-300">{integration.source_endpoint.path}</span>
                  </div>
                )}
              </div>

              <ArrowRight className="w-6 h-6 text-blue-400 flex-shrink-0" />

              <div className="flex-1 bg-slate-900 rounded-lg p-4">
                <p className="text-xs text-slate-500 mb-1">Destino</p>
                <p className="text-sm font-medium text-white">{integration.target_api.name}</p>
                <p className="text-xs text-slate-400 mt-1">{integration.target_api.application_owner}</p>
                {integration.target_endpoint && (
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs font-mono bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded">
                      {integration.target_endpoint.method}
                    </span>
                    <span className="text-xs font-mono text-slate-300">{integration.target_endpoint.path}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleActive(integration);
                }}
                className={`flex-1 px-3 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors ${
                  integration.is_active
                    ? 'bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400'
                    : 'bg-green-600/20 hover:bg-green-600/30 text-green-400'
                }`}
              >
                {integration.is_active ? (
                  <>
                    <Square className="w-4 h-4" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Activar
                  </>
                )}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit(integration);
                }}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Editar
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete(integration.id);
                }}
                className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      {integrations.length === 0 && apis.length >= 2 && (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <ArrowRight className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No integrations yet</h3>
          <p className="text-slate-400 mb-4">Create your first integration to connect APIs</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            New Integration
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
