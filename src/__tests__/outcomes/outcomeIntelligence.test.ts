/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Comprehensive Unit & Integration Test Suite
 * 
 * Verifies all 16 core engines and architectural invariants:
 * - Deterministic outcome expectation, empirical observation, variance calculation
 * - Root cause attribution & human confirmation
 * - Decision & Workflow effectiveness, Scenario accuracy & Twin calibration
 * - Learning signals, Governed improvement proposals, Anti-AI self-approval
 * - Intelligence versioning, 1-Click rollback, Challenger shadow mode, Drift detection
 * - Experiment blast-radius safety, Decision graph provenance & Decision memory
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  OutcomeExpectationService,
  OutcomeObservationService,
  OutcomeVarianceEngine,
  OutcomeAttributionEngine,
  DecisionEffectivenessEngine,
  WorkflowEffectivenessEngine,
  ScenarioAccuracyEngine,
  TwinFeedbackBridge,
  LearningSignalEngine,
  ImprovementProposalEngine,
  IntelligenceVersionEngine,
  ChallengerModeEngine,
  DriftDetectionEngine,
  ExperimentEngine,
  ClosedLoopDecisionGraph,
  DecisionMemoryService,
} from '../../outcomes';

describe('Orion-9 Wave 9: Closed-Loop Outcome Intelligence & Enterprise Learning Suite', () => {
  const TENANT_A = 'TENANT_ALPHA';
  const TENANT_B = 'TENANT_BETA';

  beforeEach(() => {
    OutcomeExpectationService.getInstance().clear();
    OutcomeObservationService.getInstance().clear();
    OutcomeVarianceEngine.getInstance().clear();
    OutcomeAttributionEngine.getInstance().clear();
    DecisionEffectivenessEngine.getInstance().clear();
    WorkflowEffectivenessEngine.getInstance().clear();
    ScenarioAccuracyEngine.getInstance().clear();
    TwinFeedbackBridge.getInstance().clear();
    LearningSignalEngine.getInstance().clear();
    ImprovementProposalEngine.getInstance().clear();
    IntelligenceVersionEngine.getInstance().clear();
    ChallengerModeEngine.getInstance().clear();
    DriftDetectionEngine.getInstance().clear();
    ExperimentEngine.getInstance().clear();
    ClosedLoopDecisionGraph.getInstance().clear();
    DecisionMemoryService.getInstance().clear();
  });

  // =========================================================================
  // 1. Outcome Expectations Service
  // =========================================================================
  describe('1. Outcome Expectations Service', () => {
    it('registers baseline expected operational metrics with deterministic hash', async () => {
      const service = OutcomeExpectationService.getInstance();
      const exp = await service.registerExpectation({
        tenantId: TENANT_A,
        decisionId: 'DEC-001',
        actionId: 'ACT-EXPEDITE',
        expectedCostSavings: 15000,
        expectedOTIF: 95.0,
        expectedTransitTimeDays: 3.5,
        expectedInventoryDays: 14,
        expectedCO2ReductionKg: 450,
      });

      expect(exp.expectationId).toBeDefined();
      expect(exp.tenantId).toBe(TENANT_A);
      expect(exp.expectedCostSavings).toBe(15000);
      expect(exp.expectedOTIF).toBe(95.0);
      expect(exp.immutableHash).toMatch(/^hash_exp_/);
      expect(exp.confidenceInterval.p50).toBe(95.0);
    });

    it('enforces tenant isolation when querying expectations', async () => {
      const service = OutcomeExpectationService.getInstance();
      await service.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 5000,
        expectedOTIF: 90,
        expectedTransitTimeDays: 2,
        expectedInventoryDays: 10,
      });

      await service.registerExpectation({
        tenantId: TENANT_B,
        expectedCostSavings: 8000,
        expectedOTIF: 92,
        expectedTransitTimeDays: 3,
        expectedInventoryDays: 12,
      });

      const listA = service.listExpectations(TENANT_A);
      const listB = service.listExpectations(TENANT_B);

      expect(listA.length).toBe(1);
      expect(listB.length).toBe(1);
      expect(listA[0].tenantId).toBe(TENANT_A);
      expect(listB[0].tenantId).toBe(TENANT_B);
    });
  });

  // =========================================================================
  // 2. Outcome Observation Service
  // =========================================================================
  describe('2. Outcome Observation Service', () => {
    it('ingests empirical telemetry observations with cryptographic provenance', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 10000,
        expectedOTIF: 95.0,
        expectedTransitTimeDays: 4,
        expectedInventoryDays: 15,
      });

      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'SAP_ERP',
        actualCost: 11200,
        actualOTIF: 91.5,
        actualTransitTimeDays: 4.8,
        actualInventoryDays: 16,
        evidenceReference: 'GRN-491028',
        recordedBy: 'IntegrationWorker',
      });

      expect(obs.observationId).toBeDefined();
      expect(obs.sourceSystem).toBe('SAP_ERP');
      expect(obs.evidenceReference).toBe('GRN-491028');
      expect(obs.rawPayloadHash).toMatch(/^hash_obs_/);

      const retrieved = obsService.getObservation(TENANT_A, obs.observationId);
      expect(retrieved?.actualOTIF).toBe(91.5);
    });
  });

  // =========================================================================
  // 3. Outcome Variance Engine
  // =========================================================================
  describe('3. Outcome Variance Engine', () => {
    it('calculates exact deltas, percentage variances, and composite scores', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 10000,
        expectedOTIF: 90.0,
        expectedTransitTimeDays: 4.0,
        expectedInventoryDays: 10,
      });

      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'ORACLE_TMS',
        actualCost: 12000, // +2000 (+20%)
        actualOTIF: 80.0,  // -10 (-11.11%)
        actualTransitTimeDays: 5.5, // +1.5 days
        actualInventoryDays: 12,
        evidenceReference: 'BOL-TMS-001',
        recordedBy: 'CarrierTMS',
      });

      const variance = varEngine.calculateVariance(exp, obs);

      expect(variance.costDelta).toBe(2000);
      expect(variance.costVariancePct).toBe(20.0);
      expect(variance.otifDelta).toBe(-10.0);
      expect(variance.transitTimeDeltaDays).toBe(1.5);
      expect(variance.directionalBias).toBe('OVER_PROJECTED');
      expect(variance.severity).toBe('SIGNIFICANT');
      expect(variance.thresholdBreached).toBe(true);
    });

    it('safeguards against division-by-zero when baseline expected values are zero', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 0,
        expectedOTIF: 0,
        expectedTransitTimeDays: 0,
        expectedInventoryDays: 0,
      });

      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'MANHATTAN_WMS',
        actualCost: 500,
        actualOTIF: 85,
        actualTransitTimeDays: 2,
        actualInventoryDays: 5,
        evidenceReference: 'WMS-RECEIPT-99',
        recordedBy: 'WMSUser',
      });

      const variance = varEngine.calculateVariance(exp, obs);
      expect(Number.isNaN(variance.costVariancePct)).toBe(false);
      expect(Number.isFinite(variance.costVariancePct)).toBe(true);
      expect(variance.costVariancePct).toBe(0);
      expect(variance.otifVariancePct).toBe(0);
    });

    it('classifies severity into NEGLIGIBLE, MODERATE, SIGNIFICANT, and CRITICAL', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();

      // Negligible case
      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 10000,
        expectedOTIF: 95.0,
        expectedTransitTimeDays: 3.0,
        expectedInventoryDays: 10,
      });
      const obsNeg = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'EDI_214',
        actualCost: 10100,
        actualOTIF: 94.5,
        actualTransitTimeDays: 3.1,
        actualInventoryDays: 10,
        evidenceReference: 'EDI-01',
        recordedBy: 'Carrier',
      });
      const varNeg = varEngine.calculateVariance(exp, obsNeg);
      expect(varNeg.severity).toBe('NEGLIGIBLE');
      expect(varNeg.thresholdBreached).toBe(false);

      // Critical case
      const obsCrit = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'SAP_ERP',
        actualCost: 15000,
        actualOTIF: 70.0, // 25 point drop
        actualTransitTimeDays: 8.0,
        actualInventoryDays: 20,
        evidenceReference: 'ERP-CRIT',
        recordedBy: 'ERP',
      });
      const varCrit = varEngine.calculateVariance(exp, obsCrit);
      expect(varCrit.severity).toBe('CRITICAL');
      expect(varCrit.thresholdBreached).toBe(true);
    });
  });

  // =========================================================================
  // 4. Outcome Attribution Engine
  // =========================================================================
  describe('4. Outcome Attribution Engine', () => {
    it('classifies variance root cause with confidence levels and factor decomposition', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();
      const attrEngine = OutcomeAttributionEngine.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 20000,
        expectedOTIF: 95.0,
        expectedTransitTimeDays: 5.0,
        expectedInventoryDays: 10,
      });

      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'ORACLE_TMS',
        actualCost: 26000,
        actualOTIF: 78.0,
        actualTransitTimeDays: 8.0,
        actualInventoryDays: 12,
        evidenceReference: 'TMS-PORT-ALERT',
        recordedBy: 'CarrierBot',
      });

      const variance = varEngine.calculateVariance(exp, obs);
      const attribution = attrEngine.attributeVariance(variance, {
        portCongestionIndex: 85,
        carrierDelayHours: 72,
        notes: 'Panama Canal drought restriction caused 72hr transit queue.',
      });

      expect(attribution.attributionId).toBeDefined();
      expect(attribution.primaryCategory).toBe('EXTERNAL_MARKET_SHOCK');
      expect(attribution.confidence).toBe('OBSERVED_FACT');
      expect(attribution.contributingFactors.length).toBeGreaterThan(0);
      expect(attribution.contributingFactors[0].evidenceSource).toBe('AIS_VESSEL_TRACKING');
    });

    it('allows authorized human operators to confirm and override root causes', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();
      const attrEngine = OutcomeAttributionEngine.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 5000,
        expectedOTIF: 90,
        expectedTransitTimeDays: 3,
        expectedInventoryDays: 5,
      });
      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'SAP_ERP',
        actualCost: 5500,
        actualOTIF: 88,
        actualTransitTimeDays: 3.5,
        actualInventoryDays: 5,
        evidenceReference: 'SAP-001',
        recordedBy: 'Operator',
      });
      const variance = varEngine.calculateVariance(exp, obs);
      const attribution = attrEngine.attributeVariance(variance);

      const confirmed = attrEngine.confirmAttribution(
        TENANT_A,
        attribution.attributionId,
        'LeadAuditorUser',
        'SUPPLIER_EXECUTION_FAILURE'
      );

      expect(confirmed?.confirmedByHuman).toBe('LeadAuditorUser');
      expect(confirmed?.confidence).toBe('CONFIRMED_ROOT_CAUSE');
      expect(confirmed?.primaryCategory).toBe('SUPPLIER_EXECUTION_FAILURE');
    });
  });

  // =========================================================================
  // 5. Decision Effectiveness Engine
  // =========================================================================
  describe('5. Decision Effectiveness Engine', () => {
    it('evaluates decision ROI, quality score, and effectiveness classification', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();
      const decEngine = DecisionEffectivenessEngine.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        decisionId: 'DEC-EXPEDITE-CRITICAL',
        expectedCostSavings: 30000,
        expectedOTIF: 98.0,
        expectedTransitTimeDays: 2.0,
        expectedInventoryDays: 10,
      });

      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'SAP_ERP',
        actualCost: 28500,
        actualOTIF: 97.5,
        actualTransitTimeDays: 2.1,
        actualInventoryDays: 10,
        evidenceReference: 'SAP-INV-88',
        recordedBy: 'FinanceService',
      });

      const variance = varEngine.calculateVariance(exp, obs);
      const outcomeRecord = decEngine.evaluateDecision(exp, obs, variance);

      expect(outcomeRecord.outcomeId).toBeDefined();
      expect(outcomeRecord.decisionQualityScore).toBeGreaterThanOrEqual(85);
      expect(outcomeRecord.effectivenessClass).toBe('SUCCESS');
      expect(outcomeRecord.isImmutable).toBe(true);
    });
  });

  // =========================================================================
  // 6. Workflow Effectiveness Engine
  // =========================================================================
  describe('6. Workflow Effectiveness Engine', () => {
    it('evaluates Wave 7 autonomous workflows on SLA, retries, and compensation', () => {
      const engine = WorkflowEffectivenessEngine.getInstance();

      // Optimal autonomous execution
      const optimal = engine.evaluateWorkflow({
        tenantId: TENANT_A,
        workflowInstanceId: 'wf-inst-1',
        resolvedException: true,
        durationMs: 3200,
        slaTargetMs: 10000,
        retryCount: 0,
        compensationTriggered: false,
        humanInterventionRequired: false,
      });

      expect(optimal.effectivenessScore).toBe(100);
      expect(optimal.slaBreached).toBe(false);

      // Distressed execution with retries and compensation
      const degraded = engine.evaluateWorkflow({
        tenantId: TENANT_A,
        workflowInstanceId: 'wf-inst-2',
        resolvedException: false,
        durationMs: 15000,
        slaTargetMs: 10000,
        retryCount: 3,
        compensationTriggered: true,
        humanInterventionRequired: true,
      });

      expect(degraded.slaBreached).toBe(true);
      expect(degraded.compensationTriggered).toBe(true);
      expect(degraded.effectivenessScore).toBeLessThan(50);
    });
  });

  // =========================================================================
  // 7. Scenario Accuracy Engine
  // =========================================================================
  describe('7. Scenario Accuracy Engine', () => {
    it('computes MAPE and recommends calibration when projection error exceeds 15%', () => {
      const engine = ScenarioAccuracyEngine.getInstance();

      const accurate = engine.evaluateScenarioProjection({
        tenantId: TENANT_A,
        scenarioId: 'SCEN-PORT-STRIKE',
        scenarioType: 'PORT_CONGESTION',
        projectedCost: 50000,
        actualCost: 52000, // +4%
        projectedOTIF: 85,
        actualOTIF: 83, // -2.3%
      });

      expect(accurate.mape).toBeLessThan(10);
      expect(accurate.calibrationRecommended).toBe(false);

      const inaccurate = engine.evaluateScenarioProjection({
        tenantId: TENANT_A,
        scenarioId: 'SCEN-SUPPLIER-DEFAULT',
        scenarioType: 'SUPPLIER_OUTAGE',
        projectedCost: 40000,
        actualCost: 55000, // +37.5%
        projectedOTIF: 90,
        actualOTIF: 70, // -22.2%
      });

      expect(inaccurate.mape).toBeGreaterThan(15);
      expect(inaccurate.calibrationRecommended).toBe(true);
    });
  });

  // =========================================================================
  // 8. Digital Twin Feedback Bridge
  // =========================================================================
  describe('8. Digital Twin Feedback Bridge', () => {
    it('calibrates digital twin risk parameters and emits a new immutable snapshot', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();
      const decEngine = DecisionEffectivenessEngine.getInstance();
      const bridge = TwinFeedbackBridge.getInstance();

      const exp = await expService.registerExpectation({
        tenantId: TENANT_A,
        expectedCostSavings: 10000,
        expectedOTIF: 95.0,
        expectedTransitTimeDays: 4.0,
        expectedInventoryDays: 10,
      });

      const obs = await obsService.ingestObservation({
        tenantId: TENANT_A,
        expectationId: exp.expectationId,
        sourceSystem: 'ORACLE_TMS',
        actualCost: 15000,
        actualOTIF: 65.0, // Critical failure
        actualTransitTimeDays: 9.0,
        actualInventoryDays: 18,
        evidenceReference: 'TMS-FAIL-01',
        recordedBy: 'TMS',
      });

      const variance = varEngine.calculateVariance(exp, obs);
      const outcome = decEngine.evaluateDecision(exp, obs, variance);

      const calibration = bridge.applyOutcomeFeedback({
        tenantId: TENANT_A,
        outcomeRecord: outcome,
        variance,
        observation: obs,
        targetEntityId: 'SUPPLIER-ASIAN-FOUNDRY',
      });

      expect(calibration.targetEntityId).toBe('SUPPLIER-ASIAN-FOUNDRY');
      expect(calibration.calibratedRiskScore).toBeGreaterThan(calibration.priorRiskScore);
      expect(calibration.newSnapshotId).toBeDefined();
    });
  });

  // =========================================================================
  // 9. Learning Signal Engine
  // =========================================================================
  describe('9. Learning Signal Engine', () => {
    it('detects systematic lead time and cost escalation drift across variance cohorts', async () => {
      const expService = OutcomeExpectationService.getInstance();
      const obsService = OutcomeObservationService.getInstance();
      const varEngine = OutcomeVarianceEngine.getInstance();
      const learningEngine = LearningSignalEngine.getInstance();

      const variances = [];
      for (let i = 0; i < 3; i++) {
        const exp = await expService.registerExpectation({
          tenantId: TENANT_A,
          expectedCostSavings: 10000,
          expectedOTIF: 95,
          expectedTransitTimeDays: 3,
          expectedInventoryDays: 10,
        });
        const obs = await obsService.ingestObservation({
          tenantId: TENANT_A,
          expectationId: exp.expectationId,
          sourceSystem: 'SAP_ERP',
          actualCost: 12500, // +25% cost escalation
          actualOTIF: 90,
          actualTransitTimeDays: 5.5, // +2.5 days lead time drift
          actualInventoryDays: 12,
          evidenceReference: `EV-${i}`,
          recordedBy: 'Worker',
        });
        variances.push(varEngine.calculateVariance(exp, obs));
      }

      const signals = learningEngine.analyzeVariances(TENANT_A, variances);
      expect(signals.length).toBeGreaterThanOrEqual(2);
      expect(signals.some(s => s.metric === 'LEAD_TIME_UNDERESTIMATION')).toBe(true);
      expect(signals.some(s => s.metric === 'CONTAINER_FREIGHT_COST_ESCALATION')).toBe(true);
    });
  });

  // =========================================================================
  // 10. Improvement Proposal Engine & Strict Human Governance
  // =========================================================================
  describe('10. Improvement Proposal Engine & Anti-AI Self-Approval Gate', () => {
    it('creates improvement proposals with automated rollback plans', () => {
      const engine = ImprovementProposalEngine.getInstance();
      const proposal = engine.createProposal({
        tenantId: TENANT_A,
        signalId: 'SIG-LEADTIME-01',
        title: 'Buffer Calibration',
        description: 'Increase transpacific buffer by 2 days',
        proposalType: 'SUPPLIER_LEAD_TIME_ADJUSTMENT',
        proposedChanges: { bufferDays: 2.0 },
        baselineParameters: { bufferDays: 0 },
        expectedImpact: { otifImprovementPct: 5.0, costReductionAnnualized: 50000, riskReductionPct: 20 },
        createdBy: 'AnalystUser',
      });

      expect(proposal.proposalId).toBeDefined();
      expect(proposal.status).toBe('PENDING_APPROVAL');
      expect(proposal.rollbackPlan.targetVersion).toBe('v1.0.0');
      expect(proposal.rollbackPlan.automatedSteps.length).toBeGreaterThan(0);
    });

    it('STRICTLY BLOCKS AI agents from self-approving improvement proposals', () => {
      const engine = ImprovementProposalEngine.getInstance();
      const proposal = engine.createProposal({
        tenantId: TENANT_A,
        signalId: 'SIG-01',
        title: 'AI Automated Retune',
        description: 'AI model autotune proposal',
        proposalType: 'MODEL_WEIGHT_TUNING',
        proposedChanges: { weight: 1.5 },
        baselineParameters: { weight: 1.0 },
        expectedImpact: { otifImprovementPct: 2.0, costReductionAnnualized: 10000, riskReductionPct: 10 },
        createdBy: 'AI-Copilot-Agent',
      });

      // AI Agent tries to approve its own proposal
      const aiAttempt = engine.reviewProposal({
        tenantId: TENANT_A,
        proposalId: proposal.proposalId,
        reviewedBy: 'AGENT-AUTONOMOUS-OPTIMIZER',
        userRole: 'admin',
        isAIAgent: true,
        action: 'APPROVED',
        justification: 'AI self-determined high efficacy.',
      });

      expect(aiAttempt.success).toBe(false);
      expect(aiAttempt.error).toMatch(/GOVERNANCE_VIOLATION.*AI agents cannot self-approve/i);

      // Non-admin user tries to approve
      const nonAdminAttempt = engine.reviewProposal({
        tenantId: TENANT_A,
        proposalId: proposal.proposalId,
        reviewedBy: 'standard_buyer_user',
        userRole: 'buyer',
        isAIAgent: false,
        action: 'APPROVED',
        justification: 'Buyer approval',
      });

      expect(nonAdminAttempt.success).toBe(false);
      expect(nonAdminAttempt.error).toMatch(/PERMISSION_DENIED/i);

      // Authorized Platform Admin approves
      const adminApproval = engine.reviewProposal({
        tenantId: TENANT_A,
        proposalId: proposal.proposalId,
        reviewedBy: 'PlatformChiefAdmin',
        userRole: 'platform_admin',
        isAIAgent: false,
        action: 'APPROVED',
        justification: 'Verified against 30-day historical empirical variance evidence.',
      });

      expect(adminApproval.success).toBe(true);
      expect(adminApproval.proposal?.status).toBe('APPROVED');
    });
  });

  // =========================================================================
  // 11. Intelligence Version Engine & 1-Click Governed Rollback
  // =========================================================================
  describe('11. Intelligence Version Engine & 1-Click Governed Rollback', () => {
    it('manages version promotions and rejects AI version promotion', () => {
      const engine = IntelligenceVersionEngine.getInstance();
      engine.ensureBaselineVersion(TENANT_A);

      // AI attempts promotion -> rejected
      const aiPromo = engine.promoteVersion({
        tenantId: TENANT_A,
        versionId: 'v1.1.0',
        parameters: { safetyStockMultiplier: 1.5 },
        policyThresholds: { autoApprovalPoLimit: 75000 },
        promotedBy: 'AGENT-007',
        userRole: 'platform_admin',
        isAIAgent: true,
      });
      expect(aiPromo.success).toBe(false);
      expect(aiPromo.error).toMatch(/GOVERNANCE_VIOLATION.*AI agents are strictly forbidden/i);

      // Human Admin promotes -> succeeds
      const humanPromo = engine.promoteVersion({
        tenantId: TENANT_A,
        versionId: 'v1.1.0',
        parameters: { safetyStockMultiplier: 1.5 },
        policyThresholds: { autoApprovalPoLimit: 75000 },
        promotedBy: 'ChiefAdminUser',
        userRole: 'platform_admin',
        isAIAgent: false,
      });
      expect(humanPromo.success).toBe(true);
      expect(engine.getActiveVersion(TENANT_A)?.versionId).toBe('v1.1.0');
    });

    it('executes 1-click governed rollback reverting to verified baseline', () => {
      const engine = IntelligenceVersionEngine.getInstance();
      engine.ensureBaselineVersion(TENANT_A);

      engine.promoteVersion({
        tenantId: TENANT_A,
        versionId: 'v1.1.0',
        parameters: { safetyStockMultiplier: 1.5 },
        policyThresholds: { autoApprovalPoLimit: 75000 },
        promotedBy: 'ChiefAdminUser',
        userRole: 'platform_admin',
        isAIAgent: false,
      });

      expect(engine.getActiveVersion(TENANT_A)?.versionId).toBe('v1.1.0');

      // AI attempts rollback -> blocked
      const aiRollback = engine.rollbackToVersion({
        tenantId: TENANT_A,
        targetVersionId: 'v1.0.0',
        executedBy: 'AI-Agent-Copilot',
        userRole: 'platform_admin',
        reason: 'Autonomous reversion',
        isAIAgent: true,
      });
      expect(aiRollback.success).toBe(false);
      expect(aiRollback.error).toMatch(/GOVERNANCE_VIOLATION/i);

      // Human Admin executes 1-click rollback
      const rollback = engine.rollbackToVersion({
        tenantId: TENANT_A,
        targetVersionId: 'v1.0.0',
        executedBy: 'ChiefAdminUser',
        userRole: 'platform_admin',
        reason: 'Unforecasted supplier divergence detected following v1.1 release.',
        isAIAgent: false,
      });

      expect(rollback.success).toBe(true);
      expect(engine.getActiveVersion(TENANT_A)?.versionId).toBe('v1.0.0');
      expect(rollback.rolledBackVersion?.status).toBe('ROLLED_BACK');
    });
  });

  // =========================================================================
  // 12. Challenger Mode Engine
  // =========================================================================
  describe('12. Challenger Mode Engine', () => {
    it('runs shadow mode comparison without production side effects', () => {
      const engine = ChallengerModeEngine.getInstance();
      const comparison = engine.evaluateShadowRun({
        tenantId: TENANT_A,
        championVersion: 'v1.0.0',
        challengerVersion: 'v1.1.0-CHALLENGER',
        sampleCount: 150,
        championAccuracyPct: 88.0,
        challengerAccuracyPct: 94.5,
        championCost: 120000,
        challengerCost: 112000,
      });

      expect(comparison.challengerRunId).toBeDefined();
      expect(comparison.recommendation).toBe('PROMOTE');
      expect(comparison.confidenceScore).toBeGreaterThanOrEqual(90);
    });
  });

  // =========================================================================
  // 13. Drift Detection Engine
  // =========================================================================
  describe('13. Drift Detection Engine', () => {
    it('detects concept and distribution drift across operational features', () => {
      const engine = DriftDetectionEngine.getInstance();

      const normal = engine.evaluateDrift({
        tenantId: TENANT_A,
        featureName: 'customs_clearance_hours',
        baselineMean: 24.0,
        currentMean: 24.8,
        threshold: 15.0,
      });
      expect(normal.driftState).toBe('NORMAL');

      const critical = engine.evaluateDrift({
        tenantId: TENANT_A,
        featureName: 'ocean_spot_freight_feus',
        baselineMean: 2000,
        currentMean: 2900, // +45% divergence
        threshold: 15.0,
      });
      expect(critical.driftState).toBe('CRITICAL_DRIFT');
    });
  });

  // =========================================================================
  // 14. Experiment Engine & Blast-Radius Cap
  // =========================================================================
  describe('14. Experiment Engine', () => {
    it('enforces maximum 20% traffic allocation cap for blast-radius safety', () => {
      const engine = ExperimentEngine.getInstance();
      const exp = engine.launchExperiment({
        tenantId: TENANT_A,
        name: 'Dynamic Safety Stock Experiment',
        hypothesis: 'Dynamic safety stock buffer reduces stockouts by 12%',
        variantA: { multiplier: 1.0 },
        variantB: { multiplier: 1.3 },
        trafficAllocationPct: 75, // Intentionally request high allocation
        maxSpendLimit: 25000,
      });

      expect(exp.trafficAllocationPct).toBe(20); // Capped at 20%
      expect(exp.active).toBe(true);

      const concluded = engine.concludeExperiment(TENANT_A, exp.experimentId, 85, 92);
      expect(concluded?.active).toBe(false);
      expect(concluded?.results?.winner).toBe('VARIANT_B');
    });
  });

  // =========================================================================
  // 15. Closed Loop Decision Provenance Graph
  // =========================================================================
  describe('15. Closed Loop Decision Provenance Graph', () => {
    it('constructs multi-stage traceable graph from event to promoted version', () => {
      const graphEngine = ClosedLoopDecisionGraph.getInstance();
      const graph = graphEngine.buildFullTrace({
        tenantId: TENANT_A,
        eventId: 'EVT-PORT-AIS-01',
        decisionId: 'DEC-EXPEDITE-01',
        workflowId: 'WF-AIR-REROUTE',
        expectationId: 'EXP-101',
        observationId: 'OBS-202',
        varianceId: 'VAR-303',
        attributionId: 'ATTR-404',
        signalId: 'SIG-505',
        proposalId: 'PROP-606',
        versionId: 'v1.2.0',
      });

      expect(graph.traceId).toBeDefined();
      expect(graph.nodes.length).toBe(12);
      expect(graph.links.length).toBe(11);
      expect(graph.rootEventId).toBe('EVT-PORT-AIS-01');
      expect(graph.finalVersionId).toBe('v1.2.0');
    });
  });

  // =========================================================================
  // 16. Decision Memory Service
  // =========================================================================
  describe('16. Decision Memory Service', () => {
    it('stores and queries precedent decisions by category and search keyword', () => {
      const memoryService = DecisionMemoryService.getInstance();

      memoryService.storeMemory({
        tenantId: TENANT_A,
        decisionId: 'DEC-PORT-STRIKE-2025',
        category: 'PORT_CONGESTION',
        contextSummary: 'West Coast dockworkers strike caused 10 day vessel queue at Port of LA.',
        actionTaken: 'Intermodal rail diversion through Oakland and Seattle.',
        outcomeRecordId: 'OUT-991',
        effectivenessClass: 'SUCCESS',
        qualityScore: 92,
        tags: ['strike', 'rail_diversion', 'west_coast'],
      });

      memoryService.storeMemory({
        tenantId: TENANT_A,
        decisionId: 'DEC-AIR-EXPEDITE-2024',
        category: 'PORT_CONGESTION',
        contextSummary: 'Rotterdam container crane failure.',
        actionTaken: 'Air freight chartered for top 10 SKUs.',
        outcomeRecordId: 'OUT-992',
        effectivenessClass: 'PARTIAL_SUCCESS',
        qualityScore: 74,
        tags: ['crane', 'air_freight', 'rotterdam'],
      });

      const results = memoryService.queryMemories({
        tenantId: TENANT_A,
        query: 'rail diversion',
      });

      expect(results.length).toBe(1);
      expect(results[0].decisionId).toBe('DEC-PORT-STRIKE-2025');
      expect(results[0].qualityScore).toBe(92);
    });
  });
});
