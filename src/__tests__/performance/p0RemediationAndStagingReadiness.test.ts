import { describe, it, expect, vi, beforeEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import worker from '../../worker';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { queueConsumer } from '../../enterprise/events/QueueConsumer';
import { queueProducer } from '../../enterprise/events/QueueProducer';
import { deadLetterQueueManager } from '../../enterprise/events/DeadLetterQueueManager';
import {
  createSignedTestJwt,
  registerTrustedJwtPublicKey,
  getDefaultTestKeyPair,
} from '../../server/workerSecurity';
import {
  clearIsolateEdiCache,
  checkAndRecordEdiIdempotency,
} from '../../server/ediIdempotencyStore';
import {
  invalidateControlTowerCache,
  getControlTowerCacheSize,
} from '../../server/controlTowerSnapshot';

describe('ORION-9 P0 Remediation, Queue Contract & Tenant Isolation Verification', () => {
  const dummyCtx: any = {
    waitUntil: vi.fn((p: Promise<any>) => p),
    passThroughOnException: vi.fn(),
  };

  let tokenTenantA: string;
  let tokenTenantB: string;
  let tokenViewerA: string;
  let tokenAdmin: string;

  const sampleX12_850 = [
    'ISA*00*          *00*          *ZZ*ACME_SUPP      *ZZ*ORION9_HUB     *261112*0230*U*00401*100000850*0*T*:~',
    'GS*PO*ACME_SUPP*ORION9_HUB*20261112*0230*850001*X*004010~',
    'ST*850*0001~',
    'BEG*00*SA*PO-2026-9901**20261112~',
    'PO1*1*100*EA*250**VP*SKU-1000~',
    'CTT*1~',
    'SE*5*0001~',
    'GE*1*850001~',
    'IEA*1*100000850~',
  ].join('');

  const sampleX12_214 = [
    'ISA*00*          *00*          *ZZ*CARRIER_DHL    *ZZ*ORION9_HUB     *261112*0231*U*00401*100000214*0*T*:~',
    'GS*QM*CARRIER_DHL*ORION9_HUB*20261112*0231*214001*X*004010~',
    'ST*214*0001~',
    'B10*REF-771*SHP-2026-9901*DHL~',
    'LX*1~',
    'AT7*AF*NS***20261112*0231*LT~',
    'SE*6*0001~',
    'GE*1*214001~',
    'IEA*1*100000214~',
  ].join('');

  beforeEach(() => {
    vi.restoreAllMocks();
    clearIsolateEdiCache();
    invalidateControlTowerCache();
    queueConsumer.clear();
    deadLetterQueueManager.clear();

    dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin_1',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Reset environment for P0 remediation verification',
    });

    const keyPair = getDefaultTestKeyPair();
    if (!keyPair) throw new Error('Default test RSA key pair missing');
    registerTrustedJwtPublicKey('p0-test-kid', keyPair.publicKey);

    tokenTenantA = createSignedTestJwt({
      sub: 'user-alpha-1',
      userId: 'user-alpha-1',
      email: 'ops@alpha.example',
      role: 'operator',
      environment: 'DEMO',
      organizationId: 'org-tenant-alpha',
      kid: 'p0-test-kid',
      privateKeyPem: keyPair.privateKey,
    });

    tokenTenantB = createSignedTestJwt({
      sub: 'user-beta-1',
      userId: 'user-beta-1',
      email: 'ops@beta.example',
      role: 'operator',
      environment: 'DEMO',
      organizationId: 'org-tenant-beta',
      kid: 'p0-test-kid',
      privateKeyPem: keyPair.privateKey,
    });

    tokenViewerA = createSignedTestJwt({
      sub: 'viewer-alpha-1',
      userId: 'viewer-alpha-1',
      email: 'viewer@alpha.example',
      role: 'viewer',
      environment: 'DEMO',
      organizationId: 'org-tenant-alpha',
      kid: 'p0-test-kid',
      privateKeyPem: keyPair.privateKey,
    });

    tokenAdmin = createSignedTestJwt({
      sub: 'admin-platform-1',
      userId: 'admin-platform-1',
      email: 'admin@orion.network',
      role: 'platform_admin',
      environment: 'DEMO',
      organizationId: 'ORION_PLATFORM',
      kid: 'p0-test-kid',
      privateKeyPem: keyPair.privateKey,
    });
  });

  describe('P0-1: EDI Producer -> QueueConsumer Contract', () => {
    it('1. dispatches a canonical DistributedEventEnvelope (with idempotencyKey & tenantId) processed & acked cleanly by worker.queue()', async () => {
      const sentMessages: any[] = [];
      const mockEnv: any = {
        ORION_RUNTIME_ENVIRONMENT: 'DEMO',
        SCM_EVENTS: {
          send: vi.fn(async (msg: any) => {
            sentMessages.push(msg);
          }),
        },
        SCM_EVENTS_DLQ: { send: vi.fn() },
      };

      // Send X12 850 and X12 214
      for (const body of [sampleX12_850, sampleX12_214]) {
        const req = new Request('https://orion9.internal/api/edi/receive', {
          method: 'POST',
          headers: {
            'Content-Type': 'text/plain',
            Authorization: `Bearer ${tokenTenantA}`,
          },
          body,
        });
        const res = await worker.fetch(req, mockEnv, dummyCtx);
        expect(res.status).toBe(200);
        const json: any = await res.json();
        expect(json.success).toBe(true);
        expect(json.tenantId).toBe('org-tenant-alpha');
        expect(json.idempotencyKey).toContain('org-tenant-alpha:');
      }

      expect(sentMessages).toHaveLength(2);
      for (const envelope of sentMessages) {
        const validation = queueProducer.validateEnvelope(envelope);
        expect(validation.valid).toBe(true);
        expect(envelope.idempotencyKey).toBeTruthy();
        expect(envelope.tenantId).toBe('org-tenant-alpha');
      }

      // Feed directly into QueueConsumer batch handler
      let businessMutations = 0;
      queueConsumer.setMutationHandler(async () => {
        businessMutations++;
      });

      const batchMessages = sentMessages.map((msg, i) => ({
        id: `q-msg-${i}`,
        body: msg,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn(),
      }));

      const results = await queueConsumer.handleBatch(
        { messages: batchMessages, queue: 'orion-scm-events', ackAll: vi.fn(), retryAll: vi.fn() },
        mockEnv
      );

      expect(results.map(r => r.status)).toEqual(['PROCESSED', 'PROCESSED']);
      expect(businessMutations).toBe(2);
      batchMessages.forEach(m => {
        expect(m.ack).toHaveBeenCalledTimes(1);
        expect(m.retry).not.toHaveBeenCalled();
      });

      // Replay identical batch -> must suppress duplicate & still ack cleanly
      const replayMessages = sentMessages.map((msg, i) => ({
        id: `q-replay-${i}`,
        body: msg,
        attempts: 2,
        ack: vi.fn(),
        retry: vi.fn(),
      }));
      const replayResults = await queueConsumer.handleBatch(
        { messages: replayMessages, queue: 'orion-scm-events', ackAll: vi.fn(), retryAll: vi.fn() },
        mockEnv
      );
      expect(replayResults.map(r => r.status)).toEqual(['DUPLICATE', 'DUPLICATE']);
      expect(businessMutations).toBe(2);
      replayMessages.forEach(m => expect(m.ack).toHaveBeenCalledTimes(1));
    });

    it('2. isolates EDI interchange deduplication across tenants while rejecting same-tenant duplicate with 409', async () => {
      const mockEnv: any = {
        ORION_RUNTIME_ENVIRONMENT: 'DEMO',
        SCM_EVENTS: { send: vi.fn().mockResolvedValue(undefined) },
      };

      const reqAlpha1 = new Request('https://orion9.internal/api/edi/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', Authorization: `Bearer ${tokenTenantA}` },
        body: sampleX12_850,
      });
      const resAlpha1 = await worker.fetch(reqAlpha1, mockEnv, dummyCtx);
      expect(resAlpha1.status).toBe(200);

      // Same ICN in Tenant Beta succeeds cleanly (tenant-scoped idempotencyKey)
      const reqBeta = new Request('https://orion9.internal/api/edi/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', Authorization: `Bearer ${tokenTenantB}` },
        body: sampleX12_850,
      });
      const resBeta = await worker.fetch(reqBeta, mockEnv, dummyCtx);
      expect(resBeta.status).toBe(200);

      // Replay in Tenant Alpha returns 409 DUPLICATE_TRANSMISSION
      const reqAlpha2 = new Request('https://orion9.internal/api/edi/receive', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain', Authorization: `Bearer ${tokenTenantA}` },
        body: sampleX12_850,
      });
      const resAlpha2 = await worker.fetch(reqAlpha2, mockEnv, dummyCtx);
      expect(resAlpha2.status).toBe(409);
      const errBody: any = await resAlpha2.json();
      expect(errBody.error).toBe('DUPLICATE_TRANSMISSION');
    });

    it('3. quarantines malformed queue envelopes missing required fields with actionable diagnostics', async () => {
      const malformedMsg = {
        id: 'q-malformed-1',
        body: { tenantId: 'org-tenant-alpha', payload: { partial: true } } as any,
        attempts: 1,
        ack: vi.fn(),
        retry: vi.fn(),
      };

      const res = await queueConsumer.handleMessage(malformedMsg);
      expect(res.status).toBe('INVALID');
      expect(res.error).toContain('idempotencyKey');
      expect(res.error).toContain('eventType');
      expect(malformedMsg.ack).toHaveBeenCalledTimes(1);

      const dlqRecords = deadLetterQueueManager.listRecords('org-tenant-alpha');
      expect(dlqRecords.length).toBe(1);
      expect(dlqRecords[0].isPoisonPill).toBe(true);
      expect(dlqRecords[0].failureReason).toContain('missing idempotencyKey, eventType');
    });
  });

  describe('P0-2: Tenant-Aware & Permission-Scoped Control Tower Cache', () => {
    it('4. isolates concurrent tenant requests, enforces viewer redaction, rejects cross-tenant spoofing, and invalidates on mutation', async () => {
      const mockEnv: any = { ORION_RUNTIME_ENVIRONMENT: 'DEMO' };

      const [resA, resB, resViewerA, resAdminA] = await Promise.all([
        worker.fetch(
          new Request('https://orion9.internal/api/control-tower/data', {
            headers: { Authorization: `Bearer ${tokenTenantA}` },
          }),
          mockEnv,
          dummyCtx
        ),
        worker.fetch(
          new Request('https://orion9.internal/api/control-tower/data', {
            headers: { Authorization: `Bearer ${tokenTenantB}` },
          }),
          mockEnv,
          dummyCtx
        ),
        worker.fetch(
          new Request('https://orion9.internal/api/control-tower/data', {
            headers: { Authorization: `Bearer ${tokenViewerA}` },
          }),
          mockEnv,
          dummyCtx
        ),
        worker.fetch(
          new Request('https://orion9.internal/api/control-tower/summary', {
            headers: { Authorization: `Bearer ${tokenAdmin}`, 'X-Orion-Tenant-Id': 'org-tenant-alpha' },
          }),
          mockEnv,
          dummyCtx
        ),
      ]);

      expect(resA.status).toBe(200);
      expect(resB.status).toBe(200);
      expect(resViewerA.status).toBe(200);
      expect(resAdminA.status).toBe(200);

      const jsonA: any = await resA.json();
      const jsonB: any = await resB.json();
      const jsonViewerA: any = await resViewerA.json();
      const jsonAdminA: any = await resAdminA.json();

      expect(jsonA.tenantId).toBe('org-tenant-alpha');
      expect(jsonB.tenantId).toBe('org-tenant-beta');
      expect(jsonA.exceptions[0].tenantId).toBe('org-tenant-alpha');
      expect(jsonB.exceptions[0].tenantId).toBe('org-tenant-beta');

      // Permission isolation on same tenantId
      expect(jsonViewerA.permissions.canExecuteActions).toBe(false);
      expect(jsonViewerA.exceptions[0].owner).toBe('Restricted');
      expect(jsonA.permissions.canExecuteActions).toBe(true);
      expect(jsonA.exceptions[0].owner).not.toBe('Restricted');
      expect(jsonAdminA.permissions.canDispatchOutbox).toBe(true);

      // Cross-tenant header spoofing blocked 403
      const spoofRes = await worker.fetch(
        new Request('https://orion9.internal/api/control-tower/data', {
          headers: { Authorization: `Bearer ${tokenTenantA}`, 'X-Orion-Tenant-Id': 'org-tenant-beta' },
        }),
        mockEnv,
        dummyCtx
      );
      expect(spoofRes.status).toBe(403);

      // Mutation in Tenant Alpha invalidates only Tenant Alpha cache entries
      expect(getControlTowerCacheSize()).toBeGreaterThanOrEqual(4);
      const sizeBeforeAction = getControlTowerCacheSize();

      const actionRes = await worker.fetch(
        new Request('https://orion9.internal/api/control/execute-action', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${tokenTenantA}`,
          },
          body: JSON.stringify({ actionType: 'EXPEDITE_PO', entityId: 'PO-2026-0042' }),
        }),
        mockEnv,
        dummyCtx
      );
      expect(actionRes.status).toBe(200);
      // 3 Tenant Alpha cache entries (operator /data, viewer /data, admin /summary) evicted; Tenant Beta stays cached
      expect(getControlTowerCacheSize()).toBe(sizeBeforeAction - 3);
    });
  });

  describe('P1: Multi-Isolate EDI Idempotency & Gemini Model Consistency', () => {
    it('5. shares EDI idempotency across independent isolates when Cloudflare KV or Firestore atomic persistence is configured', async () => {
      const kvStore = new Map<string, string>();
      const mockKv = {
        get: vi.fn(async (k: string) => kvStore.get(k) ?? null),
        put: vi.fn(async (k: string, v: string) => {
          kvStore.set(k, v);
        }),
        delete: vi.fn(async (k: string) => {
          kvStore.delete(k);
        }),
      };

      const dedupeKey = 'org-kv:SENDER1:99887766';
      const meta = {
        tenantId: 'org-kv',
        senderId: 'SENDER1',
        interchangeControlNumber: '99887766',
        transactionType: '850',
        activeEnv: 'STAGING' as const,
      };

      // Isolate 1 accepts first transmission
      const r1 = await checkAndRecordEdiIdempotency(dedupeKey, meta, { ORION_EDI_DEDUP: mockKv });
      expect(r1.duplicate).toBe(false);
      expect(r1.tier).toBe('kv_durable');

      // Simulate cold Worker isolate 2 by clearing local isolate memory
      clearIsolateEdiCache();

      // Isolate 2 detects duplicate from shared KV
      const r2 = await checkAndRecordEdiIdempotency(dedupeKey, meta, { ORION_EDI_DEDUP: mockKv });
      expect(r2.duplicate).toBe(true);
      expect(r2.tier).toBe('kv_durable');
    });

    it('6. verifies stale gemini-3.8-flash model strings are completely eliminated from worker.ts and server.ts', () => {
      const workerSrc = fs.readFileSync(path.resolve(__dirname, '../../worker.ts'), 'utf-8');
      const serverSrc = fs.readFileSync(path.resolve(__dirname, '../../../server.ts'), 'utf-8');

      expect(workerSrc).not.toContain('gemini-3.8-flash');
      expect(serverSrc).not.toContain('gemini-3.8-flash');
      expect(workerSrc).toContain('gemini-2.5-flash');
      expect(serverSrc).toContain('gemini-2.5-flash');
    });
  });
});
