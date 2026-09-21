/**
 * ORION-9 WAVE 4 — GOVERNED PURCHASE ORDER LIFECYCLE ENGINE
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { POLineItem, PurchaseOrderRecord } from './types';

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
      return rec;
    });
  }

  public async submitPOForApproval(tenantId: string, poId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key);
    if (!po) throw new Error(`PO ${poId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:SubmitApproval',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'PENDING_APPROVAL',
      requiredPermission: 'purchase_order:create',
      estimatedValue: po.totalAmount,
      payload: null,
    }, async () => {
      po.status = 'APPROVED'; // If policy allows, transitions to APPROVED
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      return po;
    });
  }

  public async releasePO(tenantId: string, poId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key);
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
      return po;
    });
  }

  public async confirmPO(tenantId: string, poId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${poId}`;
    const po = this.purchaseOrders.get(key);
    if (!po) throw new Error(`PO ${poId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'PurchaseOrder:Confirm',
      tenantId,
      actor,
      entityType: 'PurchaseOrder',
      entityId: poId,
      currentState: po.status,
      targetState: 'CONFIRMED',
      requiredPermission: 'purchase_order:create',
      payload: null,
    }, async () => {
      po.status = 'CONFIRMED';
      po.confirmedAt = new Date().toISOString();
      po.updatedAt = new Date().toISOString();
      this.purchaseOrders.set(key, po);
      return po;
    });
  }

  public getPO(tenantId: string, poId: string): PurchaseOrderRecord | undefined {
    return this.purchaseOrders.get(`${tenantId}:${poId}`);
  }

  public listPOs(tenantId: string): PurchaseOrderRecord[] {
    const result: PurchaseOrderRecord[] = [];
    for (const [key, po] of this.purchaseOrders.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        result.push({ ...po });
      }
    }
    return result;
  }

  public clear(): void {
    this.purchaseOrders.clear();
  }
}

export const poLifecycleEngine = POLifecycleEngine.getInstance();
