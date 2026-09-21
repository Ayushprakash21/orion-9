/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Outcome Expectation Service
 * 
 * Captures explicit baseline expected operational and financial targets at decision/workflow dispatch.
 * Generates an immutable hash to prevent tampering.
 */

import { OutcomeExpectation } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class OutcomeExpectationService {
  private static instance: OutcomeExpectationService;
  private expectations: Map<string, OutcomeExpectation> = new Map(); // key: `${tenantId}:${expectationId}`

  private constructor() {}

  public static getInstance(): OutcomeExpectationService {
    if (!OutcomeExpectationService.instance) {
      OutcomeExpectationService.instance = new OutcomeExpectationService();
    }
    return OutcomeExpectationService.instance;
  }

  /**
   * Deterministic simple hash generator for expectation integrity
   */
  private computeIntegrityHash(payload: Record<string, any>): string {
    const raw = JSON.stringify(payload);
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      const char = raw.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return `hash_exp_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Register a new outcome expectation
   */
  public async registerExpectation(params: {
    tenantId: string;
    decisionId?: string;
    workflowInstanceId?: string;
    scenarioId?: string;
    actionId?: string;
    expectedCostSavings: number;
    expectedOTIF: number;
    expectedTransitTimeDays: number;
    expectedInventoryDays: number;
    expectedCO2ReductionKg?: number;
    confidenceInterval?: { p10: number; p50: number; p90: number };
    timeHorizonHours?: number;
  }): Promise<OutcomeExpectation> {
    const expectationId = `EXP-${params.tenantId}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const createdAt = new Date().toISOString();

    const ci = params.confidenceInterval || {
      p10: params.expectedOTIF - 5,
      p50: params.expectedOTIF,
      p90: params.expectedOTIF + 5,
    };

    const hash = this.computeIntegrityHash({
      expectationId,
      tenantId: params.tenantId,
      expectedCostSavings: params.expectedCostSavings,
      expectedOTIF: params.expectedOTIF,
      createdAt,
    });

    const expectation: OutcomeExpectation = {
      expectationId,
      tenantId: params.tenantId,
      decisionId: params.decisionId,
      workflowInstanceId: params.workflowInstanceId,
      scenarioId: params.scenarioId,
      actionId: params.actionId,
      expectedCostSavings: params.expectedCostSavings,
      expectedOTIF: params.expectedOTIF,
      expectedTransitTimeDays: params.expectedTransitTimeDays,
      expectedInventoryDays: params.expectedInventoryDays,
      expectedCO2ReductionKg: params.expectedCO2ReductionKg || 0,
      confidenceInterval: ci,
      timeHorizonHours: params.timeHorizonHours || 48,
      createdAt,
      immutableHash: hash,
    };

    this.expectations.set(`${params.tenantId}:${expectationId}`, expectation);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'outcomes', `${params.tenantId}_${expectationId}`), expectation);
      }
    } catch {
      // Best-effort Firestore write with local fallback
    }

    return expectation;
  }

  public getExpectation(tenantId: string, expectationId: string): OutcomeExpectation | undefined {
    return this.expectations.get(`${tenantId}:${expectationId}`);
  }

  public listExpectations(tenantId: string): OutcomeExpectation[] {
    const list: OutcomeExpectation[] = [];
    for (const [key, value] of this.expectations.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public clear(): void {
    this.expectations.clear();
  }
}
