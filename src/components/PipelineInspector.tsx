import React from 'react';
import type { PipelineStage, StructuredRAGOutput } from '../services/modelHarness';
import { CheckCircle2, AlertTriangle, Clock, Zap, ShieldAlert, Cpu, Database, Wrench } from 'lucide-react';

interface PipelineInspectorProps {
  currentStage: PipelineStage;
  stageDetails?: string;
  output?: StructuredRAGOutput | null;
}

export const PipelineInspector: React.FC<PipelineInspectorProps> = ({
  currentStage,
  stageDetails,
  output,
}) => {
  const timings = output?.stageTimingsMs;
  const isSub200ms = (timings?.totalPipeline || 0) <= 200;

  const stages: { stage: PipelineStage; label: string; icon: React.ReactNode; key: keyof NonNullable<typeof timings> | 'guardrails' }[] = [
    { stage: 'TRANSCRIBING', label: 'Speech-to-Text', icon: <Cpu className="w-4 h-4" />, key: 'stt' },
    { stage: 'PRE_GUARDRAILS', label: 'Safety Pre-Check', icon: <ShieldAlert className="w-4 h-4" />, key: 'preGuardrail' },
    { stage: 'VECTOR_RETRIEVAL', label: 'Vector DB Search', icon: <Database className="w-4 h-4" />, key: 'vectorRetrieval' },
    { stage: 'TOOL_ORCHESTRATION', label: 'Harness Tool Calls', icon: <Wrench className="w-4 h-4" />, key: 'toolOrchestration' },
    { stage: 'MODEL_INFERENCE', label: 'Answer Synthesis', icon: <Cpu className="w-4 h-4" />, key: 'modelInference' },
    { stage: 'POST_GUARDRAILS', label: 'Groundedness Check', icon: <CheckCircle2 className="w-4 h-4" />, key: 'postGuardrail' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-200 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" /> Pipeline Execution & Latency Telemetry
        </h3>

        {timings && (
          <div
            className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold ${
              isSub200ms
                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-300'
                : 'bg-amber-500/20 border border-amber-500/30 text-amber-300'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Total: {timings.totalPipeline} ms</span>
            {isSub200ms ? (
              <span className="text-[10px] bg-emerald-500/40 px-1.5 py-0.5 rounded text-white font-mono">
                PASS (&lt;200ms)
              </span>
            ) : (
              <span className="text-[10px] bg-amber-500/40 px-1.5 py-0.5 rounded text-white font-mono">
                &gt;200ms
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stage Graph Flow */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
        {stages.map((s) => {
          const isActive = currentStage === s.stage;
          const isComplete = currentStage === 'COMPLETE' || (output && timings);
          const isRefused = currentStage === 'REFUSED' && output?.refused;
          const timingMs = timings ? (s.key !== 'guardrails' ? timings[s.key] : 0) : null;

          return (
            <div
              key={s.stage}
              className={`flex flex-col items-center justify-between p-3 rounded-xl border text-center transition-all ${
                isActive
                  ? 'bg-indigo-600/30 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-400'
                  : isRefused && s.stage === 'PRE_GUARDRAILS'
                  ? 'bg-rose-500/20 border-rose-500 text-rose-200'
                  : isComplete
                  ? 'bg-dark-800/80 border-gray-700/60 text-gray-300'
                  : 'bg-dark-900/40 border-gray-800/40 text-gray-500'
              }`}
            >
              <div className="flex items-center space-x-1.5 text-xs font-medium">
                {s.icon}
                <span className="truncate">{s.label}</span>
              </div>

              <div className="mt-2 text-[11px] font-mono">
                {timingMs !== null ? (
                  <span className="text-indigo-300 font-bold">{timingMs} ms</span>
                ) : isActive ? (
                  <span className="text-amber-400 animate-pulse">Processing...</span>
                ) : (
                  <span className="text-gray-600">--</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Stage Details / Refusal Logs */}
      {stageDetails && (
        <div className="p-3 rounded-xl bg-dark-900/80 border border-gray-800 text-xs text-gray-300 flex items-center gap-2">
          {currentStage === 'REFUSED' ? (
            <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0" />
          ) : (
            <Clock className="w-4 h-4 text-indigo-400 flex-shrink-0" />
          )}
          <span className="font-mono text-indigo-200">{stageDetails}</span>
        </div>
      )}

      {/* Tool Calls Log if present */}
      {output && output.toolCallsExecuted.length > 0 && (
        <div className="space-y-2 border-t border-gray-800/60 pt-4">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Harness Tool Calls Executed ({output.toolCallsExecuted.length})
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {output.toolCallsExecuted.map((tc, i) => (
              <div key={i} className="p-2.5 rounded-lg bg-dark-800/60 border border-gray-800 text-xs space-y-1">
                <div className="flex items-center justify-between text-indigo-300 font-mono">
                  <span>fn: {tc.toolName}</span>
                  <span className="text-[10px] text-gray-400">{tc.latencyMs} ms</span>
                </div>
                <div className="text-gray-400 text-[11px] truncate">
                  {tc.resultSummary}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
