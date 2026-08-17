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
    <div className="w-full max-w-2xl mx-auto px-4 py-2 space-y-2">
      {/* Sample Question Chips Bar */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {SAMPLE_QUERIES.slice(0, 5).map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            disabled={isLoading}
            className="shrink-0 px-3 py-1 rounded-full text-xs bg-white/5 hover:bg-cyan-500/10 text-gray-300 hover:text-cyan-300 border border-white/5 hover:border-cyan-500/30 transition"
          >
            {sample.query}
          </button>
        ))}
      </div>

      {/* Interim Voice Preview */}
      {isRecording && (
        <div className="text-xs text-center text-cyan-300 font-mono italic animate-pulse py-1">
          🎙️ "{voiceInterimText || `Listening (${recordingSeconds}s)...`}"
        </div>
      )}

      {/* Chatbot Prompt Bar with Embedded Big Mic */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative w-full glass-panel rounded-2xl border border-white/10 focus-within:border-cyan-500/50 shadow-2xl flex items-center p-1.5 space-x-2">
          {/* Big Voice Mic Orb Button */}
          <button
            type="button"
            onClick={handleToggleVoice}
            disabled={isLoading}
            className={`relative shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 shadow-md ${
              isRecording
                ? 'bg-rose-500 text-white animate-pulse shadow-rose-500/50'
                : 'bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-500 text-white shadow-cyan-500/30 hover:scale-105'
            }`}
            title={isRecording ? 'Stop Recording' : 'Speak Question'}
          >
            {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* Text Input Field */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask a question or speak..."
            disabled={isLoading}
            className="flex-1 py-2 px-2 bg-transparent text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className={`p-2.5 rounded-xl transition ${
              !inputText.trim() || isLoading
                ? 'text-gray-600 cursor-not-allowed'
                : 'bg-cyan-500 hover:bg-cyan-400 text-dark-950 font-bold shadow-md shadow-cyan-500/20'
            }`}
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};
