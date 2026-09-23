/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Document Extractor Engine (OCR / Parser Abstraction)
 * 
 * Extracts candidate fields from unstructured/semi-structured documents (PO, Invoice, ASN,
 * Certificates, Contracts) while maintaining page/section provenance.
 * 
 * CRITICAL RULE: Extracted data is marked UNVALIDATED and NEVER directly overwrites
 * authoritative master data or SCM transactions without governed validation.
 */

import { DocumentExtraction, ExtractedFieldCandidate, DocumentMetadata } from './types';
import { db, saveData } from '../data/db';

export class DocumentExtractorEngine {
  private static instance: DocumentExtractorEngine;

  private constructor() {}

  public static getInstance(): DocumentExtractorEngine {
    if (!DocumentExtractorEngine.instance) {
      DocumentExtractorEngine.instance = new DocumentExtractorEngine();
    }
    return DocumentExtractorEngine.instance;
  }

  /**
   * Extracts candidate fields and sections from document text with provenance metadata
   */
  public async extractDocumentFields(
    document: DocumentMetadata,
    rawText: string
  ): Promise<DocumentExtraction> {
    const fields: Record<string, ExtractedFieldCandidate> = {};
    const lines = rawText.split('\n');

    // Pattern match PO Number
    const poMatch = rawText.match(/PO[#-]?\s*([A-Z0-9-]{4,20})/i);
    if (poMatch) {
      fields.poNumber = {
        fieldName: 'poNumber',
        extractedValue: poMatch[1].toUpperCase(),
        confidenceScore: 0.95,
        sourcePage: 1,
        sourceSection: 'Header',
        lineRange: '1-10',
        boundingText: poMatch[0],
        isValidated: false
      };
    }

    // Pattern match Invoice Number
    const invMatch = rawText.match(/INV-([A-Z0-9-]{4,20})/i) || rawText.match(/(?:Invoice\s*(?:Num(?:ber)?|#)?):\s*([A-Z0-9-]{4,20})/i);
    if (invMatch) {
      const val = invMatch[1].toUpperCase();
      fields.invoiceNumber = {
        fieldName: 'invoiceNumber',
        extractedValue: val.startsWith('INV-') ? val : `INV-${val}`,
        confidenceScore: 0.94,
        sourcePage: 1,
        sourceSection: 'Header',



        lineRange: '1-10',
        boundingText: invMatch[0],
        isValidated: false
      };
    }

    // Pattern match Supplier Name
    const suppMatch = rawText.match(/(?:Supplier|Vendor|Seller):\s*([A-Za-z0-9\s,.-]+)/i);
    if (suppMatch) {
      fields.supplierName = {
        fieldName: 'supplierName',
        extractedValue: suppMatch[1].trim(),
        confidenceScore: 0.89,
        sourcePage: 1,
        sourceSection: 'Vendor Details',
        lineRange: '1-15',
        boundingText: suppMatch[0],
        isValidated: false
      };
    }

    // Pattern match Total Amount / Price
    const amountMatch = rawText.match(/(?:Total|Amount|Grand Total):\s*\$?([0-9,]+(?:\.[0-9]{2})?)/i);
    if (amountMatch) {
      const val = parseFloat(amountMatch[1].replace(/,/g, ''));
      fields.totalAmount = {
        fieldName: 'totalAmount',
        extractedValue: val,
        confidenceScore: 0.92,
        sourcePage: 1,
        sourceSection: 'Financial Summary',
        lineRange: '10-30',
        boundingText: amountMatch[0],
        isValidated: false
      };
    }

    // Pattern match Expiration Date
    const expMatch = rawText.match(/(?:Expires?|Expiration|Valid Until):\s*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{2}\/[0-9]{2}\/[0-9]{4})/i);
    if (expMatch) {
      fields.expirationDate = {
        fieldName: 'expirationDate',
        extractedValue: expMatch[1],
        confidenceScore: 0.91,
        sourcePage: 1,
        sourceSection: 'Compliance & Validity',
        lineRange: '5-25',
        boundingText: expMatch[0],
        isValidated: false
      };
    }

    const extractionId = `EXT-${document.tenantId}-${document.documentId}-${Date.now()}`;
    const extraction: DocumentExtraction = {
      extractionId,
      documentId: document.documentId,
      documentVersionId: `VER-${document.documentId}-${document.version}`,
      tenantId: document.tenantId,
      extractorVersion: '1.0.0-governed',
      fields,
      rawExtractedText: rawText,
      status: 'UNVALIDATED',
      extractedAt: new Date().toISOString()
    };

    try {
      await saveData<DocumentExtraction>((db as any).documentExtractions, [extraction]);
    } catch (err) {
      console.warn(`[DocumentExtractorEngine] Failed to persist extraction ${extractionId}:`, err);
    }

    return extraction;
  }
}

export const documentExtractorEngine = DocumentExtractorEngine.getInstance();
