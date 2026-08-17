import React, { useState } from 'react';
import { Bot, User, Volume2, VolumeX, Copy, Check, ChevronDown, ChevronUp, BookOpen } from 'lucide-react';
import type { StructuredRAGOutput } from '../services/modelHarness';

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  isVoiceInput?: boolean;
  timestamp: string;
  ragOutput?: StructuredRAGOutput;
  isLoading?: boolean;
}

interface ChatMessageProps {
  message: ChatMessageItem;
  currentlySpeakingId: string | null;
  onStartSpeak: (messageId: string, text: string) => void;
  onStopSpeak: () => void;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  currentlySpeakingId,
  onStartSpeak,
  onStopSpeak,
}) => {
  const [showCitations, setShowCitations] = useState(false);
  const [copied, setCopied] = useState(false);

  const isBot = message.sender === 'bot';
  const isSpeaking = currentlySpeakingId === message.id;

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSpeak = () => {
    if (isSpeaking) {
      onStopSpeak();
    } else {
      onStartSpeak(message.id, message.text);
    }
  };

  if (message.isLoading) {
    return (
      <div className="flex items-start space-x-3 my-3 max-w-2xl mx-auto">
        <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
          <Bot className="w-4 h-4 animate-spin" />
        </div>
        <div className="p-3 rounded-2xl glass-panel text-xs text-gray-300">
          Thinking...
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 my-3 max-w-2xl mx-auto ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
      {/* Simple Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs ${
          isBot ? 'bg-gradient-to-tr from-cyan-500 to-teal-400' : 'bg-dark-700 border border-gray-700'
        }`}
      >
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-2">
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed ${
            isBot
              ? 'glass-panel text-gray-100'
              : 'bg-gradient-to-r from-cyan-600 to-teal-500 text-white rounded-tr-none'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Simple Bot Bar */}
          {isBot && (
            <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                {/* Voice Listen */}
                <button
                  onClick={toggleSpeak}
                  className={`flex items-center space-x-1 transition ${
                    isSpeaking ? 'text-rose-400 animate-pulse font-semibold' : 'text-cyan-400 hover:text-cyan-300'
                  }`}
                  title="Listen to answer"
                >
                  {isSpeaking ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  <span>{isSpeaking ? 'Stop Voice' : 'Listen'}</span>
                </button>

                {/* Copy */}
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-gray-400 hover:text-gray-200 transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Simple Source Toggle */}
              {message.ragOutput && message.ragOutput.citations.length > 0 && (
                <button
                  onClick={() => setShowCitations(!showCitations)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-cyan-300 transition text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Sources ({message.ragOutput.citations.length})</span>
                  {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expandable Citations */}
        {isBot && showCitations && message.ragOutput && message.ragOutput.citations.length > 0 && (
          <div className="p-3 rounded-xl bg-dark-950/80 border border-white/5 space-y-2 text-xs">
            {message.ragOutput.citations.map((c, i) => (
              <div key={i} className="space-y-0.5">
                <span className="font-semibold text-cyan-300">{c.title}</span>
                <p className="text-gray-400 italic text-[11px]">"{c.snippet}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
