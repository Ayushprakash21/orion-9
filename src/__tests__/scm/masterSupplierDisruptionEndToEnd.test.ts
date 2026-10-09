/**
 * ORION-9 MASTER SCM SUPPLIER DISRUPTION END-TO-END ACCEPTANCE SUITE
 * 
 * Validates the complete autonomous response loop under critical supplier failure:
 * 1. Multi-tier Supplier Profile & Baseline Orders
 * 2. Anomaly & Operational Concept Drift Detection
 * 3. Empirical Demand Re-Forecasting with Provenance Tagging
 * 4. Governed Secondary Sourcing & Purchase Order Creation
 * 5. Multi-Echelon Stock Rebalancing & Inventory Buffers
 * 6. Optimized Emergency Multi-Modal Freight Dispatch
 * 7. Cryptographic SHA-256 Digital Twin Snapshot Auditing
 * 8. Closed-Loop Empirical Outcome Recording
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supplierLifecycleEngine } from '../../scm/SupplierLifecycleEngine';
import { sourcingEngine } from '../../scm/SourcingEngine';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { supplierPerformanceEngine } from '../../scm/SupplierPerformanceEngine';
import { demandPlanningEngine } from '../../scm/DemandPlanningEngine';
import { ForecastIntelligenceEngine } from '../../intelligence/ForecastIntelligenceEngine';
import { DemandForecastEngine } from '../../core/planning/DemandForecastEngine';
import { logisticsOptimizationEngine } from '../../scm/LogisticsOptimizationEngine';
import { inventoryOptimizationService } from '../../services/inventoryOptimizationService';
import { twinSnapshotEngine } from '../../digitalTwin/TwinSnapshotEngine';
import { outcomeRecorder } from '../../ai/OutcomeRecorder';
import { DriftDetectionEngine } from '../../outcomes/DriftDetectionEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('ORION-9 Master Supplier Disruption & Autonomy End-to-End Acceptance', () => {
  const tenantId = 'tenant-enterprise-apex';

  const buyerActor: AuthorizationActor = {
    id: 'user-buyer-101',
    type: 'USER',
    name: 'Elena Rostova',
    roles: ['buyer', 'organization_member'],
    organizationId: tenantId,
  };

  const adminActor: AuthorizationActor = {
    id: 'user-admin-901',
    type: 'USER',
    name: 'Chief Supply Chain Officer',
    roles: ['platform_admin', 'organization_admin'],
    organizationId: tenantId,
  };

  beforeEach(() => {
    scmPersistenceService.clear();
    supplierLifecycleEngine.clear();
    sourcingEngine.clear();
    poLifecycleEngine.clear();
    outcomeRecorder.reset();
    DriftDetectionEngine.getInstance().clear();
  });

  it('orchestrates end-to-end recovery from primary supplier disruption with verifiable telemetry', async () => {
    // -------------------------------------------------------------------------
    // 1. Onboard Primary and Secondary Tier-1 Semiconductor Suppliers
    // -------------------------------------------------------------------------
    const primarySupplierRes = await supplierLifecycleEngine.registerSupplier({
      tenantId,
      actor: buyerActor,
      legalName: 'Pacific Silicon Foundry',
      supplierCode: 'SUP-PACIFIC-01',
      taxIdentifier: 'TW-12345678',
      categories: ['Semiconductors'],
    });
    expect(primarySupplierRes.success).toBe(true);
    const primarySupplierId = primarySupplierRes.data.supplierId;

    const secondarySupplierRes = await supplierLifecycleEngine.registerSupplier({
      tenantId,
      actor: buyerActor,
      legalName: 'Bavarian Microelectronics Gmbh',
      supplierCode: 'SUP-BAVARIAN-01',
      taxIdentifier: 'DE-87654321',
      categories: ['Semiconductors'],
    });
    expect(secondarySupplierRes.success).toBe(true);
    const secondarySupplierId = secondarySupplierRes.data.supplierId;

    // -------------------------------------------------------------------------
    // 2. Baseline Procurement on Primary Supplier
    // -------------------------------------------------------------------------
    const initialPoRes = await poLifecycleEngine.createPO({
      tenantId,
      actor: buyerActor,
      supplierId: primarySupplierId,
      items: [
        {
          lineId: 'LINE-CHIP-01',
          productId: 'SKU-MCU-X9',
          quantity: 500,
          unitPrice: 42.50,
          totalPrice: 21250,
          unitOfMeasure: 'PCS',
          expectedDeliveryDate: '2026-11-01',
        },
      ],
      paymentTerms: 'NET30',
      incoterms: 'FOB',
    });
    expect(initialPoRes.success).toBe(true);
    const initialPoId = initialPoRes.data.poId;

    await poLifecycleEngine.submitPOForApproval(tenantId, initialPoId, buyerActor);
    const initialApproval = await poLifecycleEngine.approvePO(tenantId, initialPoId, adminActor);
    expect(initialApproval.success).toBe(true);

    // -------------------------------------------------------------------------
    // 3. Capture Pre-Disruption Digital Twin Snapshot (SHA-256 Verified)
    // -------------------------------------------------------------------------
    const preEntities = [
      { id: primarySupplierId, type: 'SUPPLIER', name: 'Pacific Silicon', tenantId, status: 'ACTIVE', riskScore: 12 },
      { id: secondarySupplierId, type: 'SUPPLIER', name: 'Bavarian Micro', tenantId, status: 'ACTIVE', riskScore: 8 },
      { id: 'INV-HUB-FRANKFURT', type: 'INVENTORY', name: 'Frankfurt Central Hub', tenantId, status: 'ACTIVE', riskScore: 15 },
    ];
    const preRels = [
      { id: 'REL-SUP-1', fromId: primarySupplierId, toId: 'INV-HUB-FRANKFURT', type: 'SUPPLIES', tenantId },
      { id: 'REL-SUP-2', fromId: secondarySupplierId, toId: 'INV-HUB-FRANKFURT', type: 'BACKUP_SUPPLIES', tenantId },
    ];

    const preSnapshot = twinSnapshotEngine.createSnapshot(tenantId, 'TWIN-SUPPLY-NET', preEntities as any, preRels as any);
    expect(preSnapshot.checksum.startsWith('CHK-')).toBe(true);
    expect(preSnapshot.checksum.length).toBeGreaterThan(32); // Valid SHA-256 length
    expect(twinSnapshotEngine.verifySnapshotIntegrity(preSnapshot)).toBe(true);

    // -------------------------------------------------------------------------
    // 4. Incur Critical Disruption & Detect Concept Drift
    // -------------------------------------------------------------------------
    // Drift detection engine monitors delivery lead times: baseline 14 days drifts to 48 days
    const driftSignal = DriftDetectionEngine.getInstance().evaluateDrift({
      tenantId,
      featureName: 'lead_time_days_pacific_silicon',
      baselineMean: 14.0,
      currentMean: 48.0,
      threshold: 20.0,
    });
    expect(driftSignal.driftState).toBe('CRITICAL_DRIFT');
    expect(driftSignal.divergenceScore).toBeGreaterThan(100);

    // -------------------------------------------------------------------------
    // 5. Empirical Demand Re-Forecasting with Provenance Tagging
    // -------------------------------------------------------------------------
    const empiricalHistory = [
      { date: '2026-09-01', quantity: 180, productId: 'SKU-MCU-X9', locationId: 'HUB-FRANKFURT' },
      { date: '2026-09-08', quantity: 195, productId: 'SKU-MCU-X9', locationId: 'HUB-FRANKFURT' },
      { date: '2026-09-15', quantity: 210, productId: 'SKU-MCU-X9', locationId: 'HUB-FRANKFURT' },
      { date: '2026-09-22', quantity: 205, productId: 'SKU-MCU-X9', locationId: 'HUB-FRANKFURT' },
    ];

    const empiricalForecast = DemandForecastEngine.generateFromEmpiricalHistory(empiricalHistory, 14);
    expect(empiricalForecast.length).toBe(18); // 4 history + 14 forecast days
    expect(empiricalForecast[0].provenance).toBe('ACTUAL');
    expect(empiricalForecast[4].provenance).toBe('FORECAST');

    // Advanced Holt-Winters Backtesting
    const intelForecast = ForecastIntelligenceEngine.generateForecast({
      skuId: 'SKU-MCU-X9',
      historicalDemand: [180, 195, 210, 205, 220, 235],
    }, 6);
    expect(intelForecast.forecastAccuracyPct).toBeGreaterThan(85);
    expect(intelForecast.mae).toBeDefined();
    expect(intelForecast.insufficientData).toBe(false);

    // -------------------------------------------------------------------------
    // 6. Governed Autonomous Sourcing: Emergency Switch to Secondary Supplier
    // -------------------------------------------------------------------------
    const emergencyPoRes = await poLifecycleEngine.createPO({
      tenantId,
      actor: buyerActor,
      supplierId: secondarySupplierId,
      items: [
        {
          lineId: 'LINE-CHIP-EMERGENCY',
          productId: 'SKU-MCU-X9',
          quantity: 600,
          unitPrice: 44.00,
          totalPrice: 26400,
          unitOfMeasure: 'PCS',
          expectedDeliveryDate: '2026-10-25',
        },
      ],
      paymentTerms: 'NET30',
      incoterms: 'DDP',
    });
    expect(emergencyPoRes.success).toBe(true);
    const emergencyPoId = emergencyPoRes.data.poId;

    await poLifecycleEngine.submitPOForApproval(tenantId, emergencyPoId, buyerActor);
    const emergencyApproval = await poLifecycleEngine.approvePO(tenantId, emergencyPoId, adminActor);
    expect(emergencyApproval.success).toBe(true);

    const releaseRes = await poLifecycleEngine.releasePO(tenantId, emergencyPoId, adminActor);
    expect(releaseRes.success).toBe(true);
    expect(releaseRes.data.status).toBe('RELEASED');

    // Confirm PO by secondary supplier
    const confirmRes = await poLifecycleEngine.confirmPO(tenantId, emergencyPoId, {
      id: secondarySupplierId,
      type: 'SYSTEM',
      name: 'Bavarian Portal API',
      roles: ['supplier_representative'],
      organizationId: tenantId,
    });
    expect(confirmRes.success).toBe(true);
    expect(confirmRes.data.status).toBe('CONFIRMED');

    // -------------------------------------------------------------------------
    // 7. Multi-Echelon Stock Rebalancing & Buffer Diagnostics
    // -------------------------------------------------------------------------
    const bullwhipMetrics = await inventoryOptimizationService.recalculateBullwhipMetrics();
    expect(bullwhipMetrics.length).toBeGreaterThan(0);
    expect(bullwhipMetrics[0].bullwhipRatio).toBeGreaterThan(0);
    expect(['STABILIZED', 'DAMPENING', 'AMPLIFIED']).toContain(bullwhipMetrics[0].status);

    // -------------------------------------------------------------------------
    // 8. Emergency Freight Lane Optimization (Consolidation + CO2 Modeling)
    // -------------------------------------------------------------------------
    const freightPlan = logisticsOptimizationEngine.optimizeLane({
      tenantId,
      originHub: 'HUB-MUNICH-BAVARIA',
      destinationHub: 'HUB-FRANKFURT-CENTRAL',
      shipmentCount: 8,
      baselineCost: 14000,
      preferredMode: 'INTERMODAL_RAIL',
    });
    expect(freightPlan.costSavingsPct).toBeGreaterThan(15);
    expect(freightPlan.co2ReductionKg).toBeGreaterThan(500);

    const approvedFreight = logisticsOptimizationEngine.approveDispatch(tenantId, freightPlan.planId);
    expect(approvedFreight.status).toBe('APPROVED_DISPATCH');

    const executedFreight = logisticsOptimizationEngine.executePlan(tenantId, freightPlan.planId);
    expect(executedFreight.status).toBe('EXECUTED');

    // -------------------------------------------------------------------------
    // 9. Post-Recovery Digital Twin Snapshot & Cryptographic Verification
    // -------------------------------------------------------------------------
    const postEntities = [
      { id: primarySupplierId, type: 'SUPPLIER', name: 'Pacific Silicon', tenantId, status: 'DISRUPTED', riskScore: 95 },
      { id: secondarySupplierId, type: 'SUPPLIER', name: 'Bavarian Micro', tenantId, status: 'ACTIVE_PRIMARY', riskScore: 10 },
      { id: 'INV-HUB-FRANKFURT', type: 'INVENTORY', name: 'Frankfurt Central Hub', tenantId, status: 'REPLENISHED', riskScore: 5 },
    ];
    const postRels = [
      { id: 'REL-SUP-1', fromId: primarySupplierId, toId: 'INV-HUB-FRANKFURT', type: 'QUARANTINED', tenantId },
      { id: 'REL-SUP-2', fromId: secondarySupplierId, toId: 'INV-HUB-FRANKFURT', type: 'SUPPLIES_ACTIVE', tenantId },
    ];

    const postSnapshot = twinSnapshotEngine.createSnapshot(tenantId, 'TWIN-SUPPLY-NET', postEntities as any, postRels as any);
    expect(postSnapshot.checksum).not.toBe(preSnapshot.checksum); // Proves state mutation changed checksum
    expect(twinSnapshotEngine.verifySnapshotIntegrity(postSnapshot)).toBe(true);

    // -------------------------------------------------------------------------
    // 10. Record Empirical Outcome via Authoritative Outcome Loop
    // -------------------------------------------------------------------------
    const recordedOutcome = await outcomeRecorder.recordOutcome({
      tenantId,
      agentId: 'agent-procurement-autopilot',
      decisionId: `DEC-${Date.now()}`,
      action: 'FAILOVER_SUPPLIER_RECOVERY',
      expectedOutcome: 'Mitigate semiconductor stockout within 48 hours without line stoppage',
      actualOutcome: 'Replenishment secured via Bavarian Micro with 600 units in transit and 22% freight savings',
      success: true,
      variance: {
        unitPriceVariance: 1.50,
        leadTimeDaysSaved: 34,
        co2ReductionKg: freightPlan.co2ReductionKg,
      },
    });

    expect(recordedOutcome.outcomeId).toBeDefined();
    expect(recordedOutcome.success).toBe(true);
    const tenantOutcomes = outcomeRecorder.getOutcomes(tenantId);
    expect(tenantOutcomes.length).toBe(1);
    expect(tenantOutcomes[0].action).toBe('FAILOVER_SUPPLIER_RECOVERY');
  });
});
