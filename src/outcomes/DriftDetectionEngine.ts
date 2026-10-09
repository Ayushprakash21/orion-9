/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Drift Detection Engine
 * 
 * Continuously evaluates statistical distributions of operational variables to identify concept/data drift.
 * Categorizes drift states into NORMAL, WATCH, DRIFT, and CRITICAL_DRIFT.
 */

import { DriftSignal, DriftState } from './types';
import { DatabaseConnectionManager } from '../core/database/DatabaseConnectionManager';
import { doc, setDoc } from 'firebase/firestore';

export class DriftDetectionEngine {
  private static instance: DriftDetectionEngine;
  private driftSignals: Map<string, DriftSignal> = new Map(); // key: `${tenantId}:${driftId}`

  private constructor() {}

  public static getInstance(): DriftDetectionEngine {
    if (!DriftDetectionEngine.instance) {
      DriftDetectionEngine.instance = new DriftDetectionEngine();
    }
    return DriftDetectionEngine.instance;
  }

  /**
   * Evaluates drift between historical baseline and current operational telemetry
   */
  public evaluateDrift(params: {
    tenantId: string;
    featureName: string;
    baselineMean: number;
    currentMean: number;
    threshold?: number;
  }): DriftSignal {
    const driftId = `DRIFT-${params.tenantId}-${params.featureName}-${Date.now()}`;
    const threshold = params.threshold || 15.0;

    // Relative percentage divergence
    const divergenceScore = params.baselineMean !== 0
      ? Number((Math.abs((params.currentMean - params.baselineMean) / params.baselineMean) * 100).toFixed(2))
      : 0;

    let driftState: DriftState = 'NORMAL';
    if (divergenceScore >= 30) {
      driftState = 'CRITICAL_DRIFT';
    } else if (divergenceScore >= threshold) {
      driftState = 'DRIFT';
    } else if (divergenceScore >= 5) {
      driftState = 'WATCH';
    }

    const signal: DriftSignal = {
      driftId,
      tenantId: params.tenantId,
      featureName: params.featureName,
      baselineDistributionMean: params.baselineMean,
      currentDistributionMean: params.currentMean,
      divergenceScore,
      driftState,
      threshold,
      detectedAt: new Date().toISOString(),
    };

    this.driftSignals.set(`${params.tenantId}:${driftId}`, signal);

    const env = DatabaseConnectionManager.getInstance().getEnvironment();
    if (env === 'LIVE') {
      const db = DatabaseConnectionManager.getInstance().getFirestore('LIVE');
      if (db) {
        setDoc(doc(db, 'drift_signals', `${params.tenantId}_${driftId}`), signal).catch(err => {
          console.error(`[DRIFT-PERSISTENCE] Authoritative write failed for drift signal ${driftId}:`, err);
        });
      }
    } else {
      const db = DatabaseConnectionManager.getInstance().getFirestore('DEMO');
      if (db) {
        setDoc(doc(db, 'drift_signals', `${params.tenantId}_${driftId}`), signal).catch(() => {});
      }
    }

    return signal;
  }

  /**
   * Authoritatively evaluates drift and awaits durable persistence in the target environment
   */
  public async evaluateAndPersistDrift(params: {
    tenantId: string;
    featureName: string;
    baselineMean: number;
    currentMean: number;
    threshold?: number;
  }): Promise<DriftSignal> {
    const signal = this.evaluateDrift(params);
    const env = DatabaseConnectionManager.getInstance().getEnvironment();
    if (env === 'LIVE') {
      const db = DatabaseConnectionManager.getInstance().getFirestore('LIVE');
      if (!db) {
        throw new Error(`[DRIFT-PERSISTENCE] LIVE environment active but Firestore instance unavailable for signal ${signal.driftId}`);
      }
      try {
        await setDoc(doc(db, 'drift_signals', `${params.tenantId}_${signal.driftId}`), signal);
      } catch (err: any) {
        console.error(`[DRIFT-PERSISTENCE] Authoritative Firestore write failed for signal ${signal.driftId}:`, err);
        throw new Error(`[DRIFT-PERSISTENCE] Authoritative write failed for signal ${signal.driftId}: ${err?.message || err}`);
      }
    }
    return signal;
  }

  public getDriftSignal(tenantId: string, driftId: string): DriftSignal | undefined {
    return this.driftSignals.get(`${tenantId}:${driftId}`);
  }

  public listDriftSignals(tenantId: string): DriftSignal[] {
    const list: DriftSignal[] = [];
    for (const [key, value] of this.driftSignals.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  public clear(): void {
    this.driftSignals.clear();
  }
}
