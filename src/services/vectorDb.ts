import type { Chunk } from './chunkingEngine';

export interface SearchResult {
  chunk: Chunk;
  score: number;       // Similarity score (0 to 1)
  denseScore: number;  // Dense vector similarity
  bm25Score: number;   // Term frequency score
  retrievalLatencyMs: number;
}

export interface VectorDbIndexStats {
  totalChunksIndexed: number;
  vocabularySize: number;
  indexBuildTimeMs: number;
  memoryUsageEstimateKb: number;
}

export class VectorDbEngine {
  private chunks: Chunk[] = [];
  private vectors: Map<string, number[]> = new Map();
  private vocabulary: Map<string, number> = new Map(); // word -> feature index
  private idf: Map<string, number> = new Map();
  private isIndexed: boolean = false;
  private buildStats: VectorDbIndexStats = {
    totalChunksIndexed: 0,
    vocabularySize: 0,
    indexBuildTimeMs: 0,
    memoryUsageEstimateKb: 0,
  };

  /**
   * Tokenize text into normalized terms & n-grams
   */
  private tokenize(text: string): string[] {
    const rawTokens = text.toLowerCase().replace(/[^\w\s]/g, ' ').split(/\s+/).filter(t => t.length > 1);
    const nGrams: string[] = [];
    
    // Add unigrams
    rawTokens.forEach(t => nGrams.push(t));
    
    // Add bigrams for context capture
    for (let i = 0; i < rawTokens.length - 1; i++) {
      nGrams.push(`${rawTokens[i]}_${rawTokens[i + 1]}`);
    }
    
    return nGrams;
  }

  /**
   * Build vector index over chunks with TF-IDF / Dense Feature representation
   */
  public indexChunks(chunks: Chunk[]): VectorDbIndexStats {
    const startTime = performance.now();
    this.chunks = chunks;
    this.vectors.clear();
    this.vocabulary.clear();
    this.idf.clear();

    const docCount = chunks.length;
    const docTermFreqs: Map<string, number>[] = [];
    const docFreq: Map<string, number> = new Map();

    // 1. Build Vocabulary and Document Frequencies
    chunks.forEach((chunk) => {
      const tokens = this.tokenize(chunk.text);
      const tfMap = new Map<string, number>();

      tokens.forEach((t) => {
        tfMap.set(t, (tfMap.get(t) || 0) + 1);
      });

      docTermFreqs.push(tfMap);

      // Track document frequency
      tfMap.forEach((_, term) => {
        docFreq.set(term, (docFreq.get(term) || 0) + 1);
        if (!this.vocabulary.has(term)) {
          this.vocabulary.set(term, this.vocabulary.size);
        }
      });
    });

    // 2. Compute IDF for each term: log((N + 1) / (df + 1)) + 1
    docFreq.forEach((df, term) => {
      this.idf.set(term, Math.log((docCount + 1) / (df + 1)) + 1);
    });

    // 3. Build normalized dense feature vectors for each chunk
    const vocabSize = this.vocabulary.size;
    chunks.forEach((chunk, i) => {
      const tfMap = docTermFreqs[i];
      const vector = new Array(vocabSize).fill(0);
      let normSq = 0;

      tfMap.forEach((count, term) => {
        const termIdx = this.vocabulary.get(term);
        const idfVal = this.idf.get(term) || 1.0;
        if (termIdx !== undefined) {
          const weight = (1 + Math.log(count)) * idfVal;
          vector[termIdx] = weight;
          normSq += weight * weight;
        }
      });

      // L2 Normalize
      const norm = Math.sqrt(normSq);
      if (norm > 0) {
        for (let j = 0; j < vocabSize; j++) {
          vector[j] /= norm;
        }
      }

      this.vectors.set(chunk.id, vector);
    });

    this.isIndexed = true;
    const endTime = performance.now();
    const buildTime = Number((endTime - startTime).toFixed(2));

    this.buildStats = {
      totalChunksIndexed: docCount,
      vocabularySize: vocabSize,
      indexBuildTimeMs: buildTime,
      memoryUsageEstimateKb: Math.round((docCount * vocabSize * 8) / 1024),
    };

    return this.buildStats;
  }

  /**
   * Embed query string into normalized vector space
   */
  private embedQuery(query: string): number[] {
    const tokens = this.tokenize(query);
    const vocabSize = this.vocabulary.size;
    const vector = new Array(vocabSize).fill(0);
    let normSq = 0;

    const tfMap = new Map<string, number>();
    tokens.forEach((t) => tfMap.set(t, (tfMap.get(t) || 0) + 1));

    tfMap.forEach((count, term) => {
      const termIdx = this.vocabulary.get(term);
      const idfVal = this.idf.get(term) || 1.0;
      if (termIdx !== undefined) {
        const weight = (1 + Math.log(count)) * idfVal;
        vector[termIdx] = weight;
        normSq += weight * weight;
      }
    });

    const norm = Math.sqrt(normSq);
    if (norm > 0) {
      for (let j = 0; j < vocabSize; j++) {
        vector[j] /= norm;
      }
    }

    return vector;
  }

  /**
   * Fast Vector Search (Cosine distance + BM25 hybrid ranking)
   * Target execution time: < 10ms
   */
  public search(query: string, topK: number = 3): SearchResult[] {
    const startTime = performance.now();
    if (!this.isIndexed || this.chunks.length === 0) {
      return [];
    }

    const queryVector = this.embedQuery(query);
    const queryTokens = this.tokenize(query);
    const results: SearchResult[] = [];

    for (const chunk of this.chunks) {
      const chunkVector = this.vectors.get(chunk.id);
      if (!chunkVector) continue;

      // 1. Vector Cosine Similarity (Dot product of normalized vectors)
      let dotProduct = 0;
      for (let i = 0; i < queryVector.length; i++) {
        if (queryVector[i] > 0 && chunkVector[i] > 0) {
          dotProduct += queryVector[i] * chunkVector[i];
        }
      }

      // 2. Term Match BM25 Boost
      let termMatches = 0;
      const chunkTextLower = chunk.text.toLowerCase();
      queryTokens.forEach((t) => {
        if (chunkTextLower.includes(t)) termMatches++;
      });
      const bm25Score = queryTokens.length > 0 ? termMatches / queryTokens.length : 0;

      // Combined Hybrid Score (70% Cosine + 30% BM25 keyword precision)
      const combinedScore = Math.min(1.0, dotProduct * 0.7 + bm25Score * 0.3);

      results.push({
        chunk,
        score: Number(combinedScore.toFixed(4)),
        denseScore: Number(dotProduct.toFixed(4)),
        bm25Score: Number(bm25Score.toFixed(4)),
        retrievalLatencyMs: 0, // set below
      });
    }

    // Sort by combined score descending
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, topK);

    const endTime = performance.now();
    const latency = Number((endTime - startTime).toFixed(3));

    // Assign measured latency
    topResults.forEach((r) => (r.retrievalLatencyMs = latency));

    return topResults;
  }

  public getStats(): VectorDbIndexStats {
    return this.buildStats;
  }

  public getChunksCount(): number {
    return this.chunks.length;
  }

  public getChunks(): Chunk[] {
    return this.chunks;
  }
}
