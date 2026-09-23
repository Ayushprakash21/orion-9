import { describe, it, expect, beforeEach } from 'vitest';
import { messageBroker } from '../../enterprise/events/MessageBroker';
import { createDistributedEventEnvelope } from '../../enterprise/events/EventEnvelope';
import { deadLetterQueueManager } from '../../enterprise/events/DeadLetterQueueManager';

describe('Wave 11: Distributed Event Fabric & Dead-Letter Queue', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    messageBroker.clear();
    deadLetterQueueManager.clear();
  });

  it('1. Publishes events to partitioned topics with deterministic partitioning and monotonic offsets', async () => {
    const env1 = createDistributedEventEnvelope({
      tenantId,
      eventType: 'order.created',
      producer: 'test-suite',
      partitionKey: 'CUST-ALPHA',
      payload: { orderId: 'ORD-001', amount: 100 }
    });

    const env2 = createDistributedEventEnvelope({
      tenantId,
      eventType: 'order.created',
      producer: 'test-suite',
      partitionKey: 'CUST-ALPHA',
      payload: { orderId: 'ORD-002', amount: 200 }
    });

    const res1 = await messageBroker.publish('enterprise.events.orders', env1);
    const res2 = await messageBroker.publish('enterprise.events.orders', env2);

    expect(res1.isDuplicate).toBe(false);
    expect(res2.isDuplicate).toBe(false);

    // Same partition key should yield same partition ID
    expect(res1.partition).toBe(res2.partition);
    // Offsets within partition should be monotonically increasing
    expect(res2.offset).toBe(res1.offset + 1);
  });

  it('2. Enforces idempotency and deduplication on repeated event submissions', async () => {
    const sharedIdempotencyKey = 'idemp-fixed-test-key-999';

    const env1 = createDistributedEventEnvelope({
      tenantId,
      eventType: 'inventory.allocated',
      producer: 'inventory-svc',
      partitionKey: 'SKU-TITANIUM',
      idempotencyKey: sharedIdempotencyKey,
      payload: { quantity: 50 }
    });

    const env2 = createDistributedEventEnvelope({
      tenantId,
      eventType: 'inventory.allocated',
      producer: 'inventory-svc',
      partitionKey: 'SKU-TITANIUM',
      idempotencyKey: sharedIdempotencyKey,
      payload: { quantity: 50 }
    });

    const first = await messageBroker.publish('enterprise.events.inventory', env1);
    const second = await messageBroker.publish('enterprise.events.inventory', env2);

    expect(first.isDuplicate).toBe(false);
    expect(second.isDuplicate).toBe(true);
    expect(second.offset).toBe(-1);
  });

  it('3. Tracks consumer group committed offsets and computes partition lag', async () => {
    const topic = 'enterprise.events.shipments';
    const envelopes = Array.from({ length: 5 }).map((_, i) => 
      createDistributedEventEnvelope({
        tenantId,
        eventType: 'shipment.updated',
        producer: 'carrier-feed',
        partitionKey: `TRACK-${i}`,
        payload: { trackNumber: `1Z999${i}` }
      })
    );

    await messageBroker.publishBatch(topic, envelopes);

    const lagMetricsBefore = messageBroker.getLagMetrics('shipment-indexer-group', topic);
    expect(lagMetricsBefore.length).toBeGreaterThan(0);

    // Commit partition 0 offset to simulate consumption
    messageBroker.commitOffset('shipment-indexer-group', topic, 0, 1);
    const committed = messageBroker.getCommittedOffset('shipment-indexer-group', topic, 0);
    expect(committed).toBe(1);
  });

  it('4. DeadLetterQueueManager calculates exponential backoff with jitter', () => {
    const b0 = deadLetterQueueManager.calculateBackoffMs(0);
    const b1 = deadLetterQueueManager.calculateBackoffMs(1);
    const b2 = deadLetterQueueManager.calculateBackoffMs(2);

    expect(b0).toBeGreaterThanOrEqual(1000);
    expect(b1).toBeGreaterThanOrEqual(2000);
    expect(b2).toBeGreaterThanOrEqual(4000);
  });

  it('5. Quarantines malformed messages and enables re-driving back to broker', async () => {
    const poisonedEnvelope = createDistributedEventEnvelope({
      tenantId,
      eventType: 'edi.bad.segment',
      producer: 'edi-gateway',
      partitionKey: 'PARTNER-BAD',
      payload: { broken: true }
    });

    const dlqRecord = await deadLetterQueueManager.quarantineMessage({
      tenantId,
      originalTopic: 'enterprise.events.edi.inbound',
      envelope: poisonedEnvelope,
      failureReason: 'Syntax exception in GS header',
      attemptCount: 3,
      maxAttempts: 3,
      isPoisonPill: true
    });

    expect(dlqRecord.status).toBe('QUARANTINED');
    expect(dlqRecord.isPoisonPill).toBe(true);

    const records = deadLetterQueueManager.listRecords(tenantId);
    expect(records.some(r => r.dlqId === dlqRecord.dlqId)).toBe(true);

    // Re-drive message
    const redriveRes = await deadLetterQueueManager.redriveMessage(dlqRecord.dlqId);
    expect(redriveRes.success).toBe(true);
    expect(redriveRes.redriveOffset).toBeGreaterThanOrEqual(0);

    const updated = deadLetterQueueManager.getRecord(dlqRecord.dlqId);
    expect(updated?.status).toBe('REDRIVEN');
  });
});
