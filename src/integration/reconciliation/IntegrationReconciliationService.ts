/**
 * ORION-9 WAVE 11: CROSS-SYSTEM INTEGRATION RECONCILIATION ENGINE
 * Compares Orion-9 internal ledger transactions with external ERP (SAP/Oracle)
 * and EDI records to detect, classify, and remediate discrepancies.
 */

export type DiscrepancyType = 
  | 'MISSING_IN_ORION'
  | 'MISSING_IN_EXTERNAL'
  | 'AMOUNT_MISMATCH'
  | 'QUANTITY_MISMATCH'
  | 'STATUS_MISMATCH'
  | 'TIMING_DELAY';

export type DiscrepancySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type RemediationStatus = 'OPEN' | 'PROPOSED' | 'APPROVED' | 'RESOLVED' | 'DISMISSED';

export interface ReconciliationFinding {
  findingId: string;
  tenantId: string;
  runId: string;
  externalSystem: 'SAP' | 'ORACLE' | 'EDI_PARTNER';
  partnerOrInstanceId: string;
  entityType: 'PURCHASE_ORDER' | 'SHIPMENT' | 'INVOICE' | 'INVENTORY_BALANCE';
  orionReferenceId?: string;
  externalReferenceId?: string;
  discrepancyType: DiscrepancyType;
  severity: DiscrepancySeverity;
  financialExposureUsd: number;
  varianceDetails: {
    orionValue?: any;
    externalValue?: any;
    unitVariance?: number;
    amountVariance?: number;
    explanation: string;
  };
  remediationProposal?: {
    action: 'RESYNC_FROM_ORION' | 'OVERWRITE_FROM_ERP' | 'POST_CREDIT_MEMO' | 'MANUAL_INSPECTION';
    summary: string;
    proposedBy: 'RECONCILIATION_ENGINE' | 'AI_ADVISOR' | 'USER';
  };
  status: RemediationStatus;
  detectedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ReconciliationRunSummary {
  runId: string;
  tenantId: string;
  externalSystem: 'SAP' | 'ORACLE' | 'EDI_PARTNER';
  totalChecked: number;
  matchedCount: number;
  discrepancyCount: number;
  totalFinancialExposureUsd: number;
  findings: ReconciliationFinding[];
  durationMs: number;
  executedAt: string;
}

export class IntegrationReconciliationService {
  private static instance: IntegrationReconciliationService;
  private findings: Map<string, ReconciliationFinding> = new Map(); // key: findingId
  private runs: Map<string, ReconciliationRunSummary> = new Map(); // key: runId

  private constructor() {
    this.seedDefaultFindings();
  }

  public static getInstance(): IntegrationReconciliationService {
    if (!IntegrationReconciliationService.instance) {
      IntegrationReconciliationService.instance = new IntegrationReconciliationService();
    }
    return IntegrationReconciliationService.instance;
  }

  private seedDefaultFindings(): void {
    const tenantId = 'demo-tenant';
    const now = new Date().toISOString();

    const sampleFindings: ReconciliationFinding[] = [
      {
        findingId: 'fnd-sap-001',
        tenantId,
        runId: 'run-seed-01',
        externalSystem: 'SAP',
        partnerOrInstanceId: 'PRD_100',
        entityType: 'PURCHASE_ORDER',
        orionReferenceId: 'PO-2026-4401',
        externalReferenceId: 'SAP-450001892',
        discrepancyType: 'AMOUNT_MISMATCH',
        severity: 'HIGH',
        financialExposureUsd: 12450.00,
        varianceDetails: {
          orionValue: 145000.00,
          externalValue: 132550.00,
          amountVariance: 12450.00,
          explanation: 'SAP Purchase Order total excludes freight surcharge applied in Orion-9 SCM module'
        },
        remediationProposal: {
          action: 'RESYNC_FROM_ORION',
          summary: 'Push adjusted freight condition record (ZF01) to SAP via BAPI_PO_CHANGE',
          proposedBy: 'RECONCILIATION_ENGINE'
        },
        status: 'OPEN',
        detectedAt: now
      },
      {
        findingId: 'fnd-edi-002',
        tenantId,
        runId: 'run-seed-01',
        externalSystem: 'EDI_PARTNER',
        partnerOrInstanceId: 'PARTNER_GLOBAL_SUPPLY',
        entityType: 'SHIPMENT',
        orionReferenceId: 'SH-88219',
        externalReferenceId: 'ASN-856-771',
        discrepancyType: 'QUANTITY_MISMATCH',
        severity: 'CRITICAL',
        financialExposureUsd: 48000.00,
        varianceDetails: {
          orionValue: 500,
          externalValue: 420,
          unitVariance: -80,
          explanation: '856 ASN reported 420 units shipped vs Orion Purchase Order requirement of 500 units'
        },
        remediationProposal: {
          action: 'MANUAL_INSPECTION',
          summary: 'Require supplier exception approval before posting ASN receipt to warehouse dock',
          proposedBy: 'AI_ADVISOR'
        },
        status: 'OPEN',
        detectedAt: now
      },
      {
        findingId: 'fnd-ora-003',
        tenantId,
        runId: 'run-seed-01',
        externalSystem: 'ORACLE',
        partnerOrInstanceId: 'fa-test-scm',
        entityType: 'INVOICE',
        orionReferenceId: 'INV-9021',
        externalReferenceId: undefined,
        discrepancyType: 'MISSING_IN_EXTERNAL',
        severity: 'MEDIUM',
        financialExposureUsd: 8750.00,
        varianceDetails: {
          orionValue: 'POSTED',
          externalValue: 'NOT_FOUND',
          explanation: 'Supplier invoice approved in Orion but missing in Oracle Fusion Financials Cloud'
        },
        remediationProposal: {
          action: 'RESYNC_FROM_ORION',
          summary: 'Resend invoice via Oracle Payables Invoices REST API',
          proposedBy: 'RECONCILIATION_ENGINE'
        },
        status: 'PROPOSED',
        detectedAt: now
      }
    ];

    const seedTenants = ['demo-tenant', 'ORION_PLATFORM'];
    for (const t of seedTenants) {
      for (const f of sampleFindings) {
        const id = t === 'demo-tenant' ? f.findingId : `${f.findingId}-${t}`;
        this.findings.set(id, { ...f, findingId: id, tenantId: t });
      }
    }
  }

  /**
   * Run reconciliation across a set of Orion records and external records
   */
  public executeReconciliationRun(params: {
    tenantId: string;
    externalSystem: 'SAP' | 'ORACLE' | 'EDI_PARTNER';
    partnerOrInstanceId: string;
    entityType: 'PURCHASE_ORDER' | 'SHIPMENT' | 'INVOICE' | 'INVENTORY_BALANCE';
    orionRecords: Array<{ id: string; amount?: number; quantity?: number; status: string }>;
    externalRecords: Array<{ id: string; amount?: number; quantity?: number; status: string; externalId?: string }>;
  }): ReconciliationRunSummary {
    const { tenantId, externalSystem, partnerOrInstanceId, entityType, orionRecords, externalRecords } = params;
    const startTime = Date.now();
    const runId = `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newFindings: ReconciliationFinding[] = [];
    const nowIso = new Date().toISOString();

    const externalMap = new Map(externalRecords.map(r => [r.id, r]));
    const orionMap = new Map(orionRecords.map(r => [r.id, r]));

    let matchedCount = 0;

    // 1. Check Orion records against external
    for (const oRec of orionRecords) {
      const ext = externalMap.get(oRec.id);
      if (!ext) {
        const exposure = oRec.amount || (oRec.quantity ? oRec.quantity * 50 : 1000);
        const finding: ReconciliationFinding = {
          findingId: `fnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          runId,
          externalSystem,
          partnerOrInstanceId,
          entityType,
          orionReferenceId: oRec.id,
          discrepancyType: 'MISSING_IN_EXTERNAL',
          severity: exposure > 25000 ? 'HIGH' : 'MEDIUM',
          financialExposureUsd: exposure,
          varianceDetails: {
            orionValue: oRec,
            externalValue: null,
            explanation: `Entity ${oRec.id} exists in Orion but missing in external system ${externalSystem}`
          },
          remediationProposal: {
            action: 'RESYNC_FROM_ORION',
            summary: `Resynchronize ${entityType} ${oRec.id} to ${externalSystem}`,
            proposedBy: 'RECONCILIATION_ENGINE'
          },
          status: 'OPEN',
          detectedAt: nowIso
        };
        newFindings.push(finding);
        this.findings.set(finding.findingId, finding);
        continue;
      }

      // Check amount variance
      if (oRec.amount !== undefined && ext.amount !== undefined && Math.abs(oRec.amount - ext.amount) > 0.01) {
        const diff = Math.abs(oRec.amount - ext.amount);
        const finding: ReconciliationFinding = {
          findingId: `fnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          runId,
          externalSystem,
          partnerOrInstanceId,
          entityType,
          orionReferenceId: oRec.id,
          externalReferenceId: ext.externalId || ext.id,
          discrepancyType: 'AMOUNT_MISMATCH',
          severity: diff > 10000 ? 'HIGH' : 'LOW',
          financialExposureUsd: diff,
          varianceDetails: {
            orionValue: oRec.amount,
            externalValue: ext.amount,
            amountVariance: diff,
            explanation: `Amount variance detected: Orion $${oRec.amount} vs External $${ext.amount}`
          },
          remediationProposal: {
            action: 'RESYNC_FROM_ORION',
            summary: `Investigate and update amount conditions in ${externalSystem}`,
            proposedBy: 'RECONCILIATION_ENGINE'
          },
          status: 'OPEN',
          detectedAt: nowIso
        };
        newFindings.push(finding);
        this.findings.set(finding.findingId, finding);
        continue;
      }

      // Check quantity variance
      if (oRec.quantity !== undefined && ext.quantity !== undefined && oRec.quantity !== ext.quantity) {
        const unitDiff = Math.abs(oRec.quantity - ext.quantity);
        const exposure = unitDiff * 50;
        const finding: ReconciliationFinding = {
          findingId: `fnd-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          tenantId,
          runId,
          externalSystem,
          partnerOrInstanceId,
          entityType,
          orionReferenceId: oRec.id,
          externalReferenceId: ext.externalId || ext.id,
          discrepancyType: 'QUANTITY_MISMATCH',
          severity: unitDiff > 50 ? 'HIGH' : 'MEDIUM',
          financialExposureUsd: exposure,
          varianceDetails: {
            orionValue: oRec.quantity,
            externalValue: ext.quantity,
            unitVariance: unitDiff,
            explanation: `Quantity mismatch: Orion expects ${oRec.quantity} units, external has ${ext.quantity} units`
          },
          remediationProposal: {
            action: 'MANUAL_INSPECTION',
            summary: `Verify physical dock receiving count against external ASN line items`,
            proposedBy: 'RECONCILIATION_ENGINE'
          },
          status: 'OPEN',
          detectedAt: nowIso
        };
        newFindings.push(finding);
        this.findings.set(finding.findingId, finding);
        continue;
      }

      matchedCount++;
    }

    const durationMs = Date.now() - startTime;
    const totalExposure = newFindings.reduce((acc, f) => acc + f.financialExposureUsd, 0);

    const runSummary: ReconciliationRunSummary = {
      runId,
      tenantId,
      externalSystem,
      totalChecked: orionRecords.length,
      matchedCount,
      discrepancyCount: newFindings.length,
      totalFinancialExposureUsd: totalExposure,
      findings: newFindings,
      durationMs,
      executedAt: nowIso
    };

    this.runs.set(runId, runSummary);
    return runSummary;
  }

  public listFindings(tenantId: string, filter?: { status?: RemediationStatus; severity?: DiscrepancySeverity }): ReconciliationFinding[] {
    const list: ReconciliationFinding[] = [];
    for (const f of this.findings.values()) {
      if (f.tenantId === tenantId) {
        if (filter?.status && f.status !== filter.status) continue;
        if (filter?.severity && f.severity !== filter.severity) continue;
        list.push({ ...f });
      }
    }
    return list.sort((a, b) => b.financialExposureUsd - a.financialExposureUsd);
  }

  public updateFindingStatus(findingId: string, status: RemediationStatus, resolvedBy?: string): boolean {
    const finding = this.findings.get(findingId);
    if (!finding) return false;
    finding.status = status;
    if (status === 'RESOLVED' || status === 'DISMISSED') {
      finding.resolvedAt = new Date().toISOString();
      finding.resolvedBy = resolvedBy || 'admin';
    }
    this.findings.set(findingId, finding);
    return true;
  }

  public clear(): void {
    this.findings.clear();
    this.runs.clear();
  }
}

export const integrationReconciliationService = IntegrationReconciliationService.getInstance();
