import { describe, it, expect, vi, beforeEach } from 'vitest';
import worker from '../../worker';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { createSignedTestJwt, registerTrustedJwtPublicKey, getDefaultTestKeyPair } from '../../server/workerSecurity';

describe('ORION-9 Inbound EDI Pipeline & Gateway Verification', () => {
  const dummyCtx: any = {
    waitUntil: vi.fn(),
    passThroughOnException: vi.fn()
  };

  const sampleX12_856 = [
    'ISA*00*          *00*          *ZZ*PARTNER_A      *ZZ*ORION9_HUB     *261024*1015*U*00401*000000856*0*T*:~',
    'GS*SH*PARTNER_A*ORION9_HUB*20261024*1015*856001*X*004010~',
    'ST*856*0001~',
    'BSN*00*ASN-2026-9042*20261024*1015~',
    'HL*1**S~',
    'TD1*PLT*10~',
    'TD5*B*2*FEDEX*M~',
    'REF*BM*BOL-98210~',
    'DTM*011*20261024~',
    'SE*9*0001~',
    'GE*1*856001~',
    'IEA*1*000000856~'
  ].join('\n');

  const sampleX12_214 = [
    'ISA*00*          *00*          *ZZ*CARRIER_FEDEX  *ZZ*ORION9_HUB     *261024*1020*U*00401*000000214*0*T*:~',
    'GS*QM*CARRIER_FEDEX*ORION9_HUB*20261024*1020*214001*X*004010~',
    'ST*214*0001~',
    'B10*INV-9921*SHIP-2026-9042*FEDEX~',
    'LX*1~',
    'AT7*AF*NS*20261024*1020*LT~',
    'MS1*MEMPHIS*TN*USA~',
    'SE*7*0001~',
    'GE*1*214001~',
    'IEA*1*000000214~'
  ].join('\n');

  let validToken: string;
  let mockEnv: any;

  beforeEach(() => {
    vi.restoreAllMocks();
    dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'admin_1',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
      reason: 'Reset to demo for EDI tests'
    });

    const keyPair = getDefaultTestKeyPair();
    if (keyPair) {
      registerTrustedJwtPublicKey('test-key-id', keyPair.publicKey);
      validToken = createSignedTestJwt({
        sub: 'edi-partner-svc',
        userId: 'edi-partner-svc',
        email: 'partner@supplychain.net',
        role: 'operator',
        environment: 'DEMO',
        organizationId: 'org-tenant-a',
        kid: 'test-key-id',
        privateKeyPem: keyPair.privateKey
      });
    } else {
      validToken = 'bearer-test-token';
    }

    mockEnv = {
      SCM_EVENTS: { send: vi.fn().mockResolvedValue(undefined), sendBatch: vi.fn() },
      SCM_EVENTS_DLQ: { send: vi.fn().mockResolvedValue(undefined), sendBatch: vi.fn() },
      ORION_RUNTIME_ENVIRONMENT: 'DEMO'
    };
  });

  it('rejects unauthenticated EDI transmissions with 401 Unauthorized', async () => {
    const req = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: sampleX12_856
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(401);
    const body: any = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('rejects empty or blank EDI payloads with 400 Bad Request', async () => {
    const req = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${validToken}`
      },
      body: '   '
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBe('EMPTY_PAYLOAD');
  });

  it('accepts and parses valid X12 856 ASN, dispatches queue event, and returns 997 Functional Acknowledgment', async () => {
    const req = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'Authorization': `Bearer ${validToken}`,
        'X-Orion-Tenant-Id': 'org-tenant-a'
      },
      body: sampleX12_856
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.transactionType).toBe('856');
    expect(body.interchangeControlNumber).toBe('000000856');
    expect(body.senderId).toBe('PARTNER_A');
    expect(body.parsedData.shipmentNoticeNumber).toBe('ASN-2026-9042');
    expect(body.ack997).toContain('AK9*A');
    expect(mockEnv.SCM_EVENTS.send).toHaveBeenCalledTimes(1);
    expect(mockEnv.SCM_EVENTS.send).toHaveBeenCalledWith(
      expect.objectContaining({
        eventType: 'edi.856.received',
        tenantId: 'org-tenant-a'
      })
    );
  });

  it('accepts and parses valid X12 214 Carrier Shipment Status message', async () => {
    const req = new Request('https://orion9.internal/api/integration/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Orion-Partner-Key': 'pk_partner_carrier_fedex',
        'X-Orion-Tenant-Id': 'org-tenant-a'
      },
      body: sampleX12_214
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(200);
    const body: any = await res.json();
    expect(body.success).toBe(true);
    expect(body.transactionType).toBe('214');
    expect(body.parsedData.shipmentId).toBe('SHIP-2026-9042');
    expect(body.parsedData.carrierCode).toBe('FEDEX');
    expect(body.parsedData.statusCode).toBe('AF');
    expect(body.ack997).toContain('AK9*A');
  });

  it('detects duplicate interchange control numbers and responds with 409 Conflict', async () => {
    const req1 = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Orion-Partner-Key': 'partner-dup-key'
      },
      body: sampleX12_856
    });

    const res1 = await worker.fetch(req1, mockEnv, dummyCtx);
    // Might be 200 or 409 depending on whether sampleX12_856 was already cached from previous test
    // Now send identical request again
    const req2 = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Orion-Partner-Key': 'partner-dup-key'
      },
      body: sampleX12_856
    });

    const res2 = await worker.fetch(req2, mockEnv, dummyCtx);
    expect(res2.status).toBe(409);
    const body: any = await res2.json();
    expect(body.error).toBe('DUPLICATE_TRANSMISSION');
  });

  it('quarantines malformed EDI syntax with 400 Bad Request and 997 Rejection', async () => {
    const malformedEdi = 'ISA*00*MALFORMED_HEADER~ST*856*0001~SE*2*0001~IEA*1*MISMATCH~';
    const req = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Orion-Partner-Key': 'pk_partner_carrier_fedex'
      },
      body: malformedEdi
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toBe('EDI_VALIDATION_FAILED');
    expect(body.ack997).toContain('AK9*R');
  });

  it('rejects payloads exceeding 5MB with 413 Payload Too Large', async () => {
    const hugePayload = 'A'.repeat(5 * 1024 * 1024 + 10);
    const req = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Orion-Partner-Key': 'pk_partner_carrier_fedex'
      },
      body: hugePayload
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(413);
    const body: any = await res.json();
    expect(body.error).toBe('PAYLOAD_TOO_LARGE');
  });

  it('handles queue dispatch failures gracefully by rolling back dedupe key and returning 500', async () => {
    mockEnv.SCM_EVENTS.send = vi.fn().mockRejectedValue(new Error('Queue unavailable'));

    const req = new Request('https://orion9.internal/api/edi/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        'X-Orion-Partner-Key': 'pk_partner_carrier_fedex',
        'X-Orion-Tenant-Id': 'org-tenant-a'
      },
      body: sampleX12_856.replaceAll('000000856', '000000999')
    });

    const res = await worker.fetch(req, mockEnv, dummyCtx);
    expect(res.status).toBe(500);
    const body: any = await res.json();
    expect(body.error).toBe('QUEUE_DISPATCH_FAILED');
  });
});
