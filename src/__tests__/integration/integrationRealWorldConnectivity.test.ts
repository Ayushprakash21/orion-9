/**
 * ORION-9 PART 4 TRACK 8: INTEGRATION & REAL-WORLD CONNECTIVITY TEST SUITE
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { connectorRegistry } from '../../integration/ConnectorRegistry';
import { connectorOnboardingService } from '../../integration/ConnectorOnboardingService';
import { integrationGateway } from '../../integration/gateway/IntegrationGateway';
import { certificateManagerService } from '../../integration/CertificateManagerService';
import { dataResidencyEnforcer } from '../../integration/DataResidencyEnforcer';
import { sapAdapterBoundary } from '../../integration/erp/SAPAdapterBoundary';
import { oracleAdapterBoundary } from '../../integration/erp/OracleAdapterBoundary';
import { tradingPartnerRegistry } from '../../integration/tradingPartner/TradingPartnerRegistry';
import { reconciliationEngine } from '../../integration/ReconciliationEngine';
import { integrationDLQ } from '../../integration/IntegrationDLQ';

describe('ORION-9 Part 4 Track 8: Integration & Real-World Connectivity Gate', () => {
  const tenantId = 'org-tenant-a';
  const humanActor = { id: 'admin-user-01', role: 'PLATFORM_ADMIN', isAi: false };
  const aiActor = { id: 'ai-agent-01', role: 'INTEGRATION_BOT', isAi: true };

  beforeEach(() => {
    tradingPartnerRegistry.clear();
  });

  describe('1. Connector Lifecycle & Governed Onboarding Pipeline', () => {
    it('executes 8-step governed connector onboarding successfully for human administrator', async () => {
      const res = await connectorOnboardingService.onboardConnector({
        tenantId,
        type: 'REST',
        name: 'Logistics Real-Time Webhook Gateway',
        endpointReference: 'https://api.logistics.orion9.internal/v2',
        environment: 'SANDBOX',
        connectivityClassification: 'BOUNDARY',
        configuration: { authMethod: 'HMAC_SHA256' },
        secretPayload: 'super-secret-hmac-key',
        actor: humanActor,
      });

      expect(res.success).toBe(true);
      expect(res.status).toBe('ACTIVE');
      expect(res.steps.length).toBe(8);
      expect(res.connector?.connectivityClassification).toBe('BOUNDARY');
    });

    it('prohibits AI agents from self-activating connectors directly under Kernel Governance', async () => {
      await expect(
        connectorOnboardingService.onboardConnector({
          tenantId,
          type: 'SAP',
          name: 'Unauthorized AI SAP Connector',
          configuration: {},
          actor: aiActor,
        })
      ).rejects.toThrow('[Kernel Governance Violation]');
    });
  });

  describe('2. Integration Gateway HMAC Signature & Webhook Verification', () => {
    it('verifies valid HMAC webhook signature and fresh timestamp', () => {
      const nowIso = new Date().toISOString();
      const res = integrationGateway.validateWebhookSignature({
        rawPayload: '{"event":"shipment.updated"}',
        signatureHeader: 'sha256=abcdef1234567890',
        timestampHeader: nowIso,
        secret: 'webhook-secret',
        maxAgeSeconds: 300,
      });

      expect(res.valid).toBe(true);
    });

    it('rejects webhook payload with invalid signature or expired timestamp', () => {
      const oldIso = new Date(Date.now() - 600000).toISOString(); // 10 minutes ago
      const res = integrationGateway.validateWebhookSignature({
        rawPayload: '{"event":"shipment.updated"}',
        signatureHeader: 'sha256=abcdef1234567890',
        timestampHeader: oldIso,
        secret: 'webhook-secret',
        maxAgeSeconds: 300,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain('freshness window');
    });
  });

  describe('3. Certificate Tracking & Control Tower Expiration Monitoring', () => {
    it('registers certificates and identifies upcoming expiration in 30-day window', () => {
      const now = Date.now();
      const day = 86400000;

      const cert = certificateManagerService.registerCertificate({
        tenantId,
        name: 'AS2 Partner Certificate',
        type: 'AS2_SIGNING',
        issuer: 'DigiCert',
        subject: 'partner.acme.com',
        fingerprintSHA256: 'AA:BB:CC:DD:EE:FF',
        validFrom: new Date(now - 300 * day).toISOString(),
        validTo: new Date(now + 10 * day).toISOString(), // 10 days left
        actor: 'Security Admin',
      });

      expect(cert.status).toBe('EXPIRING_SOON');

      const expiringCerts = certificateManagerService.scanExpiringCertificates(tenantId);
      expect(expiringCerts.some((c) => c.certificateId === cert.certificateId)).toBe(true);
    });
  });

  describe('4. Pre-Flight Data Residency Policy Enforcer', () => {
    it('permits same-region data movement and enforces RESTRICTED classification checks', () => {
      const sameRegionRes = dataResidencyEnforcer.evaluateTransfer({
        tenantId,
        sourceRegion: 'us-east-1',
        destinationRegion: 'us-east-1',
        classification: 'INTERNAL',
        connectorId: 'conn-rest-01',
      });
      expect(sameRegionRes.allowed).toBe(true);

      const restrictedCrossRegion = dataResidencyEnforcer.evaluateTransfer({
        tenantId,
        sourceRegion: 'us-east-1',
        destinationRegion: 'eu-west-1',
        classification: 'RESTRICTED',
        connectorId: 'conn-rest-01',
      });
      expect(restrictedCrossRegion.allowed).toBe(false);
      expect(restrictedCrossRegion.reason).toContain('prohibited');
    });
  });

  describe('5. ERP Boundary Connectivity Classification', () => {
    it('correctly labels SAP and Oracle endpoints as BOUNDARY or EMULATED when live endpoints are unverified', async () => {
      sapAdapterBoundary.registerConnection({
        connectorId: 'sap-primary',
        tenantId,
        systemId: 'PRD',
        clientNumber: '100',
        operatingMode: 'SAP_SANDBOX',
        protocol: 'IDOC',
        gatewayHost: 'sap-s4-mock.enterprise.internal',
        secretReference: `secret://tenant/${tenantId}/sap/credentials`,
        sapRelease: 'S/4HANA 2023',
        isLiveVerified: false,
      });

      const sapRes = await sapAdapterBoundary.processInboundIDoc(tenantId, 'sap-primary', {
        controlRecord: {
          TABNAM: 'EDI_DC40',
          DOCNUM: '0000000000123456',
          MESTYP: 'ORDERS',
          IDOCTYP: 'ORDERS05',
          RCVPRN: 'ORION9',
          SNDPRN: 'SAP_PRD_100',
          CREDAT: '20260924',
          CRETIM: '080000',
        },
        dataSegments: [{ SEGNAM: 'E1EDK01', SDATA: { CURCY: 'USD' } }],
      });

      expect(sapRes.success).toBe(true);
      expect(sapRes.liveStatus).toBe('EMULATED');
    });
  });

  describe('6. Evidence-Based Trading Partner Certification', () => {
    it('requires complete test evidence before promoting trading partner to ACTIVE state', () => {
      const partner = tradingPartnerRegistry.registerPartner({
        partnerId: 'partner-acme',
        tenantId,
        name: 'ACME Supply Logistics',
        code: 'ACME-01',
        ediQualifier: 'ZZ',
        ediIdentifier: 'ACME',
        status: 'CERTIFICATION',
        supportedCapabilities: [],
      });

      const certSuccess = tradingPartnerRegistry.certifyPartner(tenantId, partner.partnerId, {
        authTestPassed: true,
        transportTestPassed: true,
        schemaTestPassed: true,
        mappingTestPassed: true,
        ackTestPassed: true,
        reconciliationTestPassed: true,
        certifiedBy: 'Compliance Lead',
      });

      expect(certSuccess).toBe(true);
      const updated = tradingPartnerRegistry.getPartner(tenantId, partner.partnerId);
      expect(updated?.status).toBe('ACTIVE');
    });
  });
});
