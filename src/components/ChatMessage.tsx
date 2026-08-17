import React, { useState } from 'react';
import { Bot, User, Volume2, VolumeX, Copy, Check, ChevronDown, ChevronUp, BookOpen, Sparkles } from 'lucide-react';
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
      <div className="flex items-start space-x-3 my-3 max-w-2xl mx-auto animate-slide-up">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 to-teal-400 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
          <Bot className="w-4 h-4 animate-spin" />
        </div>
        <div className="p-3.5 rounded-2xl glass-panel text-xs text-cyan-200 flex items-center space-x-2">
          <div className="flex space-x-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:0.3s]"></span>
          </div>
          <span className="font-medium">Searching MSMARCO-XI database & generating answer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 my-3 max-w-2xl mx-auto animate-slide-up ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-xs shadow-md transition-transform hover:scale-110 ${
          isBot ? 'bg-gradient-to-tr from-cyan-500 to-teal-400 shadow-cyan-500/30' : 'bg-dark-700 border border-gray-700'
        }`}
      >
        {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
      </div>

      {/* Message Content */}
      <div className="flex-1 space-y-2">
        <div
          className={`p-4 rounded-2xl text-sm leading-relaxed shadow-lg transition-all duration-300 ${
            isBot
              ? 'glass-panel text-gray-100 border border-cyan-500/20 hover:border-cyan-500/40'
              : 'bg-gradient-to-r from-cyan-600 via-teal-600 to-emerald-600 text-white rounded-tr-none shadow-cyan-500/20'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Bot Actions Bar */}
          {isBot && (
            <div className="mt-3 pt-2.5 border-t border-white/10 flex items-center justify-between text-xs">
              <div className="flex items-center space-x-3">
                {/* Voice Listen Button with Audio Visualizer */}
                <button
                  onClick={toggleSpeak}
                  className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition ${
                    isSpeaking
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                  }`}
                  title="Listen to synthesized voice response"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                      <span className="flex items-end space-x-0.5 ml-1 h-3">
                        <span className="w-0.5 bg-rose-400 eq-bar [animation-delay:0s]"></span>
                        <span className="w-0.5 bg-rose-400 eq-bar [animation-delay:0.2s]"></span>
                        <span className="w-0.5 bg-rose-400 eq-bar [animation-delay:0.4s]"></span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>🔊 Listen</span>
                    </>
                  )}
                </button>

                {/* Copy Text */}
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 text-gray-400 hover:text-gray-200 transition"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Source Citations Toggle */}
              {message.ragOutput && message.ragOutput.citations.length > 0 && (
                <button
                  onClick={() => setShowCitations(!showCitations)}
                  className="flex items-center space-x-1 text-gray-400 hover:text-cyan-300 transition text-xs font-medium"
                >
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sources ({message.ragOutput.citations.length})</span>
                  {showCitations ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Expandable Citations */}
        {isBot && showCitations && message.ragOutput && message.ragOutput.citations.length > 0 && (
          <div className="p-3 rounded-xl bg-dark-950/90 border border-cyan-500/20 space-y-2 text-xs animate-slide-up">
            {message.ragOutput.citations.map((c, i) => (
              <div key={i} className="p-2 rounded bg-white/5 space-y-1">
                <div className="flex items-center justify-between font-semibold text-cyan-300">
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-amber-400" /> {c.title}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-mono">
                    Match: {(c.similarityScore * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-gray-300 italic text-[11px]">"{c.snippet}"</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
