import { ArrowRight, Database, RefreshCw } from 'lucide-react';

interface ProxyModeConfigProps {
  proxyMode: 'direct' | 'post_process' | 'fetch_and_forward';
  postProcessApiId: string;
  apis: Array<{ id: string; name: string }>;
  onChange: (mode: 'direct' | 'post_process' | 'fetch_and_forward', apiId: string) => void;
}

export function ProxyModeConfig({ proxyMode, postProcessApiId, apis, onChange }: ProxyModeConfigProps) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-medium text-white mb-3">Proxy Mode</h3>

        <div className="space-y-2">
          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="proxy_mode"
              value="direct"
              checked={proxyMode === 'direct'}
              onChange={(e) => onChange(e.target.value as any, '')}
              className="text-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                <ArrowRight className="w-4 h-4 text-blue-400" />
                Direct Proxy (Simple)
              </div>
              <p className="text-xs text-slate-400">
                Gateway receives request → Calls target API → Returns response directly
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Client → Gateway → Target API → Client
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="proxy_mode"
              value="post_process"
              checked={proxyMode === 'post_process'}
              onChange={(e) => onChange(e.target.value as any, postProcessApiId)}
              className="text-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                <Database className="w-4 h-4 text-green-400" />
                Post-Process (Advanced)
              </div>
              <p className="text-xs text-slate-400">
                Gateway receives request → Calls target API → Forwards result to another API → Returns final response
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Client → Gateway → Target API → Internal API → Client
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg cursor-pointer hover:bg-slate-800/70 transition-colors">
            <input
              type="radio"
              name="proxy_mode"
              value="fetch_and_forward"
              checked={proxyMode === 'fetch_and_forward'}
              onChange={(e) => onChange(e.target.value as any, '')}
              className="text-blue-500"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium text-white mb-1">
                <RefreshCw className="w-4 h-4 text-purple-400" />
                Fetch and Forward (Sync Mode)
              </div>
              <p className="text-xs text-slate-400">
                Gateway fetches data from source API → Forwards that data to target API → Returns target response
              </p>
              <div className="mt-2 text-xs text-slate-500 font-mono">
                Cron/Client → Gateway → Source API (GET) → Target API (POST) → Client
              </div>
              <div className="mt-2 bg-purple-500/10 border border-purple-500/20 rounded px-2 py-1">
                <p className="text-xs text-purple-300">
                  <strong>Perfect for:</strong> Scheduled syncs, data migration, automatic polling
                </p>
              </div>
            </div>
          </label>
        </div>
      </div>

      {proxyMode === 'post_process' && (
        <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700">
          <label className="block text-sm font-medium text-white mb-2">
            Post-Process API
          </label>
          <select
            value={postProcessApiId}
            onChange={(e) => onChange(proxyMode, e.target.value)}
            className="w-full bg-slate-700 text-white rounded-lg px-4 py-2 text-sm"
          >
            <option value="">Select API to process the response...</option>
            {apis.map(api => (
              <option key={api.id} value={api.id}>
                {api.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-400 mt-2">
            This API will receive the target API's response and process it before returning to the client.
            The body sent will be: <code className="text-blue-400">{'{ original_request, target_response }'}</code>
          </p>
        </div>
      )}

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-300 space-y-2">
        <p className="font-medium">Use Cases:</p>
        <ul className="list-disc list-inside space-y-1 text-amber-400/80">
          <li><strong>Direct:</strong> Simple API proxy, webhook receiver, public API gateway</li>
          <li><strong>Post-Process:</strong> Data enrichment, validation, transformation, multi-step workflows</li>
          <li><strong>Fetch and Forward:</strong> Scheduled syncs, data replication, automated data migration</li>
        </ul>
        <p className="text-amber-400/60 mt-2">
          <strong>Examples:</strong><br/>
          • Direct: Receive Stripe webhook → Forward to your billing system<br/>
          • Post-Process: Get weather data → Translate → Cache → Return to client<br/>
          • Fetch and Forward: Every hour, get users from System A → Sync to System B
        </p>
      </div>
    </div>
  );
}
