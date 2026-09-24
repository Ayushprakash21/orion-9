/**
 * ORION-9 SUPPLIER CAPACITY PLANNING ENGINE
 *
 * Implements:
 * 1. Supplier capacity utilization tracking against forecasted & PO commitments.
 * 2. Overload bottleneck detection (>90% utilization threshold).
 * 3. Contingency supplier rerouting suggestions.
 */

import { SupplierCapacityPlanRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class SupplierCapacityEngine {
  private static instance: SupplierCapacityEngine;
  private capacityPlans: Map<string, SupplierCapacityPlanRecord[]> = new Map();

  public static getInstance(): SupplierCapacityEngine {
    if (!SupplierCapacityEngine.instance) {
      SupplierCapacityEngine.instance = new SupplierCapacityEngine();
    }
    return SupplierCapacityEngine.instance;
  }

  public updateCapacity(params: {
    tenantId: string;
    supplierId: string;
    period: string;
    totalAvailableCapacityUnits: number;
    allocatedCommittedUnits: number;
    contingencySupplierId?: string;
  }): SupplierCapacityPlanRecord {
    const utilizationRatePct = Number(
      ((params.allocatedCommittedUnits / Math.max(1, params.totalAvailableCapacityUnits)) * 100).toFixed(1)
    );
    const isOverloaded = utilizationRatePct > 90;
    const shortageRiskUnits = Math.max(0, params.allocatedCommittedUnits - params.totalAvailableCapacityUnits);

    const record: SupplierCapacityPlanRecord = {
      capacityId: `CAP-${Date.now()}-${params.supplierId}`,
      tenantId: params.tenantId,
      supplierId: params.supplierId,
      period: params.period,
      totalAvailableCapacityUnits: params.totalAvailableCapacityUnits,
      allocatedCommittedUnits: params.allocatedCommittedUnits,
      utilizationRatePct,
      isOverloaded,
      shortageRiskUnits,
      contingencySupplierId: params.contingencySupplierId,
      updatedAt: new Date().toISOString()
    };

    const list = this.capacityPlans.get(params.tenantId) || [];
    const idx = list.findIndex(c => c.supplierId === params.supplierId && c.period === params.period);
    if (idx >= 0) list[idx] = record;
    else list.push(record);
    this.capacityPlans.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-CAP-${Date.now()}`,
      eventType: 'SUPPLIER_CAPACITY_UPDATED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'CAPACITY_PLANNER', role: 'planner' }
    });

    return record;
  }

  public getCapacityPlans(tenantId: string): SupplierCapacityPlanRecord[] {
    return this.capacityPlans.get(tenantId) || [];
  }
}

export const supplierCapacityEngine = SupplierCapacityEngine.getInstance();
