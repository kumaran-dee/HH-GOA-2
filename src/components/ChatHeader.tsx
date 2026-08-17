import React from 'react';
import { Database, Trash2, Mic, ExternalLink, Sparkles, Waves } from 'lucide-react';

interface ChatHeaderProps {
  onClearChat: () => void;
  onOpenDatasetDrawer: () => void;
  datasetCount: number;
  messageCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  onOpenDatasetDrawer,
  datasetCount,
  messageCount,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-dark-950/80 border-b border-cyan-500/20 px-4 py-3 sm:px-6">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Left: HH-GOA Branding & Dataset Status */}
        <div className="flex items-center space-x-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 text-white shadow-lg shadow-cyan-500/25 border border-cyan-300/30">
            <Waves className="w-5 h-5 text-cyan-100" />
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-amber-400 border-2 border-dark-950 rounded-full animate-ping"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-extrabold tracking-tight text-white flex items-center gap-1.5">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-teal-300">
                  HH-GOA 2
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <Sparkles className="w-3 h-3 text-amber-400" /> Voice RAG
                </span>
              </h1>
            </div>
            <p className="text-xs text-gray-400 flex items-center gap-1.5">
              <span>Grounded on:</span>
              <a
                href="https://huggingface.co/datasets/ai4bharat/MSMARCO-XI"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 font-medium transition"
              >
                ai4bharat/MSMARCO-XI <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Dataset Explorer Button */}
          <button
            onClick={onOpenDatasetDrawer}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-dark-800 hover:bg-cyan-950/60 text-gray-200 border border-gray-700/80 hover:border-cyan-500/40 transition"
            title="Inspect MSMARCO-XI Dataset Index"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden md:inline">MSMARCO Index</span>
            <span className="px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] font-mono">
              {datasetCount}
            </span>
          </button>

          {/* Clear Chat Button */}
          {messageCount > 0 && (
            <button
              onClick={onClearChat}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition"
              title="Clear Conversation"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clear</span>
            </button>
          )}

          {/* HH GOA Theme Pill */}
          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-teal-500/10 border border-teal-500/30 text-teal-300 text-xs font-medium">
            <Mic className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Voice Active</span>
          </div>
        </div>
      </div>
    </header>
  );
};
