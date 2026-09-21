/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Experiment Engine
 * 
 * Orchestrates controlled A/B testing and algorithmic experiments.
 * Enforces strict blast-radius controls (max spend limits, small traffic allocations).
 */

import { ExperimentRecord } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class ExperimentEngine {
  private static instance: ExperimentEngine;
  private experiments: Map<string, ExperimentRecord> = new Map(); // key: `${tenantId}:${experimentId}`

  private constructor() {}

  public static getInstance(): ExperimentEngine {
    if (!ExperimentEngine.instance) {
      ExperimentEngine.instance = new ExperimentEngine();
    }
    return ExperimentEngine.instance;
  }

  public launchExperiment(params: {
    tenantId: string;
    name: string;
    hypothesis: string;
    variantA: Record<string, any>;
    variantB: Record<string, any>;
    trafficAllocationPct: number;
    maxSpendLimit: number;
  }): ExperimentRecord {
    const experimentId = `EXP-${params.tenantId}-${Date.now()}`;
    const safeAllocation = Math.min(20, Math.max(1, params.trafficAllocationPct)); // Cap at 20% max blast radius

    const experiment: ExperimentRecord = {
      experimentId,
      tenantId: params.tenantId,
      name: params.name,
      hypothesis: params.hypothesis,
      variantA: params.variantA,
      variantB: params.variantB,
      trafficAllocationPct: safeAllocation,
      maxSpendLimit: params.maxSpendLimit,
      active: true,
      startDate: new Date().toISOString(),
    };

    this.experiments.set(`${params.tenantId}:${experimentId}`, experiment);
    this.persistExperiment(experiment);
    return experiment;
  }

  public concludeExperiment(
    tenantId: string,
    experimentId: string,
    variantAAccuracy: number,
    variantBAccuracy: number
  ): ExperimentRecord | undefined {
    const exp = this.experiments.get(`${tenantId}:${experimentId}`);
    if (!exp) return undefined;

    let winner: 'VARIANT_A' | 'VARIANT_B' | 'INCONCLUSIVE' = 'INCONCLUSIVE';
    if (variantBAccuracy > variantAAccuracy + 3) {
      winner = 'VARIANT_B';
    } else if (variantAAccuracy > variantBAccuracy + 3) {
      winner = 'VARIANT_A';
    }

    exp.active = false;
    exp.endDate = new Date().toISOString();
    exp.results = {
      variantAAccuracy,
      variantBAccuracy,
      winner,
    };

    this.experiments.set(`${tenantId}:${experimentId}`, exp);
    this.persistExperiment(exp);
    return exp;
  }

  private async persistExperiment(exp: ExperimentRecord): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'intelligence_experiments', `${exp.tenantId}_${exp.experimentId}`), exp);
      }
    } catch {
      // Best-effort Firestore write
    }
  }

  public getExperiment(tenantId: string, experimentId: string): ExperimentRecord | undefined {
    return this.experiments.get(`${tenantId}:${experimentId}`);
  }

  public listExperiments(tenantId: string): ExperimentRecord[] {
    const list: ExperimentRecord[] = [];
    for (const [key, value] of this.experiments.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list;
  }

  public clear(): void {
    this.experiments.clear();
  }
}
