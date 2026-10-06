import { AutonomyDecision, DecisionTraceRecord } from './types';
import { ExecutionResult } from './AutonomyExecutionManager';

export interface LearningProposal {
  proposalId: string;
  tenantId: string;
  decisionId: string;
  actionType: string;
  expectedVariance: number;
  proposedPolicyAdjustment: string;
  status: 'SHADOW' | 'EVALUATE' | 'APPROVED' | 'PROMOTED' | 'ROLLED_BACK';
  createdAt: string;
}

export class AutonomyOutcomeManager {
  private static decisionTraces: Map<string, DecisionTraceRecord> = new Map();
  private static learningProposals: LearningProposal[] = [];

  /**
   * Records execution outcome, compares against expected scoreCard metrics, and builds decision trace
   */
  public static recordOutcome(
    decision: AutonomyDecision,
    executionResult: ExecutionResult
  ): DecisionTraceRecord {
    const trace: DecisionTraceRecord = {
      decisionId: decision.decisionId,
      missionId: decision.missionId,
      agentId: decision.agentId,
      modelId: 'gemini-2.5-pro-orion',
      inputs: {
        actionType: decision.actionType,
        financialExposure: decision.scoreCard.financialExposure,
        riskScore: decision.scoreCard.riskScore
      },
      signalsUsed: ['INVENTORY_STOCKOUT_RISK', 'SUPPLIER_OTIF_TREND', 'DEMAND_SPIKE_DETECTOR'],
      toolsUsed: ['KernelCommandBus', 'DigitalTwinSimulator', 'OrionOptimizationEngine'],
      optionsEvaluated: [
        { option: 'DO_NOTHING', risk: 'HIGH', cost: 45000 },
        { option: 'EXPEDITED_REORDER', risk: 'LOW', cost: 12400 },
        { option: 'SUPPLIER_SHIFT', risk: 'MEDIUM', cost: 18200 }
      ],
      selectedOption: { option: 'EXPEDITED_REORDER', cost: 12400 },
      confidence: decision.scoreCard.confidence,
      riskScore: decision.scoreCard.riskScore,
      expectedOutcome: { serviceRecovered: '99.2%', cost: 12400 },
      actualOutcome: executionResult.resultPayload,
      variance: executionResult.success ? 0.02 : 0.85,
      lessonLearned: executionResult.success
        ? 'Expedited reorder successfully restored buffer stock within SLA window.'
        : 'Execution encountered delay; threshold sensitivity should be adjusted.',
      timestamp: new Date().toISOString()
    };

    this.decisionTraces.set(decision.decisionId, trace);

    // Generate shadow learning proposal if variance exceeds tolerance
    if (trace.variance && trace.variance > 0.05) {
      this.generateLearningProposal(decision, trace.variance);
    }

    return trace;
  }

  private static generateLearningProposal(decision: AutonomyDecision, variance: number): void {
    const proposal: LearningProposal = {
      proposalId: `prop-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: decision.tenantId,
      decisionId: decision.decisionId,
      actionType: decision.actionType,
      expectedVariance: variance,
      proposedPolicyAdjustment: `Adjust autonomous threshold for ${decision.actionType} by -5% based on observed variance.`,
      status: 'SHADOW',
      createdAt: new Date().toISOString()
    };
    this.learningProposals.push(proposal);
  }

  public static getDecisionTrace(decisionId: string): DecisionTraceRecord | undefined {
    return this.decisionTraces.get(decisionId);
  }

  public static getLearningProposals(tenantId: string): LearningProposal[] {
    return this.learningProposals.filter(p => p.tenantId === tenantId);
  }
}
