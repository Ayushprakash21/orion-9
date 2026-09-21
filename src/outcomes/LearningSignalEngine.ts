/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Learning Signal Engine
 * 
 * Aggregates empirical variances to detect systematic bias, structural drift, and recurring operational anomalies.
 * Emits governed learning signals for human review.
 */

import { OutcomeVariance, OutcomeLearningSignal, LearningSignalStatus } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class LearningSignalEngine {
  private static instance: LearningSignalEngine;
  private signals: Map<string, OutcomeLearningSignal> = new Map(); // key: `${tenantId}:${signalId}`

  private constructor() {}

  public static getInstance(): LearningSignalEngine {
    if (!LearningSignalEngine.instance) {
      LearningSignalEngine.instance = new LearningSignalEngine();
    }
    return LearningSignalEngine.instance;
  }

  /**
   * Evaluates a cohort of variances to detect systematic drift patterns
   */
  public analyzeVariances(
    tenantId: string,
    variances: OutcomeVariance[]
  ): OutcomeLearningSignal[] {
    const tenantVariances = variances.filter(v => v.tenantId === tenantId);
    if (tenantVariances.length === 0) return [];

    const detectedSignals: OutcomeLearningSignal[] = [];

    // 1. Lead time systematic underestimation check
    const transitDeltas = tenantVariances.map(v => v.transitTimeDeltaDays);
    const avgTransitDelta = transitDeltas.reduce((a, b) => a + b, 0) / transitDeltas.length;
    if (avgTransitDelta > 1.5 && tenantVariances.length >= 2) {
      const signalId = `SIG-${tenantId}-LEADTIME-${Date.now()}`;
      const signal: OutcomeLearningSignal = {
        signalId,
        tenantId,
        metric: 'LEAD_TIME_UNDERESTIMATION',
        driftMagnitudePct: Number(((avgTransitDelta / 5) * 100).toFixed(1)),
        sampleSize: tenantVariances.length,
        firstObservedAt: tenantVariances[tenantVariances.length - 1].calculatedAt,
        lastObservedAt: tenantVariances[0].calculatedAt,
        status: 'REVIEW_REQUIRED',
        recommendedAction: `Increase baseline transit lead time assumptions by +${avgTransitDelta.toFixed(1)} days.`,
        detectedBy: 'SYSTEM_LEARNING_ENGINE',
      };
      this.signals.set(`${tenantId}:${signalId}`, signal);
      detectedSignals.push(signal);
      this.persistSignal(signal);
    }

    // 2. Cost escalation trend check
    const costVariances = tenantVariances.map(v => v.costVariancePct);
    const avgCostVariance = costVariances.reduce((a, b) => a + b, 0) / costVariances.length;
    if (avgCostVariance > 10 && tenantVariances.length >= 2) {
      const signalId = `SIG-${tenantId}-COST-${Date.now()}`;
      const signal: OutcomeLearningSignal = {
        signalId,
        tenantId,
        metric: 'CONTAINER_FREIGHT_COST_ESCALATION',
        driftMagnitudePct: Number(avgCostVariance.toFixed(1)),
        sampleSize: tenantVariances.length,
        firstObservedAt: tenantVariances[tenantVariances.length - 1].calculatedAt,
        lastObservedAt: tenantVariances[0].calculatedAt,
        status: 'REVIEW_REQUIRED',
        recommendedAction: `Recalibrate spot freight cost ceiling threshold by +${avgCostVariance.toFixed(1)}%.`,
        detectedBy: 'SYSTEM_LEARNING_ENGINE',
      };
      this.signals.set(`${tenantId}:${signalId}`, signal);
      detectedSignals.push(signal);
      this.persistSignal(signal);
    }

    return detectedSignals;
  }

  public emitSignal(signal: Omit<OutcomeLearningSignal, 'signalId' | 'firstObservedAt' | 'lastObservedAt'>): OutcomeLearningSignal {
    const signalId = `SIG-${signal.tenantId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const fullSignal: OutcomeLearningSignal = {
      ...signal,
      signalId,
      firstObservedAt: now,
      lastObservedAt: now,
    };

    this.signals.set(`${signal.tenantId}:${signalId}`, fullSignal);
    this.persistSignal(fullSignal);
    return fullSignal;
  }

  public updateStatus(
    tenantId: string,
    signalId: string,
    status: LearningSignalStatus,
    resolverUser?: string
  ): OutcomeLearningSignal | undefined {
    const existing = this.signals.get(`${tenantId}:${signalId}`);
    if (!existing) return undefined;

    const updated: OutcomeLearningSignal = {
      ...existing,
      status,
      resolvedAt: status === 'ACCEPTED' || status === 'REJECTED' || status === 'IMPLEMENTED' ? new Date().toISOString() : existing.resolvedAt,
    };

    this.signals.set(`${tenantId}:${signalId}`, updated);
    this.persistSignal(updated);
    return updated;
  }

  private async persistSignal(signal: OutcomeLearningSignal): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'learning_signals', `${signal.tenantId}_${signal.signalId}`), signal);
      }
    } catch {
      // Best-effort Firestore write
    }
  }

  public getSignal(tenantId: string, signalId: string): OutcomeLearningSignal | undefined {
    return this.signals.get(`${tenantId}:${signalId}`);
  }

  public listSignals(tenantId: string): OutcomeLearningSignal[] {
    const list: OutcomeLearningSignal[] = [];
    for (const [key, value] of this.signals.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.lastObservedAt).getTime() - new Date(a.lastObservedAt).getTime());
  }

  public clear(): void {
    this.signals.clear();
  }
}
