import { useState, useEffect, useRef, useMemo } from 'react';
import { Header } from './components/Header';
import { HeroVoiceMic } from './components/HeroVoiceMic';
import { ChatMessage, type ChatMessageItem } from './components/ChatMessage';
import { ChunkingStudio } from './components/ChunkingStudio';
import { GuardrailMonitor } from './components/GuardrailMonitor';
import { LatencyDashboard } from './components/LatencyDashboard';
import { ApiKeyModal } from './components/ApiKeyModal';
import { DatasetInspectorDrawer } from './components/DatasetInspectorDrawer';

import { INITIAL_MSMARCO_DATASET } from './services/msmarcoDataset';
import { ChunkingEngine, type Chunk, type ChunkingStrategyType } from './services/chunkingEngine';
import { VectorDbEngine } from './services/vectorDb';
import { ModelHarness } from './services/modelHarness';
import { TextToSpeechService } from './services/ttsService';
import type { STTConfig } from './services/sttService';
import type { LatencyAnalyticsReport } from './services/analytics';

import { Bot, Trash2 } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'rag' | 'chunking' | 'harness' | 'analytics'>('rag');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Settings & Modals state
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDatasetDrawerOpen, setIsDatasetDrawerOpen] = useState(false);
  const [sttConfig, setSttConfig] = useState<STTConfig>({
    provider: 'sarvam',
    elevenLabsApiKey: '',
    sarvamApiKey: '',
  });

  // Analytics report state
  const [analyticsReport, setAnalyticsReport] = useState<LatencyAnalyticsReport | null>(null);

  // Chunking Strategy state
  const [chunkingStrategy, setChunkingStrategy] = useState<ChunkingStrategyType>('metadata-aware');
  const [chunkingOptions, setChunkingOptions] = useState<{ chunkSize: number; chunkOverlap: number }>({
    chunkSize: 250,
    chunkOverlap: 50,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Re-index Vector DB Engine dynamically when strategy or options change
  const vectorDb = useMemo(() => {
    const engine = new VectorDbEngine();
    const allChunks: Chunk[] = [];

    INITIAL_MSMARCO_DATASET.forEach((passage) => {
      const res = ChunkingEngine.processPassage(passage, chunkingStrategy, chunkingOptions);
      allChunks.push(...res.chunks);
    });

    engine.indexChunks(allChunks);
    return engine;
  }, [chunkingStrategy, chunkingOptions]);

  const harness = useMemo(() => new ModelHarness(vectorDb), [vectorDb]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      TextToSpeechService.stop();
    };
  }, []);

  const handleSendMessage = async (queryText: string, isVoiceInput: boolean = false) => {
    if (!queryText.trim() || isLoading) return;

    TextToSpeechService.stop();
    setCurrentlySpeakingId(null);

    const userTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsgId = `user-${Date.now()}`;

    const newUserMsg: ChatMessageItem = {
      id: userMsgId,
      sender: 'user',
      text: queryText,
      isVoiceInput,
      timestamp: userTimestamp,
    };

    const loadingMsgId = `bot-loading-${Date.now()}`;
    const loadingBotMsg: ChatMessageItem = {
      id: loadingMsgId,
      sender: 'bot',
      text: '',
      timestamp: userTimestamp,
      isLoading: true,
    };

    setMessages((prev) => [...prev, newUserMsg, loadingBotMsg]);
    setIsLoading(true);

    try {
      const output = await harness.executePipeline(queryText, 0, 3, undefined, messages);

      const botMsgId = `bot-${Date.now()}`;
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const finalBotMsg: ChatMessageItem = {
        id: botMsgId,
        sender: 'bot',
        text: output.answer,
        timestamp: botTimestamp,
        ragOutput: output,
        isLoading: false,
      };

      setMessages((prev) => prev.map((m) => (m.id === loadingMsgId ? finalBotMsg : m)));

      if (isVoiceInput && !output.refused && output.answer) {
        setCurrentlySpeakingId(botMsgId);
        TextToSpeechService.speak(output.answer, () => {
          setCurrentlySpeakingId(null);
        });
      }
    } catch (err: any) {
      console.error('RAG Error:', err);
      const botMsgId = `bot-err-${Date.now()}`;
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const errorBotMsg: ChatMessageItem = {
        id: botMsgId,
        sender: 'bot',
        text: `Sorry, an error occurred while generating answer.`,
        timestamp: botTimestamp,
        isLoading: false,
      };

      setMessages((prev) => prev.map((m) => (m.id === loadingMsgId ? errorBotMsg : m)));
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSpeak = (messageId: string, text: string) => {
    TextToSpeechService.stop();
    setCurrentlySpeakingId(messageId);
    TextToSpeechService.speak(text, () => {
      setCurrentlySpeakingId(null);
    });
  };

  const handleStopSpeak = () => {
    TextToSpeechService.stop();
    setCurrentlySpeakingId(null);
  };

  const handleClearChat = () => {
    TextToSpeechService.stop();
    setCurrentlySpeakingId(null);
    setMessages([]);
  };

  const handleApplyStrategy = (
    strategy: ChunkingStrategyType,
    options: { chunkSize: number; chunkOverlap: number }
  ) => {
    setChunkingStrategy(strategy);
    setChunkingOptions(options);
  };

  return (
    <div className="h-screen flex flex-col font-sans bg-dark-950 text-gray-100 selection:bg-cyan-500/30 overflow-hidden">
      {/* Dynamic Header with Tab Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sttProvider={sttConfig.provider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDatasetDrawer={() => setIsDatasetDrawerOpen(true)}
        datasetCount={INITIAL_MSMARCO_DATASET.length}
      />

      {/* Main Tab Content Container */}
      <div className="flex-1 overflow-y-auto w-full">
        {activeTab === 'rag' && (
          <div className="h-full flex flex-col justify-between max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center justify-between pb-2 mb-4 border-b border-white/5 text-xs text-gray-400">
              <span className="font-medium text-gray-300">
                Active Index: <code className="text-cyan-400 font-mono">{chunkingStrategy}</code> strategy ({vectorDb.getChunksCount()} vector chunks)
              </span>
              {messages.length > 0 && (
                <button
                  onClick={handleClearChat}
                  className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear Feed</span>
                </button>
              )}
            </div>

            {messages.length === 0 ? (
              <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 animate-slide-up py-12">
                <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 animate-pulse-glow">
                  <Bot className="w-8 h-8" />
                </div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">
                  Voice RAG Assistant
                </h2>
                <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                  Grounded on AI4Bharat MSMARCO-XI passages. Sub-200ms latency pipeline powered by Sarvam AI / ElevenLabs STT & vector search.
                </p>
              </div>
            ) : (
              <div className="space-y-4 w-full flex-1">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    currentlySpeakingId={currentlySpeakingId}
                    onStartSpeak={handleStartSpeak}
                    onStopSpeak={handleStopSpeak}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            )}

            <div className="sticky bottom-0 pt-4">
              <HeroVoiceMic onSendMessage={handleSendMessage} isLoading={isLoading} />
            </div>
          </div>
        )}

        {activeTab === 'chunking' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <ChunkingStudio
              onApplyStrategy={handleApplyStrategy}
              activeStrategy={chunkingStrategy}
            />
          </div>
        )}

        {activeTab === 'harness' && (
          <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
            <GuardrailMonitor />
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="max-w-6xl mx-auto px-4 py-8">
            <LatencyDashboard
              harness={harness}
              report={analyticsReport}
              onReportUpdate={setAnalyticsReport}
            />
          </div>
        )}
      </div>

      {/* STT Settings Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={sttConfig}
        onSaveConfig={setSttConfig}
      />

      {/* MSMARCO Dataset Inspector Drawer */}
      <DatasetInspectorDrawer
        isOpen={isDatasetDrawerOpen}
        onClose={() => setIsDatasetDrawerOpen(false)}
      />
    </div>
  );
}

export default App;
