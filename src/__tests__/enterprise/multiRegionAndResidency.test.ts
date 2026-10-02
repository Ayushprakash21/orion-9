import { describe, it, expect, beforeEach } from 'vitest';
import { regionRegistry, RegionDefinition } from '../../enterprise/region/RegionRegistry';
import { regionHealthService } from '../../enterprise/region/RegionHealthService';
import { regionRoutingService } from '../../enterprise/region/RegionRoutingService';
import { dataResidencyPolicyEngine } from '../../enterprise/residency/DataResidencyPolicyEngine';

describe('Wave 11: Multi-Region Runtime Architecture & Sovereign Residency', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    // Reset to defaults
    regionRegistry.clear();
    const now = new Date().toISOString();
    regionRegistry.registerRegion({
      regionId: 'reg-us-east',
      name: 'US East',
      cloudProvider: 'GCP',
      providerRegion: 'us-east4',
      role: 'PRIMARY',
      status: 'ACTIVE',
      sovereigntyJurisdiction: 'US_DOMESTIC',
      runtimeVerificationStatus: 'SIMULATED',
      endpointUrl: 'https://gateway-useast.internal',
      capabilities: { eventBroker: true, jobExecution: true, storagePersistence: true, erpConnectorGateway: true, ediTranslator: true },
      capacity: { maxRps: 10000, currentRps: 1000, maxConcurrentJobs: 100, activeWorkers: 10 },
      healthMetrics: { latencyP95Ms: 20, errorRatePercent: 0.01, lastHeartbeat: now },
      allowedTenantTiers: ['ENTERPRISE_GLOBAL'],
      createdAt: now,
      updatedAt: now
    });
    regionRegistry.registerRegion({
      regionId: 'reg-eu-central',
      name: 'EU Central',
      cloudProvider: 'GCP',
      providerRegion: 'europe-west3',
      role: 'SECONDARY',
      status: 'ACTIVE',
      sovereigntyJurisdiction: 'EU_GDPR',
      runtimeVerificationStatus: 'SIMULATED',
      endpointUrl: 'https://gateway-eucentral.internal',
      capabilities: { eventBroker: true, jobExecution: true, storagePersistence: true, erpConnectorGateway: true, ediTranslator: true },
      capacity: { maxRps: 10000, currentRps: 800, maxConcurrentJobs: 100, activeWorkers: 8 },
      healthMetrics: { latencyP95Ms: 25, errorRatePercent: 0.01, lastHeartbeat: now },
      allowedTenantTiers: ['ENTERPRISE_GLOBAL'],
      createdAt: now,
      updatedAt: now
    });
    regionRegistry.registerRegion({
      regionId: 'reg-us-west-dr',
      name: 'US West DR',
      cloudProvider: 'GCP',
      providerRegion: 'us-west1',
      role: 'DISASTER_RECOVERY',
      status: 'ACTIVE',
      sovereigntyJurisdiction: 'US_DOMESTIC',
      runtimeVerificationStatus: 'SIMULATED',
      endpointUrl: 'https://gateway-uswest-dr.internal',
      capabilities: { eventBroker: true, jobExecution: true, storagePersistence: true, erpConnectorGateway: true, ediTranslator: true },
      capacity: { maxRps: 10000, currentRps: 50, maxConcurrentJobs: 100, activeWorkers: 4 },
      healthMetrics: { latencyP95Ms: 15, errorRatePercent: 0.0, lastHeartbeat: now },
      allowedTenantTiers: ['ENTERPRISE_GLOBAL'],
      createdAt: now,
      updatedAt: now
    });
  });

  it('1. RegionRegistry tracks regions and updates operating states', () => {
    const list = regionRegistry.listRegions();
    expect(list.length).toBe(3);

    const primary = regionRegistry.getPrimaryRegion();
    expect(primary?.regionId).toBe('reg-us-east');

    regionRegistry.updateRegionStatus('reg-us-east', 'DEGRADED');
    expect(regionRegistry.getRegion('reg-us-east')?.status).toBe('DEGRADED');
  });

  it('2. RegionHealthService detects latency and error rate SLO violations', () => {
    // Normal health
    const initial = regionHealthService.assessRegion('reg-us-east');
    expect(initial?.isHealthy).toBe(true);

    // Simulate high latency & high error rate
    regionRegistry.updateRegionHealth('reg-us-east', {
      latencyP95Ms: 380, // Threshold 250ms
      errorRatePercent: 3.5 // Threshold 2.0%
    });

    const degraded = regionHealthService.assessRegion('reg-us-east');
    expect(degraded?.isHealthy).toBe(false);
    expect(degraded?.breachedSlo).toBe(true);
    expect(degraded?.assessmentReasons.length).toBeGreaterThanOrEqual(2);
  });

  it('3. RegionRoutingService respects sovereign jurisdiction and diverts on degradation', () => {
    // Routing with strict EU sovereignty constraint
    const euDecision = regionRoutingService.resolveTargetRegion({
      tenantId,
      requiredSovereignty: 'EU_GDPR',
      operationType: 'READ'
    });
    expect(euDecision.targetRegionId).toBe('reg-eu-central');
    expect(euDecision.sovereigntyCompliant).toBe(true);

    // Routing with preferred region that fails sovereignty throws error
    expect(() => {
      regionRoutingService.resolveTargetRegion({
        tenantId,
        preferredRegionId: 'reg-us-east',
        requiredSovereignty: 'EU_GDPR',
        operationType: 'WRITE'
      });
    }).toThrow(/Sovereignty mismatch/);

    // Routing when primary region goes OFFLINE with failover enabled
    regionRegistry.updateRegionStatus('reg-us-east', 'OFFLINE');
    const failoverDecision = regionRoutingService.resolveTargetRegion({
      tenantId,
      preferredRegionId: 'reg-us-east',
      requiredSovereignty: 'US_DOMESTIC',
      operationType: 'WRITE',
      allowCrossRegionFailover: true
    });
    expect(failoverDecision.routingMode).toBe('FAILOVER_DIVERTED');
    expect(failoverDecision.targetRegionId).toBe('reg-us-west-dr');
  });

  it('4. DataResidencyPolicyEngine blocks STRICT_SOVEREIGN transfers across borders', () => {
    const sensitiveRecord = {
      customerId: 'CUST-9921',
      fullName: 'Hans Schmidt',
      iban: 'DE89370400440532013000',
      email: 'hans@enterprise.de'
    };

    // Attempt transfer from EU to US East
    const evalResult = dataResidencyPolicyEngine.evaluateTransfer({
      tenantId,
      entityType: 'CUSTOMER_PII',
      sourceRegionId: 'reg-eu-central',
      destinationRegionId: 'reg-us-east',
      payload: sensitiveRecord
    });

    expect(evalResult.allowed).toBe(false);
    expect(evalResult.boundaryType).toBe('STRICT_SOVEREIGN');
    expect(evalResult.violationReason).toContain('Cross-border transfer blocked');
  });

  it('5. DataResidencyPolicyEngine redacts restricted fields on CONDITIONAL_TRANSFER', () => {
    const orderData = {
      orderId: 'PO-9001',
      totalAmount: 50000,
      internalCostMargin: 0.35,
      supplierRebatePercentage: 0.08,
      items: ['PART-A', 'PART-B']
    };

    const evalResult = dataResidencyPolicyEngine.evaluateTransfer({
      tenantId,
      entityType: 'PURCHASE_ORDER',
      sourceRegionId: 'reg-us-east',
      destinationRegionId: 'reg-eu-central',
      payload: orderData
    });

    expect(evalResult.allowed).toBe(true);
    expect(evalResult.requiresRedaction).toBe(true);
    expect(evalResult.sanitizedPayload.internalCostMargin).toBe('[REDACTED_BY_SOVEREIGN_RESIDENCY_POLICY]');
    expect(evalResult.sanitizedPayload.supplierRebatePercentage).toBe('[REDACTED_BY_SOVEREIGN_RESIDENCY_POLICY]');
    expect(evalResult.sanitizedPayload.totalAmount).toBe(50000); // Unrestricted
  });

  it('6. Intra-region transfer is always permitted without modifications', () => {
    const payload = { test: 123, internalCostMargin: 0.5 };
    const evalResult = dataResidencyPolicyEngine.evaluateTransfer({
      tenantId,
      entityType: 'PURCHASE_ORDER',
      sourceRegionId: 'reg-us-east',
      destinationRegionId: 'reg-us-east',
      payload
    });

    expect(evalResult.allowed).toBe(true);
    expect(evalResult.sanitizedPayload.internalCostMargin).toBe(0.5);
  });

  describe('10-Point Data Residency Verification Matrix', () => {
    it('Point 1: Sensitive + explicit allow policy → allowed: true', () => {
      const itarPayload = {
        assemblyId: 'ITAR-774',
        cadDrawingUrl: 'https://vault.internal/cad/774.dwg',
        clearanceLevel: 'TOP_SECRET'
      };
      // pol-itar-defense allows reg-us-east and reg-us-west-dr
      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'ITAR_ASSEMBLY',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-us-west-dr',
        payload: itarPayload,
        dataClassification: 'RESTRICTED'
      });
      expect(result.allowed).toBe(true);
      expect(result.policyId).toBe('pol-itar-defense');
      expect(result.boundaryType).toBe('STRICT_SOVEREIGN');
    });

    it('Point 2: Sensitive + explicit deny policy → allowed: false (STRICT_SOVEREIGN)', () => {
      const piiPayload = {
        customerId: 'CUST-001',
        iban: 'DE1234567890',
        passportNumber: 'N1234567'
      };
      // pol-gdpr-strict only allows reg-eu-central
      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'CUSTOMER_PII',
        sourceRegionId: 'reg-eu-central',
        destinationRegionId: 'reg-us-east',
        payload: piiPayload,
        dataClassification: 'CONFIDENTIAL'
      });
      expect(result.allowed).toBe(false);
      expect(result.boundaryType).toBe('STRICT_SOVEREIGN');
      expect(result.policyId).toBe('pol-gdpr-strict');
      expect(result.violationReason).toContain('Cross-border transfer blocked');
    });

    it('Point 3: Sensitive + conditional policy passing → allowed: true, redacted', () => {
      const sensitiveOrder = {
        orderId: 'PO-301',
        internalCostMargin: 0.42,
        supplierRebatePercentage: 0.15,
        publicPartNumber: 'PART-99'
      };
      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'PURCHASE_ORDER',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-eu-central',
        payload: sensitiveOrder
      });
      expect(result.allowed).toBe(true);
      expect(result.requiresRedaction).toBe(true);
      expect(result.sanitizedPayload.internalCostMargin).toBe('[REDACTED_BY_SOVEREIGN_RESIDENCY_POLICY]');
      expect(result.sanitizedPayload.supplierRebatePercentage).toBe('[REDACTED_BY_SOVEREIGN_RESIDENCY_POLICY]');
      expect(result.sanitizedPayload.publicPartNumber).toBe('PART-99');
    });

    it('Point 4: Sensitive + conditional policy failing → allowed: false', () => {
      // Register conditional policy with restricted allowed destinations
      dataResidencyPolicyEngine.registerPolicy({
        policyId: 'pol-conditional-sg-only',
        tenantId,
        name: 'Singapore Only Conditional Policy',
        boundaryType: 'CONDITIONAL_TRANSFER',
        sovereignJurisdiction: 'APAC_SG',
        applicableEntities: ['RESTRICTED_TELEMETRY'],
        restrictedFields: ['tokenSecret'],
        allowedDestinationRegions: ['reg-apac-sg'],
        enforceFailClosed: true,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'RESTRICTED_TELEMETRY',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-eu-central', // Not in allowed destination regions
        payload: { tokenSecret: 'xyz123' },
        isSensitive: true
      });
      expect(result.allowed).toBe(false);
      expect(result.violationReason).toContain('not approved for conditional transfer');
    });

    it('Point 5: Sensitive + NO matching policy → allowed: false (DEFAULT_FAIL_CLOSED_NO_POLICY)', () => {
      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'UNKNOWN_SECRET_CONTRACT_V1',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-eu-central',
        payload: { secretContent: 'classified' },
        dataClassification: 'RESTRICTED'
      });
      expect(result.allowed).toBe(false);
      expect(result.policyId).toBe('DEFAULT_FAIL_CLOSED_NO_POLICY');
      expect(result.boundaryType).toBe('STRICT_SOVEREIGN');
      expect(result.violationReason).toContain('Failing closed by default');
    });

    it('Point 6: Non-sensitive + explicit global policy → allowed: true', () => {
      dataResidencyPolicyEngine.registerPolicy({
        policyId: 'pol-global-catalog',
        tenantId,
        name: 'Public Product Catalog Replication',
        boundaryType: 'GLOBAL_REPLICATED',
        sovereignJurisdiction: 'GLOBAL',
        applicableEntities: ['PUBLIC_CATALOG_ITEM'],
        restrictedFields: [],
        allowedDestinationRegions: ['reg-us-east', 'reg-eu-central', 'reg-apac-sg', 'reg-us-west-dr'],
        enforceFailClosed: false,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'PUBLIC_CATALOG_ITEM',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-eu-central',
        payload: { sku: 'SKU-001', name: 'Bolt M8' },
        dataClassification: 'PUBLIC'
      });
      expect(result.allowed).toBe(true);
      expect(result.policyId).toBe('pol-global-catalog');
      expect(result.boundaryType).toBe('GLOBAL_REPLICATED');
    });

    it('Point 7: Explicit sovereign-region policy → preserved', () => {
      const gdprPolicy = dataResidencyPolicyEngine.getPolicy(tenantId, 'pol-gdpr-strict');
      expect(gdprPolicy).toBeDefined();
      expect(gdprPolicy?.boundaryType).toBe('STRICT_SOVEREIGN');
      expect(gdprPolicy?.sovereignJurisdiction).toBe('EU_GDPR');
      expect(gdprPolicy?.allowedDestinationRegions).toEqual(['reg-eu-central']);
    });

    it('Point 8: Explicit redaction-required transfer → preserved', () => {
      const commPolicy = dataResidencyPolicyEngine.getPolicy(tenantId, 'pol-commercial-order-sync');
      expect(commPolicy).toBeDefined();
      expect(commPolicy?.boundaryType).toBe('CONDITIONAL_TRANSFER');
      expect(commPolicy?.restrictedFields).toContain('internalCostMargin');
      expect(commPolicy?.restrictedFields).toContain('supplierRebatePercentage');
    });

    it('Point 9: Explicitly configured global replication → preserved', () => {
      // Non-sensitive data without explicit policy falls back to DEFAULT_OPEN_BORDER
      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'PUBLIC_CURRENCY_EXCHANGE_RATE',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-eu-central',
        payload: { pair: 'USD/EUR', rate: 0.92 },
        dataClassification: 'PUBLIC'
      });
      expect(result.allowed).toBe(true);
      expect(result.boundaryType).toBe('GLOBAL_REPLICATED');
      expect(result.policyId).toBe('DEFAULT_OPEN_BORDER');
    });

    it('Point 10: Unknown/unsupported classification → allowed: false (DEFAULT_FAIL_CLOSED_NO_POLICY)', () => {
      const result = dataResidencyPolicyEngine.evaluateTransfer({
        tenantId,
        entityType: 'CORRUPTED_RECORD_TYPE',
        sourceRegionId: 'reg-us-east',
        destinationRegionId: 'reg-eu-central',
        payload: { someData: 123 },
        dataClassification: 'INVALID_ALIEN_CLASSIFICATION'
      });
      expect(result.allowed).toBe(false);
      expect(result.policyId).toBe('DEFAULT_FAIL_CLOSED_NO_POLICY');
      expect(result.boundaryType).toBe('STRICT_SOVEREIGN');
      expect(result.violationReason).toContain('unknown/unsupported classification');
      expect(result.violationReason).toContain('Failing closed by default');
    });
  });
});
