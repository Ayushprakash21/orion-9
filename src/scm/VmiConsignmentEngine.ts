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
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';

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

    // Durable persistence with transactional outbox event
    scmPersistenceService.saveRecord('vmi_pools', record.vmiId, record, {
      emitEvent: true,
      eventType: 'scm.vmi_pool.registered',
      partitionKey: `${params.tenantId}:${record.vmiId}`,
      idempotencyKey: `vmi-${params.tenantId}-${record.vmiId}`
    }).catch((err) => {
      console.warn('[VMI-ENGINE] Async persistence failed:', err);
    });

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

  /**
   * Reconstruct authoritative state from storage for a fresh instance.
   */
  public async hydrateFromStorage(tenantId: string): Promise<VmiConsignmentRecord[]> {
    const stored = await scmPersistenceService.listRecords<VmiConsignmentRecord>('vmi_pools', tenantId);
    if (stored.length > 0) {
      this.inventoryPools.set(tenantId, stored);
      return stored;
    }
    return this.inventoryPools.get(tenantId) || [];
  }

  public getStockPools(tenantId: string): VmiConsignmentRecord[] {
    const current = this.inventoryPools.get(tenantId);
    if (current && current.length > 0) {
      return current;
    }
    const cached = scmPersistenceService.listCachedRecords<VmiConsignmentRecord>('vmi_pools', tenantId);
    if (cached.length > 0) {
      this.inventoryPools.set(tenantId, cached);
      return cached;
    }
    return [];
  }

  public clear(): void {
    this.inventoryPools.clear();
  }
}

export const vmiConsignmentEngine = VmiConsignmentEngine.getInstance();
