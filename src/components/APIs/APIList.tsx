import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Globe, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Database } from '../../lib/database.types';
import { APIForm } from './APIForm';
import { useAuth } from '../../contexts/AuthContext';

type API = Database['public']['Tables']['apis']['Row'];
type APISecurity = Database['public']['Tables']['api_security']['Row'];

interface APIWithSecurity extends API {
  security?: APISecurity;
}

export function APIList() {
  const { user, externalUser } = useAuth();
  const [apis, setApis] = useState<APIWithSecurity[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAPI, setEditingAPI] = useState<API | null>(null);

  useEffect(() => {
    loadAPIs();
  }, [user, externalUser]);

  const loadAPIs = async () => {
    const userId = externalUser?.id || user?.id;
    console.log('APIList - Loading APIs for userId:', userId);
    console.log('APIList - externalUser:', externalUser);
    console.log('APIList - user:', user);

    if (!userId) {
      console.log('APIList - No userId found, returning');
      return;
    }

    if (initialLoad) {
      setLoading(true);
    }
    const { data: apisData, error: apisError } = await supabase
      .from('apis')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log('APIList - APIs loaded:', apisData);
    console.log('APIList - Error:', apisError);

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
    if (!confirm('Are you sure you want to delete this API?')) return;

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
          <h2 className="text-2xl font-bold text-white">APIs</h2>
          <p className="text-slate-400 mt-1">Manage your API configurations</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add API
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {apis.map((api) => (
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
              {api.description || 'No description'}
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

      {apis.length === 0 && (
        <div className="text-center py-12 bg-slate-800 rounded-xl border border-slate-700">
          <Globe className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-white mb-2">No APIs yet</h3>
          <p className="text-slate-400 mb-4">Start by adding your first API configuration</p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl inline-flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add API
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
