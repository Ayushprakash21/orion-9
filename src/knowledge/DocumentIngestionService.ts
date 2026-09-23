/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Document Ingestion Service
 * 
 * Handles multi-source document ingestion, storage pathing, metadata creation,
 * tenant isolation, versioning, and document classification tracking.
 */

import { DocumentMetadata, DocumentVersion, DocumentClassification, DocumentSecurityClassification, DocumentSourceSystem } from './types';
import { documentIntegrityService } from './DocumentIntegrityService';
import { db, saveData, loadData } from '../data/db';

export class DocumentIngestionService {
  private static instance: DocumentIngestionService;
  private documentsMap: Map<string, DocumentMetadata> = new Map();
  private versionsMap: Map<string, DocumentVersion[]> = new Map();

  private constructor() {}

  public static getInstance(): DocumentIngestionService {
    if (!DocumentIngestionService.instance) {
      DocumentIngestionService.instance = new DocumentIngestionService();
    }
    return DocumentIngestionService.instance;
  }

  /**
   * Ingests a new document with checksum verification and governed Storage path assignment
   */
  public async ingestDocument(params: {
    tenantId: string;
    organizationId?: string;
    fileName: string;
    content: string | Uint8Array;
    mimeType: string;
    documentType: DocumentClassification;
    securityClassification?: DocumentSecurityClassification;
    sourceSystem: DocumentSourceSystem;
    sourceReference?: string;
    ownerId: string;
    effectiveFrom?: string;
    effectiveTo?: string;
    expirationDate?: string;
    tags?: string[];
  }): Promise<{ document: DocumentMetadata; isDuplicate: boolean }> {
    const checksum = documentIntegrityService.calculateChecksum(params.content);
    const existingDup = await documentIntegrityService.detectDuplicate(params.tenantId, checksum);
    
    if (existingDup) {
      return { document: existingDup, isDuplicate: true };
    }

    const documentId = `DOC-${params.tenantId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const version = '1.0.0';
    const fileSize = typeof params.content === 'string' ? params.content.length : params.content.byteLength;
    const storageReference = `tenant/${params.tenantId}/documents/${documentId}/versions/${version}/${params.fileName}`;

    const document: DocumentMetadata = {
      documentId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      fileName: params.fileName,
      fileSize,
      mimeType: params.mimeType,
      checksum,
      storageReference,
      documentType: params.documentType,
      securityClassification: params.securityClassification || 'INTERNAL',
      status: 'RECEIVED',
      version,
      sourceSystem: params.sourceSystem,
      sourceReference: params.sourceReference,
      ownerId: params.ownerId,
      effectiveFrom: params.effectiveFrom || new Date().toISOString(),
      effectiveTo: params.effectiveTo,
      expirationDate: params.expirationDate,
      tags: params.tags || [],
      createdAt: new Date().toISOString(),
      createdBy: params.ownerId,
      updatedAt: new Date().toISOString(),
      updatedBy: params.ownerId
    };

    const initialVersion: DocumentVersion = {
      versionId: `VER-${documentId}-${version}`,
      documentId,
      tenantId: params.tenantId,
      version,
      checksum,
      storageReference,
      fileSize,
      changeDescription: 'Initial document upload',
      status: 'RECEIVED',
      effectiveFrom: document.effectiveFrom!,
      effectiveTo: params.effectiveTo,
      createdBy: params.ownerId,
      createdAt: new Date().toISOString()
    };

    const key = `${params.tenantId}:${documentId}`;
    this.documentsMap.set(key, document);
    this.versionsMap.set(key, [initialVersion]);

    try {
      await saveData<DocumentMetadata>((db as any).documents, [document]);
      await saveData<DocumentVersion>((db as any).documentVersions, [initialVersion]);
    } catch (err) {
      console.warn(`[DocumentIngestionService] Failed to persist ingested document:`, err);
    }

    return { document, isDuplicate: false };
  }

  /**
   * Retrieves a document by ID enforcing tenant isolation
   */
  public async getDocument(tenantId: string, documentId: string): Promise<DocumentMetadata | null> {
    const key = `${tenantId}:${documentId}`;
    if (this.documentsMap.has(key)) {
      return this.documentsMap.get(key)!;
    }

    try {
      const all = await loadData<DocumentMetadata>((db as any).documents);
      if (all && Array.isArray(all)) {
        const found = all.find(d => d.tenantId === tenantId && d.documentId === documentId);
        if (found) {
          this.documentsMap.set(key, found);
          return found;
        }
      }
    } catch (err) {
      console.warn(`[DocumentIngestionService] Error retrieving document:`, err);
    }

    return null;
  }

  /**
   * Lists all documents for a tenant with optional filtering
   */
  public async listDocuments(
    tenantId: string,
    filters?: {
      documentType?: DocumentClassification;
      status?: DocumentMetadata['status'];
      securityClassification?: DocumentSecurityClassification;
    }
  ): Promise<DocumentMetadata[]> {
    try {
      const all = await loadData<DocumentMetadata>((db as any).documents);
      if (all && Array.isArray(all)) {
        for (const doc of all) {
          if (doc.tenantId === tenantId) {
            this.documentsMap.set(`${tenantId}:${doc.documentId}`, doc);
          }
        }
      }
    } catch (err) {
      console.warn(`[DocumentIngestionService] Error listing documents:`, err);
    }

    return Array.from(this.documentsMap.values()).filter(d => {
      if (d.tenantId !== tenantId) return false;
      if (filters?.documentType && d.documentType !== filters.documentType) return false;
      if (filters?.status && d.status !== filters.status) return false;
      if (filters?.securityClassification && d.securityClassification !== filters.securityClassification) return false;
      return true;
    });
  }

  /**
   * Creates a new version for an existing document
   */
  public async createNewVersion(
    tenantId: string,
    documentId: string,
    newContent: string | Uint8Array,
    changeDescription: string,
    actorId: string
  ): Promise<DocumentVersion> {
    const document = await this.getDocument(tenantId, documentId);
    if (!document) {
      throw new Error(`Document ${documentId} not found in tenant ${tenantId}`);
    }

    const versionParts = document.version.split('.').map(Number);
    const newVersionStr = `${versionParts[0]}.${versionParts[1] + 1}.0`;
    const checksum = documentIntegrityService.calculateChecksum(newContent);
    const fileSize = typeof newContent === 'string' ? newContent.length : newContent.byteLength;
    const storageReference = `tenant/${tenantId}/documents/${documentId}/versions/${newVersionStr}/${document.fileName}`;

    document.version = newVersionStr;
    document.checksum = checksum;
    document.fileSize = fileSize;
    document.storageReference = storageReference;
    document.updatedAt = new Date().toISOString();
    document.updatedBy = actorId;

    const versionObj: DocumentVersion = {
      versionId: `VER-${documentId}-${newVersionStr}`,
      documentId,
      tenantId,
      version: newVersionStr,
      checksum,
      storageReference,
      fileSize,
      changeDescription,
      status: document.status,
      effectiveFrom: new Date().toISOString(),
      createdBy: actorId,
      createdAt: new Date().toISOString()
    };

    const key = `${tenantId}:${documentId}`;
    this.documentsMap.set(key, document);
    const vList = this.versionsMap.get(key) || [];
    vList.push(versionObj);
    this.versionsMap.set(key, vList);

    try {
      await saveData<DocumentMetadata>((db as any).documents, [document]);
      await saveData<DocumentVersion>((db as any).documentVersions, [versionObj]);
    } catch (err) {
      console.warn(`[DocumentIngestionService] Failed to persist document version:`, err);
    }

    return versionObj;
  }

  public clear(): void {
    this.documentsMap.clear();
    this.versionsMap.clear();
  }
}

export const documentIngestionService = DocumentIngestionService.getInstance();
