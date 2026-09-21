/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Scenario Accuracy Engine
 * 
 * Tracks simulation projection fidelity across Wave 8 disruption archetypes.
 * Computes Mean Absolute Percentage Error (MAPE) and emits calibration alerts.
 */

export interface ScenarioAccuracyRecord {
  accuracyRecordId: string;
  tenantId: string;
  scenarioId: string;
  scenarioType: string;
  projectedCost: number;
  actualCost: number;
  projectedOTIF: number;
  actualOTIF: number;
  costErrorPct: number;
  otifErrorPct: number;
  mape: number;
  bias: number; // positive = over-projected, negative = under-projected
  calibrationRecommended: boolean;
  evaluatedAt: string;
}

export class ScenarioAccuracyEngine {
  private static instance: ScenarioAccuracyEngine;
  private records: Map<string, ScenarioAccuracyRecord> = new Map(); // key: `${tenantId}:${accuracyRecordId}`

  private constructor() {}

  public static getInstance(): ScenarioAccuracyEngine {
    if (!ScenarioAccuracyEngine.instance) {
      ScenarioAccuracyEngine.instance = new ScenarioAccuracyEngine();
    }
    return ScenarioAccuracyEngine.instance;
  }

  public evaluateScenarioProjection(params: {
    tenantId: string;
    scenarioId: string;
    scenarioType: string;
    projectedCost: number;
    actualCost: number;
    projectedOTIF: number;
    actualOTIF: number;
  }): ScenarioAccuracyRecord {
    const accuracyRecordId = `SCENACC-${params.tenantId}-${params.scenarioId}`;

    const costErrorPct = params.projectedCost !== 0
      ? Number((((params.actualCost - params.projectedCost) / params.projectedCost) * 100).toFixed(2))
      : 0;

    const otifErrorPct = params.projectedOTIF !== 0
      ? Number((((params.actualOTIF - params.projectedOTIF) / params.projectedOTIF) * 100).toFixed(2))
      : 0;

    const mape = Number(((Math.abs(costErrorPct) + Math.abs(otifErrorPct)) / 2).toFixed(2));
    const bias = Number(((costErrorPct + otifErrorPct) / 2).toFixed(2));
    const calibrationRecommended = mape >= 15;

    const record: ScenarioAccuracyRecord = {
      accuracyRecordId,
      tenantId: params.tenantId,
      scenarioId: params.scenarioId,
      scenarioType: params.scenarioType,
      projectedCost: params.projectedCost,
      actualCost: params.actualCost,
      projectedOTIF: params.projectedOTIF,
      actualOTIF: params.actualOTIF,
      costErrorPct,
      otifErrorPct,
      mape,
      bias,
      calibrationRecommended,
      evaluatedAt: new Date().toISOString(),
    };

    this.records.set(`${params.tenantId}:${accuracyRecordId}`, record);
    return record;
  }

  public getAccuracyRecord(tenantId: string, accuracyRecordId: string): ScenarioAccuracyRecord | undefined {
    return this.records.get(`${tenantId}:${accuracyRecordId}`);
  }

  public listAccuracyRecords(tenantId: string): ScenarioAccuracyRecord[] {
    const list: ScenarioAccuracyRecord[] = [];
    for (const [key, value] of this.records.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list;
  }

  public getAggregateMetrics(tenantId: string): {
    averageMAPE: number;
    overallCalibrationRecommended: boolean;
    sampleSize: number;
  } {
    const list = this.listAccuracyRecords(tenantId);
    if (list.length === 0) {
      return { averageMAPE: 0, overallCalibrationRecommended: false, sampleSize: 0 };
    }
    const sumMAPE = list.reduce((acc, r) => acc + r.mape, 0);
    const averageMAPE = Number((sumMAPE / list.length).toFixed(2));
    return {
      averageMAPE,
      overallCalibrationRecommended: averageMAPE >= 15,
      sampleSize: list.length,
    };
  }

  public clear(): void {
    this.records.clear();
  }
}
