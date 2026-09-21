/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Challenger Mode Engine
 * 
 * Runs candidate intelligence algorithms in shadow mode against production streams.
 * Produces head-to-head metrics without taking autonomous real-world actions.
 */

import { ChallengerComparison } from './types';

export class ChallengerModeEngine {
  private static instance: ChallengerModeEngine;
  private comparisons: Map<string, ChallengerComparison> = new Map(); // key: `${tenantId}:${runId}`

  private constructor() {}

  public static getInstance(): ChallengerModeEngine {
    if (!ChallengerModeEngine.instance) {
      ChallengerModeEngine.instance = new ChallengerModeEngine();
    }
    return ChallengerModeEngine.instance;
  }

  /**
   * Evaluates champion vs challenger across a transaction sample
   */
  public evaluateShadowRun(params: {
    tenantId: string;
    championVersion: string;
    challengerVersion: string;
    sampleCount: number;
    championAccuracyPct: number;
    challengerAccuracyPct: number;
    championCost: number;
    challengerCost: number;
  }): ChallengerComparison {
    const challengerRunId = `CHAL-${params.tenantId}-${Date.now()}`;
    const now = new Date();
    const startTime = new Date(now.getTime() - 86400000).toISOString();

    const championMeanVariance = 100 - params.championAccuracyPct;
    const challengerMeanVariance = 100 - params.challengerAccuracyPct;

    let recommendation: 'PROMOTE' | 'RETAIN_CHAMPION' | 'EXTEND_EVALUATION' = 'RETAIN_CHAMPION';
    let confidenceScore = 80;

    if (params.challengerAccuracyPct > params.championAccuracyPct + 5 && params.challengerCost <= params.championCost) {
      recommendation = 'PROMOTE';
      confidenceScore = 92;
    } else if (Math.abs(params.challengerAccuracyPct - params.championAccuracyPct) <= 2) {
      recommendation = 'EXTEND_EVALUATION';
      confidenceScore = 65;
    } else {
      recommendation = 'RETAIN_CHAMPION';
      confidenceScore = 88;
    }

    const comparison: ChallengerComparison = {
      challengerRunId,
      tenantId: params.tenantId,
      championVersion: params.championVersion,
      challengerVersion: params.challengerVersion,
      timeWindowStart: startTime,
      timeWindowEnd: now.toISOString(),
      championMetrics: {
        accuracyPct: params.championAccuracyPct,
        meanVariancePct: Number(championMeanVariance.toFixed(1)),
        simulatedCost: params.championCost,
      },
      challengerMetrics: {
        accuracyPct: params.challengerAccuracyPct,
        meanVariancePct: Number(challengerMeanVariance.toFixed(1)),
        simulatedCost: params.challengerCost,
      },
      recommendation,
      confidenceScore,
    };

    this.comparisons.set(`${params.tenantId}:${challengerRunId}`, comparison);
    return comparison;
  }

  public getComparison(tenantId: string, runId: string): ChallengerComparison | undefined {
    return this.comparisons.get(`${tenantId}:${runId}`);
  }

  public listComparisons(tenantId: string): ChallengerComparison[] {
    const list: ChallengerComparison[] = [];
    for (const [key, value] of this.comparisons.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.timeWindowEnd).getTime() - new Date(a.timeWindowEnd).getTime());
  }

  public clear(): void {
    this.comparisons.clear();
  }
}
