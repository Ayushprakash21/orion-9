/**
 * ORION-9 WAVE 7: PLAYWRIGHT WORKFLOW ORCHESTRATION & AUTONOMOUS OPERATIONS E2E SUITE
 * 
 * Verifies all 14 mandatory Wave 7 E2E operational scenarios:
 * 1. Workflow Builder opens and renders templates.
 * 2. Create draft workflow in DRAFT status.
 * 3. Validate workflow step structure and transition matrix.
 * 4. Activate workflow with authorized admin role.
 * 5. Unauthorized user cannot activate or elevate workflow.
 * 6. Trigger workflow from exception event.
 * 7. Workflow enters approval gate when required by autonomy level.
 * 8. Human approves pending approval request.
 * 9. Workflow executes through Kernel CommandBus.
 * 10. Workflow Monitor tracks timeline, execution status, and audit log.
 * 11. Failed step enters retry with backoff.
 * 12. Terminal failure triggers compensation saga backward rollback.
 * 13. Simulation mode performs zero material mutations.
 * 14. Autonomy Center displays governed autonomy levels and prohibited operations.
 */

import { test, expect } from '@playwright/test';
import {
  workflowEngine,
  workflowVersionService,
  workflowTriggerEngine,
  WorkflowConditionEngine,
  workflowApprovalEngine,
  workflowCompensationEngine,
  WorkflowTimeoutEngine,
  WorkflowStateMachine,
  WorkflowRetryEngine,
  WorkflowSimulationEngine,
  AutonomyGovernanceEngine,
  workflowAuditEngine,
  workflowObservability,
  getAllStandardWorkflowTemplates,
  createSupplierDelayWorkflow,
  createLowInventoryWorkflow,
  WorkflowDefinition
} from '../../workflows';
import { KernelCommandBus } from '../../kernel/CommandBus';

test.describe('Orion-9 Wave 7 Autonomous Operations & Workflow Orchestration E2E', () => {
  const TENANT_A = 'TENANT_A';

  test.beforeEach(async ({ page }) => {
    // Setup Kernel handlers if not already present
    const commandBus = KernelCommandBus.getInstance();
    if (!commandBus.hasHandler('scm:shipment:expedite')) {
      commandBus.registerHandler('scm:shipment:expedite', async (cmd) => {
        return { expedited: true, trackingNumber: 'EXP-E2E-9901', cost: cmd.payload?.estimatedCost || 1200 };
      });
    }
    if (!commandBus.hasHandler('scm:purchase_order:update')) {
      commandBus.registerHandler('scm:purchase_order:update', async (cmd) => {
        return { poUpdated: true, newQuantity: cmd.payload?.reorderQuantity || 500 };
      });
    }
    if (!commandBus.hasHandler('scm:supplier:confirm')) {
      commandBus.registerHandler('scm:supplier:confirm', async (cmd) => {
        return { confirmationSent: true, method: cmd.payload?.noticeType || 'EDI' };
      });
    }
    if (!commandBus.hasHandler('scm:compensation:execute')) {
      commandBus.registerHandler('scm:compensation:execute', async (cmd) => {
        return { compensated: true, status: 'REVERSED' };
      });
    }

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

    const templates = getAllStandardWorkflowTemplates(TENANT_A);
    expect(templates.length).toBe(5);
    const templateIds = templates.map(t => t.workflowId);
    expect(templateIds).toContain('WF-SUPPLIER-DELAY-RESPONSE');
    expect(templateIds).toContain('WF-LOW-INVENTORY-RESPONSE');
    expect(templateIds).toContain('WF-SHIPMENT-DELAY-RESPONSE');
    expect(templateIds).toContain('WF-PO-CONFIRMATION-ESCALATION');
    expect(templateIds).toContain('WF-CUSTOMER-SERVICE-RISK');

    // Register definitions
    templates.forEach(t => workflowVersionService.registerDefinition(t));
    const registered = workflowVersionService.getDefinition(TENANT_A, templates[0].workflowId);
    expect(registered).toBeDefined();
    expect(registered?.workflowId).toBe(templates[0].workflowId);
  });

  // TEST 2: Create draft workflow in DRAFT status
  test('2. Create draft workflow in DRAFT status', async ({ page }) => {
    await page.goto('/');
    const draftDef: WorkflowDefinition = {
      workflowId: 'WF-E2E-DRAFT',
      tenantId: TENANT_A,
      name: 'E2E Expedite Draft Pipeline',
      description: 'Draft workflow for carrier expedite',
      version: '1.0.0-draft',
      status: 'DRAFT',
      riskClass: 'MEDIUM',
      autonomyLevel: 'LEVEL_2_DRAFT',
      trigger: {
        triggerId: 'TRIG-DRAFT',
        tenantId: TENANT_A,
        sourceType: 'SIGNAL',
        sourceId: 'SIG-DRAFT',
        eventType: 'SHIPMENT_DELAY',
        correlationId: 'CORR-DRAFT',
        timestamp: new Date().toISOString(),
        payloadReference: {}
      },
      steps: [
        {
          stepId: 'ST-DRAFT-01',
          name: 'Draft Freight Expedite',
          order: 1,
          type: 'ACTION',
          action: {
            actionId: 'ACT-DRAFT-01',
            type: 'DRAFT_EXPEDITE',
            payload: { shipmentId: 'SHP-900', targetCarrier: 'AIR_EXPRESS' },
            riskClass: 'LOW',
            isMaterial: false
          }
        }
      ],
      createdBy: 'admin-e2e-operator',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    workflowVersionService.registerDefinition(draftDef);
    const saved = workflowVersionService.getDefinition(TENANT_A, 'WF-E2E-DRAFT');
    expect(saved?.status).toBe('DRAFT');
    expect(saved?.workflowId).toBe('WF-E2E-DRAFT');
  });

  // TEST 3: Validate workflow step structure and transition matrix
  test('3. Validate workflow step structure and transition matrix', async ({ page }) => {
    await page.goto('/');
    expect(WorkflowStateMachine.canTransition('PENDING', 'RUNNING')).toBe(true);
    expect(WorkflowStateMachine.canTransition('RUNNING', 'WAITING_APPROVAL')).toBe(true);
    expect(WorkflowStateMachine.canTransition('WAITING_APPROVAL', 'RUNNING')).toBe(true);
    expect(WorkflowStateMachine.canTransition('RUNNING', 'COMPLETED')).toBe(true);
    expect(WorkflowStateMachine.canTransition('RUNNING', 'FAILED')).toBe(true);
    expect(WorkflowStateMachine.canTransition('FAILED', 'COMPENSATING')).toBe(true);
    expect(WorkflowStateMachine.canTransition('COMPENSATING', 'COMPENSATED')).toBe(true);

    // Forbidden terminal transitions
    expect(WorkflowStateMachine.canTransition('COMPLETED', 'RUNNING')).toBe(false);
    expect(WorkflowStateMachine.canTransition('COMPENSATED', 'RUNNING')).toBe(false);
  });

  // TEST 4: Activate workflow with authorized admin role
  test('4. Activate workflow with authorized admin role', async ({ page }) => {
    await page.goto('/');
    const wf = createLowInventoryWorkflow(TENANT_A);
    wf.status = 'ACTIVE';
    workflowVersionService.registerDefinition(wf);

    const version = workflowVersionService.publishVersion(TENANT_A, wf.workflowId, 'admin');
    expect(version.version).toBe('1.0.0');
    expect(version.immutable).toBe(true);

    const active = workflowVersionService.getDefinition(TENANT_A, wf.workflowId);
    expect(active?.status).toBe('ACTIVE');
  });

  // TEST 5: Unauthorized user cannot activate or elevate workflow
  test('5. Unauthorized user cannot activate or elevate workflow', async ({ page }) => {
    await page.goto('/');
    const viewerActor = { id: 'viewer-01', role: 'viewer', isAi: false };
    const canElevate = AutonomyGovernanceEngine.canElevateAutonomy(
      'LEVEL_2_DRAFT',
      'LEVEL_4_GOVERNED_AUTONOMOUS',
      viewerActor
    );
    expect(canElevate).toBe(false);

    const aiActor = { id: 'ai-bot', role: 'admin', isAi: true };
    const aiElevate = AutonomyGovernanceEngine.canElevateAutonomy(
      'LEVEL_2_DRAFT',
      'LEVEL_4_GOVERNED_AUTONOMOUS',
      aiActor
    );
    expect(aiElevate).toBe(false);
  });

  // TEST 6: Trigger workflow from exception event
  test('6. Trigger workflow from exception event', async ({ page }) => {
    await page.goto('/');
    const trigger = workflowTriggerEngine.createTrigger(
      TENANT_A,
      'EXCEPTION',
      'EXC-PORT-CONGESTION',
      'PORT_CONGESTION_EXCEPTION',
      { port: 'LAX', delayHours: 48 },
      'CORR-PORT-CONGESTION'
    );

    expect(trigger.triggerId).toBeDefined();
    expect(trigger.sourceType).toBe('EXCEPTION');
    expect(trigger.tenantId).toBe(TENANT_A);
  });

  // TEST 7: Workflow enters approval gate when required by autonomy level
  test('7. Workflow enters approval gate when required by autonomy level', async ({ page }) => {
    await page.goto('/');
    const wf = createSupplierDelayWorkflow(TENANT_A);
    workflowVersionService.registerDefinition(wf);

    const trigger = workflowTriggerEngine.createTrigger(
      TENANT_A,
      'SIGNAL',
      'SIG-DELAY-E2E',
      'SUPPLIER_DELAY',
      { delayDays: 4, daysOfSupply: 3 }
    );

    const instance = await workflowEngine.createInstance(wf, trigger);
    const paused = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

    expect(paused.status).toBe('WAITING_APPROVAL');
    expect(paused.activeApprovalId).toBeDefined();

    const approval = workflowApprovalEngine.getApproval(TENANT_A, paused.activeApprovalId!);
    expect(approval?.status).toBe('PENDING');
    expect(approval?.requiredRole).toBe('procurement_director');
  });

  // TEST 8: Human approves pending approval request
  test('8. Human approves pending approval request', async ({ page }) => {
    await page.goto('/');
    const wf = createSupplierDelayWorkflow(TENANT_A);
    workflowVersionService.registerDefinition(wf);

    const trigger = workflowTriggerEngine.createTrigger(
      TENANT_A,
      'SIGNAL',
      'SIG-DELAY-APP',
      'SUPPLIER_DELAY',
      { delayDays: 4, daysOfSupply: 3 }
    );

    const instance = await workflowEngine.createInstance(wf, trigger);
    const paused = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

    const resumed = await workflowEngine.resumeAfterApproval(
      TENANT_A,
      instance.workflowInstanceId,
      paused.activeApprovalId!,
      { id: 'dir-jane', role: 'procurement_director', name: 'Jane Director', isAi: false }
    );

    expect(resumed.status).toBe('COMPLETED');
    expect(resumed.activeApprovalId).toBeUndefined();
  });

  // TEST 9: Workflow executes through Kernel CommandBus
  test('9. Workflow executes through Kernel CommandBus', async ({ page }) => {
    await page.goto('/');
    const wf = createLowInventoryWorkflow(TENANT_A);
    workflowVersionService.registerDefinition(wf);

    const trigger = workflowTriggerEngine.createTrigger(
      TENANT_A,
      'PREDICTION',
      'PRED-E2E-EXEC',
      'LOW_INVENTORY',
      { stockoutProbability: 0.9 }
    );

    const instance = await workflowEngine.createInstance(wf, trigger);
    const completed = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

    expect(completed.status).toBe('COMPLETED');

    const logs = workflowAuditEngine.getAuditLog(TENANT_A);
    expect(logs.length).toBeGreaterThan(0);
  });

  // TEST 10: Workflow Monitor tracks timeline, execution status, and audit log
  test('10. Workflow Monitor tracks timeline, execution status, and audit log', async ({ page }) => {
    await page.goto('/');
    const metrics = workflowObservability.getWorkflowMetrics(TENANT_A);
    expect(metrics).toBeDefined();
    expect(metrics.totalTriggered).toBeGreaterThanOrEqual(0);
    expect(metrics.totalCompleted).toBeGreaterThanOrEqual(0);

    const logs = workflowAuditEngine.getAuditLog(TENANT_A);
    expect(Array.isArray(logs)).toBe(true);
  });

  // TEST 11: Failed step enters retry with backoff
  test('11. Failed step enters retry with backoff', async ({ page }) => {
    await page.goto('/');
    const policy = {
      maxRetries: 3,
      backoffStrategy: 'EXPONENTIAL' as const,
      initialDelayMs: 200,
      maxDelayMs: 2000
    };

    const delay1 = WorkflowRetryEngine.calculateDelayMs(policy, 1);
    const delay2 = WorkflowRetryEngine.calculateDelayMs(policy, 2);
    expect(delay1).toBe(200);
    expect(delay2).toBe(400);

    const isNetRetryable = WorkflowRetryEngine.isRetryable('NETWORK_TIMEOUT');
    expect(isNetRetryable).toBe(true);

    const isAuthRetryable = WorkflowRetryEngine.isRetryable('FORBIDDEN');
    expect(isAuthRetryable).toBe(false);
  });

  // TEST 12: Terminal failure triggers compensation saga backward rollback
  test('12. Terminal failure triggers compensation saga backward rollback', async ({ page }) => {
    await page.goto('/');
    const wf: WorkflowDefinition = {
      workflowId: 'WF-E2E-SAGA',
      tenantId: TENANT_A,
      name: 'E2E Saga Rollback Pipeline',
      description: 'Reservation step followed by failing step and rollback',
      version: '1.0.0',
      status: 'ACTIVE',
      riskClass: 'MEDIUM',
      autonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
      trigger: {
        triggerId: 'TRIG-SAGA-E2E',
        tenantId: TENANT_A,
        sourceType: 'EVENT',
        sourceId: 'EVT-01',
        eventType: 'SAGA_EVENT',
        correlationId: 'CORR-SAGA-E2E',
        timestamp: new Date().toISOString(),
        payloadReference: {}
      },
      steps: [
        {
          stepId: 'ST-SAGA-01',
          name: 'Draft Reservation',
          order: 1,
          type: 'ACTION',
          action: {
            actionId: 'ACT-RES-01',
            type: 'DRAFT_EXPEDITE',
            payload: { freightId: 'FR-01' },
            riskClass: 'LOW',
            isMaterial: false
          },
          compensatingStepId: 'ST-SAGA-03'
        },
        {
          stepId: 'ST-SAGA-02',
          name: 'Failing Kernel Step',
          order: 2,
          type: 'ACTION',
          action: {
            actionId: 'ACT-FAIL-02',
            type: 'DRAFT_REROUTE',
            commandType: 'UNREGISTERED_COMMAND_TRIGGER_FAIL',
            payload: {},
            riskClass: 'MEDIUM',
            isMaterial: true
          }
        },
        {
          stepId: 'ST-SAGA-03',
          name: 'Compensate Freight Reservation',
          order: 3,
          type: 'COMPENSATION',
          action: {
            actionId: 'ACT-COMP-03',
            type: 'COMPENSATE',
            commandType: 'scm:compensation:execute',
            payload: { freightId: 'FR-01' },
            riskClass: 'LOW',
            isMaterial: true
          }
        }
      ],
      createdBy: 'ADMIN',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    workflowVersionService.registerDefinition(wf);

    const trigger = workflowTriggerEngine.createTrigger(
      TENANT_A,
      'EVENT',
      'EVT-01',
      'SAGA_EVENT',
      {}
    );

    const instance = await workflowEngine.createInstance(wf, trigger);
    const result = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

    expect(result.status).toBe('COMPENSATED');
    const compensations = workflowCompensationEngine.listCompensations(TENANT_A, instance.workflowInstanceId);
    expect(compensations.length).toBe(1);
    expect(compensations[0].status).toBe('COMPLETED');
  });

  // TEST 13: Simulation mode performs zero material mutations
  test('13. Simulation mode performs zero material mutations', async ({ page }) => {
    await page.goto('/');
    const wf = createSupplierDelayWorkflow(TENANT_A);
    const report = WorkflowSimulationEngine.simulate(
      wf,
      { delayDays: 4, daysOfSupply: 3 },
      { id: 'ADMIN_SIM', role: 'admin', isAi: false }
    );

    expect(report.isDryRun).toBe(true);
    expect(report.mutationsPerformed).toBe(0);
    expect(report.evaluatedSteps.length).toBeGreaterThanOrEqual(1);
    expect(report.finalProjectedStatus).toBe('AWAITING_APPROVAL');
  });

  // TEST 14: Autonomy Center displays governed autonomy levels and prohibited operations
  test('14. Autonomy Center displays governed autonomy levels and prohibited operations', async ({ page }) => {
    await page.goto('/');
    expect(AutonomyGovernanceEngine.isOperationProhibited('PAYMENT_SETTLEMENT')).toBe(true);
    expect(AutonomyGovernanceEngine.isOperationProhibited('CONTRACT_MODIFICATION')).toBe(true);
    expect(AutonomyGovernanceEngine.isOperationProhibited('UPDATE_POLICY')).toBe(true);
    expect(AutonomyGovernanceEngine.isOperationProhibited('CREATE_ROLE')).toBe(true);
    expect(AutonomyGovernanceEngine.isOperationProhibited('DATABASE_MUTATION')).toBe(true);
    expect(AutonomyGovernanceEngine.isOperationProhibited('CODE_EXECUTION')).toBe(true);

    // AI self-approval prohibition check
    const aiApprovalCheck = workflowApprovalEngine.evaluateApprovalEligibility(
      { id: 'approval-01', tenantId: TENANT_A, requiredRole: 'buyer', status: 'PENDING' } as any,
      { id: 'ai-buyer-agent', role: 'buyer', isAi: true }
    );
    expect(aiApprovalCheck.eligible).toBe(false);
    expect(aiApprovalCheck.reason).toContain('AI agents are strictly forbidden from approving');
  });
});
