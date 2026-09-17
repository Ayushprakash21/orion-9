/**
 * ORION-9 KERNEL COMMAND BUS
 * Layer 4: Central Command Dispatcher enforcing the Canonical Execution Lifecycle:
 * REQUEST → IDENTITY → AUTHORIZATION → VALIDATION → POLICY → RISK → APPROVAL → EXECUTION → STATE CHANGE → EVENT → AUDIT → OUTCOME
 */

import { CommandEnvelope, CommandResult, ApprovalRecord } from './types';
import { generateCorrelationId } from './security/crypto';
import { kernelPolicyEngine } from './PolicyEngine';
import { kernelEventBus } from './EventBus';
import { kernelAuditEngine } from './AuditEngine';

export type CommandHandler<T = any, R = any> = (
  command: CommandEnvelope<T>
) => Promise<R> | R;

export class KernelCommandBus {
  private static instance: KernelCommandBus;
  private handlers: Map<string, CommandHandler> = new Map();
  private processedIdempotencyKeys: Set<string> = new Set();
  private pendingApprovals: Map<string, ApprovalRecord> = new Map();

  private constructor() {}

  public static getInstance(): KernelCommandBus {
    if (!KernelCommandBus.instance) {
      KernelCommandBus.instance = new KernelCommandBus();
    }
    return KernelCommandBus.instance;
  }

  /**
   * Registers a command handler
   */
  public registerHandler<T = any, R = any>(commandType: string, handler: CommandHandler<T, R>): void {
    this.handlers.set(commandType, handler);
  }

  /**
   * Dispatches a command through the complete canonical pipeline
   */
  public async dispatch<T = any, R = any>(
    commandType: string,
    payload: T,
    context: {
      actor: CommandEnvelope['actor'];
      tenant: CommandEnvelope['tenant'];
      entityType?: string;
      entityId?: string;
      amount?: number;
      correlationId?: string;
      idempotencyKey?: string;
      beforeState?: any;
    }
  ): Promise<CommandResult<R>> {
    const correlationId = context.correlationId || generateCorrelationId('cmd');
    const commandId = `cmd-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
    const executionTimestamp = new Date().toISOString();

    const command: CommandEnvelope<T> = {
      commandId,
      commandType,
      timestamp: executionTimestamp,
      actor: context.actor,
      tenant: context.tenant,
      entityType: context.entityType,
      entityId: context.entityId,
      payload,
      correlationId,
      idempotencyKey: context.idempotencyKey,
    };

    // 1. IDEMPOTENCY GUARD
    if (context.idempotencyKey) {
      if (this.processedIdempotencyKeys.has(context.idempotencyKey)) {
        return {
          success: false,
          commandId,
          correlationId,
          error: `Duplicate command suppressed by idempotency key: ${context.idempotencyKey}`,
          errorCode: 'DUPLICATE_SUPPRESSED',
          executionTimestamp,
        };
      }
      this.processedIdempotencyKeys.add(context.idempotencyKey);
    }

    // 2. IDENTITY RESOLUTION (Ensure actor identity is non-empty)
    if (!context.actor || !context.actor.id) {
      await kernelAuditEngine.record({
        eventId: commandId,
        correlationId,
        actor: { id: 'unknown', type: 'SYSTEM' },
        tenantId: context.tenant.organizationId,
        action: commandType,
        entityType: context.entityType || 'unknown',
        entityId: context.entityId || 'unknown',
        result: 'BLOCKED',
        failureReason: 'Missing caller identity',
        classification: 'INTERNAL',
      });

      return {
        success: false,
        commandId,
        correlationId,
        error: 'Command rejected: Unauthenticated or missing actor identity',
        errorCode: 'IDENTITY_REQUIRED',
        executionTimestamp,
      };
    }

    // 3. POLICY EVALUATION
    const policyResult = kernelPolicyEngine.evaluate({
      actor: context.actor,
      tenantId: context.tenant.organizationId,
      action: commandType,
      entityType: context.entityType || 'generic',
      entityId: context.entityId,
      amount: context.amount,
    });

    // 4. POLICY OUTCOME ENFORCEMENT
    if (policyResult.result === 'BLOCK') {
      await kernelAuditEngine.record({
        eventId: commandId,
        correlationId,
        actor: context.actor,
        tenantId: context.tenant.organizationId,
        action: commandType,
        entityType: context.entityType || 'generic',
        entityId: context.entityId || 'unknown',
        policyEvaluation: {
          policyId: policyResult.ruleId,
          result: 'BLOCK',
          reason: policyResult.reason,
        },
        result: 'BLOCKED',
        failureReason: policyResult.reason,
        classification: 'RESTRICTED',
      });

      return {
        success: false,
        commandId,
        correlationId,
        policyResult: 'BLOCK',
        error: `Action blocked by policy: ${policyResult.reason}`,
        errorCode: 'POLICY_BLOCKED',
        executionTimestamp,
      };
    }

    // 5. APPROVAL CHECK: If policy requires approval, stop execution and record pending approval
    if (policyResult.requiresApproval) {
      const approvalId = `appr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
      const approvalRecord: ApprovalRecord = {
        approvalId,
        commandId,
        correlationId,
        requester: {
          id: context.actor.id,
          type: context.actor.type,
          name: context.actor.name,
          role: context.actor.role,
        },
        policyId: policyResult.ruleId,
        entityType: context.entityType || 'generic',
        entityId: context.entityId || 'unknown',
        action: commandType,
        amount: context.amount,
        status: 'PENDING',
        createdAt: executionTimestamp,
      };

      this.pendingApprovals.set(approvalId, approvalRecord);

      // Publish APPROVAL_REQUIRED event
      kernelEventBus.publish(
        'APPROVAL_REQUIRED',
        approvalRecord,
        {
          actor: context.actor,
          tenant: context.tenant,
          correlationId,
          entityId: context.entityId,
          entityType: context.entityType,
        }
      );

      await kernelAuditEngine.record({
        eventId: commandId,
        correlationId,
        actor: context.actor,
        tenantId: context.tenant.organizationId,
        action: commandType,
        entityType: context.entityType || 'generic',
        entityId: context.entityId || 'unknown',
        policyEvaluation: {
          policyId: policyResult.ruleId,
          result: policyResult.result,
          reason: policyResult.reason,
        },
        approval: {
          required: true,
          approvalId,
        },
        result: 'PENDING_APPROVAL',
        classification: 'INTERNAL',
      });

      return {
        success: false,
        commandId,
        correlationId,
        policyResult: policyResult.result,
        requiresApproval: true,
        approvalId,
        error: `Action halted: Human approval required by policy [${policyResult.ruleName || 'Governance'}]`,
        executionTimestamp,
      };
    }

    // 6. EXECUTION HANDLER
    const handler = this.handlers.get(commandType);
    if (!handler) {
      return {
        success: false,
        commandId,
        correlationId,
        error: `No registered kernel handler for command: ${commandType}`,
        errorCode: 'HANDLER_NOT_FOUND',
        executionTimestamp,
      };
    }

    try {
      const result = await handler(command);

      // 7. EVENT EMISSION
      kernelEventBus.publish(
        `${commandType}_COMPLETED`,
        { commandId, entityId: context.entityId, result },
        {
          actor: context.actor,
          tenant: context.tenant,
          correlationId,
          entityId: context.entityId,
          entityType: context.entityType,
        }
      );

      // 8. AUDIT RECORDING
      await kernelAuditEngine.record({
        eventId: commandId,
        correlationId,
        actor: context.actor,
        tenantId: context.tenant.organizationId,
        action: commandType,
        entityType: context.entityType || 'generic',
        entityId: context.entityId || 'unknown',
        beforeState: context.beforeState,
        afterState: result,
        policyEvaluation: {
          result: 'ALLOW',
          reason: policyResult.reason,
        },
        result: 'SUCCESS',
        classification: 'INTERNAL',
      });

      return {
        success: true,
        commandId,
        correlationId,
        result,
        policyResult: 'ALLOW',
        executionTimestamp,
      };
    } catch (err: any) {
      // Record failure audit
      await kernelAuditEngine.record({
        eventId: commandId,
        correlationId,
        actor: context.actor,
        tenantId: context.tenant.organizationId,
        action: commandType,
        entityType: context.entityType || 'generic',
        entityId: context.entityId || 'unknown',
        beforeState: context.beforeState,
        result: 'FAILED',
        failureReason: err.message || 'Execution error',
        classification: 'INTERNAL',
      });

      return {
        success: false,
        commandId,
        correlationId,
        error: err.message || 'Command execution failed',
        errorCode: 'EXECUTION_FAILED',
        executionTimestamp,
      };
    }
  }

  public getPendingApprovals(): ApprovalRecord[] {
    return Array.from(this.pendingApprovals.values()).filter(a => a.status === 'PENDING');
  }

  public resolveApproval(approvalId: string, status: 'APPROVED' | 'REJECTED', approver: { id: string; name: string; role: string }): boolean {
    const record = this.pendingApprovals.get(approvalId);
    if (!record) return false;

    record.status = status;
    record.decidedAt = new Date().toISOString();
    record.approver = approver;

    kernelEventBus.publish(
      status === 'APPROVED' ? 'APPROVAL_GRANTED' : 'APPROVAL_REJECTED',
      record,
      {
        actor: { id: approver.id, type: 'USER', name: approver.name, role: approver.role },
        correlationId: record.correlationId,
        entityId: record.entityId,
        entityType: record.entityType,
      }
    );

    return true;
  }
}

export const kernelCommandBus = KernelCommandBus.getInstance();
