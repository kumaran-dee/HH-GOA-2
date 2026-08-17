import React from 'react';
import { Trash2, Waves } from 'lucide-react';

interface ChatHeaderProps {
  onClearChat: () => void;
  messageCount: number;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onClearChat,
  messageCount,
}) => {
  return (
    <header className="w-full border-b border-white/5 px-6 py-4">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        {/* Simple Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Waves className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">HH-GOA</h1>
            <p className="text-[11px] text-gray-400">MSMARCO-XI Dataset Grounded</p>
          </div>
        </div>

        {/* Clear Chat Button */}
        {messageCount > 0 && (
          <button
            onClick={onClearChat}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/5 transition"
            title="Clear Chat"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </header>
  );
};
