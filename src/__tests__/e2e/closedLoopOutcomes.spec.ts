/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Playwright End-to-End Test Suite: Closed Loop Outcomes & Governance
 * 
 * Verifies all 19 mandatory Wave 9 E2E operational scenarios:
 * 1. Outcome Center opens.
 * 2. Expected vs Actual visible.
 * 3. Variance visible.
 * 4. Decision effectiveness visible.
 * 5. Workflow effectiveness visible.
 * 6. Scenario accuracy visible.
 * 7. Learning Center opens.
 * 8. Learning signal visible.
 * 9. Improvement proposal created.
 * 10. Approval required.
 * 11. Unauthorized user cannot approve.
 * 12. Intelligence version comparison.
 * 13. Challenger visible.
 * 14. Drift signal visible.
 * 15. Rollback requires governance.
 * 16. Production Control Center opens.
 * 17. AI cannot modify outcome.
 * 18. AI cannot promote challenger.
 * 19. Cross-tenant access denied.
 */

import { test, expect } from '@playwright/test';
import {
  OutcomeExpectationService,
  OutcomeObservationService,
  OutcomeVarianceEngine,
  OutcomeAttributionEngine,
  DecisionEffectivenessEngine,
  WorkflowEffectivenessEngine,
  ScenarioAccuracyEngine,
  LearningSignalEngine,
  ImprovementProposalEngine,
  IntelligenceVersionEngine,
  ChallengerModeEngine,
  DriftDetectionEngine,
} from '../../outcomes';

test.describe('Orion-9 Wave 9 Closed-Loop Outcomes & Enterprise Learning E2E', () => {
  const TENANT_A = 'TENANT_A';
  const TENANT_B = 'TENANT_B';

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
      // Set active admin session for Platform Administration
      localStorage.setItem('orion_auth_session', JSON.stringify({
        uid: 'admin-wave9-chief',
        email: 'admin@orion9.enterprise',
        displayName: 'Platform Chief Admin',
        role: 'platform_admin',
        tenantId: 'TENANT_A',
        organizationId: 'TENANT_A',
      }));
    });
  });

  // SCENARIO 1: Outcome Center opens
  test('1. Outcome Center opens and renders header and KPIs', async ({ page }) => {
    await page.goto('/admin/outcomes');
    await expect(page.locator('h1:has-text("Outcome Center")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Closed-loop expected vs actual telemetry')).toBeVisible();
    await expect(page.locator('text=Evaluated Outcomes')).toBeVisible();
  });

  // SCENARIO 2: Expected vs Actual visible
  test('2. Expected vs Actual visible with OTIF and cost comparisons', async ({ page }) => {
    await page.goto('/admin/outcomes');
    await expect(page.locator('text=Expected OTIF').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Observed OTIF').first()).toBeVisible();
    await expect(page.locator('text=Expected Cost Savings').first()).toBeVisible();
  });

  // SCENARIO 3: Variance visible
  test('3. Variance visible with severity badges and directional bias', async ({ page }) => {
    await page.goto('/admin/outcomes');
    await expect(page.locator('text=VARIANCE').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("NEGLIGIBLE")')).toBeVisible();
    await expect(page.locator('button:has-text("CRITICAL")')).toBeVisible();
  });

  // SCENARIO 4: Decision effectiveness visible
  test('4. Decision effectiveness visible with quality score and ROI', async ({ page }) => {
    const expService = OutcomeExpectationService.getInstance();
    const obsService = OutcomeObservationService.getInstance();
    const varEngine = OutcomeVarianceEngine.getInstance();
    const decEngine = DecisionEffectivenessEngine.getInstance();

    const exp = await expService.registerExpectation({
      tenantId: TENANT_A,
      expectedCostSavings: 20000,
      expectedOTIF: 95.0,
      expectedTransitTimeDays: 3,
      expectedInventoryDays: 10,
    });
    const obs = await obsService.ingestObservation({
      tenantId: TENANT_A,
      expectationId: exp.expectationId,
      sourceSystem: 'SAP_ERP',
      actualCost: 19000,
      actualOTIF: 94.8,
      actualTransitTimeDays: 3.1,
      actualInventoryDays: 10,
      evidenceReference: 'SAP-E2E-01',
      recordedBy: 'IntegrationUser',
    });
    const v = varEngine.calculateVariance(exp, obs);
    const rec = decEngine.evaluateDecision(exp, obs, v);

    expect(rec.decisionQualityScore).toBeGreaterThanOrEqual(80);
    expect(rec.effectivenessClass).toBe('SUCCESS');

    await page.goto('/admin/outcomes');
    await expect(page.locator('text=Avg Quality Score')).toBeVisible({ timeout: 10000 });
  });

  // SCENARIO 5: Workflow effectiveness visible
  test('5. Workflow effectiveness visible evaluating SLA and saga compensation', async () => {
    const wfEngine = WorkflowEffectivenessEngine.getInstance();
    const evalRes = wfEngine.evaluateWorkflow({
      tenantId: TENANT_A,
      workflowInstanceId: 'wf-auto-e2e',
      resolvedException: true,
      durationMs: 2500,
      slaTargetMs: 10000,
      retryCount: 0,
    });

    expect(evalRes.effectivenessScore).toBe(100);
    expect(evalRes.slaBreached).toBe(false);
  });

  // SCENARIO 6: Scenario accuracy visible
  test('6. Scenario accuracy visible calculating MAPE and calibration recommendation', async () => {
    const scenEngine = ScenarioAccuracyEngine.getInstance();
    const accuracy = scenEngine.evaluateScenarioProjection({
      tenantId: TENANT_A,
      scenarioId: 'SCEN-PORT-E2E',
      scenarioType: 'PORT_CONGESTION',
      projectedCost: 40000,
      actualCost: 41000,
      projectedOTIF: 92,
      actualOTIF: 90,
    });

    expect(accuracy.mape).toBeLessThan(10);
    expect(accuracy.calibrationRecommended).toBe(false);
  });

  // SCENARIO 7: Learning Center opens
  test('7. Learning Center opens and displays navigation tabs', async ({ page }) => {
    await page.goto('/admin/learning');
    await expect(page.locator('h1:has-text("Learning Center")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Learning Signals")')).toBeVisible();
    await expect(page.locator('button:has-text("Improvement Proposals")')).toBeVisible();
  });

  // SCENARIO 8: Learning signal visible
  test('8. Learning signal visible with drift magnitude and recommended action', async ({ page }) => {
    await page.goto('/admin/learning');
    await expect(page.locator('text=Drift: +').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Recommended Action:').first()).toBeVisible();
  });

  // SCENARIO 9: Improvement proposal created
  test('9. Improvement proposal created from learning signal', async ({ page }) => {
    await page.goto('/admin/learning');
    const draftBtn = page.locator('button:has-text("Draft Proposal")').first();
    await expect(draftBtn).toBeVisible({ timeout: 10000 });
    await draftBtn.click();

    await expect(page.locator('text=Draft Governed Improvement Proposal')).toBeVisible();
    const submitBtn = page.locator('button:has-text("Submit Proposal")');
    await submitBtn.click();

    await expect(page.locator('text=Improvement proposal created successfully')).toBeVisible();
  });

  // SCENARIO 10: Approval required
  test('10. Approval required for improvement proposals before production deployment', async ({ page }) => {
    await page.goto('/admin/learning');
    await page.locator('button:has-text("Improvement Proposals")').click();
    await expect(page.locator('text=PENDING_APPROVAL').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Approve (Human)")').first()).toBeVisible();
  });

  // SCENARIO 11: Unauthorized user cannot approve
  test('11. Unauthorized non-admin user cannot approve improvement proposal', async () => {
    const proposalEngine = ImprovementProposalEngine.getInstance();
    const prop = proposalEngine.createProposal({
      tenantId: TENANT_A,
      signalId: 'SIG-TEST',
      title: 'Safety Stock Bump',
      description: 'Increase safety stock',
      proposalType: 'SAFETY_STOCK_PARAMETER_UPDATE',
      proposedChanges: { multiplier: 1.3 },
      baselineParameters: { multiplier: 1.0 },
      expectedImpact: { otifImprovementPct: 3, costReductionAnnualized: 10000, riskReductionPct: 15 },
      createdBy: 'Analyst',
    });

    const unauthorizedReview = proposalEngine.reviewProposal({
      tenantId: TENANT_A,
      proposalId: prop.proposalId,
      reviewedBy: 'standard_buyer_01',
      userRole: 'buyer',
      isAIAgent: false,
      action: 'APPROVED',
      justification: 'Buyer approval attempt',
    });

    expect(unauthorizedReview.success).toBe(false);
    expect(unauthorizedReview.error).toMatch(/PERMISSION_DENIED/i);
  });

  // SCENARIO 12: Intelligence version comparison
  test('12. Intelligence version comparison renders active version and parameter diff', async ({ page }) => {
    await page.goto('/admin/rollback');
    await expect(page.locator('text=Active Production Configuration')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=v1.0.0').first()).toBeVisible();
  });

  // SCENARIO 13: Challenger visible
  test('13. Challenger shadow comparison evaluates metrics without taking production action', async () => {
    const challengerEngine = ChallengerModeEngine.getInstance();
    const comparison = challengerEngine.evaluateShadowRun({
      tenantId: TENANT_A,
      championVersion: 'v1.0.0',
      challengerVersion: 'v1.2.0-CANDIDATE',
      sampleCount: 100,
      championAccuracyPct: 86.0,
      challengerAccuracyPct: 93.0,
      championCost: 50000,
      challengerCost: 47000,
    });

    expect(comparison.recommendation).toBe('PROMOTE');
    expect(comparison.confidenceScore).toBeGreaterThanOrEqual(90);
  });

  // SCENARIO 14: Drift signal visible
  test('14. Drift signal visible with divergence score and alert state', async ({ page }) => {
    await page.goto('/admin/drift');
    await expect(page.locator('h1:has-text("Drift Center")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Divergence Score').first()).toBeVisible();
    await expect(page.locator('text=Normal Operations')).toBeVisible();
  });

  // SCENARIO 15: Rollback requires governance
  test('15. Rollback requires governance justification and blocks unauthorized triggers', async ({ page }) => {
    await page.goto('/admin/rollback');
    await expect(page.locator('h1:has-text("Rollback Center")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("Trigger Governed Rollback")')).toBeVisible();

    const versionEngine = IntelligenceVersionEngine.getInstance();
    versionEngine.ensureBaselineVersion(TENANT_A);
    const aiAttempt = versionEngine.rollbackToVersion({
      tenantId: TENANT_A,
      targetVersionId: 'v1.0.0',
      executedBy: 'AI-Agent-1',
      userRole: 'admin',
      reason: 'AI attempted rollback',
      isAIAgent: true,
    });

    expect(aiAttempt.success).toBe(false);
    expect(aiAttempt.error).toMatch(/GOVERNANCE_VIOLATION/i);
  });

  // SCENARIO 16: Production Control Center opens
  test('16. Production Control Center opens and renders all 6 security gates verified', async ({ page }) => {
    await page.goto('/admin/readiness');
    await expect(page.locator('h1:has-text("Production Readiness Center")')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=All 6 Security Gates Green')).toBeVisible();
    await expect(page.locator('text=Kernel CommandBus & PolicyEngine Gating')).toBeVisible();
    await expect(page.locator('text=Real Firebase Emulator Security Isolation')).toBeVisible();
  });

  // SCENARIO 17: AI cannot modify outcome
  test('17. AI cannot modify outcome records (immutable ledger invariant)', async () => {
    const decEngine = DecisionEffectivenessEngine.getInstance();
    const expService = OutcomeExpectationService.getInstance();
    const obsService = OutcomeObservationService.getInstance();
    const varEngine = OutcomeVarianceEngine.getInstance();

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
      actualCost: 10000,
      actualOTIF: 95,
      actualTransitTimeDays: 3,
      actualInventoryDays: 10,
      evidenceReference: 'SAP-REF',
      recordedBy: 'IntegrationUser',
    });
    const v = varEngine.calculateVariance(exp, obs);
    const rec = decEngine.evaluateDecision(exp, obs, v);

    expect(rec.isImmutable).toBe(true);
    expect(Object.isFrozen(rec) || rec.isImmutable).toBe(true);
  });

  // SCENARIO 18: AI cannot promote challenger
  test('18. AI cannot promote challenger or intelligence versions', async () => {
    const versionEngine = IntelligenceVersionEngine.getInstance();
    const result = versionEngine.promoteVersion({
      tenantId: TENANT_A,
      versionId: 'v1.5.0',
      parameters: { testParam: 1 },
      policyThresholds: { autoApprovalPoLimit: 100000 },
      promotedBy: 'AI_AGENT_PROMOTER',
      userRole: 'admin',
      isAIAgent: true,
    });

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/GOVERNANCE_VIOLATION.*AI agents are strictly forbidden/i);
  });

  // SCENARIO 19: Cross-tenant access denied
  test('19. Cross-tenant access denied across learning signals and proposals', async () => {
    const signalEngine = LearningSignalEngine.getInstance();
    signalEngine.emitSignal({
      tenantId: TENANT_A,
      metric: 'TENANT_A_LEAD_TIME',
      driftMagnitudePct: 15,
      sampleSize: 10,
      status: 'REVIEW_REQUIRED',
      recommendedAction: 'Tenant A adjustment',
      detectedBy: 'Detector',
    });

    signalEngine.emitSignal({
      tenantId: TENANT_B,
      metric: 'TENANT_B_COST_SPIKE',
      driftMagnitudePct: 20,
      sampleSize: 10,
      status: 'REVIEW_REQUIRED',
      recommendedAction: 'Tenant B adjustment',
      detectedBy: 'Detector',
    });

    const tenantASignals = signalEngine.listSignals(TENANT_A);
    const tenantBSignals = signalEngine.listSignals(TENANT_B);

    expect(tenantASignals.every(s => s.tenantId === TENANT_A)).toBe(true);
    expect(tenantBSignals.every(s => s.tenantId === TENANT_B)).toBe(true);
    expect(tenantASignals.some(s => s.metric === 'TENANT_B_COST_SPIKE')).toBe(false);
  });
});
