import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, AlertCircle } from 'lucide-react';
import { SAMPLE_QUERIES, type SampleQuery } from '../services/msmarcoDataset';
import { SpeechToTextService } from '../services/sttService';

interface VoiceChatInputProps {
  onSendMessage: (query: string, isVoice?: boolean) => void;
  isLoading: boolean;
}

export const VoiceChatInput: React.FC<VoiceChatInputProps> = ({
  onSendMessage,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInterimText, setVoiceInterimText] = useState('');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  // Handle Voice Recording Toggle via Web Speech Recognition / SpeechToTextService fallback
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
          setVoiceError('Speech recognition is not supported in this browser. Please type your query.');
        }
      } catch (err: any) {
        setVoiceError(err.message || 'Microphone access denied or error');
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectSampleQuery = (sample: SampleQuery) => {
    setInputText(sample.query);
    onSendMessage(sample.query, false);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-3 p-2 sm:p-4">
      {/* Sample Query Chips */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 no-scrollbar">
        <span className="text-xs font-semibold text-gray-400 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> MSMARCO-XI Prompts:
        </span>
        {SAMPLE_QUERIES.map((sample) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSampleQuery(sample)}
            disabled={isLoading}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border transition ${
              sample.isOffTopic
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-dark-800 hover:bg-indigo-900/40 text-gray-300 hover:text-indigo-200 border-gray-700/80 hover:border-indigo-500/40'
            }`}
          >
            {sample.category}: "{sample.query.substring(0, 32)}..."
          </button>
        ))}
      </div>

      {/* Voice Error Notification */}
      {voiceError && (
        <div className="p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-rose-400" />
            {voiceError}
          </span>
          <button
            onClick={() => setVoiceError(null)}
            className="text-xs text-rose-400 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Active Voice Recording Bar */}
      {isRecording && (
        <div className="glass-panel p-3 rounded-xl border border-rose-500/40 flex items-center justify-between text-xs text-rose-200 animate-pulse">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></div>
            <span className="font-semibold">Listening... ({recordingSeconds}s)</span>
            <span className="italic text-gray-300">{voiceInterimText || 'Speak into your microphone...'}</span>
          </div>

          <button
            onClick={handleToggleVoice}
            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold transition"
          >
            Stop & Send
          </button>
        </div>
      )}

      {/* Main Dock: Textarea + Mic + Send */}
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <div className="relative w-full glass-panel rounded-2xl border border-indigo-500/30 focus-within:border-indigo-500 shadow-2xl overflow-hidden flex items-center">
          {/* Text Area */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about AI, Quantum Computing, Healthcare, Energy, or Indic NLP..."
            rows={1}
            disabled={isLoading}
            className="w-full py-3.5 pl-4 pr-24 bg-transparent text-sm text-gray-100 placeholder-gray-400 focus:outline-none resize-none max-h-32"
          />

          {/* Action buttons embedded in right side of bar */}
          <div className="absolute right-2 flex items-center space-x-1.5">
            {/* Voice Mic Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              disabled={isLoading}
              className={`p-2 rounded-xl transition ${
                isRecording
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-dark-800 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 border border-gray-700/80 hover:border-indigo-500/40'
              }`}
              title={isRecording ? 'Stop recording voice' : 'Speak your question (Voice Input)'}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className={`p-2 rounded-xl text-white transition ${
                !inputText.trim() || isLoading
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-500/25'
              }`}
              title="Send question"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
