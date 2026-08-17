import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Sparkles, Send, Volume2, AlertCircle } from 'lucide-react';
import { SAMPLE_QUERIES, type SampleQuery } from '../services/msmarcoDataset';
import { SpeechToTextService } from '../services/sttService';

interface HeroVoiceMicProps {
  onSendMessage: (query: string, isVoice?: boolean) => void;
  isLoading: boolean;
}

export const HeroVoiceMic: React.FC<HeroVoiceMicProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  const handleToggleVoice = async () => {
    if (isRecording) {
      // Stop recording
      SpeechToTextService.stopListening();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);

      if (voiceInterimText.trim()) {
        const finalVoice = voiceInterimText.trim();
        setInputText(finalVoice);
        onSendMessage(finalVoice, true);
        setVoiceInterimText('');
      }
    } else {
      // Start recording
      setVoiceError(null);
      setVoiceInterimText('');
      setRecordingSeconds(0);

      try {
        const started = SpeechToTextService.startBrowserListening(
          (interim) => setVoiceInterimText(interim),
          (finalText) => {
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
            setRecordingSeconds(0);
            if (finalText.trim()) {
              setInputText(finalText);
              onSendMessage(finalText, true);
              setVoiceInterimText('');
            }
          },
          (err) => {
            console.warn('Voice recognition error:', err);
            setVoiceError(err);
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        );

        if (started) {
          setIsRecording(true);
          timerRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
        } else {
          setVoiceError('Browser Speech Recognition not available. Use text box below or click a sample question.');
        }
      } catch (err: any) {
        setVoiceError(err.message || 'Microphone error');
      }
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    onSendMessage(inputText.trim(), false);
    setInputText('');
    setVoiceInterimText('');
  };

  const handleSelectSample = (sample: SampleQuery) => {
    setInputText(sample.query);
    onSendMessage(sample.query, false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center justify-center my-6 space-y-6 text-center">
      {/* Voice Status & Subtitle */}
      <div className="space-y-1">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 text-xs font-semibold shadow-lg shadow-cyan-500/10">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>HH-GOA Voice RAG Engine</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-teal-200 to-amber-300">
          {isRecording ? 'Listening to your Voice...' : 'Tap the Mic & Ask Anything'}
        </h2>
        <p className="text-xs text-gray-400 max-w-md mx-auto">
          Grounded on AI4Bharat MSMARCO-XI dataset passages. Speak in English or Indic languages!
        </p>
      </div>

      {/* BIG CENTERED MICROPHONE ORB (HH-GOA THEME) */}
      <div className="relative flex items-center justify-center my-4">
        {/* Animated Sonar Rings when Recording */}
        {isRecording && (
          <>
            <span className="absolute w-44 h-44 rounded-full bg-cyan-500/20 animate-ping"></span>
            <span className="absolute w-56 h-56 rounded-full bg-teal-500/15 animate-pulse [animation-duration:1.5s]"></span>
            <span className="absolute w-64 h-64 rounded-full bg-amber-500/10 animate-pulse [animation-duration:2s]"></span>
          </>
        )}

        {/* Ambient Glow Aura when Idle */}
        {!isRecording && (
          <div className="absolute w-36 h-36 rounded-full bg-gradient-to-r from-cyan-500/20 via-teal-500/20 to-amber-500/20 blur-xl animate-pulse"></div>
        )}

        {/* Main Big Mic Button */}
        <button
          onClick={handleToggleVoice}
          disabled={isLoading}
          className={`relative z-10 w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-2xl ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 text-white shadow-rose-500/50 border-4 border-rose-300/40 animate-pulse'
              : 'bg-gradient-to-tr from-cyan-600 via-teal-600 to-emerald-500 text-white shadow-cyan-500/40 border-4 border-cyan-300/30 hover:border-cyan-200'
          }`}
          title={isRecording ? 'Stop Recording' : 'Click to Speak'}
        >
          {isRecording ? (
            <MicOff className="w-10 h-10 sm:w-12 sm:h-12 text-white animate-bounce" />
          ) : (
            <Mic className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-md" />
          )}

          <span className="mt-1 text-[11px] font-extrabold uppercase tracking-wider text-white/90">
            {isRecording ? `${recordingSeconds}s Stop` : 'Push to Talk'}
          </span>
        </button>
      </div>

      {/* Voice Error Notice */}
      {voiceError && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-center gap-2 max-w-md mx-auto">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{voiceError}</span>
          <button onClick={() => setVoiceError(null)} className="text-xs underline text-rose-400">
            Dismiss
          </button>
        </div>
      )}

      {/* Live Interim Voice Transcript */}
      {isRecording && (
        <div className="p-3 rounded-2xl glass-panel border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-center space-x-3 max-w-lg mx-auto shadow-lg animate-pulse">
          <Volume2 className="w-4 h-4 text-cyan-400 animate-bounce" />
          <span className="font-mono">
            {voiceInterimText || 'Speak clearly into your microphone...'}
          </span>
        </div>
      )}

      {/* Text Input Dock directly under Mic */}
      <form onSubmit={handleSubmit} className="w-full max-w-2xl px-2">
        <div className="relative glass-panel rounded-2xl border border-cyan-500/30 focus-within:border-cyan-400 shadow-xl overflow-hidden flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Or type a question (e.g. What is Transformer architecture?)"
            disabled={isLoading}
            className="w-full py-3.5 pl-4 pr-14 bg-transparent text-sm text-gray-100 placeholder-gray-400 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-xl text-white transition ${
              !inputText.trim() || isLoading
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-tr from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 shadow-md shadow-cyan-500/30'
            }`}
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Quick Prompt Chips */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-2xl px-2">
        <span className="text-[11px] font-semibold text-gray-400 mr-1">Quick Prompts:</span>
        {SAMPLE_QUERIES.slice(0, 5).map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full text-[11px] font-medium bg-dark-800/80 hover:bg-cyan-950/60 text-gray-300 hover:text-cyan-200 border border-gray-700/70 hover:border-cyan-500/40 transition"
          >
            {sample.category}: "{sample.query.substring(0, 24)}..."
          </button>
        ))}
      </div>
    </div>
  );
};
