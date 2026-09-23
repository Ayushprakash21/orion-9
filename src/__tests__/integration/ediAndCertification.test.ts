import { describe, it, expect, beforeEach } from 'vitest';
import { ediFabric } from '../../integration/edi/EDIFabric';
import { secureTransportBoundary } from '../../integration/edi/SecureTransportBoundary';
import { tradingPartnerRegistry } from '../../integration/tradingPartner/TradingPartnerRegistry';
import { integrationCertificationService } from '../../integration/partner/IntegrationCertificationService';
import { integrationReconciliationService } from '../../integration/reconciliation/IntegrationReconciliationService';

describe('Wave 11: Production EDI Fabric, Certification & Reconciliation', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    tradingPartnerRegistry.clear();
    integrationCertificationService.clear();
    integrationReconciliationService.clear();
  });

  it('1. EDIFabric parses raw X12 850 Purchase Order and validates control envelope symmetry', () => {
    const raw850 = ediFabric.generateSample850('PO-TEST-850', 'ORION9', 'ACME_SUPPLY');
    const parseResult = ediFabric.parseX12(raw850);

    expect(parseResult.isValid).toBe(true);
    expect(parseResult.errors.length).toBe(0);
    expect(parseResult.envelope?.transactionType).toBe('850');
    expect(parseResult.envelope?.parsedData.orderNumber).toBe('PO-TEST-850');
    expect(parseResult.envelope?.parsedData.lineItems.length).toBe(2);
  });

  it('2. EDIFabric detects corrupted control number mismatches', () => {
    // Generate valid 850 then tamper with IEA control number
    const raw850 = ediFabric.generateSample850('PO-CORRUPT', 'ORION9', 'ACME_SUPPLY');
    const tampered = raw850.replace(/IEA\*1\*(\d+)/, 'IEA*1*000000000'); // Wrong IEA control number

    const parseResult = ediFabric.parseX12(tampered);
    expect(parseResult.isValid).toBe(false);
    expect(parseResult.errors.some(e => e.includes('Interchange Control Number mismatch'))).toBe(true);
  });

  it('3. EDIFabric generates compliant 997 Functional Acknowledgment', () => {
    const raw850 = ediFabric.generateSample850('PO-997-TEST', 'ORION9', 'ACME_SUPPLY');
    const parseResult = ediFabric.parseX12(raw850);
    expect(parseResult.envelope).toBeDefined();

    const ack997 = ediFabric.generate997(parseResult.envelope!, 'A');
    expect(ack997.acknowledgmentCode).toBe('A');
    expect(ack997.raw997).toContain('ST*997*0001~');
    expect(ack997.raw997).toContain('AK9*A*1*1*1~');
  });

  it('4. SecureTransportBoundary packages AS2 envelope and processes MDN receipts', () => {
    const rawPayload = 'Sample EDI Payload for AS2 Transport';
    const as2Env = secureTransportBoundary.packageAS2Envelope({
      as2From: 'ORION9_AS2_ID',
      as2To: 'PARTNER_GLOBAL_AS2',
      ediPayload: rawPayload
    });

    expect(as2Env.messageId).toMatch(/@enterprise\.internal>$/);
    expect(as2Env.micHash).toMatch(/^sha256-/);

    // Process synchronous MDN
    const mdn = secureTransportBoundary.processInboundAS2(as2Env);
    expect(mdn.disposition).toBe('processed');
    expect(mdn.micVerified).toBe(true);
    expect(mdn.rawMdn).toContain('Disposition: automatic-action/MDN-sent-automatically; processed');
  });

  it('5. IntegrationCertificationService runs the 8-point automated compliance suite and promotes partner to ACTIVE', async () => {
    tradingPartnerRegistry.registerPartner({
      partnerId: 'PARTNER-TEST-CERT',
      tenantId,
      name: 'Test Certification Partner',
      code: 'TCP',
      ediQualifier: 'ZZ',
      ediIdentifier: 'TCP001',
      status: 'ONBOARDING',
      certificateReference: 'cert://vault/demo-tenant/tcp-cert',
      supportedCapabilities: []
    });

    const report = await integrationCertificationService.executeCertification(tenantId, 'PARTNER-TEST-CERT', 'admin');

    expect(report.gates.length).toBe(8);
    expect(report.overallPassed).toBe(true);
    expect(report.overallScore).toBe(100);
    expect(report.statusBefore).toBe('ONBOARDING');
    expect(report.statusAfter).toBe('ACTIVE');

    const updated = tradingPartnerRegistry.getPartner(tenantId, 'PARTNER-TEST-CERT');
    expect(updated?.status).toBe('ACTIVE');
  });

  it('6. IntegrationReconciliationService detects discrepancies and computes financial exposure', () => {
    const orionOrders = [
      { id: 'PO-101', amount: 15000, quantity: 100, status: 'OPEN' },
      { id: 'PO-102', amount: 45000, quantity: 200, status: 'OPEN' }, // Amount variance
      { id: 'PO-103', amount: 10000, quantity: 50, status: 'OPEN' }   // Missing in external
    ];

    const erpOrders = [
      { id: 'PO-101', amount: 15000, quantity: 100, status: 'OPEN' },
      { id: 'PO-102', amount: 40000, quantity: 200, status: 'OPEN' } // $5,000 difference
    ];

    const runSummary = integrationReconciliationService.executeReconciliationRun({
      tenantId,
      externalSystem: 'SAP',
      partnerOrInstanceId: 'PRD_100',
      entityType: 'PURCHASE_ORDER',
      orionRecords: orionOrders,
      externalRecords: erpOrders
    });

    expect(runSummary.totalChecked).toBe(3);
    expect(runSummary.matchedCount).toBe(1);
    expect(runSummary.discrepancyCount).toBe(2);
    expect(runSummary.totalFinancialExposureUsd).toBe(15000); // 5000 amount diff + 10000 missing
  });
});
