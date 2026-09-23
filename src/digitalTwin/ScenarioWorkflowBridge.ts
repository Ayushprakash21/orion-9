/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Scenario-to-Workflow Bridge
 * 
 * Bridges approved Scenario Decision Options into Wave 7 Governed Workflows.
 * Absolute Rule: Scenario and Digital Twin engines NEVER directly execute workflows.
 * All actions require Wave 7 Autonomy Governance, human sign-off where required,
 * and routing through KernelCommandBus.
 */

import { ScenarioDecisionOption, Scenario } from './types';
import { workflowEngine } from '../workflows/WorkflowEngine';
import { workflowTriggerEngine } from '../workflows/WorkflowTriggerEngine';
import { AutonomyGovernanceEngine } from '../workflows/AutonomyGovernanceEngine';
import { WorkflowDefinition, WorkflowStep } from '../workflows/types';

export interface WorkflowBridgeResult {
  workflowInstanceId: string;
  scenarioId: string;
  optionId: string;
  status: string;
  governanceRequired: boolean;
  bridgedAt: string;
}

export class ScenarioWorkflowBridge {
  private static instance: ScenarioWorkflowBridge;

  private constructor() {}

  public static getInstance(): ScenarioWorkflowBridge {
    if (!ScenarioWorkflowBridge.instance) {
      ScenarioWorkflowBridge.instance = new ScenarioWorkflowBridge();
    }
    return ScenarioWorkflowBridge.instance;
  }

  /**
   * Checks whether an actor can approve a scenario decision option.
   * AI agents are strictly prohibited from approving decision options.
   */
  public canActorApproveDecision(
    option: any,
    actor: { id: string; role: string; isAi: boolean }
  ): boolean {
    if (actor.isAi) {
      return false;
    }
    return true;
  }

  /**
   * Generates a governed WorkflowDefinition from an approved scenario decision option
   */
  public createWorkflowFromDecision(
    tenantId: string,
    scenarioId: string,
    option: any,
    userId: string
  ): WorkflowDefinition {
    const isHighRisk = option.riskLevel === 'HIGH' || option.riskLevel === 'CRITICAL' || (option.estimatedCost && option.estimatedCost > 5000);
    const autonomyLevel = isHighRisk ? 'LEVEL_3_APPROVAL_REQUIRED' : 'LEVEL_4_GOVERNED_AUTONOMOUS';

    const definition: WorkflowDefinition = {
      workflowId: `WF-BRIDGED-${scenarioId}-${Date.now()}`,
      id: `WF-BRIDGED-${scenarioId}-${Date.now()}`,
      tenantId,
      name: `Bridged Execution: ${option.title || option.id}`,
      description: `Auto-bridged execution from scenario '${scenarioId}' decision option '${option.title || option.id}'`,
      version: '1.0.0',
      status: 'ACTIVE',
      riskClass: isHighRisk ? 'HIGH' : 'MEDIUM',
      autonomyLevel: autonomyLevel as any,
      trigger: {
        triggerId: `TRIG-DEC-${option.id || option.optionId}`,
        tenantId,
        sourceType: 'RECOMMENDATION',
        sourceId: scenarioId,
        eventType: 'SCENARIO_DECISION_APPROVED',
        correlationId: `CORR-${scenarioId}`,
        timestamp: new Date().toISOString(),
        payloadReference: option.actionPayload || option.payload || {},
      },
      steps: [
        {
          stepId: `ST-1-${option.id || option.optionId}`,
          name: option.title || 'Execute Primary Decision Action',
          order: 1,
          type: 'ACTION',
          action: {
            actionId: `ACT-1-${option.id || option.optionId}`,
            type: (option.type || option.recommendedActionType || 'EXECUTE_DECISION') as any,
            commandType: option.commandType || 'scm:shipment:expedite',
            payload: option.actionPayload || option.payload || {},
            riskClass: isHighRisk ? 'HIGH' : 'LOW',
            isMaterial: isHighRisk,
          },
          approval: isHighRisk ? {
            requiredRole: 'procurement_director',
            timeoutMs: 24 * 60 * 60 * 1000,
          } : undefined,
        },
        {
          stepId: `ST-2-${option.id || option.optionId}`,
          name: 'Verify Execution Outcome',
          order: 2,
          type: 'ACTION',
          action: {
            actionId: `ACT-2-${option.id || option.optionId}`,
            type: 'VERIFY_OUTCOME' as any,
            commandType: 'scm:inventory:verify',
            payload: {},
            riskClass: 'LOW',
            isMaterial: false,
          },
        }
      ],
      createdBy: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as any;

    return definition;
  }

  /**
   * Translates an approved scenario decision option into a governed Wave 7 workflow instance
   */
  public async bridgeDecisionOptionToWorkflow(
    tenantId: string,
    scenario: Scenario,
    option: ScenarioDecisionOption,
    actor: { id: string; role: string; name: string; isAi: boolean }
  ): Promise<WorkflowBridgeResult> {
    // 1. Absolute rule: AI agents cannot independently bridge or execute scenario options
    if (actor.isAi) {
      throw new Error('Security Violation: AI agents are strictly prohibited from bridging scenario options to live workflows');
    }

    // 2. Check prohibited actions
    if (AutonomyGovernanceEngine.isOperationProhibited(option.commandType)) {
      throw new Error(`Execution Prohibited: Action '${option.commandType}' is permanently forbidden from execution`);
    }

    // 3. Formulate synthetic workflow step from option
    const workflowStep: WorkflowStep = {
      stepId: `ST-BRIDGE-${option.optionId}`,
      name: option.title,
      order: 1,
      type: 'ACTION',
      action: {
        actionId: `ACT-${option.optionId}`,
        type: option.recommendedActionType as any,
        commandType: option.commandType,
        payload: option.payload,
        riskClass: option.costImpact > 5000 ? 'HIGH' : 'MEDIUM',
        isMaterial: true,
      },
      approval: option.requiresGovernanceApproval ? {
        requiredRole: 'procurement_director',
        timeoutMs: 24 * 60 * 60 * 1000,
      } : undefined,
    };

    const syntheticDefinition: WorkflowDefinition = {
      workflowId: `WF-BRIDGED-${scenario.scenarioId}`,
      tenantId,
      name: `Bridged Execution: ${option.title}`,
      description: `Auto-bridged execution from scenario '${scenario.name}' decision option '${option.title}'`,
      version: '1.0.0',
      status: 'ACTIVE',
      riskClass: option.costImpact > 5000 ? 'HIGH' : 'MEDIUM',
      autonomyLevel: option.requiresGovernanceApproval ? 'LEVEL_3_APPROVAL_GATED' : 'LEVEL_4_GOVERNED_AUTONOMOUS',
      trigger: {
        triggerId: `TRIG-SCEN-${scenario.scenarioId}`,
        tenantId,
        sourceType: 'RECOMMENDATION',
        sourceId: scenario.scenarioId,
        eventType: 'SCENARIO_DECISION_APPROVED',
        correlationId: scenario.correlationId,
        timestamp: new Date().toISOString(),
        payloadReference: option.payload,
      },
      steps: [workflowStep],
      createdBy: actor.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 4. Create trigger via Wave 7 WorkflowTriggerEngine
    const trigger = workflowTriggerEngine.createTrigger(
      tenantId,
      'RECOMMENDATION',
      scenario.scenarioId,
      'SCENARIO_DECISION_APPROVED',
      option.payload,
      scenario.correlationId
    );

    // 5. Create workflow instance in Wave 7
    const instance = await workflowEngine.createInstance(syntheticDefinition, trigger);

    return {
      workflowInstanceId: instance.workflowInstanceId,
      scenarioId: scenario.scenarioId,
      optionId: option.optionId,
      status: instance.status,
      governanceRequired: option.requiresGovernanceApproval,
      bridgedAt: new Date().toISOString(),
    };
  }

  public async submitForWorkflowGovernance(
    tenantId: string,
    scenarioId: string,
    candidateActions: any[]
  ): Promise<any> {
    return {
      governanceStatus: 'PENDING_HUMAN_APPROVAL',
      requiresApproval: true,
      autoExecuted: false,
      executionBlockedReason: 'Approval required: Autonomous execution is prohibited for scenario-generated mutations until signed off by authorized personnel.',
      candidateActions,
      submittedAt: new Date().toISOString()
    };
  }
}

export const scenarioWorkflowBridge = ScenarioWorkflowBridge.getInstance();
