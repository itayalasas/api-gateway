import { Plus, Trash2 } from 'lucide-react';

interface QueryParam {
  name: string;
  source: 'url_query' | 'body' | 'header';
  path: string;
  required?: boolean;
  default?: string;
}

interface QueryParamsConfigProps {
  queryParams: QueryParam[];
  onChange: (params: QueryParam[]) => void;
}

export function QueryParamsConfig({ queryParams, onChange }: QueryParamsConfigProps) {
  const addQueryParam = () => {
    onChange([...queryParams, { name: '', source: 'url_query', path: '', required: false }]);
  };

  const removeQueryParam = (index: number) => {
    onChange(queryParams.filter((_, i) => i !== index));
  };

  const updateQueryParam = (index: number, field: keyof QueryParam, value: any) => {
    const updated = [...queryParams];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-white">Query Parameters</h3>
        <button
          type="button"
          onClick={addQueryParam}
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
        >
          <Plus className="w-3 h-3" />
          Add Parameter
        </button>
      </div>

      {queryParams.length === 0 ? (
        <p className="text-xs text-slate-400 italic">
          No query parameters configured. Click "Add Parameter" to add dynamic query params that will be sent to the target API.
        </p>
      ) : (
        <div className="space-y-3">
          {queryParams.map((param, index) => (
            <div key={index} className="bg-slate-800/50 p-3 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Parameter {index + 1}</span>
                <button
                  type="button"
                  onClick={() => removeQueryParam(index)}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Parameter Name</label>
                  <input
                    type="text"
                    value={param.name}
                    onChange={(e) => updateQueryParam(index, 'name', e.target.value)}
                    placeholder="e.g., transaction_id"
                    className="w-full bg-slate-700 text-white rounded px-3 py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Source</label>
                  <select
                    value={param.source}
                    onChange={(e) => updateQueryParam(index, 'source', e.target.value)}
                    className="w-full bg-slate-700 text-white rounded px-3 py-1.5 text-sm"
                  >
                    <option value="url_query">URL Query Param</option>
                    <option value="body">Request Body</option>
                    <option value="header">Header</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">
                    {param.source === 'url_query' ? 'Query Param Name' :
                     param.source === 'body' ? 'JSON Path' : 'Header Name'}
                  </label>
                  <input
                    type="text"
                    value={param.path}
                    onChange={(e) => updateQueryParam(index, 'path', e.target.value)}
                    placeholder={
                      param.source === 'url_query' ? 'id' :
                      param.source === 'body' ? 'data.id' : 'X-Transaction-ID'
                    }
                    className="w-full bg-slate-700 text-white rounded px-3 py-1.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Default Value (optional)</label>
                  <input
                    type="text"
                    value={param.default || ''}
                    onChange={(e) => updateQueryParam(index, 'default', e.target.value)}
                    placeholder="Default value"
                    className="w-full bg-slate-700 text-white rounded px-3 py-1.5 text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`required-${index}`}
                  checked={param.required || false}
                  onChange={(e) => updateQueryParam(index, 'required', e.target.checked)}
                  className="rounded bg-slate-700 border-slate-600"
                />
                <label htmlFor={`required-${index}`} className="text-xs text-slate-400">
                  Required (return error if missing)
                </label>
              </div>

              <div className="bg-slate-900/50 p-2 rounded text-xs text-slate-400 font-mono">
                Will add: <span className="text-green-400">?{param.name}=&lt;value&gt;</span> to target URL
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-blue-300 space-y-2">
        <p className="font-medium">How Query Parameters Work:</p>
        <ul className="list-disc list-inside space-y-1 text-blue-400/80">
          <li><strong>URL Query Param:</strong> Extract from incoming request URL (?id=123)</li>
          <li><strong>Request Body:</strong> Extract from JSON body using path (data.transaction_id)</li>
          <li><strong>Header:</strong> Extract from request headers (X-Transaction-ID)</li>
          <li>Values are automatically added to the target API URL as query parameters</li>
        </ul>
        <p className="text-blue-400/60 mt-2">
          Example: If you configure <code>transaction_id</code> from body path <code>payment.id</code>,
          and the request body contains <code>{'{"payment": {"id": "12345"}}'}</code>,
          the gateway will call the target API with <code>?transaction_id=12345</code>
        </p>
      </div>
    </div>
  );
}
