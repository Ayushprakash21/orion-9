/**
 * ORION-9 WAVE 4 — INBOUND LOGISTICS ENGINE
 * ASN, Shipment Tracking, and Gate Entry Process
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { poLifecycleEngine } from './POLifecycleEngine';
import {
  ASNItem,
  ASNRecord,
  GateEntryRecord,
  ShipmentRecord,
} from './types';

export class InboundLogisticsEngine {
  private static instance: InboundLogisticsEngine;

  private asns: Map<string, ASNRecord> = new Map();
  private shipments: Map<string, ShipmentRecord> = new Map();
  private gateEntries: Map<string, GateEntryRecord> = new Map();

  private constructor() {}

  public static getInstance(): InboundLogisticsEngine {
    if (!InboundLogisticsEngine.instance) {
      InboundLogisticsEngine.instance = new InboundLogisticsEngine();
    }
    return InboundLogisticsEngine.instance;
  }

  // 1. ADVANCE SHIPPING NOTICE (ASN)
  public async createASN(params: {
    tenantId: string;
    actor: AuthorizationActor;
    poId: string;
    supplierId: string;
    carrier: string;
    trackingNumber: string;
    shippedDate: string;
    expectedArrivalDate: string;
    items: ASNItem[];
  }) {
    const asnId = `ASN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const asnNumber = `ASN-800${Math.floor(Math.random() * 9000 + 1000)}`;

    // Quantity Validation against PO
    const po = poLifecycleEngine.getPO(params.tenantId, params.poId);
    if (po) {
      for (const asnItem of params.items) {
        const poItem = po.items.find((i) => i.productId === asnItem.productId);
        if (poItem && asnItem.shippedQuantity > poItem.quantity * 1.1) {
          return {
            success: false,
            status: 'DENIED_POLICY' as const,
            message: `ASN Policy Failure: Quantity ${asnItem.shippedQuantity} for product ${asnItem.productId} exceeds PO quantity ${poItem.quantity} beyond 10% tolerance limit`,
            correlationId: `CORR-ASN-QTY-${Date.now()}`,
          };
        }
      }
    }

    const record: ASNRecord = {
      asnId,
      tenantId: params.tenantId,
      asnNumber,
      poId: params.poId,
      supplierId: params.supplierId,
      carrier: params.carrier,
      trackingNumber: params.trackingNumber,
      shippedDate: params.shippedDate,
      expectedArrivalDate: params.expectedArrivalDate,
      items: params.items,
      status: 'SUBMITTED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'ASN:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'ASN',
      entityId: asnId,
      targetState: 'SUBMITTED',
      requiredPermission: 'asn:create',
      payload: record,
    }, async (rec) => {
      this.asns.set(`${params.tenantId}:${asnId}`, rec);
      return rec;
    });
  }

  // 2. SHIPMENT TRACKING
  public async createShipment(params: {
    tenantId: string;
    actor: AuthorizationActor;
    carrier: string;
    trackingNumber: string;
    origin: string;
    destination: string;
    poId?: string;
    asnId?: string;
    expectedArrival: string;
    items: Array<{ productId: string; quantity: number }>;
  }) {
    const shipmentId = `SHP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: ShipmentRecord = {
      shipmentId,
      tenantId: params.tenantId,
      trackingNumber: params.trackingNumber,
      carrier: params.carrier,
      origin: params.origin,
      destination: params.destination,
      poId: params.poId,
      asnId: params.asnId,
      status: 'IN_TRANSIT',
      expectedArrival: params.expectedArrival,
      delayDays: 0,
      items: params.items,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Shipment:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'Shipment',
      entityId: shipmentId,
      targetState: 'IN_TRANSIT',
      requiredPermission: 'shipment:update',
      payload: record,
    }, async (rec) => {
      this.shipments.set(`${params.tenantId}:${shipmentId}`, rec);
      return rec;
    });
  }

  // 3. GATE ENTRY
  public async createGateEntry(params: {
    tenantId: string;
    actor: AuthorizationActor;
    vehicleNumber: string;
    carrier: string;
    driverName: string;
    shipmentId?: string;
    warehouseId: string;
  }) {
    const gateEntryId = `GATE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: GateEntryRecord = {
      gateEntryId,
      tenantId: params.tenantId,
      vehicleNumber: params.vehicleNumber,
      carrier: params.carrier,
      driverName: params.driverName,
      shipmentId: params.shipmentId,
      warehouseId: params.warehouseId,
      securityStatus: 'PASSED',
      status: 'ARRIVED',
      arrivalTime: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'GateEntry:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'GateEntry',
      entityId: gateEntryId,
      targetState: 'ARRIVED',
      requiredPermission: 'receiving:create',
      payload: record,
    }, async (rec) => {
      this.gateEntries.set(`${params.tenantId}:${gateEntryId}`, rec);
      return rec;
    });
  }

  public getASN(tenantId: string, asnId: string) { return this.asns.get(`${tenantId}:${asnId}`); }
  public getShipment(tenantId: string, shipmentId: string) { return this.shipments.get(`${tenantId}:${shipmentId}`); }
  public getGateEntry(tenantId: string, gateEntryId: string) { return this.gateEntries.get(`${tenantId}:${gateEntryId}`); }
  public clear(): void {
    this.asns.clear();
    this.shipments.clear();
    this.gateEntries.clear();
  }
}

export const inboundLogisticsEngine = InboundLogisticsEngine.getInstance();
