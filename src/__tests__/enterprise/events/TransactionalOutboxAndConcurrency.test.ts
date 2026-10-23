import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ScmPersistenceService, scmPersistenceService } from '../../../services/scm/ScmPersistenceService';
import { OutboxDispatcher } from '../../../enterprise/events/OutboxDispatcher';
import { DeadLetterQueueManager } from '../../../enterprise/events/DeadLetterQueueManager';
import { CloudflareQueueBinding } from '../../../enterprise/events/QueueProducer';
import { DatabaseConnectionManager } from '../../../core/database/DatabaseConnectionManager';

describe('ORION-9 Transactional Outbox & Concurrency Verification', () => {
  let dispatcher: OutboxDispatcher;

  beforeEach(() => {
    scmPersistenceService.clear();
    dispatcher = OutboxDispatcher.getInstance();
    vi.restoreAllMocks();
  });

  it('atomically creates business write and outbox entry when emitEvent is true', async () => {
    const tenantId = 'tenant_alpha';
    const invData = {
      tenantId,
      productId: 'PROD_TEST_1',
      onHand: 150
    };

    const saved = await scmPersistenceService.saveRecord('inventory', 'INV_TEST_1', invData, {
      emitEvent: true,
      eventType: 'scm.inventory.updated',
      partitionKey: `${tenantId}:INV_TEST_1`,
      idempotencyKey: 'idemp-tx-1'
    });

    expect(saved.onHand).toBe(150);

    // Business record is persisted
    const retrieved = await scmPersistenceService.getRecord('inventory', tenantId, 'INV_TEST_1');
    expect(retrieved).toBeDefined();
    expect((retrieved as any)?.onHand).toBe(150);

    // Outbox record is persisted with PENDING status
    const pendingEvents = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    expect(pendingEvents.length).toBe(1);
    expect(pendingEvents[0].idempotencyKey).toBe('idemp-tx-1');
    expect(pendingEvents[0].status).toBe('PENDING');
    expect(pendingEvents[0].envelope.eventType).toBe('scm.inventory.updated');
  });

  it('does not emit outbox entry when emitEvent is false (backward compatibility)', async () => {
    const tenantId = 'tenant_beta';
    const poData = {
      tenantId,
      poNumber: 'PO-999',
      status: 'DRAFT'
    };

    await scmPersistenceService.saveRecord('purchase_orders', 'PO-999', poData);

    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    expect(pending.length).toBe(0);
  });

  it('prevents two dispatchers from claiming the same event concurrently', async () => {
    const tenantId = 'tenant_concurrency';
    await scmPersistenceService.saveRecord('orders', 'ORD-CONC-1', { tenantId, amount: 200 }, {
      emitEvent: true,
      idempotencyKey: 'idemp-conc-1'
    });

    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    expect(pending.length).toBe(1);
    const outboxId = pending[0].id;

    // Worker 1 claims the event with a 60s lease
    const claim1 = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-1', 60000);
    expect(claim1).not.toBeNull();
    expect(claim1?.status).toBe('CLAIMED');
    expect(claim1?.claimedBy).toBe('worker-1');

    // Worker 2 attempts to claim the same event while lease is still valid
    const claim2 = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-2', 60000);
    // Worker 2 must be rejected
    expect(claim2).toBeNull();
  });

  it('allows recovery of expired claim after worker failure (lease expiration)', async () => {
    const tenantId = 'tenant_lease_expiry';
    await scmPersistenceService.saveRecord('orders', 'ORD-EXP-1', { tenantId, amount: 500 }, {
      emitEvent: true,
      idempotencyKey: 'idemp-exp-1'
    });

    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    const outboxId = pending[0].id;

    // Worker 1 claims with a very short lease (1ms) simulating a crashed worker
    const claim1 = await scmPersistenceService.claimOutboxEvent(outboxId, 'crashed-worker', 1);
    expect(claim1?.claimedBy).toBe('crashed-worker');

    // Wait 10ms for lease to expire
    await new Promise((r) => setTimeout(r, 10));

    // Worker 2 runs and attempts to claim the expired event
    const claim2 = await scmPersistenceService.claimOutboxEvent(outboxId, 'recovery-worker', 60000);
    expect(claim2).not.toBeNull();
    expect(claim2?.claimedBy).toBe('recovery-worker');
    expect(claim2?.attempts).toBe(2); // Attempt count incremented
  });

  it('supports at-least-once delivery when worker crashes after queue publish before mark-published', async () => {
    const tenantId = 'tenant_at_least_once';
    await scmPersistenceService.saveRecord('inventory', 'INV-ALO-1', { tenantId, onHand: 75 }, {
      emitEvent: true,
      idempotencyKey: 'idemp-alo-1'
    });

    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    const outboxId = pending[0].id;

    let publishedCount = 0;
    const mockQueue: CloudflareQueueBinding = {
      send: vi.fn().mockImplementation(async () => {
        publishedCount++;
        // Simulate crash right after send completes: don't call markOutboxPublished!
        return {};
      }),
      sendBatch: vi.fn()
    };

    // Mock markOutboxPublished to fail once, simulating worker crash before marking published
    const markSpy = vi.spyOn(scmPersistenceService, 'markOutboxPublished').mockRejectedValueOnce(new Error('Worker process killed before DB update'));

    // Dispatcher cycle 1 with very short lease (5ms)
    await dispatcher.dispatch({
      queue: mockQueue,
      workerId: 'worker-doomed',
      leaseDurationMs: 5
    });

    expect(publishedCount).toBe(1);

    // Wait for lease to expire
    await new Promise((r) => setTimeout(r, 15));

    // Restore markOutboxPublished
    markSpy.mockRestore();

    // Dispatcher cycle 2 runs and successfully republishes and marks published
    const mockQueue2: CloudflareQueueBinding = {
      send: vi.fn().mockImplementation(async () => {
        publishedCount++;
        return {};
      }),
      sendBatch: vi.fn()
    };

    const summary2 = await dispatcher.dispatch({
      queue: mockQueue2,
      workerId: 'worker-healed',
      leaseDurationMs: 60000
    });

    expect(publishedCount).toBe(2);
    expect(summary2.published).toBe(1);

    // Document is now marked PUBLISHED
    const pendingAfter = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    expect(pendingAfter.length).toBe(0);
  });

  it('routes to dead-letter queue after max attempts are exhausted', async () => {
    const tenantId = 'tenant_dlq_exhaustion';
    await scmPersistenceService.saveRecord('shipments', 'SHP-DLQ-1', { tenantId, status: 'FAILED' }, {
      emitEvent: true,
      idempotencyKey: 'idemp-dlq-1'
    });

    const mockFailingQueue: CloudflareQueueBinding = {
      send: vi.fn().mockRejectedValue(new Error('Downstream Cloudflare Queue Unavailable')),
      sendBatch: vi.fn()
    };

    const mockDlq: CloudflareQueueBinding = {
      send: vi.fn().mockResolvedValue({}),
      sendBatch: vi.fn()
    };

    // Dispatch 5 times to exhaust retries (with 1ms lease each time)
    for (let i = 0; i < 5; i++) {
      await dispatcher.dispatch({
        queue: mockFailingQueue,
        dlq: mockDlq,
        workerId: `worker-retry-${i}`,
        leaseDurationMs: 1
      });
      await new Promise((r) => setTimeout(r, 5));
    }

    // Now it should be quarantined to DeadLetterQueueManager and marked DEAD_LETTER
    const dlqRecords = DeadLetterQueueManager.getInstance().listRecords(tenantId);
    expect(dlqRecords.length).toBeGreaterThan(0);
    expect(dlqRecords[0].isPoisonPill).toBe(true);

    // No pending events left in outbox
    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    expect(pending.length).toBe(0);
  });

  it('enforces strict tenant isolation for outbox event queries', async () => {
    await scmPersistenceService.saveRecord('contracts', 'CNT-TENANT-A', { tenantId: 'tenant_A' }, {
      emitEvent: true,
      idempotencyKey: 'idemp-tenant-a'
    });

    await scmPersistenceService.saveRecord('contracts', 'CNT-TENANT-B', { tenantId: 'tenant_B' }, {
      emitEvent: true,
      idempotencyKey: 'idemp-tenant-b'
    });

    const pendingA = await scmPersistenceService.getPendingOutboxEvents('tenant_A');
    const pendingB = await scmPersistenceService.getPendingOutboxEvents('tenant_B');

    expect(pendingA.length).toBe(1);
    expect(pendingA[0].tenantId).toBe('tenant_A');

    expect(pendingB.length).toBe(1);
    expect(pendingB[0].tenantId).toBe('tenant_B');
  });

  it('allows a fresh service instance to read persisted state', async () => {
    const tenantId = 'tenant_fresh_instance';
    await scmPersistenceService.saveRecord('inventory', 'INV-FRESH-1', { tenantId, onHand: 42 });

    // Simulate new service instance
    const freshInstance = ScmPersistenceService.getInstance();
    const retrieved = await freshInstance.getRecord('inventory', tenantId, 'INV-FRESH-1');

    expect(retrieved).not.toBeNull();
    expect((retrieved as any)?.onHand).toBe(42);
  });

  it('enforces strict outbox lease ownership: stale worker cannot overwrite newer claim', async () => {
    const tenantId = 'tenant_lease_owner';
    await scmPersistenceService.saveRecord('orders', 'ORD-STALE-1', { tenantId, total: 100 }, {
      emitEvent: true,
      idempotencyKey: 'idemp-stale-1'
    });

    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    const outboxId = pending[0].id;

    // Worker A claims with 5ms lease
    const claimA = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-A', 5);
    expect(claimA?.claimedBy).toBe('worker-A');

    // Wait for Worker A's lease to expire
    await new Promise((r) => setTimeout(r, 15));

    // Worker B reclaims the expired event
    const claimB = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-B', 60000);
    expect(claimB?.claimedBy).toBe('worker-B');

    // Worker A wakes up late and attempts to mark the event published
    const staleResult = await scmPersistenceService.markOutboxPublished(outboxId, 'worker-A');
    expect(staleResult).toBe(false); // Stale Worker A rejected!

    // Verify Worker B's active claim remains intact
    const inFlight = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-C', 60000);
    expect(inFlight).toBeNull(); // Worker B still holds the valid claim

    // Worker B successfully marks it published
    const legitimateResult = await scmPersistenceService.markOutboxPublished(outboxId, 'worker-B');
    expect(legitimateResult).toBe(true);
  });

  it('operation-level idempotency suppresses duplicate retries while allowing distinct adjustments', async () => {
    const tenantId = 'tenant_op_idemp';
    const productId = 'PROD-SKU-99';
    const warehouseId = 'WH-CENTRAL';

    // 1. Initial valid adjustment
    const adj1 = await scmPersistenceService.adjustInventory({
      tenantId,
      productId,
      warehouseId,
      quantityDelta: 50,
      transactionType: 'GRN_RECEIPT',
      referenceEntityType: 'GRN',
      referenceEntityId: 'GRN-001',
      actor: 'operator-1',
      correlationId: 'OP-RECEIPT-BATCH-1'
    });
    expect(adj1.balanceAfter).toBe(50);
    expect(adj1.isDuplicate).toBeFalsy();

    // 2. Exact retry of operation 1 (same correlationId) -> detected as duplicate, mutation NOT repeated
    const retry1 = await scmPersistenceService.adjustInventory({
      tenantId,
      productId,
      warehouseId,
      quantityDelta: 50,
      transactionType: 'GRN_RECEIPT',
      referenceEntityType: 'GRN',
      referenceEntityId: 'GRN-001',
      actor: 'operator-1',
      correlationId: 'OP-RECEIPT-BATCH-1'
    });
    expect(retry1.isDuplicate).toBe(true);
    expect(retry1.balanceAfter).toBe(50); // Balance remains 50, not 100!

    // 3. Second DISTINCT valid adjustment for same product & warehouse (different correlationId)
    const adj2 = await scmPersistenceService.adjustInventory({
      tenantId,
      productId,
      warehouseId,
      quantityDelta: 30,
      transactionType: 'CYCLE_COUNT_ADJUSTMENT',
      referenceEntityType: 'CYCLE_COUNT',
      referenceEntityId: 'CC-002',
      actor: 'operator-2',
      correlationId: 'OP-COUNT-BATCH-2'
    });
    expect(adj2.isDuplicate).toBeFalsy();
    expect(adj2.balanceAfter).toBe(80); // Correctly applies: 50 + 30 = 80!

    // Check outbox events generated
    const outboxEvents = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    const invEvents = outboxEvents.filter(e => e.envelope.eventType === 'scm.inventory.adjusted');
    expect(invEvents.length).toBe(2); // Two distinct operation events
    expect(invEvents[0].idempotencyKey).toContain('OP-RECEIPT-BATCH-1');
    expect(invEvents[1].idempotencyKey).toContain('OP-COUNT-BATCH-2');
  });
});
