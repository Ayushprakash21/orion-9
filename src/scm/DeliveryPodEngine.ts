/**
 * ORION-9 LAST-MILE DELIVERY & PROOF OF DELIVERY (POD) ENGINE
 *
 * Captures recipient signatures, geo-coordinates, timestamped PODs,
 * clean/damaged deliveries, and links shipments directly to billing/AR.
 */

import { DeliveryPodRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

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

  public getPods(tenantId: string): DeliveryPodRecord[] {
    return this.pods.get(tenantId) || [];
  }
}

export const deliveryPodEngine = DeliveryPodEngine.getInstance();
