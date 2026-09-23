/**
 * ORION-9 ENTERPRISE SCM: RETURNS & REVERSE LOGISTICS ENGINE
 * RMA Lifecycle, Return Receipt, Inspection, Disposition & Customer Credit
 */

import {
  RMARecord,
  ReturnReceiptRecord,
  ReturnInspectionRecord,
  ReturnDispositionRecord,
  CustomerCreditRecord,
  RMAStatus,
  ReturnDispositionType
} from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { observabilityService } from '../operations/ObservabilityService';

export class ReturnsReverseLogisticsEngine {
  private static instance: ReturnsReverseLogisticsEngine;

  private rmas: Map<string, RMARecord> = new Map();
  private returnReceipts: Map<string, ReturnReceiptRecord[]> = new Map(); // rmaId -> receipts
  private returnInspections: Map<string, ReturnInspectionRecord[]> = new Map(); // rmaId -> inspections
  private dispositions: Map<string, ReturnDispositionRecord[]> = new Map(); // rmaId -> dispositions
  private customerCredits: Map<string, CustomerCreditRecord[]> = new Map(); // rmaId -> credits

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): ReturnsReverseLogisticsEngine {
    if (!ReturnsReverseLogisticsEngine.instance) {
      ReturnsReverseLogisticsEngine.instance = new ReturnsReverseLogisticsEngine();
    }
    return ReturnsReverseLogisticsEngine.instance;
  }

  private seedDefaultData(): void {
    const defaultTenant = 'demo-tenant';
    const sampleRMA: RMARecord = {
      rmaId: 'rma-sample-01',
      tenantId: defaultTenant,
      rmaNumber: 'RMA-2026-8801',
      customerOrderId: 'cord-9901',
      customerId: 'cust-apex-corp',
      productId: 'prod-srv-900',
      quantityReturned: 2,
      returnReason: 'DEFECTIVE',
      notes: 'Diagnostic self-test failed PCIe lane communication',
      status: 'APPROVED',
      requestedAt: '2026-02-15T10:00:00Z',
      approvedAt: '2026-02-15T12:30:00Z',
      approvedBy: 'cs_manager'
    };

    this.rmas.set(sampleRMA.rmaId, sampleRMA);
  }

  // ── RMA LIFECYCLE ──────────────────────────────────────────────────────────

  public requestRMA(params: {
    tenantId: string;
    customerOrderId: string;
    customerId: string;
    productId: string;
    quantityReturned: number;
    returnReason: 'DAMAGED' | 'DEFECTIVE' | 'WRONG_ITEM' | 'CUSTOMER_CANCEL' | 'OTHER';
    notes?: string;
  }): RMARecord {
    if (params.quantityReturned <= 0) {
      throw new Error('Return quantity must be greater than zero');
    }

    const rmaId = `rma-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const rmaNumber = `RMA-${Date.now().toString().slice(-6)}`;

    const record: RMARecord = {
      rmaId,
      tenantId: params.tenantId,
      rmaNumber,
      customerOrderId: params.customerOrderId,
      customerId: params.customerId,
      productId: params.productId,
      quantityReturned: params.quantityReturned,
      returnReason: params.returnReason,
      notes: params.notes,
      status: 'REQUESTED',
      requestedAt: new Date().toISOString()
    };

    this.rmas.set(rmaId, record);

    kernelAuditEngine.record({
      action: 'REQUEST_RMA',
      actor: { id: params.customerId, type: 'USER', name: params.customerId },
      entityId: rmaId,
      entityType: 'RMA',
      classification: 'INTERNAL',
      details: { rmaNumber, orderId: params.customerOrderId, quantity: params.quantityReturned, reason: params.returnReason }
    });

    observabilityService.log('INFO', `RMA ${rmaNumber} requested for order ${params.customerOrderId}`, {
      tenantId: params.tenantId,
      context: { rmaId, orderId: params.customerOrderId }
    });

    return record;
  }

  public approveRMA(rmaId: string, tenantId: string, approver: string): RMARecord {
    const rma = this.rmas.get(rmaId);
    if (!rma || rma.tenantId !== tenantId) {
      throw new Error(`RMA [${rmaId}] not found`);
    }

    if (rma.status !== 'REQUESTED') {
      throw new Error(`Cannot approve RMA in status [${rma.status}]`);
    }

    rma.status = 'APPROVED';
    rma.approvedAt = new Date().toISOString();
    rma.approvedBy = approver;

    kernelAuditEngine.record({
      action: 'APPROVE_RMA',
      actor: { id: approver, type: 'USER', name: approver },
      entityId: rmaId,
      entityType: 'RMA',
      classification: 'INTERNAL',
      details: { rmaNumber: rma.rmaNumber, approver }
    });

    return rma;
  }

  // ── RETURN RECEIPT & INSPECTION ────────────────────────────────────────────

  public receiveReturn(params: {
    tenantId: string;
    rmaId: string;
    warehouseId: string;
    quantityReceived: number;
    trackingNumber?: string;
    receiver: string;
  }): ReturnReceiptRecord {
    const rma = this.rmas.get(params.rmaId);
    if (!rma || rma.tenantId !== params.tenantId) {
      throw new Error(`RMA [${params.rmaId}] not found`);
    }

    const receiptId = `rrec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: ReturnReceiptRecord = {
      receiptId,
      tenantId: params.tenantId,
      rmaId: params.rmaId,
      warehouseId: params.warehouseId,
      quantityReceived: params.quantityReceived,
      trackingNumber: params.trackingNumber,
      receivedBy: params.receiver,
      receivedAt: new Date().toISOString()
    };

    const existing = this.returnReceipts.get(params.rmaId) || [];
    existing.push(record);
    this.returnReceipts.set(params.rmaId, existing);

    rma.status = 'RECEIVED';

    kernelAuditEngine.record({
      action: 'RECEIVE_RETURN_SHIPMENT',
      actor: { id: params.receiver, type: 'USER', name: params.receiver },
      entityId: receiptId,
      entityType: 'RETURN_RECEIPT',
      classification: 'INTERNAL',
      details: { rmaId: params.rmaId, quantity: params.quantityReceived, warehouse: params.warehouseId }
    });

    return record;
  }

  public inspectReturn(params: {
    tenantId: string;
    rmaId: string;
    productId: string;
    inspectedQuantity: number;
    condition: 'MINT' | 'OPEN_BOX' | 'DAMAGED' | 'UNUSABLE';
    inspectorNotes?: string;
    inspector: string;
  }): ReturnInspectionRecord {
    const rma = this.rmas.get(params.rmaId);
    if (!rma || rma.tenantId !== params.tenantId) {
      throw new Error(`RMA [${params.rmaId}] not found`);
    }

    const inspectionId = `rinsp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: ReturnInspectionRecord = {
      inspectionId,
      tenantId: params.tenantId,
      rmaId: params.rmaId,
      productId: params.productId,
      inspectedQuantity: params.inspectedQuantity,
      condition: params.condition,
      inspectorNotes: params.inspectorNotes,
      inspectedBy: params.inspector,
      inspectedAt: new Date().toISOString()
    };

    const existing = this.returnInspections.get(params.rmaId) || [];
    existing.push(record);
    this.returnInspections.set(params.rmaId, existing);

    rma.status = 'INSPECTED';

    kernelAuditEngine.record({
      action: 'INSPECT_RETURN_ITEM',
      actor: { id: params.inspector, type: 'USER', name: params.inspector },
      entityId: inspectionId,
      entityType: 'RETURN_INSPECTION',
      classification: 'INTERNAL',
      details: { rmaId: params.rmaId, condition: params.condition, quantity: params.inspectedQuantity }
    });

    return record;
  }

  // ── DISPOSITION & CREDIT ───────────────────────────────────────────────────

  public dispositionReturn(params: {
    tenantId: string;
    rmaId: string;
    disposition: ReturnDispositionType;
    quantity: number;
    destinationWarehouseId?: string;
    supplierId?: string;
    actionTaken: string;
    dispositioner: string;
  }): ReturnDispositionRecord {
    const rma = this.rmas.get(params.rmaId);
    if (!rma || rma.tenantId !== params.tenantId) {
      throw new Error(`RMA [${params.rmaId}] not found`);
    }

    const dispositionId = `rdisp-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: ReturnDispositionRecord = {
      dispositionId,
      tenantId: params.tenantId,
      rmaId: params.rmaId,
      disposition: params.disposition,
      quantity: params.quantity,
      destinationWarehouseId: params.destinationWarehouseId,
      supplierId: params.supplierId,
      actionTaken: params.actionTaken,
      dispositionedBy: params.dispositioner,
      dispositionedAt: new Date().toISOString()
    };

    const existing = this.dispositions.get(params.rmaId) || [];
    existing.push(record);
    this.dispositions.set(params.rmaId, existing);

    rma.status = 'DISPOSITIONED';

    kernelAuditEngine.record({
      action: 'DISPOSITION_RETURN',
      actor: { id: params.dispositioner, type: 'USER', name: params.dispositioner },
      entityId: dispositionId,
      entityType: 'RETURN_DISPOSITION',
      classification: 'INTERNAL',
      details: { rmaId: params.rmaId, disposition: params.disposition, quantity: params.quantity }
    });

    return record;
  }

  public issueCustomerCredit(params: {
    tenantId: string;
    rmaId: string;
    customerId: string;
    creditAmount: number;
    currency: string;
    actor: string;
  }): CustomerCreditRecord {
    const rma = this.rmas.get(params.rmaId);
    if (!rma || rma.tenantId !== params.tenantId) {
      throw new Error(`RMA [${params.rmaId}] not found`);
    }

    const creditId = `ccred-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: CustomerCreditRecord = {
      creditId,
      tenantId: params.tenantId,
      rmaId: params.rmaId,
      customerId: params.customerId,
      creditAmount: params.creditAmount,
      currency: params.currency,
      status: 'ISSUED',
      issuedAt: new Date().toISOString()
    };

    const existing = this.customerCredits.get(params.rmaId) || [];
    existing.push(record);
    this.customerCredits.set(params.rmaId, existing);

    rma.status = 'REFUNDED';

    kernelAuditEngine.record({
      action: 'ISSUE_CUSTOMER_CREDIT',
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: creditId,
      entityType: 'CUSTOMER_CREDIT',
      classification: 'CONFIDENTIAL',
      details: { rmaId: params.rmaId, customerId: params.customerId, amount: params.creditAmount, currency: params.currency }
    });

    return record;
  }

  public listRMAs(tenantId?: string): RMARecord[] {
    const list = Array.from(this.rmas.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(r => r.tenantId === tenantId);
  }
}

export const returnsReverseLogisticsEngine = ReturnsReverseLogisticsEngine.getInstance();
