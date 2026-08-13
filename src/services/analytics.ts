import { ModelHarness, type StructuredRAGOutput } from './modelHarness';
import { SAMPLE_QUERIES, type SampleQuery } from './msmarcoDataset';

export interface BenchmarkQueryResult {
  queryId: string;
  queryText: string;
  category: string;
  isOffTopic: boolean;
  refused: boolean;
  totalLatencyMs: number;
  stageTimings: StructuredRAGOutput['stageTimingsMs'];
  groundednessScore: number;
  similarityScore: number;
}

export interface LatencyAnalyticsReport {
  timestamp: string;
  totalQueriesEvaluated: number;
  passedQueriesCount: number;
  refusedQueriesCount: number;
  p50TotalMs: number;
  p70TotalMs: number;
  p90TotalMs: number;
  p100TotalMs: number; // Worst-case / Max
  meanTotalMs: number;
  stdDevTotalMs: number;
  sub200msComplianceRate: number; // percentage of queries <= 200ms

  // Per-stage percentiles
  stageAnalytics: {
    sttP50: number;
    sttP100: number;
    retrievalP50: number;
    retrievalP100: number;
    harnessP50: number;
    harnessP100: number;
    guardrailP50: number;
    guardrailP100: number;
  };

  queryResults: BenchmarkQueryResult[];
}

export class LatencyAnalyticsEngine {
  /**
   * Run automated benchmark test suite across queries
   */
  public static async runBenchmarkSuite(
    harness: ModelHarness,
    iterations: number = 25,
    onProgress?: (completed: number, total: number, currentLatency: number) => void
  ): Promise<LatencyAnalyticsReport> {
    const results: BenchmarkQueryResult[] = [];

    // Duplicate or extend queries to reach iteration target
    const testQueries: SampleQuery[] = [];
    while (testQueries.length < iterations) {
      testQueries.push(...SAMPLE_QUERIES);
    }
    const finalQueries = testQueries.slice(0, iterations);

    for (let i = 0; i < finalQueries.length; i++) {
      const q = finalQueries[i];
      // Add slight jitter to simulate realistic networking conditions
      const simulatedStt = Number((12 + Math.random() * 15).toFixed(1));

      const output = await harness.executePipeline(q.query, simulatedStt);

      results.push({
        queryId: `${q.id}-${i}`,
        queryText: q.query,
        category: q.category,
        isOffTopic: !!q.isOffTopic,
        refused: output.refused,
        totalLatencyMs: output.stageTimingsMs.totalPipeline,
        stageTimings: output.stageTimingsMs,
        groundednessScore: output.confidence,
        similarityScore: output.citations[0]?.similarityScore || 0,
      });

      onProgress?.(i + 1, finalQueries.length, output.stageTimingsMs.totalPipeline);
    }

    return this.calculateReport(results);
  }

  /**
   * Calculate exact P50, P70, P90, P100 latency percentiles
   */
  public static calculateReport(results: BenchmarkQueryResult[]): LatencyAnalyticsReport {
    if (results.length === 0) {
      return {
        timestamp: new Date().toISOString(),
        totalQueriesEvaluated: 0,
        passedQueriesCount: 0,
        refusedQueriesCount: 0,
        p50TotalMs: 0,
        p70TotalMs: 0,
        p90TotalMs: 0,
        p100TotalMs: 0,
        meanTotalMs: 0,
        stdDevTotalMs: 0,
        sub200msComplianceRate: 0,
        stageAnalytics: {
          sttP50: 0, sttP100: 0,
          retrievalP50: 0, retrievalP100: 0,
          harnessP50: 0, harnessP100: 0,
          guardrailP50: 0, guardrailP100: 0,
        },
        queryResults: [],
      };
    }

    // Sort total latencies ascending for percentile calculation
    const totalLatencies = results.map((r) => r.totalLatencyMs).sort((a, b) => a - b);
    const count = totalLatencies.length;

    const p50TotalMs = this.getPercentile(totalLatencies, 50);
    const p70TotalMs = this.getPercentile(totalLatencies, 70);
    const p90TotalMs = this.getPercentile(totalLatencies, 90);
    const p100TotalMs = totalLatencies[count - 1]; // Max latency

    const sum = totalLatencies.reduce((acc, v) => acc + v, 0);
    const meanTotalMs = Number((sum / count).toFixed(2));

    const variance = totalLatencies.reduce((acc, v) => acc + Math.pow(v - meanTotalMs, 2), 0) / count;
    const stdDevTotalMs = Number(Math.sqrt(variance).toFixed(2));

    // Calculate sub-200ms compliance rate
    const under200Count = totalLatencies.filter((l) => l <= 200).length;
    const sub200msComplianceRate = Number(((under200Count / count) * 100).toFixed(1));

    // Per-stage percentile arrays
    const sttArr = results.map((r) => r.stageTimings.stt).sort((a, b) => a - b);
    const retArr = results.map((r) => r.stageTimings.vectorRetrieval).sort((a, b) => a - b);
    const harArr = results.map((r) => r.stageTimings.modelInference).sort((a, b) => a - b);
    const grdArr = results.map((r) => r.stageTimings.preGuardrail + r.stageTimings.postGuardrail).sort((a, b) => a - b);

    const passedQueriesCount = results.filter((r) => !r.refused).length;
    const refusedQueriesCount = results.filter((r) => r.refused).length;

    return {
      timestamp: new Date().toISOString(),
      totalQueriesEvaluated: count,
      passedQueriesCount,
      refusedQueriesCount,
      p50TotalMs,
      p70TotalMs,
      p90TotalMs,
      p100TotalMs,
      meanTotalMs,
      stdDevTotalMs,
      sub200msComplianceRate,
      stageAnalytics: {
        sttP50: this.getPercentile(sttArr, 50),
        sttP100: sttArr[sttArr.length - 1],
        retrievalP50: this.getPercentile(retArr, 50),
        retrievalP100: retArr[retArr.length - 1],
        harnessP50: this.getPercentile(harArr, 50),
        harnessP100: harArr[harArr.length - 1],
        guardrailP50: this.getPercentile(grdArr, 50),
        guardrailP100: grdArr[grdArr.length - 1],
      },
      queryResults: results,
    };
  }

  private static getPercentile(sortedArr: number[], percentile: number): number {
    if (sortedArr.length === 0) return 0;
    const index = Math.ceil((percentile / 100) * sortedArr.length) - 1;
    const safeIndex = Math.max(0, Math.min(index, sortedArr.length - 1));
    return Number(sortedArr[safeIndex].toFixed(2));
  }
}
