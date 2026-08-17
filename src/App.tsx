import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { HeroVoiceMic } from './components/HeroVoiceMic';
import { ChatMessage, type ChatMessageItem } from './components/ChatMessage';
import { DatasetInspectorDrawer } from './components/DatasetInspectorDrawer';

import { INITIAL_MSMARCO_DATASET } from './services/msmarcoDataset';
import { ChunkingEngine, type Chunk } from './services/chunkingEngine';
import { VectorDbEngine } from './services/vectorDb';
import { ModelHarness } from './services/modelHarness';
import { TextToSpeechService } from './services/ttsService';

export function App() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isDatasetDrawerOpen, setIsDatasetDrawerOpen] = useState(false);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize Vector DB engine indexed with MSMARCO-XI dataset chunks
  const vectorDb = useMemo(() => {
    const engine = new VectorDbEngine();
    const allChunks: Chunk[] = [];

    INITIAL_MSMARCO_DATASET.forEach((passage) => {
      const res = ChunkingEngine.processPassage(passage, 'metadata-aware', { chunkSize: 250, chunkOverlap: 50 });
      allChunks.push(...res.chunks);
    });

    engine.indexChunks(allChunks);
    return engine;
  }, []);

  // Model Harness for grounded RAG execution & guardrails
  const harness = useMemo(() => new ModelHarness(vectorDb), [vectorDb]);

  // Initial welcome message from bot
  useEffect(() => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `Aloha! Welcome to the HH-GOA Voice RAG System grounded on AI4Bharat MSMARCO-XI dataset.\n\nTap the Big Microphone button above to ask questions using your voice, or select a sample query below!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragOutput: {
          answer: `Welcome to the HH-GOA Voice RAG System grounded on AI4Bharat MSMARCO-XI dataset.`,
          confidence: 1.0,
          citations: [
            {
              chunkId: 'msmarco-p107',
              title: 'AI4Bharat MSMARCO-XI Indic IR Benchmark',
              section: 'Benchmark Overview',
              snippet: 'MSMARCO-XI is a premier cross-lingual Information Retrieval benchmark designed by AI4Bharat across 11 Indian languages...',
              similarityScore: 0.99,
            },
          ],
          reasoningSteps: ['HH-GOA RAG Engine initialized with 10 dataset passages'],
          refused: false,
          toolCallsExecuted: [],
          stageTimingsMs: { stt: 0, preGuardrail: 0, vectorRetrieval: 0, toolOrchestration: 0, modelInference: 0, postGuardrail: 0, totalPipeline: 0 },
        },
      },
    ]);
  }, []);

  // Auto scroll to bottom when messages change
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
      const output = await harness.executePipeline(queryText, 0, 3);

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
      console.error('RAG Pipeline error:', err);
      const botMsgId = `bot-err-${Date.now()}`;
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const errorBotMsg: ChatMessageItem = {
        id: botMsgId,
        sender: 'bot',
        text: `Sorry, an error occurred in the RAG pipeline: ${err.message || err}`,
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

  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark-900 text-gray-100 selection:bg-cyan-500/30">
      {/* Top Header */}
      <ChatHeader
        onClearChat={handleClearChat}
        onOpenDatasetDrawer={() => setIsDatasetDrawerOpen(true)}
        datasetCount={INITIAL_MSMARCO_DATASET.length}
        messageCount={messages.length}
      />

      {/* Main Screen Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 flex flex-col justify-start space-y-6">
        {/* HERO CENTERPIECE: Big Microphone Orb in middle of screen */}
        <HeroVoiceMic onSendMessage={handleSendMessage} isLoading={isLoading} />

        {/* Conversation Feed */}
        <div className="w-full space-y-4 pt-2 border-t border-cyan-500/20">
          <div className="flex items-center justify-between px-2 text-xs text-gray-400 font-medium">
            <span>RAG Answers & Citations</span>
            <span>{messages.length} messages</span>
          </div>

          <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
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
        </div>
      </main>

      {/* Slide-out Dataset Explorer Drawer */}
      <DatasetInspectorDrawer
        isOpen={isDatasetDrawerOpen}
        onClose={() => setIsDatasetDrawerOpen(false)}
      />
    </div>
  );
}

export default App;
