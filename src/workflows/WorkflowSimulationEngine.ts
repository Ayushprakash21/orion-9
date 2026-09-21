/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Simulation Engine (Dry-Run Simulator)
 * 
 * Simulates workflow execution end-to-end against hypothetical or historical contexts.
 * Strictly guarantees ZERO real mutations to business databases or Kernel state.
 */

import { WorkflowDefinition, WorkflowTrigger } from './types';
import { WorkflowConditionEngine } from './WorkflowConditionEngine';
import { workflowActionPlanner } from './WorkflowActionPlanner';

export interface SimulatedStepResult {
  stepId: string;
  stepName: string;
  type: string;
  conditionMet?: boolean;
  plannedAction?: any;
  requiresApproval: boolean;
  approvalRole?: string;
  simulatedStatus: 'EXECUTED_DRY_RUN' | 'SKIPPED' | 'AWAITING_APPROVAL_SIMULATED';
  details: string;
}

export interface WorkflowSimulationReport {
  simulationId: string;
  workflowId: string;
  version: string;
  tenantId: string;
  isDryRun: true;
  mutationsPerformed: 0;
  totalSteps: number;
  evaluatedSteps: SimulatedStepResult[];
  finalProjectedStatus: 'COMPLETED' | 'AWAITING_APPROVAL' | 'FAILED';
  summary: string;
  timestamp: string;
}

export class WorkflowSimulationEngine {
  public static simulate(
    definition: WorkflowDefinition,
    testPayload: Record<string, any>,
    actor: { id: string; role: string; isAi: boolean } = { id: 'SIMULATOR', role: 'admin', isAi: false }
  ): WorkflowSimulationReport {
    const simulationId = `SIM-${definition.workflowId}-${Date.now()}`;
    const evaluatedSteps: SimulatedStepResult[] = [];
    let projectedStatus: 'COMPLETED' | 'AWAITING_APPROVAL' | 'FAILED' = 'COMPLETED';

    const mockInstance: any = {
      workflowInstanceId: `SIM-INST-${Date.now()}`,
      workflowId: definition.workflowId,
      workflowVersion: definition.version,
      tenantId: definition.tenantId,
      status: 'RUNNING',
      contextData: { ...testPayload }
    };

    for (const step of definition.steps) {
      // 1. Condition evaluation
      if (step.condition) {
        const conditionMet = WorkflowConditionEngine.evaluate(step.condition, testPayload);
        if (!conditionMet) {
          evaluatedSteps.push({
            stepId: step.stepId,
            stepName: step.name,
            type: step.type,
            conditionMet: false,
            requiresApproval: false,
            simulatedStatus: 'SKIPPED',
            details: 'Condition evaluated to false; step skipped in dry-run'
          });
          continue;
        }
      }

      // 2. Action evaluation
      if (step.action) {
        const planned = workflowActionPlanner.planAction(
          mockInstance,
          step,
          definition.autonomyLevel,
          actor
        );

        if (planned.requiresHumanApproval) {
          evaluatedSteps.push({
            stepId: step.stepId,
            stepName: step.name,
            type: step.type,
            conditionMet: true,
            plannedAction: planned.action,
            requiresApproval: true,
            approvalRole: step.approval?.requiredRole || 'admin',
            simulatedStatus: 'AWAITING_APPROVAL_SIMULATED',
            details: `Action '${step.action.type}' requires human approval role [${step.approval?.requiredRole || 'admin'}]`
          });
          projectedStatus = 'AWAITING_APPROVAL';
          break; // Simulation stops at approval gate
        } else {
          evaluatedSteps.push({
            stepId: step.stepId,
            stepName: step.name,
            type: step.type,
            conditionMet: true,
            plannedAction: planned.action,
            requiresApproval: false,
            simulatedStatus: 'EXECUTED_DRY_RUN',
            details: `Action '${step.action.type}' projected to execute through Kernel without human gating (Autonomy: ${definition.autonomyLevel})`
          });
        }
      } else {
        evaluatedSteps.push({
          stepId: step.stepId,
          stepName: step.name,
          type: step.type,
          requiresApproval: false,
          simulatedStatus: 'EXECUTED_DRY_RUN',
          details: 'Non-action step passed simulation check'
        });
      }
    }

    return {
      simulationId,
      workflowId: definition.workflowId,
      version: definition.version,
      tenantId: definition.tenantId,
      isDryRun: true,
      mutationsPerformed: 0,
      totalSteps: definition.steps.length,
      evaluatedSteps,
      finalProjectedStatus: projectedStatus,
      summary: `Dry-run completed successfully for ${definition.name}. Evaluated ${evaluatedSteps.length} steps with 0 business mutations.`,
      timestamp: new Date().toISOString()
    };
  }
}
