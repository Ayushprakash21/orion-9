/**
 * ORION-9 WAVE 4 — SCM AUDIT TRAIL
 * Immutable audit logger recording material SCM transactions.
 */

import { kernelAuditEngine } from '../AuditEngine';
import { AuthorizationActor } from '../authorization/AuthorizationEngine';

export class ScmAuditTrail {
  private static instance: ScmAuditTrail;

  private constructor() {}

  public static getInstance(): ScmAuditTrail {
    if (!ScmAuditTrail.instance) {
      ScmAuditTrail.instance = new ScmAuditTrail();
    }
    return ScmAuditTrail.instance;
  }

  public logTransaction(params: {
    tenantId: string;
    actor: AuthorizationActor;
    commandName: string;
    entityType: string;
    entityId: string;
    previousState?: string;
    newState: string;
    correlationId: string;
    details?: Record<string, any>;
  }): void {
    kernelAuditEngine.record({
      tenantId: params.tenantId,
      actor: {
        id: params.actor.id,
        type: params.actor.type as any,
        name: params.actor.name,
        role: params.actor.roles ? params.actor.roles.join(',') : undefined,
      },
      action: params.commandName,
      entityType: params.entityType,
      entityId: params.entityId,
      beforeState: params.previousState ? { state: params.previousState } : undefined,
      afterState: { state: params.newState, ...params.details },
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
      correlationId: params.correlationId,
    });
  }

}

export const scmAuditTrail = ScmAuditTrail.getInstance();
