import React, { useState, useMemo } from 'react';
import { ChunkingEngine, type ChunkingStrategyType } from '../services/chunkingEngine';
import { INITIAL_MSMARCO_DATASET, type MSMARCOPassage } from '../services/msmarcoDataset';
import { Layers, Sliders, FileText, Check, Activity } from 'lucide-react';

interface ChunkingStudioProps {
  onApplyStrategy: (strategy: ChunkingStrategyType, options: { chunkSize: number; chunkOverlap: number }) => void;
  activeStrategy: ChunkingStrategyType;
}

export const ChunkingStudio: React.FC<ChunkingStudioProps> = ({
  onApplyStrategy,
  activeStrategy: initialActiveStrategy,
}) => {
  const [selectedPassage, setSelectedPassage] = useState<MSMARCOPassage>(INITIAL_MSMARCO_DATASET[0]);
  const [strategy, setStrategy] = useState<ChunkingStrategyType>(initialActiveStrategy || 'metadata-aware');
  const [chunkSize, setChunkSize] = useState<number>(250);
  const [chunkOverlap, setChunkOverlap] = useState<number>(50);

  // Compute chunks for current selected passage & strategy
  const { chunks, stats } = useMemo(() => {
    return ChunkingEngine.processPassage(selectedPassage, strategy, { chunkSize, chunkOverlap });
  }, [selectedPassage, strategy, chunkSize, chunkOverlap]);

  // Compute all 4 strategies for side-by-side comparison
  const comparisonStats = useMemo(() => {
    const strategies: ChunkingStrategyType[] = ['fixed', 'semantic', 'metadata-aware', 'recursive'];
    return strategies.map((strat) => {
      const res = ChunkingEngine.processPassage(selectedPassage, strat, { chunkSize, chunkOverlap });
      return res.stats;
    });
  }, [selectedPassage, chunkSize, chunkOverlap]);

  const handleApplyToPipeline = () => {
    onApplyStrategy(strategy, { chunkSize, chunkOverlap });
    alert(`Successfully updated vector index chunking strategy to: ${strategy.toUpperCase()}`);
  };

  return (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-400" /> Multi-Strategy Chunking Workbench
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Compare semantic boundaries, overlap densities, and metadata context enrichment on the MSMARCO-XI dataset.
            </p>
          </div>

          <button
            onClick={handleApplyToPipeline}
            className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition"
          >
            <Check className="w-4 h-4" />
            <span>Apply Selected Strategy to Pipeline</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Passage Selector & Controls */}
        <div className="space-y-6">
          {/* Passage Selection Card */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-4">
            <label className="text-xs font-semibold text-gray-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" /> Select Dataset Passage:
            </label>
            <select
              value={selectedPassage.id}
              onChange={(e) => {
                const found = INITIAL_MSMARCO_DATASET.find((p) => p.id === e.target.value);
                if (found) setSelectedPassage(found);
              }}
              className="w-full px-3.5 py-2.5 rounded-xl glass-input text-xs text-gray-200"
            >
              {INITIAL_MSMARCO_DATASET.map((p) => (
                <option key={p.id} value={p.id} className="bg-dark-900 text-gray-200">
                  [{p.category}] {p.title}
                </option>
              ))}
            </select>

            <div className="p-3 rounded-xl bg-dark-900/60 border border-gray-800 text-xs text-gray-300 leading-relaxed max-h-44 overflow-y-auto">
              <span className="font-semibold text-indigo-300 block mb-1">Passage Text:</span>
              {selectedPassage.text}
            </div>
          </div>

          {/* Strategy Selection & Hyperparameters */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-indigo-400" /> Chunking Strategy & Tuning
            </h3>

            {/* Strategy Radio Options */}
            <div className="space-y-2">
              {[
                { id: 'fixed', label: 'Fixed-Size with Overlap', desc: 'Sliding character window' },
                { id: 'semantic', label: 'Semantic Splitting', desc: 'Sentence & topic boundary detection' },
                { id: 'metadata-aware', label: 'Metadata-Aware (Recommended)', desc: 'Injects doc title & section headers' },
                { id: 'recursive', label: 'Recursive Character', desc: 'Multi-tier fallback splitters' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setStrategy(s.id as ChunkingStrategyType)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    strategy === s.id
                      ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md shadow-indigo-600/20'
                      : 'bg-dark-800/40 border-gray-800 text-gray-400 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-200">{s.label}</span>
                    {strategy === s.id && <span className="w-2 h-2 rounded-full bg-indigo-400"></span>}
                  </div>
                  <p className="text-[11px] text-gray-400 mt-0.5">{s.desc}</p>
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-4 pt-2 border-t border-gray-800">
              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Target Chunk Size:</span>
                  <span className="font-mono text-indigo-400 font-bold">{chunkSize} chars</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="600"
                  step="25"
                  value={chunkSize}
                  onChange={(e) => setChunkSize(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-gray-300 mb-1">
                  <span>Overlap Length:</span>
                  <span className="font-mono text-indigo-400 font-bold">{chunkOverlap} chars</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="150"
                  step="10"
                  value={chunkOverlap}
                  onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  className="w-full accent-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Columns: Strategy Metrics & Visual Chunk Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Side-by-side Strategy Matrix */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" /> Strategy Comparison Matrix
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {comparisonStats.map((st) => {
                const isSelected = st.strategy === strategy;
                return (
                  <div
                    key={st.strategy}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-indigo-600/30 border-indigo-500 text-indigo-100 shadow-lg shadow-indigo-600/20'
                        : 'bg-dark-800/60 border-gray-800 text-gray-400'
                    }`}
                  >
                    <span className="text-[11px] font-bold uppercase tracking-wider block text-indigo-300 truncate">
                      {st.strategy}
                    </span>
                    <div className="mt-2 space-y-1 text-xs">
                      <div className="text-lg font-bold text-white">{st.totalChunks} Chunks</div>
                      <div className="text-[11px] text-gray-400">Avg {st.avgChunkLength} chars</div>
                      <div className="text-[10px] text-emerald-400 font-mono">{st.executionTimeMs} ms</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Generated Chunks Preview Cards */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
                Generated Chunks ({chunks.length}) — {strategy.toUpperCase()}
              </h3>
              <span className="text-xs text-gray-400 font-mono">
                Avg length: {stats.avgChunkLength} chars
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {chunks.map((c, i) => (
                <div
                  key={c.id}
                  className="p-4 rounded-xl bg-dark-800/80 border border-gray-700/60 space-y-2 hover:border-indigo-500/40 transition"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono font-bold">
                      Chunk #{i + 1}
                    </span>
                    <div className="flex items-center space-x-3 text-[11px] text-gray-400">
                      <span>{c.charCount} chars</span>
                      <span>•</span>
                      <span>{c.wordCount} words</span>
                    </div>
                  </div>

                  <p className="text-xs text-gray-200 leading-relaxed font-sans bg-dark-900/60 p-3 rounded-lg border border-gray-800">
                    {c.metadata.hasPrependHeader ? (
                      <>
                        <span className="text-amber-300 font-mono font-semibold">
                          {c.text.substring(0, c.text.indexOf(']') + 1)}
                        </span>
                        {c.text.substring(c.text.indexOf(']') + 1)}
                      </>
                    ) : (
                      c.text
                    )}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
