/**
 * ORION-9 WAVE 6 — OUTCOME INTELLIGENCE ENGINE
 *
 * Calculates empirical variance metrics between decision expectations and actual outcomes:
 * - Cost Variance (actual cost vs expected cost)
 * - Service Variance (service days saved vs expected)
 * - Delay Variance (transit delay delta)
 * - Prediction Accuracy Variance
 * - Execution Conformance (ON_TRACK | DEVIATED | FAILED)
 *
 * Persists append-only records to Firestore 'decision_outcomes' collection.
 */

import { OutcomeVariance, DecisionIntelligence } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export interface ComputeVarianceParams {
  tenantId: string;
  decision: DecisionIntelligence;
  actualOutcome: {
    actualCost?: number;
    actualServiceImpact?: string;
    actualDaysProtected?: number;
    actualDelayDays?: number;
    executionStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED';
    notes?: string;
  };
}

export class OutcomeIntelligence {
  private static instance: OutcomeIntelligence;
  private variances: Map<string, OutcomeVariance> = new Map();

  private constructor() {}

  public static getInstance(): OutcomeIntelligence {
    if (!OutcomeIntelligence.instance) {
      OutcomeIntelligence.instance = new OutcomeIntelligence();
    }
    return OutcomeIntelligence.instance;
  }

  /**
   * Compares predicted/expected decision metrics against real physical outcomes
   */
  public async computeVariance(params: ComputeVarianceParams): Promise<OutcomeVariance> {
    const { tenantId, decision, actualOutcome } = params;
    const varianceId = `var-${tenantId}-${decision.decisionId}`;
    const nowIso = new Date().toISOString();

    const recommended = decision.recommendation.recommendedOption;
    const evaluation = decision.evaluations.find(e => e.optionId === recommended.optionId);

    const expectedCost = recommended.expectedCost || 0;
    const actualCost = actualOutcome.actualCost !== undefined ? actualOutcome.actualCost : expectedCost;
    const costVariance = actualCost - expectedCost;

    const expectedDelayDays = Math.abs(evaluation?.leadTimeDeltaDays || 0);
    const actualDelayDays = actualOutcome.actualDelayDays !== undefined ? actualOutcome.actualDelayDays : 0;
    const delayVariance = actualDelayDays - expectedDelayDays;

    const expectedServiceDays = evaluation?.serviceLevelDaysProtected || 0;
    const actualServiceDays = actualOutcome.actualDaysProtected !== undefined ? actualOutcome.actualDaysProtected : expectedServiceDays;
    const serviceVariance = actualServiceDays - expectedServiceDays;

    let executionVariance: 'ON_TRACK' | 'DEVIATED' | 'FAILED' = 'ON_TRACK';
    if (actualOutcome.executionStatus === 'FAILED') {
      executionVariance = 'FAILED';
    } else if (Math.abs(costVariance) > 5000 || delayVariance > 2) {
      executionVariance = 'DEVIATED';
    }

    const variance: OutcomeVariance = {
      varianceId,
      tenantId,
      decisionId: decision.decisionId,
      predictedOutcome: {
        recommendedAction: recommended.actionType,
        expectedCost,
        expectedDaysProtected: expectedServiceDays,
        confidence: decision.recommendation.confidence,
      },
      actualOutcome: {
        actualCost,
        actualDaysProtected: actualServiceDays,
        executionStatus: actualOutcome.executionStatus,
        notes: actualOutcome.notes || 'Outcome empirical feedback recorded.',
      },
      predictionVariance: Number((decision.recommendation.confidence - (actualOutcome.executionStatus === 'SUCCESS' ? 1.0 : 0.5)).toFixed(2)),
      decisionVariance: executionVariance === 'ON_TRACK' ? 'CONFORMANT' : 'VARIANCE_DETECTED',
      expectedCost,
      actualCost,
      costVariance,
      expectedServiceImpact: recommended.expectedServiceImpact,
      actualServiceImpact: actualOutcome.actualServiceImpact || `${actualServiceDays} days protected`,
      serviceVariance,
      expectedDelayDays,
      actualDelayDays,
      delayVariance,
      executionVariance,
      calculatedAt: nowIso,
    };

    this.variances.set(`${tenantId}:${varianceId}`, variance);

    // Persist append-only outcome to Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'decision_outcomes', `${tenantId}_${varianceId}`), variance);
      }
    } catch (err) {}

    return variance;
  }

  public getVariance(tenantId: string, decisionId: string): OutcomeVariance | undefined {
    return Array.from(this.variances.values()).find(
      v => v.tenantId === tenantId && v.decisionId === decisionId
    );
  }

  public getVariances(tenantId: string): OutcomeVariance[] {
    const results: OutcomeVariance[] = [];
    for (const [key, v] of this.variances.entries()) {
      if (v.tenantId === tenantId) {
        results.push(v);
      }
    }
    return results;
  }

  public getOutcomes(tenantId: string): OutcomeVariance[] {
    return this.getVariances(tenantId);
  }

  public reset(): void {
    this.variances.clear();
  }
}

export const outcomeIntelligence = OutcomeIntelligence.getInstance();
