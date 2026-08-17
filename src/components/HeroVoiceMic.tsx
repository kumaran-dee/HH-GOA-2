import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send } from 'lucide-react';
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
    <div className="w-full max-w-xl mx-auto flex flex-col items-center my-6 space-y-6 text-center">
      {/* Title */}
      <h2 className="text-lg sm:text-xl font-semibold text-gray-200">
        {isRecording ? 'Listening...' : 'Ask a Question with Voice or Text'}
      </h2>

      {/* BIG CENTERED MIC BUTTON */}
      <div className="relative flex items-center justify-center">
        {/* Soft Pulse when recording */}
        {isRecording && (
          <>
            <span className="absolute w-36 h-36 rounded-full bg-cyan-500/20 animate-ping"></span>
            <span className="absolute w-48 h-48 rounded-full bg-cyan-500/10 animate-pulse"></span>
          </>
        )}

        <button
          onClick={handleToggleVoice}
          disabled={isLoading}
          className={`relative z-10 w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl ${
            isRecording
              ? 'bg-gradient-to-tr from-rose-500 to-pink-600 text-white shadow-rose-500/40 animate-pulse'
              : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-cyan-500/30'
          }`}
          title={isRecording ? 'Stop Recording' : 'Click to Speak'}
        >
          {isRecording ? (
            <MicOff className="w-9 h-9" />
          ) : (
            <Mic className="w-9 h-9" />
          )}
          <span className="mt-1 text-[10px] font-semibold tracking-wide uppercase opacity-90">
            {isRecording ? `${recordingSeconds}s Stop` : 'Voice'}
          </span>
        </button>
      </div>

      {/* Interim Speech Preview */}
      {isRecording && (
        <div className="text-xs text-cyan-300 italic font-mono animate-pulse">
          "{voiceInterimText || 'Listening to your speech...'}"
        </div>
      )}

      {/* Clean Input Box */}
      <form onSubmit={handleSubmit} className="w-full">
        <div className="relative glass-panel rounded-2xl border border-white/10 focus-within:border-cyan-500/50 shadow-lg overflow-hidden flex items-center">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your question here..."
            disabled={isLoading}
            className="w-full py-3 pl-4 pr-12 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`absolute right-2 p-2 rounded-xl transition ${
              !inputText.trim() || isLoading
                ? 'text-gray-600 cursor-not-allowed'
                : 'text-cyan-400 hover:text-cyan-200'
            }`}
            title="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>

      {/* Simple Sample Questions */}
      <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
        {SAMPLE_QUERIES.slice(0, 4).map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="px-3 py-1 rounded-full text-xs bg-white/5 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition"
          >
            {sample.query}
          </button>
        ))}
      </div>
    </div>
  );
};
