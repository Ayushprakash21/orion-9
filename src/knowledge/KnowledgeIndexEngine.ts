/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Knowledge Index & Hybrid Search Engine
 * 
 * Provider-neutral vector embedding generation, keyword matching, and cosine similarity
 * hybrid search engine with strict tenant and security classification filtering.
 */

import { DocumentChunk, KnowledgeEmbedding, DocumentMetadata, DocumentClassification, DocumentSecurityClassification } from './types';

import { db, saveData, loadData } from '../data/db';

export interface SearchFilterOptions {
  tenantId: string;
  query: string;
  documentTypes?: DocumentClassification[];
  securityClassifications?: DocumentSecurityClassification[];
  maxResults?: number;
  minSimilarityScore?: number;
}

export interface SearchResultItem {
  chunk: DocumentChunk;
  document: DocumentMetadata;
  similarityScore: number;
}

export class KnowledgeIndexEngine {
  private static instance: KnowledgeIndexEngine;
  private embeddingsMap: Map<string, KnowledgeEmbedding> = new Map();
  private chunksMap: Map<string, DocumentChunk> = new Map();

  private constructor() {}

  public static getInstance(): KnowledgeIndexEngine {
    if (!KnowledgeIndexEngine.instance) {
      KnowledgeIndexEngine.instance = new KnowledgeIndexEngine();
    }
    return KnowledgeIndexEngine.instance;
  }

  /**
   * Generates a deterministic normalized 16-dimensional embedding vector for text
   */
  public generateEmbeddingVector(text: string): number[] {
    const vector = new Array(16).fill(0);
    const words = text.toLowerCase().split(/\W+/).filter(Boolean);
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      let hash = 0;
      for (let j = 0; j < word.length; j++) {
        hash = (hash << 5) - hash + word.charCodeAt(j);
        hash |= 0;
      }
      const idx = Math.abs(hash) % 16;
      vector[idx] += 1;
    }
    // Normalize vector to unit length
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vector.map(val => val / magnitude);
  }

  /**
   * Computes cosine similarity between two vector embeddings
   */
  public calculateCosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }

  /**
   * Indexes document chunks into knowledge embeddings
   */
  public async indexChunks(document: DocumentMetadata, chunks: DocumentChunk[]): Promise<KnowledgeEmbedding[]> {
    const embeddings: KnowledgeEmbedding[] = [];

    for (const chunk of chunks) {
      const vector = this.generateEmbeddingVector(chunk.text);
      const embeddingId = `EMB-${chunk.chunkId}`;

      const embedding: KnowledgeEmbedding = {
        embeddingId,
        tenantId: document.tenantId,
        documentId: document.documentId,
        documentVersionId: `VER-${document.documentId}-${document.version}`,
        chunkId: chunk.chunkId,
        modelProvider: 'orion-native-vector-v1',
        embeddingVersion: '1.0.0',
        vector,
        createdAt: new Date().toISOString()
      };

      embeddings.push(embedding);
      this.embeddingsMap.set(chunk.chunkId, embedding);
      this.chunksMap.set(chunk.chunkId, chunk);
    }

    try {
      await saveData<KnowledgeEmbedding>((db as any).knowledgeEmbeddings, embeddings);
    } catch (err) {
      console.warn(`[KnowledgeIndexEngine] Failed to persist embeddings:`, err);
    }

    return embeddings;
  }

  /**
   * Hybrid search performing cosine similarity ranking filtered by tenant and security bounds
   */
  public async search(options: SearchFilterOptions): Promise<SearchResultItem[]> {
    const queryVector = this.generateEmbeddingVector(options.query);
    const queryTerms = options.query.toLowerCase().split(/\s+/).filter(Boolean);
    const results: SearchResultItem[] = [];

    // Load persisted data
    let allChunks: DocumentChunk[] = Array.from(this.chunksMap.values());
    let allDocs: DocumentMetadata[] = [];

    try {
      const loadedChunks = await loadData<DocumentChunk>((db as any).documentChunks);
      if (loadedChunks && Array.isArray(loadedChunks) && loadedChunks.length > 0) {
        allChunks = loadedChunks;
      }
      const loadedDocs = await loadData<DocumentMetadata>((db as any).documents);
      if (loadedDocs && Array.isArray(loadedDocs)) {
        allDocs = loadedDocs;
      }
    } catch (err) {
      console.warn(`[KnowledgeIndexEngine] Search data load warning:`, err);
    }

    const docsMap = new Map(allDocs.map(d => [`${d.tenantId}:${d.documentId}`, d]));
    const { documentIngestionService } = await import('./DocumentIngestionService');
    const ingestedDocs = await documentIngestionService.listDocuments(options.tenantId);
    for (const d of ingestedDocs) {
      docsMap.set(`${d.tenantId}:${d.documentId}`, d);
    }

    for (const chunk of allChunks) {

      if (chunk.tenantId !== options.tenantId) continue;

      const doc = docsMap.get(`${options.tenantId}:${chunk.documentId}`);
      if (doc) {
        if (options.documentTypes && !options.documentTypes.includes(doc.documentType)) continue;
        if (options.securityClassifications && !options.securityClassifications.includes(doc.securityClassification)) continue;
      }

      const chunkVector = this.generateEmbeddingVector(chunk.text);
      const vecSim = this.calculateCosineSimilarity(queryVector, chunkVector);

      // Keyword match bonus
      let keywordHits = 0;
      const lowerText = chunk.text.toLowerCase();
      for (const term of queryTerms) {
        if (lowerText.includes(term)) keywordHits++;
      }
      const keywordBonus = queryTerms.length > 0 ? (keywordHits / queryTerms.length) * 0.3 : 0;
      const finalScore = Math.min(1.0, vecSim * 0.7 + keywordBonus);

      if (finalScore >= (options.minSimilarityScore || 0.1)) {
        results.push({
          chunk,
          document: doc || {
            documentId: chunk.documentId,
            tenantId: chunk.tenantId,
            fileName: `Document-${chunk.documentId}`,
            fileSize: 0,
            mimeType: 'text/plain',
            checksum: chunk.checksum,
            storageReference: '',
            documentType: 'OTHER',
            securityClassification: 'INTERNAL',
            status: 'INDEXED',
            version: '1.0.0',
            sourceSystem: 'FILE_UPLOAD',
            ownerId: 'SYSTEM',
            createdAt: new Date().toISOString(),
            createdBy: 'SYSTEM',
            updatedAt: new Date().toISOString(),
            updatedBy: 'SYSTEM'
          },
          similarityScore: parseFloat(finalScore.toFixed(4))
        });
      }
    }

    results.sort((a, b) => b.similarityScore - a.similarityScore);
    return results.slice(0, options.maxResults || 10);
  }

  public clear(): void {
    this.embeddingsMap.clear();
    this.chunksMap.clear();
  }
}

export const knowledgeIndexEngine = KnowledgeIndexEngine.getInstance();
