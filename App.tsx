import React, { useState, useCallback } from "react";
import {
  AppState,
  LogEntry,
  ResearchResult,
  UserProfile,
  ResearchSession,
} from "./types";
import FaceAuth from "./components/FaceAuth";
import LogTerminal from "./components/LogTerminal";
import ResearchReport from "./components/ResearchReport";
import HistorySidebar from "./components/HistorySidebar";
import {
  planResearch,
  executeResearch,
  generateSignLanguageVideo,
} from "./services/geminiService";
import { TECH_STACK } from "./constants";
import {
  Play,
  RotateCw,
  Cpu,
  Search,
  History as HistoryIcon,
  LogOut,
  UserCircle,
  X,
  ChevronLeft,
  PanelRightOpen,
  Globe,
  Sparkles,
  Command,
  BrainCircuit,
} from "lucide-react";

const App: React.FC = () => {
  // Widget State - Start open in extension context
  const [isWidgetOpen, setIsWidgetOpen] = useState(true);

  // App Logic State
  const [appState, setAppState] = useState<AppState>(AppState.LOCKED);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [query, setQuery] = useState("");
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [useDeepThink, setUseDeepThink] = useState(false);

  // Video Generation State
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  const addLog = useCallback((log: LogEntry) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  const handleAuthSuccess = (authenticatedUser: UserProfile) => {
    setUser(authenticatedUser);
    setAppState(AppState.IDLE);
    addLog({
      id: "init-1",
      timestamp: new Date().toLocaleTimeString(),
      source: "AUTH",
      message: `Biometric confirmed. Neural link established with agent ${authenticatedUser.username}.`,
      type: "success",
    });
  };

  const logout = () => {
    setUser(null);
    setResult(null);
    setLogs([]);
    setAppState(AppState.LOCKED);
  };

  const saveToHistory = (queryText: string, resultData: ResearchResult) => {
    if (!user) return;

    const newSession: ResearchSession = {
      id: Math.random().toString(36).substring(7),
      timestamp:
        new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
      query: queryText,
      result: resultData,
    };

    const updatedUser = {
      ...user,
      history: [newSession, ...user.history],
    };

    setUser(updatedUser);
    localStorage.setItem("webpersona_user", JSON.stringify(updatedUser));
  };

  const loadSession = (session: ResearchSession) => {
    setQuery(session.query);
    setResult(session.result);
    setAppState(AppState.COMPLETE);
    setLogs([
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        source: "SYSTEM",
        message: `Restored historical session: ${session.id}`,
        type: "info",
      },
    ]);
    setShowHistory(false);
  };

  const handleGenerateVideo = async () => {
    if (!result || !result.summary) return;

    setIsGeneratingVideo(true);
    try {
      const videoUri = await generateSignLanguageVideo(result.summary, addLog);
      if (videoUri) {
        setResult((prev) => (prev ? { ...prev, videoUri } : null));
      }
    } catch (e) {
      console.error("Video Gen Error", e);
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const startResearch = async () => {
    if (!query.trim()) return;

    setAppState(AppState.RESEARCHING);
    setResult(null);
    setLogs((prev) => [
      ...prev,
      {
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        source: "SYSTEM",
        message: "Initiating autonomous web navigation sequence...",
        type: "info",
      },
    ]);

    try {
      const searchQueries = await planResearch(query, addLog);
      const researchResult = await executeResearch(
        query,
        searchQueries,
        addLog,
        useDeepThink
      );

      setResult(researchResult);
      saveToHistory(query, researchResult);
      setAppState(AppState.COMPLETE);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      addLog({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        source: "SYSTEM",
        message: `Critical Error: ${errorMessage}`,
        type: "error",
      });
      setAppState(AppState.IDLE);
    }
  };

  const reset = () => {
    setQuery("");
    setResult(null);
    setLogs([]);
    setAppState(AppState.IDLE);
    addLog({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      source: "SYSTEM",
      message: "Agent memory cleared. Awaiting new directive.",
      type: "info",
    });
  };

  // ------------------------------------------
  // FLOATING "ORB" TOGGLE (The "Effortless" Entry)
  // ------------------------------------------
  if (!isWidgetOpen) {
    return (
      <div className="fixed bottom-8 right-8 z-50 animate-in fade-in zoom-in duration-500">
        <div
          className="relative group cursor-pointer"
          onClick={() => setIsWidgetOpen(true)}
        >
          {/* Pulsing Aura */}
          <div className="absolute -inset-1 bg-cyan-500 rounded-full blur opacity-40 group-hover:opacity-75 animate-pulse transition-opacity duration-500"></div>

          {/* The Orb */}
          <button className="relative flex items-center justify-center w-16 h-16 bg-slate-900/90 backdrop-blur-sm rounded-full border border-cyan-500/50 shadow-2xl transition-transform duration-300 group-hover:scale-105 overflow-hidden">
            {/* Inner dynamic background */}
            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/20 via-transparent to-purple-900/20"></div>

            <Cpu className="w-8 h-8 text-cyan-400 relative z-10" />

            {/* Notification Dot */}
            <div className="absolute top-3 right-4 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-ping"></div>
            <div className="absolute top-3 right-4 w-2 h-2 bg-emerald-500 rounded-full"></div>
          </button>

          {/* Tooltip Label */}
          <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            <span className="bg-slate-900/90 backdrop-blur text-cyan-50 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-700 shadow-xl">
              Activate WebPersona
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ------------------------------------------
  // GLASSMORPHIC SIDE PANEL
  // ------------------------------------------
  return (
    <div className="fixed top-4 right-4 bottom-4 w-[480px] rounded-2xl bg-slate-950/90 backdrop-blur-xl border border-slate-700/50 shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-10 duration-500 overflow-hidden ring-1 ring-white/10">
      {/* Header */}
      <header className="shrink-0 h-16 bg-gradient-to-r from-slate-900/50 to-transparent border-b border-slate-800/50 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 flex items-center justify-center bg-slate-800 rounded-lg border border-slate-700">
            <Cpu className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-wide text-white">
              WebPersona <span className="text-cyan-400 font-light">OS</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider">
              AUTONOMOUS BROWSING
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {user && (
            <button
              onClick={logout}
              className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
              title="Disconnect"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsWidgetOpen(false)}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-all"
          >
            <PanelRightOpen className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden flex flex-col">
        {appState === AppState.LOCKED ? (
          <FaceAuth onAuthenticated={handleAuthSuccess} />
        ) : (
          /* Authenticated View */
          <div className="flex-1 flex flex-col overflow-hidden relative">
            {/* Tech Stack - Minimalist */}
            <div className="px-6 py-3 border-b border-slate-800/50 bg-slate-900/20 flex gap-2 overflow-x-auto scrollbar-hide">
              {TECH_STACK.map((tech) => (
                <div
                  key={tech.name}
                  className="flex items-center shrink-0 space-x-1.5 px-2 py-1 bg-slate-800/50 rounded-md border border-slate-700/50 hover:border-cyan-500/30 transition-colors"
                >
                  <span className={tech.color}>{tech.icon}</span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {tech.name.split(" ")[0]}
                  </span>
                </div>
              ))}
            </div>

            {/* Dynamic Content Area */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-6 space-y-6">
              {/* Input Module */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl opacity-20 group-hover:opacity-40 transition duration-500 blur"></div>
                <div className="relative bg-slate-900 border border-slate-700 rounded-xl p-1 overflow-hidden">
                  <div className="flex justify-between items-center px-3 py-2 border-b border-slate-800/50">
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Directive
                    </span>
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-[10px] text-slate-500 hover:text-cyan-400 transition-colors"
                    >
                      HISTORY
                    </button>
                  </div>
                  <textarea
                    className="w-full bg-slate-950/50 p-3 text-sm text-white focus:outline-none resize-none h-24 font-light placeholder:text-slate-600"
                    placeholder="Example: Search for the best ergonomic chairs under $500 and create a comparison table..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    disabled={appState === AppState.RESEARCHING}
                  />

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between p-2 bg-slate-900/50">
                    {/* Deep Think Toggle */}
                    <div
                      onClick={() => setUseDeepThink(!useDeepThink)}
                      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition-colors border ${
                        useDeepThink
                          ? "bg-purple-900/20 border-purple-500/50"
                          : "border-transparent hover:bg-slate-800"
                      }`}
                    >
                      <div
                        className={`w-3 h-3 rounded-full border ${
                          useDeepThink
                            ? "bg-purple-500 border-purple-400"
                            : "bg-slate-700 border-slate-600"
                        }`}
                      ></div>
                      <span
                        className={`text-[10px] font-medium ${
                          useDeepThink ? "text-purple-400" : "text-slate-500"
                        }`}
                      >
                        Deep Think
                      </span>
                      {useDeepThink && (
                        <BrainCircuit className="w-3 h-3 text-purple-400" />
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {appState === AppState.COMPLETE && (
                        <button
                          onClick={reset}
                          className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 transition-all"
                          title="Reset"
                        >
                          <RotateCw className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={startResearch}
                        disabled={
                          appState === AppState.RESEARCHING || !query.trim()
                        }
                        className={`flex items-center gap-2 px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-lg ${
                          appState === AppState.RESEARCHING
                            ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                            : "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-900/20"
                        }`}
                      >
                        {appState === AppState.RESEARCHING ? (
                          <>
                            <Cpu className="w-3 h-3 animate-spin" /> Processing
                          </>
                        ) : (
                          <>
                            <Command className="w-3 h-3" /> Execute
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Empty State / Welcome */}
              {appState === AppState.IDLE && !result && (
                <div className="flex flex-col items-center justify-center py-12 text-center opacity-80 animate-in fade-in duration-700">
                  <div className="w-20 h-20 bg-slate-900 rounded-full border border-slate-700 flex items-center justify-center mb-4 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                    <Globe className="w-10 h-10 text-slate-600" />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">
                    Systems Online
                  </h3>
                  <p className="text-sm text-slate-400 max-w-[280px] leading-relaxed">
                    I am ready to navigate the web, extract data, and synthesize
                    reports for you.
                  </p>
                </div>
              )}

              {/* Loading State */}
              {appState === AppState.RESEARCHING && !result && (
                <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl p-6 flex flex-col items-center justify-center gap-4 animate-pulse">
                  <div className="relative">
                    <div className="w-12 h-12 border-2 border-cyan-500/30 rounded-full"></div>
                    <div className="absolute top-0 left-0 w-12 h-12 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-xs text-cyan-400 font-mono tracking-widest uppercase">
                    Agent Working
                  </p>
                  {useDeepThink && (
                    <span className="text-[10px] text-purple-400 bg-purple-900/20 px-2 py-0.5 rounded border border-purple-500/30">
                      Deep Reasoning Active
                    </span>
                  )}
                </div>
              )}

              {/* Results */}
              {result && (
                <div className="animate-in slide-in-from-bottom-10 fade-in duration-500">
                  <ResearchReport
                    markdown={result.markdown}
                    sources={result.sources}
                    highlights={result.highlights}
                    summary={result.summary}
                    generatedImage={result.generatedImage}
                    audioData={result.audioData}
                    videoUri={result.videoUri}
                    onGenerateVideo={handleGenerateVideo}
                    isGeneratingVideo={isGeneratingVideo}
                  />
                </div>
              )}

              {/* Terminal */}
              <div className="shrink-0 mt-auto">
                <LogTerminal logs={logs} />
              </div>
            </div>

            {/* History Overlay */}
            <div
              className={`absolute inset-0 bg-slate-950/95 backdrop-blur-xl z-20 transition-transform duration-300 ${
                showHistory ? "translate-x-0" : "translate-x-full"
              }`}
            >
              <div className="flex items-center p-4 border-b border-slate-800">
                <button
                  onClick={() => setShowHistory(false)}
                  className="p-2 hover:bg-slate-800 rounded-lg transition-colors group"
                >
                  <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-cyan-400" />
                </button>
                <span className="text-sm font-bold ml-2 text-white">
                  Mission Logs
                </span>
              </div>
              <div className="h-full p-2">
                <HistorySidebar
                  isOpen={true}
                  sessions={user?.history || []}
                  onSelectSession={loadSession}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
