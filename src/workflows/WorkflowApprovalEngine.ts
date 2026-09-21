/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Approval Engine
 * 
 * Enforces strict human-in-the-loop validation for Level 3 and High/Critical risk actions.
 * Absolute rule: AI and workflows can NEVER self-approve. Approvals must come from
 * an authenticated human USER with the required role.
 */

import { WorkflowApproval } from './types';

export class WorkflowApprovalEngine {
  private static instance: WorkflowApprovalEngine;
  private approvals: Map<string, WorkflowApproval> = new Map(); // key: `${tenantId}:${approvalId}`

  private constructor() {}

  public static getInstance(): WorkflowApprovalEngine {
    if (!WorkflowApprovalEngine.instance) {
      WorkflowApprovalEngine.instance = new WorkflowApprovalEngine();
    }
    return WorkflowApprovalEngine.instance;
  }

  public createApprovalRequest(
    tenantId: string,
    workflowInstanceId: string,
    stepId: string,
    actionId: string,
    requiredRole: string,
    requestedBy: { id: string; type: 'USER' | 'AGENT' | 'WORKFLOW'; name: string },
    timeoutMs: number = 48 * 60 * 60 * 1000
  ): WorkflowApproval {
    const approvalId = `APPR-${tenantId}-${workflowInstanceId}-${stepId}-${Date.now()}`;
    const approval: WorkflowApproval = {
      approvalId,
      tenantId,
      workflowInstanceId,
      stepId,
      actionId,
      requiredRole,
      requestedBy,
      requestedAt: new Date().toISOString(),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + timeoutMs).toISOString()
    };

    this.approvals.set(`${tenantId}:${approvalId}`, approval);
    return JSON.parse(JSON.stringify(approval));
  }

  public getApproval(tenantId: string, approvalId: string): WorkflowApproval | undefined {
    const rec = this.approvals.get(`${tenantId}:${approvalId}`);
    return rec ? JSON.parse(JSON.stringify(rec)) : undefined;
  }

  public listPendingApprovals(tenantId: string): WorkflowApproval[] {
    const res: WorkflowApproval[] = [];
    for (const [key, approval] of this.approvals.entries()) {
      if (key.startsWith(`${tenantId}:`) && approval.status === 'PENDING') {
        res.push(JSON.parse(JSON.stringify(approval)));
      }
    }
    return res;
  }

  public approve(
    tenantId: string,
    approvalId: string,
    actor: { id: string; role: string; name: string; isAi: boolean }
  ): WorkflowApproval {
    const compositeKey = `${tenantId}:${approvalId}`;
    const approval = this.approvals.get(compositeKey);
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found in tenant ${tenantId}`);
    }

    if (approval.status !== 'PENDING') {
      throw new Error(`Cannot approve request in status '${approval.status}'`);
    }

    // Check expiration
    if (approval.expiresAt && new Date(approval.expiresAt).getTime() < Date.now()) {
      approval.status = 'EXPIRED';
      throw new Error(`Approval request ${approvalId} has expired`);
    }

    // ABSOLUTE RULE: AI CANNOT APPROVE
    if (actor.isAi) {
      throw new Error(`Security Violation: AI agents cannot approve workflow actions`);
    }

    // Role verification
    const authorizedRoles = [
      approval.requiredRole,
      'platform_admin',
      'organization_admin',
      'admin',
      'procurement_director'
    ];
    if (!authorizedRoles.includes(actor.role)) {
      throw new Error(
        `User ${actor.id} with role '${actor.role}' is not authorized to approve. Required role: '${approval.requiredRole}'`
      );
    }

    // Self-approval check: requester cannot approve unless platform_admin
    if (approval.requestedBy.id === actor.id && actor.role !== 'platform_admin') {
      throw new Error(`Separation of duties violation: Requester cannot approve their own action request`);
    }

    approval.status = 'APPROVED';
    approval.approvedBy = {
      id: actor.id,
      role: actor.role,
      name: actor.name
    };
    approval.approvedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(approval));
  }

  public reject(
    tenantId: string,
    approvalId: string,
    actor: { id: string; role: string; name: string; isAi: boolean },
    rejectionReason: string
  ): WorkflowApproval {
    const compositeKey = `${tenantId}:${approvalId}`;
    const approval = this.approvals.get(compositeKey);
    if (!approval) {
      throw new Error(`Approval request ${approvalId} not found in tenant ${tenantId}`);
    }

    if (actor.isAi) {
      throw new Error(`Security Violation: AI agents cannot reject or modify human approvals`);
    }

    if (approval.status !== 'PENDING') {
      throw new Error(`Cannot reject request in status '${approval.status}'`);
    }

    approval.status = 'REJECTED';
    approval.rejectionReason = rejectionReason;
    approval.approvedBy = {
      id: actor.id,
      role: actor.role,
      name: actor.name
    };
    approval.approvedAt = new Date().toISOString();

    return JSON.parse(JSON.stringify(approval));
  }

  public clear(): void {
    this.approvals.clear();
  }
}

export const workflowApprovalEngine = WorkflowApprovalEngine.getInstance();
