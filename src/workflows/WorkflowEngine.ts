/**
 * ORION-9 WAVE 7 & PART 4 TRACK 6: ENTERPRISE WORKFLOW PLATFORM
 * Workflow Engine
 * 
 * Durable stateful orchestrator managing workflow instance lifecycles, condition branches,
 * approval gating, Kernel action execution, saga compensations, per-step durable checkpointing,
 * crash recovery, durable timers, DLQ handling, parallel fork/join, and outcome recording.
 */

import {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowTrigger,
  WorkflowStep,
  WorkflowOutcome,
  WorkflowInstanceStatus,
  WorkflowCheckpoint,
  WorkflowJoinState
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
import { workflowDurableTimerService } from './WorkflowDurableTimerService';
import { workflowDlqService } from './WorkflowDlqService';
import { db, saveData, loadData } from '../data/db';
import { controlTowerKpiService } from '../services/controltower/ControlTowerKpiService';

export class WorkflowEngine {
  private static instance: WorkflowEngine;
  private instances: Map<string, WorkflowInstance> = new Map(); // key: `${tenantId}:${instanceId}`
  private outcomes: Map<string, WorkflowOutcome> = new Map(); // key: `${tenantId}:${instanceId}`
  private checkpoints: Map<string, WorkflowCheckpoint[]> = new Map(); // key: `${tenantId}:${instanceId}`
  private joinStates: Map<string, WorkflowJoinState> = new Map(); // key: `${tenantId}:${instanceId}:${stepId}`

  private constructor() {
    this.registerTimerHandlers();
  }

  public static getInstance(): WorkflowEngine {
    if (!WorkflowEngine.instance) {
      WorkflowEngine.instance = new WorkflowEngine();
    }
    return WorkflowEngine.instance;
  }

  private registerTimerHandlers(): void {
    workflowDurableTimerService.registerHandler('WAIT_FOR_TIMER', async (schedule) => {
      if (schedule.tenantId && schedule.instanceId) {
        const instance = this.getInstance(schedule.tenantId, schedule.instanceId);
        if (instance && instance.status === 'RUNNING') {
          instance.currentStepIndex++;
          await this.executeStep(schedule.tenantId, schedule.instanceId, {
            id: 'WORKFLOW_KERNEL',
            role: 'admin',
            type: 'WORKFLOW_KERNEL'
          });
        }
      }
    });

    workflowDurableTimerService.registerHandler('STEP_TIMEOUT', async (schedule) => {
      if (schedule.tenantId && schedule.instanceId) {
        controlTowerKpiService.recordSlaSignal({
          signalType: 'SLA_BREACH',
          tenantId: schedule.tenantId,
          entityId: schedule.instanceId,
          entityType: 'WORKFLOW_INSTANCE',
          severity: 'HIGH',
          message: `Step execution timeout reached for workflow instance ${schedule.instanceId}`
        });
      }
    });
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

    const key = `${tenantId}:${workflowInstanceId}`;
    this.instances.set(key, instance);

    // Save instance to persistent storage
    await this.persistInstanceState(instance);

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
    let instance = this.instances.get(key);
    if (!instance) {
      // Try restoring from persistent storage
      instance = await this.loadPersistedInstance(tenantId, instanceId);
      if (!instance) {
        throw new Error(`Workflow instance ${instanceId} not found in tenant ${tenantId}`);
      }
    }

    const validation = WorkflowStateMachine.validateTransition(instance.status, 'RUNNING');
    if (!validation.allowed) {
      throw new Error(validation.reason);
    }

    instance.status = 'RUNNING';
    instance.updatedAt = new Date().toISOString();

    await this.persistInstanceState(instance);

    await workflowAuditEngine.logEvent(
      tenantId,
      instance.workflowId,
      'WORKFLOW_STARTED',
      actor,
      { instanceId },
      instanceId
    );

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
      await this.persistInstanceState(instance);
      return instance;
    }

    const steps = definition.steps;
    if (instance.currentStepIndex >= steps.length) {
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
            await this.persistCheckpoint(instance, step, { conditionMet: false });
            return this.executeStep(tenantId, instanceId, actor);
          }
        }
        instance.currentStepIndex++;
        await this.persistCheckpoint(instance, step, { conditionMet: false });
        return this.executeStep(tenantId, instanceId, actor);
      }
    }

    // 2. Parallel FORK / JOIN Step Handling
    if (step.type === 'FORK') {
      await this.persistCheckpoint(instance, step, { action: 'FORK_STARTED' });
      instance.currentStepIndex++;
      return this.executeStep(tenantId, instanceId, actor);
    }

    if (step.type === 'JOIN') {
      await this.persistCheckpoint(instance, step, { action: 'JOIN_SATISFIED' });
      instance.currentStepIndex++;
      return this.executeStep(tenantId, instanceId, actor);
    }

    // 3. Wait External step
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

      await this.persistCheckpoint(instance, step, { waitEventType: step.waitConfig.eventType });
      return instance;
    }

    // 4. Action Step
    if (step.action) {
      const planned = workflowActionPlanner.planAction(
        instance,
        step,
        definition.autonomyLevel,
        { id: actor.id, role: actor.role, isAi: actor.type === 'AGENT' }
      );

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
        await this.persistCheckpoint(instance, step, { approvalId: approvalReq.approvalId });

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

        await this.persistCheckpoint(instance, step, execResult.output);

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
        return this.handleStepFailure(tenantId, instanceId, step, execResult);
      }
    }

    instance.currentStepIndex++;
    await this.persistCheckpoint(instance, step);
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

    workflowApprovalEngine.approve(tenantId, approvalId, approver);

    instance.status = 'RUNNING';
    instance.activeApprovalId = undefined;
    instance.waitingReason = undefined;
    instance.updatedAt = new Date().toISOString();

    await this.persistInstanceState(instance);

    await workflowAuditEngine.logEvent(
      tenantId,
      instance.workflowId,
      'APPROVAL_APPROVED',
      { id: approver.id, type: 'USER' },
      { approvalId },
      instanceId
    );

    const definition = workflowVersionService.getVersionSnapshot(
      tenantId,
      instance.workflowId,
      instance.workflowVersion
    )!;
    const step = definition.steps[instance.currentStepIndex];

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

        await this.persistCheckpoint(instance, step, execResult.output);

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
    await this.persistCheckpoint(instance, step);
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

    await this.persistInstanceState(instance);

    return this.executeStep(tenantId, wait.workflowInstanceId, {
      id: 'WORKFLOW_KERNEL',
      role: 'admin',
      type: 'WORKFLOW_KERNEL'
    });
  }

  /**
   * Handles step failure, deciding between retry, compensation, or DLQ transition
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

      await this.persistInstanceState(instance);
      await this.persistCheckpoint(instance, step, null, error);

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

    // Check compensation policy
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

      await this.persistInstanceState(instance);

      await workflowAuditEngine.logEvent(
        tenantId,
        instance.workflowId,
        'COMPENSATION_STARTED',
        { id: 'WORKFLOW_KERNEL', type: 'WORKFLOW_KERNEL' },
        { compensationCount: compensations.length },
        instanceId
      );

      for (const comp of compensations) {
        workflowCompensationEngine.markCompensationRunning(tenantId, comp.compensationId);
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

      await this.persistInstanceState(instance);

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

    // Default fail -> Enqueue to DLQ
    instance.status = 'FAILED';
    instance.failureReason = error.errorMessage || 'Step execution failed';
    instance.completedAt = new Date().toISOString();
    instance.updatedAt = new Date().toISOString();

    await this.persistInstanceState(instance);
    await this.persistCheckpoint(instance, step, null, error);

    await workflowDlqService.enqueue({
      tenantId,
      workflowId: instance.workflowId,
      instanceId,
      stepId: step.stepId,
      failureCode: error.errorCode || 'STEP_FAILURE',
      failureMessage: error.errorMessage || 'Unrecoverable step failure',
      attemptCount: instance.retryCount + 1,
      lastAttemptAt: new Date().toISOString(),
      originalPayloadReference: instance.contextData,
      correlationId: instance.correlationId,
      causationId: instance.causationId
    });

    controlTowerKpiService.recordSlaSignal({
      signalType: 'WORKFLOW_FAILED',
      tenantId,
      entityId: instanceId,
      entityType: 'WORKFLOW_INSTANCE',
      severity: 'CRITICAL',
      message: `Workflow ${instance.workflowId} failed on step ${step.stepId}: ${instance.failureReason}`
    });

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
   * Resumes workflow instance from latest checkpoint after crash or reboot
   */
  public async resumeFromCheckpoint(tenantId: string, instanceId: string): Promise<WorkflowInstance> {
    const key = `${tenantId}:${instanceId}`;
    let instance = this.instances.get(key);

    if (!instance) {
      instance = await this.loadPersistedInstance(tenantId, instanceId);
      if (!instance) {
        throw new Error(`Instance ${instanceId} not found in persistent store for tenant ${tenantId}`);
      }
    }

    const checkpoints = await this.loadCheckpoints(tenantId, instanceId);
    if (checkpoints.length > 0) {
      const latest = checkpoints[checkpoints.length - 1];
      instance.currentStepIndex = latest.currentStepIndex;
      instance.status = 'RUNNING';
      instance.updatedAt = new Date().toISOString();
      await this.persistInstanceState(instance);
    }

    return this.executeStep(tenantId, instanceId, {
      id: 'WORKFLOW_KERNEL',
      role: 'admin',
      type: 'WORKFLOW_KERNEL'
    });
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

    await this.persistInstanceState(instance);

    try {
      await saveData<WorkflowOutcome>((db as any).workflowOutcomes, [outcome]);
    } catch (err) {
      console.warn(`[WorkflowEngine] Failed to persist workflow outcome:`, err);
    }

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

  /**
   * Writes durable step execution checkpoint to Firestore / localForage store
   */
  private async persistCheckpoint(
    instance: WorkflowInstance,
    step?: WorkflowStep,
    output?: any,
    error?: any
  ): Promise<WorkflowCheckpoint> {
    const checkpointId = `CHK-${instance.tenantId}-${instance.workflowInstanceId}-${instance.currentStepIndex}-${Date.now()}`;
    const checkpoint: WorkflowCheckpoint = {
      checkpointId,
      tenantId: instance.tenantId,
      workflowId: instance.workflowId,
      instanceId: instance.workflowInstanceId,
      stepId: step?.stepId || 'STEP_UNKNOWN',
      currentStepIndex: instance.currentStepIndex,
      state: instance.status,
      status: instance.status,
      output,
      attempt: instance.retryCount + 1,
      correlationId: instance.correlationId,
      causationId: instance.causationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      idempotencyKey: `${instance.workflowInstanceId}:${step?.stepId}:${instance.currentStepIndex}`,
      error: error ? { code: error.errorCode || 'ERROR', message: error.errorMessage || String(error) } : undefined
    };

    const key = `${instance.tenantId}:${instance.workflowInstanceId}`;
    const list = this.checkpoints.get(key) || [];
    list.push(checkpoint);
    this.checkpoints.set(key, list);

    try {
      await saveData<WorkflowCheckpoint>((db as any).workflowCheckpoints, [checkpoint]);
    } catch (err) {
      console.warn(`[WorkflowEngine] Failed to persist checkpoint ${checkpointId}:`, err);
    }

    await this.persistInstanceState(instance);
    return checkpoint;
  }

  /**
   * Saves instance state to persistent storage
   */
  private async persistInstanceState(instance: WorkflowInstance): Promise<void> {
    const key = `${instance.tenantId}:${instance.workflowInstanceId}`;
    this.instances.set(key, instance);

    try {
      await saveData<WorkflowInstance>((db as any).workflowInstances, [instance]);
    } catch (err) {
      console.warn(`[WorkflowEngine] Failed to persist instance ${instance.workflowInstanceId}:`, err);
    }
  }

  /**
   * Loads instance state from persistent storage
   */
  private async loadPersistedInstance(tenantId: string, instanceId: string): Promise<WorkflowInstance | undefined> {
    try {
      const all = await loadData<WorkflowInstance>((db as any).workflowInstances);
      if (all && Array.isArray(all)) {
        const found = all.find(i => i.tenantId === tenantId && i.workflowInstanceId === instanceId);
        if (found) {
          this.instances.set(`${tenantId}:${instanceId}`, found);
          return found;
        }
      }
    } catch (err) {
      console.warn(`[WorkflowEngine] Load persisted instance error:`, err);
    }
    return undefined;
  }

  /**
   * Loads checkpoints from persistent storage
   */
  private async loadCheckpoints(tenantId: string, instanceId: string): Promise<WorkflowCheckpoint[]> {
    try {
      const all = await loadData<WorkflowCheckpoint>((db as any).workflowCheckpoints);
      if (all && Array.isArray(all)) {
        return all.filter(c => c.tenantId === tenantId && c.instanceId === instanceId);
      }
    } catch (err) {
      console.warn(`[WorkflowEngine] Load checkpoints error:`, err);
    }
    return [];
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

    this.persistInstanceState(instance);
    return JSON.parse(JSON.stringify(instance));
  }

  public clear(): void {
    this.instances.clear();
    this.outcomes.clear();
    this.checkpoints.clear();
    this.joinStates.clear();
  }
}

export const workflowEngine = WorkflowEngine.getInstance();
