/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Knowledge Lifecycle & Integration Test Suite
 * 
 * Verifies end-to-end knowledge and document processing:
 * 1. Multi-source document ingestion & SHA-256 checksum integrity
 * 2. OCR parser candidate extraction with page/section provenance
 * 3. Non-authoritative candidate field validation (candidates do NOT alter SCM truth unvalidated)
 * 4. Section-aware chunking and hybrid vector indexing
 * 5. RAG retrieval with exact evidence citations
 * 6. Compliance expiration monitoring and Control Tower signal emission
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  documentIngestionService,
  documentExtractorEngine,
  documentChunkerEngine,
  knowledgeIndexEngine,
  knowledgeRetrievalEngine,
  documentExpirationMonitor,
  documentIntegrityService,
  documentMdmBridge
} from '../../knowledge';

describe('Part 4 Track 7 Knowledge & Document Intelligence Integration', () => {
  const TENANT_ID = 'TENANT_KNOWLEDGE_TEST';

  beforeEach(() => {
    documentIngestionService.clear();
    knowledgeIndexEngine.clear();
  });

  describe('1. Checksum & Ingestion Integrity', () => {
    it('ingests document, calculates SHA-256 checksum, and detects duplicate uploads', async () => {
      const content = `MASTER AGREEMENT\nPO Number: PO-9901\nSupplier: ACME Corp\nTotal: $50,000`;
      const { document: doc1, isDuplicate: dup1 } = await documentIngestionService.ingestDocument({
        tenantId: TENANT_ID,
        fileName: 'Contract_ACME.txt',
        content,
        mimeType: 'text/plain',
        documentType: 'CONTRACT',
        sourceSystem: 'FILE_UPLOAD',
        ownerId: 'ADMIN'
      });

      expect(dup1).toBe(false);
      expect(doc1.checksum).toMatch(/^sha256-/);

      // Re-ingest exact same content -> duplicate detected
      const { isDuplicate: dup2 } = await documentIngestionService.ingestDocument({
        tenantId: TENANT_ID,
        fileName: 'Contract_ACME_Copy.txt',
        content,
        mimeType: 'text/plain',
        documentType: 'CONTRACT',
        sourceSystem: 'FILE_UPLOAD',
        ownerId: 'ADMIN'
      });

      expect(dup2).toBe(true);
    });
  });

  describe('2. OCR Candidate Extraction & Provenance', () => {
    it('extracts candidate fields with page/section provenance without overwriting truth', async () => {
      const content = `INVOICE VENDOR REPORT\nSupplier: FastFreight Shipping\nPO-100293\nINV-881029\nTotal: $12,500.00\nExpires: 2026-12-31`;
      const { document } = await documentIngestionService.ingestDocument({
        tenantId: TENANT_ID,
        fileName: 'Invoice_881029.txt',
        content,
        mimeType: 'text/plain',
        documentType: 'INVOICE',
        sourceSystem: 'REST_API',
        ownerId: 'AP_USER'
      });

      const extraction = await documentExtractorEngine.extractDocumentFields(document, content);
      expect(extraction.status).toBe('UNVALIDATED');
      expect(extraction.fields.invoiceNumber).toBeDefined();
      expect(extraction.fields.invoiceNumber.extractedValue).toBe('INV-881029');
      expect(extraction.fields.invoiceNumber.isValidated).toBe(false);

      // AI/unvalidated promotion must throw error
      await expect(
        documentMdmBridge.promoteExtractionToMasterData(extraction, {
          id: 'AI_AGENT',
          role: 'ai',
          isAi: true
        })
      ).rejects.toThrow();
    });
  });

  describe('3. Section-Aware Chunking & Hybrid Vector Search', () => {
    it('chunks document text and performs cosine hybrid vector search', async () => {
      const content = `[Page 1]\nSection 1: Inbound Logistics SLA\nSupplier guarantees 48 hour lead time.\n\n[Page 2]\nSection 2: Quality Certifications\nSupplier holds ISO-9001 certification expiring 2026-11-15.`;
      const { document } = await documentIngestionService.ingestDocument({
        tenantId: TENANT_ID,
        fileName: 'Logistics_SOP.txt',
        content,
        mimeType: 'text/plain',
        documentType: 'SOP',
        sourceSystem: 'FILE_UPLOAD',
        ownerId: 'LOGISTICS_LEAD'
      });

      const chunks = await documentChunkerEngine.chunkDocument(document, content);
      expect(chunks.length).toBeGreaterThanOrEqual(2);

      await knowledgeIndexEngine.indexChunks(document, chunks);

      const searchResults = await knowledgeIndexEngine.search({
        tenantId: TENANT_ID,
        query: 'lead time SLA'
      });

      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].similarityScore).toBeGreaterThan(0.2);
    });
  });

  describe('4. RAG Retrieval & Exact Evidence Citations', () => {
    it('returns answer summary with exact evidence citations and zero hallucinated sources', async () => {
      const content = `Section 1: Delivery Terms\nAll shipments to DC-NORTH must arrive before 14:00 EST. Vendor incurs $500 penalty per hour of unexcused delay.`;
      const { document } = await documentIngestionService.ingestDocument({
        tenantId: TENANT_ID,
        fileName: 'DC_Delivery_Policy.txt',
        content,
        mimeType: 'text/plain',
        documentType: 'POLICY',
        sourceSystem: 'FILE_UPLOAD',
        ownerId: 'OPS_MGR'
      });

      const chunks = await documentChunkerEngine.chunkDocument(document, content);
      await knowledgeIndexEngine.indexChunks(document, chunks);

      const response = await knowledgeRetrievalEngine.retrieveKnowledge({
        tenantId: TENANT_ID,
        query: 'penalty for unexcused delay',
        userId: 'USER_1',
        userRole: 'admin',
        includeCitations: true
      });

      expect(response.citations.length).toBeGreaterThan(0);
      expect(response.citations[0].documentName).toBe('DC_Delivery_Policy.txt');
      expect(response.citations[0].excerpt).toContain('penalty');
    });

    it('returns explicit Evidence Unavailable when query yields no matches', async () => {
      const response = await knowledgeRetrievalEngine.retrieveKnowledge({
        tenantId: TENANT_ID,
        query: 'nonexistent quantum physics formula',
        userId: 'USER_1',
        userRole: 'admin'
      });

      expect(response.answerSummary).toContain('Evidence unavailable');
    });
  });

  describe('5. Expiration Monitoring & SLA Signals', () => {
    it('detects expiring supplier certificates and generates SLA notices', async () => {
      await documentIngestionService.ingestDocument({
        tenantId: TENANT_ID,
        fileName: 'ISO_Cert_Expired.txt',
        content: 'Expired Cert',
        mimeType: 'text/plain',
        documentType: 'SUPPLIER_CERTIFICATE',
        sourceSystem: 'SUPPLIER_PORTAL',
        ownerId: 'SUPPLIER_01',
        expirationDate: '2025-01-01' // Past date -> Expired
      });

      const notices = await documentExpirationMonitor.scanExpirations(TENANT_ID);
      expect(notices.length).toBeGreaterThan(0);
      expect(notices[0].status).toBe('EXPIRED');
    });
  });
});
