/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Decision Effectiveness Engine
 * 
 * Evaluates past executive and operational decisions against observed empirical reality.
 * Computes Decision Quality Score (0 - 100) and realized ROI.
 */

import { OutcomeExpectation, OutcomeObservation, OutcomeVariance, OutcomeRecord, DecisionEffectivenessClass } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class DecisionEffectivenessEngine {
  private static instance: DecisionEffectivenessEngine;
  private outcomeRecords: Map<string, OutcomeRecord> = new Map(); // key: `${tenantId}:${outcomeId}`

  private constructor() {}

  public static getInstance(): DecisionEffectivenessEngine {
    if (!DecisionEffectivenessEngine.instance) {
      DecisionEffectivenessEngine.instance = new DecisionEffectivenessEngine();
    }
    return DecisionEffectivenessEngine.instance;
  }

  public evaluateDecision(
    expectation: OutcomeExpectation,
    observation: OutcomeObservation,
    variance: OutcomeVariance,
    attributionId?: string
  ): OutcomeRecord {
    const outcomeId = `OUT-${expectation.tenantId}-${expectation.expectationId}`;

    // Compute quality score based on composite variance and OTIF preservation
    let decisionQualityScore = 100 - variance.compositeVariancePct;
    if (observation.actualOTIF < 80) {
      decisionQualityScore -= 15;
    }
    decisionQualityScore = Math.max(0, Math.min(100, Math.round(decisionQualityScore)));

    // Classify effectiveness
    let effectivenessClass: DecisionEffectivenessClass = 'SUCCESS';
    if (decisionQualityScore >= 85 && variance.severity !== 'CRITICAL') {
      effectivenessClass = 'SUCCESS';
    } else if (decisionQualityScore >= 65 && variance.severity !== 'CRITICAL') {
      effectivenessClass = 'PARTIAL_SUCCESS';
    } else if (variance.severity === 'CRITICAL' || observation.actualOTIF < 50) {
      effectivenessClass = 'NEGATIVE_OUTCOME';
    } else if (Math.abs(variance.otifDelta) < 1 && Math.abs(variance.costDelta) < 100) {
      effectivenessClass = 'NO_EFFECT';
    } else {
      effectivenessClass = 'INCONCLUSIVE';
    }

    // Calculate Realized ROI: (expectedSavings - actualCost) / max(1, actualCost)
    const netGain = expectation.expectedCostSavings - (observation.actualCost > 0 ? observation.actualCost : 0);
    const denominator = Math.max(100, Math.abs(observation.actualCost));
    const roiRealized = Number(((netGain / denominator) * 100).toFixed(1));

    const record: OutcomeRecord = {
      outcomeId,
      tenantId: expectation.tenantId,
      expectationId: expectation.expectationId,
      observationId: observation.observationId,
      varianceId: variance.varianceId,
      attributionId,
      status: 'EVALUATED',
      decisionQualityScore,
      effectivenessClass,
      roiRealized,
      verifiedAt: new Date().toISOString(),
      isImmutable: true,
    };

    this.outcomeRecords.set(`${expectation.tenantId}:${outcomeId}`, record);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        setDoc(doc(db, 'outcomes', `${expectation.tenantId}_${outcomeId}`), record);
      }
    } catch {
      // Best-effort Firestore write
    }

    return record;
  }

  public getOutcomeRecord(tenantId: string, outcomeId: string): OutcomeRecord | undefined {
    return this.outcomeRecords.get(`${tenantId}:${outcomeId}`);
  }

  public listOutcomeRecords(tenantId: string): OutcomeRecord[] {
    const list: OutcomeRecord[] = [];
    for (const [key, value] of this.outcomeRecords.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list;
  }

  public clear(): void {
    this.outcomeRecords.clear();
  }
}
