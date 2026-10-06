import { AutonomousMission, MissionStatus } from './types';
import { AutonomyDecisionEngine } from './AutonomyDecisionEngine';
import { AutonomyApprovalRouter } from './AutonomyApprovalRouter';
import { AutonomyExecutionManager } from './AutonomyExecutionManager';

export class AutonomousMissionEngine {
  private static missions: Map<string, AutonomousMission> = new Map();

  /**
   * Initializes a new Autonomous Mission to achieve a business objective
   */
  public static createMission(
    tenantId: string,
    title: string,
    objective: string,
    category: AutonomousMission['category'],
    targetKpi: string,
    targetValue: number,
    currentValue: number,
    assignedAgentId: string
  ): AutonomousMission {
    const missionId = `mission-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    const mission: AutonomousMission = {
      missionId,
      tenantId,
      title,
      objective,
      category,
      status: 'MISSION_CREATED',
      targetKpi,
      targetValue,
      currentValue,
      assignedAgentId,
      actionIds: [],
      decisionTraceIds: [],
      createdAt: now,
      updatedAt: now
    };

    this.missions.set(missionId, mission);
    return mission;
  }

  /**
   * Advances the mission through its autonomous lifecycle
   */
  public static async executeMissionStep(
    missionId: string,
    actionType: string,
    scoreCard: any,
    commandType: string,
    commandPayload: Record<string, any>,
    contextInfo: {
      why: string;
      impactSummary: string;
      currentState: Record<string, any>;
      proposedState: Record<string, any>;
      expectedBenefit: string;
    }
  ): Promise<{ mission: AutonomousMission; decisionStatus: string; approvalId?: string }> {
    const mission = this.missions.get(missionId);
    if (!mission) throw new Error(`Mission ${missionId} not found`);

    mission.status = 'MISSION_ANALYZING';
    mission.updatedAt = new Date().toISOString();

    // 1. Evaluate Decision
    const decision = AutonomyDecisionEngine.evaluateDecision(
      mission.tenantId,
      mission.assignedAgentId,
      actionType,
      scoreCard,
      missionId
    );

    mission.decisionTraceIds.push(decision.decisionId);

    // 2. Route via Autonomy Governance
    if (decision.requiresHumanApproval) {
      mission.status = 'MISSION_APPROVAL_REQUIRED';
      const approvalReq = AutonomyApprovalRouter.createApprovalRequest(decision, {
        why: contextInfo.why,
        impactSummary: contextInfo.impactSummary,
        currentState: contextInfo.currentState,
        proposedState: contextInfo.proposedState,
        alternatives: [
          { option: 'Standard Expedited Order', cost: scoreCard.financialExposure, risk: 'LOW' },
          { option: 'Defer Order by 3 Days', cost: 0, risk: 'HIGH' }
        ],
        expectedBenefit: contextInfo.expectedBenefit,
        aiReasoningSummary: `Automated mission agent evaluated risk score ${scoreCard.riskScore} and identified optimal action ${actionType}.`
      });

      this.missions.set(missionId, mission);
      return { mission, decisionStatus: 'PENDING_APPROVAL', approvalId: approvalReq.approvalId };
    }

    // 3. Autonomous Execution
    mission.status = 'MISSION_EXECUTING';
    const execResult = await AutonomyExecutionManager.executeDecision(
      decision,
      commandType,
      commandPayload,
      { id: mission.assignedAgentId, role: 'autonomous_agent', isAi: true }
    );

    if (execResult.success) {
      mission.status = 'MISSION_COMPLETED';
      mission.currentValue = mission.targetValue;
    } else {
      mission.status = 'MISSION_FAILED';
    }

    mission.updatedAt = new Date().toISOString();
    this.missions.set(missionId, mission);

    return { mission, decisionStatus: execResult.success ? 'EXECUTED_SUCCESSFULLY' : 'EXECUTION_FAILED' };
  }

  public static getMission(missionId: string): AutonomousMission | undefined {
    return this.missions.get(missionId);
  }

  public static getActiveMissions(tenantId: string): AutonomousMission[] {
    return Array.from(this.missions.values())
      .filter(m => m.tenantId === tenantId && m.status !== 'MISSION_COMPLETED' && m.status !== 'MISSION_FAILED');
  }

  public static getAllMissions(tenantId: string): AutonomousMission[] {
    return Array.from(this.missions.values()).filter(m => m.tenantId === tenantId);
  }
}
