/**
 * ORION-9 WAVE 3.2 ENTERPRISE CONNECTOR RUNTIME & ADAPTER TEST SUITE
 * Verification of SAP, Oracle, EDI, REST, File, Circuit Breaker, Sync Jobs, Credential Vault, and Multi-tenant security.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { connectorRegistry } from '../../integration/ConnectorRegistry';
import { credentialVaultService } from '../../integration/CredentialVaultService';
import { CircuitBreaker } from '../../integration/CircuitBreaker';
import { SAPConnector } from '../../integration/adapters/SAPConnector';
import { SAPAdapter } from '../../integration/adapters/SAPAdapter';
import { OracleConnector } from '../../integration/adapters/OracleConnector';
import { OracleAdapter } from '../../integration/adapters/OracleAdapter';
import { EDIParser } from '../../integration/adapters/EDIParser';
import { EDIConnector } from '../../integration/adapters/EDIConnector';
import { FileAdapter } from '../../integration/adapters/FileAdapter';
import { FileConnector } from '../../integration/adapters/FileConnector';
import { RESTConnector } from '../../integration/adapters/RESTConnector';
import { syncJobEngine } from '../../integration/SyncJobEngine';
import { integrationDLQ } from '../../integration/IntegrationDLQ';

describe('Wave 3.2 Enterprise Connector Runtime & Adapter Suite', () => {
  const tenantA = 'org-tenant-a';
  const tenantB = 'org-tenant-b';

  beforeEach(() => {
    // Reset test isolation where applicable
  });

  describe('1. Credential Security & Server Vault Abstraction', () => {
    it('resolves valid credential reference for authorized tenant', () => {
      const ref = `secret://tenant/${tenantA}/connector/conn-sap-s4hana-01`;
      const creds = credentialVaultService.resolveCredentials(ref, tenantA);
      expect(creds).toBeDefined();
      expect(creds.authType).toBe('OAUTH2');
      expect(creds.clientId).toBeDefined();
    });

    it('denies secret resolution when requested by a different tenant (fail-closed)', () => {
      const ref = `secret://tenant/${tenantA}/connector/conn-sap-s4hana-01`;
      expect(() => {
        credentialVaultService.resolveCredentials(ref, tenantB);
      }).toThrow(/SECURITY DENIAL/);
    });

    it('sanitizes plain-text passwords and secrets during connector registration', () => {
      const reg = connectorRegistry.registerConnector({
        tenantId: tenantA,
        type: 'REST',
        name: 'Unsafe Plaintext Param Test',
        configuration: {
          baseUrl: 'https://api.test.com',
          password: 'UNSAFE_PLAIN_PASSWORD',
          secret: 'UNSAFE_SECRET_KEY',
        },
      });

      expect(reg.configuration.password).toBeUndefined();
      expect(reg.configuration.secret).toBeUndefined();
      expect(reg.credentialReference).toContain(`secret://tenant/${tenantA}/connector/`);
    });
  });

  describe('2. Connector Circuit Breaker', () => {
    it('transitions CLOSED -> OPEN upon reaching failure threshold', () => {
      const cb = new CircuitBreaker('conn-test-cb', tenantA, { failureThreshold: 3, cooldownPeriodMs: 5000 });
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);

      cb.onFailure('Err 1');
      cb.onFailure('Err 2');
      expect(cb.getState()).toBe('CLOSED');

      cb.onFailure('Err 3');
      expect(cb.getState()).toBe('OPEN');
      expect(cb.canExecute()).toBe(false);
    });

    it('resets from OPEN -> CLOSED on manual reset', () => {
      const cb = new CircuitBreaker('conn-test-cb-2', tenantA, { failureThreshold: 2 });
      cb.onFailure('Err 1');
      cb.onFailure('Err 2');
      expect(cb.getState()).toBe('OPEN');

      cb.reset('Admin User');
      expect(cb.getState()).toBe('CLOSED');
      expect(cb.canExecute()).toBe(true);
    });
  });

  describe('3. SAP S/4HANA Adapter & Connector', () => {
    it('transforms SAP Vendor BAPI payload to canonical supplier', () => {
      const rawVendor = {
        LIFNR: '100042',
        NAME1: 'SAP Global Logistics GmbH',
        LAND1: 'DE',
        WAERS: 'EUR',
        LOEKZ: '',
        SMTP_ADDR: 'sap@logistics.de',
      };
      const canonical = SAPAdapter.toCanonicalSupplier(rawVendor, tenantA);
      expect(canonical.id).toBe('sup-sap-100042');
      expect(canonical.name).toBe('SAP Global Logistics GmbH');
      expect(canonical.code).toBe('100042');
      expect(canonical.status).toBe('ACTIVE');
      expect(canonical.currency).toBe('EUR');
    });

    it('transforms SAP PO IDoc payload to canonical purchase order', () => {
      const rawPo = {
        EBELN: '4500099887',
        LIFNR: '100042',
        AEDAT: '2026-09-20',
        EINDT: '2026-09-30',
        NETWR: 98000,
        WAERS: 'USD',
        STATU: 'RELEASED',
        ITEMS: [{ EBELP: '10', MATNR: 'MAT-100', MENGE: 200, NETPR: 490 }],
      };
      const po = SAPAdapter.toCanonicalPurchaseOrder(rawPo, tenantA);
      expect(po.id).toBe('po-sap-4500099887');
      expect(po.poNumber).toBe('4500099887');
      expect(po.status).toBe('Approved');
      expect(po.totalValue).toBe(98000);
      expect(po.lineItems.length).toBe(1);
    });

    it('operates deterministically in SANDBOX mode', async () => {
      const runtime = new SAPConnector({
        connectorId: 'sap-sandbox-test',
        tenantId: tenantA,
        type: 'SAP',
        name: 'SAP Sandbox Test',
        version: '1.0.0',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        configuration: {},
        capabilities: { supportsInbound: true, supportsOutbound: true, supportsRealtime: true, supportsBatch: true },
        health: { failureCount: 0, latencyMs: 20, recordsProcessed: 0 },
        endpointReference: 'sandbox://sap',
        credentialReference: `secret://tenant/${tenantA}/connector/sap-sandbox-test`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const res = await runtime.send({ entityType: 'PurchaseOrder', poNumber: '4500011223' });
      expect(res.success).toBe(true);
      expect(res.mode).toBe('SANDBOX');
      expect(res.canonicalEntity.poNumber).toBe('4500011223');
    });

    it('remains UNCONFIGURED in LIVE mode when endpoint is missing', async () => {
      const runtime = new SAPConnector({
        connectorId: 'sap-live-test',
        tenantId: tenantA,
        type: 'SAP',
        name: 'SAP Live Unconfigured',
        version: '1.0.0',
        status: 'UNCONFIGURED',
        environment: 'LIVE',
        configuration: {},
        capabilities: { supportsInbound: true, supportsOutbound: true, supportsRealtime: true, supportsBatch: true },
        health: { failureCount: 0, latencyMs: 0, recordsProcessed: 0 },
        endpointReference: '',
        credentialReference: `secret://tenant/${tenantA}/connector/sap-live-test`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const status = await runtime.connect();
      expect(status).toBe('UNCONFIGURED');
    });
  });

  describe('4. Oracle SCM Cloud Adapter & Connector', () => {
    it('transforms Oracle Supplier REST payload to canonical supplier', () => {
      const rawOraSup = {
        SupplierId: 8877,
        SupplierName: 'Oracle SCM Logistics',
        SupplierNumber: 'SUP-ORA-8877',
        CurrencyCode: 'USD',
        EnabledFlag: 'Y',
      };
      const canonical = OracleAdapter.toCanonicalSupplier(rawOraSup, tenantA);
      expect(canonical.id).toBe('sup-ora-8877');
      expect(canonical.name).toBe('Oracle SCM Logistics');
      expect(canonical.code).toBe('SUP-ORA-8877');
      expect(canonical.status).toBe('ACTIVE');
    });
  });

  describe('5. ANSI X12 & EDIFACT Parser & Validation', () => {
    it('successfully parses valid ANSI X12 850 Purchase Order', () => {
      const payload = `ISA*00*          *00*          *ZZ*SUPPLIERCODE   *ZZ*ORION9HUB      *260921*1200*U*00401*000000850*0*P*>~\nST*850*0001~\nBEG*00*SA*PO-850-998877*20260921~\nSE*3*0001~`;
      const val = EDIParser.parseAndValidate(payload, tenantA, 'corr-edi-1');
      expect(val.isValid).toBe(true);
      expect(val.parsedMessage?.transactionType).toBe('850');
      expect(val.parsedMessage?.controlNumber).toBe('000000850');
    });

    it('fails validation on EDI message missing required ST header and routes error', () => {
      const invalidPayload = `ISA*00*          *00*          *ZZ*SUPPLIERCODE   *ZZ*ORION9HUB      *260921*1200*U*00401*000000850*0*P*>~\nINVALID_SEGMENT~`;
      const val = EDIParser.parseAndValidate(invalidPayload, tenantA, 'corr-edi-2');
      expect(val.isValid).toBe(false);
      expect(val.errors.some(e => e.includes('ST transaction set header'))).toBe(true);
    });

    it('enqueues invalid EDI message to DLQ during connector execution', async () => {
      const ediConn = new EDIConnector({
        connectorId: 'conn-edi-test-dlq',
        tenantId: tenantA,
        type: 'EDI',
        name: 'EDI Test Connector',
        version: '1.0.0',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        configuration: {},
        capabilities: { supportsInbound: true, supportsOutbound: true, supportsRealtime: false, supportsBatch: true },
        health: { failureCount: 0, latencyMs: 0, recordsProcessed: 0 },
        endpointReference: 'sftp://edi.test',
        credentialReference: `secret://tenant/${tenantA}/connector/conn-edi-test-dlq`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const badEdi = `BAD_EDI_PAYLOAD_NO_HEADER`;
      await expect(ediConn.send(badEdi)).rejects.toThrow(/EDI message syntax\/validation failed/);

      const dlq = integrationDLQ.listDLQ(tenantA);
      expect(dlq.some(msg => msg.connectorId === 'conn-edi-test-dlq')).toBe(true);
    });
  });

  describe('6. File Connector & Schema Parser', () => {
    it('parses CSV content and preserves row metadata and tenant context', () => {
      const csvContent = `SKU,Name,Category,UnitCost\nMAT-CSV-01,Steel Rod,Raw Materials,45.50\nMAT-CSV-02,Copper Wire,Components,120.00`;
      const res = FileAdapter.parseFile({
        filename: 'inventory_import.csv',
        format: 'CSV',
        content: csvContent,
      }, tenantA, 'corr-file-1');

      expect(res.totalRows).toBe(2);
      expect(res.records[0].rowNumber).toBe(1);
      expect(res.records[0].rawItem.SKU).toBe('MAT-CSV-01');
      expect(res.records[0].tenantId).toBe(tenantA);
    });
  });

  describe('7. Generic REST Connector HTTP Error Classification', () => {
    it('classifies 4xx errors as NON_RETRYABLE and 5xx/429 errors as RETRYABLE', () => {
      const restConn = new RESTConnector({
        connectorId: 'conn-rest-class-test',
        tenantId: tenantA,
        type: 'REST',
        name: 'REST Classifier Test',
        version: '1.0.0',
        status: 'CONNECTED',
        environment: 'SANDBOX',
        configuration: {},
        capabilities: { supportsInbound: true, supportsOutbound: true, supportsRealtime: true, supportsBatch: false },
        health: { failureCount: 0, latencyMs: 0, recordsProcessed: 0 },
        endpointReference: 'https://api.test.com',
        credentialReference: `secret://tenant/${tenantA}/connector/conn-rest-class-test`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const err401 = restConn.classifyHTTPError(401, 'Unauthorized', 'corr-401');
      expect(err401.classification).toBe('NON_RETRYABLE');

      const err429 = restConn.classifyHTTPError(429, 'Rate limit hit', 'corr-429');
      expect(err429.classification).toBe('RETRYABLE');

      const err503 = restConn.classifyHTTPError(503, 'Service unavailable', 'corr-503');
      expect(err503.classification).toBe('RETRYABLE');
    });
  });

  describe('8. Durable Sync Job Engine & Watermarking', () => {
    it('creates, executes, and completes sync job with watermark update', async () => {
      const job = await syncJobEngine.createAndRunSyncJob({
        tenantId: tenantA,
        connectorId: 'conn-sap-s4hana-01',
        entityType: 'PurchaseOrder',
        mode: 'INCREMENTAL',
        actor: 'Test Sync Operator',
      });

      expect(job.status).toBe('COMPLETED');
      expect(job.recordsRead).toBeGreaterThan(0);
      expect(job.watermark?.lastModifiedAt).toBeDefined();

      const jobsList = syncJobEngine.listSyncJobs(tenantA);
      expect(jobsList.some(j => j.syncJobId === job.syncJobId)).toBe(true);
    });

    it('enforces tenant boundary on sync job retrieval', () => {
      const jobsTenantA = syncJobEngine.listSyncJobs(tenantA);
      expect(jobsTenantA.length).toBeGreaterThan(0);
      const targetJobId = jobsTenantA[0].syncJobId;

      expect(() => {
        syncJobEngine.getSyncJob(targetJobId, tenantB);
      }).toThrow(/not authorized/);
    });
  });
});
