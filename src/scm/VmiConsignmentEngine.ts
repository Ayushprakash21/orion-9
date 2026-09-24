/**
 * ORION-9 VENDOR MANAGED INVENTORY (VMI) & CONSIGNMENT ENGINE
 *
 * Implements:
 * 1. Supplier-owned vs Consignment-held vs Standard-owned stock partitioning.
 * 2. Min/Max reorder triggers and automated supplier replenishment proposals.
 * 3. Consignment consumption tracking and monthly financial settlement triggers.
 */

import { VmiConsignmentRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class VmiConsignmentEngine {
  private static instance: VmiConsignmentEngine;
  private inventoryPools: Map<string, VmiConsignmentRecord[]> = new Map();

  public static getInstance(): VmiConsignmentEngine {
    if (!VmiConsignmentEngine.instance) {
      VmiConsignmentEngine.instance = new VmiConsignmentEngine();
    }
    return VmiConsignmentEngine.instance;
  }

  public registerStockPool(params: Omit<VmiConsignmentRecord, 'vmiId' | 'settledUnitsConsumedThisMonth' | 'settlementTriggerPending' | 'lastAuditedAt'>): VmiConsignmentRecord {
    const record: VmiConsignmentRecord = {
      ...params,
      vmiId: `VMI-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      settledUnitsConsumedThisMonth: 0,
      settlementTriggerPending: false,
      lastAuditedAt: new Date().toISOString()
    };

    const list = this.inventoryPools.get(params.tenantId) || [];
    list.unshift(record);
    this.inventoryPools.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-VMI-REG-${Date.now()}`,
      eventType: 'VMI_POOL_REGISTERED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'INVENTORY_MANAGER', role: 'admin' }
    });

    return record;
  }

  public recordConsumption(tenantId: string, vmiId: string, consumedQuantity: number): VmiConsignmentRecord {
    const list = this.inventoryPools.get(tenantId) || [];
    const pool = list.find(p => p.vmiId === vmiId);
    if (!pool) throw new Error(`Stock pool ${vmiId} not found`);

    pool.currentStockUnits = Math.max(0, pool.currentStockUnits - consumedQuantity);
    pool.settledUnitsConsumedThisMonth += consumedQuantity;
    pool.settlementTriggerPending = pool.stockType === 'CONSIGNMENT_HELD' && pool.settledUnitsConsumedThisMonth > 0;
    pool.lastAuditedAt = new Date().toISOString();

    // Check min threshold replenishment trigger
    if (pool.currentStockUnits <= pool.minThresholdUnits) {
      pool.supplierReplenishmentProposedQty = pool.maxThresholdUnits - pool.currentStockUnits;
      eventBus.emit({
        eventId: `EVT-VMI-TRIG-${Date.now()}`,
        eventType: 'VMI_REPLENISHMENT_PROPOSED',
        tenantId,
        timestamp: new Date().toISOString(),
        payload: { vmiId, proposedQuantity: pool.supplierReplenishmentProposedQty },
        actor: { userId: 'VMI_AUTO_TRIGGER', role: 'system' }
      });
    }

    return pool;
  }

  public getStockPools(tenantId: string): VmiConsignmentRecord[] {
    return this.inventoryPools.get(tenantId) || [];
  }
}

export const vmiConsignmentEngine = VmiConsignmentEngine.getInstance();
