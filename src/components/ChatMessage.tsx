import React, { useState } from 'react';
import { Bot, User, Volume2, VolumeX, Copy, Check, ChevronDown, ChevronUp, BookOpen, AlertTriangle, Sparkles, Clock, CheckCircle2 } from 'lucide-react';
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
  const [showCitations, setShowCitations] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);
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
      <div className="flex items-start space-x-3 max-w-4xl mx-auto my-4 animate-pulse">
        <div className="w-8 h-8 rounded-xl bg-indigo-600/30 flex items-center justify-center text-indigo-400 border border-indigo-500/40">
          <Bot className="w-4 h-4 animate-spin" />
        </div>
        <div className="glass-panel p-4 rounded-2xl border border-indigo-500/20 text-xs text-indigo-300 flex items-center space-x-3">
          <div className="flex space-x-1">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
          </div>
          <span className="font-medium">Retrieving passages from MSMARCO-XI dataset & synthesizing grounded answer...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-start space-x-3 max-w-4xl mx-auto my-4 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}>
      {/* Avatar */}
      <div
        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-md ${
          isBot
            ? 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white border border-indigo-400/30'
            : 'bg-dark-700 text-indigo-300 border border-gray-700'
        }`}
      >
        {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      {/* Message Box */}
      <div className={`flex-1 space-y-3 max-w-2xl ${isBot ? '' : 'items-end'}`}>
        {/* Header Metadata */}
        <div className={`flex items-center space-x-2 text-[11px] text-gray-400 ${isBot ? '' : 'justify-end'}`}>
          <span className="font-semibold text-gray-300">{isBot ? 'MSMARCO Assistant' : 'You'}</span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-gray-500" />
            {message.timestamp}
          </span>
          {message.isVoiceInput && (
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-medium">
              🎙️ Voice Query
            </span>
          )}
        </div>

        {/* Bubble Content */}
        <div
          className={`p-4 sm:p-5 rounded-2xl border text-sm leading-relaxed ${
            isBot
              ? message.ragOutput?.refused
                ? 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                : 'glass-panel border-indigo-500/20 text-gray-100 shadow-xl'
              : 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none'
          }`}
        >
          {/* Refusal / Off-topic Banner */}
          {isBot && message.ragOutput?.refused && (
            <div className="mb-3 p-2.5 rounded-xl bg-rose-900/40 border border-rose-500/40 flex items-center space-x-2 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{message.ragOutput.refusalReason || 'Off-Topic or Refused query.'}</span>
            </div>
          )}

          {/* Text Output */}
          <p className="whitespace-pre-wrap">{message.text}</p>

          {/* Bot Action Bar (TTS & Copy) */}
          {isBot && !message.ragOutput?.refused && (
            <div className="mt-4 pt-3 border-t border-gray-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                {/* Voice Listen Button */}
                <button
                  onClick={toggleSpeak}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold border transition ${
                    isSpeaking
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                      : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200'
                  }`}
                  title="Listen to synthesized voice response"
                >
                  {isSpeaking ? (
                    <>
                      <VolumeX className="w-3.5 h-3.5" />
                      <span>Stop Voice</span>
                      <span className="flex space-x-0.5 ml-1">
                        <span className="w-1 h-3 bg-rose-400 animate-bounce"></span>
                        <span className="w-1 h-3 bg-rose-400 animate-bounce [animation-delay:0.1s]"></span>
                        <span className="w-1 h-3 bg-rose-400 animate-bounce [animation-delay:0.2s]"></span>
                      </span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>🔊 Listen Answer</span>
                    </>
                  )}
                </button>

                {/* Copy Text */}
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-gray-800 border border-gray-700 text-gray-300 transition"
                  title="Copy text"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              {/* Confidence badge */}
              {message.ragOutput?.confidence !== undefined && (
                <div className="flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-[11px]">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Groundedness: {(message.ragOutput.confidence * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* RAG Dataset Citations Accordion */}
        {isBot && message.ragOutput && message.ragOutput.citations.length > 0 && (
          <div className="glass-panel rounded-xl border border-indigo-500/20 overflow-hidden">
            <button
              onClick={() => setShowCitations(!showCitations)}
              className="w-full px-4 py-2.5 bg-dark-800/80 hover:bg-dark-800 flex items-center justify-between text-xs font-semibold text-gray-200 transition"
            >
              <span className="flex items-center space-x-1.5 text-indigo-300">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Retrieved MSMARCO-XI Citations ({message.ragOutput.citations.length})</span>
              </span>
              {showCitations ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showCitations && (
              <div className="p-3 space-y-2.5 bg-dark-900/60 border-t border-gray-800/80">
                {message.ragOutput.citations.map((citation, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-dark-800/90 border border-gray-700/60 space-y-1 hover:border-indigo-500/40 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-indigo-300 truncate max-w-[280px]">
                        {citation.title}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                        Similarity: {(citation.similarityScore * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-400 font-mono">
                      Section: {citation.section}
                    </div>
                    <p className="text-xs text-gray-300 italic pt-1 border-t border-gray-800">
                      "{citation.snippet}"
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Reasoning Trace Toggle */}
        {isBot && message.ragOutput && message.ragOutput.reasoningSteps.length > 0 && (
          <div className="text-xs">
            <button
              onClick={() => setShowReasoning(!showReasoning)}
              className="text-[11px] font-mono text-gray-400 hover:text-indigo-300 flex items-center space-x-1 transition"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>{showReasoning ? 'Hide RAG Pipeline Trace' : 'View RAG Pipeline Trace'}</span>
            </button>

            {showReasoning && (
              <ul className="mt-2 p-3 rounded-lg bg-dark-950 border border-gray-800 space-y-1 font-mono text-[11px] text-gray-400">
                {message.ragOutput.reasoningSteps.map((step, i) => (
                  <li key={i} className="flex items-start space-x-1.5">
                    <span className="text-indigo-400 font-bold">›</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
