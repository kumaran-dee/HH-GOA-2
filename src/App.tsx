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

import { BookOpen, Sparkles } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<'rag' | 'chunking' | 'harness' | 'analytics'>('rag');
  const [sttConfig, setSttConfig] = useState<STTConfig>({ provider: 'browser-fallback' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

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
    setIsLoading(true);
    setPipelineOutput(null);

    let finalQuery = queryText;
    let sttLatency = 0;

    // 1. If Audio Blob provided, run Speech-to-Text first
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

    // 2. Execute RAG Pipeline through Model Harness
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-gray-100 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> Synthesized Answer
                    </h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">
                        Confidence: {(pipelineOutput.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>

                  {/* Transcribed Query Reference */}
                  {transcribedText && (
                    <div className="p-3 rounded-xl bg-dark-900/60 border border-gray-800 text-xs text-gray-300">
                      <span className="text-gray-400 font-semibold">User Speech Transcript: </span>
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
