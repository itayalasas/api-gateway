import { Search, Calendar, Filter, X } from 'lucide-react';
import { useState } from 'react';

export interface LogFilters {
  search: string;
  status: string;
  method: string;
  dateFrom: string;
  dateTo: string;
}

interface LogFiltersProps {
  filters: LogFilters;
  onFiltersChange: (filters: LogFilters) => void;
  totalLogs: number;
  filteredLogs: number;
}

export function LogFiltersComponent({ filters, onFiltersChange, totalLogs, filteredLogs }: LogFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const hasActiveFilters = filters.search || filters.status || filters.method || filters.dateFrom || filters.dateTo;

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      status: '',
      method: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  const updateFilter = (key: keyof LogFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {/* Search bar */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar en path, request, response..."
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        {/* Toggle advanced filters */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
            showAdvanced || hasActiveFilters
              ? 'bg-blue-600 border-blue-500 text-white'
              : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
          }`}
        >
          <Filter className="w-4 h-4" />
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && !showAdvanced && (
            <span className="px-1.5 py-0.5 bg-white/20 rounded text-xs font-bold">
              {Object.values(filters).filter(Boolean).length}
            </span>
          )}
        </button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-400 hover:text-white hover:border-slate-600 transition-colors"
          >
            <X className="w-4 h-4" />
            <span className="text-sm font-medium">Limpiar</span>
          </button>
        )}
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3 animate-slide-down">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Status filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Status Code</label>
              <select
                value={filters.status}
                onChange={(e) => updateFilter('status', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Todos</option>
                <option value="2xx">2xx - Éxito</option>
                <option value="4xx">4xx - Error Cliente</option>
                <option value="5xx">5xx - Error Servidor</option>
                <option value="200">200 - OK</option>
                <option value="201">201 - Created</option>
                <option value="400">400 - Bad Request</option>
                <option value="401">401 - Unauthorized</option>
                <option value="404">404 - Not Found</option>
                <option value="500">500 - Internal Error</option>
              </select>
            </div>

            {/* Method filter */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Método HTTP</label>
              <select
                value={filters.method}
                onChange={(e) => updateFilter('method', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="">Todos</option>
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
              </select>
            </div>

            {/* Date from */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Desde
              </label>
              <input
                type="datetime-local"
                value={filters.dateFrom}
                onChange={(e) => updateFilter('dateFrom', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* Date to */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                <Calendar className="w-3 h-3 inline mr-1" />
                Hasta
              </label>
              <input
                type="datetime-local"
                value={filters.dateTo}
                onChange={(e) => updateFilter('dateTo', e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </div>
      )}

      {/* Results counter */}
      {hasActiveFilters && (
        <div className="flex items-center justify-between text-xs text-slate-500 font-mono px-2">
          <span>
            Mostrando <span className="text-blue-400 font-bold">{filteredLogs}</span> de{' '}
            <span className="text-slate-400">{totalLogs}</span> logs
          </span>
          {filteredLogs === 0 && totalLogs > 0 && (
            <span className="text-yellow-500">No hay resultados con estos filtros</span>
          )}
        </div>
      )}
    </div>
  );
}
