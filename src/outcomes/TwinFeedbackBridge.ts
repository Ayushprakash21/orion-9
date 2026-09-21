/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Digital Twin Feedback Bridge
 * 
 * Closes the loop between observed empirical outcomes and the enterprise digital twin.
 * Calibrates twin entity parameters and creates a new immutable snapshot.
 * Never mutates historical snapshots.
 */

import { OutcomeRecord, OutcomeVariance, OutcomeObservation } from './types';
import { TwinSnapshotEngine } from '../digitalTwin/TwinSnapshotEngine';
import { TwinGraphEngine } from '../digitalTwin/TwinGraphEngine';
import { TwinSnapshot } from '../digitalTwin/types';

export interface TwinCalibrationResult {
  calibrationId: string;
  tenantId: string;
  targetEntityId: string;
  priorRiskScore: number;
  calibratedRiskScore: number;
  leadTimeAdjustmentDays: number;
  newSnapshotId: string;
  calibratedAt: string;
}

export class TwinFeedbackBridge {
  private static instance: TwinFeedbackBridge;
  private calibrations: Map<string, TwinCalibrationResult> = new Map(); // key: `${tenantId}:${calibrationId}`

  private constructor() {}

  public static getInstance(): TwinFeedbackBridge {
    if (!TwinFeedbackBridge.instance) {
      TwinFeedbackBridge.instance = new TwinFeedbackBridge();
    }
    return TwinFeedbackBridge.instance;
  }

  /**
   * Applies empirical outcome telemetry to calibrate Digital Twin entities
   */
  public applyOutcomeFeedback(params: {
    tenantId: string;
    outcomeRecord: OutcomeRecord;
    variance: OutcomeVariance;
    observation: OutcomeObservation;
    targetEntityId?: string;
    twinId?: string;
  }): TwinCalibrationResult {
    const calibrationId = `TWINCAL-${params.tenantId}-${Date.now()}`;
    const targetEntityId = params.targetEntityId || 'SUPPLIER-GLOBAL-CORP';
    const twinId = params.twinId || `TWIN-${params.tenantId}-PROD`;

    // Calculate parameter adjustments based on variance severity
    let priorRiskScore = 35;
    let calibratedRiskScore = priorRiskScore;
    let leadTimeAdjustmentDays = 0;

    if (params.variance.severity === 'CRITICAL') {
      calibratedRiskScore = Math.min(100, priorRiskScore + 30);
      leadTimeAdjustmentDays = Math.max(1, Math.round(params.variance.transitTimeDeltaDays));
    } else if (params.variance.severity === 'SIGNIFICANT') {
      calibratedRiskScore = Math.min(100, priorRiskScore + 15);
      leadTimeAdjustmentDays = Math.max(0.5, params.variance.transitTimeDeltaDays * 0.5);
    } else if (params.variance.severity === 'NEGLIGIBLE' && params.outcomeRecord.effectivenessClass === 'SUCCESS') {
      calibratedRiskScore = Math.max(5, priorRiskScore - 5);
      leadTimeAdjustmentDays = 0;
    }

    // Produce new immutable twin snapshot via TwinSnapshotEngine
    const snapshotEngine = TwinSnapshotEngine.getInstance();
    const graphEngine = new TwinGraphEngine();

    // Add calibrated entity to graph
    graphEngine.addEntity({
      entityId: targetEntityId,
      name: `Calibrated Entity ${targetEntityId}`,
      type: 'SUPPLIER',
      tenantId: params.tenantId,
      status: 'ACTIVE',
      riskScore: calibratedRiskScore,
      healthScore: 100 - calibratedRiskScore,
      attributes: {
        calibratedFromOutcomeId: params.outcomeRecord.outcomeId,
        leadTimeAdjustmentDays,
      },
      updatedAt: new Date().toISOString(),
    });

    const newSnapshot: TwinSnapshot = snapshotEngine.createSnapshot(
      params.tenantId,
      twinId,
      graphEngine
    );

    const result: TwinCalibrationResult = {
      calibrationId,
      tenantId: params.tenantId,
      targetEntityId,
      priorRiskScore,
      calibratedRiskScore,
      leadTimeAdjustmentDays,
      newSnapshotId: newSnapshot.snapshotId,
      calibratedAt: new Date().toISOString(),
    };

    this.calibrations.set(`${params.tenantId}:${calibrationId}`, result);
    return result;
  }

  public getCalibration(tenantId: string, calibrationId: string): TwinCalibrationResult | undefined {
    return this.calibrations.get(`${tenantId}:${calibrationId}`);
  }

  public listCalibrations(tenantId: string): TwinCalibrationResult[] {
    const list: TwinCalibrationResult[] = [];
    for (const [key, value] of this.calibrations.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list;
  }

  public clear(): void {
    this.calibrations.clear();
  }
}
