/**
 * ORION-9 OUTBOUND WAREHOUSE EXECUTION ENGINE
 *
 * Governs:
 * 1. Wave generation and pick task dispatching with aisle/bin routing.
 * 2. Short-pick reporting and item substitution.
 * 3. Packing stations, carton dimensions, weighing, and dispatch staging.
 */

import { PickTaskRecord, CartonPackageRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class OutboundExecutionEngine {
  private static instance: OutboundExecutionEngine;
  private pickTasks: Map<string, PickTaskRecord[]> = new Map();
  private packages: Map<string, CartonPackageRecord[]> = new Map();

  public static getInstance(): OutboundExecutionEngine {
    if (!OutboundExecutionEngine.instance) {
      OutboundExecutionEngine.instance = new OutboundExecutionEngine();
    }
    return OutboundExecutionEngine.instance;
  }

  public createPickWave(params: {
    tenantId: string;
    orderId: string;
    items: Array<{ productId: string; quantity: number; sourceLocation: string }>;
    pickerId: string;
  }): PickTaskRecord[] {
    const waveId = `WAVE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const created: PickTaskRecord[] = [];

    params.items.forEach((item, index) => {
      const task: PickTaskRecord = {
        taskId: `PICK-${Date.now()}-${index + 1}`,
        tenantId: params.tenantId,
        waveId,
        orderId: params.orderId,
        productId: item.productId,
        sourceLocation: item.sourceLocation,
        requestedQuantity: item.quantity,
        pickedQuantity: 0,
        shortPickedQuantity: 0,
        pickerId: params.pickerId,
        status: 'QUEUED'
      };
      created.push(task);
    });

    const list = this.pickTasks.get(params.tenantId) || [];
    list.push(...created);
    this.pickTasks.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-WAVE-${Date.now()}`,
      eventType: 'PICK_WAVE_GENERATED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: { waveId, taskCount: created.length },
      actor: { userId: params.pickerId, role: 'warehouse_operator' }
    });

    return created;
  }

  public completePickTask(tenantId: string, taskId: string, pickedQty: number, shortQty: number = 0): PickTaskRecord {
    const list = this.pickTasks.get(tenantId) || [];
    const task = list.find(t => t.taskId === taskId);
    if (!task) throw new Error(`Pick task ${taskId} not found`);

    task.pickedQuantity = pickedQty;
    task.shortPickedQuantity = shortQty;
    task.status = shortQty > 0 ? 'SHORT_PICKED' : 'COMPLETED';
    task.completedAt = new Date().toISOString();

    eventBus.emit({
      eventId: `EVT-PICK-COMP-${Date.now()}`,
      eventType: 'PICK_COMPLETED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: task,
      actor: { userId: task.pickerId, role: 'warehouse_operator' }
    });

    return task;
  }

  public packCarton(params: Omit<CartonPackageRecord, 'packageId' | 'cartonBarcode' | 'packedAt' | 'status'>): CartonPackageRecord {
    const record: CartonPackageRecord = {
      ...params,
      packageId: `PKG-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      cartonBarcode: `BC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'SEALED',
      packedAt: new Date().toISOString()
    };

    const list = this.packages.get(params.tenantId) || [];
    list.unshift(record);
    this.packages.set(params.tenantId, list);

    eventBus.emit({
      eventId: `EVT-PACK-${Date.now()}`,
      eventType: 'PACKAGE_CREATED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'PACKING_STATION', role: 'warehouse_operator' }
    });

    return record;
  }

  public getPickTasks(tenantId: string): PickTaskRecord[] {
    return this.pickTasks.get(tenantId) || [];
  }

  public getPackages(tenantId: string): CartonPackageRecord[] {
    return this.packages.get(tenantId) || [];
  }
}

export const outboundExecutionEngine = OutboundExecutionEngine.getInstance();
