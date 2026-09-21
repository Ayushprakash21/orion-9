/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Action Planner
 * 
 * Formulates execution plans, evaluates action risks, distinguishes between draft/advisory
 * steps and material actions, and prepares CommandEnvelope drafts for Kernel execution.
 */

import {
  WorkflowAction,
  WorkflowStep,
  WorkflowInstance,
  WorkflowRiskClass,
  AutonomyLevel
} from './types';
import { AutonomyGovernanceEngine, AutonomyCheckResult } from './AutonomyGovernanceEngine';

export interface PlannedActionStep {
  stepId: string;
  action: WorkflowAction;
  autonomyResult: AutonomyCheckResult;
  requiresKernelDispatch: boolean;
  requiresHumanApproval: boolean;
  targetCommandType?: string;
}

export class WorkflowActionPlanner {
  private static instance: WorkflowActionPlanner;

  private constructor() {}

  public static getInstance(): WorkflowActionPlanner {
    if (!WorkflowActionPlanner.instance) {
      WorkflowActionPlanner.instance = new WorkflowActionPlanner();
    }
    return WorkflowActionPlanner.instance;
  }

  /**
   * Plans the execution of a workflow action step based on autonomy tier and risk class
   */
  public planAction(
    instance: WorkflowInstance,
    step: WorkflowStep,
    autonomyLevel: AutonomyLevel,
    actor: { id: string; role: string; isAi: boolean }
  ): PlannedActionStep {
    if (!step.action) {
      throw new Error(`Step ${step.stepId} does not define an action`);
    }

    const action = step.action;
    const autonomyResult = AutonomyGovernanceEngine.evaluateActionAutonomy(
      autonomyLevel,
      action,
      actor
    );

    const isDraft = action.type.startsWith('DRAFT_') || action.type === 'CREATE_ACTION_REQUEST' || action.type === 'CREATE_TASK';
    const isMaterial = action.isMaterial && !isDraft;

    return {
      stepId: step.stepId,
      action,
      autonomyResult,
      requiresKernelDispatch: isMaterial,
      requiresHumanApproval: autonomyResult.requiresApproval,
      targetCommandType: action.commandType || this.mapActionToCommandType(action.type)
    };
  }

  /**
   * Maps internal action types to standard Kernel CommandEnvelope types
   */
  private mapActionToCommandType(actionType: string): string {
    switch (actionType) {
      case 'DRAFT_PO_CHANGE':
        return 'scm:purchase_order:update';
      case 'DRAFT_REROUTE':
        return 'scm:shipment:reroute';
      case 'DRAFT_EXPEDITE':
        return 'scm:shipment:expedite';
      case 'REQUEST_SUPPLIER_CONFIRMATION':
        return 'scm:supplier:confirm';
      case 'COMPENSATE':
        return 'scm:compensation:execute';
      default:
        return 'workflow:action:execute';
    }
  }
}

export const workflowActionPlanner = WorkflowActionPlanner.getInstance();
