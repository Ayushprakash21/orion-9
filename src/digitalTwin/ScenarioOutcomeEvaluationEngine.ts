/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Scenario Outcome Evaluation Engine
 * 
 * Records actual operational outcomes following workflow execution and compares
 * them against simulated projections.
 * Does not rewrite historical predictions; records explicit variances for accuracy calibration.
 */

import { ScenarioOutcomeRecord } from './types';

export interface ScenarioAccuracyMetrics {
  scenarioType: string;
  observationsCount: number;
  meanAbsolutePercentageError: number;
  bias: number; // positive = over-projected, negative = under-projected
  confidenceScore: number;
}

export class ScenarioOutcomeEvaluationEngine {
  private static instance: ScenarioOutcomeEvaluationEngine;
  private outcomes: Map<string, ScenarioOutcomeRecord[]> = new Map(); // key: tenantId

  private constructor() {}

  public static getInstance(): ScenarioOutcomeEvaluationEngine {
    if (!ScenarioOutcomeEvaluationEngine.instance) {
      ScenarioOutcomeEvaluationEngine.instance = new ScenarioOutcomeEvaluationEngine();
    }
    return ScenarioOutcomeEvaluationEngine.instance;
  }

  public evaluateOutcome(
    tenantId: string,
    data: {
      scenarioId: string;
      runId?: string;
      projectedCost: number;
      actualCost: number;
      projectedOTIF: number;
      actualOTIF: number;
      projectedLeadTimeDays?: number;
      actualLeadTimeDays?: number;
    }
  ): {
    costVariancePercent: number;
    otifVariancePercent: number;
    accuracyScore: number;
    modelCalibrationRecommended: boolean;
  } {
    const costVariancePercent = data.projectedCost !== 0
      ? ((data.actualCost - data.projectedCost) / data.projectedCost) * 100
      : 0;

    const otifVariancePercent = data.projectedOTIF !== 0
      ? ((data.actualOTIF - data.projectedOTIF) / data.projectedOTIF) * 100
      : 0;

    const errorMagnitude = (Math.abs(costVariancePercent) + Math.abs(otifVariancePercent)) / 2;
    const accuracyScore = Math.max(0, 1 - (errorMagnitude / 100));

    return {
      costVariancePercent,
      otifVariancePercent,
      accuracyScore,
      modelCalibrationRecommended: errorMagnitude > 15
    };
  }

  public recordOutcome(record: Omit<ScenarioOutcomeRecord, 'outcomeId' | 'variance' | 'variancePercent' | 'evaluatedAt'>): ScenarioOutcomeRecord {
    const outcomeId = `OUTCOME-${record.tenantId}-${record.scenarioId}-${Date.now()}`;
    const variance = record.actualValue - record.projectedValue;
    const variancePercent = record.projectedValue !== 0
      ? Math.round(((record.actualValue - record.projectedValue) / record.projectedValue) * 1000) / 10
      : 0;

    const fullRecord: ScenarioOutcomeRecord = {
      outcomeId,
      tenantId: record.tenantId,
      scenarioId: record.scenarioId,
      workflowReference: record.workflowReference,
      metric: record.metric,
      projectedValue: record.projectedValue,
      actualValue: record.actualValue,
      variance,
      variancePercent,
      evaluatedAt: new Date().toISOString(),
    };

    const list = this.outcomes.get(record.tenantId) || [];
    list.push(fullRecord);
    this.outcomes.set(record.tenantId, list);

    return fullRecord;
  }

  public getOutcomes(tenantId: string, scenarioId?: string): ScenarioOutcomeRecord[] {
    const list = this.outcomes.get(tenantId) || [];
    if (scenarioId) {
      return list.filter(o => o.scenarioId === scenarioId);
    }
    return list;
  }

  public clear(): void {
    this.outcomes.clear();
  }
}

export const scenarioOutcomeEvaluationEngine = ScenarioOutcomeEvaluationEngine.getInstance();
