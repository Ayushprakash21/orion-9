/**
 * ORION-9 WAVE 4 / PART 4 TRACK 2 — RECEIVING, GRN, QUALITY INSPECTION & PUTAWAY ENGINE
 * Authoritatively persisted via Cloud Firestore & ScmPersistenceService with inventory posting.
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';
import {
  GRNRecord,
  PutawayRecord,
  QualityInspectionRecord,
  QualityStatus,
  ReceivingRecord,
} from './types';

export class ReceivingGRNEngine {
  private static instance: ReceivingGRNEngine;

  private receipts: Map<string, ReceivingRecord> = new Map();
  private grns: Map<string, GRNRecord> = new Map();
  private inspections: Map<string, QualityInspectionRecord> = new Map();
  private putaways: Map<string, PutawayRecord> = new Map();

  private constructor() {}

  public static getInstance(): ReceivingGRNEngine {
    if (!ReceivingGRNEngine.instance) {
      ReceivingGRNEngine.instance = new ReceivingGRNEngine();
    }
    return ReceivingGRNEngine.instance;
  }

  // 1. RECEIVING TRANSACTION
  public async recordReceiving(params: {
    tenantId: string;
    actor: AuthorizationActor;
    poId: string;
    asnId?: string;
    shipmentId?: string;
    warehouseId: string;
    receivedItems: Array<{
      productId: string;
      receivedQuantity: number;
      damagedQuantity: number;
      shortQuantity: number;
    }>;
  }) {
    const receivingId = `RCV-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: ReceivingRecord = {
      receivingId,
      tenantId: params.tenantId,
      poId: params.poId,
      asnId: params.asnId,
      shipmentId: params.shipmentId,
      warehouseId: params.warehouseId,
      receivedItems: params.receivedItems,
      receivedBy: params.actor.id,
      timestamp: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Receiving:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'Receiving',
      entityId: receivingId,
      targetState: 'RECORDED',
      requiredPermission: 'receiving:create',
      payload: record,
    }, async (rec) => {
      this.receipts.set(`${params.tenantId}:${receivingId}`, rec);
      await scmPersistenceService.saveRecord('receipts', receivingId, rec);
      return rec;
    });
  }

  // 2. GOODS RECEIPT NOTE (GRN) POSTING
  public async postGRN(params: {
    tenantId: string;
    actor: AuthorizationActor;
    poId: string;
    receivingId: string;
    warehouseId: string;
    items: Array<{ productId: string; acceptedQuantity: number; unitCost: number }>;
  }) {
    const grnId = `GRN-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const grnNumber = `GRN-700${Math.floor(Math.random() * 9000 + 1000)}`;

    const record: GRNRecord = {
      grnId,
      tenantId: params.tenantId,
      grnNumber,
      poId: params.poId,
      receivingId: params.receivingId,
      warehouseId: params.warehouseId,
      items: params.items,
      status: 'POSTED',
      postedAt: new Date().toISOString(),
      postedBy: params.actor.id,
      createdAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'GRN:Post',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'GRN',
      entityId: grnId,
      targetState: 'POSTED',
      requiredPermission: 'grn:post',
      payload: record,
    }, async (rec) => {
      this.grns.set(`${params.tenantId}:${grnId}`, rec);
      await scmPersistenceService.saveRecord('grns', grnId, rec);

      // Authoritatively update inventory balance and record transaction for each received item
      for (const item of params.items) {
        if (item.acceptedQuantity > 0) {
          await scmPersistenceService.adjustInventory({
            tenantId: params.tenantId,
            productId: item.productId,
            warehouseId: params.warehouseId,
            quantityDelta: item.acceptedQuantity,
            transactionType: 'GRN_RECEIPT',
            referenceEntityType: 'GRN',
            referenceEntityId: grnId,
            actor: params.actor.id,
            correlationId: `CORR-GRN-${grnId}`,
          });
        }
      }

      return rec;
    });
  }

  // 3. QUALITY INSPECTION
  public async inspectQuality(params: {
    tenantId: string;
    actor: AuthorizationActor;
    grnId: string;
    productId: string;
    quantityInspected: number;
    quantityPassed: number;
    quantityFailed: number;
    notes?: string;
  }) {
    const inspectionId = `INSP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const decision: QualityStatus = params.quantityFailed > 0 ? (params.quantityPassed === 0 ? 'FAILED' : 'QUARANTINED') : 'PASSED';

    const record: QualityInspectionRecord = {
      inspectionId,
      tenantId: params.tenantId,
      inspectionLot: `LOT-${Date.now().toString(36)}`,
      grnId: params.grnId,
      productId: params.productId,
      quantityInspected: params.quantityInspected,
      quantityPassed: params.quantityPassed,
      quantityFailed: params.quantityFailed,
      decision,
      inspectorId: params.actor.id,
      notes: params.notes,
      inspectedAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Quality:Inspect',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'QualityInspection',
      entityId: inspectionId,
      targetState: decision,
      requiredPermission: 'quality:inspect',
      payload: record,
    }, async (rec) => {
      this.inspections.set(`${params.tenantId}:${inspectionId}`, rec);
      await scmPersistenceService.saveRecord('quality_inspections', inspectionId, rec);
      return rec;
    });
  }

  // 4. PUTAWAY PROCESS
  public async executePutaway(params: {
    tenantId: string;
    actor: AuthorizationActor;
    grnId: string;
    productId: string;
    quantity: number;
    sourceLocation: string;
    destinationLocation: string;
    warehouseId?: string;
  }) {
    const putawayId = `PUT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const record: PutawayRecord = {
      putawayId,
      tenantId: params.tenantId,
      grnId: params.grnId,
      productId: params.productId,
      quantity: params.quantity,
      sourceLocation: params.sourceLocation,
      destinationLocation: params.destinationLocation,
      status: 'COMPLETED',
      operatorId: params.actor.id,
      completedAt: new Date().toISOString(),
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'Putaway:Complete',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'Putaway',
      entityId: putawayId,
      targetState: 'COMPLETED',
      requiredPermission: 'inventory:adjust',
      payload: record,
    }, async (rec) => {
      this.putaways.set(`${params.tenantId}:${putawayId}`, rec);
      await scmPersistenceService.saveRecord('putaways', putawayId, rec);

      // Record Putaway transfer transaction
      const whId = params.warehouseId || params.destinationLocation.split('-')[0] || 'WH-01';
      await scmPersistenceService.adjustInventory({
        tenantId: params.tenantId,
        productId: params.productId,
        warehouseId: whId,
        quantityDelta: 0, // balance net zero across warehouse, but logged as transfer
        transactionType: 'PUTAWAY_TRANSFER',
        referenceEntityType: 'PUTAWAY',
        referenceEntityId: putawayId,
        actor: params.actor.id,
        correlationId: `CORR-PUT-${putawayId}`,
      });

      return rec;
    });
  }

  public getReceiving(tenantId: string, receivingId: string) {
    return this.receipts.get(`${tenantId}:${receivingId}`) || scmPersistenceService.getCachedRecord<ReceivingRecord>('receipts', tenantId, receivingId);
  }

  public getGRN(tenantId: string, grnId: string) {
    return this.grns.get(`${tenantId}:${grnId}`) || scmPersistenceService.getCachedRecord<GRNRecord>('grns', tenantId, grnId);
  }

  public getInspection(tenantId: string, inspectionId: string) {
    return this.inspections.get(`${tenantId}:${inspectionId}`) || scmPersistenceService.getCachedRecord<QualityInspectionRecord>('quality_inspections', tenantId, inspectionId);
  }

  public getPutaway(tenantId: string, putawayId: string) {
    return this.putaways.get(`${tenantId}:${putawayId}`) || scmPersistenceService.getCachedRecord<PutawayRecord>('putaways', tenantId, putawayId);
  }

  public clear(): void {
    this.receipts.clear();
    this.grns.clear();
    this.inspections.clear();
    this.putaways.clear();
    scmPersistenceService.clear('receipts');
    scmPersistenceService.clear('grns');
    scmPersistenceService.clear('quality_inspections');
    scmPersistenceService.clear('putaways');
  }
}

export const receivingGRNEngine = ReceivingGRNEngine.getInstance();
