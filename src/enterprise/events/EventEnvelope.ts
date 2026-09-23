/**
 * ORION-9 WAVE 11: DISTRIBUTED EVENT FABRIC — CANONICAL EVENT ENVELOPE
 * High-throughput, distributed event message contract.
 * Guarantees traceability, idempotency, causality, and region-affinity.
 */

export interface DistributedEventEnvelope<T = any> {
  eventId: string;
  tenantId: string;
  regionId: string;
  eventType: string;
  correlationId: string;
  causationId?: string;
  producer: string;
  occurredAt: string;
  sequence?: number;
  idempotencyKey: string;
  partitionKey: string;
  schemaVersion: string;
  payload: T;
  payloadReference?: string; // Optional reference for large blob offloading
  headers?: Record<string, string>;
  traceContext?: {
    traceId: string;
    spanId: string;
    sampled: boolean;
  };
}

export function createDistributedEventEnvelope<T>(params: {
  tenantId: string;
  regionId?: string;
  eventType: string;
  correlationId?: string;
  causationId?: string;
  producer: string;
  partitionKey: string;
  payload: T;
  schemaVersion?: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}): DistributedEventEnvelope<T> {
  const eventId = `evt-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const correlationId = params.correlationId || `corr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const idempotencyKey = params.idempotencyKey || `${params.tenantId}:${params.eventType}:${params.partitionKey}:${eventId}`;

  return {
    eventId,
    tenantId: params.tenantId,
    regionId: params.regionId || 'reg-us-east',
    eventType: params.eventType,
    correlationId,
    causationId: params.causationId,
    producer: params.producer,
    occurredAt: new Date().toISOString(),
    idempotencyKey,
    partitionKey: params.partitionKey,
    schemaVersion: params.schemaVersion || '1.0.0',
    payload: params.payload,
    headers: params.headers || {}
  };
}
