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
import { authorizationEngine } from './authorization/AuthorizationEngine';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export type CommandHandler<T = any, R = any> = (
  command: CommandEnvelope<T>
) => Promise<R> | R;

export class KernelCommandBus {
  private static instance: KernelCommandBus;
  private handlers: Map<string, CommandHandler> = new Map();
  private processedIdempotencyKeys: Set<string> = new Set();
  private pendingApprovals: Map<string, ApprovalRecord> = new Map();
  /** Stores the full command envelope for approval-resume. */
  private pendingCommandEnvelopes: Map<string, CommandEnvelope> = new Map();

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

  public hasHandler(commandType: string): boolean {
    return this.handlers.has(commandType);
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

    // 3. FAIL-CLOSED AUTHORIZATION GATE
    try {
      const requiredPermission = `${context.entityType || 'generic'}:${commandType.replace('_PURCHASE_ORDER', '').toLowerCase()}`;
      authorizationEngine.authorize({
        actor: {
          id: context.actor.id,
          type: context.actor.type as any,
          name: context.actor.name,
          roles: context.actor.role ? [context.actor.role as string] : [],
          organizationId: context.tenant.organizationId,
        },
        resourceType: context.entityType || 'generic',
        resourceId: context.entityId,
        requiredPermission,
        organizationId: context.tenant.organizationId,
      });
    } catch (authErr: any) {
      // FAIL-CLOSED: Stop execution immediately on ANY authorization or tenant access denial.
      await kernelAuditEngine.record({
        eventId: commandId,
        correlationId,
        actor: context.actor,
        tenantId: context.tenant.organizationId,
        action: commandType,
        entityType: context.entityType || 'generic',
        entityId: context.entityId || 'unknown',
        result: 'BLOCKED',
        failureReason: authErr.message || 'Authorization access denied',
        classification: 'INTERNAL',
      });

      return {
        success: false,
        commandId,
        correlationId,
        error: `Authorization denied: ${authErr.message || 'Access denied'}`,
        errorCode: authErr?.code === 'TENANT_ACCESS_DENIED' ? 'TENANT_ACCESS_DENIED' : 'UNAUTHORIZED',
        executionTimestamp,
      };
    }

    // 4. POLICY EVALUATION
    const policyResult = kernelPolicyEngine.evaluate({
      actor: context.actor,
      tenantId: context.tenant.organizationId,
      action: commandType,
      entityType: context.entityType || 'generic',
      entityId: context.entityId,
      amount: context.amount,
    });

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
          result: policyResult.result,
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

    // 5. APPROVAL CHECK: If policy requires approval, stop execution and record pending approval durably
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
      this.pendingCommandEnvelopes.set(approvalId, command);

      // Persist approval record to Cloud Firestore approvals collection
      try {
        const db = getFirebaseFirestore();
        if (db) {
          await setDoc(doc(db, 'approvals', approvalId), {
            ...approvalRecord,
            organizationId: context.tenant.organizationId,
            commandEnvelope: command,
          });
        }
      } catch (err) {
        console.warn('[APPROVAL_FIRESTORE_WARN] Could not persist approval record to Cloud Firestore:', err);
      }

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

      // Save successful result to durable idempotency store if key exists
      if (context.idempotencyKey) {
        try {
          const db = getFirebaseFirestore();
          if (db) {
            const idempKey = `${context.tenant.organizationId}_${context.idempotencyKey}`;
            await setDoc(doc(db, 'idempotency', idempKey), {
              idempotencyKey: context.idempotencyKey,
              commandId,
              tenantId: context.tenant.organizationId,
              status: 'COMPLETED',
              result,
              createdAt: executionTimestamp,
            });
          }
        } catch (e) {}
      }

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

  /**
   * Resolves a pending approval decision.
   * Enforces security bounds:
   * - Requester cannot self-approve their own request unless explicitly permitted.
   * - Already decided / expired requests cannot be re-resolved.
   */
  public async resolveApproval(
    approvalId: string,
    status: 'APPROVED' | 'REJECTED',
    approver: { id: string; name: string; role: string },
    comments?: string
  ): Promise<CommandResult | null> {
    let record = this.pendingApprovals.get(approvalId);

    // Try Firestore lookup if not in memory
    if (!record) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const snap = await getDoc(doc(db, 'approvals', approvalId));
          if (snap.exists()) {
            const data = snap.data();
            record = data as ApprovalRecord;
            if (data.commandEnvelope) {
              this.pendingCommandEnvelopes.set(approvalId, data.commandEnvelope);
            }
          }
        }
      } catch (e) {}
    }

    if (!record) return null;

    // Check already resolved
    if (record.status !== 'PENDING') {
      throw new Error(`Approval request '${approvalId}' is already ${record.status}.`);
    }

    // Security Check: Self-approval restriction
    if (status === 'APPROVED' && record.requester?.id === approver.id) {
      throw new Error('Self-approval violation: Requester cannot approve their own request.');
    }

    const decidedAt = new Date().toISOString();
    record.status = status;
    record.decidedAt = decidedAt;
    record.approver = approver;
    if (comments) record.comments = comments;

    // Update Firestore approval document
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'approvals', approvalId), {
          status,
          decidedAt,
          approver,
          comments: comments || null,
        });
      }
    } catch (e) {}

    // Publish approval decision event.
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

    if (status === 'REJECTED') {
      await kernelAuditEngine.record({
        eventId: record.commandId,
        correlationId: record.correlationId,
        actor: { id: approver.id, type: 'USER', name: approver.name, role: approver.role },
        action: record.action,
        entityType: record.entityType,
        entityId: record.entityId,
        approval: { required: true, approvalId, approverId: approver.id },
        result: 'BLOCKED',
        failureReason: `Approval rejected by ${approver.name}: ${comments || 'No reason provided'}`,
        classification: 'INTERNAL',
      });
      return {
        success: false,
        commandId: record.commandId,
        correlationId: record.correlationId,
        requiresApproval: false,
        approvalId,
        error: `Approval rejected by ${approver.name}`,
        errorCode: 'APPROVAL_REJECTED',
        executionTimestamp: record.decidedAt!,
      };
    }

    // APPROVED — resume command execution.
    const pendingEnvelope = this.pendingCommandEnvelopes.get(approvalId);
    if (!pendingEnvelope) {
      return {
        success: true,
        commandId: record.commandId,
        correlationId: record.correlationId,
        approvalId,
        policyResult: 'ALLOW',
        executionTimestamp: record.decidedAt!,
      };
    }

    const handler = this.handlers.get(pendingEnvelope.commandType);
    if (!handler) {
      return {
        success: false,
        commandId: record.commandId,
        correlationId: record.correlationId,
        error: `No handler for command: ${pendingEnvelope.commandType}`,
        errorCode: 'HANDLER_NOT_FOUND',
        executionTimestamp: record.decidedAt!,
      };
    }

    const executionTimestamp = new Date().toISOString();

    try {
      const result = await handler(pendingEnvelope);

      // Emit completion event.
      kernelEventBus.publish(
        `${pendingEnvelope.commandType}_COMPLETED`,
        { commandId: record.commandId, entityId: record.entityId, result },
        {
          actor: pendingEnvelope.actor,
          tenant: pendingEnvelope.tenant,
          correlationId: record.correlationId,
          entityId: record.entityId,
          entityType: record.entityType,
        }
      );

      // Record audit.
      await kernelAuditEngine.record({
        eventId: record.commandId,
        correlationId: record.correlationId,
        actor: pendingEnvelope.actor,
        tenantId: pendingEnvelope.tenant.organizationId,
        action: pendingEnvelope.commandType,
        entityType: record.entityType,
        entityId: record.entityId,
        afterState: result,
        policyEvaluation: { result: 'ALLOW', reason: `Approved by ${approver.name}` },
        approval: { required: true, approvalId, approverId: approver.id, approvedAt: record.decidedAt },
        result: 'SUCCESS',
        classification: 'INTERNAL',
      });

      // Clean up pending maps.
      this.pendingCommandEnvelopes.delete(approvalId);

      return {
        success: true,
        commandId: record.commandId,
        correlationId: record.correlationId,
        result,
        policyResult: 'ALLOW',
        requiresApproval: false,
        approvalId,
        executionTimestamp,
      };
    } catch (err: any) {
      await kernelAuditEngine.record({
        eventId: record.commandId,
        correlationId: record.correlationId,
        actor: pendingEnvelope.actor,
        tenantId: pendingEnvelope.tenant.organizationId,
        action: pendingEnvelope.commandType,
        entityType: record.entityType,
        entityId: record.entityId,
        approval: { required: true, approvalId, approverId: approver.id },
        result: 'FAILED',
        failureReason: err.message || 'Handler error after approval',
        classification: 'INTERNAL',
      });

      this.pendingCommandEnvelopes.delete(approvalId);

      return {
        success: false,
        commandId: record.commandId,
        correlationId: record.correlationId,
        error: err.message || 'Command execution failed after approval',
        errorCode: 'EXECUTION_FAILED',
        executionTimestamp,
      };
    }
  }
}

export const kernelCommandBus = KernelCommandBus.getInstance();
