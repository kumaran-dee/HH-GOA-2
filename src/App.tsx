import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { VoiceInput } from './components/VoiceInput';
import { PipelineInspector } from './components/PipelineInspector';
import { ChunkingStudio } from './components/ChunkingStudio';
import { GuardrailMonitor } from './components/GuardrailMonitor';
import { LatencyDashboard } from './components/LatencyDashboard';
import { ApiKeyModal } from './components/ApiKeyModal';

import { INITIAL_MSMARCO_DATASET } from './services/msmarcoDataset';
import { ChunkingEngine, type ChunkingStrategyType, type Chunk } from './services/chunkingEngine';
import { VectorDbEngine } from './services/vectorDb';
import { SpeechToTextService, type STTConfig } from './services/sttService';
import { ModelHarness, type PipelineStage, type StructuredRAGOutput } from './services/modelHarness';
import { LatencyAnalyticsEngine, type LatencyAnalyticsReport } from './services/analytics';
import { TextToSpeechService } from './services/ttsService';

import { BookOpen, Sparkles, Volume2, VolumeX, Copy, Check, Info, X } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'rag' | 'chunking' | 'harness' | 'analytics'>('rag');
  const [sttConfig, setSttConfig] = useState<STTConfig>({ provider: 'browser-fallback' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showQuickGuide, setShowQuickGuide] = useState(true);

  // Text to Speech playback state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // Chunking Strategy state
  const [chunkStrategy, setChunkStrategy] = useState<ChunkingStrategyType>('metadata-aware');
  const [chunkOptions, setChunkOptions] = useState({ chunkSize: 250, chunkOverlap: 50 });

  // Vector DB instance initialized with indexed chunks
  const vectorDb = useMemo(() => {
    const engine = new VectorDbEngine();
    let allChunks: Chunk[] = [];

    INITIAL_MSMARCO_DATASET.forEach((passage) => {
      const res = ChunkingEngine.processPassage(passage, chunkStrategy, chunkOptions);
      allChunks.push(...res.chunks);
    });

    engine.indexChunks(allChunks);
    return engine;
  }, [chunkStrategy, chunkOptions]);

  // Model Harness instance
  const harness = useMemo(() => new ModelHarness(vectorDb), [vectorDb]);

  // Pipeline Execution State
  const [currentStage, setCurrentStage] = useState<PipelineStage>('IDLE');
  const [stageDetails, setStageDetails] = useState<string>('Ready for voice or text query.');
  const [pipelineOutput, setPipelineOutput] = useState<StructuredRAGOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [transcribedText, setTranscribedText] = useState<string>('');

  // Analytics Report state
  const [analyticsReport, setAnalyticsReport] = useState<LatencyAnalyticsReport | null>(null);

  // Initial automatic benchmark calculation on load
  useEffect(() => {
    LatencyAnalyticsEngine.runBenchmarkSuite(harness, 10).then(setAnalyticsReport);
  }, [harness]);

  const handleApplyChunkingStrategy = (strategy: ChunkingStrategyType, options: { chunkSize: number; chunkOverlap: number }) => {
    setChunkStrategy(strategy);
    setChunkOptions(options);
  };

  const handleQuerySubmit = async (queryText: string, audioBlob?: Blob) => {
    // Stop any ongoing speech
    TextToSpeechService.stop();
    setIsSpeaking(false);

    setIsLoading(true);
    setPipelineOutput(null);

    let finalQuery = queryText;
    let sttLatency = 0;

    if (audioBlob) {
      setCurrentStage('TRANSCRIBING');
      setStageDetails(`Transcribing audio via ${sttConfig.provider.toUpperCase()} STT API...`);

      try {
        const sttRes = await SpeechToTextService.transcribeAudio(audioBlob, sttConfig);
        finalQuery = sttRes.text;
        sttLatency = sttRes.latencyMs;
        setTranscribedText(finalQuery);
      } catch (err) {
        console.error('STT Transcription error:', err);
        setCurrentStage('REFUSED');
        setStageDetails('Audio transcription failed. Please check microphone or API keys.');
        setIsLoading(false);
        return;
      }
    } else {
      setTranscribedText(queryText);
    }

    if (!finalQuery || !finalQuery.trim()) {
      setCurrentStage('REFUSED');
      setStageDetails('Empty transcript received. Please speak clearly.');
      setIsLoading(false);
      return;
    }

    try {
      const output = await harness.executePipeline(
        finalQuery,
        sttLatency,
        3,
        (stage, details) => {
          setCurrentStage(stage);
          if (details) setStageDetails(details);
        }
      );

      setPipelineOutput(output);
    } catch (err: any) {
      console.error('Pipeline execution error:', err);
      setCurrentStage('REFUSED');
      setStageDetails(`Execution error: ${err.message || err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeak = () => {
    if (!pipelineOutput?.answer) return;

    if (isSpeaking) {
      TextToSpeechService.stop();
      setIsSpeaking(false);
    } else {
      setIsSpeaking(true);
      TextToSpeechService.speak(pipelineOutput.answer, () => {
        setIsSpeaking(false);
      });
    }
  };

  const handleCopyAnswer = () => {
    if (!pipelineOutput?.answer) return;
    navigator.clipboard.writeText(pipelineOutput.answer);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark-900 text-gray-100">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sttProvider={sttConfig.provider}
        onOpenSettings={() => setIsSettingsOpen(true)}
        datasetCount={INITIAL_MSMARCO_DATASET.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Usability Banner: Quick Start Guide */}
        {showQuickGuide && (
          <div className="relative p-4 rounded-2xl bg-gradient-to-r from-indigo-900/60 via-purple-900/40 to-dark-800 border border-indigo-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 mt-0.5">
                <Info className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  Welcome to the Voice RAG System!
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-normal">
                    Target &lt;200ms Latency
                  </span>
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed max-w-3xl">
                  <strong>3 Ways to Use:</strong> (1) Click <strong>"⚡ Run 1-Click Voice RAG Demo"</strong> below for instant execution, (2) Click the Microphone button to record audio, or (3) Click any sample question chip.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowQuickGuide(false)}
              className="p-1 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 self-start md:self-auto"
              title="Dismiss guide"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* TAB 1: Voice RAG Studio */}
        {activeTab === 'rag' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Voice Input Section */}
            <VoiceInput
              onQuerySubmit={handleQuerySubmit}
              isLoading={isLoading}
              sttProvider={sttConfig.provider}
            />

            {/* Pipeline Execution Telemetry */}
            <PipelineInspector
              currentStage={currentStage}
              stageDetails={stageDetails}
              output={pipelineOutput}
            />

            {/* Answer & Citations Display Card */}
            {pipelineOutput && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Generated Answer Card */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-indigo-500/20 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Synthesized Answer
                    </h3>

                    <div className="flex items-center space-x-2">
                      {/* Listen to Answer (TTS) Button */}
                      <button
                        onClick={handleToggleSpeak}
                        className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                          isSpeaking
                            ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 animate-pulse'
                            : 'bg-indigo-600/30 hover:bg-indigo-600/50 border-indigo-500/40 text-indigo-200'
                        }`}
                        title="Listen to voice answer"
                      >
                        {isSpeaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5" />
                            <span>Stop Speech</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5" />
                            <span>🔊 Listen to Answer</span>
                          </>
                        )}
                      </button>

                      {/* Copy Answer Button */}
                      <button
                        onClick={handleCopyAnswer}
                        className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-dark-800 hover:bg-gray-800 border border-gray-700 text-xs text-gray-300 transition"
                        title="Copy answer to clipboard"
                      >
                        {copiedAnswer ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                        Confidence: {(pipelineOutput.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Transcribed Query Reference */}
                  {transcribedText && (
                    <div className="p-3 rounded-xl bg-dark-900/60 border border-gray-800 text-xs text-gray-300">
                      <span className="text-gray-400 font-semibold">User Question: </span>
                      <span className="italic text-indigo-200">"{transcribedText}"</span>
                    </div>
                  )}

                  {/* Final Output Text */}
                  <div
                    className={`p-5 rounded-xl border leading-relaxed text-sm ${
                      pipelineOutput.refused
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                        : 'bg-dark-800/80 border-gray-700/60 text-gray-100'
                    }`}
                  >
                    {pipelineOutput.answer}
                  </div>

                  {/* Reasoning Steps */}
                  <div className="space-y-1.5 pt-2 border-t border-gray-800/60 text-xs text-gray-400">
                    <span className="font-semibold text-gray-300 uppercase tracking-wider text-[10px]">
                      Orchestration Trace:
                    </span>
                    <ul className="list-disc list-inside space-y-1 font-mono text-[11px]">
                      {pipelineOutput.reasoningSteps.map((step, idx) => (
                        <li key={idx} className="text-gray-400">
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Retrieved Citations & Passages */}
                <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20 space-y-4">
                  <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-400" /> Retrieved Dataset Citations ({pipelineOutput.citations.length})
                  </h3>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {pipelineOutput.citations.map((c) => (
                      <div
                        key={c.chunkId}
                        className="p-3.5 rounded-xl bg-dark-800/80 border border-gray-700/60 space-y-2 hover:border-indigo-500/40 transition"
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-indigo-300 truncate max-w-[170px]">
                            {c.title}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[10px]">
                            Sim: {(c.similarityScore * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-3 italic">
                          "{c.snippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Chunking Workbench */}
        {activeTab === 'chunking' && (
          <div className="animate-in fade-in duration-300">
            <ChunkingStudio
              onApplyStrategy={handleApplyChunkingStrategy}
              activeStrategy={chunkStrategy}
            />
          </div>
        )}

        {/* TAB 3: Harness & Guardrails */}
        {activeTab === 'harness' && (
          <div className="animate-in fade-in duration-300">
            <GuardrailMonitor />
          </div>
        )}

        {/* TAB 4: Latency Analytics */}
        {activeTab === 'analytics' && (
          <div className="animate-in fade-in duration-300">
            <LatencyDashboard
              harness={harness}
              report={analyticsReport}
              onReportUpdate={setAnalyticsReport}
            />
          </div>
        )}
      </main>

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={sttConfig}
        onSaveConfig={setSttConfig}
      />
    </div>
  );
}

export default App;
