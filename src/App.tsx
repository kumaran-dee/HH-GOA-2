import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { ChatMessage, type ChatMessageItem } from './components/ChatMessage';
import { VoiceChatInput } from './components/VoiceChatInput';
import { DatasetInspectorDrawer } from './components/DatasetInspectorDrawer';

import { INITIAL_MSMARCO_DATASET } from './services/msmarcoDataset';
import { ChunkingEngine, type Chunk } from './services/chunkingEngine';
import { VectorDbEngine } from './services/vectorDb';
import { ModelHarness } from './services/modelHarness';
import { TextToSpeechService } from './services/ttsService';

import { Bot } from 'lucide-react';

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
        text: `Welcome! I am your RAG Assistant grounded on the AI4Bharat MSMARCO-XI dataset.\n\nYou can ask questions via typing or clicking the Microphone button to use Voice Input. All answers are grounded in retrieved passages with verifiable citations.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragOutput: {
          answer: `Welcome! I am your RAG Assistant grounded on the AI4Bharat MSMARCO-XI dataset.`,
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
          reasoningSteps: ['Vector index loaded with 10 dataset passages across English & Indic languages'],
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

  // Stop TTS if user leaves or unmounts
  useEffect(() => {
    return () => {
      TextToSpeechService.stop();
    };
  }, []);

  const handleSendMessage = async (queryText: string, isVoiceInput: boolean = false) => {
    if (!queryText.trim() || isLoading) return;

    // Stop ongoing speech when new query is submitted
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
      // Execute End-to-End RAG Harness
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

      // Auto play TTS for voice queries or assistant answers
      if (isVoiceInput && !output.refused && output.answer) {
        setCurrentlySpeakingId(botMsgId);
        TextToSpeechService.speak(output.answer, () => {
          setCurrentlySpeakingId(null);
        });
      }
    } catch (err: any) {
      console.error('RAG Pipeline execution error:', err);
      const botMsgId = `bot-err-${Date.now()}`;
      const botTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const errorBotMsg: ChatMessageItem = {
        id: botMsgId,
        sender: 'bot',
        text: `Sorry, an error occurred while executing the RAG pipeline: ${err.message || err}`,
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
    <div className="min-h-screen flex flex-col font-sans bg-dark-900 text-gray-100 selection:bg-indigo-500/30">
      {/* Top Navigation Header */}
      <ChatHeader
        onClearChat={handleClearChat}
        onOpenDatasetDrawer={() => setIsDatasetDrawerOpen(true)}
        datasetCount={INITIAL_MSMARCO_DATASET.length}
        messageCount={messages.length}
      />

      {/* Main Chat Conversation Container */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 flex flex-col justify-between overflow-hidden">
        {/* Messages Feed */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 min-h-[50vh]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 my-auto">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-500/30">
                <Bot className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-white">Ask Anything on MSMARCO-XI Dataset</h2>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                Type a question or press the <strong className="text-indigo-300">Microphone button</strong> to speak. Questions are processed via vector retrieval and grounded safety guardrails.
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                currentlySpeakingId={currentlySpeakingId}
                onStartSpeak={handleStartSpeak}
                onStopSpeak={handleStopSpeak}
              />
            ))
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Bottom Input Dock */}
        <div className="pt-4 border-t border-gray-800/80 mt-2">
          <VoiceChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </main>

      {/* Slide-out MSMARCO-XI Dataset Explorer Drawer */}
      <DatasetInspectorDrawer
        isOpen={isDatasetDrawerOpen}
        onClose={() => setIsDatasetDrawerOpen(false)}
      />
    </div>
  );
}

export default App;
