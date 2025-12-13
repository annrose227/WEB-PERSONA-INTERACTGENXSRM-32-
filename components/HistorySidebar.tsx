import React from 'react';
import { ResearchSession } from '../types';
import { History, Search, ArrowRight, Clock } from 'lucide-react';

interface HistorySidebarProps {
  sessions: ResearchSession[];
  onSelectSession: (session: ResearchSession) => void;
  isOpen: boolean;
}

const HistorySidebar: React.FC<HistorySidebarProps> = ({ sessions, onSelectSession, isOpen }) => {
  if (!isOpen) return null;

  return (
    <div className="w-80 h-full border-l border-slate-800 bg-slate-900/50 backdrop-blur-sm flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-800 flex items-center space-x-2">
         <History className="w-4 h-4 text-cyan-500" />
         <span className="text-sm font-bold text-slate-200 uppercase tracking-wider">Mission History</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2 scrollbar-hide">
        {sessions.length === 0 ? (
           <div className="text-center py-10 px-4">
              <Clock className="w-10 h-10 text-slate-800 mx-auto mb-3" />
              <p className="text-xs text-slate-500">No previous research missions found in this profile.</p>
           </div>
        ) : (
          sessions.map((session) => (
            <button 
              key={session.id}
              onClick={() => onSelectSession(session)}
              className="w-full text-left p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-all group"
            >
               <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] font-mono text-slate-500">{session.timestamp}</span>
                  <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100" />
               </div>
               <p className="text-xs font-semibold text-slate-300 line-clamp-2 group-hover:text-white">
                 {session.query}
               </p>
               <div className="mt-2 flex items-center gap-1 text-[10px] text-cyan-600/70">
                  <Search className="w-3 h-3" />
                  <span>{session.result.sources.length} Sources</span>
               </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
};

export default HistorySidebar;