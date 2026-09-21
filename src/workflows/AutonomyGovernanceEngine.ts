/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Autonomy Governance Engine
 * 
 * Enforces server-side autonomy tiers (LEVEL_0_OBSERVE to LEVEL_5_PROHIBITED),
 * prevents unauthorized elevation, and guarantees that prohibited actions
 * (payment settlement, contract alteration, policy mutation) can never execute autonomously.
 */

import { AutonomyLevel, AUTONOMY_LEVEL_VALUES, WorkflowAction, WorkflowRiskClass } from './types';

export interface AutonomyCheckResult {
  allowed: boolean;
  requiresApproval: boolean;
  reason: string;
  maxPermittedLevel: AutonomyLevel;
}

export class AutonomyGovernanceEngine {
  // Permanently prohibited autonomous actions across the entire enterprise
  private static readonly PROHIBITED_AUTONOMOUS_ACTIONS = new Set([
    'PAYMENT_SETTLEMENT',
    'CONTRACT_MODIFICATION',
    'CONTRACT_CREATION',
    'CREATE_POLICY',
    'UPDATE_POLICY',
    'DELETE_POLICY',
    'CREATE_ROLE',
    'UPDATE_ROLE',
    'UNRESTRICTED_PROCUREMENT',
    'DATABASE_MUTATION',
    'CODE_EXECUTION'
  ]);

  /**
   * Verifies whether an action can proceed under the specified workflow autonomy level and risk class
   */
  public static evaluateActionAutonomy(
    autonomyLevel: AutonomyLevel,
    action: WorkflowAction,
    actor: { id: string; role: string; isAi: boolean }
  ): AutonomyCheckResult {
    // 1. Prohibited check
    if (autonomyLevel === 'LEVEL_5_PROHIBITED') {
      return {
        allowed: false,
        requiresApproval: false,
        reason: 'Action execution is strictly prohibited under LEVEL_5_PROHIBITED',
        maxPermittedLevel: autonomyLevel
      };
    }

    if (this.PROHIBITED_AUTONOMOUS_ACTIONS.has(action.type) || (action.commandType && this.PROHIBITED_AUTONOMOUS_ACTIONS.has(action.commandType))) {
      return {
        allowed: false,
        requiresApproval: false,
        reason: `Action '${action.type}' is permanently prohibited from autonomous execution`,
        maxPermittedLevel: 'LEVEL_5_PROHIBITED'
      };
    }

    // 2. LEVEL_0_OBSERVE: No action at all
    if (autonomyLevel === 'LEVEL_0_OBSERVE') {
      return {
        allowed: false,
        requiresApproval: false,
        reason: 'Execution disallowed: Autonomy level is strictly OBSERVE only',
        maxPermittedLevel: autonomyLevel
      };
    }

    // 3. LEVEL_1_RECOMMEND: Recommendation only
    if (autonomyLevel === 'LEVEL_1_RECOMMEND') {
      if (action.type === 'CREATE_ACTION_REQUEST' && !action.isMaterial) {
        return {
          allowed: true,
          requiresApproval: false,
          reason: 'Permitted: Advisory recommendation',
          maxPermittedLevel: autonomyLevel
        };
      }
      return {
        allowed: false,
        requiresApproval: false,
        reason: 'Material actions cannot be executed under LEVEL_1_RECOMMEND',
        maxPermittedLevel: autonomyLevel
      };
    }

    // 4. LEVEL_2_DRAFT: Drafting only
    if (autonomyLevel === 'LEVEL_2_DRAFT') {
      const isDraftType = action.type.startsWith('DRAFT_') || action.type === 'CREATE_TASK' || action.type === 'SEND_NOTIFICATION' || !action.isMaterial;
      if (isDraftType) {
        return {
          allowed: true,
          requiresApproval: false,
          reason: 'Permitted: Draft creation allowed under LEVEL_2_DRAFT',
          maxPermittedLevel: autonomyLevel
        };
      }
      return {
        allowed: false,
        requiresApproval: true,
        reason: `Material execution of ${action.type} requires elevation or approval under LEVEL_2_DRAFT`,
        maxPermittedLevel: autonomyLevel
      };
    }

    // 5. LEVEL_3_APPROVAL_GATED: Requires explicit human approval for material actions
    if (autonomyLevel === 'LEVEL_3_APPROVAL_GATED') {
      if (!action.isMaterial || action.type === 'SEND_NOTIFICATION' || action.type === 'CREATE_TASK') {
        return {
          allowed: true,
          requiresApproval: false,
          reason: 'Permitted: Non-material step executed under LEVEL_3_APPROVAL_GATED',
          maxPermittedLevel: autonomyLevel
        };
      }
      return {
        allowed: true,
        requiresApproval: true,
        reason: 'Material action requires human approval under LEVEL_3_APPROVAL_GATED',
        maxPermittedLevel: autonomyLevel
      };
    }

    // 6. LEVEL_4_GOVERNED_AUTONOMOUS: Low / medium risk can execute through Kernel autonomously;
    // High / Critical ALWAYS require explicit human approval!
    if (autonomyLevel === 'LEVEL_4_GOVERNED_AUTONOMOUS') {
      if (action.riskClass === 'HIGH' || action.riskClass === 'CRITICAL') {
        return {
          allowed: true,
          requiresApproval: true,
          reason: `High/Critical risk action (${action.riskClass}) strictly requires human approval even under LEVEL_4_GOVERNED_AUTONOMOUS`,
          maxPermittedLevel: autonomyLevel
        };
      }
      return {
        allowed: true,
        requiresApproval: false,
        reason: 'Permitted: Pre-authorized low/medium risk action executed through governed Kernel',
        maxPermittedLevel: autonomyLevel
      };
    }

    return {
      allowed: false,
      requiresApproval: false,
      reason: 'Unknown autonomy tier',
      maxPermittedLevel: 'LEVEL_0_OBSERVE'
    };
  }

  /**
   * Checks if an operation string matches prohibited autonomous operations
   */
  public static isOperationProhibited(operation: string): boolean {
    const normalized = operation.toUpperCase().replace(/[:.-]/g, '_');
    for (const prohibited of this.PROHIBITED_AUTONOMOUS_ACTIONS) {
      if (normalized.includes(prohibited) || prohibited.includes(normalized)) {
        return true;
      }
    }
    return false;
  }

  public isOperationProhibited(operation: string): boolean {
    return AutonomyGovernanceEngine.isOperationProhibited(operation);
  }

  public evaluateActionAutonomy(
    autonomyLevel: AutonomyLevel,
    action: WorkflowAction,
    actor: { id: string; role: string; isAi: boolean }
  ): AutonomyCheckResult {
    return AutonomyGovernanceEngine.evaluateActionAutonomy(autonomyLevel, action, actor);
  }

  public canElevateAutonomy(
    currentLevel: AutonomyLevel,
    targetLevel: AutonomyLevel,
    actor: { id: string; role: string; isAi: boolean }
  ): boolean {
    return AutonomyGovernanceEngine.canElevateAutonomy(currentLevel, targetLevel, actor);
  }
}

export const autonomyGovernanceEngine = new AutonomyGovernanceEngine();
