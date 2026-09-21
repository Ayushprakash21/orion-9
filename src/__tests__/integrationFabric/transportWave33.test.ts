/**
 * ORION-9 WAVE 3.3 — PRODUCTION INTEGRATION TRANSPORT & TRADING PARTNER FABRIC TESTS
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TransportRegistry } from '../../integration/transport/TransportRegistry';
import { HTTPSTransport } from '../../integration/transport/HTTPSTransport';
import { WebhookIngress } from '../../integration/transport/WebhookIngress';
import { SFTPTransport } from '../../integration/transport/SFTPTransport';
import { AS2Transport } from '../../integration/transport/AS2Transport';
import { FileTransport } from '../../integration/transport/FileTransport';
import { TradingPartnerRegistry } from '../../integration/tradingPartner/TradingPartnerRegistry';
import { PartnerMappingEngine } from '../../integration/tradingPartner/PartnerMappingEngine';
import { AcknowledgementManager } from '../../integration/tradingPartner/AcknowledgementManager';
import { MessageLifecycleManager } from '../../integration/messaging/MessageLifecycleManager';
import { ReplayProtection } from '../../integration/messaging/ReplayProtection';
import { IntegrationScheduler } from '../../integration/scheduling/IntegrationScheduler';
import { IncidentManager } from '../../integration/incidents/IncidentManager';
import { IntegrationTelemetry } from '../../integration/observability/IntegrationTelemetry';
import { credentialVaultService } from '../../integration/CredentialVaultService';

describe('Orion-9 Wave 3.3 — Transport & Trading Partner Fabric', () => {
  const tenantA = 'org-tenant-a';
  const tenantB = 'org-tenant-b';

  beforeEach(() => {
    TransportRegistry.getInstance().clear();
    TradingPartnerRegistry.getInstance().clear();
    PartnerMappingEngine.getInstance().clear();
    AcknowledgementManager.getInstance().clear();
    MessageLifecycleManager.getInstance().clear();
    ReplayProtection.getInstance().clear();
    IntegrationScheduler.getInstance().clear();
    IncidentManager.getInstance().clear();
  });

  // 1. Transport Registry & Abstraction
  describe('TransportRegistry & Tenant Isolation', () => {
    it('registers and retrieves transports with strict tenant separation', () => {
      const registry = TransportRegistry.getInstance();

      const httpsTransportA = new HTTPSTransport({
        transportId: 'trans-https-1',
        tenantId: tenantA,
        connectorId: 'conn-rest-1',
        name: 'ERP REST API',
        config: { baseUrl: 'https://api.erp.example.com' },
      });

      const httpsTransportB = new HTTPSTransport({
        transportId: 'trans-https-2',
        tenantId: tenantB,
        connectorId: 'conn-rest-2',
        name: 'Supplier REST Portal',
        config: { baseUrl: 'https://api.supplier.example.com' },
      });

      registry.registerTransport(httpsTransportA);
      registry.registerTransport(httpsTransportB);

      expect(registry.getTransport(tenantA, 'trans-https-1')).toBeDefined();
      expect(registry.getTransport(tenantA, 'trans-https-2')).toBeUndefined();
      expect(registry.getTransport(tenantB, 'trans-https-2')).toBeDefined();

      expect(registry.listTransports(tenantA).length).toBe(1);
      expect(registry.listTransports(tenantB).length).toBe(1);
    });
  });

  // 2. HTTPS Transport & Vault Security
  describe('HTTPSTransport & Credential Resolution', () => {
    it('fails connection test when credential reference cannot be resolved from vault', async () => {
      const transport = new HTTPSTransport({
        transportId: 'trans-https-auth',
        tenantId: tenantA,
        connectorId: 'conn-rest-auth',
        name: 'Secure REST Endpoint',
        config: { baseUrl: 'https://secure.api.example.com' },
        credentialRef: 'secret://tenant/org-tenant-a/non-existent-secret',
      });

      const res = await transport.testConnection();
      expect(res.success).toBe(false);
      expect(res.status).toBe('AUTH_FAILED');
      expect(res.errorCode).toBe('CREDENTIAL_NOT_FOUND');
    });

    it('connects and sends payload securely when credentials resolve', async () => {
      const credRef = 'secret://tenant/org-tenant-a/api-token';
      credentialVaultService.storeCredentials(credRef, tenantA, {
        authType: 'API_KEY',
        apiKey: 'valid-bearer-token',
      });

      const transport = new HTTPSTransport({
        transportId: 'trans-https-valid',
        tenantId: tenantA,
        connectorId: 'conn-rest-valid',
        name: 'Valid REST Endpoint',
        config: { baseUrl: 'https://secure.api.example.com' },
        credentialRef: credRef,
      });

      const connRes = await transport.testConnection();
      expect(connRes.success).toBe(true);
      expect(connRes.status).toBe('CONNECTED');

      const sendRes = await transport.send({ payload: { poNumber: 'PO-9901' } });
      expect(sendRes.success).toBe(true);
      expect(sendRes.statusCode).toBe(200);
      expect(transport.telemetry.totalMessagesSent).toBe(1);
    });
  });

  // 3. Webhook Ingress
  describe('WebhookIngress Security Validation', () => {
    it('validates HMAC SHA-256 signature and rejects timestamp replay attacks', async () => {
      const secretRef = 'secret://tenant/org-tenant-a/webhook-secret';
      credentialVaultService.storeCredentials(secretRef, tenantA, {
        authType: 'API_KEY',
        apiKey: 'my-webhook-secret-key',
      });

      const webhook = new WebhookIngress({
        transportId: 'trans-webhook-1',
        tenantId: tenantA,
        connectorId: 'conn-webhook-1',
        name: 'Inbound EDI Webhook',
        credentialRef: secretRef,
      });

      const rawBody = JSON.stringify({ event: 'ASN_CREATED', asnId: 'ASN-1029' });

      // Valid webhook test
      const validRes = await webhook.validateWebhookRequest(
        {
          'x-orion-timestamp': new Date().toISOString(),
          'x-orion-nonce': 'nonce-12345',
        },
        rawBody,
        tenantA
      );
      expect(validRes.valid).toBe(true);

      // Replay attack test (same nonce)
      const replayRes = await webhook.validateWebhookRequest(
        {
          'x-orion-timestamp': new Date().toISOString(),
          'x-orion-nonce': 'nonce-12345',
        },
        rawBody,
        tenantA
      );
      expect(replayRes.valid).toBe(false);
      expect(replayRes.error).toContain('Replay attack detected');

      // Tenant mismatch test
      const tenantMismatchRes = await webhook.validateWebhookRequest(
        { 'x-orion-timestamp': new Date().toISOString() },
        rawBody,
        tenantB
      );
      expect(tenantMismatchRes.valid).toBe(false);
      expect(tenantMismatchRes.error).toBe('Tenant mismatch');
    });
  });

  // 4. SFTP Transport & Checksum
  describe('SFTPTransport & Checksum Engine', () => {
    it('transfers files and computes SHA-256 checksums correctly', async () => {
      const sftpSecretRef = 'secret://tenant/org-tenant-a/sftp-key';
      credentialVaultService.storeCredentials(sftpSecretRef, tenantA, {
        authType: 'SSH_KEY',
        privateKey: 'ssh-private-key',
      });

      const sftp = new SFTPTransport({
        transportId: 'trans-sftp-1',
        tenantId: tenantA,
        connectorId: 'conn-sftp-1',
        name: 'Vendor SFTP Directory',
        sftpConfig: {
          host: 'sftp.vendor.com',
          port: 22,
          username: 'orion_client',
          authMethod: 'PRIVATE_KEY',
          secretRef: sftpSecretRef,
          remoteDirectory: '/inbound',
        },
      });

      const conn = await sftp.connect();
      expect(conn.success).toBe(true);

      const sendRes = await sftp.send({ payload: 'ISA*00*...~', destinationPath: '/inbound/po_850.edi' });
      expect(sendRes.success).toBe(true);

      const receiveRes = await sftp.receive({ sourcePath: '/inbound' });
      expect(receiveRes.success).toBe(true);
      expect(receiveRes.messages.length).toBe(1);

      const checksum = sftp.calculateChecksum('po_850.edi', 'ISA*00*...~');
      expect(checksum.isValid).toBe(true);
      expect(checksum.algorithm).toBe('SHA256');
    });
  });

  // 5. AS2 Transport & MDN Verification
  describe('AS2Transport & MDN Verification', () => {
    it('calculates MIC and validates AS2 MDN responses', async () => {
      const certRef = 'secret://tenant/org-tenant-a/as2-cert';
      credentialVaultService.storeCredentials(certRef, tenantA, {
        authType: 'CERTIFICATE',
        privateKey: 'BEGIN CERTIFICATE...',
      });

      const as2 = new AS2Transport({
        transportId: 'trans-as2-1',
        tenantId: tenantA,
        connectorId: 'conn-as2-1',
        name: 'Walmart AS2 Gateway',
        as2Config: {
          as2From: 'ORION_CORP',
          as2To: 'WALMART_HQ',
          targetUrl: 'https://as2.walmart.com/receive',
          signingCertRef: certRef,
          mdnRequired: true,
        },
      });

      const conn = await as2.testConnection();
      expect(conn.success).toBe(true);

      const sendRes = await as2.send({ payload: 'EDI-FACT-INVOICE' });
      expect(sendRes.success).toBe(true);

      const mic = as2.calculateMIC('EDI-FACT-INVOICE');
      const mdn = JSON.parse(sendRes.rawResponse!);
      const isVerified = as2.verifyMDN(sendRes.messageId, mdn, mic);
      expect(isVerified).toBe(true);
    });
  });


  // 6. File Transport & Deduplication
  describe('FileTransport Engine', () => {
    it('deduplicates incoming files based on SHA-256 checksum', async () => {
      const fileTrans = new FileTransport({
        transportId: 'trans-file-1',
        tenantId: tenantA,
        connectorId: 'conn-file-1',
        name: 'Local Hot Folder',
        config: {
          incomingDir: '/data/in',
          archiveDir: '/data/archive',
        },
      });

      fileTrans.injectIncomingFile('order1.xml', '<order>1001</order>');
      const receive1 = await fileTrans.receive({ sourcePath: '/data/in' });
      expect(receive1.messages.length).toBe(1);

      // Re-inject identical content
      fileTrans.injectIncomingFile('order1_dup.xml', '<order>1001</order>');
      const receive2 = await fileTrans.receive({ sourcePath: '/data/in' });
      expect(receive2.messages.length).toBe(0); // Deduplicated!
    });
  });

  // 7. Trading Partner Registry
  describe('TradingPartnerRegistry', () => {
    it('manages trading partner records and qualifiers per tenant', () => {
      const registry = TradingPartnerRegistry.getInstance();

      const partner = registry.registerPartner({
        partnerId: 'partner-acme',
        tenantId: tenantA,
        name: 'Acme Logistics',
        code: 'ACME-01',
        ediQualifier: 'ZZ',
        ediIdentifier: 'ACMELOGISTICS',
        status: 'ACTIVE',
        supportedCapabilities: [
          {
            transactionType: '850',
            direction: 'INBOUND',
            transportId: 'trans-sftp-1',
            mappingContractId: 'contract-850',
            active: true,
          },
        ],
      });

      expect(partner.status).toBe('ACTIVE');

      const found = registry.getPartnerByEDI(tenantA, 'ZZ', 'ACMELOGISTICS');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Acme Logistics');

      const notFoundOtherTenant = registry.getPartnerByEDI(tenantB, 'ZZ', 'ACMELOGISTICS');
      expect(notFoundOtherTenant).toBeUndefined();
    });
  });

  // 8. Partner Mapping Engine
  describe('PartnerMappingEngine', () => {
    it('applies partner-specific mapping overrides to raw payloads', () => {
      const mappingEngine = PartnerMappingEngine.getInstance();

      mappingEngine.registerPartnerMapping(tenantA, 'partner-acme', 'PurchaseOrder', [
        { sourceField: 'vendor_po_num', orionField: 'poNumber', rule: 'TRIM' },
        { sourceField: 'total_amt', orionField: 'totalValue', rule: 'NUMERIC_PARSE' },
        { sourceField: 'status_code', orionField: 'status', rule: 'LOOKUP_MAP', lookupTable: { '01': 'Approved', '02': 'Draft' } },
      ]);

      const baseContract = {
        id: 'contract-po',
        name: 'Base PO Contract',
        sourceSystem: 'EDI' as any,
        sourceSystemVersion: '4010',
        entityType: 'PurchaseOrder' as any,
        direction: 'INBOUND' as any,
        classification: 'RESTRICTED' as any,
        mappings: [],
        version: '1.0',
        active: true,
        lastUpdated: new Date().toISOString(),
      };

      const result = mappingEngine.applyPartnerMapping(tenantA, 'partner-acme', 'PurchaseOrder', baseContract, {
        vendor_po_num: ' PO-8899  ',
        total_amt: '15000.50',
        status_code: '01',
      });

      expect(result.poNumber).toBe('PO-8899');
      expect(result.totalValue).toBe(15000.5);
      expect(result.status).toBe('Approved');
    });
  });

  // 9. EDI Acknowledgement Manager
  describe('AcknowledgementManager', () => {
    it('generates 997 and 999 functional acknowledgements', () => {
      const ackManager = AcknowledgementManager.getInstance();

      const ack997 = ackManager.generate997Ack({
        tenantId: tenantA,
        originalMessageId: 'MSG-850-101',
        controlNumber: '000000501',
        senderId: 'ACMELOGISTICS',
        receiverId: 'ORION_CORP',
        accepted: true,
      });

      expect(ack997.ackType).toBe('TRANSPORT_997');
      expect(ack997.status).toBe('ACCEPTED');
      expect(ack997.generatedPayload).toContain('AK5*A');

      const ack999 = ackManager.generate999Ack({
        tenantId: tenantA,
        originalMessageId: 'MSG-850-101',
        controlNumber: '000000501',
        accepted: false,
        errors: [{ code: 'INVALID_QUANTITY', message: 'Line item 2 missing quantity' }],
      });

      expect(ack999.ackType).toBe('FUNCTIONAL_999');
      expect(ack999.status).toBe('REJECTED');
      expect(ack999.errorDetails?.length).toBe(1);
    });
  });

  // 10. Durable Message Lifecycle & Replay Protection
  describe('MessageLifecycleManager & ReplayProtection', () => {
    it('tracks state transitions and prevents duplicate message ingestion', () => {
      const msgManager = MessageLifecycleManager.getInstance();
      const replay = ReplayProtection.getInstance();

      const isDupInitial = replay.isDuplicate({
        tenantId: tenantA,
        partnerId: 'partner-acme',
        controlNumber: 'CTRL-9988',
      });
      expect(isDupInitial.duplicate).toBe(false);

      const msg = msgManager.createMessage({
        tenantId: tenantA,
        partnerId: 'partner-acme',
        controlNumber: 'CTRL-9988',
        idempotencyKey: 'idemp-key-9988',
        direction: 'INBOUND',
        rawPayload: 'RAW-EDI-DATA',
      });

      replay.recordMessage({
        tenantId: tenantA,
        messageId: msg.messageId,
        partnerId: 'partner-acme',
        controlNumber: 'CTRL-9988',
        idempotencyKey: 'idemp-key-9988',
      });

      // Attempting duplicate check
      const isDup = replay.isDuplicate({
        tenantId: tenantA,
        partnerId: 'partner-acme',
        controlNumber: 'CTRL-9988',
      });
      expect(isDup.duplicate).toBe(true);
      expect(isDup.originalMessageId).toBe(msg.messageId);

      // State progression
      msgManager.updateState(tenantA, msg.messageId, 'VALIDATING', 'Validating EDI structure');
      msgManager.updateState(tenantA, msg.messageId, 'MAPPED', 'Mapped to Canonical PO');
      const finalMsg = msgManager.updateState(tenantA, msg.messageId, 'COMPLETED', 'Dispatched to Kernel');

      expect(finalMsg?.state).toBe('COMPLETED');
      expect(finalMsg?.stateHistory.length).toBe(4);
    });
  });

  // 11. Integration Scheduler & Incidents & Telemetry
  describe('IntegrationScheduler, IncidentManager & Telemetry', () => {
    it('manages schedules, reports incidents, and aggregates telemetry summary', () => {
      const scheduler = IntegrationScheduler.getInstance();
      const incidents = IncidentManager.getInstance();
      const telemetry = IntegrationTelemetry.getInstance();

      // Create schedule
      const sched = scheduler.createSchedule({
        tenantId: tenantA,
        name: 'Hourly SAP PO Sync',
        connectorId: 'conn-sap-1',
        type: 'CRON',
        cronExpression: '0 * * * *',
      });

      const trigRes = scheduler.triggerSchedule(tenantA, sched.scheduleId);
      expect(trigRes.success).toBe(true);

      // Report incident
      const inc = incidents.reportIncident({
        tenantId: tenantA,
        connectorId: 'conn-sap-1',
        severity: 'HIGH',
        category: 'CONNECTIVITY',
        title: 'SAP Host unreachable',
        description: 'Connection timed out on port 3300',
      });

      expect(inc.status).toBe('OPEN');

      incidents.resolveIncident(tenantA, inc.incidentId, 'user-admin-1');
      expect(incidents.getIncident(tenantA, inc.incidentId)?.status).toBe('RESOLVED');

      // Telemetry Summary Check
      const summary = telemetry.getTenantSummary(tenantA);
      expect(summary.tenantId).toBe(tenantA);
      expect(typeof summary.totalTransports).toBe('number');
      expect(typeof summary.totalTradingPartners).toBe('number');
    });
  });
});
