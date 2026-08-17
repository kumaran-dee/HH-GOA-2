import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { HeroVoiceMic } from './components/HeroVoiceMic';
import { ChatMessage, type ChatMessageItem } from './components/ChatMessage';

import { INITIAL_MSMARCO_DATASET } from './services/msmarcoDataset';
import { ChunkingEngine, type Chunk } from './services/chunkingEngine';
import { VectorDbEngine } from './services/vectorDb';
import { ModelHarness } from './services/modelHarness';
import { TextToSpeechService } from './services/ttsService';

export function App() {
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Vector DB Engine
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

  const harness = useMemo(() => new ModelHarness(vectorDb), [vectorDb]);

  // Initial welcome message from assistant
  useEffect(() => {
    setMessages([
      {
        id: 'welcome-1',
        sender: 'bot',
        text: `Hello! Ask any question about AI, Quantum Computing, Health, or Energy using your Voice or Text.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        ragOutput: {
          answer: `Hello! Ask any question about AI, Quantum Computing, Health, or Energy using your Voice or Text.`,
          confidence: 1.0,
          citations: [],
          reasoningSteps: [],
          refused: false,
          toolCallsExecuted: [],
          stageTimingsMs: { stt: 0, preGuardrail: 0, vectorRetrieval: 0, toolOrchestration: 0, modelInference: 0, postGuardrail: 0, totalPipeline: 0 },
        },
      },
    ]);
  }, []);

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

  return (
    <div className="h-screen flex flex-col font-sans bg-dark-950 text-gray-100 selection:bg-cyan-500/30 overflow-hidden">
      {/* 1. Fixed Header at Top */}
      <ChatHeader
        onClearChat={handleClearChat}
        messageCount={messages.length}
      />

      {/* 2. Middle Scrollable Chat Messages Feed (Starts at Top) */}
      <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-6 space-y-4">
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
      </main>

      {/* 3. Fixed Chatbot Bottom Dock (Prompt Box + Mic Button) */}
      <footer className="w-full bg-dark-950/90 backdrop-blur-md border-t border-white/10 py-3">
        <HeroVoiceMic onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
}

export default App;
