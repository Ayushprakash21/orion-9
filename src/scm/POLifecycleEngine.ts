/**
 * ORION-9 WAVE 4 / PART 4 TRACK 2 — GOVERNED PURCHASE ORDER LIFECYCLE ENGINE
 * Authoritatively persisted via Cloud Firestore (purchase_orders) & ScmPersistenceService.
 */

import { scmTransactionEngine, ScmCommandResult } from '../kernel/scm/ScmTransactionEngine';
import { authorizationEngine, AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';
import { POLineItem, PurchaseOrderRecord } from './types';
import { scmBusinessRuleEngine } from './ScmBusinessRuleEngine';

export class POLifecycleEngine {
  private static instance: POLifecycleEngine;
  private purchaseOrders: Map<string, PurchaseOrderRecord> = new Map();

  private constructor() {}

  public static getInstance(): POLifecycleEngine {
    if (!POLifecycleEngine.instance) {
      POLifecycleEngine.instance = new POLifecycleEngine();
    }
    return POLifecycleEngine.instance;
  }

  public async createPO(params: {
    tenantId: string;
    actor: AuthorizationActor;
    supplierId: string;
    items: POLineItem[];
    prId?: string;
    rfqId?: string;
    quotationId?: string;
    paymentTerms?: string;
    incoterms?: string;
    deliveryLocation?: string;
    currency?: string;
  }) {
    const poId = `PO-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const poNumber = `PO-900${Math.floor(Math.random() * 9000 + 1000)}`;
    const now = new Date().toISOString();

    const subtotal = params.items.reduce((acc, item) => acc + item.totalPrice, 0);
    const taxAmount = Math.round(subtotal * 0.08 * 100) / 100;
    const freightAmount = 150.0;
    const totalAmount = subtotal + taxAmount + freightAmount;

    const record: PurchaseOrderRecord = {
      poId,
      tenantId: params.tenantId,
      poNumber,
      supplierId: params.supplierId,
      prId: params.prId,
      rfqId: params.rfqId,
      quotationId: params.quotationId,
      items: params.items,
      subtotal,
      taxAmount,
      freightAmount,
      totalAmount,
      currency: params.currency || 'USD',
      paymentTerms: params.paymentTerms || 'NET30',
      incoterms: params.incoterms || 'FOB',
      deliveryLocation: params.deliveryLocation || 'Main Warehouse Dock 4',
      status: 'DRAFT',
      createdAt: now,
      updatedAt: now,
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      targetState: 'DRAFT',
      requiredPermission: 'purchase_order:create',
      estimatedValue: totalAmount,
      payload: record,
    }, async (rec) => {
      this.purchaseOrders.set(`${params.tenantId}:${poId}`, rec);
      await scmPersistenceService.saveRecord('purchase_orders', poId, rec);
      return rec;
    });
  }

  public async submitPOForApproval(tenantId: string, poId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:SubmitApproval',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'APPROVED',
      requiredPermission: 'purchase_order:create',
      estimatedValue: po.totalAmount,
      payload: null,
    }, async () => {
      po.status = 'APPROVED';
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return po;
    });
  }

  public async approvePO(tenantId: string, poId: string, actor: AuthorizationActor): Promise<ScmCommandResult<PurchaseOrderRecord>> {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    // Business rule & approval threshold check
    const ruleEval = scmBusinessRuleEngine.evaluatePOApproval({ po, approver: actor });
    if (!ruleEval.allowed) {
      return {
        success: false,
        status: 'DENIED_POLICY' as const,
        message: ruleEval.reason || 'PO approval policy violation',
        correlationId: `CORR-PO-APP-${Date.now()}`,
      };
    }

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Approve',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'APPROVED',
      requiredPermission: 'purchase_order:approve',
      estimatedValue: po.totalAmount,
      payload: null,
    }, async () => {
      po.status = 'APPROVED';
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return po;
    });
  }

  public async rejectPO(tenantId: string, poId: string, actor: AuthorizationActor, reason?: string): Promise<ScmCommandResult<PurchaseOrderRecord>> {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Reject',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'REJECTED',
      requiredPermission: 'purchase_order:approve',
      payload: null,
    }, async () => {
      po.status = 'REJECTED';
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return po;
    });
  }

  public async releasePO(tenantId: string, poId: string, actor: AuthorizationActor): Promise<ScmCommandResult<PurchaseOrderRecord>> {
    if (actor && actor.organizationId && actor.organizationId !== tenantId) {
      return {
        success: false,
        status: 'DENIED_AUTHORIZATION' as const,
        message: `Tenant isolation violation: Actor tenant '${actor.organizationId}' mismatch with target tenant '${tenantId}'`,
        correlationId: `CORR-TENANT-DENIED-${Date.now()}`,
      };
    }

    try {
      authorizationEngine.authorize({
        actor,
        requiredPermission: 'purchase_order:release',
        organizationId: tenantId,
        resourceType: 'purchase_order',
      });
    } catch (err: any) {
      return {
        success: false,
        status: 'DENIED_AUTHORIZATION' as const,
        message: err.message || 'Authorization denied',
        correlationId: `CORR-AUTH-DENIED-${Date.now()}`,
      };
    }

    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    // Strict Enforcement: Unapproved PO MUST NOT be released to external systems
    if (po.status !== 'APPROVED') {
      return {
        success: false,
        status: 'DENIED_POLICY' as const,
        message: `Policy enforcement failure: PO '${po.poNumber}' in status '${po.status}' cannot be released until APPROVED`,
        correlationId: `CORR-RELEASE-${Date.now()}`,
      };
    }

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Release',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'RELEASED',
      requiredPermission: 'purchase_order:release',
      payload: null,
    }, async () => {
      po.status = 'RELEASED';
      po.releasedAt = new Date().toISOString();
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return po;
    });
  }

  public async acknowledgePO(tenantId: string, poId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Acknowledge',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'ACKNOWLEDGED',
      requiredPermission: 'purchase_order:create',
      payload: null,
    }, async () => {
      po.status = 'ACKNOWLEDGED';
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return po;
    });
  }

  public async confirmPO(
    paramsOrTenantId: string | {
      tenantId: string;
      poId: string;
      actor: AuthorizationActor;
      confirmedLines?: Array<{ lineId: string; confirmedQuantity: number; confirmedDeliveryDate?: string }>;
      rejectionReason?: string;
    },
    poIdArg?: string,
    actorArg?: AuthorizationActor,
    confirmedLinesArg?: Array<{ lineId: string; confirmedQuantity: number; confirmedDeliveryDate?: string }>,
    rejectionReasonArg?: string
  ) {
    let tenantId: string;
    let poId: string;
    let actor: AuthorizationActor;
    let confirmedLines: Array<{ lineId: string; confirmedQuantity: number; confirmedDeliveryDate?: string }> | undefined;
    let rejectionReason: string | undefined;

    if (typeof paramsOrTenantId === 'object') {
      tenantId = paramsOrTenantId.tenantId;
      poId = paramsOrTenantId.poId;
      actor = paramsOrTenantId.actor;
      confirmedLines = paramsOrTenantId.confirmedLines;
      rejectionReason = paramsOrTenantId.rejectionReason;
    } else {
      tenantId = paramsOrTenantId;
      poId = poIdArg!;
      actor = actorArg!;
      confirmedLines = confirmedLinesArg;
      rejectionReason = rejectionReasonArg;
    }

    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    if (rejectionReason) {
      po.status = 'REJECTED';
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return { success: true, status: 'COMPLETED', data: po, correlationId: `CORR-CONF-REJ-${Date.now()}` };
    }

    // Check if partial or full confirmation
    let isPartial = false;
    if (confirmedLines && confirmedLines.length > 0) {
      for (const cl of confirmedLines) {
        const poLine = po.items.find((i) => i.lineId === cl.lineId);
        if (poLine && cl.confirmedQuantity < poLine.quantity) {
          isPartial = true;
        }
      }
    }

    const targetState = isPartial ? 'PARTIALLY_CONFIRMED' : 'CONFIRMED';

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Confirm',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState,
      requiredPermission: 'supplier:confirm',
      payload: null,
    }, async () => {
      po.status = targetState;
      po.confirmedAt = new Date().toISOString();
      po.updatedAt = new Date().toISOString();

      // Record formal supplier confirmation in persistence
      const confId = `CONF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      await scmPersistenceService.saveRecord('supplier_confirmations', confId, {
        id: confId,
        tenantId,
        poId,
        isPartial,
        confirmedLines: confirmedLines || po.items.map((i) => ({ lineId: i.lineId, confirmedQuantity: i.quantity })),
        confirmedAt: new Date().toISOString(),
      });

      this.purchaseOrders.set(key, po);
      await scmPersistenceService.saveRecord('purchase_orders', poId, po);
      return po;
    });
  }

  public async cancelPO(tenantId: string, poId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
    if (!po) throw new Error(`PO ${poId} not found`);

    if (po.status === 'RECEIVED' || po.status === 'CLOSED') {
      throw new Error(`Cannot cancel PO [${po.poNumber}] in status [${po.status}]`);
    }

    po.status = 'CANCELLED';
    po.updatedAt = new Date().toISOString();
    this.purchaseOrders.set(key, po);
    await scmPersistenceService.saveRecord('purchase_orders', poId, po);
    return po;
  }

  public getPO(tenantId: string, poId: string): PurchaseOrderRecord | undefined {
    return this.purchaseOrders.get(`${tenantId}:${poId}`) || scmPersistenceService.getCachedRecord<PurchaseOrderRecord>('purchase_orders', tenantId, poId);
  }

  public listPOs(tenantId: string): PurchaseOrderRecord[] {
    const result: PurchaseOrderRecord[] = [];
    for (const [key, po] of this.purchaseOrders.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...po });
      }
    }
    if (result.length === 0) {
      return scmPersistenceService.listCachedRecords<PurchaseOrderRecord>('purchase_orders', tenantId);
    }
    return result;
  }

  public clear(): void {
    this.purchaseOrders.clear();
    scmPersistenceService.clear('purchase_orders');
  }
}

export const poLifecycleEngine = POLifecycleEngine.getInstance();
