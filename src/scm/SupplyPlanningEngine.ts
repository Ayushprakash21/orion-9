/**
 * ORION-9 ENTERPRISE SCM: SUPPLY PLANNING & MRP ENGINE
 * Gross-to-Net Demand Netting, Planned Orders Generation & Capacity Balancing
 */

import {
  SupplyPlanRecord,
  GrossToNetItem,
  PlannedOrderRecord,
  PlannedOrderStatus
} from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { observabilityService } from '../operations/ObservabilityService';

export class SupplyPlanningEngine {
  private static instance: SupplyPlanningEngine;

  private supplyPlans: Map<string, SupplyPlanRecord> = new Map();
  private plannedOrders: Map<string, PlannedOrderRecord> = new Map();

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): SupplyPlanningEngine {
    if (!SupplyPlanningEngine.instance) {
      SupplyPlanningEngine.instance = new SupplyPlanningEngine();
    }
    return SupplyPlanningEngine.instance;
  }

  private seedDefaultData(): void {
    const defaultTenant = 'demo-tenant';
    const samplePlan: SupplyPlanRecord = {
      supplyPlanId: 'spl-2026-q4',
      tenantId: defaultTenant,
      planName: 'Enterprise Master Supply Plan Q4 2026',
      horizonStart: '2026-10-01',
      horizonEnd: '2026-12-31',
      isPublished: true,
      publishedAt: '2026-09-20T00:00:00Z',
      createdBy: 'master_scheduler',
      createdAt: '2026-09-20T00:00:00Z',
      items: [
        {
          productId: 'prod-srv-900',
          period: '2026-10',
          grossDemand: 250,
          onHandStock: 80,
          scheduledReceipts: 50,
          safetyStock: 40,
          netRequirements: 160,
          plannedOrderReceipts: 160,
          projectedEndingStock: 40
        },
        {
          productId: 'prod-chip-gpu',
          period: '2026-10',
          grossDemand: 640,
          onHandStock: 200,
          scheduledReceipts: 100,
          safetyStock: 100,
          netRequirements: 440,
          plannedOrderReceipts: 440,
          projectedEndingStock: 100
        }
      ],
      plannedOrders: [
        {
          plannedOrderId: 'plord-001',
          tenantId: defaultTenant,
          type: 'PLANNED_PRODUCTION',
          productId: 'prod-srv-900',
          warehouseId: 'wh-central-01',
          quantity: 160,
          requiredDate: '2026-10-25',
          orderReleaseDate: '2026-10-10',
          status: 'FIRM',
          sourceDemandReference: 'DEM-2026-Q4',
          createdAt: '2026-09-20T00:00:00Z'
        },
        {
          plannedOrderId: 'plord-002',
          tenantId: defaultTenant,
          type: 'PLANNED_PO',
          productId: 'prod-chip-gpu',
          warehouseId: 'wh-central-01',
          quantity: 440,
          requiredDate: '2026-10-10',
          orderReleaseDate: '2026-09-25',
          status: 'FIRM',
          sourceDemandReference: 'DEM-2026-Q4',
          createdAt: '2026-09-20T00:00:00Z'
        }
      ]
    };

    this.supplyPlans.set(samplePlan.supplyPlanId, samplePlan);
    for (const po of samplePlan.plannedOrders) {
      this.plannedOrders.set(po.plannedOrderId, po);
    }
  }

  // ── GROSS-TO-NET CALCULATION ───────────────────────────────────────────────

  public calculateGrossToNet(params: {
    productId: string;
    period: string;
    grossDemand: number;
    onHandStock: number;
    scheduledReceipts: number;
    safetyStock: number;
  }): GrossToNetItem {
    const totalAvailable = params.onHandStock + params.scheduledReceipts;
    const requiredBuffer = params.grossDemand + params.safetyStock;
    const netRequirements = Math.max(0, requiredBuffer - totalAvailable);
    const plannedOrderReceipts = netRequirements; // Lot-for-lot
    const projectedEndingStock = totalAvailable + plannedOrderReceipts - params.grossDemand;

    return {
      productId: params.productId,
      period: params.period,
      grossDemand: params.grossDemand,
      onHandStock: params.onHandStock,
      scheduledReceipts: params.scheduledReceipts,
      safetyStock: params.safetyStock,
      netRequirements,
      plannedOrderReceipts,
      projectedEndingStock
    };
  }

  // ── SUPPLY PLAN GENERATION ─────────────────────────────────────────────────

  public createSupplyPlan(params: {
    tenantId: string;
    planName: string;
    horizonStart: string;
    horizonEnd: string;
    items: GrossToNetItem[];
    plannedOrders: Omit<PlannedOrderRecord, 'plannedOrderId' | 'tenantId' | 'createdAt'>[];
    createdBy: string;
  }): SupplyPlanRecord {
    const supplyPlanId = `spl-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullPlannedOrders: PlannedOrderRecord[] = params.plannedOrders.map(p => ({
      ...p,
      plannedOrderId: `plord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: params.tenantId,
      createdAt: new Date().toISOString()
    }));

    for (const po of fullPlannedOrders) {
      this.plannedOrders.set(po.plannedOrderId, po);
    }

    const plan: SupplyPlanRecord = {
      supplyPlanId,
      tenantId: params.tenantId,
      planName: params.planName,
      horizonStart: params.horizonStart,
      horizonEnd: params.horizonEnd,
      items: params.items,
      plannedOrders: fullPlannedOrders,
      isPublished: false,
      createdBy: params.createdBy,
      createdAt: new Date().toISOString()
    };

    this.supplyPlans.set(supplyPlanId, plan);

    kernelAuditEngine.record({
      action: 'CREATE_SUPPLY_PLAN',
      actor: { id: params.createdBy, type: 'USER', name: params.createdBy },
      entityId: supplyPlanId,
      entityType: 'SUPPLY_PLAN',
      classification: 'INTERNAL',
      details: { planName: params.planName, itemsCount: params.items.length, plannedOrdersCount: fullPlannedOrders.length }
    });

    return plan;
  }

  public publishSupplyPlan(supplyPlanId: string, tenantId: string, actor: string): SupplyPlanRecord {
    const plan = this.supplyPlans.get(supplyPlanId);
    if (!plan || plan.tenantId !== tenantId) {
      throw new Error(`Supply plan [${supplyPlanId}] not found`);
    }

    plan.isPublished = true;
    plan.publishedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'PUBLISH_SUPPLY_PLAN',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: supplyPlanId,
      entityType: 'SUPPLY_PLAN',
      classification: 'INTERNAL',
      details: { planName: plan.planName, publishedAt: plan.publishedAt }
    });

    observabilityService.log('INFO', `Supply plan ${plan.planName} published to execution layer`, {
      tenantId,
      context: { supplyPlanId, plannedOrdersCount: plan.plannedOrders.length }
    });

    return plan;
  }

  public convertPlannedOrder(params: {
    plannedOrderId: string;
    tenantId: string;
    convertedEntityId: string;
    actor: string;
  }): PlannedOrderRecord {
    const po = this.plannedOrders.get(params.plannedOrderId);
    if (!po || po.tenantId !== params.tenantId) {
      throw new Error(`Planned order [${params.plannedOrderId}] not found`);
    }

    po.status = 'CONVERTED';
    po.convertedEntityId = params.convertedEntityId;

    kernelAuditEngine.record({
      action: 'CONVERT_PLANNED_ORDER',
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: params.plannedOrderId,
      entityType: 'PLANNED_ORDER',
      classification: 'INTERNAL',
      details: { plannedOrderId: params.plannedOrderId, type: po.type, convertedEntityId: params.convertedEntityId }
    });

    return po;
  }

  public listSupplyPlans(tenantId?: string): SupplyPlanRecord[] {
    const list = Array.from(this.supplyPlans.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(p => p.tenantId === tenantId);
  }

  public listPlannedOrders(tenantId?: string): PlannedOrderRecord[] {
    const list = Array.from(this.plannedOrders.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(o => o.tenantId === tenantId);
  }
}

export const supplyPlanningEngine = SupplyPlanningEngine.getInstance();
