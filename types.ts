export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'SYSTEM' | 'PLANNER' | 'SELENIUM' | 'FAISS' | 'GEMINI' | 'AUTH' | 'MCP';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ResearchResult {
  summary: string;
  highlights: string[];
  markdown: string;
  sources: GroundingSource[];
  generatedImage?: string;
  audioData?: string; // Base64 encoded PCM audio
  videoUri?: string; // Veo generated video
}

export interface ResearchSession {
  id: string;
  timestamp: string;
  query: string;
  result: ResearchResult;
}

export interface UserProfile {
  username: string;
  faceIdHash: string; // Simulated hash
  createdAt: string;
  history: ResearchSession[];
}

export enum AppState {
  LOCKED = 'LOCKED',
  IDLE = 'IDLE',
  RESEARCHING = 'RESEARCHING',
  COMPLETE = 'COMPLETE'
}

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    aistudio?: AIStudio;
  }
}