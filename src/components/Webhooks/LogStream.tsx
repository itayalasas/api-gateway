import { useEffect, useRef, useState } from 'react';
import { ChevronRight, Terminal, Circle } from 'lucide-react';
import { Database as DB } from '../../lib/database.types';

type RequestLog = DB['public']['Tables']['request_logs']['Row'];

interface LogStreamProps {
  logs: RequestLog[];
  onLogClick: (logId: string) => void;
  expandedLog: string | null;
}

export function LogStream({ logs, onLogClick, expandedLog }: LogStreamProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const prevLogsLength = useRef(logs.length);

  useEffect(() => {
    if (autoScroll && containerRef.current && logs.length > prevLogsLength.current) {
      // Nuevo log llegó, hacer scroll
      const container = containerRef.current;
      const lastLog = container.lastElementChild;
      if (lastLog) {
        lastLog.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
    prevLogsLength.current = logs.length;
  }, [logs, autoScroll]);

  const handleScroll = () => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    const isAtBottom = Math.abs(scrollHeight - clientHeight - scrollTop) < 50;

    setAutoScroll(isAtBottom);
  };

  const getStatusColor = (status: number | null) => {
    if (!status) return 'text-slate-500';
    if (status >= 200 && status < 300) return 'text-green-400';
    if (status >= 400 && status < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBg = (status: number | null) => {
    if (!status) return 'bg-slate-700/50';
    if (status >= 200 && status < 300) return 'bg-green-900/30 border-green-700/50';
    if (status >= 400 && status < 500) return 'bg-yellow-900/30 border-yellow-700/50';
    return 'bg-red-900/30 border-red-700/50';
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  if (logs.length === 0) {
    return (
      <div className="bg-slate-950 rounded-lg border border-slate-800 p-12 text-center">
        <Terminal className="w-16 h-16 text-slate-700 mx-auto mb-4" />
        <p className="text-slate-500 text-lg font-medium">Esperando peticiones...</p>
        <p className="text-slate-600 text-sm mt-2">Los logs aparecerán aquí en tiempo real</p>
        <div className="flex items-center justify-center gap-2 mt-4">
          <Circle className="w-2 h-2 text-green-500 animate-pulse" />
          <span className="text-xs text-slate-600 font-mono">LIVE</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Header tipo terminal */}
      <div className="bg-slate-900 border border-slate-800 rounded-t-lg px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-mono text-slate-400">REQUEST LOGS</span>
          <div className="flex items-center gap-1.5">
            <Circle className={`w-1.5 h-1.5 ${autoScroll ? 'text-green-500 animate-pulse' : 'text-slate-600'}`} />
            <span className={`text-[10px] font-mono ${autoScroll ? 'text-green-500' : 'text-slate-600'}`}>
              {autoScroll ? 'LIVE' : 'PAUSED'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
          <span>{logs.length} ENTRIES</span>
        </div>
      </div>

      {/* Contenedor de logs con scroll */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="bg-slate-950 border-x border-slate-800 max-h-[600px] overflow-y-auto custom-scrollbar"
      >
        {/* Logs en orden inverso (más reciente arriba) */}
        {[...logs].reverse().map((log, index) => {
          const isExpanded = expandedLog === log.id;
          const isFirst = index === logs.length - 1;

          return (
            <div
              key={log.id}
              className={`border-b border-slate-800/50 hover:bg-slate-900/30 transition-colors ${isFirst ? 'animate-fade-in' : ''}`}
            >
              {/* Log entry principal */}
              <div
                onClick={() => onLogClick(log.id)}
                className="px-4 py-2.5 cursor-pointer font-mono text-xs flex items-center gap-3 group"
              >
                {/* Status badge */}
                <div className={`flex-shrink-0 px-2 py-0.5 rounded border ${getStatusBg(log.response_status)}`}>
                  <span className={`font-bold ${getStatusColor(log.response_status)}`}>
                    {log.response_status || '⋯'}
                  </span>
                </div>

                {/* Method */}
                <span className={`font-semibold flex-shrink-0 ${
                  log.method === 'POST' ? 'text-blue-400' :
                  log.method === 'GET' ? 'text-green-400' :
                  log.method === 'PUT' ? 'text-yellow-400' :
                  log.method === 'DELETE' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {log.method?.padEnd(6) || 'UNKNOWN'}
                </span>

                {/* Path */}
                <span className="text-slate-400 flex-1 truncate">
                  {log.path || '/'}
                </span>

                {/* Response time */}
                {log.response_time_ms !== null && (
                  <span className={`flex-shrink-0 ${
                    log.response_time_ms < 100 ? 'text-green-500' :
                    log.response_time_ms < 500 ? 'text-yellow-500' :
                    'text-red-500'
                  }`}>
                    {log.response_time_ms}ms
                  </span>
                )}

                {/* Timestamp */}
                <span className="text-slate-600 flex-shrink-0">
                  {formatTimestamp(log.created_at)}
                </span>

                {/* Expand indicator */}
                <ChevronRight
                  className={`w-4 h-4 text-slate-600 group-hover:text-slate-400 transition-all flex-shrink-0 ${
                    isExpanded ? 'rotate-90' : ''
                  }`}
                />
              </div>

              {/* Detalles expandidos */}
              {isExpanded && (
                <div className="bg-slate-900/50 border-t border-slate-800/50 px-4 py-3 space-y-3 animate-slide-down">
                  {/* Transaction Notice */}
                  <div className="bg-blue-900/10 border border-blue-700/30 rounded px-3 py-2 flex items-start gap-2">
                    <Circle className="w-3 h-3 text-blue-500 mt-0.5 animate-pulse flex-shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-blue-400 uppercase">Transacción HTTP Completa</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Este registro contiene el <span className="text-blue-400 font-semibold">Request</span> enviado
                        y la <span className="text-green-400 font-semibold">Response</span> recibida en una única transacción.
                      </p>
                    </div>
                  </div>

                  {/* Request Body */}
                  {log.request_body && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-semibold text-blue-400">→ REQUEST ENVIADO</span>
                        <div className="h-px flex-1 bg-slate-800"></div>
                      </div>
                      <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{JSON.stringify(log.request_body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Arrow separator */}
                  <div className="flex items-center justify-center py-1">
                    <div className="flex items-center gap-2 text-slate-600">
                      <div className="h-px w-16 bg-slate-700"></div>
                      <span className="text-lg">⟳</span>
                      <div className="h-px w-16 bg-slate-700"></div>
                    </div>
                  </div>

                  {/* Response Body */}
                  {log.response_body && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-semibold text-green-400">← RESPONSE RECIBIDO</span>
                        <div className="h-px flex-1 bg-slate-800"></div>
                      </div>
                      <pre className="bg-slate-950 border border-slate-800 rounded p-3 text-[11px] text-slate-300 overflow-x-auto leading-relaxed">
{JSON.stringify(log.response_body, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* Error Message */}
                  {log.error_message && (
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-mono font-semibold text-red-400">ERROR</span>
                        <div className="h-px flex-1 bg-slate-800"></div>
                      </div>
                      <div className="bg-red-950/30 border border-red-900/50 rounded p-3 text-[11px] text-red-300 leading-relaxed">
                        {log.error_message}
                      </div>
                    </div>
                  )}

                  {/* Metadata */}
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-mono font-semibold text-slate-500">METADATA DE LA TRANSACCIÓN</span>
                      <div className="h-px flex-1 bg-slate-800"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5">
                        <span className="text-slate-600">Transaction ID:</span>
                        <span className="text-slate-400 ml-2 font-mono">{log.request_id?.slice(0, 8) || 'N/A'}...</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5">
                        <span className="text-slate-600">Method:</span>
                        <span className="text-slate-400 ml-2 font-mono">{log.method}</span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5">
                        <span className="text-slate-600">Status:</span>
                        <span className={`ml-2 font-mono ${getStatusColor(log.response_status)}`}>
                          {log.response_status || 'N/A'}
                        </span>
                      </div>
                      <div className="bg-slate-950 border border-slate-800 rounded px-2 py-1.5">
                        <span className="text-slate-600">Duración Total:</span>
                        <span className="text-slate-400 ml-2 font-mono">
                          {log.response_time_ms ? `${log.response_time_ms}ms` : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="bg-slate-900 border border-slate-800 rounded-b-lg px-4 py-1.5 flex items-center justify-between text-[10px] text-slate-600 font-mono">
        <span>
          {autoScroll ? '● Auto-scroll enabled' : '○ Scroll to bottom to resume'}
        </span>
        <span>
          Last update: {logs.length > 0 ? formatTimestamp(logs[0].created_at) : 'N/A'}
        </span>
      </div>
    </div>
  );
}
