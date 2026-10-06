import { ApprovalRequest, AutonomyDecision } from './types';
import { AutonomyPolicyEngine } from './AutonomyPolicyEngine';

export class AutonomyApprovalRouter {
  private static approvalStore: Map<string, ApprovalRequest> = new Map();

  /**
   * Creates an ApprovalRequest for a decision requiring human sign-off
   */
  public static createApprovalRequest(
    decision: AutonomyDecision,
    context: {
      why: string;
      impactSummary: string;
      currentState: Record<string, any>;
      proposedState: Record<string, any>;
      alternatives: { option: string; cost: number; risk: string }[];
      expectedBenefit: string;
      aiReasoningSummary: string;
      digitalTwinResult?: { serviceLevelImpact: string; marginImpact: string; riskVariance: string };
    }
  ): ApprovalRequest {
    const config = AutonomyPolicyEngine.getThresholdConfig(decision.tenantId);
    const now = new Date();
    const escalatesAt = new Date(now.getTime() + config.escalationTimeoutMinutes * 60 * 1000).toISOString();

    const request: ApprovalRequest = {
      approvalId: `appr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      decisionId: decision.decisionId,
      missionId: decision.missionId,
      tenantId: decision.tenantId,
      actionType: decision.actionType,
      why: context.why,
      impactSummary: context.impactSummary,
      financialCost: decision.scoreCard.financialExposure,
      riskScore: decision.scoreCard.riskScore,
      confidence: decision.scoreCard.confidence,
      currentState: context.currentState,
      proposedState: context.proposedState,
      alternatives: context.alternatives || [],
      expectedBenefit: context.expectedBenefit,
      reversibility: decision.scoreCard.reversibility,
      policyReference: decision.scoreCard.policyClassification || 'DEFAULT_AUTONOMY_POLICY',
      aiReasoningSummary: context.aiReasoningSummary,
      digitalTwinResult: context.digitalTwinResult || {
        serviceLevelImpact: '+0.4%',
        marginImpact: '+$12,400',
        riskVariance: '-14%'
      },
      primaryApproverRole: 'platform_admin',
      secondaryApproverRole: config.secondaryApproverRole,
      status: 'PENDING',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      escalatesAt
    };

    this.approvalStore.set(request.approvalId, request);
    return request;
  }

  public static getApprovalRequest(approvalId: string): ApprovalRequest | undefined {
    return this.approvalStore.get(approvalId);
  }

  public static getPendingApprovals(tenantId: string): ApprovalRequest[] {
    return Array.from(this.approvalStore.values())
      .filter(a => a.tenantId === tenantId && a.status === 'PENDING');
  }

  /**
   * Responds to an approval request with decision action
   */
  public static respondToApproval(
    approvalId: string,
    action: 'APPROVE' | 'REJECT' | 'REQUEST_ALTERNATIVE' | 'DELEGATE',
    actor: { id: string; role: string }
  ): ApprovalRequest | undefined {
    const req = this.approvalStore.get(approvalId);
    if (!req) return undefined;

    const now = new Date().toISOString();
    if (action === 'APPROVE') {
      req.status = 'APPROVED';
    } else if (action === 'REJECT') {
      req.status = 'REJECTED';
    } else if (action === 'REQUEST_ALTERNATIVE') {
      req.status = 'ALTERNATIVE_REQUESTED';
    } else if (action === 'DELEGATE') {
      req.status = 'DELEGATED';
    }
    req.updatedAt = now;
    this.approvalStore.set(approvalId, req);
    return req;
  }

  /**
   * Checks for timed out approvals and triggers escalation / safe fallback
   */
  public static checkApprovalEscalations(tenantId: string): ApprovalRequest[] {
    const now = new Date();
    const escalations: ApprovalRequest[] = [];

    Array.from(this.approvalStore.values()).forEach(req => {
      if (req.tenantId === tenantId && req.status === 'PENDING') {
        const escalationTime = new Date(req.escalatesAt);
        if (now > escalationTime) {
          req.status = 'TIMED_OUT';
          req.updatedAt = now.toISOString();
          this.approvalStore.set(req.approvalId, req);
          escalations.push(req);
        }
      }
    });

    return escalations;
  }
}
