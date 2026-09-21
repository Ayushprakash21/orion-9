/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Observability Engine
 * 
 * Captures telemetry, step execution metrics, duration latency, and trace spans
 * for all workflow events and Kernel dispatches.
 */

import { WorkflowStepExecution } from './types';

export class WorkflowObservability {
  private static instance: WorkflowObservability;
  private executions: Map<string, WorkflowStepExecution[]> = new Map(); // key: tenantId

  private constructor() {}

  public static getInstance(): WorkflowObservability {
    if (!WorkflowObservability.instance) {
      WorkflowObservability.instance = new WorkflowObservability();
    }
    return WorkflowObservability.instance;
  }

  public recordExecution(execution: WorkflowStepExecution): void {
    const list = this.executions.get(execution.tenantId) || [];
    list.push(JSON.parse(JSON.stringify(execution)));
    this.executions.set(execution.tenantId, list);
  }

  public getExecutionsForInstance(tenantId: string, workflowInstanceId: string): WorkflowStepExecution[] {
    const list = this.executions.get(tenantId) || [];
    return list.filter(e => e.workflowInstanceId === workflowInstanceId);
  }

  public getAllExecutions(tenantId: string): WorkflowStepExecution[] {
    return JSON.parse(JSON.stringify(this.executions.get(tenantId) || []));
  }

  public clear(): void {
    this.executions.clear();
  }
}

export const workflowObservability = WorkflowObservability.getInstance();
