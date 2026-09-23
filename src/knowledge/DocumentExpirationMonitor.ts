/**
 * ORION-9 PART 4 TRACK 7: KNOWLEDGE & DOCUMENT INTELLIGENCE
 * Document Expiration & SLA Monitoring Engine
 * 
 * Monitors compliance expiration dates for supplier certificates, quality records,
 * insurance policies, and contracts, emitting signals to Control Tower and triggering Workflows.
 */

import { DocumentMetadata, DocumentExpirationNotice } from './types';
import { documentIngestionService } from './DocumentIngestionService';
import { controlTowerKpiService } from '../services/controltower/ControlTowerKpiService';
import { workflowEngine, createSupplierOnboardingWorkflow } from '../workflows';
import { db, saveData } from '../data/db';

export class DocumentExpirationMonitor {
  private static instance: DocumentExpirationMonitor;

  private constructor() {}

  public static getInstance(): DocumentExpirationMonitor {
    if (!DocumentExpirationMonitor.instance) {
      DocumentExpirationMonitor.instance = new DocumentExpirationMonitor();
    }
    return DocumentExpirationMonitor.instance;
  }

  /**
   * Scans document repository for expiring or expired compliance documents
   */
  public async scanExpirations(tenantId: string, warningWindowDays: number = 30): Promise<DocumentExpirationNotice[]> {
    const notices: DocumentExpirationNotice[] = [];
    const now = new Date();
    const docs = await documentIngestionService.listDocuments(tenantId);

    for (const doc of docs) {
      if (!doc.expirationDate) continue;

      const expDate = new Date(doc.expirationDate);
      const diffTime = expDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= warningWindowDays) {
        const status = diffDays <= 0 ? 'EXPIRED' : 'WARNING';
        const noticeId = `EXP-${tenantId}-${doc.documentId}`;

        const notice: DocumentExpirationNotice = {
          noticeId,
          tenantId,
          documentId: doc.documentId,
          documentName: doc.fileName,
          documentType: doc.documentType,
          expirationDate: doc.expirationDate,
          daysUntilExpiration: diffDays,
          status,
          notifiedAt: new Date().toISOString()
        };

        notices.push(notice);

        // Emit signal to Control Tower
        controlTowerKpiService.recordSlaSignal({
          signalType: status === 'EXPIRED' ? 'DOCUMENT_EXPIRED' : 'DOCUMENT_EXPIRING_SOON',
          tenantId,
          entityId: doc.documentId,
          entityType: 'DOCUMENT',
          severity: status === 'EXPIRED' ? 'HIGH' : 'MEDIUM',
          message: `Document ${doc.fileName} (${doc.documentType}) ${status === 'EXPIRED' ? 'expired on' : 'expires in ' + diffDays + ' days on'} ${doc.expirationDate}`
        });

        // Trigger vendor re-onboarding workflow if supplier certificate expired
        if (status === 'EXPIRED' && doc.documentType === 'SUPPLIER_CERTIFICATE') {
          const wfDef = createSupplierOnboardingWorkflow(tenantId);
          workflowEngine.createInstance(wfDef, {
            triggerId: `TRIG-EXP-${doc.documentId}`,
            tenantId,
            sourceType: 'SIGNAL',
            sourceId: doc.documentId,
            eventType: 'SUPPLIER_CERTIFICATE_EXPIRED',
            correlationId: `CORR-EXP-${doc.documentId}`,
            timestamp: new Date().toISOString(),
            payloadReference: { documentId: doc.documentId, fileName: doc.fileName }
          }).then(inst => {
            workflowEngine.start(tenantId, inst.workflowInstanceId).catch(console.warn);
          }).catch(console.warn);
        }
      }
    }

    try {
      await saveData<DocumentExpirationNotice>((db as any).documentExpirations, notices);
    } catch (err) {
      console.warn(`[DocumentExpirationMonitor] Failed to persist expiration notices:`, err);
    }

    return notices;
  }
}

export const documentExpirationMonitor = DocumentExpirationMonitor.getInstance();
