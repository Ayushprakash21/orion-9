/**
 * ORION-9 WAVE 6 — EVENT INTELLIGENCE & CORRELATION ENGINE
 *
 * Layer between Kernel Event Fabric and Control Tower Intelligence.
 * Subscribes to KernelEventBus to perform:
 * - Real-time stream normalization
 * - Correlation & causation graph linking across SCM documents (PO -> Conf -> ASN -> Shp -> GRN -> Inv)
 * - Event deduplication & replay-safe idempotency tracking
 * - Autonomous signal generation upon SLA/deadline breaches
 */

import { EventEnvelope } from '../kernel/types';
import { kernelEventBus } from '../kernel/EventBus';
import { signalEngine } from './SignalEngine';
import { Signal } from './types';

export interface EventLineageNode {
  eventId: string;
  eventType: string;
  entityType: string;
  entityId: string;
  tenantId: string;
  timestamp: string;
  correlationId: string;
  originSystem?: string;
  causationId?: string;
  parentEntity?: { entityType: string; entityId: string };
  childEntities: Array<{ entityType: string; entityId: string }>;
}

export class EventIntelligenceEngine {
  private static instance: EventIntelligenceEngine;
  private processedEvents: Set<string> = new Set();
  private correlationChains: Map<string, EventEnvelope[]> = new Map();
  private entityLineage: Map<string, EventLineageNode> = new Map();

  private constructor() {
    this.subscribeToKernelEvents();
  }

  public static getInstance(): EventIntelligenceEngine {
    if (!EventIntelligenceEngine.instance) {
      EventIntelligenceEngine.instance = new EventIntelligenceEngine();
    }
    return EventIntelligenceEngine.instance;
  }

  private subscribeToKernelEvents(): void {
    kernelEventBus.subscribe('*', async (event: EventEnvelope) => {
      await this.processEvent(event);
    });
  }

  public async ingestEvent(event: EventEnvelope): Promise<any> {
    const res = await this.processEvent(event);
    return {
      eventId: event.eventId,
      eventType: event.eventType,
      tenantId: event.tenant?.organizationId || 'org-global',
      lineage: res.lineageNode || { originSystem: 'ORION_KERNEL' },
      ...res,
    };
  }

  public correlateEvents(tenantId: string, correlationId: string): EventEnvelope[] {
    const chain = this.getCorrelationChain(correlationId);
    if (chain.length > 0) return chain;
    const all: EventEnvelope[] = [];
    for (const [key, evts] of this.correlationChains.entries()) {
      for (const e of evts) {
        if ((e as any).aggregateId === correlationId || (e as any).aggregate?.aggregateId === correlationId || e.payload?.poId === correlationId || key === correlationId) {
          all.push(e);
        }
      }
    }
    return all;
  }

  /**
   * Process and correlate an incoming Kernel event
   */
  public async processEvent(event: EventEnvelope): Promise<{
    isDuplicate: boolean;
    correlatedSignals: Signal[];
    lineageNode?: EventLineageNode;
  }> {
    // Deduplication check
    if (this.processedEvents.has(event.eventId)) {
      return { isDuplicate: true, correlatedSignals: [] };
    }
    this.processedEvents.add(event.eventId);

    const tenantId = event.tenant?.organizationId || 'org-global';
    const correlationId = event.correlationId || event.eventId;

    // Track in correlation chain
    if (!this.correlationChains.has(correlationId)) {
      this.correlationChains.set(correlationId, []);
    }
    this.correlationChains.get(correlationId)!.push(event);

    // Build Lineage Node
    const lineageKey = `${tenantId}:${event.entityType || 'UNKNOWN'}:${event.entityId || event.eventId}`;
    const lineageNode: EventLineageNode = {
      eventId: event.eventId,
      eventType: event.eventType,
      entityType: event.entityType || 'UNKNOWN',
      entityId: event.entityId || event.eventId,
      tenantId,
      timestamp: event.timestamp,
      correlationId,
      originSystem: (event as any).metadata?.originSystem || 'ORION_KERNEL',
      causationId: event.causationId,
      childEntities: [],
    };

    // Link parent-child entity dependencies based on SCM domain events
    if (event.payload) {
      const p = event.payload;
      if (p.poId && event.entityType === 'SHIPMENT') {
        lineageNode.parentEntity = { entityType: 'PURCHASE_ORDER', entityId: p.poId };
      } else if (p.poId && event.entityType === 'ASN') {
        lineageNode.parentEntity = { entityType: 'PURCHASE_ORDER', entityId: p.poId };
      } else if (p.asnId && event.entityType === 'RECEIPT') {
        lineageNode.parentEntity = { entityType: 'ASN', entityId: p.asnId };
      } else if (p.receiptId && event.entityType === 'GRN') {
        lineageNode.parentEntity = { entityType: 'RECEIPT', entityId: p.receiptId };
      } else if (p.grnId && event.entityType === 'QUALITY_INSPECTION') {
        lineageNode.parentEntity = { entityType: 'GRN', entityId: p.grnId };
      } else if (p.poId && event.entityType === 'INVOICE') {
        lineageNode.parentEntity = { entityType: 'PURCHASE_ORDER', entityId: p.poId };
      }
    }

    this.entityLineage.set(lineageKey, lineageNode);

    // Operational signal triggering based on event streams
    const correlatedSignals: Signal[] = [];

    // Check SLA / Failure Events
    if (event.eventType.includes('DELAYED') || event.eventType.includes('BREACH') || event.eventType.includes('EXCEPTION')) {
      const signals = await signalEngine.scan({
        tenantId,
        shipments: event.entityType === 'SHIPMENT' ? [{
          id: event.entityId || 'SHP-UNKNOWN',
          status: 'Delayed',
          delayDays: event.payload?.delayDays || 3,
          estimatedArrival: new Date(Date.now() + 86400000).toISOString(),
        }] : undefined,
        purchaseOrders: event.entityType === 'PURCHASE_ORDER' ? [{
          id: event.entityId || 'PO-UNKNOWN',
          supplierId: event.payload?.supplierId || 'SUP-01',
          status: 'Overdue',
          expectedDelivery: new Date(Date.now() - 86400000).toISOString(),
          lines: [],
        }] : undefined,
      });
      correlatedSignals.push(...signals);
    }

    return {
      isDuplicate: false,
      correlatedSignals,
      lineageNode,
    };
  }

  /**
   * Query chronological event correlation chain by correlationId
   */
  public getCorrelationChain(correlationId: string): EventEnvelope[] {
    return this.correlationChains.get(correlationId) || [];
  }

  /**
   * Query entity lineage graph node
   */
  public getLineage(tenantId: string, entityType: string, entityId: string): EventLineageNode | undefined {
    return this.entityLineage.get(`${tenantId}:${entityType}:${entityId}`);
  }

  public reset(): void {
    this.processedEvents.clear();
    this.correlationChains.clear();
    this.entityLineage.clear();
  }
}

export const eventIntelligenceEngine = EventIntelligenceEngine.getInstance();
