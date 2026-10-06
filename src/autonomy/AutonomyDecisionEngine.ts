import { AutonomyDecision, AutonomyLevel, AutonomyScoreCard, RiskClass } from './types';
import { AutonomyPolicyEngine } from './AutonomyPolicyEngine';

export class AutonomyDecisionEngine {
  /**
   * Calculates formula:
   * AUTONOMY_DECISION = risk + materiality + confidence + reversibility + policy + organizational threshold
   */
  public static evaluateDecision(
    tenantId: string,
    agentId: string,
    actionType: string,
    scoreCard: AutonomyScoreCard,
    missionId?: string
  ): AutonomyDecision {
    const decisionId = `dec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Determine Risk Class
    let riskClass: RiskClass = 'LOW';
    if (scoreCard.riskScore > 80 || scoreCard.safetyImpact || scoreCard.complianceImpact) {
      riskClass = 'CRITICAL';
    } else if (scoreCard.riskScore > 60 || scoreCard.legalImpact || scoreCard.strategicImpact) {
      riskClass = 'HIGH';
    } else if (scoreCard.riskScore > 40 || scoreCard.customerImpact === 'HIGH' || scoreCard.supplierImpact === 'HIGH') {
      riskClass = 'MATERIAL';
    } else if (scoreCard.riskScore > 20) {
      riskClass = 'MEDIUM';
    }

    // Policy & Threshold Check
    const policyResult = AutonomyPolicyEngine.evaluatePolicy(
      tenantId,
      actionType,
      scoreCard.financialExposure,
      riskClass
    );

    let calculatedLevel: AutonomyLevel = policyResult.maxAllowedLevel;
    let requiresApproval = policyResult.approvalRequired;
    let reason = policyResult.reason;

    // Enforce confidence check (if AI confidence < 80%, force approval)
    if (scoreCard.confidence < 0.80 && calculatedLevel !== 'LEVEL_5_PROHIBITED') {
      requiresApproval = true;
      reason += ` | AI confidence is low (${(scoreCard.confidence * 100).toFixed(1)}%), requiring human verification.`;
      calculatedLevel = 'LEVEL_3_APPROVAL_GATED';
    }

    // Enforce reversibility check (irreversible material actions require approval)
    if (!scoreCard.reversibility && (riskClass === 'MATERIAL' || riskClass === 'HIGH' || riskClass === 'CRITICAL')) {
      requiresApproval = true;
      reason += ` | Action is non-reversible, forcing human approval gate.`;
      calculatedLevel = 'LEVEL_3_APPROVAL_GATED';
    }

    const decision: AutonomyDecision = {
      decisionId,
      missionId,
      agentId,
      actionType,
      scoreCard,
      calculatedAutonomyLevel: calculatedLevel,
      requiresHumanApproval: requiresApproval,
      approvalReason: reason,
      status: requiresApproval ? 'PENDING_APPROVAL' : 'APPROVED',
      createdAt: new Date().toISOString(),
      tenantId
    };

    return decision;
  }
}
