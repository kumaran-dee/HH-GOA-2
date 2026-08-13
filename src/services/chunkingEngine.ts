import type { MSMARCOPassage } from './msmarcoDataset';

export type ChunkingStrategyType = 'fixed' | 'semantic' | 'metadata-aware' | 'recursive';

export interface Chunk {
  id: string;
  passageId: string;
  text: string;
  strategy: ChunkingStrategyType;
  index: number;
  wordCount: number;
  charCount: number;
  metadata: {
    title: string;
    category: string;
    sectionHeader: string;
    domain?: string;
    hasPrependHeader?: boolean;
    startOffset?: number;
    endOffset?: number;
  };
}

export interface ChunkingOptions {
  chunkSize?: number;      // target char/token size (default 250)
  chunkOverlap?: number;   // overlap char size (default 50)
  semanticThreshold?: number; // threshold for sentence split
}

export interface ChunkingStats {
  strategy: ChunkingStrategyType;
  totalChunks: number;
  avgChunkLength: number; // in characters
  avgWordCount: number;
  overlapDensity: number; // percentage
  executionTimeMs: number;
}

export class ChunkingEngine {
  /**
   * Main chunking entry point supporting vast strategies
   */
  static processPassage(
    passage: MSMARCOPassage,
    strategy: ChunkingStrategyType,
    options: ChunkingOptions = {}
  ): { chunks: Chunk[]; stats: ChunkingStats } {
    const startTime = performance.now();
    const size = options.chunkSize || 250;
    const overlap = options.chunkOverlap || 50;

    let chunks: Chunk[] = [];

    switch (strategy) {
      case 'fixed':
        chunks = this.fixedSizeChunking(passage, size, overlap);
        break;
      case 'semantic':
        chunks = this.semanticChunking(passage, size);
        break;
      case 'metadata-aware':
        chunks = this.metadataAwareChunking(passage, size, overlap);
        break;
      case 'recursive':
        chunks = this.recursiveCharacterChunking(passage, size);
        break;
      default:
        chunks = this.fixedSizeChunking(passage, size, overlap);
    }

    const endTime = performance.now();
    const totalChars = chunks.reduce((acc, c) => acc + c.charCount, 0);
    const totalWords = chunks.reduce((acc, c) => acc + c.wordCount, 0);

    const stats: ChunkingStats = {
      strategy,
      totalChunks: chunks.length,
      avgChunkLength: chunks.length > 0 ? Math.round(totalChars / chunks.length) : 0,
      avgWordCount: chunks.length > 0 ? Math.round(totalWords / chunks.length) : 0,
      overlapDensity: chunks.length > 1 ? Math.round((overlap / size) * 100) : 0,
      executionTimeMs: Number((endTime - startTime).toFixed(3)),
    };

    return { chunks, stats };
  }

  /**
   * 1. Fixed-Size Chunking with Overlap handling
   */
  private static fixedSizeChunking(passage: MSMARCOPassage, chunkSize: number, overlap: number): Chunk[] {
    const text = passage.text;
    const chunks: Chunk[] = [];
    let start = 0;
    let index = 0;

    while (start < text.length) {
      let end = Math.min(start + chunkSize, text.length);
      // Adjust to word boundary if not at end
      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + Math.floor(chunkSize * 0.6)) {
          end = lastSpace;
        }
      }

      const chunkText = text.substring(start, end).trim();
      if (chunkText.length > 0) {
        chunks.push({
          id: `${passage.id}-fixed-${index}`,
          passageId: passage.id,
          text: chunkText,
          strategy: 'fixed',
          index,
          charCount: chunkText.length,
          wordCount: chunkText.split(/\s+/).filter(Boolean).length,
          metadata: {
            title: passage.title,
            category: passage.category,
            sectionHeader: passage.metadata.sectionHeader,
            startOffset: start,
            endOffset: end,
          },
        });
        index++;
      }

      if (end >= text.length) break;
      start = end - overlap;
      if (start < 0) start = 0;
    }

    return chunks;
  }

  /**
   * 2. Semantic Chunking (Split by sentence/paragraph topic boundaries)
   */
  private static semanticChunking(passage: MSMARCOPassage, maxChunkSize: number): Chunk[] {
    const text = passage.text;
    // Split into sentences using punctuation boundaries
    const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)/g) || [text];
    const chunks: Chunk[] = [];
    let currentBuffer = '';
    let index = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i].trim();
      if (!sentence) continue;

      if ((currentBuffer + ' ' + sentence).length > maxChunkSize && currentBuffer.length > 0) {
        chunks.push({
          id: `${passage.id}-sem-${index}`,
          passageId: passage.id,
          text: currentBuffer,
          strategy: 'semantic',
          index,
          charCount: currentBuffer.length,
          wordCount: currentBuffer.split(/\s+/).filter(Boolean).length,
          metadata: {
            title: passage.title,
            category: passage.category,
            sectionHeader: passage.metadata.sectionHeader,
          },
        });
        index++;
        currentBuffer = sentence;
      } else {
        currentBuffer = currentBuffer ? `${currentBuffer} ${sentence}` : sentence;
      }
    }

    if (currentBuffer.length > 0) {
      chunks.push({
        id: `${passage.id}-sem-${index}`,
        passageId: passage.id,
        text: currentBuffer,
        strategy: 'semantic',
        index,
        charCount: currentBuffer.length,
        wordCount: currentBuffer.split(/\s+/).filter(Boolean).length,
        metadata: {
          title: passage.title,
          category: passage.category,
          sectionHeader: passage.metadata.sectionHeader,
        },
      });
    }

    return chunks;
  }

  /**
   * 3. Metadata-Aware Chunking (Enriches text with document headers & domain context)
   */
  private static metadataAwareChunking(passage: MSMARCOPassage, chunkSize: number, overlap: number): Chunk[] {
    const baseChunks = this.fixedSizeChunking(passage, chunkSize, overlap);
    return baseChunks.map((c, i) => {
      const enrichedHeader = `[Doc: ${passage.title} | Sec: ${passage.metadata.sectionHeader} | Domain: ${passage.metadata.domain}] `;
      const enrichedText = `${enrichedHeader}${c.text}`;
      return {
        ...c,
        id: `${passage.id}-meta-${i}`,
        strategy: 'metadata-aware' as const,
        text: enrichedText,
        charCount: enrichedText.length,
        wordCount: enrichedText.split(/\s+/).filter(Boolean).length,
        metadata: {
          ...c.metadata,
          domain: passage.metadata.domain,
          hasPrependHeader: true,
        },
      };
    });
  }

  /**
   * 4. Recursive Character Splitting (Hierarchical separators: \n\n, \n, . , space)
   */
  private static recursiveCharacterChunking(passage: MSMARCOPassage, maxChunkSize: number): Chunk[] {
    const text = passage.text;
    const separators = ['\n\n', '\n', '. ', ' '];
    
    function splitText(input: string, sepIndex: number): string[] {
      if (input.length <= maxChunkSize || sepIndex >= separators.length) {
        return [input];
      }
      const sep = separators[sepIndex];
      const splits = input.split(sep);
      const result: string[] = [];
      let temp = '';

      for (const piece of splits) {
        const candidate = temp ? `${temp}${sep}${piece}` : piece;
        if (candidate.length <= maxChunkSize) {
          temp = candidate;
        } else {
          if (temp) result.push(temp);
          if (piece.length > maxChunkSize) {
            // Recurse with finer separator
            result.push(...splitText(piece, sepIndex + 1));
            temp = '';
          } else {
            temp = piece;
          }
        }
      }
      if (temp) result.push(temp);
      return result;
    }

    const rawPieces = splitText(text, 0);
    return rawPieces.map((piece, index) => ({
      id: `${passage.id}-rec-${index}`,
      passageId: passage.id,
      text: piece.trim(),
      strategy: 'recursive' as const,
      index,
      charCount: piece.trim().length,
      wordCount: piece.trim().split(/\s+/).filter(Boolean).length,
      metadata: {
        title: passage.title,
        category: passage.category,
        sectionHeader: passage.metadata.sectionHeader,
      },
    }));
  }
}
