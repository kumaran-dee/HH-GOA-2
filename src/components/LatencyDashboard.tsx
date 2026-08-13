import React, { useState } from 'react';
import { ModelHarness } from '../services/modelHarness';
import { LatencyAnalyticsEngine, type LatencyAnalyticsReport } from '../services/analytics';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3, Play, Download, Zap, Clock, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface LatencyDashboardProps {
  harness: ModelHarness;
  report: LatencyAnalyticsReport | null;
  onReportUpdate: (newReport: LatencyAnalyticsReport) => void;
}

export const LatencyDashboard: React.FC<LatencyDashboardProps> = ({
  harness,
  report,
  onReportUpdate,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; lastLatency: number } | null>(null);
  const [testCount, setTestCount] = useState<number>(25);

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setProgress({ current: 0, total: testCount, lastLatency: 0 });

    try {
      const newReport = await LatencyAnalyticsEngine.runBenchmarkSuite(
        harness,
        testCount,
        (completed, total, lastLatency) => {
          setProgress({ current: completed, total, lastLatency });
        }
      );

      onReportUpdate(newReport);
      setIsRunning(false);
      setProgress(null);

      // Celebrate if P100 <= 200ms or P50 <= 200ms
      if (newReport.sub200msComplianceRate >= 80) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (err) {
      console.error('Benchmark execution error:', err);
      setIsRunning(false);
      setProgress(null);
    }
  };

  const handleDownloadReport = () => {
    if (!report) return;
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `msmarco-rag-latency-report-${Date.now()}.json`;
    a.click();
  };

  const percentileData = report
    ? [
        { name: 'P50 (Median)', latency: report.p50TotalMs, color: '#10b981' },
        { name: 'P70', latency: report.p70TotalMs, color: '#3b82f6' },
        { name: 'P90', latency: report.p90TotalMs, color: '#8b5cf6' },
        { name: 'P100 (Max)', latency: report.p100TotalMs, color: report.p100TotalMs <= 200 ? '#10b981' : '#f43f5e' },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Control */}
      <div className="glass-panel rounded-2xl p-6 border border-indigo-500/20">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" /> Pipeline Latency & Percentile Analytics
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              Rigorous P50 / P70 / P100 latency benchmarks measured across test query iterations. Target: &lt;200ms end-to-end.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <select
              value={testCount}
              onChange={(e) => setTestCount(Number(e.target.value))}
              disabled={isRunning}
              className="px-3 py-2.5 rounded-xl glass-input text-xs text-gray-200"
            >
              <option value={10} className="bg-dark-900">10 Queries Test</option>
              <option value={25} className="bg-dark-900">25 Queries Test</option>
              <option value={50} className="bg-dark-900">50 Queries Suite</option>
            </select>

            <button
              onClick={handleRunBenchmark}
              disabled={isRunning}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition disabled:opacity-50"
            >
              {isRunning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Running Benchmark...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>Run Latency Benchmark</span>
                </>
              )}
            </button>

            {report && (
              <button
                onClick={handleDownloadReport}
                className="p-2.5 rounded-xl bg-dark-800 hover:bg-indigo-900/30 border border-gray-700 hover:border-indigo-500/40 text-gray-300 hover:text-white transition"
                title="Download JSON Report"
              >
                <Download className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar during benchmark execution */}
        {isRunning && progress && (
          <div className="mt-4 space-y-2 pt-4 border-t border-gray-800">
            <div className="flex justify-between text-xs text-gray-300">
              <span>Evaluating Test Query #{progress.current} of {progress.total}...</span>
              <span className="font-mono text-indigo-300">Last: {progress.lastLatency} ms</span>
            </div>
            <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-200"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              ></div>
            </div>
          </div>
        )}
      </div>

      {/* Latency Percentiles Cards */}
      {report && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="glass-card rounded-2xl p-4 border border-emerald-500/20 text-center space-y-1">
            <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">P50 (Median)</span>
            <div className="text-2xl font-extrabold text-white font-mono">{report.p50TotalMs} <span className="text-xs font-normal text-gray-400">ms</span></div>
            <p className="text-[10px] text-gray-400">50% queries faster</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-blue-500/20 text-center space-y-1">
            <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider">P70 Latency</span>
            <div className="text-2xl font-extrabold text-white font-mono">{report.p70TotalMs} <span className="text-xs font-normal text-gray-400">ms</span></div>
            <p className="text-[10px] text-gray-400">70% queries faster</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-purple-500/20 text-center space-y-1">
            <span className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider">P90 Latency</span>
            <div className="text-2xl font-extrabold text-white font-mono">{report.p90TotalMs} <span className="text-xs font-normal text-gray-400">ms</span></div>
            <p className="text-[10px] text-gray-400">90% queries faster</p>
          </div>

          <div className={`glass-card rounded-2xl p-4 text-center space-y-1 border ${
            report.p100TotalMs <= 200 ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-rose-500/30 bg-rose-500/10'
          }`}>
            <span className="text-[11px] font-semibold text-rose-400 uppercase tracking-wider">P100 (Max Worst-Case)</span>
            <div className="text-2xl font-extrabold text-white font-mono">{report.p100TotalMs} <span className="text-xs font-normal text-gray-400">ms</span></div>
            <p className="text-[10px] text-gray-400">Worst case execution</p>
          </div>

          <div className="glass-card rounded-2xl p-4 border border-amber-500/20 text-center space-y-1">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">&lt;200ms Rate</span>
            <div className="text-2xl font-extrabold text-amber-300 font-mono">{report.sub200msComplianceRate}%</div>
            <p className="text-[10px] text-gray-400">Target compliance</p>
          </div>
        </div>
      )}

      {/* Latency Charts */}
      {report && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Percentile Comparison Chart */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" /> Percentile Latency Breakdown (P50 - P100)
            </h3>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={percentileData} margin={{ top: 20, right: 20, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" stroke="#9ca3af" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#9ca3af" tick={{ fontSize: 11 }} unit="ms" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#111827', borderColor: '#374151', borderRadius: '12px' }}
                    labelStyle={{ color: '#f3f4f6', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="latency" radius={[8, 8, 0, 0]}>
                    {percentileData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stage Timings Breakdown */}
          <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" /> Per-Stage Percentiles (P50 vs P100)
            </h3>

            <div className="space-y-4 pt-2">
              {[
                { label: 'Speech-to-Text (STT)', p50: report.stageAnalytics.sttP50, p100: report.stageAnalytics.sttP100, color: 'from-blue-500 to-indigo-500' },
                { label: 'Vector DB Retrieval', p50: report.stageAnalytics.retrievalP50, p100: report.stageAnalytics.retrievalP100, color: 'from-emerald-500 to-teal-500' },
                { label: 'Model Harness Inference', p50: report.stageAnalytics.harnessP50, p100: report.stageAnalytics.harnessP100, color: 'from-purple-500 to-pink-500' },
                { label: 'Guardrail Verification', p50: report.stageAnalytics.guardrailP50, p100: report.stageAnalytics.guardrailP100, color: 'from-amber-500 to-orange-500' },
              ].map((stage, idx) => (
                <div key={idx} className="space-y-1 text-xs">
                  <div className="flex justify-between text-gray-300 font-medium">
                    <span>{stage.label}</span>
                    <span className="font-mono text-indigo-300">
                      P50: <b>{stage.p50} ms</b> | P100: <b>{stage.p100} ms</b>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-dark-900 overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${stage.color}`}
                      style={{ width: `${Math.min(100, (stage.p100 / (report.p100TotalMs || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Benchmark Query Table Log */}
      {report && report.queryResults.length > 0 && (
        <div className="glass-panel rounded-2xl p-5 border border-indigo-500/20 space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-300">
            Query Evaluation Log ({report.queryResults.length} Runs)
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-dark-900/80 text-gray-400 font-mono uppercase text-[10px] border-b border-gray-800">
                <tr>
                  <th className="p-3">Query</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Retrieval (ms)</th>
                  <th className="p-3">Total (ms)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/50">
                {report.queryResults.map((q) => (
                  <tr key={q.queryId} className="hover:bg-white/5 transition">
                    <td className="p-3 font-medium text-gray-200 truncate max-w-xs">{q.queryText}</td>
                    <td className="p-3 text-gray-400">{q.category}</td>
                    <td className="p-3">
                      {q.refused ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300 font-mono">
                          REFUSED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                          PASSED
                        </span>
                      )}
                    </td>
                    <td className="p-3 font-mono text-indigo-300">{q.stageTimings.vectorRetrieval} ms</td>
                    <td className="p-3 font-mono font-bold text-white">{q.totalLatencyMs} ms</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
