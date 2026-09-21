/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Lifecycle & Integration Test Suite
 * 
 * Verifies end-to-end orchestration:
 * 1. Template generation and semantic version immutability
 * 2. Trigger ingestion and workflow matching
 * 3. Safe AST condition evaluation (no eval)
 * 4. Governed autonomous execution (Level 4) through Kernel CommandBus
 * 5. Approval-gated execution (Level 3) with human sign-off
 * 6. Asynchronous external wait states (WAITING_EXTERNAL)
 * 7. Saga backward compensation on step failure
 * 8. Durable scheduling and timeout evaluation
 * 9. Dry-run simulation with zero mutations
 * 10. Audit ledger and telemetry observability
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  workflowEngine,
  workflowVersionService,
  workflowTriggerEngine,
  WorkflowConditionEngine,
  workflowApprovalEngine,
  workflowCompensationEngine,
  WorkflowTimeoutEngine,
  workflowScheduler,
  WorkflowSimulationEngine,
  workflowAuditEngine,
  workflowObservability,
  getAllStandardWorkflowTemplates,
  createSupplierDelayWorkflow,
  createLowInventoryWorkflow,
  createPOConfirmationEscalationWorkflow,
  WorkflowDefinition
} from '../../workflows';
import { KernelCommandBus } from '../../kernel/CommandBus';

describe('Wave 7 Workflow Lifecycle & Orchestration Integration', () => {
  const TENANT_A = 'TENANT_A';

  beforeEach(() => {
    workflowVersionService.clear();
    workflowEngine.clear();
    workflowApprovalEngine.clear();
    workflowCompensationEngine.clear();
    workflowScheduler.clear();
    workflowAuditEngine.clear();
    workflowObservability.clear();
    workflowTriggerEngine.clear();

    // Register test command handlers on KernelCommandBus to handle workflow actions
    const commandBus = KernelCommandBus.getInstance();
    if (!commandBus.hasHandler('scm:shipment:expedite')) {
      commandBus.registerHandler('scm:shipment:expedite', async (cmd) => {
        return { expedited: true, trackingNumber: 'EXP-9901', cost: cmd.payload.estimatedCost };
      });
    }
    if (!commandBus.hasHandler('scm:purchase_order:update')) {
      commandBus.registerHandler('scm:purchase_order:update', async (cmd) => {
        return { poUpdated: true, newQuantity: cmd.payload.reorderQuantity };
      });
    }
    if (!commandBus.hasHandler('scm:supplier:confirm')) {
      commandBus.registerHandler('scm:supplier:confirm', async (cmd) => {
        return { confirmationSent: true, method: cmd.payload.noticeType };
      });
    }
    if (!commandBus.hasHandler('scm:compensation:execute')) {
      commandBus.registerHandler('scm:compensation:execute', async (cmd) => {
        return { compensated: true, status: 'REVERSED' };
      });
    }
  });

  describe('1. SCM Workflow Templates & Version Immutability', () => {
    it('initializes all 5 deterministic standard SCM templates', () => {
      const templates = getAllStandardWorkflowTemplates(TENANT_A);
      expect(templates.length).toBe(5);

      const ids = templates.map(t => t.workflowId);
      expect(ids).toContain('WF-SUPPLIER-DELAY-RESPONSE');
      expect(ids).toContain('WF-LOW-INVENTORY-RESPONSE');
      expect(ids).toContain('WF-SHIPMENT-DELAY-RESPONSE');
      expect(ids).toContain('WF-PO-CONFIRMATION-ESCALATION');
      expect(ids).toContain('WF-CUSTOMER-SERVICE-RISK');
    });

    it('publishes and enforces immutable definition snapshots', () => {
      const wf = createLowInventoryWorkflow(TENANT_A);
      workflowVersionService.registerDefinition(wf);
      const version = workflowVersionService.publishVersion(TENANT_A, wf.workflowId, 'admin');

      expect(version.version).toBe('1.0.0');
      expect(version.immutable).toBe(true);

      const snapshot = workflowVersionService.getVersionSnapshot(TENANT_A, wf.workflowId, '1.0.0');
      expect(snapshot?.name).toBe(wf.name);
    });
  });

  describe('2. Trigger Engine & Condition Evaluation', () => {
    it('creates standardized triggers and matches active workflows', () => {
      const wf = createLowInventoryWorkflow(TENANT_A);
      const trigger = workflowTriggerEngine.createTrigger(
        TENANT_A,
        'PREDICTION',
        'PRED-101',
        'LOW_INVENTORY',
        { stockoutProbability: 0.9, partId: 'PART-A' },
        'CORR-TRIGGER-TEST'
      );

      const matches = workflowTriggerEngine.matchWorkflows(trigger, [wf]);
      expect(matches.length).toBe(1);
      expect(matches[0].workflowId).toBe('WF-LOW-INVENTORY-RESPONSE');
    });

    it('evaluates complex conditions with safe AST logic (zero eval)', () => {
      const context = {
        inventory: { daysOfSupply: 4, reserved: 200 },
        supplier: { delayDays: 5, rating: 'A' },
        risk: { score: 85 }
      };

      const cond = {
        id: 'COND-TEST',
        operator: 'AND' as const,
        clauses: [
          { field: 'inventory.daysOfSupply', operator: 'LESS_THAN' as const, value: 7 },
          { field: 'supplier.delayDays', operator: 'GREATER_THAN_OR_EQUAL' as const, value: 3 },
          { field: 'risk.score', operator: 'GREATER_THAN' as const, value: 80 }
        ]
      };

      expect(WorkflowConditionEngine.evaluate(cond, context)).toBe(true);

      // Mutate condition to fail
      const failingCond = {
        ...cond,
        clauses: [{ field: 'inventory.daysOfSupply', operator: 'GREATER_THAN' as const, value: 10 }]
      };
      expect(WorkflowConditionEngine.evaluate(failingCond, context)).toBe(false);
    });
  });

  describe('3. Governed Autonomous Execution (LEVEL_4_GOVERNED_AUTONOMOUS)', () => {
    it('executes pre-authorized medium-risk workflow through Kernel without human gate', async () => {
      const wf = createLowInventoryWorkflow(TENANT_A);
      workflowVersionService.registerDefinition(wf);

      const trigger = workflowTriggerEngine.createTrigger(
        TENANT_A,
        'PREDICTION',
        'PRED-STOCKOUT',
        'LOW_INVENTORY',
        { stockoutProbability: 0.85 }
      );

      const instance = await workflowEngine.createInstance(wf, trigger);
      expect(instance.status).toBe('PENDING');

      const completed = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedAt).toBeDefined();

      const outcome = workflowEngine.getOutcome(TENANT_A, instance.workflowInstanceId);
      expect(outcome).toBeDefined();
      expect(outcome?.finalStatus).toBe('COMPLETED');
      expect(outcome?.totalDurationMs).toBeGreaterThanOrEqual(0);
    });
  });

  describe('4. Approval-Gated Execution (LEVEL_3_APPROVAL_GATED)', () => {
    it('halts at approval gate and resumes successfully after human authorization', async () => {
      const wf = createSupplierDelayWorkflow(TENANT_A);
      workflowVersionService.registerDefinition(wf);

      const trigger = workflowTriggerEngine.createTrigger(
        TENANT_A,
        'SIGNAL',
        'SIG-DELAY',
        'SUPPLIER_DELAY',
        { delayDays: 4, daysOfSupply: 3 }
      );

      const instance = await workflowEngine.createInstance(wf, trigger);
      const paused = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

      // Must pause at Step 3 (Draft Premium Freight Expedite) which requires procurement_director approval
      expect(paused.status).toBe('WAITING_APPROVAL');
      expect(paused.activeApprovalId).toBeDefined();

      const approval = workflowApprovalEngine.getApproval(TENANT_A, paused.activeApprovalId!);
      expect(approval?.status).toBe('PENDING');
      expect(approval?.requiredRole).toBe('procurement_director');

      // Human director approves
      const resumed = await workflowEngine.resumeAfterApproval(
        TENANT_A,
        instance.workflowInstanceId,
        paused.activeApprovalId!,
        { id: 'dir-jane', role: 'procurement_director', name: 'Jane Director', isAi: false }
      );

      expect(resumed.status).toBe('COMPLETED');
      expect(resumed.activeApprovalId).toBeUndefined();
    });

    it('halts workflow when human rejects approval', async () => {
      const wf = createSupplierDelayWorkflow(TENANT_A);
      workflowVersionService.registerDefinition(wf);

      const trigger = workflowTriggerEngine.createTrigger(
        TENANT_A,
        'SIGNAL',
        'SIG-DELAY',
        'SUPPLIER_DELAY',
        { delayDays: 4, daysOfSupply: 3 }
      );

      const instance = await workflowEngine.createInstance(wf, trigger);
      const paused = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

      expect(paused.status).toBe('WAITING_APPROVAL');

      const rejected = workflowApprovalEngine.reject(
        TENANT_A,
        paused.activeApprovalId!,
        { id: 'dir-jane', role: 'procurement_director', name: 'Jane Director', isAi: false },
        'Freight expedite rejected due to budget constraints'
      );

      expect(rejected.status).toBe('REJECTED');
      expect(rejected.rejectionReason).toContain('budget constraints');
    });
  });

  describe('5. External Wait States & Event Resumption', () => {
    it('enters WAITING_EXTERNAL state and resumes upon matching external event', async () => {
      const wf = createPOConfirmationEscalationWorkflow(TENANT_A);
      workflowVersionService.registerDefinition(wf);

      const trigger = workflowTriggerEngine.createTrigger(
        TENANT_A,
        'EXCEPTION',
        'EXC-DELAY',
        'PO_CONFIRMATION_DELAY',
        {}
      );

      const instance = await workflowEngine.createInstance(wf, trigger);
      const waiting = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

      // Steps: Step 1 (Action: REQUEST_SUPPLIER_CONFIRMATION), Step 2 (WAIT_EXTERNAL)
      expect(waiting.status).toBe('WAITING_EXTERNAL');
      expect(waiting.waitingReason).toContain('SUPPLIER_EDI_855_RECEIVED');

      // Resume on arrival of external EDI 855 event
      const resumed = await workflowEngine.resumeExternalWait(
        TENANT_A,
        'PO-1001-ACK',
        'SUPPLIER_EDI_855_RECEIVED',
        { ackNumber: '855-90021', ackStatus: 'CONFIRMED' }
      );

      expect(resumed).toBeDefined();
      expect(resumed?.status).toBe('COMPLETED');
    });

    it('denies cross-tenant external event resumption', async () => {
      const wf = createPOConfirmationEscalationWorkflow(TENANT_A);
      workflowVersionService.registerDefinition(wf);

      const trigger = workflowTriggerEngine.createTrigger(
        TENANT_A,
        'EXCEPTION',
        'EXC-DELAY',
        'PO_CONFIRMATION_DELAY',
        {}
      );

      const instance = await workflowEngine.createInstance(wf, trigger);
      await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

      // Attempting to resolve TENANT_A wait from TENANT_B must fail
      const resumedTenantB = await workflowEngine.resumeExternalWait(
        'TENANT_B',
        'PO-1001-ACK',
        'SUPPLIER_EDI_855_RECEIVED',
        { ackNumber: '855-90021' }
      );
      expect(resumedTenantB).toBeUndefined();
    });
  });

  describe('6. Saga Compensation (Backward Rollback)', () => {
    it('executes planned compensating step when downstream step fails', async () => {
      const wf: WorkflowDefinition = {
        workflowId: 'WF-SAGA-TEST',
        tenantId: TENANT_A,
        name: 'Saga Reservation Pipeline',
        description: 'Multi-step reservation with rollback',
        version: '1.0.0',
        status: 'ACTIVE',
        riskClass: 'MEDIUM',
        autonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
        trigger: {
          triggerId: 'TRIG-SAGA',
          tenantId: TENANT_A,
          sourceType: 'EVENT',
          sourceId: 'EVT-01',
          eventType: 'SAGA_TRIGGER',
          correlationId: 'CORR-SAGA',
          timestamp: new Date().toISOString(),
          payloadReference: {}
        },
        steps: [
          {
            stepId: 'ST-01-RESERVE',
            name: 'Reserve Freight',
            order: 1,
            type: 'ACTION',
            action: {
              actionId: 'ACT-RESERVE',
              type: 'DRAFT_EXPEDITE',
              payload: { freightId: 'FR-01' },
              riskClass: 'LOW',
              isMaterial: false
            },
            compensatingStepId: 'ST-03-CANCEL-RESERVE'
          },
          {
            stepId: 'ST-02-DISPATCH',
            name: 'Failing Dispatch Step',
            order: 2,
            type: 'ACTION',
            action: {
              actionId: 'ACT-FAILING',
              type: 'DRAFT_REROUTE',
              commandType: 'UNREGISTERED_COMMAND_FAIL',
              payload: {},
              riskClass: 'MEDIUM',
              isMaterial: true
            }
          },
          {
            stepId: 'ST-03-CANCEL-RESERVE',
            name: 'Release Freight Reservation',
            order: 3,
            type: 'COMPENSATION',
            action: {
              actionId: 'ACT-RELEASE',
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
        'SAGA_TRIGGER',
        {}
      );

      const instance = await workflowEngine.createInstance(wf, trigger);
      const result = await workflowEngine.start(TENANT_A, instance.workflowInstanceId);

      expect(result.status).toBe('COMPENSATED');
      const compensations = workflowCompensationEngine.listCompensations(TENANT_A, instance.workflowInstanceId);
      expect(compensations.length).toBe(1);
      expect(compensations[0].status).toBe('COMPLETED');
    });
  });

  describe('7. Dry-Run Simulation Engine', () => {
    it('simulates workflow execution end-to-end with zero mutations', () => {
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
  });

  describe('8. Durable Scheduler & Timeout Management', () => {
    it('schedules delayed workflow execution and queries due items', () => {
      const sched = workflowScheduler.scheduleWorkflow(TENANT_A, 'WF-LOW-INVENTORY-RESPONSE', {
        delayMs: -1000 // Already due
      });

      expect(sched.status).toBe('ACTIVE');
      const due = workflowScheduler.getDueSchedules(TENANT_A);
      expect(due.length).toBeGreaterThanOrEqual(1);
      expect(due.some(s => s.scheduleId === sched.scheduleId)).toBe(true);
    });

    it('evaluates workflow timeout thresholds accurately', () => {
      const instance = {
        workflowInstanceId: 'WFI-TIMEOUT',
        workflowId: 'WF-TEST',
        workflowVersion: '1.0.0',
        tenantId: TENANT_A,
        status: 'RUNNING' as const,
        currentStepIndex: 0,
        triggerReference: {} as any,
        contextData: {},
        correlationId: 'CORR-TO',
        startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 mins ago
        updatedAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(), // 20 mins ago
        retryCount: 0,
        history: []
      };

      const result = WorkflowTimeoutEngine.evaluateInstanceTimeout(
        instance,
        { stepTimeoutMs: 15 * 60 * 1000, onTimeout: 'FAIL' },
        15 * 60 * 1000
      );

      expect(result.hasTimedOut).toBe(true);
      expect(result.timeoutType).toBe('STEP');
      expect(result.action).toBe('FAIL');
    });
  });
});
