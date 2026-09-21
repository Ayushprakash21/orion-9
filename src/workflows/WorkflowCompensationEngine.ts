/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Compensation Engine (Saga Orchestrator)
 * 
 * Orchestrates backward compensation for failed multi-step workflow executions.
 * Strictly ensures compensations are executed as governed Kernel actions,
 * preserving idempotency, policy, and audit trail.
 */

import { WorkflowCompensation, WorkflowStep, WorkflowStepExecution } from './types';

export class WorkflowCompensationEngine {
  private static instance: WorkflowCompensationEngine;
  private compensations: Map<string, WorkflowCompensation> = new Map(); // key: `${tenantId}:${compensationId}`

  private constructor() {}

  public static getInstance(): WorkflowCompensationEngine {
    if (!WorkflowCompensationEngine.instance) {
      WorkflowCompensationEngine.instance = new WorkflowCompensationEngine();
    }
    return WorkflowCompensationEngine.instance;
  }

  /**
   * Identifies previously completed steps that have compensating steps defined
   * and prepares an ordered compensation plan in reverse execution order.
   */
  public planCompensation(
    tenantId: string,
    workflowInstanceId: string,
    steps: WorkflowStep[],
    history: WorkflowStepExecution[]
  ): WorkflowCompensation[] {
    const planned: WorkflowCompensation[] = [];
    const successfulExecutions = history.filter(h => h.status === 'SUCCESS');

    // Iterate backwards over successful step executions
    for (let i = successfulExecutions.length - 1; i >= 0; i--) {
      const exec = successfulExecutions[i];
      const stepDef = steps.find(s => s.stepId === exec.stepId);

      if (stepDef && stepDef.compensatingStepId) {
        const compStep = steps.find(s => s.stepId === stepDef.compensatingStepId);
        if (compStep && compStep.action) {
          const compensationId = `COMP-${tenantId}-${workflowInstanceId}-${exec.stepId}-${Date.now()}`;
          const comp: WorkflowCompensation = {
            compensationId,
            tenantId,
            workflowInstanceId,
            originalStepId: exec.stepId,
            compensatingStepId: compStep.stepId,
            actionType: compStep.action.type,
            commandType: compStep.action.commandType || 'COMPENSATE_STEP',
            status: 'PENDING',
            startedAt: new Date().toISOString()
          };
          planned.push(comp);
          this.compensations.set(`${tenantId}:${compensationId}`, comp);
        }
      }
    }

    return planned;
  }

  public markCompensationRunning(tenantId: string, compensationId: string): void {
    const comp = this.compensations.get(`${tenantId}:${compensationId}`);
    if (comp) {
      comp.status = 'RUNNING';
    }
  }

  public markCompensationCompleted(tenantId: string, compensationId: string): void {
    const comp = this.compensations.get(`${tenantId}:${compensationId}`);
    if (comp) {
      comp.status = 'COMPLETED';
      comp.completedAt = new Date().toISOString();
    }
  }

  public markCompensationFailed(tenantId: string, compensationId: string, error: string): void {
    const comp = this.compensations.get(`${tenantId}:${compensationId}`);
    if (comp) {
      comp.status = 'FAILED';
      comp.error = error;
      comp.completedAt = new Date().toISOString();
    }
  }

  public listCompensations(tenantId: string, workflowInstanceId: string): WorkflowCompensation[] {
    const res: WorkflowCompensation[] = [];
    for (const [key, comp] of this.compensations.entries()) {
      if (key.startsWith(`${tenantId}:`) && comp.workflowInstanceId === workflowInstanceId) {
        res.push(JSON.parse(JSON.stringify(comp)));
      }
    }
    return res;
  }

  public clear(): void {
    this.compensations.clear();
  }
}

export const workflowCompensationEngine = WorkflowCompensationEngine.getInstance();
