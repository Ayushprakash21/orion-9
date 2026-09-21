/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Outcome Variance Engine
 * 
 * Computes exact variances between expected operational projections and realized empirical telemetry.
 * Safeguarded against division-by-zero.
 */

import { OutcomeExpectation, OutcomeObservation, OutcomeVariance, VarianceSeverity, DirectionalBias } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class OutcomeVarianceEngine {
  private static instance: OutcomeVarianceEngine;
  private variances: Map<string, OutcomeVariance> = new Map(); // key: `${tenantId}:${varianceId}`

  private constructor() {}

  public static getInstance(): OutcomeVarianceEngine {
    if (!OutcomeVarianceEngine.instance) {
      OutcomeVarianceEngine.instance = new OutcomeVarianceEngine();
    }
    return OutcomeVarianceEngine.instance;
  }

  public calculateVariance(
    expectation: OutcomeExpectation,
    observation: OutcomeObservation
  ): OutcomeVariance {
    const varianceId = `VAR-${expectation.tenantId}-${expectation.expectationId}-${observation.observationId}`;

    const costDelta = observation.actualCost - expectation.expectedCostSavings;
    const costVariancePct = expectation.expectedCostSavings !== 0
      ? Number(((costDelta / Math.abs(expectation.expectedCostSavings)) * 100).toFixed(2))
      : 0;

    const otifDelta = observation.actualOTIF - expectation.expectedOTIF;
    const otifVariancePct = expectation.expectedOTIF !== 0
      ? Number(((otifDelta / expectation.expectedOTIF) * 100).toFixed(2))
      : 0;

    const transitTimeDeltaDays = observation.actualTransitTimeDays - expectation.expectedTransitTimeDays;
    const inventoryDaysDelta = observation.actualInventoryDays - expectation.expectedInventoryDays;

    // Absolute composite percentage difference
    const compositeVariancePct = Number(
      ((Math.abs(costVariancePct) * 0.5) + (Math.abs(otifVariancePct) * 0.5)).toFixed(2)
    );

    // Directional bias determination
    let directionalBias: DirectionalBias = 'ACCURATE';
    if (otifDelta < -3 || costDelta > 500) {
      directionalBias = 'OVER_PROJECTED'; // Expectations were overly optimistic
    } else if (otifDelta > 3 || costDelta < -500) {
      directionalBias = 'UNDER_PROJECTED'; // Actual was better than expected
    }

    // Severity classification
    let severity: VarianceSeverity = 'NEGLIGIBLE';
    if (compositeVariancePct >= 30 || Math.abs(otifDelta) >= 20) {
      severity = 'CRITICAL';
    } else if (compositeVariancePct >= 15 || Math.abs(otifDelta) >= 10) {
      severity = 'SIGNIFICANT';
    } else if (compositeVariancePct >= 5 || Math.abs(otifDelta) >= 3) {
      severity = 'MODERATE';
    }

    const thresholdBreached = compositeVariancePct >= 15 || severity === 'CRITICAL' || severity === 'SIGNIFICANT';

    const variance: OutcomeVariance = {
      varianceId,
      tenantId: expectation.tenantId,
      expectationId: expectation.expectationId,
      observationId: observation.observationId,
      costDelta,
      costVariancePct,
      otifDelta,
      otifVariancePct,
      transitTimeDeltaDays,
      inventoryDaysDelta,
      compositeVariancePct,
      directionalBias,
      severity,
      thresholdBreached,
      calculatedAt: new Date().toISOString(),
    };

    this.variances.set(`${expectation.tenantId}:${varianceId}`, variance);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        setDoc(doc(db, 'outcome_variances', `${expectation.tenantId}_${varianceId}`), variance);
      }
    } catch {
      // Best-effort Firestore write
    }

    return variance;
  }

  public getVariance(tenantId: string, varianceId: string): OutcomeVariance | undefined {
    return this.variances.get(`${tenantId}:${varianceId}`);
  }

  public listVariances(tenantId: string): OutcomeVariance[] {
    const list: OutcomeVariance[] = [];
    for (const [key, value] of this.variances.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.calculatedAt).getTime() - new Date(a.calculatedAt).getTime());
  }

  public clear(): void {
    this.variances.clear();
  }
}
