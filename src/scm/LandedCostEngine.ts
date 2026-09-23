/**
 * ORION-9 ENTERPRISE SCM: LANDED COST & PURCHASE PRICE VARIANCE (PPV) ENGINE
 * Total Cost of Ownership, Tariffs, Freight & Price Variance Auditing
 */

import {
  LandedCostBreakdownRecord,
  LandedCostComponent,
  PPVRecord
} from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { observabilityService } from '../operations/ObservabilityService';

export class LandedCostEngine {
  private static instance: LandedCostEngine;

  private landedCosts: Map<string, LandedCostBreakdownRecord> = new Map();
  private ppvRecords: Map<string, PPVRecord> = new Map();

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): LandedCostEngine {
    if (!LandedCostEngine.instance) {
      LandedCostEngine.instance = new LandedCostEngine();
    }
    return LandedCostEngine.instance;
  }

  private seedDefaultData(): void {
    const defaultTenant = 'demo-tenant';
    const sampleLandedCost: LandedCostBreakdownRecord = {
      landedCostId: 'lc-sample-01',
      tenantId: defaultTenant,
      poId: 'po-7701',
      productId: 'prod-chip-gpu',
      quantity: 500,
      components: [
        { type: 'PURCHASE', amount: 450000, currency: 'USD', isEstimated: false },
        { type: 'FREIGHT', amount: 12500, currency: 'USD', isEstimated: false },
        { type: 'CUSTOMS_DUTY', amount: 18000, currency: 'USD', isEstimated: false },
        { type: 'INSURANCE', amount: 3500, currency: 'USD', isEstimated: false },
        { type: 'HANDLING', amount: 2000, currency: 'USD', isEstimated: false },
        { type: 'QUALITY', amount: 1500, currency: 'USD', isEstimated: false }
      ],
      totalLandedCost: 487500,
      unitLandedCost: 975.00,
      calculatedAt: '2026-02-10T15:00:00Z'
    };

    this.landedCosts.set(sampleLandedCost.landedCostId, sampleLandedCost);

    const samplePPV: PPVRecord = {
      ppvId: 'ppv-sample-01',
      tenantId: defaultTenant,
      poId: 'po-7701',
      invoiceId: 'inv-8801',
      productId: 'prod-chip-gpu',
      quantity: 500,
      standardUnitCost: 920.00,
      actualUnitCost: 900.00,
      variancePerUnit: -20.00, // Favorable $20 per unit
      totalPurchasePriceVariance: -10000.00, // Favorable $10,000
      currency: 'USD',
      evaluatedAt: '2026-02-10T15:05:00Z'
    };

    this.ppvRecords.set(samplePPV.ppvId, samplePPV);
  }

  // ── LANDED COST CALCULATION ────────────────────────────────────────────────

  public calculateLandedCost(params: {
    tenantId: string;
    poId: string;
    productId: string;
    quantity: number;
    components: LandedCostComponent[];
  }): LandedCostBreakdownRecord {
    if (params.quantity <= 0) {
      throw new Error('Quantity must be greater than zero for landed cost calculation');
    }

    const totalLandedCost = params.components.reduce((sum, c) => sum + c.amount, 0);
    const unitLandedCost = parseFloat((totalLandedCost / params.quantity).toFixed(2));

    const landedCostId = `lc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: LandedCostBreakdownRecord = {
      landedCostId,
      tenantId: params.tenantId,
      poId: params.poId,
      productId: params.productId,
      quantity: params.quantity,
      components: params.components,
      totalLandedCost,
      unitLandedCost,
      calculatedAt: new Date().toISOString()
    };

    this.landedCosts.set(landedCostId, record);

    kernelAuditEngine.record({
      action: 'CALCULATE_LANDED_COST',
      actor: { id: 'cost_accounting', type: 'USER', name: 'Cost Accounting Engine' },
      entityId: landedCostId,
      entityType: 'LANDED_COST',
      classification: 'INTERNAL',
      details: { poId: params.poId, productId: params.productId, totalLandedCost, unitLandedCost }
    });

    return record;
  }

  // ── PURCHASE PRICE VARIANCE (PPV) ──────────────────────────────────────────

  public calculatePPV(params: {
    tenantId: string;
    poId: string;
    invoiceId: string;
    productId: string;
    quantity: number;
    standardUnitCost: number;
    actualUnitCost: number;
    currency: string;
  }): PPVRecord {
    const variancePerUnit = parseFloat((params.actualUnitCost - params.standardUnitCost).toFixed(2));
    const totalPurchasePriceVariance = parseFloat((variancePerUnit * params.quantity).toFixed(2));

    const ppvId = `ppv-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: PPVRecord = {
      ppvId,
      tenantId: params.tenantId,
      poId: params.poId,
      invoiceId: params.invoiceId,
      productId: params.productId,
      quantity: params.quantity,
      standardUnitCost: params.standardUnitCost,
      actualUnitCost: params.actualUnitCost,
      variancePerUnit,
      totalPurchasePriceVariance,
      currency: params.currency,
      evaluatedAt: new Date().toISOString()
    };

    this.ppvRecords.set(ppvId, record);

    kernelAuditEngine.record({
      action: 'CALCULATE_PPV',
      actor: { id: 'cost_accounting', type: 'USER', name: 'Cost Accounting Engine' },
      entityId: ppvId,
      entityType: 'PPV',
      classification: 'INTERNAL',
      details: { poId: params.poId, invoiceId: params.invoiceId, totalPPV: totalPurchasePriceVariance, variancePerUnit }
    });

    observabilityService.log('INFO', `PPV evaluated for PO ${params.poId}: Variance = ${totalPurchasePriceVariance} ${params.currency}`, {
      tenantId: params.tenantId,
      context: { ppvId, totalPPV: totalPurchasePriceVariance }
    });

    return record;
  }

  public listLandedCosts(tenantId?: string): LandedCostBreakdownRecord[] {
    const list = Array.from(this.landedCosts.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(l => l.tenantId === tenantId);
  }

  public listPPVs(tenantId?: string): PPVRecord[] {
    const list = Array.from(this.ppvRecords.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(p => p.tenantId === tenantId);
  }
}

export const landedCostEngine = LandedCostEngine.getInstance();
