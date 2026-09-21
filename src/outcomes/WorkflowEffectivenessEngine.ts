/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Workflow Effectiveness Engine
 * 
 * Measures execution quality of Wave 7 autonomous workflows:
 * - SLA attainment
 * - Retry counts
 * - Saga compensation frequency
 * - Exception resolution rate
 */

export interface WorkflowEvaluationResult {
  evaluationId: string;
  tenantId: string;
  workflowInstanceId: string;
  resolvedException: boolean;
  durationMs: number;
  slaTargetMs: number;
  slaBreached: boolean;
  retryCount: number;
  compensationTriggered: boolean;
  humanInterventionRequired: boolean;
  effectivenessScore: number; // 0 - 100
  evaluatedAt: string;
}

export class WorkflowEffectivenessEngine {
  private static instance: WorkflowEffectivenessEngine;
  private evaluations: Map<string, WorkflowEvaluationResult> = new Map(); // key: `${tenantId}:${evaluationId}`

  private constructor() {}

  public static getInstance(): WorkflowEffectivenessEngine {
    if (!WorkflowEffectivenessEngine.instance) {
      WorkflowEffectivenessEngine.instance = new WorkflowEffectivenessEngine();
    }
    return WorkflowEffectivenessEngine.instance;
  }

  public evaluateWorkflow(params: {
    tenantId: string;
    workflowInstanceId: string;
    resolvedException: boolean;
    durationMs: number;
    slaTargetMs?: number;
    retryCount?: number;
    compensationTriggered?: boolean;
    humanInterventionRequired?: boolean;
  }): WorkflowEvaluationResult {
    const evaluationId = `WFEVAL-${params.tenantId}-${params.workflowInstanceId}`;
    const slaTargetMs = params.slaTargetMs || 10000;
    const retryCount = params.retryCount || 0;
    const compensationTriggered = !!params.compensationTriggered;
    const humanInterventionRequired = !!params.humanInterventionRequired;
    const slaBreached = params.durationMs > slaTargetMs;

    let score = 100;
    if (!params.resolvedException) score -= 40;
    if (slaBreached) score -= 15;
    if (retryCount > 0) score -= Math.min(20, retryCount * 5);
    if (compensationTriggered) score -= 25;
    if (humanInterventionRequired) score -= 5; // Slight deduction for autonomy gap

    const effectivenessScore = Math.max(0, Math.min(100, score));

    const result: WorkflowEvaluationResult = {
      evaluationId,
      tenantId: params.tenantId,
      workflowInstanceId: params.workflowInstanceId,
      resolvedException: params.resolvedException,
      durationMs: params.durationMs,
      slaTargetMs,
      slaBreached,
      retryCount,
      compensationTriggered,
      humanInterventionRequired,
      effectivenessScore,
      evaluatedAt: new Date().toISOString(),
    };

    this.evaluations.set(`${params.tenantId}:${evaluationId}`, result);
    return result;
  }

  public getEvaluation(tenantId: string, evaluationId: string): WorkflowEvaluationResult | undefined {
    return this.evaluations.get(`${tenantId}:${evaluationId}`);
  }

  public listEvaluations(tenantId: string): WorkflowEvaluationResult[] {
    const list: WorkflowEvaluationResult[] = [];
    for (const [key, value] of this.evaluations.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list;
  }

  public clear(): void {
    this.evaluations.clear();
  }
}
