import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles } from 'lucide-react';
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

  const timerRef = useRef<any>(null);

  const handleToggleVoice = async () => {
    if (isRecording) {
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
          (_err) => {
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
          }
        );

        if (started) {
          setIsRecording(true);
          timerRef.current = setInterval(() => {
            setRecordingSeconds((prev) => prev + 1);
          }, 1000);
        }
      } catch (_err) {
        setIsRecording(false);
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
    <div className="w-full max-w-2xl mx-auto px-4 py-2 space-y-3">
      {/* Sample Question Chips Bar with Smooth Hover Animations */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {SAMPLE_QUERIES.filter(s => !s.isOffTopic).map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1 rounded-full text-xs bg-white/5 hover:bg-cyan-500/15 text-gray-300 hover:text-cyan-200 border border-white/5 hover:border-cyan-500/40 transition-all duration-300 transform hover:scale-105"
          >
            {sample.query}
          </button>
        ))}
      </div>

      {/* Live Voice Interim Transcript Display */}
      {isRecording && (
        <div className="text-xs text-center text-cyan-300 font-mono italic animate-pulse py-1 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          <span>Listening ({recordingSeconds}s)... "{voiceInterimText || 'Speak your question into microphone...'}"</span>
        </div>
      )}

      {/* Main Input Area with BIG ANIMATED VOICE BUTTON */}
      <div className="flex items-center space-x-3">
        {/* PROMINENT BIG VOICE BUTTON */}
        <div className="relative shrink-0">
          {isRecording ? (
            <>
              <span className="absolute -inset-2 rounded-full bg-rose-500/40 animate-ping"></span>
              <span className="absolute -inset-4 rounded-full bg-rose-500/20 animate-pulse"></span>
            </>
          ) : (
            <span className="absolute -inset-1 rounded-full bg-cyan-500/20 animate-pulse"></span>
          )}

          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={isLoading}
            className={`relative z-10 w-16 h-16 sm:w-18 sm:h-18 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-110 active:scale-95 shadow-2xl border-2 ${
              isRecording
                ? 'bg-gradient-to-tr from-rose-600 via-pink-600 to-amber-500 border-rose-300/60 text-white shadow-rose-500/50 animate-pulse'
                : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 border-cyan-300/50 text-white shadow-cyan-500/40 hover:border-cyan-200 animate-pulse-glow'
            }`}
            title={isRecording ? 'Stop Voice Recording' : 'Push to Speak (Voice Input)'}
          >
            {isRecording ? (
              <MicOff className="w-8 h-8 sm:w-9 sm:h-9 text-white animate-bounce" />
            ) : (
              <Mic className="w-8 h-8 sm:w-9 sm:h-9 text-white drop-shadow-md" />
            )}
            <span className="text-[9px] font-extrabold uppercase tracking-wider text-white/95 -mt-0.5">
              {isRecording ? `${recordingSeconds}s` : 'Voice'}
            </span>
          </button>
        </div>

        {/* Text Input Dock beside the Big Mic Button */}
        <form onSubmit={handleSubmit} className="flex-1">
          <div className="relative glass-panel rounded-2xl border border-white/10 focus-within:border-cyan-500/50 shadow-2xl flex items-center p-2 transition-all duration-300">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Ask a question or tap Voice..."
              disabled={isLoading}
              className="w-full py-2 px-3 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
            />

            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2.5 rounded-xl transition-all duration-300 shrink-0 transform active:scale-95 ${
                !inputText.trim() || isLoading
                  ? 'text-gray-600 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-dark-950 font-bold shadow-md shadow-cyan-500/30 hover:scale-105'
              }`}
              title="Send Message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
