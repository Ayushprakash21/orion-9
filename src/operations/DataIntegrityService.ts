/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * DataIntegrityService: Read-Only Data Consistency & Anomaly Scanner
 */

import { IntegrityFinding, IntegrityCheckType, IntegritySeverity } from './types';
import { observabilityService } from './ObservabilityService';

export class DataIntegrityService {
  private static instance: DataIntegrityService;
  private findings: IntegrityFinding[] = [];

  private constructor() {
    this.seedDefaultFindings();
  }

  public static getInstance(): DataIntegrityService {
    if (!DataIntegrityService.instance) {
      DataIntegrityService.instance = new DataIntegrityService();
    }
    return DataIntegrityService.instance;
  }

  private seedDefaultFindings(): void {
    const defaultFinding: IntegrityFinding = {
      id: 'fit-001',
      tenantId: 'TENANT_A',
      checkType: 'TWIN_ERP_DESYNCHRONIZATION',
      severity: 'LOW',
      entityType: 'InventoryItem',
      entityId: 'SKU-7729',
      description: 'Physical inventory count (340) in ERP differs by 2 units from Digital Twin state (342) due to transit timing',
      detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      suggestedRemediation: 'Trigger Twin Reconciliation sync job or accept latest goods receipt notice (GRN)',
      resolved: false,
    };
    this.findings = [defaultFinding];
  }

  /**
   * Runs comprehensive integrity scan across supplied entities.
   * Completely read-only: never modifies source records.
   */
  public scanIntegrity(context: {
    tenantId: string;
    purchaseOrders?: Array<{ id: string; supplierId?: string; lineItems?: any[] }>;
    suppliers?: Array<{ id: string }>;
    inventory?: Array<{ id: string; quantity: number }>;
    twinNodes?: Array<{ id: string; entityId: string; state?: any }>;
  }): { findingsCount: number; newFindings: IntegrityFinding[] } {
    const newFindings: IntegrityFinding[] = [];
    const validSupplierIds = new Set((context.suppliers || []).map(s => s.id));

    // 1. Check for Broken Foreign Keys in POs
    if (context.purchaseOrders && context.suppliers && context.suppliers.length > 0) {
      for (const po of context.purchaseOrders) {
        if (po.supplierId && !validSupplierIds.has(po.supplierId)) {
          newFindings.push({
            id: `fit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tenantId: context.tenantId,
            checkType: 'BROKEN_FOREIGN_KEYS',
            severity: 'HIGH',
            entityType: 'PurchaseOrder',
            entityId: po.id,
            description: `Purchase Order ${po.id} references non-existent Supplier ${po.supplierId}`,
            detectedAt: new Date().toISOString(),
            suggestedRemediation: 'Reassign purchase order to an active approved supplier or restore archived supplier record',
            resolved: false,
          });
        }
      }
    }

    // 2. Check for Negative Inventory
    if (context.inventory) {
      for (const item of context.inventory) {
        if (item.quantity < 0) {
          newFindings.push({
            id: `fit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            tenantId: context.tenantId,
            checkType: 'NEGATIVE_INVENTORY',
            severity: 'CRITICAL',
            entityType: 'InventoryItem',
            entityId: item.id,
            description: `Inventory item ${item.id} has negative on-hand balance (${item.quantity})`,
            detectedAt: new Date().toISOString(),
            suggestedRemediation: 'Perform immediate physical cycle count audit and post balancing adjustment transaction',
            resolved: false,
          });
        }
      }
    }

    // Merge into active findings
    for (const f of newFindings) {
      this.findings.unshift(f);
    }

    observabilityService.info(`[INTEGRITY_SCAN] Completed scan for ${context.tenantId}: ${newFindings.length} anomalies detected`, {
      tenantId: context.tenantId,
      context: { count: newFindings.length },
    });

    return { findingsCount: newFindings.length, newFindings };
  }

  public getFindings(tenantId?: string): IntegrityFinding[] {
    if (tenantId && tenantId !== 'GLOBAL') {
      return this.findings.filter(f => f.tenantId === tenantId || f.tenantId === 'GLOBAL');
    }
    return this.findings;
  }

  public resolveFinding(findingId: string, resolvedBy: string): boolean {
    const finding = this.findings.find(f => f.id === findingId);
    if (!finding) return false;
    finding.resolved = true;
    finding.resolvedAt = new Date().toISOString();
    finding.resolvedBy = resolvedBy;
    return true;
  }
}

export const dataIntegrityService = DataIntegrityService.getInstance();
