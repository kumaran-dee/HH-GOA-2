import { useState, useEffect, useRef, useMemo } from 'react';
import { ChatHeader } from './components/ChatHeader';
import { HeroVoiceMic } from './components/HeroVoiceMic';
import { ChatMessage, type ChatMessageItem } from './components/ChatMessage';

import { INITIAL_MSMARCO_DATASET } from './services/msmarcoDataset';
import { ChunkingEngine, type Chunk } from './services/chunkingEngine';
import { VectorDbEngine } from './services/vectorDb';
import { ModelHarness } from './services/modelHarness';
import { TextToSpeechService } from './services/ttsService';

import { Bot } from 'lucide-react';

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
      {/* Fixed Header */}
      <ChatHeader
        onClearChat={handleClearChat}
        messageCount={messages.length}
      />

      {/* Middle Chat Feed (ChatGPT / Gemini Empty State initially) */}
      <main className="flex-1 overflow-y-auto w-full max-w-3xl mx-auto px-4 py-6 flex flex-col justify-between">
        {messages.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center text-center space-y-4 animate-slide-up py-12">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-500 to-emerald-400 flex items-center justify-center text-white shadow-2xl shadow-cyan-500/30 animate-pulse-glow">
              <Bot className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              What can I answer for you today?
            </h2>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              Grounded on AI4Bharat MSMARCO-XI dataset. Tap the Big Voice button or type below to begin.
            </p>
          </div>
        ) : (
          <div className="space-y-4 w-full">
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
      </main>

      {/* Fixed Chatbot Bottom Dock */}
      <footer className="w-full bg-dark-950/90 backdrop-blur-md border-t border-white/10 py-3">
        <HeroVoiceMic onSendMessage={handleSendMessage} isLoading={isLoading} />
      </footer>
    </div>
  );
}

export default App;
