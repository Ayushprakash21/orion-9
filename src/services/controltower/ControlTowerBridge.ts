/**
 * ORION-9 SCM CONTROL TOWER — REAL-TIME EVENT BRIDGE & SLA MONITOR
 * Subscribes to Kernel EventBus and SCM Event Fabric to stream operational events
 * into EventIntelligenceEngine, SignalEngine, ExceptionEngine, and SLA monitors.
 */

import { kernelEventBus } from '../../kernel/EventBus';
import { EventEnvelope } from '../../kernel/types';
import { eventIntelligenceEngine } from '../../intelligence/EventIntelligenceEngine';
import { signalEngine } from '../../intelligence/SignalEngine';
import { exceptionEngine } from '../../intelligence/ExceptionEngine';
import { Signal, ExceptionIntelligence } from '../../intelligence/types';
import { SlaMonitorRecord, SlaStatus, ControlTowerDomain } from './types';
import { ScmPersistenceService } from '../scm/ScmPersistenceService';

export class ControlTowerBridge {
  private static instance: ControlTowerBridge;
  private persistence: ScmPersistenceService;
  private activeSubscriptions: boolean = false;
  private monitoredSlas: Map<string, SlaMonitorRecord[]> = new Map();

  private constructor() {
    this.persistence = ScmPersistenceService.getInstance();
    this.initSlaDefinitions();
    this.subscribeToKernelEvents();
  }

  public static getInstance(): ControlTowerBridge {
    if (!ControlTowerBridge.instance) {
      ControlTowerBridge.instance = new ControlTowerBridge();
    }
    return ControlTowerBridge.instance;
  }

  private initSlaDefinitions(): void {
    // Initial standard enterprise SLA templates
  }

  /**
   * Subscribe to KernelEventBus for real-time SCM event forwarding
   */
  public subscribeToKernelEvents(): void {
    if (this.activeSubscriptions) return;
    this.activeSubscriptions = true;

    kernelEventBus.subscribe('*', async (event: EventEnvelope) => {
      await this.handleIncomingEvent(event);
    });
  }

  /**
   * Normalize and forward incoming SCM events into the intelligence pipeline.
   */
  public async handleIncomingEvent(event: EventEnvelope): Promise<{
    correlatedSignals: Signal[];
    generatedExceptions: ExceptionIntelligence[];
  }> {
    const tenantId = event.tenant?.organizationId || 'org-global';

    // 1. Ingest into EventIntelligenceEngine for lineage & deduplication
    const ingested = await eventIntelligenceEngine.ingestEvent(event);

    const correlatedSignals: Signal[] = [];

    // 2. Identify if event triggers specific deterministic signals
    const targetType = (event.entityType || event.aggregateType || '').toUpperCase();
    const targetId = event.entityId || event.aggregateId || event.payload?.shipmentId || event.payload?.poId || 'ENTITY-UNKNOWN';

    if (event.eventType.includes('DELAY') || event.eventType.includes('EXCEPTION') || event.eventType.includes('BREACH')) {
      const detected = await signalEngine.scanSignals({
        tenantId,
        shipments: (targetType === 'SHIPMENT' || event.eventType.includes('SHIPMENT')) ? [{
          id: targetId,
          status: 'Delayed',
          delayDays: event.payload?.delayDays || 3,
          estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
        }] : undefined,
        purchaseOrders: (targetType === 'PURCHASE_ORDER' || event.eventType.includes('PO')) ? [{
          id: targetId,
          supplierId: event.payload?.supplierId || 'SUP-01',
          status: 'Overdue',
          expectedDelivery: new Date(Date.now() - 86400000).toISOString(),
          lines: [],
        }] : undefined,
      });
      correlatedSignals.push(...detected);
    }

    // 3. Evaluate signals through ExceptionEngine
    let generatedExceptions: ExceptionIntelligence[] = [];
    if (correlatedSignals.length > 0) {
      generatedExceptions = await exceptionEngine.evaluateSignals(tenantId, correlatedSignals);
    }

    return {
      correlatedSignals,
      generatedExceptions,
    };
  }

  /**
   * Evaluate all active operational SLAs for a tenant.
   * Emits SLA_BREACH signals if deadlines are exceeded.
   */
  public async evaluateOperationalSlas(tenantId: string): Promise<SlaMonitorRecord[]> {
    const now = Date.now();
    const slas: SlaMonitorRecord[] = [];

    // 1. PO Confirmation SLA (Target: within 48h of order creation)
    const pos = await this.persistence.listRecords<any>('purchase_orders', tenantId);
    const unconfirmedPOs = pos.filter((p) => p.status === 'RELEASED' || p.status === 'SUBMITTED' || p.status === 'PENDING');
    const breachedPOIds: string[] = [];

    for (const po of unconfirmedPOs) {
      const createdTime = new Date(po.createdAt || po.orderDate || now).getTime();
      const elapsedMinutes = (now - createdTime) / (1000 * 60);
      if (elapsedMinutes > 48 * 60) {
        breachedPOIds.push(po.id);
      }
    }

    slas.push({
      slaId: `sla-po-conf-${tenantId}`,
      tenantId,
      name: 'Supplier PO Confirmation SLA (48h)',
      domain: 'procurement',
      entityType: 'PURCHASE_ORDER',
      targetDurationMinutes: 48 * 60,
      warningThresholdMinutes: 36 * 60,
      activeBreachCount: breachedPOIds.length,
      evaluatedCount: pos.length,
      status: breachedPOIds.length === 0 ? 'COMPLIANT' : 'BREACHED',
      lastEvaluatedAt: new Date().toISOString(),
      breachedEntityIds: breachedPOIds,
    });

    // 2. In-Transit Shipment Delivery SLA
    const shipments = await this.persistence.listRecords<any>('shipments', tenantId);
    const delayedShipments = shipments.filter((s) => (s.delayDays && s.delayDays > 0) || s.status === 'Delayed');
    const delayedIds = delayedShipments.map((s) => s.id);

    slas.push({
      slaId: `sla-transit-${tenantId}`,
      tenantId,
      name: 'In-Transit Freight ETA Adherence SLA',
      domain: 'logistics',
      entityType: 'SHIPMENT',
      targetDurationMinutes: 72 * 60,
      warningThresholdMinutes: 48 * 60,
      activeBreachCount: delayedIds.length,
      evaluatedCount: shipments.length,
      status: delayedIds.length === 0 ? 'COMPLIANT' : 'BREACHED',
      lastEvaluatedAt: new Date().toISOString(),
      breachedEntityIds: delayedIds,
    });

    // 3. Yard Gate-to-GRN Inbound Receiving SLA (Target: 4 hours)
    const gateEntries = await this.persistence.listRecords<any>('gate_entries', tenantId);
    const unreceivedGates = gateEntries.filter((g) => g.status === 'CHECKED_IN' || g.status === 'DOCK_ASSIGNED');
    const breachedGateIds: string[] = [];

    for (const g of unreceivedGates) {
      const entryTime = new Date(g.checkInTime || g.createdAt || now).getTime();
      const elapsedMinutes = (now - entryTime) / (1000 * 60);
      if (elapsedMinutes > 4 * 60) {
        breachedGateIds.push(g.id);
      }
    }

    slas.push({
      slaId: `sla-gate-grn-${tenantId}`,
      tenantId,
      name: 'Dock Unloading & GRN Receipt SLA (4h)',
      domain: 'warehouses',
      entityType: 'GATE_ENTRY',
      targetDurationMinutes: 4 * 60,
      warningThresholdMinutes: 3 * 60,
      activeBreachCount: breachedGateIds.length,
      evaluatedCount: gateEntries.length,
      status: breachedGateIds.length === 0 ? 'COMPLIANT' : 'BREACHED',
      lastEvaluatedAt: new Date().toISOString(),
      breachedEntityIds: breachedGateIds,
    });

    // Store in cache
    this.monitoredSlas.set(tenantId, slas);

    // If there are breached POs or Shipments, trigger deterministic SLA breach signals
    if (breachedPOIds.length > 0 || delayedIds.length > 0) {
      const signals = await signalEngine.scanSignals({
        tenantId,
        purchaseOrders: breachedPOIds.map((id) => ({
          id,
          supplierId: 'SUP-AUTO-SLA',
          status: 'Delayed',
          expectedDelivery: new Date().toISOString(),
          lines: [],
        })),
        shipments: delayedShipments.map((s) => ({
          id: s.id,
          status: 'Delayed',
          delayDays: s.delayDays || 3,
          estimatedArrival: s.estimatedArrival || new Date().toISOString(),
        })),
      });

      if (signals.length > 0) {
        await exceptionEngine.evaluateSignals(tenantId, signals);
      }
    }

    return slas;
  }

  public getCachedSlas(tenantId: string): SlaMonitorRecord[] {
    return this.monitoredSlas.get(tenantId) || [];
  }

  public reset(): void {
    this.monitoredSlas.clear();
  }
}

export const controlTowerBridge = ControlTowerBridge.getInstance();
