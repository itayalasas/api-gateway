import { useState, useEffect } from 'react';
import { Activity, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useProject } from '../../contexts/ProjectContext';

type API = Database['public']['Tables']['apis']['Row'];
type HealthCheck = Database['public']['Tables']['health_checks']['Row'];

interface APIWithHealth extends API {
  latestHealth?: HealthCheck;
}

export function HealthMonitor() {
  const { selectedProject } = useProject();
  const [apis, setApis] = useState<APIWithHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [selectedProject]);

  const loadData = async () => {
    if (initialLoad) {
      setLoading(true);
    }

    let apisQuery = supabase.from('apis').select('*').order('name');

    if (selectedProject) {
      apisQuery = apisQuery.eq('project_id', selectedProject.id);
    }

    const { data: apisData } = await apisQuery;

    if (apisData) {
      const apisWithHealth = await Promise.all(
        apisData.map(async (api) => {
          const { data: healthData } = await supabase
            .from('health_checks')
            .select('*')
            .eq('api_id', api.id)
            .order('checked_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...api,
            latestHealth: healthData || undefined
          };
        })
      );

      setApis(apisWithHealth);
    }

    if (initialLoad) {
      setInitialLoad(false);
    }
    setLoading(false);
  };

  const checkHealth = async (api: API) => {
    setChecking(api.id);

    try {
      const startTime = Date.now();
      const response = await fetch(api.base_url, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      const responseTime = Date.now() - startTime;

      await supabase.from('health_checks').insert({
        api_id: api.id,
        status: response.ok ? 'healthy' : 'unhealthy',
        response_time_ms: responseTime,
        status_code: response.status,
        error_message: response.ok ? null : `HTTP ${response.status}`
      });
    } catch (error) {
      await supabase.from('health_checks').insert({
        api_id: api.id,
        status: 'unhealthy',
        response_time_ms: null,
        status_code: null,
        error_message: error instanceof Error ? error.message : 'Connection failed'
      });
    }

    setChecking(null);
    loadData();
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-400';
      case 'unhealthy':
        return 'text-red-400';
      default:
        return 'text-slate-400';
    }
  };

  const getStatusBg = (status?: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-600/20 border-green-600/30';
      case 'unhealthy':
        return 'bg-red-600/20 border-red-600/30';
      default:
        return 'bg-slate-700 border-slate-600';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'unhealthy':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  if (initialLoad && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Health Monitoring</h2>
          <p className="text-slate-400 mt-1">Monitor API health and performance</p>
        </div>
        <button
          onClick={loadData}
          className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apis.map((api) => (
          <div
            key={api.id}
            className={`border rounded-xl p-6 transition-all ${getStatusBg(api.latestHealth?.status)}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  api.type === 'published' ? 'bg-green-600/20' : 'bg-blue-600/20'
                }`}>
                  <Activity className={`w-5 h-5 ${
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
              {getStatusIcon(api.latestHealth?.status)}
            </div>

            <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
              <p className="text-xs text-slate-500 mb-1">Base URL</p>
              <p className="text-sm text-slate-300 font-mono truncate">{api.base_url}</p>
            </div>

            {api.latestHealth ? (
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Status</span>
                  <span className={`text-sm font-medium capitalize ${getStatusColor(api.latestHealth.status)}`}>
                    {api.latestHealth.status}
                  </span>
                </div>

                {api.latestHealth.response_time_ms && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Response Time</span>
                    <span className="text-sm text-white font-medium">
                      {api.latestHealth.response_time_ms}ms
                    </span>
                  </div>
                )}

                {api.latestHealth.status_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-400">Status Code</span>
                    <span className="text-sm text-white font-medium">
                      {api.latestHealth.status_code}
                    </span>
                  </div>
                )}

                {api.latestHealth.error_message && (
                  <div>
                    <span className="text-sm text-slate-400">Error</span>
                    <p className="text-sm text-red-400 mt-1 break-words">
                      {api.latestHealth.error_message}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400">Last Check</span>
                  <span className="text-sm text-slate-300">
                    {new Date(api.latestHealth.checked_at).toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
                <p className="text-sm text-slate-400 text-center">No health checks yet</p>
              </div>
            )}

            <button
              onClick={() => checkHealth(api)}
              disabled={checking === api.id || !api.is_active}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
            >
              {checking === api.id ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4" />
                  Run Health Check
                </>
              )}
            </button>

            {!api.is_active && (
              <p className="text-xs text-slate-500 text-center mt-2">
                API is inactive
              </p>
            )}
          </div>
        ))}
      </div>

      {apis.length === 0 && (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <Activity className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No APIs to monitor</h3>
          <p className="text-slate-400">Add APIs in the APIs section to start monitoring</p>
        </div>
      )}
    </div>
  );
}
