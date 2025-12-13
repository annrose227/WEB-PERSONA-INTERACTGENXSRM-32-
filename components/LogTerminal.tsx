import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface LogTerminalProps {
  logs: LogEntry[];
}

const LogTerminal: React.FC<LogTerminalProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg font-mono text-[10px] sm:text-xs">
      <div className="bg-slate-800 px-3 py-2 flex items-center space-x-2 border-b border-slate-700 shrink-0">
        <Terminal className="w-3 h-3 text-cyan-400" />
        <span className="text-slate-300 font-semibold tracking-wide uppercase">Live Agent Log</span>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 scrollbar-hide">
        {logs.length === 0 && (
          <div className="text-slate-600 italic p-2">Waiting for input...</div>
        )}
        {logs.map((log) => (
          <div key={log.id} className="flex flex-col sm:flex-row sm:space-x-2 border-b border-slate-800/50 pb-1 last:border-0 last:pb-0">
            <div className="flex space-x-2 shrink-0 items-baseline">
                <span className="text-slate-600 font-light hidden xl:inline-block">[{log.timestamp}]</span>
                <span className={`font-bold w-16 ${
                  log.source === 'PLANNER' ? 'text-purple-400' :
                  log.source === 'SELENIUM' ? 'text-yellow-400' :
                  log.source === 'FAISS' ? 'text-pink-400' :
                  log.source === 'GEMINI' ? 'text-blue-400' :
                  'text-emerald-400'
                }`}>
                  {log.source}
                </span>
            </div>
            <span className="text-slate-300 break-words leading-tight">{log.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogTerminal;