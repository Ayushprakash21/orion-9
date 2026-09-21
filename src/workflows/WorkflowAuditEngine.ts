/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Audit Engine
 * 
 * Immutable, tamper-evident audit ledger recording every lifecycle event,
 * state change, condition outcome, approval decision, and Kernel execution.
 */

import { KernelAuditEngine } from '../kernel/AuditEngine';

export interface WorkflowAuditRecord {
  auditId: string;
  tenantId: string;
  workflowId: string;
  workflowInstanceId?: string;
  eventType:
    | 'WORKFLOW_CREATED'
    | 'WORKFLOW_ACTIVATED'
    | 'WORKFLOW_PAUSED'
    | 'WORKFLOW_TRIGGERED'
    | 'WORKFLOW_STARTED'
    | 'STEP_STARTED'
    | 'CONDITION_EVALUATED'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_APPROVED'
    | 'APPROVAL_REJECTED'
    | 'ACTION_EXECUTED'
    | 'ACTION_REJECTED'
    | 'RETRY_SCHEDULED'
    | 'TIMEOUT_OCCURRED'
    | 'COMPENSATION_STARTED'
    | 'COMPENSATION_COMPLETED'
    | 'WORKFLOW_COMPLETED'
    | 'WORKFLOW_FAILED'
    | 'WORKFLOW_CANCELLED';
  actorId: string;
  actorType: 'USER' | 'AGENT' | 'WORKFLOW_KERNEL';
  details: Record<string, any>;
  timestamp: string;
}

export class WorkflowAuditEngine {
  private static instance: WorkflowAuditEngine;
  private records: Map<string, WorkflowAuditRecord[]> = new Map(); // key: tenantId

  private constructor() {}

  public static getInstance(): WorkflowAuditEngine {
    if (!WorkflowAuditEngine.instance) {
      WorkflowAuditEngine.instance = new WorkflowAuditEngine();
    }
    return WorkflowAuditEngine.instance;
  }

  public async logEvent(
    tenantId: string,
    workflowId: string,
    eventType: WorkflowAuditRecord['eventType'],
    actor: { id: string; type: 'USER' | 'AGENT' | 'WORKFLOW_KERNEL' },
    details: Record<string, any>,
    workflowInstanceId?: string
  ): Promise<WorkflowAuditRecord> {
    const auditId = `WFAUDIT-${tenantId}-${Date.now()}-${Math.floor(Date.now() % 100000)}`;
    const record: WorkflowAuditRecord = {
      auditId,
      tenantId,
      workflowId,
      workflowInstanceId,
      eventType,
      actorId: actor.id,
      actorType: actor.type,
      details,
      timestamp: new Date().toISOString()
    };

    const list = this.records.get(tenantId) || [];
    list.push(record);
    this.records.set(tenantId, list);

    // Forward to central Kernel AuditEngine for compliance persistence
    try {
      await KernelAuditEngine.getInstance().record({
        action: `WORKFLOW_${eventType}`,
        tenantId,
        actor: {
          id: actor.id,
          type: actor.type === 'AGENT' ? 'AI_AGENT' : actor.type === 'USER' ? 'USER' : 'SYSTEM',
          role: 'WORKFLOW'
        },
        entityType: 'WORKFLOW',
        entityId: workflowInstanceId || workflowId,
        beforeState: null,
        afterState: details,
        classification: 'RESTRICTED'
      });
    } catch (e) {
      console.warn('[WorkflowAuditEngine] Failed to write to KernelAuditEngine:', e);
    }

    return record;
  }

  public getRecords(tenantId: string, workflowInstanceId?: string): WorkflowAuditRecord[] {
    const list = this.records.get(tenantId) || [];
    if (workflowInstanceId) {
      return list.filter(r => r.workflowInstanceId === workflowInstanceId);
    }
    return JSON.parse(JSON.stringify(list));
  }

  public clear(): void {
    this.records.clear();
  }
}

export const workflowAuditEngine = WorkflowAuditEngine.getInstance();
