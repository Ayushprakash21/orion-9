import { describe, it, expect, beforeEach } from 'vitest';
import { integrationGateway } from '../../integration/gateway/IntegrationGateway';
import { sapAdapterBoundary } from '../../integration/erp/SAPAdapterBoundary';
import { oracleAdapterBoundary } from '../../integration/erp/OracleAdapterBoundary';

describe('Wave 11: Enterprise Integration Gateway & ERP Adapter Boundaries', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    integrationGateway.reset();
  });

  it('1. IntegrationGateway processes inbound payload and queues to distributed broker', async () => {
    const res = await integrationGateway.processInbound({
      tenantId,
      sourceSystem: 'SAP',
      partnerId: 'SAP_PRD_100',
      transactionType: 'ORDERS',
      idempotencyKey: `idemp-gw-test-01`,
      payload: { poNumber: 'PO-1001', amount: 5000 }
    });

    expect(res.accepted).toBe(true);
    expect(res.statusCode).toBe(202);
    expect(res.trackingId).toMatch(/^gw-trk-/);
  });

  it('2. Enforces idempotency replay: identical key returns cached response without duplicate enqueue', async () => {
    const idempotencyKey = 'fixed-replay-key-888';

    const first = await integrationGateway.processInbound({
      tenantId,
      sourceSystem: 'ORACLE',
      partnerId: 'fa-test-scm',
      transactionType: 'INVOICE',
      idempotencyKey,
      payload: { invoiceId: 'INV-001' }
    });

    const second = await integrationGateway.processInbound({
      tenantId,
      sourceSystem: 'ORACLE',
      partnerId: 'fa-test-scm',
      transactionType: 'INVOICE',
      idempotencyKey,
      payload: { invoiceId: 'INV-001' }
    });

    expect(first.accepted).toBe(true);
    expect(second.accepted).toBe(true);
    expect(second.idempotentReplay).toBe(true);
    expect(second.trackingId).toBe(first.trackingId);
  });

  it('3. Circuit Breaker trips after repeated failures and blocks subsequent traffic with 503', async () => {
    const breaker = integrationGateway.getCircuitBreaker(tenantId, 'SAP');
    expect(breaker.canExecute()).toBe(true);

    // Inject consecutive failures to trip threshold (5)
    for (let i = 0; i < 5; i++) {
      breaker.onFailure('Connection timeout to RFC gateway');
    }

    expect(breaker.getState()).toBe('OPEN');

    // Next request to gateway must be rejected with 503
    const res = await integrationGateway.processInbound({
      tenantId,
      sourceSystem: 'SAP',
      partnerId: 'SAP_PRD_100',
      transactionType: 'ORDERS',
      idempotencyKey: `idemp-breaker-test`,
      payload: {}
    });

    expect(res.accepted).toBe(false);
    expect(res.statusCode).toBe(503);
    expect(res.message).toContain('Circuit Breaker for SAP is OPEN');
  });

  it('4. SAPAdapterBoundary processes inbound IDoc with truthful claims', async () => {
    const idocEnvelope = {
      controlRecord: {
        TABNAM: 'EDI_DC40',
        DOCNUM: '0000000001092812',
        MESTYP: 'ORDERS',
        IDOCTYP: 'ORDERS05',
        RCVPRN: 'ORION9',
        SNDPRN: 'SAP_PRD_100',
        CREDAT: '20260922',
        CRETIM: '120000'
      },
      dataSegments: [
        { SEGNAM: 'E1EDK01', SDATA: { CURCY: 'USD', BSART: 'NB' } },
        { SEGNAM: 'E1EDP01', SDATA: { POSEX: '00010', MENGE: '100', MEINS: 'EA' } }
      ]
    };

    const res = await sapAdapterBoundary.processInboundIDoc(tenantId, 'sap-primary', idocEnvelope);
    expect(res.success).toBe(true);
    expect(res.docNumber).toBe('0000000001092812');
    expect(res.operatingMode).toBe('SAP_SANDBOX');
    expect(res.liveStatus).toBe('EMULATED'); // Truthful claims: mock sandbox
    expect(res.recordsTransferred).toBe(2);
  });

  it('5. OracleAdapterBoundary synchronizes SCM cloud records with truthful claims', async () => {
    const syncRes = await oracleAdapterBoundary.syncToOracle(tenantId, 'oracle-primary', {
      resourceType: 'purchaseOrders',
      data: [
        { poNumber: 'PO-ORACLE-1', vendor: 'ACME', lines: 3 },
        { poNumber: 'PO-ORACLE-2', vendor: 'SUPPLIER_GLOBAL', lines: 1 }
      ]
    });

    expect(syncRes.success).toBe(true);
    expect(syncRes.operatingMode).toBe('ORACLE_SANDBOX');
    expect(syncRes.liveStatus).toBe('EMULATED'); // Truthful claims
    expect(syncRes.recordsCount).toBe(2);
  });
});
