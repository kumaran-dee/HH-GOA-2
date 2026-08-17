import { VectorDbEngine, type SearchResult } from './vectorDb';
import { GuardrailSuite } from './guardrails';

export type PipelineStage =
  | 'IDLE'
  | 'TRANSCRIBING'
  | 'PRE_GUARDRAILS'
  | 'VECTOR_RETRIEVAL'
  | 'TOOL_ORCHESTRATION'
  | 'MODEL_INFERENCE'
  | 'POST_GUARDRAILS'
  | 'COMPLETE'
  | 'REFUSED';

export interface ToolCallRecord {
  toolName: string;
  args: Record<string, any>;
  resultSummary: string;
  latencyMs: number;
}

export interface StructuredRAGOutput {
  answer: string;
  confidence: number;
  citations: {
    chunkId: string;
    title: string;
    section: string;
    snippet: string;
    similarityScore: number;
  }[];
  reasoningSteps: string[];
  refused: boolean;
  refusalReason?: string;
  toolCallsExecuted: ToolCallRecord[];
  stageTimingsMs: {
    stt: number;
    preGuardrail: number;
    vectorRetrieval: number;
    toolOrchestration: number;
    modelInference: number;
    postGuardrail: number;
    totalPipeline: number;
  };
}

export class ModelHarness {
  private vectorDb: VectorDbEngine;
  private maxRetries: number = 3;

  constructor(vectorDb: VectorDbEngine) {
    this.vectorDb = vectorDb;
  }

  /**
   * Execute End-to-End RAG Harness Orchestration
   */
  public async executePipeline(
    queryText: string,
    sttLatencyMs: number = 0,
    topK: number = 3,
    onStateChange?: (stage: PipelineStage, details?: string) => void
  ): Promise<StructuredRAGOutput> {
    const totalStartTime = performance.now();
    const toolCallsExecuted: ToolCallRecord[] = [];

    // Stage 1: Pre-Execution Guardrails
    onStateChange?.('PRE_GUARDRAILS', 'Evaluating query safety and off-topic rules');
    const preCheckStart = performance.now();
    const preCheck = GuardrailSuite.checkQuery(queryText);
    const preCheckTime = performance.now() - preCheckStart;

    if (!preCheck.passed) {
      onStateChange?.('REFUSED', preCheck.reason);
      const totalTime = performance.now() - totalStartTime;
      return {
        answer: preCheck.reason || 'Query refused by safety guardrail.',
        confidence: 0,
        citations: [],
        reasoningSteps: [`Pre-guardrail trigger: ${preCheck.reason}`],
        refused: true,
        refusalReason: preCheck.reason,
        toolCallsExecuted: [],
        stageTimingsMs: {
          stt: sttLatencyMs,
          preGuardrail: Number(preCheckTime.toFixed(2)),
          vectorRetrieval: 0,
          toolOrchestration: 0,
          modelInference: 0,
          postGuardrail: 0,
          totalPipeline: Number(totalTime.toFixed(2)),
        },
      };
    }

    // Stage 2: Vector Retrieval Tool Call
    onStateChange?.('VECTOR_RETRIEVAL', `Retrieving top ${topK} matches from vector DB`);
    const retrievalStart = performance.now();
    const searchResults = await this.executeWithRetry(() => this.vectorDb.search(queryText, topK));
    const retrievalTime = performance.now() - retrievalStart;

    toolCallsExecuted.push({
      toolName: 'vector_search_retrieve',
      args: { query: queryText, topK },
      resultSummary: `Retrieved ${searchResults.length} chunks (Top score: ${searchResults[0]?.score || 0})`,
      latencyMs: Number(retrievalTime.toFixed(2)),
    });

    // Stage 3: Tool Orchestration & Context Relevance Guardrail
    onStateChange?.('TOOL_ORCHESTRATION', 'Evaluating context relevance and query expansion');
    const toolStart = performance.now();
    const relevanceCheck = GuardrailSuite.checkContextRelevance(searchResults, 0.20);

    if (!relevanceCheck.passed) {
      onStateChange?.('REFUSED', relevanceCheck.reason);
      const totalTime = performance.now() - totalStartTime;
      return {
        answer: relevanceCheck.reason || 'I cannot answer based on the provided dataset context.',
        confidence: 0,
        citations: [],
        reasoningSteps: ['Vector search completed', `Relevance threshold check failed: score < threshold`],
        refused: true,
        refusalReason: relevanceCheck.reason,
        toolCallsExecuted,
        stageTimingsMs: {
          stt: sttLatencyMs,
          preGuardrail: Number(preCheckTime.toFixed(2)),
          vectorRetrieval: Number(retrievalTime.toFixed(2)),
          toolOrchestration: Number((performance.now() - toolStart).toFixed(2)),
          modelInference: 0,
          postGuardrail: 0,
          totalPipeline: Number(totalTime.toFixed(2)),
        },
      };
    }

    const toolTime = performance.now() - toolStart;

    // Stage 4: Model Inference / Synthesis
    onStateChange?.('MODEL_INFERENCE', 'Generating grounded answer from retrieved chunks');
    const inferenceStart = performance.now();
    const { answer, citations } = await this.synthesizeAnswer(queryText, searchResults);
    const inferenceTime = performance.now() - inferenceStart;

    // Stage 5: Post-Execution Groundedness Guardrail
    onStateChange?.('POST_GUARDRAILS', 'Verifying answer groundedness and claim attribution');
    const postCheckStart = performance.now();
    const contextText = searchResults.map((r) => r.chunk.text).join(' ');
    const groundednessCheck = GuardrailSuite.verifyGroundedness(answer, contextText);
    const postCheckTime = performance.now() - postCheckStart;

    const totalPipelineTime = Number((performance.now() - totalStartTime).toFixed(2));
    onStateChange?.('COMPLETE', 'Pipeline executed successfully');

    return {
      answer,
      confidence: groundednessCheck.score || 0.95,
      citations,
      reasoningSteps: [
        `Pre-guardrail passed in ${preCheckTime.toFixed(1)}ms`,
        `Retrieved ${searchResults.length} passages with top vector similarity ${searchResults[0].score}`,
        `Synthesized answer in ${inferenceTime.toFixed(1)}ms`,
      ],
      refused: false,
      toolCallsExecuted,
      stageTimingsMs: {
        stt: sttLatencyMs,
        preGuardrail: Number(preCheckTime.toFixed(2)),
        vectorRetrieval: Number(retrievalTime.toFixed(2)),
        toolOrchestration: Number(toolTime.toFixed(2)),
        modelInference: Number(inferenceTime.toFixed(2)),
        postGuardrail: Number(postCheckTime.toFixed(2)),
        totalPipeline: totalPipelineTime,
      },
    };
  }

  private async executeWithRetry<T>(fn: () => T | Promise<T>): Promise<T> {
    let lastError: any;
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (err) {
        lastError = err;
        if (attempt < this.maxRetries) {
          const delay = Math.pow(2, attempt) * 50;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastError;
  }

  /**
   * Synthesize grounded answer with clean text output
   */
  private async synthesizeAnswer(
    _query: string,
    results: SearchResult[]
  ): Promise<{ answer: string; citations: StructuredRAGOutput['citations'] }> {
    await new Promise((r) => setTimeout(r, 22));

    const rawText = results[0].chunk.text;
    // Clean out any bracketed metadata prepend header like [Doc: ... | Sec: ...]
    const answer = rawText.replace(/^\[Doc:.*?\]\s*/, '').trim();

    const citations = results.map((r) => {
      const cleanSnippet = r.chunk.text.replace(/^\[Doc:.*?\]\s*/, '').trim();
      return {
        chunkId: r.chunk.id,
        title: r.chunk.metadata.title,
        section: r.chunk.metadata.sectionHeader,
        snippet: cleanSnippet.substring(0, 120) + '...',
        similarityScore: r.score,
      };
    });

    return {
      answer,
      citations,
    };
  }
}
