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
    scenarioIdOrData: any,
    projected?: any,
    actuals?: any
  ): {
    costVariancePercent: number;
    otifVariancePercent: number;
    accuracyScore: number;
    modelCalibrationRecommended: boolean;
    mape: number;
    varianceByMetric: Record<string, number>;
  } {
    let pCost = 0;
    let aCost = 0;
    let pOtif = 95;
    let aOtif = 95;
    let pLead = 0;
    let aLead = 0;

    if (typeof scenarioIdOrData === 'object' && scenarioIdOrData !== null) {
      pCost = scenarioIdOrData.projectedCost ?? 0;
      aCost = scenarioIdOrData.actualCost ?? 0;
      pOtif = scenarioIdOrData.projectedOTIF ?? 95;
      aOtif = scenarioIdOrData.actualOTIF ?? 95;
      pLead = scenarioIdOrData.projectedLeadTimeDays ?? 0;
      aLead = scenarioIdOrData.actualLeadTimeDays ?? 0;
    } else {
      pCost = projected?.totalCost ?? projected?.projectedCost ?? 0;
      aCost = actuals?.totalCost ?? actuals?.actualCost ?? 0;
      pOtif = (projected?.fillRate !== undefined ? projected.fillRate * 100 : projected?.projectedOTIF) ?? 95;
      aOtif = (actuals?.fillRate !== undefined ? actuals.fillRate * 100 : actuals?.actualOTIF) ?? 95;
      pLead = projected?.leadTimeDays ?? projected?.projectedLeadTimeDays ?? 0;
      aLead = actuals?.leadTimeDays ?? actuals?.actualLeadTimeDays ?? 0;
    }

    const costVariancePercent = pCost !== 0
      ? ((aCost - pCost) / pCost) * 100
      : 0;

    const otifVariancePercent = pOtif !== 0
      ? ((aOtif - pOtif) / pOtif) * 100
      : 0;

    const errorMagnitude = (Math.abs(costVariancePercent) + Math.abs(otifVariancePercent)) / 2;
    const accuracyScore = Math.max(0, 1 - (errorMagnitude / 100));

    return {
      costVariancePercent,
      otifVariancePercent,
      accuracyScore,
      modelCalibrationRecommended: errorMagnitude > 15,
      mape: Math.round(errorMagnitude * 100) / 100,
      varianceByMetric: {
        cost: costVariancePercent,
        otif: otifVariancePercent,
        fillRate: Math.abs(otifVariancePercent),
        leadTime: pLead !== 0 ? ((aLead - pLead) / pLead) * 100 : 0
      }
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
