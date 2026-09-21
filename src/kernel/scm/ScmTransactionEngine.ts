/**
 * ORION-9 WAVE 4 — SCM TRANSACTION ENGINE (KERNEL PIPELINE)
 * Executes all governed SCM lifecycle transactions through the 15-step Kernel pipeline.
 */

import { authorizationEngine, AuthorizationActor } from '../authorization/AuthorizationEngine';
import { kernelPolicyEngine } from '../PolicyEngine';
import { scmStateMachine } from './ScmStateMachine';
import { scmEventFabric } from './ScmEventFabric';
import { scmAuditTrail } from './ScmAuditTrail';

export interface ScmCommandEnvelope<T = any> {
  commandName: string;
  tenantId: string;
  actor: AuthorizationActor;
  entityType: string;
  entityId: string;
  currentState?: string;
  targetState: string;
  requiredPermission: string;
  payload: T;
  correlationId?: string;
  estimatedValue?: number;
}

export interface ScmCommandResult<R = any> {
  success: boolean;
  status: 'COMPLETED' | 'PENDING_APPROVAL' | 'DENIED_AUTHORIZATION' | 'DENIED_POLICY' | 'INVALID_STATE_TRANSITION' | 'ERROR';
  data?: R;
  approvalId?: string;
  message?: string;
  correlationId: string;
}

export class ScmTransactionEngine {
  private static instance: ScmTransactionEngine;

  private constructor() {}

  public static getInstance(): ScmTransactionEngine {
    if (!ScmTransactionEngine.instance) {
      ScmTransactionEngine.instance = new ScmTransactionEngine();
    }
    return ScmTransactionEngine.instance;
  }

  public async executeCommand<T = any, R = any>(
    envelope: ScmCommandEnvelope<T>,
    executor: (payload: T) => Promise<R> | R
  ): Promise<ScmCommandResult<R>> {
    const correlationId = envelope.correlationId || `CORR-SCM-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // 1. Identity, Actor & Tenant Verification
    if (!envelope.actor || !envelope.actor.id || !envelope.tenantId) {
      return {
        success: false,
        status: 'DENIED_AUTHORIZATION',
        message: 'Missing required actor identity or tenant boundary',
        correlationId,
      };
    }

    if (envelope.actor.organizationId && envelope.actor.organizationId !== envelope.tenantId) {
      return {
        success: false,
        status: 'DENIED_AUTHORIZATION',
        message: `Tenant isolation violation: Actor tenant '${envelope.actor.organizationId}' mismatch with target tenant '${envelope.tenantId}'`,
        correlationId,
      };
    }

    // 2. Authorization Check
    let authAllowed = true;
    let authMessage = '';
    try {
      authorizationEngine.authorize({
        actor: envelope.actor,
        requiredPermission: envelope.requiredPermission,
        organizationId: envelope.tenantId,
        resourceType: envelope.entityType.toLowerCase(),
      });
    } catch (err: any) {
      authAllowed = false;
      authMessage = err.message || 'Authorization denied';
    }

    if (!authAllowed) {
      return {
        success: false,
        status: 'DENIED_AUTHORIZATION',
        message: authMessage,
        correlationId,
      };
    }

    // 3. Policy Evaluation
    const policyResult = kernelPolicyEngine.evaluate({
      actor: {
        id: envelope.actor.id,
        type: (envelope.actor.type as any) || 'USER',
        name: envelope.actor.name,
        role: envelope.actor.roles[0],
      },
      tenantId: envelope.tenantId,
      action: envelope.requiredPermission,
      entityType: envelope.entityType.toLowerCase(),
      entityId: envelope.entityId,
      amount: envelope.estimatedValue || 0,
    });

    if (policyResult.result === 'BLOCK') {
      return {
        success: false,
        status: 'DENIED_POLICY',
        message: `Policy failure: ${policyResult.reason}`,
        correlationId,
      };
    }

    if (policyResult.result === 'REQUIRE_APPROVAL' || policyResult.requiresApproval) {
      const approvalId = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      return {
        success: false,
        status: 'PENDING_APPROVAL',
        approvalId,
        message: `Execution halted. Transaction requires durable approval: ${policyResult.reason}`,
        correlationId,
      };
    }

    // 4. State Machine Validation
    if (envelope.currentState) {
      const transition = scmStateMachine.validateTransition(
        envelope.entityType,
        envelope.currentState,
        envelope.targetState
      );

      if (!transition.valid) {
        return {
          success: false,
          status: 'INVALID_STATE_TRANSITION',
          message: transition.reason,
          correlationId,
        };
      }
    }

    // 5. Transaction Execution
    try {
      const resultData = await executor(envelope.payload);

      // 6. Domain Event Emission
      scmEventFabric.publish({
        tenantId: envelope.tenantId,
        aggregateId: envelope.entityId,
        aggregateType: envelope.entityType,
        eventType: `orion:scm:${envelope.entityType.toLowerCase()}:${envelope.targetState.toLowerCase()}`,
        actor: envelope.actor,
        correlationId,
        payloadReference: resultData,
      });

      // 7. Audit Evidence Logging
      scmAuditTrail.logTransaction({
        tenantId: envelope.tenantId,
        actor: envelope.actor,
        commandName: envelope.commandName,
        entityType: envelope.entityType,
        entityId: envelope.entityId,
        previousState: envelope.currentState,
        newState: envelope.targetState,
        correlationId,
        details: { commandPayload: envelope.payload },
      });

      return {
        success: true,
        status: 'COMPLETED',
        data: resultData,
        correlationId,
      };
    } catch (err: any) {
      return {
        success: false,
        status: 'ERROR',
        message: err.message || 'Transaction execution failed',
        correlationId,
      };
    }

  }
}

export const scmTransactionEngine = ScmTransactionEngine.getInstance();
