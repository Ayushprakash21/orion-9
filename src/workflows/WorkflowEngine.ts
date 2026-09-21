/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Engine
 * 
 * Core stateful orchestrator managing workflow instance lifecycles, condition branches,
 * approval gating, Kernel action execution, saga compensations, and outcome recording.
 */

import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTrigger,
  WorkflowStep,
  WorkflowOutcome,
  WorkflowInstanceStatus
} from './types';
import { WorkflowStateMachine } from './WorkflowStateMachine';
import { WorkflowConditionEngine } from './WorkflowConditionEngine';
import { workflowActionPlanner } from './WorkflowActionPlanner';
import { workflowActionExecutor } from './WorkflowActionExecutor';
import { workflowApprovalEngine } from './WorkflowApprovalEngine';
import { workflowCompensationEngine } from './WorkflowCompensationEngine';
import { WorkflowRetryEngine } from './WorkflowRetryEngine';
import { WorkflowTimeoutEngine } from './WorkflowTimeoutEngine';
import { workflowExternalWaitEngine } from './WorkflowExternalWaitEngine';
import { workflowVersionService } from './WorkflowVersionService';
import { workflowAuditEngine } from './WorkflowAuditEngine';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private instances: Map<string, WorkflowInstance> = new Map(); // key: `${tenantId}:${instanceId}`
  private outcomes: Map<string, WorkflowOutcome> = new Map(); // key: `${tenantId}:${instanceId}`

  private constructor() {}

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  /**
   * Instantiates a new workflow instance bound to the immutable version definition
   */
  public async createInstance(
    definition: WorkflowDefinition,
    trigger: WorkflowTrigger,
    initialContext: Record<string, any> = {}
  ): Promise<WorkflowInstance> {
    const tenantId = definition.tenantId;
    const workflowInstanceId = `WFI-${definition.workflowId}-${Date.now()}-${Math.floor(Date.now() % 10000)}`;

    // Ensure version snapshot is published/retrievable
    const versionDef =
      workflowVersionService.getVersionSnapshot(tenantId, definition.workflowId, definition.version) ||
      definition;

    const instance: WorkflowInstance = {
      workflowInstanceId,
      workflowId: definition.workflowId,
      workflowVersion: definition.version,
      tenantId,
      status: 'PENDING',
      currentStepIndex: 0,
      currentStepId: versionDef.steps[0]?.stepId,
      triggerReference: trigger,
      contextData: {
        ...initialContext,
        ...trigger.payloadReference
      },
      correlationId: trigger.correlationId,
      causationId: trigger.causationId,
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      retryCount: 0,
      history: []
    };

    this.instances.set(`${tenantId}:${workflowInstanceId}`, instance);

    await workflowAuditEngine.logEvent(
      tenantId,
      definition.workflowId,
      'WORKFLOW_CREATED',
      { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
      { workflowInstanceId, version: definition.version },
      workflowInstanceId
    );

    return JSON.parse(JSON.stringify(instance));
  }

  public getInstance(tenantId: string, instanceId: string): WorkflowInstance | undefined {
    const inst = this.instances.get(`${tenantId}:${instanceId}`);
    return inst ? JSON.parse(JSON.stringify(inst)) : undefined;
  }

  public listInstances(tenantId: string): WorkflowInstance[] {
    const list: WorkflowInstance[] = [];
    for (const [key, inst] of this.instances.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(JSON.parse(JSON.stringify(inst)));
      }
    }
    return list;
  }

  /**
   * Starts execution of a pending instance
   */
  public async start(
    tenantId: string,
    instanceId: string,
    actor: { id: string; role: string; type: 'USER' | 'AGENT' | 'WORKFLOW_KERNEL' } = {
      id: 'WORKFLOW_KERNEL',
      role: 'admin',
      type: 'WORKFLOW_KERNEL'
    }
  ): Promise<WorkflowInstance> {
    const key = `${tenantId}:${instanceId}`;
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found in tenant ${tenantId}`);
    }

    const validation = WorkflowStateMachine.validateTransition(instance.status, 'RUNNING');
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    instance.status = 'RUNNING';
    instance.updatedAt = new Date().toISOString();

    await workflowAuditEngine.logEvent(
      tenantId,
      instance.workflowId,
      'WORKFLOW_STARTED',
      actor,
      { instanceId },
      instanceId
    );

    // Execute current step
    return this.executeStep(tenantId, instanceId, actor);
  }

  /**
   * Executes the active step in the workflow
   */
  public async executeStep(
    tenantId: string,
    instanceId: string,
    actor: { id: string; role: string; type: 'USER' | 'AGENT' | 'WORKFLOW_KERNEL' }
  ): Promise<WorkflowInstance> {
    const key = `${tenantId}:${instanceId}`;
    const instance = this.instances.get(key);
    if (!instance || instance.status !== 'RUNNING') {
      return instance!;
    }

    const definition = workflowVersionService.getVersionSnapshot(
      tenantId,
      instance.workflowId,
      instance.workflowVersion
    );
    if (!definition) {
      instance.status = 'FAILED';
      instance.failureReason = `Workflow definition snapshot not found for version ${instance.workflowVersion}`;
      instance.updatedAt = new Date().toISOString();
      return instance;
    }

    const steps = definition.steps;
    if (instance.currentStepIndex >= steps.length) {
      // Completed all steps
      return this.completeWorkflow(tenantId, instanceId);
    }

    const step = steps[instance.currentStepIndex];
    instance.currentStepId = step.stepId;
    instance.updatedAt = new Date().toISOString();

    // Skip compensation steps during forward sequential execution
    if (step.type === 'COMPENSATION') {
      instance.currentStepIndex++;
      return this.executeStep(tenantId, instanceId, actor);
    }

    // 1. Condition evaluation
    if (step.condition) {
      const conditionMet = WorkflowConditionEngine.evaluate(step.condition, instance.contextData);
      await workflowAuditEngine.logEvent(
        tenantId,
        instance.workflowId,
        'CONDITION_EVALUATED',
        actor,
        { stepId: step.stepId, conditionMet },
        instanceId
      );

      if (!conditionMet) {
        if (step.onFailureStepId) {
          const nextIdx = steps.findIndex(s => s.stepId === step.onFailureStepId);
          if (nextIdx !== -1) {
            instance.currentStepIndex = nextIdx;
            return this.executeStep(tenantId, instanceId, actor);
          }
        }
        // Skip to next sequential step if no failure branch
        instance.currentStepIndex++;
        return this.executeStep(tenantId, instanceId, actor);
      }
    }

    // 2. Wait External step
    if (step.type === 'WAIT_EXTERNAL' && step.waitConfig) {
      WorkflowStateMachine.validateTransition(instance.status, 'WAITING_EXTERNAL');
      instance.status = 'WAITING_EXTERNAL';
      instance.waitingReason = `Awaiting external event: ${step.waitConfig.eventType}`;
      workflowExternalWaitEngine.registerWait(
        tenantId,
        instanceId,
        step.stepId,
        step.waitConfig.eventType,
        step.waitConfig.correlationKey,
        step.waitConfig.timeoutMs
      );
      return instance;
    }

    // 3. Action Step
    if (step.action) {
      const planned = workflowActionPlanner.planAction(
        instance,
        step,
        definition.autonomyLevel,
        { id: actor.id, role: actor.role, isAi: actor.type === 'AGENT' }
      );

      // Check if human approval is required
      if (planned.requiresHumanApproval) {
        WorkflowStateMachine.validateTransition(instance.status, 'WAITING_APPROVAL');
        instance.status = 'WAITING_APPROVAL';
        instance.waitingReason = planned.autonomyResult.reason;

        const approvalReq = workflowApprovalEngine.createApprovalRequest(
          tenantId,
          instanceId,
          step.stepId,
          step.action.actionId,
          step.approval?.requiredRole || 'admin',
          { id: actor.id, type: actor.type === 'WORKFLOW_KERNEL' ? 'WORKFLOW' : actor.type, name: actor.id },
          step.timeoutMs || 48 * 60 * 60 * 1000
        );

        instance.activeApprovalId = approvalReq.approvalId;
        await workflowAuditEngine.logEvent(
          tenantId,
          instance.workflowId,
          'APPROVAL_REQUESTED',
          actor,
          { approvalId: approvalReq.approvalId, stepId: step.stepId },
          instanceId
        );

        return instance;
      }

      // Execute through Kernel Action Executor
      const execResult = await workflowActionExecutor.executeAction(
        tenantId,
        instanceId,
        step.stepId,
        step.name,
        step.action,
        actor,
        instance.correlationId,
        instance.causationId
      );

      if (execResult.success) {
        // Record step in execution history
        instance.history.push({
          executionId: `EXEC-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
          tenantId,
          workflowInstanceId: instanceId,
          stepId: step.stepId,
          stepName: step.name,
          actionId: step.action.actionId,
          actorId: actor.id,
          actorType: actor.type,
          correlationId: instance.correlationId,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          status: 'SUCCESS',
          output: execResult.output,
          commandEnvelopeId: execResult.commandEnvelopeId
        });

        // Step succeeded -> advance to next step or branch
        if (step.onSuccessStepId) {
          const nextIdx = steps.findIndex(s => s.stepId === step.onSuccessStepId);
          if (nextIdx !== -1) {
            instance.currentStepIndex = nextIdx;
            return this.executeStep(tenantId, instanceId, actor);
          }
        }
        instance.currentStepIndex++;
        return this.executeStep(tenantId, instanceId, actor);
      } else {
        // Step failed -> evaluate retry or compensation
        return this.handleStepFailure(tenantId, instanceId, step, execResult);
      }
    }

    // No action/wait -> advance to next step
    instance.currentStepIndex++;
    return this.executeStep(tenantId, instanceId, actor);
  }

  /**
   * Resumes workflow after human approval is granted
   */
  public async resumeAfterApproval(
    tenantId: string,
    instanceId: string,
    approvalId: string,
    approver: { id: string; role: string; name: string; isAi: boolean }
  ): Promise<WorkflowInstance> {
    const key = `${tenantId}:${instanceId}`;
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Workflow instance ${instanceId} not found`);
    }

    if (instance.status !== 'WAITING_APPROVAL') {
      throw new Error(`Instance is not waiting for approval`);
    }

    // Approve through WorkflowApprovalEngine
    workflowApprovalEngine.approve(tenantId, approvalId, approver);

    instance.status = 'RUNNING';
    instance.activeApprovalId = undefined;
    instance.waitingReason = undefined;
    instance.updatedAt = new Date().toISOString();

    await workflowAuditEngine.logEvent(
      tenantId,
      instance.workflowId,
      'APPROVAL_APPROVED',
      { id: approver.id, type: 'USER' },
      { approvalId },
      instanceId
    );

    // Retrieve definition & step
    const definition = workflowVersionService.getVersionSnapshot(
      tenantId,
      instance.workflowId,
      instance.workflowVersion
    )!;
    const step = definition.steps[instance.currentStepIndex];

    // Force material execution through Kernel now that approval is approved
    if (step.action) {
      const execResult = await workflowActionExecutor.executeAction(
        tenantId,
        instanceId,
        step.stepId,
        step.name,
        step.action,
        { id: approver.id, role: approver.role, type: 'USER' },
        instance.correlationId,
        instance.causationId
      );

      if (execResult.success) {
        instance.history.push({
          executionId: `EXEC-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
          tenantId,
          workflowInstanceId: instanceId,
          stepId: step.stepId,
          stepName: step.name,
          actionId: step.action.actionId,
          actorId: approver.id,
          actorType: 'USER',
          correlationId: instance.correlationId,
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          status: 'SUCCESS',
          output: execResult.output,
          commandEnvelopeId: execResult.commandEnvelopeId
        });

        instance.currentStepIndex++;
        return this.executeStep(tenantId, instanceId, {
          id: approver.id,
          role: approver.role,
          type: 'USER'
        });
      } else {
        return this.handleStepFailure(tenantId, instanceId, step, execResult);
      }
    }

    instance.currentStepIndex++;
    return this.executeStep(tenantId, instanceId, {
      id: approver.id,
      role: approver.role,
      type: 'USER'
    });
  }

  /**
   * Resumes workflow when external event arrives
   */
  public async resumeExternalWait(
    tenantId: string,
    correlationKey: string,
    eventType: string,
    externalPayload: Record<string, any>
  ): Promise<WorkflowInstance | undefined> {
    const wait = workflowExternalWaitEngine.resolveWait(tenantId, correlationKey, eventType);
    if (!wait) {
      return undefined;
    }

    const key = `${tenantId}:${wait.workflowInstanceId}`;
    const instance = this.instances.get(key);
    if (!instance || instance.status !== 'WAITING_EXTERNAL') {
      return undefined;
    }

    instance.status = 'RUNNING';
    instance.waitingReason = undefined;
    instance.contextData = {
      ...instance.contextData,
      externalEvent: externalPayload
    };
    instance.currentStepIndex++;
    instance.updatedAt = new Date().toISOString();

    return this.executeStep(tenantId, wait.workflowInstanceId, {
      id: 'WORKFLOW_KERNEL',
      role: 'admin',
      type: 'WORKFLOW_KERNEL'
    });
  }

  /**
   * Handles step failure, deciding between retry, compensation, or termination
   */
  private async handleStepFailure(
    tenantId: string,
    instanceId: string,
    step: WorkflowStep,
    error: any
  ): Promise<WorkflowInstance> {
    const key = `${tenantId}:${instanceId}`;
    const instance = this.instances.get(key)!;

    const retryPolicy = step.retryPolicy;
    const isRetryable = retryPolicy && WorkflowRetryEngine.isRetryable(error.errorCode || '');

    if (isRetryable && instance.retryCount < retryPolicy.maxRetries) {
      instance.status = 'WAITING_RETRY';
      instance.retryCount++;
      instance.waitingReason = `Waiting retry attempt ${instance.retryCount} due to: ${error.errorMessage}`;
      instance.updatedAt = new Date().toISOString();

      await workflowAuditEngine.logEvent(
        tenantId,
        instance.workflowId,
        'RETRY_SCHEDULED',
        { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
        { stepId: step.stepId, retryCount: instance.retryCount },
        instanceId
      );

      return instance;
    }

    // If step or definition has compensation configured, trigger compensation
    const definition = workflowVersionService.getVersionSnapshot(
      tenantId,
      instance.workflowId,
      instance.workflowVersion
    )!;

    const compensations = workflowCompensationEngine.planCompensation(
      tenantId,
      instanceId,
      definition.steps,
      instance.history
    );

    if (compensations.length > 0) {
      instance.status = 'COMPENSATING';
      instance.waitingReason = `Executing ${compensations.length} saga compensating steps`;
      instance.updatedAt = new Date().toISOString();

      await workflowAuditEngine.logEvent(
        tenantId,
        instance.workflowId,
        'COMPENSATION_STARTED',
        { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
        { compensationCount: compensations.length },
        instanceId
      );

      // Execute compensations
      for (const comp of compensations) {
        workflowCompensationEngine.markCompensationRunning(tenantId, comp.compensationId);
        // Dispatch compensating action through Kernel
        const compStep = definition.steps.find(s => s.stepId === comp.compensatingStepId);
        if (compStep && compStep.action) {
          await workflowActionExecutor.executeAction(
            tenantId,
            instanceId,
            comp.compensatingStepId,
            compStep.name,
            compStep.action,
            { id: 'WORKFLOW_KERNEL', role: 'admin', type: 'WORKFLOW_KERNEL' },
            instance.correlationId,
            instance.causationId
          );
        }
        workflowCompensationEngine.markCompensationCompleted(tenantId, comp.compensationId);
      }

      instance.status = 'COMPENSATED';
      instance.updatedAt = new Date().toISOString();
      instance.completedAt = new Date().toISOString();

      await workflowAuditEngine.logEvent(
        tenantId,
        instance.workflowId,
        'COMPENSATION_COMPLETED',
        { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
        {},
        instanceId
      );

      return instance;
    }

    // Default fail
    instance.status = 'FAILED';
    instance.failureReason = error.errorMessage || 'Step execution failed';
    instance.completedAt = new Date().toISOString();
    instance.updatedAt = new Date().toISOString();

    await workflowAuditEngine.logEvent(
      tenantId,
      instance.workflowId,
      'WORKFLOW_FAILED',
      { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
      { error: instance.failureReason },
      instanceId
    );

    return instance;
  }

  /**
   * Finalizes workflow completion and records outcome metrics
   */
  private async completeWorkflow(tenantId: string, instanceId: string): Promise<WorkflowInstance> {
    const key = `${tenantId}:${instanceId}`;
    const instance = this.instances.get(key)!;

    WorkflowStateMachine.validateTransition(instance.status, 'COMPLETED');
    instance.status = 'COMPLETED';
    instance.completedAt = new Date().toISOString();
    instance.updatedAt = new Date().toISOString();

    const durationMs = new Date(instance.completedAt).getTime() - new Date(instance.startedAt).getTime();

    const outcome: WorkflowOutcome = {
      outcomeId: `OUTCOME-${tenantId}-${instanceId}`,
      tenantId,
      workflowInstanceId: instanceId,
      workflowId: instance.workflowId,
      finalStatus: 'COMPLETED',
      totalDurationMs: durationMs,
      stepsExecuted: instance.currentStepIndex,
      commandsDispatched: instance.history.filter(h => h.commandEnvelopeId).length,
      approvalsGranted: 0,
      compensationsExecuted: 0,
      businessImpactSummary: `Successfully orchestrated ${instance.workflowId} to completion`,
      recordedAt: new Date().toISOString()
    };

    this.outcomes.set(key, outcome);

    await workflowAuditEngine.logEvent(
      tenantId,
      instance.workflowId,
      'WORKFLOW_COMPLETED',
      { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
      { durationMs },
      instanceId
    );

    return JSON.parse(JSON.stringify(instance));
  }

  public getOutcome(tenantId: string, instanceId: string): WorkflowOutcome | undefined {
    const outcome = this.outcomes.get(`${tenantId}:${instanceId}`);
    return outcome ? JSON.parse(JSON.stringify(outcome)) : undefined;
  }

  public cancel(tenantId: string, instanceId: string, reason: string): WorkflowInstance {
    const key = `${tenantId}:${instanceId}`;
    const instance = this.instances.get(key);
    if (!instance) {
      throw new Error(`Instance ${instanceId} not found`);
    }

    WorkflowStateMachine.validateTransition(instance.status, 'CANCELLED');
    instance.status = 'CANCELLED';
    instance.failureReason = reason;
    instance.completedAt = new Date().toISOString();
    instance.updatedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(instance));
  }

  public clear(): void {
    this.instances.clear();
    this.outcomes.clear();
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
