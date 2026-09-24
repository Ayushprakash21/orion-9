/**
 * ORION-9 AUTHORITATIVE AVAILABLE-TO-PROMISE (ATP) ENGINE
 *
 * Implements real-time ATP mathematics:
 * ATP = On Hand - Reserved + Confirmed Incoming + Expected Production + Transfer Supply - Safety Stock
 *
 * Provides:
 * 1. Exact promise quantity and promise date calculations.
 * 2. Multi-warehouse alternative inventory reallocation.
 * 3. Split fulfillment & backorder determination.
 * 4. Authoritative order reservation locking.
 */

import { AtpCalculationRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export interface AtpCheckRequest {
  tenantId: string;
  productId: string;
  warehouseId: string;
  requestedQuantity: number;
  requestedDeliveryDate: string;
  onHandQuantity: number;
  reservedQuantity: number;
  confirmedIncomingSupply?: number;
  expectedProductionSupply?: number;
  transferSupply?: number;
  safetyStockProtected?: number;
  alternativeWarehouses?: Array<{ warehouseId: string; onHand: number; reserved: number }>;
}

export class AvailableToPromiseEngine {
  private static instance: AvailableToPromiseEngine;
  private calculations: Map<string, AtpCalculationRecord[]> = new Map();

  public static getInstance(): AvailableToPromiseEngine {
    if (!AvailableToPromiseEngine.instance) {
      AvailableToPromiseEngine.instance = new AvailableToPromiseEngine();
    }
    return AvailableToPromiseEngine.instance;
  }

  public calculateAtp(request: AtpCheckRequest): AtpCalculationRecord {
    const incoming = request.confirmedIncomingSupply || 0;
    const production = request.expectedProductionSupply || 0;
    const transfer = request.transferSupply || 0;
    const safetyStock = request.safetyStockProtected || 0;

    // Authoritative ATP calculation
    const rawAtp = (request.onHandQuantity - request.reservedQuantity) + incoming + production + transfer - safetyStock;
    const availableToPromiseQuantity = Math.max(0, rawAtp);

    let fulfillmentStatus: AtpCalculationRecord['fulfillmentStatus'] = 'FULL_PROMISE';
    let promisedDeliveryDate = request.requestedDeliveryDate;
    let alternativeWarehouseId: string | undefined = undefined;

    if (availableToPromiseQuantity >= request.requestedQuantity) {
      fulfillmentStatus = 'FULL_PROMISE';
      promisedDeliveryDate = request.requestedDeliveryDate;
    } else if (availableToPromiseQuantity > 0) {
      fulfillmentStatus = 'PARTIAL_PROMISE';
      // If alternative warehouse has stock, recommend it
      if (request.alternativeWarehouses && request.alternativeWarehouses.length > 0) {
        const alt = request.alternativeWarehouses.find(w => (w.onHand - w.reserved) >= request.requestedQuantity);
        if (alt) {
          alternativeWarehouseId = alt.warehouseId;
          fulfillmentStatus = 'SPLIT_FULFILLMENT';
        }
      }
    } else {
      fulfillmentStatus = 'BACKORDER_REQUIRED';
      // Lead time push for backorder (default 7 days out)
      const date = new Date(request.requestedDeliveryDate);
      date.setDate(date.getDate() + 7);
      promisedDeliveryDate = date.toISOString().split('T')[0];
    }

    const record: AtpCalculationRecord = {
      atpId: `ATP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      tenantId: request.tenantId,
      productId: request.productId,
      warehouseId: request.warehouseId,
      requestedQuantity: request.requestedQuantity,
      onHandQuantity: request.onHandQuantity,
      reservedQuantity: request.reservedQuantity,
      confirmedIncomingSupply: incoming,
      expectedProductionSupply: production,
      transferSupply: transfer,
      safetyStockProtected: safetyStock,
      availableToPromiseQuantity,
      requestedDeliveryDate: request.requestedDeliveryDate,
      promisedDeliveryDate,
      fulfillmentStatus,
      alternativeWarehouseId,
      allocated: false,
      calculatedAt: new Date().toISOString()
    };

    const list = this.calculations.get(record.tenantId) || [];
    list.unshift(record);
    this.calculations.set(record.tenantId, list);

    eventBus.emit({
      eventId: `EVT-ATP-${Date.now()}`,
      eventType: 'ATP_CHECKED',
      tenantId: record.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'ATP_ENGINE', role: 'system' }
    });

    return record;
  }

  public allocateAtp(tenantId: string, atpId: string): AtpCalculationRecord {
    const list = this.calculations.get(tenantId) || [];
    const item = list.find(a => a.atpId === atpId);
    if (!item) throw new Error(`ATP calculation record ${atpId} not found`);

    item.allocated = true;

    eventBus.emit({
      eventId: `EVT-ATP-ALLOC-${Date.now()}`,
      eventType: 'ORDER_ALLOCATED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { atpId, allocatedQuantity: item.requestedQuantity },
      actor: { userId: 'ORDER_MANAGEMENT', role: 'admin' }
    });

    return item;
  }

  public getCalculations(tenantId: string): AtpCalculationRecord[] {
    return this.calculations.get(tenantId) || [];
  }
}

export const availableToPromiseEngine = AvailableToPromiseEngine.getInstance();
