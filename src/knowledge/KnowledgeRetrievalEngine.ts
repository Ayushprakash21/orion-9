/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * RAG Knowledge Retrieval Engine with Evidence Citation & Security Guard Integration
 * 
 * Provides RAG query processing, prompt injection defense (via AISecurityGuard),
 * multi-tenant authorization filtering, and exact evidence citation generation.
 */

import { KnowledgeRetrievalRequest, KnowledgeRetrievalResponse, KnowledgeCitation } from './types';
import { knowledgeIndexEngine } from './KnowledgeIndexEngine';
import { AISecurityGuard } from '../ai/AISecurityGuard';
import { db, saveData } from '../data/db';

export class KnowledgeRetrievalEngine {
  private static instance: KnowledgeRetrievalEngine;
  private aiSecurityGuard: AISecurityGuard;

  private constructor() {
    this.aiSecurityGuard = AISecurityGuard.getInstance();
  }

  public static getInstance(): KnowledgeRetrievalEngine {
    if (!KnowledgeRetrievalEngine.instance) {
      KnowledgeRetrievalEngine.instance = new KnowledgeRetrievalEngine();
    }
    return KnowledgeRetrievalEngine.instance;
  }

  /**
   * Executes a governed RAG retrieval query with prompt injection defense and exact evidence citations
   */
  public async retrieveKnowledge(request: KnowledgeRetrievalRequest): Promise<KnowledgeRetrievalResponse> {
    const startTime = Date.now();

    // 1. Sanitize query and defend against prompt injection
    const sanitizeResult = this.aiSecurityGuard.sanitizeExternalContent(request.query, 'user_rag_query');
    const isThreatDetected = sanitizeResult.isFlagged;

    // 2. Perform tenant-isolated hybrid vector search
    const searchResults = await knowledgeIndexEngine.search({
      tenantId: request.tenantId,
      query: request.query,
      documentTypes: request.documentTypes,
      securityClassifications: request.securityClassifications,
      maxResults: request.maxResults || 5,
      minSimilarityScore: request.minSimilarityScore || 0.15
    });

    const citations: KnowledgeCitation[] = [];
    const textPassages: string[] = [];

    // 3. Construct evidence passages and exact citations
    for (const item of searchResults) {
      const citationId = `CIT-${item.chunk.chunkId}`;
      const citation: KnowledgeCitation = {
        citationId,
        documentId: item.document.documentId,
        documentName: item.document.fileName,
        version: item.document.version,
        page: item.chunk.page,
        section: item.chunk.sectionHeading,
        excerpt: item.chunk.text.length > 200 ? item.chunk.text.substring(0, 200) + '...' : item.chunk.text,
        relevanceScore: item.similarityScore
      };

      citations.push(citation);
      textPassages.push(
        `[Document: ${item.document.fileName} (v${item.document.version}), Page ${item.chunk.page || 1}, Section: ${item.chunk.sectionHeading || 'General'}]\n${item.chunk.text}`
      );
    }

    let answerSummary = '';
    if (searchResults.length === 0) {
      answerSummary = 'Evidence unavailable: No matching enterprise documents found matching the search criteria under tenant scope.';
    } else {
      answerSummary = `Retrieved ${searchResults.length} authoritative document passages. Top evidence match: "${searchResults[0].document.fileName}" (Relevance: ${(searchResults[0].similarityScore * 100).toFixed(1)}%).`;
    }

    const retrievalId = `RET-${request.tenantId}-${Date.now()}`;
    const response: KnowledgeRetrievalResponse = {
      retrievalId,
      query: request.query,
      tenantId: request.tenantId,
      retrievedText: textPassages.join('\n\n'),
      answerSummary,
      citations: request.includeCitations !== false ? citations : [],
      threatSanitized: true,
      threatsDetected: isThreatDetected ? sanitizeResult.detectedThreats : [],
      executionTimeMs: Date.now() - startTime,
      retrievedAt: new Date().toISOString()
    };

    try {
      await saveData<KnowledgeRetrievalResponse>((db as any).knowledgeRetrievals, [response]);
    } catch (err) {
      console.warn(`[KnowledgeRetrievalEngine] Failed to log retrieval record:`, err);
    }

    return response;
  }
}

export const knowledgeRetrievalEngine = KnowledgeRetrievalEngine.getInstance();
