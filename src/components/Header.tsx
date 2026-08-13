import React from 'react';
import { Mic, ShieldCheck, BarChart3, Layers, Settings, Zap } from 'lucide-react';
import type { STTProvider } from '../services/sttService';

interface HeaderProps {
  activeTab: 'rag' | 'chunking' | 'harness' | 'analytics';
  setActiveTab: (tab: 'rag' | 'chunking' | 'harness' | 'analytics') => void;
  sttProvider: STTProvider;
  onOpenSettings: () => void;
  datasetCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  sttProvider,
  onOpenSettings,
  datasetCount,
}) => {
  return (
    <header className="sticky top-0 z-50 border-b border-indigo-500/20 bg-dark-900/80 backdrop-blur-xl px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Title */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-500 shadow-lg shadow-indigo-500/30">
            <Mic className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">
                Voice RAG System
              </h1>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-400" /> Sub-200ms Engine
              </span>
            </div>
            <p className="text-xs text-gray-400">
              ai4bharat/MSMARCO-XI Dataset • Multi-Chunking • Latency Analytics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center p-1 rounded-xl bg-dark-800/80 border border-gray-800 text-sm">
          <button
            onClick={() => setActiveTab('rag')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all text-xs md:text-sm ${
              activeTab === 'rag'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
            title="Voice RAG Studio — Speak or ask questions"
          >
            <Mic className="w-4 h-4" />
            <span>Voice RAG Studio</span>
          </button>

          <button
            onClick={() => setActiveTab('chunking')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all text-xs md:text-sm ${
              activeTab === 'chunking'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
            title="Chunking Workbench — Compare splitting algorithms"
          >
            <Layers className="w-4 h-4" />
            <span>Chunking Workbench</span>
          </button>

          <button
            onClick={() => setActiveTab('harness')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all text-xs md:text-sm ${
              activeTab === 'harness'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
            title="Harness & Guardrails — Test safety refusal rules"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Guardrails</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg transition-all text-xs md:text-sm ${
              activeTab === 'analytics'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-600/30 font-medium'
                : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
            }`}
            title="Latency Analytics — P50 / P70 / P100 benchmark charts"
          >
            <BarChart3 className="w-4 h-4" />
            <span>P50/P100 Analytics</span>
          </button>
        </nav>

        {/* System Badges & Controls */}
        <div className="flex items-center space-x-3">
          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span>{datasetCount} Passages Ready</span>
          </div>

          <div className="text-xs px-2.5 py-1 rounded-lg bg-indigo-900/40 border border-indigo-500/30 text-indigo-200 uppercase font-mono tracking-wider">
            STT: {sttProvider}
          </div>

          <button
            onClick={onOpenSettings}
            className="p-2 rounded-lg bg-dark-800 hover:bg-indigo-600/20 border border-gray-700 hover:border-indigo-500/40 text-gray-300 hover:text-white transition"
            title="Configure ElevenLabs / Sarvam STT API Keys"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
