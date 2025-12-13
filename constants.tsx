import React from 'react';
import { Database, Search, Cpu, Globe } from 'lucide-react';

export const TECH_STACK = [
  { name: 'Gemini 2.5 Flash', icon: <Cpu className="w-4 h-4" />, color: 'text-blue-400' },
  { name: 'Selenium WebDriver', icon: <Globe className="w-4 h-4" />, color: 'text-yellow-400' },
  { name: 'FAISS Vector DB', icon: <Database className="w-4 h-4" />, color: 'text-pink-400' },
  { name: 'DuckDuckGo', icon: <Search className="w-4 h-4" />, color: 'text-orange-400' },
];