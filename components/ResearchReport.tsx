import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { GroundingSource } from '../types';
import { 
  FileText, 
  Link as LinkIcon, 
  ExternalLink, 
  Image as ImageIcon, 
  Youtube, 
  Lightbulb, 
  ChevronDown, 
  ChevronUp,
  LayoutDashboard,
  Play,
  Pause,
  Volume2,
  Video,
  Loader2
} from 'lucide-react';

interface ResearchReportProps {
  markdown: string;
  sources: GroundingSource[];
  highlights?: string[];
  summary?: string;
  generatedImage?: string;
  audioData?: string; // Base64 PCM
  videoUri?: string;
  onGenerateVideo?: () => void;
  isGeneratingVideo?: boolean;
}

const ResearchReport: React.FC<ResearchReportProps> = ({ 
  markdown, 
  sources, 
  highlights = [], 
  summary = "Research completed.",
  generatedImage,
  audioData,
  videoUri,
  onGenerateVideo,
  isGeneratingVideo = false
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);

  // Helper to extract domain for favicon
  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  };

  const heroImage = generatedImage || (markdown.match(/!\[.*?\]\((.*?)\)/)?.[1]);

  // Audio Processing Logic
  const playAudio = async () => {
    if (!audioData) return;

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    const ctx = audioContextRef.current;
    
    if (isPlaying) {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current = null;
        }
        setIsPlaying(false);
        return;
    }

    try {
        setIsPlaying(true);
        const binaryString = atob(audioData);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const dataInt16 = new Int16Array(bytes.buffer);
        const frameCount = dataInt16.length;
        const buffer = ctx.createBuffer(1, frameCount, 24000);
        const channelData = buffer.getChannelData(0);
        
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.onended = () => setIsPlaying(false);
        
        sourceNodeRef.current = source;
        source.start();

    } catch (e) {
        console.error("Audio playback error", e);
        setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
        }
        if (audioContextRef.current) {
            audioContextRef.current.close();
        }
    };
  }, []);

  return (
    <div className="bg-slate-900/40 border border-slate-700/50 rounded-xl shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col">
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* HEADER & SUMMARY SECTION */}
      <div className="p-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-cyan-500/20 to-blue-600/20 p-3 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                <LayoutDashboard className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
                <h2 className="text-2xl font-bold text-white tracking-tight">Executive Intelligence</h2>
                <p className="text-xs text-slate-400 font-mono mt-1 uppercase tracking-wider">
                Extracted via Model Context Protocol
                </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {audioData && (
                <button 
                  onClick={playAudio}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                      isPlaying 
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 animate-pulse' 
                      : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-cyan-500 hover:text-cyan-400'
                  }`}
                >
                   {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                   <span className="text-xs font-bold uppercase">{isPlaying ? 'Playing...' : 'Audio Brief'}</span>
                   {!isPlaying && <Volume2 className="w-3 h-3 opacity-50" />}
                </button>
            )}
            
            {onGenerateVideo && (
               <button 
                 onClick={onGenerateVideo}
                 disabled={isGeneratingVideo || !!videoUri}
                 className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${
                    videoUri
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isGeneratingVideo
                    ? 'bg-purple-900/20 border-purple-500/50 text-purple-400 cursor-wait'
                    : 'bg-slate-800 border-slate-600 text-slate-300 hover:border-purple-500 hover:text-purple-400'
                 }`}
               >
                 {isGeneratingVideo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                 <span className="text-xs font-bold uppercase">
                    {videoUri ? 'Video Ready' : isGeneratingVideo ? 'Simulating...' : 'Sign Language Video'}
                 </span>
               </button>
            )}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
           {/* Left: Summary & Highlights */}
           <div className="flex-1 space-y-6">
              <div className="bg-slate-800/30 p-5 rounded-lg border border-slate-700/50">
                 <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide mb-2 flex items-center">
                    <FileText className="w-4 h-4 mr-2 text-cyan-500" /> Summary
                 </h3>
                 <p className="text-slate-300 leading-relaxed text-lg font-light">
                   {summary}
                 </p>
              </div>

              {videoUri && (
                <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 animate-in fade-in zoom-in duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <Video className="w-4 h-4 text-purple-400" />
                        <span className="text-xs font-mono text-purple-400 uppercase tracking-widest">Sign Language Simulation (Veo)</span>
                    </div>
                    <video 
                        src={videoUri} 
                        controls 
                        className="w-full rounded-lg shadow-lg border border-slate-800 bg-black"
                        playsInline
                    />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlights.map((point, idx) => (
                  <div key={idx} className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 rounded-lg border border-slate-700/50 hover:border-cyan-500/30 transition-colors flex items-start">
                    <Lightbulb className="w-5 h-5 text-yellow-400 mr-3 shrink-0 mt-0.5" />
                    <span className="text-sm text-slate-300 font-medium">{point}</span>
                  </div>
                ))}
              </div>
           </div>

           {/* Right: Visual Context */}
           <div className="lg:w-1/3 shrink-0">
              <div className="h-full min-h-[200px] bg-slate-950 rounded-lg border border-slate-800 overflow-hidden relative group">
                {heroImage ? (
                  <img src={heroImage} alt="Research Visual" className="w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600 bg-slate-900/50">
                     <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                     <span className="text-xs font-mono uppercase tracking-widest">Visual Context Unavailable</span>
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-4">
                  <p className="text-xs text-cyan-400 font-mono uppercase">Analyzed Media</p>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* ACTION BAR */}
      <div className="px-8 py-4 border-t border-b border-slate-700/50 bg-slate-900/20 flex items-center justify-between">
         <div className="text-xs text-slate-500 font-mono">
           {sources.length} Verified Sources Found
         </div>
         <button 
           onClick={() => setShowDetails(!showDetails)}
           className="flex items-center space-x-2 bg-cyan-600/10 hover:bg-cyan-600/20 text-cyan-400 px-4 py-2 rounded-lg border border-cyan-500/20 transition-all text-sm font-semibold"
         >
            {showDetails ? (
              <><span>Hide Analysis</span> <ChevronUp className="w-4 h-4" /></>
            ) : (
              <><span>Read Detailed Analysis</span> <ChevronDown className="w-4 h-4" /></>
            )}
         </button>
      </div>

      {/* DETAILED REPORT (Collapsible) */}
      {showDetails && (
        <div className="p-8 bg-slate-950/30 animate-in slide-in-from-top-4 fade-in duration-300">
           <h3 className="text-xl font-bold text-white mb-6 flex items-center">
             <FileText className="w-5 h-5 mr-3 text-cyan-500" />
             Detailed Report
           </h3>
           <div className="prose prose-invert prose-sm md:prose-base max-w-none text-slate-300 prose-headings:font-bold prose-headings:text-slate-100 prose-a:text-cyan-400 prose-a:no-underline hover:prose-a:underline prose-strong:text-cyan-200">
            <ReactMarkdown
              components={{
                h1: ({node, ...props}) => (
                  <div className="relative mt-8 mb-6 pb-2 border-b border-slate-700/50">
                    <h1 className="text-2xl font-bold text-white" {...props} />
                  </div>
                ),
                h2: ({node, ...props}) => <h2 className="text-lg text-white mt-8 mb-4 font-bold" {...props} />,
                ul: ({node, ...props}) => <ul className="space-y-2 my-4 list-disc pl-5" {...props} />,
                li: ({node, ...props}) => <li className="text-slate-300 pl-1" {...props} />,
                table: ({node, ...props}) => (
                  <div className="my-6 overflow-hidden rounded-lg border border-slate-700/50 shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-left border-collapse bg-slate-800/20" {...props} />
                    </div>
                  </div>
                ),
                thead: ({node, ...props}) => <thead className="bg-slate-800/80" {...props} />,
                th: ({node, ...props}) => <th className="p-3 text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-700" {...props} />,
                td: ({node, ...props}) => <td className="p-3 border-b border-slate-700/50 text-sm text-slate-300" {...props} />,
                img: ({node, ...props}) => (
                   <div className="my-6">
                      <img className="rounded-lg border border-slate-700 shadow-lg max-w-full h-auto" {...props} alt={props.alt || 'Visual'} />
                      {props.alt && <p className="text-xs text-slate-500 mt-2 italic">{props.alt}</p>}
                   </div>
                ),
                a: ({node, href, children, ...props}) => {
                    const isYoutube = href?.includes('youtube.com') || href?.includes('youtu.be');
                    if (isYoutube) {
                        return (
                            <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-red-400 hover:text-red-300 transition-colors bg-red-900/10 px-2 py-0.5 rounded border border-red-900/20">
                                <Youtube className="w-3 h-3" />
                                <span>{children}</span>
                            </a>
                        );
                    }
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:text-cyan-300 transition-colors underline decoration-cyan-500/30 underline-offset-4" {...props}>{children}</a>
                }
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* SOURCES GRID */}
      {sources.length > 0 && (
        <div className="p-8 pt-0 mt-6">
          <div className="flex items-center space-x-2 mb-4">
             <LinkIcon className="w-4 h-4 text-cyan-500" />
             <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Source Context</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {sources.map((source, index) => {
              const domain = getDomain(source.uri);
              const faviconUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
              
              return (
                <a 
                  key={index} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center p-3 bg-slate-800/40 rounded-lg hover:bg-slate-800 border border-slate-700/50 hover:border-cyan-500/30 transition-all group"
                >
                  <img 
                    src={faviconUrl} 
                    alt="" 
                    className="w-4 h-4 mr-3 opacity-70 group-hover:opacity-100 grayscale group-hover:grayscale-0 transition-all"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} 
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-slate-300 truncate group-hover:text-cyan-400 transition-colors">
                      {source.title || domain}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate font-mono">
                      {domain}
                    </div>
                  </div>
                  <ExternalLink className="w-3 h-3 text-slate-600 group-hover:text-cyan-500 transition-colors ml-2" />
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ResearchReport;