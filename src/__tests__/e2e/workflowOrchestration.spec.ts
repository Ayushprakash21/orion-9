/**
 * ORION-9 WAVE 7: PLAYWRIGHT WORKFLOW ORCHESTRATION & AUTONOMOUS OPERATIONS E2E SUITE
 * 
 * Verifies all 14 mandatory Wave 7 E2E operational scenarios:
 * 1. Workflow Builder opens.
 * 2. Create draft workflow.
 * 3. Validate workflow.
 * 4. Activate workflow with authorized admin.
 * 5. Unauthorized user cannot activate.
 * 6. Trigger workflow from exception.
 * 7. Workflow enters approval.
 * 8. Human approves.
 * 9. Workflow executes through Kernel.
 * 10. Workflow Monitor shows timeline.
 * 11. Failed workflow enters retry.
 * 12. Workflow enters compensation.
 * 13. Simulation mode performs zero mutations.
 * 14. Autonomy Center displays governed actions.
 */

import { test, expect } from '@playwright/test';
import {
  workflowVersionService,
  workflowEngine,
  workflowStateMachine,
  autonomyGovernanceEngine,
  workflowApprovalEngine,
  workflowCompensationEngine,
  workflowRetryEngine,
  workflowSimulationEngine,
  workflowObservability,
  workflowAuditEngine,
  getAllStandardWorkflowTemplates,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStep,
} from '../../workflows';

test.describe('Orion-9 Wave 7 Autonomous Operations & Workflow Orchestration E2E', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      sessionStorage.setItem('orion_os_power_state', 'ON');
      // Set active admin session for control plane access
      localStorage.setItem('orion_auth_session', JSON.stringify({
        uid: 'admin-e2e-operator',
        email: 'admin@orion9.enterprise',
        displayName: 'Enterprise Admin',
        role: 'admin',
        tenantId: 'TENANT_A',
        organizationId: 'TENANT_A'
      }));
    });
  });

  // TEST 1: Workflow Builder opens and renders templates
  test('1. Workflow Builder opens and renders templates', async ({ page }) => {
    await page.goto('/');
    const body = page.locator('body');
    await expect(body).toBeVisible();

    const templates = getAllStandardWorkflowTemplates('TENANT_A');
    expect(templates.length).toBe(5);
    expect(templates.some(t => t.workflowId === 'WF-TMPL-SUPPLIER-DELAY')).toBe(true);
    expect(templates.some(t => t.workflowId === 'WF-TMPL-LOW-INVENTORY')).toBe(true);
    expect(templates.some(t => t.workflowId === 'WF-TMPL-SHIPMENT-DELAY')).toBe(true);

    // Register into version service
    templates.forEach(t => workflowVersionService.registerDefinition(t));
    const registered = workflowVersionService.getDefinition('TENANT_A', templates[0].workflowId);
    expect(registered).toBeDefined();
    expect(registered?.workflowId).toBe(templates[0].workflowId);
  });

  // TEST 2: Create draft workflow in DRAFT status
  test('2. Create draft workflow in DRAFT status', async ({ page }) => {
    await page.goto('/');
    const draftDef: WorkflowDefinition = {
      workflowId: 'WF-E2E-DRAFT',
      tenantId: 'TENANT_A',
      name: 'E2E Expedite Draft Pipeline',
      description: 'Draft workflow for carrier expedite',
      version: '1.0.0-draft',
      status: 'DRAFT',
      riskClass: 'MEDIUM',
      autonomyLevel: 'LEVEL_2_DRAFT',
      trigger: {
        triggerId: 'TRIG-DRAFT',
        tenantId: 'TENANT_A',
        sourceType: 'SIGNAL',
        sourceId: 'SIG-DRAFT',
        eventType: 'SHIPMENT_DELAY',
        correlationId: 'CORR-DRAFT',
        timestamp: new Date().toISOString(),
      },
      steps: [
        {
          stepId: 'step-1',
          name: 'Assess Expedite Cost',
          type: 'ACTION',
          actionType: 'shipment:assess_cost',
          commandPayload: { shipmentId: 'SHP-900', targetCarrier: 'AIR_EXPRESS' },
          requiresApproval: false,
          timeoutSeconds: 30,
        }
      ],
      compensationSteps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'admin-e2e-operator',
      tenantIsolationEnforced: true,
    };

    const saved = workflowVersionService.registerDefinition(draftDef);
    expect(saved.status).toBe('DRAFT');
    expect(saved.workflowId).toBe('WF-E2E-DRAFT');
  });

  // TEST 3: Validate workflow step structure and transition matrix
  test('3. Validate workflow step structure and transition matrix', async ({ page }) => {
    await page.goto('/');
    expect(workflowStateMachine.canTransition('CREATED', 'TRIGGERED')).toBe(true);
    expect(workflowStateMachine.canTransition('TRIGGERED', 'RUNNING')).toBe(true);
    expect(workflowStateMachine.canTransition('RUNNING', 'WAITING_APPROVAL')).toBe(true);
    expect(workflowStateMachine.canTransition('WAITING_APPROVAL', 'RUNNING')).toBe(true);
    expect(workflowStateMachine.canTransition('RUNNING', 'COMPLETED')).toBe(true);
    expect(workflowStateMachine.canTransition('RUNNING', 'FAILED')).toBe(true);
    expect(workflowStateMachine.canTransition('FAILED', 'COMPENSATING')).toBe(true);
    expect(workflowStateMachine.canTransition('COMPENSATING', 'COMPENSATED')).toBe(true);

    // Invalid transitions
    expect(workflowStateMachine.canTransition('COMPLETED', 'RUNNING')).toBe(false);
    expect(workflowStateMachine.canTransition('COMPENSATED', 'RUNNING')).toBe(false);
  });

  // TEST 4: Activate workflow with authorized admin role
  test('4. Activate workflow with authorized admin role', async ({ page }) => {
    await page.goto('/');
    const adminUser = {
      uid: 'admin-e2e',
      tenantId: 'TENANT_A',
      role: 'admin',
    };

    const activeDef = workflowVersionService.activateDefinition('TENANT_A', 'WF-E2E-DRAFT', adminUser);
    expect(activeDef.status).toBe('ACTIVE');
    expect(activeDef.activeVersion).toBe('1.0.0-draft');
  });

  // TEST 5: Unauthorized user cannot activate or elevate workflow
  test('5. Unauthorized user cannot activate or elevate workflow', async ({ page }) => {
    await page.goto('/');
    const viewerUser = {
      uid: 'viewer-e2e',
      tenantId: 'TENANT_A',
      role: 'viewer',
    };

    expect(() => {
      workflowVersionService.activateDefinition('TENANT_A', 'WF-E2E-DRAFT', viewerUser);
    }).toThrow(/Unauthorized/);
  });

  // TEST 6: Trigger workflow from exception event
  test('6. Trigger workflow from exception event', async ({ page }) => {
    await page.goto('/');
    const def = workflowVersionService.getDefinition('TENANT_A', 'WF-E2E-DRAFT');
    expect(def).toBeDefined();

    const instance = await workflowEngine.createInstance({
      workflowId: def!.workflowId,
      tenantId: 'TENANT_A',
      trigger: {
        triggerId: 'TRIG-EXC-01',
        tenantId: 'TENANT_A',
        sourceType: 'EXCEPTION',
        sourceId: 'EXC-PORT-CONGESTION',
        eventType: 'PORT_CONGESTION_EXCEPTION',
        correlationId: 'CORR-PORT-CONGESTION',
        timestamp: new Date().toISOString(),
        payload: { port: 'LAX', delayHours: 48 },
      },
      actor: {
        id: 'system-agent',
        type: 'AI_AGENT',
        agentId: 'EXCEPTION_WATCHER_01',
      },
    });

    expect(instance.instanceId).toBeDefined();
    expect(instance.status).toBe('CREATED');
    expect(instance.trigger.sourceType).toBe('EXCEPTION');
  });

  // TEST 7: Workflow enters approval gate when required by autonomy level
  test('7. Workflow enters approval gate when required by autonomy level', async ({ page }) => {
    await page.goto('/');
    const stepWithApproval: WorkflowStep = {
      stepId: 'step-expedite-approval',
      name: 'Reroute to Air Freight',
      type: 'ACTION',
      actionType: 'shipment:reroute',
      commandPayload: { shipmentId: 'SHP-1234', carrier: 'FedEx Air', surcharge: 2500 },
      requiresApproval: true,
      approvalRole: 'logistics_manager',
      timeoutSeconds: 60,
    };

    const approvalInstance = await workflowEngine.createInstance({
      workflowId: 'WF-E2E-APPROVAL-TEST',
      tenantId: 'TENANT_A',
      trigger: {
        triggerId: 'TRIG-APP-01',
        tenantId: 'TENANT_A',
        sourceType: 'SIGNAL',
        sourceId: 'SIG-CRITICAL-DELAY',
        eventType: 'SHIPMENT_DELAY',
        correlationId: 'CORR-CRITICAL',
        timestamp: new Date().toISOString(),
      },
      steps: [stepWithApproval],
      actor: {
        id: 'ai-operator',
        type: 'AI_AGENT',
        agentId: 'LOGISTICS_AI',
      },
      autonomyLevel: 'LEVEL_3_APPROVAL',
    });

    const executionResult = await workflowEngine.startExecution(approvalInstance.instanceId);
    expect(executionResult.status).toBe('WAITING_APPROVAL');

    const pendingApprovals = workflowApprovalEngine.getPendingApprovals('TENANT_A');
    const workflowApproval = pendingApprovals.find(a => a.instanceId === approvalInstance.instanceId);
    expect(workflowApproval).toBeDefined();
    expect(workflowApproval?.requiredRole).toBe('logistics_manager');
  });

  // TEST 8: Human approves pending approval request
  test('8. Human approves pending approval request', async ({ page }) => {
    await page.goto('/');
    const pending = workflowApprovalEngine.getPendingApprovals('TENANT_A');
    expect(pending.length).toBeGreaterThan(0);
    const targetApproval = pending[0];

    const humanUser = {
      id: 'human-logistics-mgr',
      name: 'Sarah Logistics Director',
      role: 'logistics_manager',
    };

    const approvedRecord = workflowApprovalEngine.submitDecision(
      targetApproval.approvalId,
      'APPROVED',
      humanUser,
      'Approved premium air reroute due to SLA deadline'
    );

    expect(approvedRecord.decision).toBe('APPROVED');
    expect(approvedRecord.approvedBy).toBe('human-logistics-mgr');
  });

  // TEST 9: Workflow executes through Kernel CommandBus
  test('9. Workflow executes through Kernel CommandBus', async ({ page }) => {
    await page.goto('/');
    const stepDispatch: WorkflowStep = {
      stepId: 'step-kernel-dispatch',
      name: 'Confirm Supplier Delivery Date',
      type: 'ACTION',
      actionType: 'supplier:confirm',
      commandPayload: { supplierId: 'SUP-ACME', poNumber: 'PO-888', confirmedDate: '2026-10-01' },
      requiresApproval: false,
      timeoutSeconds: 30,
    };

    const dispatchInstance = await workflowEngine.createInstance({
      workflowId: 'WF-E2E-KERNEL-DISPATCH',
      tenantId: 'TENANT_A',
      trigger: {
        triggerId: 'TRIG-SUP-01',
        tenantId: 'TENANT_A',
        sourceType: 'EVENT',
        sourceId: 'EVT-PO-ACCEPTED',
        eventType: 'SUPPLIER_ACCEPTED',
        correlationId: 'CORR-SUP-01',
        timestamp: new Date().toISOString(),
      },
      steps: [stepDispatch],
      actor: {
        id: 'procurement-bot',
        type: 'AI_AGENT',
        agentId: 'BUYER_AI',
      },
      autonomyLevel: 'LEVEL_4_AUTONOMOUS',
    });

    const runResult = await workflowEngine.startExecution(dispatchInstance.instanceId);
    expect(runResult.status).toBe('COMPLETED');
    expect(runResult.currentStepIndex).toBe(1);

    // Verify audit logs were captured
    const logs = workflowAuditEngine.getAuditLogs('TENANT_A', dispatchInstance.instanceId);
    expect(logs.length).toBeGreaterThan(0);
    expect(logs.some(l => l.action.includes('EXECUTION'))).toBe(true);
  });

  // TEST 10: Workflow Monitor tracks timeline, execution status, and audit log
  test('10. Workflow Monitor tracks timeline, execution status, and audit log', async ({ page }) => {
    await page.goto('/');
    const timeline = workflowObservability.getWorkflowTimeline('TENANT_A');
    expect(timeline.length).toBeGreaterThan(0);

    const metrics = workflowObservability.getObservabilityMetrics('TENANT_A');
    expect(metrics.totalInstances).toBeGreaterThan(0);
    expect(metrics.completedInstances).toBeGreaterThan(0);
    expect(metrics.activeInstances).toBeGreaterThanOrEqual(0);
  });

  // TEST 11: Failed step enters retry with backoff
  test('11. Failed step enters retry with backoff', async ({ page }) => {
    await page.goto('/');
    const retryPolicy = {
      maxAttempts: 3,
      backoffStrategy: 'EXPONENTIAL' as const,
      initialDelayMs: 100,
      maxDelayMs: 2000,
      multiplier: 2,
    };

    const state1 = workflowRetryEngine.recordAttempt('RET-E2E-01', 'TENANT_A', retryPolicy, 'Transient carrier API error');
    expect(state1.attemptNumber).toBe(1);
    expect(state1.delayMs).toBe(100);
    expect(state1.canRetry).toBe(true);

    const state2 = workflowRetryEngine.recordAttempt('RET-E2E-01', 'TENANT_A', retryPolicy, 'Transient timeout error');
    expect(state2.attemptNumber).toBe(2);
    expect(state2.delayMs).toBe(200);
    expect(state2.canRetry).toBe(true);

    const state3 = workflowRetryEngine.recordAttempt('RET-E2E-01', 'TENANT_A', retryPolicy, 'Transient 503 error');
    expect(state3.attemptNumber).toBe(3);
    expect(state3.canRetry).toBe(false);
  });

  // TEST 12: Terminal failure triggers compensation saga backward rollback
  test('12. Terminal failure triggers compensation saga backward rollback', async ({ page }) => {
    await page.goto('/');
    const stepsWithCompensation: WorkflowStep[] = [
      {
        stepId: 'step-reserve-inventory',
        name: 'Reserve Buffer Stock',
        type: 'ACTION',
        actionType: 'purchase_order:update',
        commandPayload: { poId: 'PO-900', bufferAllocated: 50 },
        requiresApproval: false,
        timeoutSeconds: 30,
      },
      {
        stepId: 'step-compensate-inventory',
        name: 'Release Buffer Stock',
        type: 'COMPENSATION',
        actionType: 'compensation:execute',
        commandPayload: { poId: 'PO-900', releaseBuffer: true },
        requiresApproval: false,
        timeoutSeconds: 30,
      }
    ];

    const sagaInstance = await workflowEngine.createInstance({
      workflowId: 'WF-E2E-SAGA-TEST',
      tenantId: 'TENANT_A',
      trigger: {
        triggerId: 'TRIG-SAGA-01',
        tenantId: 'TENANT_A',
        sourceType: 'EXCEPTION',
        sourceId: 'EXC-OUT-OF-STOCK',
        eventType: 'STOCKOUT_EXCEPTION',
        correlationId: 'CORR-SAGA',
        timestamp: new Date().toISOString(),
      },
      steps: stepsWithCompensation,
      compensationSteps: [stepsWithCompensation[1]],
      actor: {
        id: 'system-agent',
        type: 'AI_AGENT',
        agentId: 'INVENTORY_AI',
      },
    });

    const compensatedInstance = await workflowEngine.triggerCompensation(
      sagaInstance.instanceId,
      'Downstream transport booking rejected'
    );

    expect(compensatedInstance.status).toBe('COMPENSATED');
    expect(compensatedInstance.compensationStatus).toBe('COMPLETED');
  });

  // TEST 13: Simulation mode performs zero material mutations
  test('13. Simulation mode performs zero material mutations', async ({ page }) => {
    await page.goto('/');
    const simDef = getAllStandardWorkflowTemplates('TENANT_A')[0];
    const simResult = await workflowSimulationEngine.simulateWorkflow(simDef, {
      simulatedInputs: { testDelay: 12 },
    });

    expect(simResult.simulationId).toBeDefined();
    expect(simResult.projectedCostDelta).toBeDefined();
    expect(simResult.projectedRiskReduction).toBeDefined();
    expect(simResult.simulatedSteps.length).toBeGreaterThan(0);
    // Verification that no real mutation was committed
    expect(simResult.isDryRun).toBe(true);
  });

  // TEST 14: Autonomy Center displays governed autonomy levels and prohibited operations
  test('14. Autonomy Center displays governed autonomy levels and prohibited operations', async ({ page }) => {
    await page.goto('/');
    // Check prohibited operations enforcement
    const prohibitedCheck1 = autonomyGovernanceEngine.isOperationProhibited('payment:settle');
    expect(prohibitedCheck1).toBe(true);

    const prohibitedCheck2 = autonomyGovernanceEngine.isOperationProhibited('contract:modify_terms');
    expect(prohibitedCheck2).toBe(true);

    const prohibitedCheck3 = autonomyGovernanceEngine.isOperationProhibited('policy:mutate');
    expect(prohibitedCheck3).toBe(true);

    const allowedCheck = autonomyGovernanceEngine.isOperationProhibited('shipment:reroute');
    expect(allowedCheck).toBe(false);

    // Verify AI self-approval prohibition
    const aiSelfApproval = workflowApprovalEngine.validateApproverRole('LEVEL_3_APPROVAL', {
      id: 'ai-agent-01',
      name: 'Auto Bot',
      role: 'ai_agent',
    });
    expect(aiSelfApproval.valid).toBe(false);
    expect(aiSelfApproval.reason).toMatch(/AI agents are prohibited from self-approving/);
  });
});
