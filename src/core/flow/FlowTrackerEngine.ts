/**
 * ORION-9 UNIFIED SUPPLY CHAIN FLOW TRACKER ENGINE
 * End-to-end operational pipeline orchestration for Order-to-Cash (O2C) and Procure-to-Pay (P2P).
 * Integrates with KernelEventBus for real-time domain events, ScmPersistenceService for durable
 * Cloud Firestore persistence, SLA tracking, and exception resolution.
 */

import {
  FlowPipelineType,
  FlowStatus,
  FlowStageStatus,
  FlowTrackingRecord,
  FlowStage,
  FlowException,
  LinkedFlowDocument,
  FlowFilterCriteria,
} from './FlowTrackerTypes';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { KernelEventBus } from '../../kernel/EventBus';

export const O2C_STAGES_TEMPLATE: Array<{ id: string; name: string; label: string }> = [
  { id: 'ORDER_CREATED', name: 'Order Created', label: 'Customer Order Received & Validated' },
  { id: 'INVENTORY_ALLOCATED', name: 'Inventory Allocated', label: 'Stock Reserved at Fulfillment Center' },
  { id: 'PICKED_PACKED', name: 'Picked & Packed', label: 'Warehouse Pick-Pack Completed' },
  { id: 'SHIPPED', name: 'Shipped', label: 'Carrier Dispatched with Waybill' },
  { id: 'DELIVERED', name: 'Delivered', label: 'Proof of Delivery Confirmed' },
  { id: 'INVOICED', name: 'Invoiced', label: 'Customer Invoice Generated & Sent' },
  { id: 'PAYMENT_RECEIVED', name: 'Payment Received', label: 'Funds Reconciled in AR Ledger' },
];

export const P2P_STAGES_TEMPLATE: Array<{ id: string; name: string; label: string }> = [
  { id: 'PO_DRAFT', name: 'PO Draft', label: 'Purchase Requisition Created' },
  { id: 'PO_APPROVED', name: 'PO Approved', label: 'Authorized by Procurement Committee' },
  { id: 'SUPPLIER_ACKNOWLEDGED', name: 'Supplier Acknowledged', label: 'Supplier Accepted Delivery Schedule' },
  { id: 'IN_TRANSIT', name: 'In Transit', label: 'Inbound Freight Dispatched' },
  { id: 'GRN_RECEIVED', name: 'GRN Received', label: 'Dock Receiving & Quality Inspection' },
  { id: 'THREE_WAY_MATCHED', name: '3-Way Matched', label: 'PO, GRN & Invoice Reconciled' },
  { id: 'PAYMENT_SCHEDULED', name: 'Payment Scheduled', label: 'AP Payment Queued in Treasury' },
  { id: 'PAID', name: 'Paid', label: 'Disbursement Executed to Supplier' },
];

import { DatabaseConnectionManager } from '../database/DatabaseConnectionManager';

export class FlowTrackerEngine {
  private static instance: FlowTrackerEngine;
  private persistence: ScmPersistenceService;
  private memoryCache: Map<string, FlowTrackingRecord> = new Map();
  private eventBus: KernelEventBus;
  private initializedTenants: Set<string> = new Set();
  private initializationPromises: Map<string, Promise<void>> = new Map();

  private constructor() {
    this.persistence = ScmPersistenceService.getInstance();
    this.eventBus = KernelEventBus.getInstance();
    this.registerEventSubscriptions();
  }

  public static getInstance(): FlowTrackerEngine {
    if (!FlowTrackerEngine.instance) {
      FlowTrackerEngine.instance = new FlowTrackerEngine();
    }
    return FlowTrackerEngine.instance;
  }

  private registerEventSubscriptions(): void {
    // Listen to purchase orders
    this.eventBus.subscribe('scm.purchase_order.*', async (event) => {
      try {
        const payload = event.payload;
        if (!payload || !payload.id || !payload.tenantId) return;
        await this.handlePoEvent(payload);
      } catch (e) {
        console.warn('[FlowTrackerEngine] Error processing PO event:', e);
      }
    });

    // Listen to shipments
    this.eventBus.subscribe('scm.shipment.*', async (event) => {
      try {
        const payload = event.payload;
        if (!payload || !payload.tenantId) return;
        await this.handleShipmentEvent(payload);
      } catch (e) {
        console.warn('[FlowTrackerEngine] Error processing Shipment event:', e);
      }
    });

    // Listen to GRN events
    this.eventBus.subscribe('scm.receiving.grn_created', async (event) => {
      try {
        const payload = event.payload;
        if (!payload || !payload.poNumber || !payload.tenantId) return;
        await this.handleGrnEvent(payload);
      } catch (e) {
        console.warn('[FlowTrackerEngine] Error processing GRN event:', e);
      }
    });
  }

  private async handlePoEvent(po: any): Promise<void> {
    const flows = await this.listFlows(po.tenantId);
    const existing = flows.find(f => f.referenceNumber === po.poNumber || f.entityId === po.id);
    if (existing) {
      if (po.status === 'Approved') {
        await this.advanceFlowStage(po.tenantId, existing.id, 'PO_APPROVED', 'Procurement Officer', 'PO auto-advanced via approval event');
      }
    }
  }

  private async handleShipmentEvent(shipment: any): Promise<void> {
    const flows = await this.listFlows(shipment.tenantId);
    const matching = flows.find(f => f.linkedDocuments.some(d => d.reference === shipment.trackingNumber || d.documentId === shipment.id));
    if (matching && shipment.status === 'Delivered') {
      const stageToAdvance = matching.flowType === 'ORDER_TO_CASH' ? 'DELIVERED' : 'GRN_RECEIVED';
      await this.advanceFlowStage(shipment.tenantId, matching.id, stageToAdvance, 'Logistics Carrier', `Shipment status: ${shipment.status}`);
    }
  }

  private async handleGrnEvent(grn: any): Promise<void> {
    const flows = await this.listFlows(grn.tenantId);
    const matching = flows.find(f => f.referenceNumber === grn.poNumber);
    if (matching) {
      await this.advanceFlowStage(grn.tenantId, matching.id, 'GRN_RECEIVED', 'Warehouse Receiving', `GRN ${grn.grnNumber} issued`, {
        documentType: 'GOODS_RECEIPT_NOTE',
        documentId: grn.grnNumber,
        reference: grn.grnNumber,
        date: new Date().toISOString(),
        status: grn.status,
      });
    }
  }

  public async initializeSeedIfEmpty(tenantId: string): Promise<void> {
    if (this.initializedTenants.has(tenantId)) return;
    const existing = this.initializationPromises.get(tenantId);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const records = await this.persistence.listRecords<FlowTrackingRecord>('flow_tracking_records', tenantId);
        const env = DatabaseConnectionManager.getInstance().getEnvironment();
        const isLive = env === 'LIVE';

        if (records.length === 0 && !isLive) {
          const demoFlows: FlowTrackingRecord[] = [
            {
              id: 'flow-o2c-101',
              flowId: 'flow-o2c-101',
              tenantId,
              flowType: 'ORDER_TO_CASH',
              entityId: 'SO-2026-001',
              referenceNumber: 'SO-2026-001',
              counterpartyName: 'Apex Health Systems',
              currentStage: 'SHIPPED',
              status: 'IN_PROGRESS',
              totalAmount: 142500,
              currency: 'USD',
              createdAt: new Date(Date.now() - 4 * 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 3600000).toISOString(),
              sla: {
                targetCompletionDate: new Date(Date.now() + 2 * 86400000).toISOString(),
                isBreached: false,
                totalDurationHours: 96,
              },
              stages: [
                { id: 'ORDER_CREATED', name: 'Order Created', label: 'Customer Order Received & Validated', status: 'COMPLETED', completedAt: new Date(Date.now() - 4 * 86400000).toISOString(), actor: 'Order Desk' },
                { id: 'INVENTORY_ALLOCATED', name: 'Inventory Allocated', label: 'Stock Reserved at Fulfillment Center', status: 'COMPLETED', completedAt: new Date(Date.now() - 3 * 86400000).toISOString(), actor: 'WMS Service' },
                { id: 'PICKED_PACKED', name: 'Picked & Packed', label: 'Warehouse Pick-Pack Completed', status: 'COMPLETED', completedAt: new Date(Date.now() - 2 * 86400000).toISOString(), actor: 'Whs Team A' },
                { id: 'SHIPPED', name: 'Shipped', label: 'Carrier Dispatched with Waybill', status: 'ACTIVE', startedAt: new Date(Date.now() - 1 * 86400000).toISOString(), actor: 'FedEx Freight' },
                { id: 'DELIVERED', name: 'Delivered', label: 'Proof of Delivery Confirmed', status: 'PENDING' },
                { id: 'INVOICED', name: 'Invoiced', label: 'Customer Invoice Generated & Sent', status: 'PENDING' },
                { id: 'PAYMENT_RECEIVED', name: 'Payment Received', label: 'Funds Reconciled in AR Ledger', status: 'PENDING' },
              ],
              exceptions: [],
              linkedDocuments: [
                { documentType: 'SALES_ORDER', documentId: 'SO-2026-001', reference: 'SO-2026-001', date: new Date(Date.now() - 4 * 86400000).toISOString(), status: 'CONFIRMED' },
                { documentType: 'PICK_TICKET', documentId: 'PK-9912', reference: 'PK-9912', date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'COMPLETED' },
                { documentType: 'WAYBILL', documentId: 'TRK-9812456', reference: 'TRK-9812456', date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'IN_TRANSIT' },
              ],
            },
            {
              id: 'flow-o2c-102',
              flowId: 'flow-o2c-102',
              tenantId,
              flowType: 'ORDER_TO_CASH',
              entityId: 'SO-2026-002',
              referenceNumber: 'SO-2026-002',
              counterpartyName: 'BioPharm Solutions Global',
              currentStage: 'PICKED_PACKED',
              status: 'EXCEPTION',
              totalAmount: 88700,
              currency: 'USD',
              createdAt: new Date(Date.now() - 6 * 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
              sla: {
                targetCompletionDate: new Date(Date.now() - 1 * 86400000).toISOString(),
                isBreached: true,
                totalDurationHours: 144,
              },
              stages: [
                { id: 'ORDER_CREATED', name: 'Order Created', label: 'Customer Order Received & Validated', status: 'COMPLETED', completedAt: new Date(Date.now() - 6 * 86400000).toISOString(), actor: 'Web Portal' },
                { id: 'INVENTORY_ALLOCATED', name: 'Inventory Allocated', label: 'Stock Reserved at Fulfillment Center', status: 'COMPLETED', completedAt: new Date(Date.now() - 5 * 86400000).toISOString(), actor: 'WMS' },
                { id: 'PICKED_PACKED', name: 'Picked & Packed', label: 'Warehouse Pick-Pack Completed', status: 'ACTIVE', startedAt: new Date(Date.now() - 3 * 86400000).toISOString(), actor: 'Pack Lead', variance: { delayHours: 48, reason: 'Special cold chain thermal packaging delay' } },
                { id: 'SHIPPED', name: 'Shipped', label: 'Carrier Dispatched with Waybill', status: 'PENDING' },
                { id: 'DELIVERED', name: 'Delivered', label: 'Proof of Delivery Confirmed', status: 'PENDING' },
                { id: 'INVOICED', name: 'Invoiced', label: 'Customer Invoice Generated & Sent', status: 'PENDING' },
                { id: 'PAYMENT_RECEIVED', name: 'Payment Received', label: 'Funds Reconciled in AR Ledger', status: 'PENDING' },
              ],
              exceptions: [
                {
                  id: 'exc-o2c-001',
                  stage: 'PICKED_PACKED',
                  severity: 'HIGH',
                  type: 'SLA_BREACH',
                  title: 'Cold Chain Packaging Delay SLA Breach',
                  description: 'Packaging hold exceeded 24hr threshold waiting for dry ice replenishment.',
                  detectedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
                  resolved: false,
                },
              ],
              linkedDocuments: [
                { documentType: 'SALES_ORDER', documentId: 'SO-2026-002', reference: 'SO-2026-002', date: new Date(Date.now() - 6 * 86400000).toISOString(), status: 'CONFIRMED' },
              ],
            },
            {
              id: 'flow-p2p-201',
              flowId: 'flow-p2p-201',
              tenantId,
              flowType: 'PROCURE_TO_PAY',
              entityId: 'PO-2026-801',
              referenceNumber: 'PO-2026-801',
              counterpartyName: 'Precision Biosystems Corp',
              currentStage: 'THREE_WAY_MATCHED',
              status: 'IN_PROGRESS',
              totalAmount: 230000,
              currency: 'USD',
              createdAt: new Date(Date.now() - 8 * 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 5 * 3600000).toISOString(),
              sla: {
                targetCompletionDate: new Date(Date.now() + 5 * 86400000).toISOString(),
                isBreached: false,
                totalDurationHours: 192,
              },
              stages: [
                { id: 'PO_DRAFT', name: 'PO Draft', label: 'Purchase Requisition Created', status: 'COMPLETED', completedAt: new Date(Date.now() - 8 * 86400000).toISOString(), actor: 'Procurement Spec' },
                { id: 'PO_APPROVED', name: 'PO Approved', label: 'Authorized by Procurement Committee', status: 'COMPLETED', completedAt: new Date(Date.now() - 7 * 86400000).toISOString(), actor: 'VP Supply Chain' },
                { id: 'SUPPLIER_ACKNOWLEDGED', name: 'Supplier Acknowledged', label: 'Supplier Accepted Delivery Schedule', status: 'COMPLETED', completedAt: new Date(Date.now() - 6 * 86400000).toISOString(), actor: 'Supplier EDI' },
                { id: 'IN_TRANSIT', name: 'In Transit', label: 'Inbound Freight Dispatched', status: 'COMPLETED', completedAt: new Date(Date.now() - 4 * 86400000).toISOString(), actor: 'DHL Global' },
                { id: 'GRN_RECEIVED', name: 'GRN Received', label: 'Dock Receiving & Quality Inspection', status: 'COMPLETED', completedAt: new Date(Date.now() - 2 * 86400000).toISOString(), actor: 'QA Receiving Lead', documentId: 'GRN-2026-081', documentType: 'GOODS_RECEIPT_NOTE' },
                { id: 'THREE_WAY_MATCHED', name: '3-Way Matched', label: 'PO, GRN & Invoice Reconciled', status: 'ACTIVE', startedAt: new Date(Date.now() - 1 * 86400000).toISOString(), actor: 'Matching Engine' },
                { id: 'PAYMENT_SCHEDULED', name: 'Payment Scheduled', label: 'AP Payment Queued in Treasury', status: 'PENDING' },
                { id: 'PAID', name: 'Paid', label: 'Disbursement Executed to Supplier', status: 'PENDING' },
              ],
              exceptions: [],
              linkedDocuments: [
                { documentType: 'PURCHASE_ORDER', documentId: 'PO-2026-801', reference: 'PO-2026-801', date: new Date(Date.now() - 8 * 86400000).toISOString(), status: 'APPROVED' },
                { documentType: 'GOODS_RECEIPT_NOTE', documentId: 'GRN-2026-081', reference: 'GRN-2026-081', date: new Date(Date.now() - 2 * 86400000).toISOString(), status: 'ACCEPTED' },
                { documentType: 'SUPPLIER_INVOICE', documentId: 'INV-SUP-9011', reference: 'INV-SUP-9011', date: new Date(Date.now() - 1 * 86400000).toISOString(), status: 'PENDING_MATCH' },
              ],
            },
            {
              id: 'flow-p2p-202',
              flowId: 'flow-p2p-202',
              tenantId,
              flowType: 'PROCURE_TO_PAY',
              entityId: 'PO-2026-802',
              referenceNumber: 'PO-2026-802',
              counterpartyName: 'Novartis Advanced Chem',
              currentStage: 'GRN_RECEIVED',
              status: 'EXCEPTION',
              totalAmount: 115000,
              currency: 'USD',
              createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
              updatedAt: new Date(Date.now() - 1 * 3600000).toISOString(),
              sla: {
                targetCompletionDate: new Date(Date.now() + 1 * 86400000).toISOString(),
                isBreached: false,
              },
              stages: [
                { id: 'PO_DRAFT', name: 'PO Draft', label: 'Purchase Requisition Created', status: 'COMPLETED', completedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
                { id: 'PO_APPROVED', name: 'PO Approved', label: 'Authorized by Procurement Committee', status: 'COMPLETED', completedAt: new Date(Date.now() - 4 * 86400000).toISOString() },
                { id: 'SUPPLIER_ACKNOWLEDGED', name: 'Supplier Acknowledged', label: 'Supplier Accepted Delivery Schedule', status: 'COMPLETED', completedAt: new Date(Date.now() - 3 * 86400000).toISOString() },
                { id: 'IN_TRANSIT', name: 'In Transit', label: 'Inbound Freight Dispatched', status: 'COMPLETED', completedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
                { id: 'GRN_RECEIVED', name: 'GRN Received', label: 'Dock Receiving & Quality Inspection', status: 'ACTIVE', startedAt: new Date(Date.now() - 1 * 86400000).toISOString(), variance: { quantity: -15, reason: 'Partial delivery: 85 of 100 received' } },
                { id: 'THREE_WAY_MATCHED', name: '3-Way Matched', label: 'PO, GRN & Invoice Reconciled', status: 'PENDING' },
                { id: 'PAYMENT_SCHEDULED', name: 'Payment Scheduled', label: 'AP Payment Queued in Treasury', status: 'PENDING' },
                { id: 'PAID', name: 'Paid', label: 'Disbursement Executed to Supplier', status: 'PENDING' },
              ],
              exceptions: [
                {
                  id: 'exc-p2p-002',
                  stage: 'GRN_RECEIVED',
                  severity: 'CRITICAL',
                  type: 'QUANTITY_VARIANCE',
                  title: 'Receiving Quantity Shortage',
                  description: 'Received 85 units out of 100 ordered on Line 1. Remaining 15 backordered.',
                  detectedAt: new Date(Date.now() - 12 * 3600000).toISOString(),
                  resolved: false,
                },
              ],
              linkedDocuments: [
                { documentType: 'PURCHASE_ORDER', documentId: 'PO-2026-802', reference: 'PO-2026-802', date: new Date(Date.now() - 5 * 86400000).toISOString() },
                { documentType: 'GOODS_RECEIPT_NOTE', documentId: 'GRN-2026-082', reference: 'GRN-2026-082', date: new Date(Date.now() - 1 * 86400000).toISOString() },
              ],
            },
          ];

          for (const flow of demoFlows) {
            await this.persistence.saveRecord('flow_tracking_records', flow.id, flow);
            this.memoryCache.set(`${tenantId}:${flow.id}`, flow);
          }
        }
        this.initializedTenants.add(tenantId);
      } catch (err) {
        console.warn(`[FLOW-TRACKER] Initialization notice for ${tenantId}:`, err);
        this.initializedTenants.add(tenantId);
      } finally {
        this.initializationPromises.delete(tenantId);
      }
    })();

    this.initializationPromises.set(tenantId, promise);
    return promise;
  }

  public async listFlows(tenantId: string, filter?: FlowFilterCriteria): Promise<FlowTrackingRecord[]> {
    await this.initializeSeedIfEmpty(tenantId);
    const records = await this.persistence.listRecords<FlowTrackingRecord>('flow_tracking_records', tenantId);
    
    // Update local cache
    for (const r of records) {
      this.memoryCache.set(`${tenantId}:${r.id}`, r);
    }

    if (!filter) return records;

    return records.filter(flow => {
      if (filter.flowType && filter.flowType !== 'ALL' && flow.flowType !== filter.flowType) {
        return false;
      }
      if (filter.status && filter.status !== 'ALL' && flow.status !== filter.status) {
        return false;
      }
      if (filter.hasExceptions && (!flow.exceptions || flow.exceptions.filter(e => !e.resolved).length === 0)) {
        return false;
      }
      if (filter.searchTerm) {
        const term = filter.searchTerm.toLowerCase();
        const matchesRef = flow.referenceNumber.toLowerCase().includes(term);
        const matchesCounterparty = flow.counterpartyName.toLowerCase().includes(term);
        const matchesEntity = flow.entityId.toLowerCase().includes(term);
        const matchesDocs = flow.linkedDocuments.some(d => d.reference.toLowerCase().includes(term) || d.documentId.toLowerCase().includes(term));
        if (!matchesRef && !matchesCounterparty && !matchesEntity && !matchesDocs) {
          return false;
        }
      }
      return true;
    });
  }

  public async getFlow(tenantId: string, flowId: string): Promise<FlowTrackingRecord | null> {
    const cached = this.memoryCache.get(`${tenantId}:${flowId}`);
    if (cached) return cached;
    return await this.persistence.getRecord<FlowTrackingRecord>('flow_tracking_records', tenantId, flowId);
  }

  public async createFlow(
    recordData: Omit<FlowTrackingRecord, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<FlowTrackingRecord> {
    const flowId = recordData.flowId || `flow-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const stagesTemplate = recordData.flowType === 'ORDER_TO_CASH' ? O2C_STAGES_TEMPLATE : P2P_STAGES_TEMPLATE;
    const stages: FlowStage[] = recordData.stages && recordData.stages.length > 0
      ? recordData.stages
      : stagesTemplate.map((s, idx) => ({
          id: s.id,
          name: s.name,
          label: s.label,
          status: idx === 0 ? 'ACTIVE' : 'PENDING',
          startedAt: idx === 0 ? now : undefined,
        }));

    const record: FlowTrackingRecord = {
      ...recordData,
      id: flowId,
      flowId,
      stages,
      exceptions: recordData.exceptions || [],
      linkedDocuments: recordData.linkedDocuments || [],
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.persistence.saveRecord('flow_tracking_records', flowId, record);
    this.memoryCache.set(`${record.tenantId}:${flowId}`, saved);
    return saved;
  }

  public async advanceFlowStage(
    tenantId: string,
    flowId: string,
    stageId: string,
    actor: string,
    notes?: string,
    document?: LinkedFlowDocument
  ): Promise<FlowTrackingRecord> {
    const flow = await this.getFlow(tenantId, flowId);
    if (!flow) throw new Error(`Flow ${flowId} not found`);

    const now = new Date().toISOString();
    let stageFound = false;

    const updatedStages = flow.stages.map((stage) => {
      if (stage.id === stageId) {
        stageFound = true;
        return {
          ...stage,
          status: 'COMPLETED' as FlowStageStatus,
          completedAt: now,
          actor: actor || stage.actor,
          notes: notes || stage.notes,
          documentId: document?.documentId || stage.documentId,
          documentType: document?.documentType || stage.documentType,
        };
      }
      return stage;
    });

    if (!stageFound) {
      throw new Error(`Stage ${stageId} does not exist in flow ${flowId}`);
    }

    // Find next stage to activate
    const currentIdx = updatedStages.findIndex(s => s.id === stageId);
    let nextStageId = stageId;
    if (currentIdx >= 0 && currentIdx < updatedStages.length - 1) {
      const nextStage = updatedStages[currentIdx + 1];
      if (nextStage.status === 'PENDING') {
        nextStage.status = 'ACTIVE';
        nextStage.startedAt = now;
      }
      nextStageId = nextStage.id;
    }

    const allCompleted = updatedStages.every(s => s.status === 'COMPLETED');

    const updatedDocs = [...flow.linkedDocuments];
    if (document && !updatedDocs.some(d => d.documentId === document.documentId)) {
      updatedDocs.push(document);
    }

    const updatedFlow: FlowTrackingRecord = {
      ...flow,
      currentStage: allCompleted ? stageId : nextStageId,
      status: allCompleted ? 'COMPLETED' : flow.status === 'EXCEPTION' ? 'EXCEPTION' : 'IN_PROGRESS',
      stages: updatedStages,
      linkedDocuments: updatedDocs,
      updatedAt: now,
    };

    const saved = await this.persistence.saveRecord('flow_tracking_records', flowId, updatedFlow);
    this.memoryCache.set(`${tenantId}:${flowId}`, saved);
    return saved;
  }

  public async recordException(
    tenantId: string,
    flowId: string,
    exceptionData: Omit<FlowException, 'id' | 'detectedAt' | 'resolved'>
  ): Promise<FlowTrackingRecord> {
    const flow = await this.getFlow(tenantId, flowId);
    if (!flow) throw new Error(`Flow ${flowId} not found`);

    const excId = `exc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newExc: FlowException = {
      ...exceptionData,
      id: excId,
      detectedAt: new Date().toISOString(),
      resolved: false,
    };

    const updatedExceptions = [...flow.exceptions, newExc];
    const updatedFlow: FlowTrackingRecord = {
      ...flow,
      status: 'EXCEPTION',
      exceptions: updatedExceptions,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.persistence.saveRecord('flow_tracking_records', flowId, updatedFlow);
    this.memoryCache.set(`${tenantId}:${flowId}`, saved);
    return saved;
  }

  public async resolveException(
    tenantId: string,
    flowId: string,
    exceptionId: string,
    resolvedBy: string,
    resolutionNotes: string
  ): Promise<FlowTrackingRecord> {
    const flow = await this.getFlow(tenantId, flowId);
    if (!flow) throw new Error(`Flow ${flowId} not found`);

    const now = new Date().toISOString();
    const updatedExceptions = flow.exceptions.map(exc => {
      if (exc.id === exceptionId) {
        return {
          ...exc,
          resolved: true,
          resolvedAt: now,
          resolvedBy,
          resolutionNotes,
        };
      }
      return exc;
    });

    const hasActiveExceptions = updatedExceptions.some(e => !e.resolved);

    const updatedFlow: FlowTrackingRecord = {
      ...flow,
      status: hasActiveExceptions ? 'EXCEPTION' : 'IN_PROGRESS',
      exceptions: updatedExceptions,
      updatedAt: now,
    };

    const saved = await this.persistence.saveRecord('flow_tracking_records', flowId, updatedFlow);
    this.memoryCache.set(`${tenantId}:${flowId}`, saved);
    return saved;
  }

  public async updateFlowStatus(
    tenantId: string,
    flowId: string,
    status: FlowStatus
  ): Promise<FlowTrackingRecord> {
    const flow = await this.getFlow(tenantId, flowId);
    if (!flow) throw new Error(`Flow ${flowId} not found`);

    const updated: FlowTrackingRecord = {
      ...flow,
      status,
      updatedAt: new Date().toISOString(),
    };

    const saved = await this.persistence.saveRecord('flow_tracking_records', flowId, updated);
    this.memoryCache.set(`${tenantId}:${flowId}`, saved);
    return saved;
  }
}
