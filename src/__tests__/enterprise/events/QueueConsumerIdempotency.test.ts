import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueueConsumer, queueConsumer } from '../../../enterprise/events/QueueConsumer';
import { createDistributedEventEnvelope } from '../../../enterprise/events/EventEnvelope';
import { DeadLetterQueueManager } from '../../../enterprise/events/DeadLetterQueueManager';

describe('ORION-9 QueueConsumer Durable Deduplication & Idempotency', () => {
  beforeEach(() => {
    queueConsumer.clear();
    DeadLetterQueueManager.getInstance().clear();
  });

  it('processes first message delivery and acknowledges it', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant_consumer_1',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant_consumer_1:INV-001',
      producer: 'inventory-service',
      idempotencyKey: 'idemp-consumer-001',
      payload: { productId: 'PROD-10', delta: 25 }
    });

    const mockMessage = {
      id: 'msg-001',
      body: envelope,
      attempts: 1,
      ack: vi.fn(),
      retry: vi.fn()
    };

    const result = await queueConsumer.handleMessage(mockMessage);

    expect(result.status).toBe('PROCESSED');
    expect(mockMessage.ack).toHaveBeenCalledTimes(1);
    expect(mockMessage.retry).not.toHaveBeenCalled();

    // Verify marked in deduplication store
    const isProcessed = await queueConsumer.isAlreadyProcessed(envelope.idempotencyKey, envelope.tenantId);
    expect(isProcessed).toBe(true);
  });

  it('detects duplicate message delivery, skips business mutation, and acks cleanly', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant_consumer_dup',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant_consumer_dup:INV-DUP',
      producer: 'inventory-service',
      idempotencyKey: 'idemp-consumer-dup-1',
      payload: { productId: 'PROD-DUP', delta: 50 }
    });

    const mockMessage1 = {
      id: 'msg-dup-1',
      body: envelope,
      attempts: 1,
      ack: vi.fn(),
      retry: vi.fn()
    };

    // First delivery
    const result1 = await queueConsumer.handleMessage(mockMessage1);
    expect(result1.status).toBe('PROCESSED');
    expect(mockMessage1.ack).toHaveBeenCalledTimes(1);

    // Second delivery of the identical idempotency key (e.g. at-least-once queue redelivery)
    const mockMessage2 = {
      id: 'msg-dup-2',
      body: envelope,
      attempts: 2,
      ack: vi.fn(),
      retry: vi.fn()
    };

    const result2 = await queueConsumer.handleMessage(mockMessage2);

    expect(result2.status).toBe('DUPLICATE');
    // Crucial: Duplicate message is acked so it leaves the queue, but mutation is NOT re-executed
    expect(mockMessage2.ack).toHaveBeenCalledTimes(1);
    expect(mockMessage2.retry).not.toHaveBeenCalled();
  });

  it('guarantees atomic concurrency: two concurrent deliveries of same event apply mutation strictly once', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant_race',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant_race:INV-RACE',
      producer: 'inventory-service',
      idempotencyKey: 'idemp-race-1',
      payload: { productId: 'PROD-RACE', delta: 100 }
    });

    let mutationExecutionCount = 0;
    queueConsumer.setMutationHandler(async () => {
      // Simulate non-trivial business logic latency
      await new Promise((r) => setTimeout(r, 20));
      mutationExecutionCount++;
    });

    const mockMessage1 = {
      id: 'msg-race-1',
      body: envelope,
      attempts: 1,
      ack: vi.fn(),
      retry: vi.fn()
    };

    const mockMessage2 = {
      id: 'msg-race-2',
      body: envelope,
      attempts: 1,
      ack: vi.fn(),
      retry: vi.fn()
    };

    // Trigger both deliveries concurrently in parallel
    const [result1, result2] = await Promise.all([
      queueConsumer.handleMessage(mockMessage1),
      queueConsumer.handleMessage(mockMessage2)
    ]);

    // Mutation occurred EXACTLY ONCE
    expect(mutationExecutionCount).toBe(1);

    const statuses = [result1.status, result2.status];
    expect(statuses).toContain('PROCESSED');
    expect(statuses).toContain('DUPLICATE');

    // Both messages were acknowledged so neither blocks the queue
    expect(mockMessage1.ack).toHaveBeenCalledTimes(1);
    expect(mockMessage2.ack).toHaveBeenCalledTimes(1);
  });

  it('safely handles and acks malformed / invalid messages after durable quarantine to prevent queue deadlocks', async () => {
    const invalidMessage = {
      id: 'msg-invalid-1',
      body: { invalid: true } as any,
      attempts: 1,
      ack: vi.fn(),
      retry: vi.fn()
    };

    const result = await queueConsumer.handleMessage(invalidMessage);

    expect(result.status).toBe('INVALID');
    expect(invalidMessage.ack).toHaveBeenCalledTimes(1);

    // Verify durable quarantine in DeadLetterQueueManager before ack
    const dlq = DeadLetterQueueManager.getInstance().listRecords('unknown_tenant');
    expect(dlq.length).toBe(1);
    expect(dlq[0].isPoisonPill).toBe(true);
  });

  it('retries transient failures when attempts < 5 and does not send to DLQ', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant_transient',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant_transient:INV-ERR',
      producer: 'inventory-service',
      idempotencyKey: 'idemp-transient-1',
      payload: { productId: 'PROD-ERR' }
    });

    // Mock internal mutation to throw a transient error
    queueConsumer.setMutationHandler(async () => {
      throw new Error('Transient DB contention');
    });

    const mockMessage = {
      id: 'msg-transient-1',
      body: envelope,
      attempts: 2,
      ack: vi.fn(),
      retry: vi.fn()
    };

    const result = await queueConsumer.handleMessage(mockMessage);

    expect(result.status).toBe('RETRIED');
    expect(mockMessage.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
    expect(mockMessage.ack).not.toHaveBeenCalled();

    // Verify not quarantined during transient retries
    const dlq = DeadLetterQueueManager.getInstance().listRecords('tenant_transient');
    expect(dlq.length).toBe(0);
  });

  it('quarantines poison pills to DLQ and acks after 5 attempts', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant_poison',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant_poison:INV-POISON',
      producer: 'inventory-service',
      idempotencyKey: 'idemp-poison-1',
      payload: { productId: 'PROD-POISON' }
    });

    queueConsumer.setMutationHandler(async () => {
      throw new Error('Persistent format corruption');
    });

    const mockMessage = {
      id: 'msg-poison-1',
      body: envelope,
      attempts: 5, // 5th attempt!
      ack: vi.fn(),
      retry: vi.fn()
    };

    const result = await queueConsumer.handleMessage(mockMessage);

    expect(result.status).toBe('QUARANTINED');
    // Crucial: Acked so poison pill is cleared from queue
    expect(mockMessage.ack).toHaveBeenCalledTimes(1);
    expect(mockMessage.retry).not.toHaveBeenCalled();

    // Verified in DeadLetterQueueManager
    const dlqRecords = DeadLetterQueueManager.getInstance().listRecords('tenant_poison');
    expect(dlqRecords.length).toBe(1);
    expect(dlqRecords[0].isPoisonPill).toBe(true);
    expect(dlqRecords[0].failureReason).toContain('Persistent format corruption');
  });

  it('refuses to ack if quarantine persistence fails, triggering retry to prevent message loss', async () => {
    const envelope = createDistributedEventEnvelope({
      tenantId: 'tenant_dlq_fail',
      eventType: 'scm.inventory.adjusted',
      partitionKey: 'tenant_dlq_fail:INV-FAIL',
      producer: 'inventory-service',
      idempotencyKey: 'idemp-dlq-fail-1',
      payload: { productId: 'PROD-DLQ-FAIL' }
    });

    queueConsumer.setMutationHandler(async () => {
      throw new Error('Fatal error');
    });

    // Spy on quarantineMessage to throw error
    const spy = vi.spyOn(DeadLetterQueueManager.getInstance(), 'quarantineMessage').mockRejectedValueOnce(new Error('DLQ disk full'));

    const mockMessage = {
      id: 'msg-dlq-fail-1',
      body: envelope,
      attempts: 5,
      ack: vi.fn(),
      retry: vi.fn()
    };

    const result = await queueConsumer.handleMessage(mockMessage);

    expect(result.status).toBe('RETRIED');
    // Must NOT ack if quarantine persistence failed!
    expect(mockMessage.ack).not.toHaveBeenCalled();
    expect(mockMessage.retry).toHaveBeenCalledWith({ delaySeconds: 30 });

    spy.mockRestore();
  });
});
