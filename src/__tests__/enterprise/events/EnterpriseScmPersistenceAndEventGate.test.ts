import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scmPersistenceService } from '../../../services/scm/ScmPersistenceService';
import { outboxDispatcher } from '../../../enterprise/events/OutboxDispatcher';
import { queueConsumer } from '../../../enterprise/events/QueueConsumer';
import { queueProducer, CloudflareQueueBinding } from '../../../enterprise/events/QueueProducer';
import { deadLetterQueueManager } from '../../../enterprise/events/DeadLetterQueueManager';
import { createDistributedEventEnvelope } from '../../../enterprise/events/EventEnvelope';
import { availableToPromiseEngine } from '../../../scm/AvailableToPromiseEngine';
import { contractLifecycleEngine } from '../../../scm/ContractLifecycleEngine';
import { deliveryPodEngine } from '../../../scm/DeliveryPodEngine';
import { supplierCollaborationEngine } from '../../../scm/SupplierCollaborationEngine';
import { customerServiceEngine } from '../../../scm/CustomerServiceEngine';
import { warrantyManagementEngine } from '../../../scm/WarrantyManagementEngine';
import { vmiConsignmentEngine } from '../../../scm/VmiConsignmentEngine';

describe('ORION-9 Enterprise SCM Persistence & Event Fabric Final Integrity Gate', () => {
  beforeEach(() => {
    scmPersistenceService.clear();
    queueConsumer.clear();
    deadLetterQueueManager.clear();
    availableToPromiseEngine.clear();
    contractLifecycleEngine.clear();
    deliveryPodEngine.clear();
    supplierCollaborationEngine.clear();
    customerServiceEngine.clear();
    warrantyManagementEngine.clear();
    vmiConsignmentEngine.clear();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // FLOW 1, 2, 3: STABLE OPERATION-LEVEL IDEMPOTENCY
  // ---------------------------------------------------------------------------
  describe('Phase 1: Stable Operation-Level Idempotency & Conflict Guard', () => {
    const tenantId = 'tenant_scm_gate';
    const productId = 'SKU-QUANTUM-ACCEL';
    const warehouseId = 'WH-NORTH-01';

    it('1. Inventory adjustment with stable operation ID applies mutation and posts outbox event', async () => {
      const res = await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 100,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-1001',
        actor: 'receiving-dock-lead',
        operationId: 'OP-GRN-1001-ITEM1'
      });

      expect(res.balanceBefore).toBe(0);
      expect(res.balanceAfter).toBe(100);
      expect(res.isDuplicate).toBeFalsy();
      expect(res.transactionId.startsWith('TX-')).toBe(true);

      // Verify outbox entry generated with stable operation key
      const outbox = await scmPersistenceService.getPendingOutboxEvents(tenantId);
      const invOutbox = outbox.filter(e => e.envelope.eventType === 'scm.inventory.adjusted');
      expect(invOutbox.length).toBe(1);
      expect(invOutbox[0].idempotencyKey).toBe(`inv-op:${tenantId}:INV-${warehouseId}-${productId}:OP-GRN-1001-ITEM1`);
    });

    it('2. Retrying the same operation ID does not apply mutation twice (idempotent replay)', async () => {
      // First attempt
      const res1 = await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 50,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-1002',
        actor: 'receiving-dock-lead',
        operationId: 'OP-GRN-1002'
      });
      expect(res1.balanceAfter).toBe(50);
      expect(res1.isDuplicate).toBeFalsy();

      // Retry attempt with identical operationId
      const res2 = await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 50,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-1002',
        actor: 'receiving-dock-lead',
        operationId: 'OP-GRN-1002'
      });
      expect(res2.isDuplicate).toBe(true);
      expect(res2.balanceAfter).toBe(50); // Balance remains 50!
      expect(res2.transactionId).toBe(res1.transactionId);
    });

    it('3. Two distinct operation IDs produce two legitimate inventory adjustments', async () => {
      // Adjustment 1: GRN receipt of +50
      const res1 = await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 50,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-BATCH-A',
        actor: 'receiving-dock-lead',
        operationId: 'OP-GRN-BATCH-A'
      });
      expect(res1.balanceAfter).toBe(50);

      // Adjustment 2: Cycle count reconciliation of +25
      const res2 = await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 25,
        transactionType: 'CYCLE_COUNT_ADJUSTMENT',
        referenceEntityType: 'CYCLE_COUNT',
        referenceEntityId: 'CC-COUNT-01',
        actor: 'audit-specialist',
        operationId: 'OP-CC-COUNT-01'
      });
      expect(res2.balanceAfter).toBe(75); // 50 + 25 = 75!
      expect(res2.isDuplicate).toBeFalsy();
    });

    it('4. Retrying a business operation without original correlation ID is strictly rejected and cannot silently generate a second mutation', async () => {
      // First legitimate execution of GRN-1003
      await scmPersistenceService.adjustInventory({
        tenantId,
        productId,
        warehouseId,
        quantityDelta: 80,
        transactionType: 'GRN_RECEIPT',
        referenceEntityType: 'GRN',
        referenceEntityId: 'GRN-1003',
        actor: 'dock-worker',
        operationId: 'OP-ORIGINAL-GRN-1003'
      });

      // Attempting to retry the exact same business command with an altered/new operation ID
      await expect(
        scmPersistenceService.adjustInventory({
          tenantId,
          productId,
          warehouseId,
          quantityDelta: 80,
          transactionType: 'GRN_RECEIPT',
          referenceEntityType: 'GRN',
          referenceEntityId: 'GRN-1003',
          actor: 'dock-worker',
          operationId: 'OP-FORGED-NEW-ID'
        })
      ).rejects.toThrow(/Business operation for GRN:GRN-1003 on product SKU-QUANTUM-ACCEL was already executed/);

      // Verify balance did NOT change
      const inv = await scmPersistenceService.getRecord<any>('inventory', tenantId, `INV-${warehouseId}-${productId}`);
      expect(inv?.onHand).toBe(80);
    });

    it('5. Omitting operation ID or correlation ID throws explicit idempotency error', async () => {
      await expect(
        scmPersistenceService.adjustInventory({
          tenantId,
          productId,
          warehouseId,
          quantityDelta: 10,
          transactionType: 'GRN_RECEIPT',
          referenceEntityType: 'GRN',
          referenceEntityId: 'GRN-MISSING-ID',
          actor: 'dock-worker',
          operationId: ''
        })
      ).rejects.toThrow(/Stable operationId or correlationId is required for inventory adjustment/);
    });
  });

  // ---------------------------------------------------------------------------
  // FLOW 4 & 5: OUTBOX PUBLICATION, FENCING TOKENS & LEASE RECOVERY
  // ---------------------------------------------------------------------------
  describe('Phase 3: Outbox Lease Ownership, Fencing Tokens & Crash Recovery', () => {
    const tenantId = 'tenant_outbox_gate';

    it('strictly enforces fencing tokens: Worker A with stale fence token is rejected after Worker B claims', async () => {
      await scmPersistenceService.saveRecord('orders', 'ORD-FENCE-1', { tenantId, total: 100 }, {
        emitEvent: true,
        eventType: 'scm.order.created',
        partitionKey: `${tenantId}:ORD-FENCE-1`,
        idempotencyKey: 'idemp-fence-1'
      });

      const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
      const outboxId = pending[0].id;

      // 1. Worker A claims with 10ms lease -> gets fenceToken: 1
      const claimA = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-A', 10);
      expect(claimA).not.toBeNull();
      expect(claimA?.claimedBy).toBe('worker-A');
      expect(claimA?.fenceToken).toBe(1);

      // Wait 15ms for Worker A's lease to expire
      await new Promise(r => setTimeout(r, 15));

      // 2. Worker B reclaims expired event -> gets fenceToken: 2
      const claimB = await scmPersistenceService.claimOutboxEvent(outboxId, 'worker-B', 60000);
      expect(claimB).not.toBeNull();
      expect(claimB?.claimedBy).toBe('worker-B');
      expect(claimB?.fenceToken).toBe(2);

      // 3. Worker A wakes up and attempts to mark published using old fenceToken: 1
      const staleResult = await scmPersistenceService.markOutboxPublished(outboxId, 'worker-A', claimA?.fenceToken);
      expect(staleResult).toBe(false); // REJECTED!

      // 4. Worker B marks published with fenceToken: 2 -> SUCCEEDS
      const validResult = await scmPersistenceService.markOutboxPublished(outboxId, 'worker-B', claimB?.fenceToken);
      expect(validResult).toBe(true);

      // Verify status is PUBLISHED
      const finalEvents = await scmPersistenceService.getPendingOutboxEvents(tenantId);
      expect(finalEvents.length).toBe(0);
    });

    it('recovers safely when publication succeeds but worker crashes before marking published (at-least-once)', async () => {
      await scmPersistenceService.saveRecord('orders', 'ORD-CRASH-1', { tenantId, total: 300 }, {
        emitEvent: true,
        eventType: 'scm.order.created',
        partitionKey: `${tenantId}:ORD-CRASH-1`,
        idempotencyKey: 'idemp-crash-1'
      });

      const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
      const outboxId = pending[0].id;

      // Worker 1 claims with short lease (10ms) and publishes to queue, but crashes before markPublished
      const claim1 = await scmPersistenceService.claimOutboxEvent(outboxId, 'crashed-worker', 10);
      expect(claim1).not.toBeNull();

      // Lease expires
      await new Promise(r => setTimeout(r, 15));

      // Worker 2 recovers expired claim
      const mockQueue: CloudflareQueueBinding = {
        send: vi.fn().mockResolvedValue({ id: 'cf-msg-recovered' }),
        sendBatch: vi.fn()
      };

      const summary = await outboxDispatcher.dispatch({
        queue: mockQueue,
        workerId: 'recovery-worker',
        isLive: false
      });

      expect(summary.published).toBe(1);
      expect(mockQueue.send).toHaveBeenCalledTimes(1);
    });

    it('transient publish failure resets claim to PENDING for subsequent retry', async () => {
      await scmPersistenceService.saveRecord('orders', 'ORD-FAIL-1', { tenantId, total: 400 }, {
        emitEvent: true,
        eventType: 'scm.order.created',
        partitionKey: `${tenantId}:ORD-FAIL-1`,
        idempotencyKey: 'idemp-fail-1'
      });

      const failingQueue: CloudflareQueueBinding = {
        send: vi.fn().mockRejectedValue(new Error('Cloudflare 503 Service Unavailable')),
        sendBatch: vi.fn()
      };

      const summary1 = await outboxDispatcher.dispatch({
        queue: failingQueue,
        workerId: 'worker-failing',
        isLive: false
      });

      expect(summary1.failed).toBe(1);

      // Event is still PENDING and eligible for recovery on next cycle
      const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
      expect(pending.length).toBe(1);
      expect(pending[0].status).toBe('PENDING');
      expect(pending[0].attempts).toBe(1);
    });
  });

  // ---------------------------------------------------------------------------
  // FLOW 6 & 9 & 10: CONSUMER DEDUPLICATION, POISON PILLS & RETRIES
  // ---------------------------------------------------------------------------
  describe('Phase 2 & 4: Queue Consumer Idempotency & DLQ Responsibilities', () => {
    const tenantId = 'tenant_consumer_gate';

    it('concurrent duplicate deliveries of identical event apply business mutation strictly once', async () => {
      const envelope = createDistributedEventEnvelope({
        tenantId,
        eventType: 'scm.inventory.adjusted',
        partitionKey: `${tenantId}:INV-RACE`,
        producer: 'test-producer',
        idempotencyKey: 'idemp-concurrent-race-1',
        payload: { productId: 'PROD-CONC', quantity: 25 }
      });

      let mutationCount = 0;
      queueConsumer.setMutationHandler(async () => {
        await new Promise(r => setTimeout(r, 15));
        mutationCount++;
      });

      const msg1 = { id: 'm1', body: envelope, attempts: 1, ack: vi.fn(), retry: vi.fn() };
      const msg2 = { id: 'm2', body: envelope, attempts: 1, ack: vi.fn(), retry: vi.fn() };

      const [r1, r2] = await Promise.all([
        queueConsumer.handleMessage(msg1),
        queueConsumer.handleMessage(msg2)
      ]);

      expect(mutationCount).toBe(1); // EXACTLY ONCE!
      const statuses = [r1.status, r2.status];
      expect(statuses).toContain('PROCESSED');
      expect(statuses).toContain('DUPLICATE');
      expect(msg1.ack).toHaveBeenCalledTimes(1);
      expect(msg2.ack).toHaveBeenCalledTimes(1);
    });

    it('quarantines malformed event to DeadLetterQueueManager before acknowledging', async () => {
      const malformedMsg = {
        id: 'msg-malformed',
        body: { missingFields: true } as any,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn()
      };

      const res = await queueConsumer.handleMessage(malformedMsg);
      expect(res.status).toBe('INVALID');
      expect(malformedMsg.ack).toHaveBeenCalledTimes(1);

      // Quarantined in DLQ
      const dlqCount = deadLetterQueueManager.getDeadLetterCount('unknown_tenant');
      expect(dlqCount).toBe(1);
    });

    it('retries transient failures and does not acknowledge prematurely', async () => {
      const envelope = createDistributedEventEnvelope({
        tenantId,
        eventType: 'scm.inventory.adjusted',
        partitionKey: `${tenantId}:INV-TRANSIENT`,
        producer: 'test-producer',
        idempotencyKey: 'idemp-transient-test',
        payload: { productId: 'PROD-TRANSIENT' }
      });

      queueConsumer.setMutationHandler(async () => {
        throw new Error('Database write conflict');
      });

      const msg = {
        id: 'msg-transient',
        body: envelope,
        attempts: 2, // Less than 5
        ack: vi.fn(),
        retry: vi.fn()
      };

      const res = await queueConsumer.handleMessage(msg);
      expect(res.status).toBe('RETRIED');
      expect(msg.retry).toHaveBeenCalledWith({ delaySeconds: 30 });
      expect(msg.ack).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  // FLOW 7: TENANT ISOLATION REJECTION
  // ---------------------------------------------------------------------------
  describe('Phase 5 & Tenant Isolation Boundary', () => {
    it('strictly isolates tenant records: cross-tenant access returns null', async () => {
      await scmPersistenceService.saveRecord('inventory', 'INV-SECRET-A', {
        tenantId: 'tenant_company_A',
        productId: 'SECRET-CHIP',
        onHand: 1000
      });

      // Tenant B queries the same record ID
      const crossTenant = await scmPersistenceService.getRecord('inventory', 'tenant_company_B', 'INV-SECRET-A');
      expect(crossTenant).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // FLOW 8: PERSISTENCE RECONSTRUCTION FROM FRESH SERVICE INSTANCE
  // ---------------------------------------------------------------------------
  describe('Phase 5: SCM Engine Durable Persistence & Fresh Instance State Reconstruction', () => {
    const tenantId = 'tenant_reconstruction_gate';

    it('reconstructs ATP engine state from durable storage on fresh instance', async () => {
      // 1. Instance 1 executes calculation
      const atpRecord = availableToPromiseEngine.calculateAtp({
        tenantId,
        productId: 'SKU-RECON-SERVER',
        warehouseId: 'WH-EAST',
        requestedQuantity: 20,
        requestedDeliveryDate: '2026-11-01',
        onHandQuantity: 50,
        reservedQuantity: 10,
      });
      expect(atpRecord.availableToPromiseQuantity).toBe(40);

      // 2. Simulate fresh service instance (clear in-memory calculations map)
      availableToPromiseEngine.clear();
      expect(availableToPromiseEngine.getCalculations(tenantId).length).toBe(1); // Auto-hydrated from cached persistence!

      // 3. Explicit asynchronous hydration for cold start
      const rehydrated = await availableToPromiseEngine.hydrateFromStorage(tenantId);
      expect(rehydrated.length).toBe(1);
      expect(rehydrated[0].atpId).toBe(atpRecord.atpId);
      expect(rehydrated[0].productId).toBe('SKU-RECON-SERVER');
    });

    it('persists and reconstructs Delivery POD records across instances', async () => {
      const pod = deliveryPodEngine.recordProofOfDelivery({
        tenantId,
        shipmentId: 'SHIP-9901',
        orderId: 'ORD-9901',
        carrierId: 'FEDEX',
        carrierTrackingNumber: 'TRK-9901-FX',
        recipientName: 'Alice Chief',
        deliveryStatus: 'DELIVERED_CLEAN',
        deliveryLatitude: 37.7749,
        deliveryLongitude: -122.4194
      });

      deliveryPodEngine.clear();
      const pods = deliveryPodEngine.getPods(tenantId);
      expect(pods.length).toBe(1);
      expect(pods[0].podId).toBe(pod.podId);
      expect(pods[0].deliveryStatus).toBe('DELIVERED_CLEAN');
    });

    it('persists and reconstructs Supplier Commitments across instances', async () => {
      const commit = supplierCollaborationEngine.recordCommitment({
        tenantId,
        supplierId: 'SUPP-TITAN',
        productId: 'RAW-ALUMINUM',
        monthPeriod: '2026-Q4',
        sharedForecastUnits: 5000,
        supplierCommittedUnits: 4500,
        acknowledgementStatus: 'COMMITTED_PARTIAL'
      });
      expect(commit.capacityConstraintGap).toBe(500);

      supplierCollaborationEngine.clear();
      const commitments = supplierCollaborationEngine.getCommitments(tenantId);
      expect(commitments.length).toBe(1);
      expect(commitments[0].commitmentId).toBe(commit.commitmentId);
      expect(commitments[0].capacityConstraintGap).toBe(500);
    });

    it('persists and reconstructs Customer Service Cases across instances', async () => {
      const csCase = customerServiceEngine.openCase({
        tenantId,
        customerId: 'CUST-OMEGA',
        orderId: 'ORD-5501',
        issueCategory: 'DAMAGED_GOODS',
        priority: 'HIGH',
        slaDeadline: '2026-11-01'
      });

      customerServiceEngine.clear();
      const cases = customerServiceEngine.getCases(tenantId);
      expect(cases.length).toBe(1);
      expect(cases[0].caseId).toBe(csCase.caseId);
      expect(cases[0].status).toBe('OPEN');
    });

    it('persists and reconstructs Warranty Claims across instances', async () => {
      const claim = warrantyManagementEngine.submitClaim({
        tenantId,
        claimNumber: 'CLM-001',
        customerId: 'CUST-ALPHA',
        productId: 'PROD-GPU-ULTRA',
        productSerialNumber: 'SN-9988-77',
        orderId: 'ORD-9901',
        purchaseDate: '2026-01-01',
        claimDate: '2026-02-01',
        claimReason: 'No POST code on motherboard slot',
        resolution: 'REPLACE',
        totalWarrantyCost: 500,
        supplierRecoveryAmount: 500
      });

      warrantyManagementEngine.clear();
      const claims = warrantyManagementEngine.getClaims(tenantId);
      expect(claims.length).toBe(1);
      expect(claims[0].claimId).toBe(claim.claimId);
      expect(claims[0].supplierRecoveryStatus).toBe('PENDING_CLAIM');
    });

    it('persists and reconstructs VMI Stock Pools across instances', async () => {
      const pool = vmiConsignmentEngine.registerStockPool({
        tenantId,
        supplierId: 'SUPP-SILICON-VALLEY',
        facilityLocationId: 'WH-MAIN',
        productId: 'CHIP-WAFER-300',
        stockType: 'CONSIGNMENT_HELD',
        currentStockUnits: 2000,
        minThresholdUnits: 500,
        maxThresholdUnits: 5000,
        reorderTriggerUnits: 600
      });

      vmiConsignmentEngine.clear();
      const pools = vmiConsignmentEngine.getStockPools(tenantId);
      expect(pools.length).toBe(1);
      expect(pools[0].vmiId).toBe(pool.vmiId);
      expect(pools[0].currentStockUnits).toBe(2000);
    });

    it('persists and reconstructs Enterprise Contracts across instances', async () => {
      const contract = contractLifecycleEngine.createContractDraft({
        tenantId,
        title: 'Master Logistics Freight Agreement 2026',
        supplierId: 'CARRIER-MAERSK',
        supplierName: 'Maersk Line',
        effectiveDate: '2026-01-01',
        expirationDate: '2027-12-31',
        totalCommittedValue: 2500000,
        currency: 'USD',
        paymentTerms: 'NET_30',
        incoterms: 'FOB',
        pricingTiers: {},
        slaRules: [],
        creator: 'procurement_lead'
      });

      contractLifecycleEngine.clear();
      const contracts = contractLifecycleEngine.listContracts(tenantId);
      expect(contracts.length).toBe(1);
      expect(contracts[0].contractId).toBe(contract.contractId);
      expect(contracts[0].totalCommittedValue).toBe(2500000);
    });
  });

  // ---------------------------------------------------------------------------
  // PHASE 6: OPERATIONAL HEALTH AND OBSERVABILITY METRICS
  // ---------------------------------------------------------------------------
  describe('Phase 6: Safe Operational Health Metrics', () => {
    it('returns accurate non-sensitive operational metrics without leaking credentials or payloads', async () => {
      const tenantId = 'tenant_health_test';
      await scmPersistenceService.saveRecord('orders', 'ORD-HEALTH-1', { tenantId, total: 100 }, {
        emitEvent: true,
        eventType: 'scm.order.created',
        partitionKey: `${tenantId}:ORD-HEALTH-1`,
        idempotencyKey: 'idemp-health-1'
      });

      const metrics = scmPersistenceService.getOutboxMetrics(tenantId);
      expect(metrics.pendingCount).toBe(1);
      expect(metrics.claimedCount).toBe(0);
      expect(metrics.deadLetterCount).toBe(0);
      expect(metrics.oldestPendingAgeSeconds).toBeGreaterThanOrEqual(0);

      // Verify no sensitive fields in metrics object
      expect((metrics as any).payload).toBeUndefined();
      expect((metrics as any).secret).toBeUndefined();
    });
  });
});
