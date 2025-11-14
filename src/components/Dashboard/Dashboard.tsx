import { useState, useEffect } from 'react';
import { Activity, Link2, FileText, TrendingUp, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { useAuth } from '../../contexts/AuthContext';

type API = Database['public']['Tables']['apis']['Row'];
type Integration = Database['public']['Tables']['integrations']['Row'];
type RequestLog = Database['public']['Tables']['request_logs']['Row'];
type HealthCheck = Database['public']['Tables']['health_checks']['Row'];

interface DashboardStats {
  totalAPIs: number;
  activeAPIs: number;
  totalIntegrations: number;
  activeIntegrations: number;
  totalRequests: number;
  successRate: number;
  avgResponseTime: number;
  healthyAPIs: number;
}

export function Dashboard() {
  const { user, externalUser } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalAPIs: 0,
    activeAPIs: 0,
    totalIntegrations: 0,
    activeIntegrations: 0,
    totalRequests: 0,
    successRate: 0,
    avgResponseTime: 0,
    healthyAPIs: 0
  });
  const [recentLogs, setRecentLogs] = useState<RequestLog[]>([]);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [apis, setApis] = useState<API[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 10000);
    return () => clearInterval(interval);
  }, [user, externalUser]);

  const loadDashboardData = async () => {
    const userId = externalUser?.id || user?.id;
    if (!userId) return;

    if (initialLoad) {
      setLoading(true);
    }

    const [
      { data: apisData },
      { data: integrationsData },
      { data: logsData },
      { data: healthData }
    ] = await Promise.all([
      supabase.from('apis').select('*').eq('user_id', userId),
      supabase.from('integrations').select('*').eq('user_id', userId),
      supabase.from('request_logs').select('*').order('created_at', { ascending: false }).limit(100),
      supabase.from('health_checks').select('*').order('checked_at', { ascending: false })
    ]);

    if (apisData) setApis(apisData);
    if (integrationsData) setIntegrations(integrationsData);
    if (logsData) setRecentLogs(logsData.slice(0, 10));

    const totalAPIs = apisData?.length || 0;
    const activeAPIs = apisData?.filter(api => api.is_active).length || 0;
    const totalIntegrations = integrationsData?.length || 0;
    const activeIntegrations = integrationsData?.filter(int => int.is_active).length || 0;
    const totalRequests = logsData?.length || 0;

    const successfulRequests = logsData?.filter(
      log => log.response_status && log.response_status >= 200 && log.response_status < 400
    ).length || 0;
    const successRate = totalRequests > 0 ? (successfulRequests / totalRequests) * 100 : 0;

    const logsWithTime = logsData?.filter(log => log.response_time_ms) || [];
    const avgResponseTime = logsWithTime.length > 0
      ? logsWithTime.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / logsWithTime.length
      : 0;

    const latestHealthPerAPI = new Map<string, HealthCheck>();
    healthData?.forEach(health => {
      if (!latestHealthPerAPI.has(health.api_id)) {
        latestHealthPerAPI.set(health.api_id, health);
      }
    });

    const healthyAPIs = Array.from(latestHealthPerAPI.values()).filter(
      h => h.status === 'healthy'
    ).length;

    setStats({
      totalAPIs,
      activeAPIs,
      totalIntegrations,
      activeIntegrations,
      totalRequests,
      successRate,
      avgResponseTime: Math.round(avgResponseTime),
      healthyAPIs
    });

    if (initialLoad) {
      setInitialLoad(false);
    }
    setLoading(false);
  };

  const StatCard = ({ icon: Icon, label, value, color, subtitle }: {
    icon: any;
    label: string;
    value: string | number;
    color: string;
    subtitle?: string;
  }) => (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
      {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
    </div>
  );

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
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-slate-400 mt-1">Overview of your API Gateway system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Activity}
          label="Total APIs"
          value={stats.totalAPIs}
          color="bg-blue-600"
          subtitle={`${stats.activeAPIs} active`}
        />
        <StatCard
          icon={Link2}
          label="Integrations"
          value={stats.totalIntegrations}
          color="bg-green-600"
          subtitle={`${stats.activeIntegrations} active`}
        />
        <StatCard
          icon={FileText}
          label="Total Requests"
          value={stats.totalRequests}
          color="bg-purple-600"
        />
        <StatCard
          icon={TrendingUp}
          label="Success Rate"
          value={`${stats.successRate.toFixed(1)}%`}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-600/20 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Healthy APIs</p>
              <p className="text-2xl font-bold text-white">{stats.healthyAPIs}/{stats.totalAPIs}</p>
            </div>
          </div>
          <div className="h-2 bg-slate-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600 transition-all"
              style={{ width: `${stats.totalAPIs > 0 ? (stats.healthyAPIs / stats.totalAPIs) * 100 : 0}%` }}
            />
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Avg Response Time</p>
              <p className="text-2xl font-bold text-white">{stats.avgResponseTime}ms</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Based on last 100 requests</p>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-red-600/20 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <p className="text-slate-400 text-sm">Failed Requests</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalRequests - Math.round(stats.totalRequests * stats.successRate / 100)}
              </p>
            </div>
          </div>
          <p className="text-xs text-slate-500">4xx and 5xx errors</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Recent Activity</h3>
          </div>
          <div className="p-4">
            {recentLogs.length > 0 ? (
              <div className="space-y-2">
                {recentLogs.slice(0, 5).map((log) => (
                  <div key={log.id} className="bg-slate-900 rounded-lg p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`text-xs font-mono px-2 py-1 rounded ${
                        log.response_status && log.response_status >= 200 && log.response_status < 400
                          ? 'bg-green-600/20 text-green-400'
                          : 'bg-red-600/20 text-red-400'
                      }`}>
                        {log.method}
                      </span>
                      <span className="text-sm text-slate-300 font-mono truncate">{log.path}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {log.response_time_ms && (
                        <span className="text-xs text-slate-500">{log.response_time_ms}ms</span>
                      )}
                      <span className="text-xs text-slate-600">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No activity yet</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-6 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">Active Integrations</h3>
          </div>
          <div className="p-4">
            {integrations.filter(i => i.is_active).length > 0 ? (
              <div className="space-y-2">
                {integrations.filter(i => i.is_active).slice(0, 5).map((integration) => {
                  const sourceAPI = apis.find(api => api.id === integration.source_api_id);
                  const targetAPI = apis.find(api => api.id === integration.target_api_id);
                  return (
                    <div key={integration.id} className="bg-slate-900 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{integration.name}</span>
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span className="truncate">{sourceAPI?.name}</span>
                        <span>→</span>
                        <span className="truncate">{targetAPI?.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <Link2 className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No active integrations</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
