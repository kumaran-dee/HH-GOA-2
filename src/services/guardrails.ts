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
   * 2. Relevance thresholding & Subject Verification on retrieved context chunks
   */
  public static checkContextRelevance(
    query: string,
    results: SearchResult[],
    threshold: number = 0.20
  ): GuardrailCheckResult {
    const startTime = performance.now();

    if (results.length === 0) {
      const endTime = performance.now();
      return {
        passed: false,
        stage: 'RELEVANCE_CHECK',
        reason: "I couldn't find relevant information to answer that question.",
        score: 0,
        isOffTopic: true,
        isPromptInjection: false,
        isGrounded: false,
        latencyMs: Number((endTime - startTime).toFixed(3)),
      };
    }

    const topResult = results[0];
    const topScore = topResult.score;

    // Self-Check Verification: Does the retrieved context mention the main subject of the question?
    const stopWords = new Set(['what', 'is', 'the', 'how', 'do', 'where', 'can', 'you', 'give', 'me', 'a', 'an', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'about', 'does', 'did', 'was', 'were', 'tell', 'explain']);
    const queryWords = query.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w));

    const contextText = (topResult.chunk.metadata.title + ' ' + topResult.chunk.text).toLowerCase();

    let matchedTerms = 0;
    queryWords.forEach(w => {
      if (contextText.includes(w)) matchedTerms++;
    });

    const hasSubjectOverlap = queryWords.length === 0 || matchedTerms > 0;

    // Reject retrieval if similarity is low or query subject is entirely absent from retrieved document (e.g. Manhattan Project vs Inflation)
    if (topScore < threshold || !hasSubjectOverlap) {
      const endTime = performance.now();
      return {
        passed: false,
        stage: 'RELEVANCE_CHECK',
        reason: "I couldn't find relevant information to answer that question.",
        score: Number(topScore.toFixed(3)),
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
      score: topScore,
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
