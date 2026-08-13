import React, { useState, useRef } from 'react';
import { Mic, MicOff, Send, Sparkles, Volume2, Play, Zap, HelpCircle } from 'lucide-react';
import { AudioRecorder, type STTProvider } from '../services/sttService';
import { SAMPLE_QUERIES, type SampleQuery } from '../services/msmarcoDataset';

interface VoiceInputProps {
  onQuerySubmit: (query: string, audioBlob?: Blob) => void;
  isLoading: boolean;
  sttProvider: STTProvider;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onQuerySubmit,
  isLoading,
  sttProvider: _sttProvider,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [textQuery, setTextQuery] = useState('');
  const recorderRef = useRef<AudioRecorder | null>(null);
  const timerRef = useRef<any>(null);

  const handleStartRecording = async () => {
    try {
      const recorder = new AudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((t) => t + 1);
      }, 1000);
    } catch (err) {
      console.error('Microphone access failed:', err);
      alert('Could not access microphone. You can pick any query below or type your question!');
    }
  };

  const handleStopRecording = async () => {
    if (!recorderRef.current || !isRecording) return;
    clearInterval(timerRef.current);
    setIsRecording(false);

    try {
      const audioBlob = await recorderRef.current.stop();
      onQuerySubmit('', audioBlob);
    } catch (err) {
      console.error('Error stopping recorder:', err);
    }
  };

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (textQuery.trim() && !isLoading) {
      onQuerySubmit(textQuery.trim());
    }
  };

  const handleSampleClick = (sample: SampleQuery) => {
    setTextQuery(sample.query);
    onQuerySubmit(sample.query);
  };

  const handleQuickDemo = () => {
    const defaultQuery = "What causes type 2 diabetes and how is it diagnosed?";
    setTextQuery(defaultQuery);
    onQuerySubmit(defaultQuery);
  };

  return (
    <div className="glass-panel rounded-2xl p-6 shadow-2xl border border-indigo-500/20 space-y-6">
      {/* Top Usability Bar: One-Click Instant Demo */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-indigo-900/50 via-purple-900/40 to-indigo-900/50 border border-indigo-500/30">
        <div className="flex items-center space-x-2 text-xs">
          <Zap className="w-4 h-4 text-amber-400 animate-bounce" />
          <span className="font-semibold text-white">Want to try immediately without typing?</span>
          <span className="text-gray-400 hidden lg:inline">• Zero setup required</span>
        </div>

        <button
          onClick={handleQuickDemo}
          disabled={isLoading || isRecording}
          className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:to-pink-400 text-white font-bold text-xs shadow-md shadow-purple-500/30 transition transform active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>⚡ Run 1-Click Voice RAG Demo</span>
        </button>
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Voice Microphone Controller */}
        <div className="flex flex-col items-center justify-center space-y-3 w-full md:w-auto">
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={isLoading}
            className={`relative group flex items-center justify-center w-24 h-24 rounded-full transition-all duration-300 transform active:scale-95 ${
              isRecording
                ? 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-xl shadow-rose-500/50 animate-pulse'
                : 'bg-gradient-to-tr from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 shadow-xl shadow-indigo-600/40 hover:shadow-indigo-500/60'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Click to speak your question via microphone"
          >
            {isRecording ? (
              <MicOff className="w-10 h-10 text-white animate-bounce" />
            ) : (
              <Mic className="w-10 h-10 text-white group-hover:scale-110 transition-transform" />
            )}

            {isRecording && (
              <>
                <span className="absolute inset-0 rounded-full bg-rose-500/30 animate-ping"></span>
                <span className="absolute -inset-2 rounded-full border border-rose-500/40 animate-pulse"></span>
              </>
            )}
          </button>

          <div className="text-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center justify-center gap-1.5">
              {isRecording ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  Recording ({recordingTime}s) - Tap to Finish
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                  Click Mic to Speak Question
                </>
              )}
            </span>
          </div>

          {/* Animated Waveform */}
          {isRecording && (
            <div className="flex items-center space-x-1 h-6 pt-1">
              {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7, 0.3].map((height, i) => (
                <div
                  key={i}
                  className="w-1 rounded-full bg-gradient-to-t from-rose-500 to-purple-400 wave-bar"
                  style={{
                    height: `${height * 100}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                ></div>
              ))}
            </div>
          )}
        </div>

        {/* Text Input & Categorized Sample Selector */}
        <div className="flex-1 w-full space-y-4">
          <form onSubmit={handleTextSubmit} className="relative">
            <input
              type="text"
              value={textQuery}
              onChange={(e) => setTextQuery(e.target.value)}
              placeholder="Or type any question (e.g. How do solar panels generate electricity?)..."
              disabled={isLoading || isRecording}
              className="w-full px-5 py-3.5 pr-14 rounded-xl glass-input text-xs sm:text-sm text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500/50 transition"
            />
            <button
              type="submit"
              disabled={isLoading || !textQuery.trim() || isRecording}
              className="absolute right-2 top-2 p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 disabled:hover:bg-indigo-600 transition"
              title="Submit query"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

          {/* Categorized Sample Queries */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-300">
              <span className="flex items-center gap-1 font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Click Any Sample Question Below:
              </span>
              <span className="text-[11px] text-indigo-300 font-mono flex items-center gap-1">
                <HelpCircle className="w-3 h-3" /> Auto-retrieves MSMARCO context
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUERIES.map((sample) => (
                <button
                  key={sample.id}
                  onClick={() => handleSampleClick(sample)}
                  disabled={isLoading || isRecording}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all text-left truncate max-w-xs ${
                    sample.isOffTopic
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300 hover:bg-rose-500/20'
                      : 'bg-dark-800/90 border-gray-700/60 text-gray-200 hover:border-indigo-500/60 hover:text-white hover:bg-indigo-900/40'
                  }`}
                  title={sample.query}
                >
                  <span className="opacity-70 text-[10px] font-mono mr-1.5 font-bold">
                    {sample.isOffTopic ? '🛡️ [Refusal Test]' : `[${sample.category}]`}
                  </span>
                  {sample.query}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
