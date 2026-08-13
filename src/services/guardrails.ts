import type { SearchResult } from './vectorDb';

export interface GuardrailCheckResult {
  passed: boolean;
  stage: 'PRE_CHECK' | 'RELEVANCE_CHECK' | 'POST_GROUNDEDNESS';
  reason?: string;
  score?: number;
  isOffTopic: boolean;
  isPromptInjection: boolean;
  isGrounded: boolean;
  latencyMs: number;
}

export class GuardrailSuite {
  // Off-topic / harmful keywords & injection signatures
  private static offTopicPatterns = [
    /recipe|bake|cookie|pizza|cake/i,
    /weather forecast|who won the game|fifa/i,
    /write me a song|poem|joke/i,
  ];

  private static injectionPatterns = [
    /ignore all (previous|prior) instructions/i,
    /print your system prompt/i,
    /disregard safety/i,
    /bypass guardrails/i,
  ];

  /**
   * 1. Pre-execution guardrail check on user query
   */
  public static checkQuery(query: string): GuardrailCheckResult {
    const startTime = performance.now();
    const qLower = query.toLowerCase().trim();

    // Injection check
    for (const pattern of this.injectionPatterns) {
      if (pattern.test(qLower)) {
        const endTime = performance.now();
        return {
          passed: false,
          stage: 'PRE_CHECK',
          reason: 'Security violation: Prompt injection attempt detected.',
          score: 0,
          isOffTopic: true,
          isPromptInjection: true,
          isGrounded: false,
          latencyMs: Number((endTime - startTime).toFixed(3)),
        };
      }
    }

    // Off-topic check
    for (const pattern of this.offTopicPatterns) {
      if (pattern.test(qLower)) {
        const endTime = performance.now();
        return {
          passed: false,
          stage: 'PRE_CHECK',
          reason: 'Off-topic query: The query does not align with the dataset scope.',
          score: 0,
          isOffTopic: true,
          isPromptInjection: false,
          isGrounded: false,
          latencyMs: Number((endTime - startTime).toFixed(3)),
        };
      }
    }

    const endTime = performance.now();
    return {
      passed: true,
      stage: 'PRE_CHECK',
      score: 1.0,
      isOffTopic: false,
      isPromptInjection: false,
      isGrounded: true,
      latencyMs: Number((endTime - startTime).toFixed(3)),
    };
  }

  /**
   * 2. Relevance thresholding on retrieved context chunks
   */
  public static checkContextRelevance(results: SearchResult[], threshold: number = 0.25): GuardrailCheckResult {
    const startTime = performance.now();
    if (results.length === 0 || results[0].score < threshold) {
      const topScore = results.length > 0 ? results[0].score : 0;
      const endTime = performance.now();
      return {
        passed: false,
        stage: 'RELEVANCE_CHECK',
        reason: `Insufficient dataset context (Top score ${topScore.toFixed(2)} < threshold ${threshold}). Refusing to answer to prevent hallucination.`,
        score: topScore,
        isOffTopic: true,
        isPromptInjection: false,
        isGrounded: false,
        latencyMs: Number((endTime - startTime).toFixed(3)),
      };
    }

    const endTime = performance.now();
    return {
      passed: true,
      stage: 'RELEVANCE_CHECK',
      score: results[0].score,
      isOffTopic: false,
      isPromptInjection: false,
      isGrounded: true,
      latencyMs: Number((endTime - startTime).toFixed(3)),
    };
  }

  /**
   * 3. Groundedness & Hallucination check on generated answer vs retrieved context
   */
  public static verifyGroundedness(answerText: string, retrievedContext: string): GuardrailCheckResult {
    const startTime = performance.now();
    const answerWords = answerText.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 3);
    const contextLower = retrievedContext.toLowerCase();

    if (answerWords.length === 0) {
      const endTime = performance.now();
      return {
        passed: true,
        stage: 'POST_GROUNDEDNESS',
        score: 1.0,
        isOffTopic: false,
        isPromptInjection: false,
        isGrounded: true,
        latencyMs: Number((endTime - startTime).toFixed(3)),
      };
    }

    // Check how many key terms in the answer exist in retrieved context
    let supportedTerms = 0;
    answerWords.forEach(w => {
      if (contextLower.includes(w)) supportedTerms++;
    });

    const groundednessScore = Number((supportedTerms / answerWords.length).toFixed(3));
    const passed = groundednessScore >= 0.50;
    const endTime = performance.now();

    return {
      passed,
      stage: 'POST_GROUNDEDNESS',
      reason: passed ? undefined : `Low groundedness score (${groundednessScore} < 0.50). Answer contains unverified claims.`,
      score: groundednessScore,
      isOffTopic: false,
      isPromptInjection: false,
      isGrounded: passed,
      latencyMs: Number((endTime - startTime).toFixed(3)),
    };
  }
}
