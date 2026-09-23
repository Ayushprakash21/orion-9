/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Document to MDM & SCM Integration Bridge
 * 
 * Governed bridge routing validated document extraction candidates into
 * Track 1 Master Data Management stewardship and Track 2 SCM commands under Kernel authorization.
 */

import { DocumentExtraction, ExtractedFieldCandidate } from './types';
import { masterDataService } from '../data/MasterDataService';
import { KernelCommandBus } from '../kernel/CommandBus';


export class DocumentMdmBridge {
  private static instance: DocumentMdmBridge;

  private constructor() {}

  public static getInstance(): DocumentMdmBridge {
    if (!DocumentMdmBridge.instance) {
      DocumentMdmBridge.instance = new DocumentMdmBridge();
    }
    return DocumentMdmBridge.instance;
  }

  /**
   * Promotes validated extraction candidates to Master Data Golden Records or SCM Transactions
   */
  public async promoteExtractionToMasterData(
    extraction: DocumentExtraction,
    actor: { id: string; role: string; isAi: boolean }
  ): Promise<{ success: boolean; entityId?: string; message: string }> {
    if (extraction.status !== 'VALIDATED') {
      throw new Error(`Extraction ${extraction.extractionId} must be VALIDATED before MDM promotion.`);
    }

    if (actor.isAi) {
      throw new Error(`[Kernel Governance Violation] AI agents are prohibited from self-promoting document candidates directly.`);
    }

    const fields = extraction.fields;

    // Supplier Candidate Promotion
    if (fields.supplierName && fields.supplierName.isValidated) {
      const supplierName = fields.supplierName.validatedValue || fields.supplierName.extractedValue;
      const res = await masterDataService.proposeRecord({
        tenantId: extraction.tenantId,
        entityType: 'SUPPLIER',
        data: {
          name: supplierName,
          status: 'QUALIFIED',
          sourceDocumentId: extraction.documentId
        },
        sourceSystemType: 'ORION_INTERNAL',
        actor: actor.id
      });

      return {
        success: true,
        entityId: res.id,
        message: `Successfully promoted document candidate to Master Data Supplier record.`
      };
    }


    return {
      success: false,
      message: `No validated master data candidates found in extraction.`
    };
  }
}

export const documentMdmBridge = DocumentMdmBridge.getInstance();
