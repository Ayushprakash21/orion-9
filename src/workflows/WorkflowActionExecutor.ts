/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Action Executor
 * 
 * Guarantees that the Workflow layer NEVER directly mutates enterprise business state.
 * Every material action must be converted into a validated CommandEnvelope and dispatched
 * exclusively through the Orion Kernel CommandBus.
 */

import { WorkflowAction, WorkflowStepExecution } from './types';
import { workflowIdempotency } from './WorkflowIdempotency';
import { workflowObservability } from './WorkflowObservability';
import { workflowAuditEngine } from './WorkflowAuditEngine';
import { KernelCommandBus } from '../kernel/CommandBus';
import { CommandEnvelope } from '../kernel/types';

export interface ActionExecutionResult {
  success: boolean;
  status: 'SUCCESS' | 'FAILED' | 'REJECTED';
  output?: any;
  errorCode?: string;
  errorMessage?: string;
  commandEnvelopeId?: string;
  idempotentReplay?: boolean;
}

export class WorkflowActionExecutor {
  private static instance: WorkflowActionExecutor;

  private constructor() {}

  public static getInstance(): WorkflowActionExecutor {
    if (!WorkflowActionExecutor.instance) {
      WorkflowActionExecutor.instance = new WorkflowActionExecutor();
    }
    return WorkflowActionExecutor.instance;
  }

  /**
   * Executes a planned action, enforcing idempotency and routing strictly through Kernel CommandBus
   */
  public async executeAction(
    tenantId: string,
    workflowInstanceId: string,
    stepId: string,
    stepName: string,
    action: WorkflowAction,
    actor: { id: string; role: string; type: 'USER' | 'AGENT' | 'WORKFLOW_KERNEL' },
    correlationId: string,
    causationId?: string
  ): Promise<ActionExecutionResult> {
    const startTime = Date.now();
    const idempotencyKey = workflowIdempotency.generateKey(
      tenantId,
      workflowInstanceId,
      stepId,
      action.actionId
    );

    // 1. Check idempotency record
    const existingRecord = workflowIdempotency.getRecord(tenantId, idempotencyKey);
    if (existingRecord && existingRecord.status === 'EXECUTED') {
      return {
        success: true,
        status: 'SUCCESS',
        output: existingRecord.result,
        commandEnvelopeId: existingRecord.commandEnvelopeId,
        idempotentReplay: true
      };
    }

    // Register pending idempotency lock
    workflowIdempotency.registerPending(tenantId, idempotencyKey, workflowInstanceId, stepId, action.actionId);

    // 2. Non-material actions (notifications, advisory, state updates)
    if (!action.isMaterial) {
      const output = {
        actionType: action.type,
        executedAt: new Date().toISOString(),
        advisory: true,
        payload: action.payload
      };

      workflowIdempotency.markExecuted(tenantId, idempotencyKey, output);

      const stepExecution: WorkflowStepExecution = {
        executionId: `EXEC-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
        tenantId,
        workflowInstanceId,
        stepId,
        stepName,
        actionId: action.actionId,
        actorId: actor.id,
        actorType: actor.type,
        correlationId,
        causationId,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status: 'SUCCESS',
        output
      };

      workflowObservability.recordExecution(stepExecution);
      await workflowAuditEngine.logEvent(
        tenantId,
        workflowInstanceId,
        'ACTION_EXECUTED',
        actor,
        { actionType: action.type, material: false },
        workflowInstanceId
      );

      return {
        success: true,
        status: 'SUCCESS',
        output
      };
    }

    // 3. Material Actions: Formulate CommandEnvelope and dispatch to Kernel CommandBus
    const commandType = action.commandType || 'scm:workflow:action';
    const commandEnvelope: CommandEnvelope = {
      commandId: `CMD-${tenantId}-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
      commandType,
      payload: {
        ...action.payload,
        workflowInstanceId,
        workflowStepId: stepId,
        actionId: action.actionId
      },
      actor: {
        id: actor.id,
        role: actor.role,
        name: actor.id,
        type: actor.type === 'AGENT' ? 'AI_AGENT' : actor.type === 'USER' ? 'USER' : 'SYSTEM'
      },
      tenant: {
        organizationId: tenantId
      },
      entityType: action.targetEntity || 'PURCHASE_ORDER',
      entityId: action.entityId || 'ENTITY-01',
      idempotencyKey,
      correlationId,
      timestamp: new Date().toISOString(),
      requiredPermission: this.mapCommandToPermission(commandType)
    };

    try {
      const commandBus = KernelCommandBus.getInstance();
      const result = await commandBus.execute(commandEnvelope);

      if (result.success) {
        workflowIdempotency.markExecuted(tenantId, idempotencyKey, result.result, commandEnvelope.commandId);

        const stepExecution: WorkflowStepExecution = {
          executionId: `EXEC-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
          tenantId,
          workflowInstanceId,
          stepId,
          stepName,
          actionId: action.actionId,
          actorId: actor.id,
          actorType: actor.type,
          correlationId,
          causationId,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          status: 'SUCCESS',
          output: result.result,
          commandEnvelopeId: commandEnvelope.commandId
        };

        workflowObservability.recordExecution(stepExecution);
        await workflowAuditEngine.logEvent(
          tenantId,
          workflowInstanceId,
          'ACTION_EXECUTED',
          actor,
          { actionType: action.type, commandEnvelopeId: commandEnvelope.commandId, material: true },
          workflowInstanceId
        );

        return {
          success: true,
          status: 'SUCCESS',
          output: result.result,
          commandEnvelopeId: commandEnvelope.commandId
        };
      } else {
        // CommandBus rejected (Policy / Risk / Auth failure)
        workflowIdempotency.markFailed(tenantId, idempotencyKey, result.error);

        const stepExecution: WorkflowStepExecution = {
          executionId: `EXEC-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
          tenantId,
          workflowInstanceId,
          stepId,
          stepName,
          actionId: action.actionId,
          actorId: actor.id,
          actorType: actor.type,
          correlationId,
          causationId,
          startedAt: new Date(startTime).toISOString(),
          completedAt: new Date().toISOString(),
          durationMs: Date.now() - startTime,
          status: 'REJECTED',
          errorCode: result.errorCode || 'COMMAND_BUS_REJECTION',
          errorMessage: result.error || 'Kernel rejected command envelope',
          commandEnvelopeId: commandEnvelope.commandId
        };

        workflowObservability.recordExecution(stepExecution);
        await workflowAuditEngine.logEvent(
          tenantId,
          workflowInstanceId,
          'ACTION_REJECTED',
          actor,
          { actionType: action.type, commandEnvelopeId: commandEnvelope.commandId, error: stepExecution.errorMessage },
          workflowInstanceId
        );

        return {
          success: false,
          status: 'REJECTED',
          errorCode: stepExecution.errorCode,
          errorMessage: stepExecution.errorMessage,
          commandEnvelopeId: commandEnvelope.commandId
        };
      }
    } catch (error: any) {
      workflowIdempotency.markFailed(tenantId, idempotencyKey, error);

      const stepExecution: WorkflowStepExecution = {
        executionId: `EXEC-${Date.now()}-${Math.floor(Date.now() % 10000)}`,
        tenantId,
        workflowInstanceId,
        stepId,
        stepName,
        actionId: action.actionId,
        actorId: actor.id,
        actorType: actor.type,
        correlationId,
        causationId,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - startTime,
        status: 'FAILED',
        errorCode: 'EXECUTION_EXCEPTION',
        errorMessage: error?.message || 'Kernel command dispatch exception'
      };

      workflowObservability.recordExecution(stepExecution);
      await workflowAuditEngine.logEvent(
        tenantId,
        workflowInstanceId,
        'ACTION_REJECTED',
        actor,
        { actionType: action.type, error: stepExecution.errorMessage },
        workflowInstanceId
      );

      return {
        success: false,
        status: 'FAILED',
        errorCode: 'EXECUTION_EXCEPTION',
        errorMessage: error?.message || 'Kernel command dispatch exception'
      };
    }
  }

  private mapCommandToPermission(commandType: string): string {
    if (commandType.includes('purchase_order')) return 'purchase_order:update';
    if (commandType.includes('expedite')) return 'shipment:expedite';
    if (commandType.includes('reroute')) return 'shipment:reroute';
    if (commandType.includes('supplier')) return 'supplier:confirm';
    if (commandType.includes('compensation')) return 'compensation:execute';
    return 'workflow:execute';
  }
}

export const workflowActionExecutor = WorkflowActionExecutor.getInstance();
