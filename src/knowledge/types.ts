/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Domain Types & Schemas
 * 
 * Strict enterprise-grade typing for multi-tenant, versioned, policy-gated,
 * Kernel-integrated Knowledge & Document Intelligence operations.
 */

export type DocumentClassification =
  | 'PURCHASE_ORDER'
  | 'INVOICE'
  | 'ASN'
  | 'QUALITY_CERTIFICATE'
  | 'SUPPLIER_CERTIFICATE'
  | 'CONTRACT'
  | 'SOP'
  | 'POLICY'
  | 'WORK_INSTRUCTION'
  | 'REGULATORY'
  | 'SHIPPING_DOCUMENT'
  | 'CUSTOMER_DOCUMENT'
  | 'COMPLIANCE'
  | 'OTHER';

export type DocumentSecurityClassification =
  | 'PUBLIC_WITHIN_TENANT'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED'
  | 'REGULATED';

export type DocumentStatus =
  | 'RECEIVED'
  | 'PROCESSING'
  | 'EXTRACTED'
  | 'VALIDATING'
  | 'INDEXED'
  | 'READY'
  | 'REVIEW_REQUIRED'
  | 'FAILED'
  | 'QUARANTINED'
  | 'SUPERSEDED'
  | 'ARCHIVED'
  | 'EXPIRED'
  | 'REVOKED';

export type DocumentSourceSystem =
  | 'FILE_UPLOAD'
  | 'REST_API'
  | 'SFTP'
  | 'EDI_ATTACHMENT'
  | 'ERP_CONNECTOR'
  | 'SUPPLIER_PORTAL'
  | 'WORKFLOW_ATTACHMENT'
  | 'EMAIL';

export interface DocumentMetadata {
  documentId: string;
  tenantId: string;
  organizationId?: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  checksum: string; // SHA-256
  storageReference: string;
  documentType: DocumentClassification;
  securityClassification: DocumentSecurityClassification;
  status: DocumentStatus;
  version: string;
  sourceSystem: DocumentSourceSystem;
  sourceReference?: string;
  ownerId: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  expirationDate?: string;
  tags?: string[];
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
}

export interface DocumentVersion {
  versionId: string;
  documentId: string;
  tenantId: string;
  version: string;
  checksum: string;
  storageReference: string;
  fileSize: number;
  changeDescription: string;
  status: DocumentStatus;
  effectiveFrom: string;
  effectiveTo?: string;
  createdBy: string;
  createdAt: string;
}

export interface ExtractedFieldCandidate {
  fieldName: string;
  extractedValue: any;
  confidenceScore: number;
  sourcePage?: number;
  sourceSection?: string;
  lineRange?: string;
  boundingText?: string;
  isValidated: boolean;
  validatedValue?: any;
  validatedBy?: string;
  validatedAt?: string;
}

export interface DocumentExtraction {
  extractionId: string;
  documentId: string;
  documentVersionId: string;
  tenantId: string;
  extractorVersion: string;
  fields: Record<string, ExtractedFieldCandidate>;
  rawExtractedText: string;
  status: 'UNVALIDATED' | 'PARTIALLY_VALIDATED' | 'VALIDATED' | 'REJECTED';
  extractedAt: string;
}

export interface DocumentChunk {
  chunkId: string;
  documentId: string;
  documentVersionId: string;
  tenantId: string;
  sequence: number;
  page?: number;
  sectionHeading?: string;
  text: string;
  tokenCount: number;
  checksum: string;
  createdAt: string;
}

export interface KnowledgeEmbedding {
  embeddingId: string;
  tenantId: string;
  documentId: string;
  documentVersionId: string;
  chunkId: string;
  modelProvider: string;
  embeddingVersion: string;
  vector: number[]; // Cosine similarity embedding vector
  createdAt: string;
}

export interface KnowledgeCitation {
  citationId: string;
  documentId: string;
  documentName: string;
  version: string;
  page?: number;
  section?: string;
  excerpt: string;
  relevanceScore: number;
}

export interface KnowledgeRetrievalRequest {
  query: string;
  tenantId: string;
  userId: string;
  userRole: string;
  documentTypes?: DocumentClassification[];
  securityClassifications?: DocumentSecurityClassification[];
  maxResults?: number;
  minSimilarityScore?: number;
  includeCitations?: boolean;
}

export interface KnowledgeRetrievalResponse {
  retrievalId: string;
  query: string;
  tenantId: string;
  retrievedText: string;
  answerSummary: string;
  citations: KnowledgeCitation[];
  threatSanitized: boolean;
  threatsDetected?: string[];
  executionTimeMs: number;
  retrievedAt: string;
}

export interface DocumentExpirationNotice {
  noticeId: string;
  tenantId: string;
  documentId: string;
  documentName: string;
  documentType: DocumentClassification;
  entityReference?: string;
  expirationDate: string;
  daysUntilExpiration: number;
  status: 'WARNING' | 'EXPIRED' | 'RENEWED' | 'DISMISSED';
  notifiedAt: string;
}

export interface DocumentLineageNode {
  lineageId: string;
  tenantId: string;
  documentId: string;
  documentVersionId: string;
  chunkId?: string;
  extractionId?: string;
  aiProposalId?: string;
  workflowInstanceId?: string;
  commandEnvelopeId?: string;
  outcomeId?: string;
  timestamp: string;
}
