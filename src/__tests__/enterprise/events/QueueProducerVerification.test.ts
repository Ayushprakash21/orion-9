import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueProducer, CloudflareQueueBinding } from '../../../enterprise/events/QueueProducer';
import { createDistributedEventEnvelope } from '../../../enterprise/events/EventEnvelope';

describe('ORION-9 QueueProducer Verification Suite', () => {
  let producer: QueueProducer;

  beforeEach(() => {
    producer = QueueProducer.getInstance();
  });

  it('validates canonical event envelope structure strictly', () => {
    const invalidEnvelope: any = {
      eventId: '',
      tenantId: 'tenant-1'
    };
    const validation = producer.validateEnvelope(invalidEnvelope);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
    expect(validation.errors).toContain('Missing or invalid eventId');
    expect(validation.errors).toContain('Missing or invalid eventType');
    expect(validation.errors).toContain('Missing or invalid partitionKey');
    expect(validation.errors).toContain('Missing or invalid idempotencyKey');
  });

  it('publishes valid envelope using queue.send() API', async () => {
    const mockQueue: CloudflareQueueBinding = {
      send: vi.fn().mockResolvedValue({}),
      sendBatch: vi.fn().mockResolvedValue({})
    };

    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant-enterprise',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant-enterprise:INV-001',
      producer: 'test-producer',
      idempotencyKey: 'idemp-inv-001',
      payload: { productId: 'PROD-A', delta: 10 }
    });

    const result = await producer.publish(mockQueue, envelope);

    expect(result.success).toBe(true);
    expect(result.deliveredDurable).toBe(true);
    expect(result.status).toBe('DELIVERED');
    expect(mockQueue.send).toHaveBeenCalledTimes(1);
    expect(mockQueue.send).toHaveBeenCalledWith(envelope, undefined);
  });

  it('publishes batch using queue.sendBatch() API', async () => {
    const mockQueue: CloudflareQueueBinding = {
      send: vi.fn().mockResolvedValue({}),
      sendBatch: vi.fn().mockResolvedValue({})
    };

    const envelope1 = createDistributedEventEnvelope({
      tenantId: 'tenant-enterprise',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant-enterprise:INV-001',
      producer: 'test-producer',
      idempotencyKey: 'idemp-batch-1',
      payload: { productId: 'PROD-A', delta: 5 }
    });

    const envelope2 = createDistributedEventEnvelope({
      tenantId: 'tenant-enterprise',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant-enterprise:INV-002',
      producer: 'test-producer',
      idempotencyKey: 'idemp-batch-2',
      payload: { productId: 'PROD-B', delta: 15 }
    });

    const result = await producer.publishBatch(mockQueue, [envelope1, envelope2]);

    expect(result.total).toBe(2);
    expect(result.succeeded).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.deliveredDurable).toBe(true);
    expect(mockQueue.sendBatch).toHaveBeenCalledTimes(1);
    expect(mockQueue.sendBatch).toHaveBeenCalledWith([
      { body: envelope1, delaySeconds: undefined },
      { body: envelope2, delaySeconds: undefined }
    ]);
  });

  it('surfaces explicit error when queue binding is missing in LIVE mode', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant-live',
      eventType: 'scm.order.placed',
      partitionKey: 'tenant-live:ORD-100',
      producer: 'test-producer',
      idempotencyKey: 'idemp-live-001',
      payload: { orderId: 'ORD-100' }
    });

    const result = await producer.publish(undefined, envelope, { isLive: true });

    expect(result.success).toBe(false);
    expect(result.deliveredDurable).toBe(false);
    expect(result.status).toBe('BINDING_MISSING');
    expect(result.error).toContain('Queue binding is unavailable in LIVE mode');
  });

  it('identifies local development unbound state without masquerading as durable delivery', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant-dev',
      eventType: 'scm.order.placed',
      partitionKey: 'tenant-dev:ORD-200',
      producer: 'test-producer',
      idempotencyKey: 'idemp-dev-001',
      payload: { orderId: 'ORD-200' }
    });

    // In local dev without live flag and without queue
    const result = await producer.publish(undefined, envelope, { isLive: false });

    expect(result.success).toBe(false);
    expect(result.deliveredDurable).toBe(false);
    expect(result.status).toBe('UNBOUND_LOCAL_DEV');
    expect(result.error).toContain('Durable delivery NOT performed');
  });

  it('surfaces network / send failure cleanly without false positives', async () => {
    const mockQueue: CloudflareQueueBinding = {
      send: vi.fn().mockRejectedValue(new Error('Cloudflare network timeout')),
      sendBatch: vi.fn()
    };

    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant-timeout',
      eventType: 'scm.shipment.dispatched',
      partitionKey: 'tenant-timeout:SHP-001',
      producer: 'test-producer',
      idempotencyKey: 'idemp-timeout-001',
      payload: { shipmentId: 'SHP-001' }
    });

    const result = await producer.publish(mockQueue, envelope);

    expect(result.success).toBe(false);
    expect(result.deliveredDurable).toBe(false);
    expect(result.status).toBe('PUBLISH_FAILED');
    expect(result.error).toContain('Cloudflare network timeout');
  });
});
