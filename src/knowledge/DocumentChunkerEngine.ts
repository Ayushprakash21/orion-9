/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Document Chunker Engine
 * 
 * Section-aware deterministic document chunking preserving document structure,
 * page numbers, section headings, and sequence integrity.
 */

import { DocumentChunk, DocumentMetadata } from './types';
import { documentIntegrityService } from './DocumentIntegrityService';
import { db, saveData } from '../data/db';

export class DocumentChunkerEngine {
  private static instance: DocumentChunkerEngine;

  private constructor() {}

  public static getInstance(): DocumentChunkerEngine {
    if (!DocumentChunkerEngine.instance) {
      DocumentChunkerEngine.instance = new DocumentChunkerEngine();
    }
    return DocumentChunkerEngine.instance;
  }

  /**
   * Chunks raw document text into section-aware chunks
   */
  public async chunkDocument(
    document: DocumentMetadata,
    rawText: string,
    maxChunkSize: number = 500
  ): Promise<DocumentChunk[]> {
    const chunks: DocumentChunk[] = [];
    const paragraphs = rawText.split(/\n\s*\n/);
    let currentSequence = 1;
    let currentPage = 1;
    let currentSection = 'General';

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx].trim();
      if (!para) continue;

      // Check section headings (e.g. "Section 1:", "1. Introduction", "## Terms")
      const headingMatch = para.match(/^(?:Section\s+\d+|[0-9]+\.[0-9]*\s+[A-Z]|#{1,3}\s+[A-Z])[^\n]*/i);
      if (headingMatch) {
        currentSection = headingMatch[0].replace(/^#+\s*/, '').trim();
      }

      // Estimate page markers if present (e.g. "[Page 2]")
      const pageMatch = para.match(/\[Page\s+(\d+)\]/i);
      if (pageMatch) {
        currentPage = parseInt(pageMatch[1], 10);
      }

      const checksum = documentIntegrityService.calculateChecksum(para);
      const chunkId = `CHK-${document.tenantId}-${document.documentId}-${currentSequence}`;

      const chunk: DocumentChunk = {
        chunkId,
        documentId: document.documentId,
        documentVersionId: `VER-${document.documentId}-${document.version}`,
        tenantId: document.tenantId,
        sequence: currentSequence,
        page: currentPage,
        sectionHeading: currentSection,
        text: para,
        tokenCount: para.split(/\s+/).length,
        checksum,
        createdAt: new Date().toISOString()
      };

      chunks.push(chunk);
      currentSequence++;
    }

    try {
      await saveData<DocumentChunk>((db as any).documentChunks, chunks);
    } catch (err) {
      console.warn(`[DocumentChunkerEngine] Failed to persist chunks for ${document.documentId}:`, err);
    }

    return chunks;
  }
}

export const documentChunkerEngine = DocumentChunkerEngine.getInstance();
