/**
 * ORION-9 WAVE 3.1 — ENTERPRISE INTEGRATION FABRIC TEST SUITE
 *
 * Verifies ConnectorRegistry, CanonicalMapper (all 8 contracts),
 * IntegrationRetryEngine, IntegrationDLQ, IntegrationIdempotency,
 * ReconciliationEngine, Tenant Isolation, and Kernel Security integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ConnectorRegistry } from '../../integration/ConnectorRegistry';
import { CanonicalMapper, CanonicalValidationError } from '../../integration/CanonicalMapper';
import { IntegrationRetryEngine } from '../../integration/IntegrationRetryEngine';
import { IntegrationDLQ } from '../../integration/IntegrationDLQ';
import { IntegrationIdempotency } from '../../integration/IntegrationIdempotency';
import { ReconciliationEngine } from '../../integration/ReconciliationEngine';
import { IntegrationFabric } from '../../integration/IntegrationFabric';
import { ActorType } from '../../kernel/authorization/AuthorizationEngine';

describe('Wave 3.1 — Integration Fabric Foundation Suite', () => {
  const registry = ConnectorRegistry.getInstance();
  const dlq = IntegrationDLQ.getInstance();
  const idempotency = IntegrationIdempotency.getInstance();
  const reconciliation = ReconciliationEngine.getInstance();
  const fabric = IntegrationFabric.getInstance();

  const TENANT_A = 'org-tenant-a';
  const TENANT_B = 'org-tenant-b';

  beforeEach(() => {
    idempotency.clear();
  });

  // ── 1. CONNECTOR REGISTRY & TENANT ISOLATION ───────────────────────────────

  describe('Connector Registry & Tenant Isolation', () => {
    it('registers a connector with metadata and no raw secrets', () => {
      const conn = registry.registerConnector({
        tenantId: TENANT_A,
        type: 'SAP',
        name: 'Test SAP S/4HANA Connector',
        configuration: {
          endpointUrl: 'https://sap.test.orion9.internal',
          apiKey: 'SECRET_API_KEY_DO_NOT_STORE', // Should be deleted in config
        },
        actor: 'AdminTester',
      });

      expect(conn.connectorId).toBeDefined();
      expect(conn.tenantId).toBe(TENANT_A);
      expect(conn.type).toBe('SAP');
      expect(conn.configuration.apiKey).toBeUndefined(); // Secret stripped
      expect(conn.status).toBe('CONNECTED');
    });

    it('enforces tenant isolation when querying connectors', () => {
      const connA = registry.registerConnector({
        tenantId: TENANT_A,
        type: 'ORACLE',
        name: 'Tenant A OTM Connector',
        configuration: { url: 'https://otm-a.orion9' },
      });

      const listA = registry.listConnectors(TENANT_A);
      expect(listA.some(c => c.connectorId === connA.connectorId)).toBe(true);

      const listB = registry.listConnectors(TENANT_B);
      expect(listB.some(c => c.connectorId === connA.connectorId)).toBe(false);

      expect(() => {
        registry.getConnector(connA.connectorId, TENANT_B);
      }).toThrow(/Tenant 'org-tenant-b' is not authorized/);
    });

    it('updates health telemetry on success and failure', () => {
      const conn = registry.registerConnector({
        tenantId: TENANT_A,
        type: 'REST',
        name: 'Telemetry REST Connector',
        configuration: { url: 'https://api.test' },
      });

      registry.updateHealth(conn.connectorId, TENANT_A, {
        success: true,
        latencyMs: 35,
        recordsProcessedDelta: 10,
      });

      const updated = registry.getConnector(conn.connectorId, TENANT_A);
      expect(updated.health.latencyMs).toBe(35);
      expect(updated.health.recordsProcessed).toBe(10);
    });
  });

  // ── 2. CANONICAL CONTRACT LAYER (8 ENTITIES) ───────────────────────────────

  describe('Canonical Mapper Layer (8 Entities)', () => {
    it('maps SAP payload to Canonical Purchase Order', () => {
      const sapPayload = {
        EBELN: 'PO-SAP-8801',
        LIFNR: 'SUP-001',
        BEDAT: '2026-09-20',
        NETWR: '25000',
        WAERS: 'USD',
        STATU: '02',
        lineItems: [{ MATNR: 'SKU-01', MENGE: 50, NETPR: 500 }],
      };

      const po = CanonicalMapper.mapPurchaseOrder(sapPayload, TENANT_A);
      expect(po.id).toBe('PO-SAP-8801');
      expect(po.poNumber).toBe('PO-SAP-8801');
      expect(po.supplierId).toBe('SUP-001');
      expect(po.totalValue).toBe(25000);
      expect(po.status).toBe('Approved');
      expect(po.lineItems).toHaveLength(1);
    });

    it('throws CanonicalValidationError on missing required fields', () => {
      expect(() => {
        CanonicalMapper.mapPurchaseOrder({ EBELN: 'PO-999' }, TENANT_A);
      }).toThrow(CanonicalValidationError);
    });

    it('maps Inventory canonical contract', () => {
      const payload = { MATNR: 'SKU-TITAN', WERKS: 'WH-01', LABST: '150', VERPR: '45.50' };
      const inv = CanonicalMapper.mapInventory(payload, TENANT_A);
      expect(inv.productId).toBe('SKU-TITAN');
      expect(inv.onHand).toBe(150);
      expect(inv.unitCost).toBe(45.5);
    });

    it('maps Supplier canonical contract', () => {
      const payload = { LIFNR: 'SUP-VAL-01', NAME1: 'Apex Logistics Ltd', WAERS: 'EUR' };
      const sup = CanonicalMapper.mapSupplier(payload, TENANT_A);
      expect(sup.id).toBe('SUP-VAL-01');
      expect(sup.name).toBe('Apex Logistics Ltd');
      expect(sup.currency).toBe('EUR');
    });

    it('maps Product canonical contract', () => {
      const payload = { MATNR: 'PROD-100', MAKTX: 'High Speed Bearing', STPRS: '12.50' };
      const prod = CanonicalMapper.mapProduct(payload, TENANT_A);
      expect(prod.sku).toBe('PROD-100');
      expect(prod.name).toBe('High Speed Bearing');
      expect(prod.unitCost).toBe(12.5);
    });

    it('maps Shipment canonical contract', () => {
      const payload = { SHIPMENT_GID: 'SHP-990', SERVPROV_GID: 'DHL Freight', delayDays: 2 };
      const shp = CanonicalMapper.mapShipment(payload, TENANT_A);
      expect(shp.id).toBe('SHP-990');
      expect(shp.carrier).toBe('DHL Freight');
      expect(shp.delayDays).toBe(2);
    });

    it('maps ASN canonical contract', () => {
      const payload = { id: 'ASN-771', shipmentId: 'SHP-990', poNumber: 'PO-8801', itemCount: 100 };
      const asn = CanonicalMapper.mapASN(payload, TENANT_A);
      expect(asn.asnNumber).toBe('ASN-771');
      expect(asn.itemCount).toBe(100);
    });

    it('maps Invoice canonical contract', () => {
      const payload = { id: 'INV-4410', poNumber: 'PO-8801', supplierId: 'SUP-001', amount: 25000 };
      const inv = CanonicalMapper.mapInvoice(payload, TENANT_A);
      expect(inv.invoiceNumber).toBe('INV-4410');
      expect(inv.amount).toBe(25000);
    });

    it('maps CustomerOrder canonical contract', () => {
      const payload = { id: 'CO-5501', customerId: 'CUST-ALPHA', totalAmount: 14500 };
      const co = CanonicalMapper.mapCustomerOrder(payload, TENANT_A);
      expect(co.orderNumber).toBe('CO-5501');
      expect(co.totalAmount).toBe(14500);
    });
  });

  // ── 3. RETRY ENGINE & BACKOFF ──────────────────────────────────────────────

  describe('Integration Retry Engine', () => {
    it('calculates exponential backoff delays', () => {
      const delay1 = IntegrationRetryEngine.calculateBackoff(1);
      const delay2 = IntegrationRetryEngine.calculateBackoff(2);
      const delay3 = IntegrationRetryEngine.calculateBackoff(3);

      expect(delay1).toBe(100);
      expect(delay2).toBe(200);
      expect(delay3).toBe(400);
    });

    it('classifies retryable vs non-retryable errors', () => {
      expect(IntegrationRetryEngine.isRetryable(new Error('NETWORK TIMEOUT'))).toBe(true);
      expect(IntegrationRetryEngine.isRetryable(new Error('UNAUTHORIZED'))).toBe(false);
      expect(IntegrationRetryEngine.isRetryable(new Error('Missing required field'))).toBe(false);
    });

    it('respects max attempts without infinite retry loops', async () => {
      let attempts = 0;
      const res = await IntegrationRetryEngine.executeWithRetry(
        async (att) => {
          attempts = att;
          throw new Error('NETWORK TIMEOUT');
        },
        { maxAttempts: 3, initialDelayMs: 10 }
      );

      expect(res.attemptCount).toBe(3);
      expect(attempts).toBe(3);
      expect(res.lastError?.message).toBe('NETWORK TIMEOUT');
    });
  });

  // ── 4. DEAD LETTER QUEUE (DLQ) ─────────────────────────────────────────────

  describe('Integration Dead Letter Queue (DLQ)', () => {
    it('enqueues failed payload and enforces tenant isolation', () => {
      const record = dlq.enqueue({
        tenantId: TENANT_A,
        connectorId: 'conn-sap-s4hana-01',
        entityType: 'PurchaseOrder',
        payloadReference: { invalid: 'data' },
        errorCode: 'SCHEMA_INVALID',
        errorMessage: 'Invalid PO structure',
        attemptCount: 3,
        actor: 'Tester',
      });

      expect(record.messageId).toBeDefined();
      expect(record.status).toBe('UNRESOLVED');

      const listA = dlq.listDLQ(TENANT_A);
      expect(listA.some(r => r.messageId === record.messageId)).toBe(true);

      expect(() => {
        dlq.getRecord(record.messageId, TENANT_B);
      }).toThrow(/Tenant 'org-tenant-b' is not authorized/);
    });

    it('supports RETRY, DISCARD, and RESOLVE actions with status updates', async () => {
      const record = dlq.enqueue({
        tenantId: TENANT_A,
        connectorId: 'conn-sap-s4hana-01',
        entityType: 'Inventory',
        payloadReference: { SKU: 'SKU-TEST' },
        errorCode: 'TIMEOUT',
        errorMessage: 'Connection reset',
        attemptCount: 3,
      });

      // RETRY
      const retrySuccess = await dlq.retryMessage(record.messageId, TENANT_A, 'Operator', async () => true);
      expect(retrySuccess).toBe(true);
      expect(dlq.getRecord(record.messageId, TENANT_A).status).toBe('RETRIED');

      // DISCARD
      const record2 = dlq.enqueue({
        tenantId: TENANT_A,
        connectorId: 'conn-sap-s4hana-01',
        entityType: 'Supplier',
        payloadReference: {},
        errorCode: 'BAD_DATA',
        errorMessage: 'Corrupted payload',
        attemptCount: 3,
      });
      dlq.discardMessage(record2.messageId, TENANT_A, 'Operator', 'Corrupted file');
      expect(dlq.getRecord(record2.messageId, TENANT_A).status).toBe('DISCARDED');

      // RESOLVE
      const record3 = dlq.enqueue({
        tenantId: TENANT_A,
        connectorId: 'conn-sap-s4hana-01',
        entityType: 'Shipment',
        payloadReference: {},
        errorCode: 'MANUAL_HOLD',
        errorMessage: 'Operator review needed',
        attemptCount: 3,
      });
      dlq.resolveMessage(record3.messageId, TENANT_A, 'Operator', 'Fixed in ERP manually');
      expect(dlq.getRecord(record3.messageId, TENANT_A).status).toBe('RESOLVED');
    });
  });

  // ── 5. INTEGRATION IDEMPOTENCY ─────────────────────────────────────────────

  describe('Integration Idempotency Engine', () => {
    it('detects and prevents duplicate incoming external messages', () => {
      const extSystem = 'SAP_PRD';
      const key = 'MSG-KEY-1001';

      expect(idempotency.isProcessed(TENANT_A, extSystem, key)).toBe(false);

      idempotency.registerProcessed({
        tenantId: TENANT_A,
        externalSystemId: extSystem,
        externalMessageId: 'ext-msg-01',
        idempotencyKey: key,
        transactionResultId: 'txn-orion-99',
      });

      expect(idempotency.isProcessed(TENANT_A, extSystem, key)).toBe(true);

      expect(() => {
        idempotency.registerProcessed({
          tenantId: TENANT_A,
          externalSystemId: extSystem,
          externalMessageId: 'ext-msg-01-dup',
          idempotencyKey: key,
        });
      }).toThrow(/Duplicate external message detected/);
    });
  });

  // ── 6. RECONCILIATION ENGINE ───────────────────────────────────────────────

  describe('Reconciliation Engine', () => {
    it('runs reconciliation cycle and generates discrepancy report', () => {
      const report = reconciliation.runReconciliation({
        sourceSystem: 'SAP',
        purchaseOrders: [
          {
            id: 'PO-2026-0001',
            supplierId: 'SUP-001',
            orderDate: '2026-09-01',
            expectedDelivery: '2026-09-20',
            totalValue: 95000,
            status: 'Approved',
            lines: [],
            buyer: 'Buyer-01',
          }
        ],
        inventory: [],
        shipments: [],
        suppliers: [],
        actor: 'Reconciler',
      });

      expect(report.id).toBeDefined();
      expect(report.status).toBe('COMPLETED');
      expect(report.recordsChecked).toBeGreaterThan(0);
    });

    it('resolves open discrepancy with audit trail', () => {
      const openList = reconciliation.getOpenDiscrepancies();
      if (openList.length > 0) {
        const target = openList[0];
        const resolved = reconciliation.resolveDiscrepancy(target.id, 'ALIGN_TO_ERP', 'Operator', 'Aligned to SAP');
        expect(resolved.status).toBe('RESOLVED');
        expect(resolved.resolvedBy).toBe('Operator');
      }
    });
  });

  // ── 7. MASTER FABRIC INGRESS & KERNEL DISPATCH ─────────────────────────────

  describe('Master Integration Fabric Ingress', () => {
    it('processes valid external PO payload through complete fabric into Kernel CommandBus', async () => {
      const conn = registry.registerConnector({
        tenantId: TENANT_A,
        type: 'SAP',
        name: 'Ingress SAP Connector',
        configuration: { url: 'https://sap.ingress' },
      });

      const res = await fabric.ingest({
        connectorId: conn.connectorId,
        tenantId: TENANT_A,
        externalSystemId: 'SAP_PRD',
        externalMessageId: `msg-ext-${Date.now()}`,
        idempotencyKey: `idemp-key-${Date.now()}`,
        entityType: 'PurchaseOrder',
        payload: {
          EBELN: 'PO-FABRIC-9001',
          LIFNR: 'SUP-001',
          BEDAT: '2026-09-21',
          NETWR: 35000,
          WAERS: 'USD',
          STATU: '02',
          lineItems: [{ MATNR: 'SKU-FAB-01', MENGE: 10, NETPR: 3500 }],
        },
        actor: {
          id: 'user-tenant-a',
          type: ActorType.USER,
          name: 'Alice Ingress',
          roles: ['buyer'],
          organizationId: TENANT_A,
        },
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('PROCESSED');
      expect(res.canonicalEntity?.poNumber).toBe('PO-FABRIC-9001');
      expect(res.transactionId).toBeDefined();
    });

    it('enqueues DLQ on unprocessable canonical mapping error', async () => {
      const conn = registry.registerConnector({
        tenantId: TENANT_A,
        type: 'SAP',
        name: 'Ingress SAP Connector 2',
        configuration: { url: 'https://sap.ingress' },
      });

      const res = await fabric.ingest({
        connectorId: conn.connectorId,
        tenantId: TENANT_A,
        externalSystemId: 'SAP_PRD',
        externalMessageId: `msg-err-${Date.now()}`,
        idempotencyKey: `idemp-err-${Date.now()}`,
        entityType: 'PurchaseOrder',
        payload: {
          EBELN: 'PO-MALFORMED', // Missing LIFNR (Supplier ID)
        },
        actor: {
          id: 'user-tenant-a',
          type: ActorType.USER,
          name: 'Alice Ingress',
          roles: ['buyer'],
          organizationId: TENANT_A,
        },
      });

      expect(res.success).toBe(false);
      expect(res.status).toBe('DLQ_ENQUEUED');
      expect(res.dlqRecord).toBeDefined();
      expect(res.dlqRecord?.errorCode).toBe('CanonicalValidationError');
    });
  });
});
