/**
 * ORION-9 LAST-MILE DELIVERY & PROOF OF DELIVERY (POD) ENGINE
 *
 * Captures recipient signatures, geo-coordinates, timestamped PODs,
 * clean/damaged deliveries, and links shipments directly to billing/AR.
 */

import { DeliveryPodRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';

export class DeliveryPodEngine {
  private static instance: DeliveryPodEngine;
  private pods: Map<string, DeliveryPodRecord[]> = new Map();

  public static getInstance(): DeliveryPodEngine {
    if (!DeliveryPodEngine.instance) {
      DeliveryPodEngine.instance = new DeliveryPodEngine();
    }
    return DeliveryPodEngine.instance;
  }

  public recordProofOfDelivery(params: Omit<DeliveryPodRecord, 'podId' | 'deliveredAt'>): DeliveryPodRecord {
    const record: DeliveryPodRecord = {
      ...params,
      podId: `POD-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      deliveredAt: new Date().toISOString()
    };

    const list = this.pods.get(params.tenantId) || [];
    list.unshift(record);
    this.pods.set(params.tenantId, list);

    // Durable persistence with transactional outbox event
    scmPersistenceService.saveRecord('delivery_pods', record.podId, record, {
      emitEvent: true,
      eventType: 'scm.pod.captured',
      partitionKey: `${params.tenantId}:${record.podId}`,
      idempotencyKey: `pod-${params.tenantId}-${record.podId}`
    }).catch((err) => {
      console.warn('[POD-ENGINE] Async persistence failed:', err);
    });

    eventBus.emit({
      eventId: `EVT-POD-${Date.now()}`,
      eventType: 'POD_CAPTURED',
      tenantId: params.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'CARRIER_GATEWAY', role: 'system' }
    });

    return record;
  }

  /**
   * Reconstruct authoritative state from storage for a fresh instance.
   */
  public async hydrateFromStorage(tenantId: string): Promise<DeliveryPodRecord[]> {
    const stored = await scmPersistenceService.listRecords<DeliveryPodRecord>('delivery_pods', tenantId);
    if (stored.length > 0) {
      this.pods.set(tenantId, stored);
      return stored;
    }
    return this.pods.get(tenantId) || [];
  }

  public getPods(tenantId: string): DeliveryPodRecord[] {
    const current = this.pods.get(tenantId);
    if (current && current.length > 0) {
      return current;
    }
    const cached = scmPersistenceService.listCachedRecords<DeliveryPodRecord>('delivery_pods', tenantId);
    if (cached.length > 0) {
      this.pods.set(tenantId, cached);
      return cached;
    }
    return [];
  }

  public clear(): void {
    this.pods.clear();
  }
}

export const deliveryPodEngine = DeliveryPodEngine.getInstance();
