import { describe, it, expect, beforeEach } from 'vitest';
import { AutonomyDecisionEngine } from '../../autonomy/AutonomyDecisionEngine';
import { AutonomyPolicyEngine } from '../../autonomy/AutonomyPolicyEngine';
import { AutonomyApprovalRouter } from '../../autonomy/AutonomyApprovalRouter';
import { AutonomyExecutionManager } from '../../autonomy/AutonomyExecutionManager';
import { AutonomyRollbackManager } from '../../autonomy/AutonomyRollbackManager';
import { AutonomyOutcomeManager } from '../../autonomy/AutonomyOutcomeManager';
import { AutonomousMissionEngine } from '../../autonomy/AutonomousMissionEngine';
import { ForecastIntelligenceEngine } from '../../intelligence/ForecastIntelligenceEngine';
import { OrionOptimizationEngine } from '../../intelligence/OrionOptimizationEngine';
import { MEIOEngine } from '../../intelligence/MEIOEngine';
import { ExternalSignalFabric } from '../../intelligence/ExternalSignalFabric';
import { PredictiveETAEngine } from '../../intelligence/PredictiveETAEngine';
import { QualityIntelligenceEngine } from '../../intelligence/QualityIntelligenceEngine';
import { SupplierIntelligenceEngine } from '../../intelligence/SupplierIntelligenceEngine';
import { DataQualityAgent } from '../../intelligence/DataQualityAgent';
import { ExecutiveStrategyAgent } from '../../intelligence/ExecutiveStrategyAgent';
import { AutonomousAgentRegistry } from '../../agents/AutonomousAgentRegistry';
import { AutonomyGovernanceEngine } from '../../workflows/AutonomyGovernanceEngine';

describe('ORION-9 AUTONOMOUS ENTERPRISE V2 — Master Test Suite', () => {
  const tenantId = 'TEST_AUTONOMY_TENANT';

  beforeEach(() => {
    AutonomyPolicyEngine.setThresholdConfig({
      tenantId,
      currency: 'USD',
      maxAutonomousFinancialLimit: 50000,
      autoApproveReplenishment: true,
      autoApproveStockTransfers: true,
      autoApproveRerouting: true,
      autoApproveReminders: true,
      escalationTimeoutMinutes: 15,
      secondaryApproverRole: 'organization_admin',
      safeFallbackAction: 'PAUSE'
    });
  });

  describe('1. Master Autonomy Decision Formula & Governance', () => {
    it('evaluates routine low-risk action under threshold as LEVEL_4_GOVERNED_AUTONOMOUS without human approval', () => {
      const decision = AutonomyDecisionEngine.evaluateDecision(
        tenantId,
        'agent-inventory',
        'INVENTORY_REPLENISHMENT',
        {
          riskScore: 12,
          financialExposure: 14000,
          reversibility: true,
          legalImpact: false,
          complianceImpact: false,
          safetyImpact: false,
          customerImpact: 'LOW',
          supplierImpact: 'LOW',
          strategicImpact: false,
          confidence: 0.96,
          policyClassification: 'DEFAULT_AUTONOMY_POLICY'
        }
      );

      expect(decision.calculatedAutonomyLevel).toBe('LEVEL_4_GOVERNED_AUTONOMOUS');
      expect(decision.requiresHumanApproval).toBe(false);
      expect(decision.status).toBe('APPROVED');
    });

    it('forces LEVEL_3_APPROVAL_GATED when financial exposure exceeds threshold', () => {
      const decision = AutonomyDecisionEngine.evaluateDecision(
        tenantId,
        'agent-procurement',
        'PURCHASE_ORDER_ROUTINE',
        {
          riskScore: 35,
          financialExposure: 125000, // Exceeds $50,000 limit
          reversibility: true,
          legalImpact: false,
          complianceImpact: false,
          safetyImpact: false,
          customerImpact: 'MEDIUM',
          supplierImpact: 'MEDIUM',
          strategicImpact: false,
          confidence: 0.95,
          policyClassification: 'DEFAULT_AUTONOMY_POLICY'
        }
      );

      expect(decision.calculatedAutonomyLevel).toBe('LEVEL_3_APPROVAL_GATED');
      expect(decision.requiresHumanApproval).toBe(true);
      expect(decision.status).toBe('PENDING_APPROVAL');
    });

    it('complies with Section 42: material payments are approval gated (LEVEL_3) rather than permanently prohibited', () => {
      const result = AutonomyGovernanceEngine.evaluateActionAutonomy(
        'LEVEL_3_APPROVAL_GATED',
        { actionId: 'act-01', type: 'PAYMENT_SETTLEMENT' as any, payload: {}, isMaterial: true, riskClass: 'MATERIAL' as any },
        { id: 'agent-finance', role: 'autonomous_agent', isAi: true }
      );

      expect(result.allowed).toBe(true);
      expect(result.requiresApproval).toBe(true);
      expect(result.maxPermittedLevel).toBe('LEVEL_3_APPROVAL_GATED');
    });

    it('strictly prohibits security bypass & code execution under LEVEL_5_PROHIBITED', () => {
      const result = AutonomyGovernanceEngine.evaluateActionAutonomy(
        'LEVEL_4_GOVERNED_AUTONOMOUS',
        { actionId: 'act-02', type: 'CODE_EXECUTION' as any, payload: {}, isMaterial: true, riskClass: 'CRITICAL' as any },
        { id: 'agent-malicious', role: 'autonomous_agent', isAi: true }
      );

      expect(result.allowed).toBe(false);
      expect(result.maxPermittedLevel).toBe('LEVEL_5_PROHIBITED');
    });
  });

  describe('2. Zero-Friction Approval Routing & Escalation', () => {
    it('creates structured ApprovalRequest with complete decision context', () => {
      const decision = AutonomyDecisionEngine.evaluateDecision(
        tenantId,
        'agent-finance',
        'PAYMENT_SETTLEMENT',
        {
          riskScore: 68,
          financialExposure: 85000,
          reversibility: false,
          legalImpact: false,
          complianceImpact: false,
          safetyImpact: false,
          customerImpact: 'HIGH',
          supplierImpact: 'HIGH',
          strategicImpact: false,
          confidence: 0.92,
          policyClassification: 'HIGH_RISK_FINANCE'
        }
      );

      const request = AutonomyApprovalRouter.createApprovalRequest(decision, {
        why: 'Contractual payment for raw material release',
        impactSummary: 'Secures Q4 manufacturing volume discount',
        currentState: { status: 'PENDING' },
        proposedState: { status: 'PAID' },
        alternatives: [{ option: 'Defer', cost: 10000, risk: 'HIGH' }],
        expectedBenefit: 'Saves $18,500 in early settlement discounts',
        aiReasoningSummary: 'Verified 3-way invoice match.'
      });

      expect(request.approvalId).toContain('appr-');
      expect(request.status).toBe('PENDING');
      expect(request.financialCost).toBe(85000);
    });
  });

  describe('3. Closed-Loop Execution & Self-Healing Rollback', () => {
    it('executes decision through Kernel CommandBus and records outcome trace', async () => {
      const decision = AutonomyDecisionEngine.evaluateDecision(
        tenantId,
        'agent-inventory',
        'INVENTORY_REPLENISHMENT',
        {
          riskScore: 10,
          financialExposure: 5000,
          reversibility: true,
          legalImpact: false,
          complianceImpact: false,
          safetyImpact: false,
          customerImpact: 'LOW',
          supplierImpact: 'LOW',
          strategicImpact: false,
          confidence: 0.99,
          policyClassification: 'DEFAULT_AUTONOMY_POLICY'
        }
      );

      const result = await AutonomyExecutionManager.executeDecision(
        decision,
        'CREATE_PURCHASE_ORDER',
        { skuId: 'SKU-4902', quantity: 1000, supplierId: 'SUP-001' },
        { id: 'agent-inventory', role: 'autonomous_agent', isAi: true }
      );

      expect(result.success).toBe(true);
      expect(result.executionId).toContain('exec-');

      const trace = AutonomyOutcomeManager.getDecisionTrace(decision.decisionId);
      expect(trace).toBeDefined();
      expect(trace?.agentId).toBe('agent-inventory');
    });

    it('triggers safe rollback logging when execution fails verification', async () => {
      const decision = AutonomyDecisionEngine.evaluateDecision(
        tenantId,
        'agent-test',
        'STOCK_TRANSFER',
        {
          riskScore: 15,
          financialExposure: 2000,
          reversibility: true,
          legalImpact: false,
          complianceImpact: false,
          safetyImpact: false,
          customerImpact: 'LOW',
          supplierImpact: 'LOW',
          strategicImpact: false,
          confidence: 0.95,
          policyClassification: 'DEFAULT'
        }
      );

      const rollback = await AutonomyRollbackManager.rollbackDecision(decision, 'exec-failed-123', 'Simulated verification timeout');
      expect(rollback.success).toBe(true);
      expect(rollback.reason).toContain('Simulated verification timeout');
    });
  });

  describe('4. Autonomous Mission Engine Lifecycle', () => {
    it('creates and manages autonomous business missions', async () => {
      const mission = AutonomousMissionEngine.createMission(
        tenantId,
        'Prevent SKU-9901 Stockout',
        'Automatically reorder buffer stock to maintain 99.5% service level',
        'INVENTORY',
        'Service Level',
        99.5,
        96.0,
        'agent-inventory'
      );

      expect(mission.status).toBe('MISSION_CREATED');

      const step = await AutonomousMissionEngine.executeMissionStep(
        mission.missionId,
        'INVENTORY_REPLENISHMENT',
        { riskScore: 10, financialExposure: 4000, reversibility: true, confidence: 0.95 },
        'CREATE_PURCHASE_ORDER',
        { skuId: 'SKU-9901', quantity: 500 },
        {
          why: 'Buffer stock below safety threshold',
          impactSummary: 'Prevents estimated 12% stockout likelihood',
          currentState: { stock: 120 },
          proposedState: { stock: 620 },
          expectedBenefit: 'Maintains 99.5% service level'
        }
      );

      expect(step.mission.status).toBe('MISSION_COMPLETED');
      expect(step.mission.currentValue).toBe(99.5);
    });
  });

  describe('5. Intelligence Engines (Forecast, Optimization, MEIO, Signals, ETA, Quality, Supplier, Data, Executive)', () => {
    it('ForecastIntelligenceEngine generates Holt-Winters ensemble forecast', () => {
      const res = ForecastIntelligenceEngine.generateForecast({
        skuId: 'SKU-8812',
        historicalDemand: [100, 105, 110, 115, 120, 125]
      }, 6);

      expect(res.recommendedForecast.length).toBe(6);
      expect(res.forecastAccuracyPct).toBeGreaterThan(90);
    });

    it('OrionOptimizationEngine computes optimal LP carrier solution & Pareto frontier', () => {
      const problem = {
        objective: 'MINIMIZE_COST' as const,
        constraints: { maxBudget: 100000 },
        decisionVariables: [
          {
            skuId: 'SKU-4902',
            originNodeId: 'PLANT-01',
            destinationNodeId: 'DC-02',
            availableCarriers: [
              { carrierId: 'CARRIER-A', ratePerUnit: 10, leadTimeDays: 3, carbonPerUnitKg: 3.5 },
              { carrierId: 'CARRIER-B', ratePerUnit: 18, leadTimeDays: 1, carbonPerUnitKg: 5.0 }
            ]
          }
        ]
      };

      const res = OrionOptimizationEngine.solveOptimization(problem);
      expect(res.optimalSolution[0].selectedCarrierId).toBe('CARRIER-A');
      expect(res.summary.paretoFrontierOptions.length).toBe(4);
    });

    it('MEIOEngine calculates multi-echelon safety stock across network nodes', () => {
      const nodes = [
        { nodeId: 'SUP-01', name: 'Raw Supplier', type: 'SUPPLIER' as const, leadTimeDays: 14, demandVariabilityStdDev: 25, targetServiceLevelPct: 98 },
        { nodeId: 'DC-01', name: 'Regional DC', type: 'REGIONAL_DC' as const, leadTimeDays: 3, demandVariabilityStdDev: 15, targetServiceLevelPct: 99 }
      ];

      const res = MEIOEngine.optimizeNetwork(nodes);
      expect(res.nodes.length).toBe(2);
      expect(res.networkTotals.totalSafetyStockUnits).toBeGreaterThan(0);
    });

    it('ExternalSignalFabric ingests signals & calculates risk propagation', () => {
      const impact = ExternalSignalFabric.ingestSignal({
        signalId: 'sig-001',
        category: 'PORT_CONGESTION',
        source: 'AIS Vessel Tracker',
        headline: 'Singapore Port Delay 48h',
        severity: 'HIGH',
        affectedEntities: [{ type: 'PORT', id: 'PORT-SIN' }],
        impactScore: 75,
        timestamp: new Date().toISOString()
      });

      expect(impact.riskClass).toBe('HIGH');
      expect(impact.recommendedMissionTitle).toContain('Singapore Port Delay');
    });

    it('PredictiveETAEngine calculates dynamic ETA delay probability', () => {
      const eta = PredictiveETAEngine.calculatePredictiveETA({
        shipmentId: 'SH-9901',
        origin: 'Shanghai',
        destination: 'Los Angeles',
        scheduledEta: '2026-10-12T12:00:00Z',
        completedMilestonesPct: 60,
        carrierId: 'EXPRESS-FREIGHT',
        portCongestionDelayHours: 12
      });

      expect(eta.totalDelayHours).toBeGreaterThan(10);
      expect(eta.delayProbabilityPct).toBeGreaterThan(50);
    });

    it('QualityIntelligenceEngine computes SPC control limits and generates CAPA', () => {
      const res = QualityIntelligenceEngine.analyzeQuality({
        supplierId: 'SUP-9901',
        skuId: 'SKU-4902',
        totalInspectedUnits: 1000,
        defectiveUnits: 85,
        defectCategory: 'DIMENSIONAL',
        historicalDefectRatePct: 2.0
      });

      expect(res.outOfControl).toBe(true);
      expect(res.recommendedCapaAction).toContain('Issue automated CAPA');
    });

    it('SupplierIntelligenceEngine calculates risk score & recommends allocation shift', () => {
      const risk = SupplierIntelligenceEngine.evaluateSupplierRisk({
        supplierId: 'SUP-DANGER',
        supplierName: 'Risky Logistics Corp',
        financialRiskScore: 85,
        deliveryRiskScore: 90,
        qualityRiskScore: 70,
        capacityRiskScore: 60,
        geopoliticalRiskScore: 40,
        esgRiskScore: 30,
        singleSourceFlag: true
      });

      expect(risk.riskCategory).toBe('CRITICAL');
      expect(risk.recommendedActions.some(a => a.actionType === 'ALLOCATION_SHIFT')).toBe(true);
    });

    it('DataQualityAgent detects master data anomalies and repairs low-risk UOM', () => {
      const anomaly = DataQualityAgent.scanEntity('PRODUCT', { id: 'SKU-001', uom: 'pcs' });
      expect(anomaly).not.toBeNull();
      expect(anomaly?.anomalyType).toBe('INVALID_UNIT');

      if (anomaly) {
        const repair = DataQualityAgent.processRepair(anomaly);
        expect(repair.repairedAutonomously).toBe(true);
      }
    });

    it('ExecutiveStrategyAgent generates 7d, 30d, 90d horizon risk report', () => {
      const report = ExecutiveStrategyAgent.generateExecutiveReport(tenantId);
      expect(report.horizons.TODAY).toBeDefined();
      expect(report.horizons.NEXT_7_DAYS).toBeDefined();
      expect(report.horizons.NEXT_30_DAYS).toBeDefined();
      expect(report.horizons.NEXT_90_DAYS).toBeDefined();
      expect(report.overallEnterpriseHealthIndex).toBeGreaterThan(80);
    });
  });

  describe('6. Autonomous Agent Workforce (20 Specialized Agents)', () => {
    it('registers all 20 specialized autonomous agents with governed tool permissions', () => {
      const workforce = AutonomousAgentRegistry.getAllAgents();
      expect(workforce.length).toBe(20);

      const controlTower = AutonomousAgentRegistry.getAgent('agent-control-tower');
      expect(controlTower).toBeDefined();
      expect(controlTower?.category).toBe('CONTROL_TOWER');

      const dataQuality = AutonomousAgentRegistry.getAgent('agent-data-quality');
      expect(dataQuality).toBeDefined();
    });
  });
});
