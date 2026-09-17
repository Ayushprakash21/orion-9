/**
 * ORION-9 INTELLIGENCE LAYER — DECISION RECORD & OUTCOME SERVICE
 * Layer 2: Tracks the decision-to-outcome feedback loop:
 * DECISION → ACTION → EXPECTED OUTCOME → ACTUAL OUTCOME → VARIANCE → ROOT CAUSE → LEARNING SIGNAL
 *
 * ARCHITECTURAL CONSTITUTION MANDATE:
 * "Learning must NOT silently modify production policy."
 */

import { DecisionRecord } from './types';
import { db, loadData, saveData } from '../data/db';
import { kernelEventBus } from '../kernel/EventBus';
import { kernelAuditEngine } from '../kernel/AuditEngine';

export class DecisionRecordService {
  private static instance: DecisionRecordService;
  private records: Map<string, DecisionRecord> = new Map();

  private constructor() {
    this.hydrate();
  }

  public static getInstance(): DecisionRecordService {
    if (!DecisionRecordService.instance) {
      DecisionRecordService.instance = new DecisionRecordService();
    }
    return DecisionRecordService.instance;
  }

  private async hydrate(): Promise<void> {
    try {
      if (typeof window !== 'undefined') {
        const stored = await loadData<DecisionRecord>(db.decisions as any);
        if (stored && Array.isArray(stored)) {
          stored.forEach(r => {
            if (r.decisionId) this.records.set(r.decisionId, r);
          });
        }
      }
    } catch (e) {
      console.warn('[DecisionRecordService] Hydration warning:', e);
    }
  }

  /**
   * Creates a formal decision record
   */
  public async createRecord(record: DecisionRecord): Promise<DecisionRecord> {
    this.records.set(record.decisionId, record);

    // Save to local storage
    if (typeof window !== 'undefined') {
      try {
        await saveData(db.decisions as any, Array.from(this.records.values()));
      } catch (err) {
        console.warn('[DecisionRecordService] Save warning:', err);
      }
    }

    // Publish event
    kernelEventBus.publish('DECISION_RECORD_CREATED', record, {
      entityId: record.decisionId,
      entityType: 'decision_record',
      correlationId: record.correlationId,
      tenant: { organizationId: record.context.tenantId },
    });

    return record;
  }

  /**
   * Records the actual outcome and calculates variance against expected results
   */
  public async recordActualOutcome(
    decisionId: string,
    actualDelta: number,
    explanation?: string
  ): Promise<DecisionRecord | null> {
    const record = this.records.get(decisionId);
    if (!record) return null;

    const projectedDelta = record.expectedResult.projectedDelta;
    const variancePercent = projectedDelta !== 0
      ? +(((actualDelta - projectedDelta) / Math.abs(projectedDelta)) * 100).toFixed(1)
      : 0;

    let evaluationStatus: 'SUCCESS' | 'SUB_OPTIMAL' | 'FAILURE' = 'SUCCESS';
    if (Math.abs(variancePercent) > 25) {
      evaluationStatus = actualDelta < projectedDelta ? 'FAILURE' : 'SUB_OPTIMAL';
    }

    const learningSignal = `Variance of ${variancePercent}% observed for KPI ${record.expectedResult.kpiTarget}. Historical evidence weighting adjusted for future recommendations.`;

    record.actualResult = {
      recordedAt: new Date().toISOString(),
      actualDelta,
      variancePercent,
    };

    record.outcomeEvaluation = {
      status: evaluationStatus,
      varianceExplanation: explanation || `Outcome variance evaluated at ${variancePercent}% vs projected target.`,
      learningSignal,
    };

    // Save updated record
    this.records.set(decisionId, record);
    if (typeof window !== 'undefined') {
      await saveData(db.decisions as any, Array.from(this.records.values()));
    }

    // Publish learning signal event (Does NOT silently modify production policy!)
    kernelEventBus.publish('OUTCOME_EVALUATED', {
      decisionId,
      kpiTarget: record.expectedResult.kpiTarget,
      projectedDelta,
      actualDelta,
      variancePercent,
      learningSignal,
      status: evaluationStatus,
    }, {
      entityId: decisionId,
      entityType: 'decision_record',
      correlationId: record.correlationId,
      tenant: { organizationId: record.context.tenantId },
    });

    await kernelAuditEngine.record({
      eventId: decisionId,
      correlationId: record.correlationId,
      actor: { id: 'learning-engine', type: 'SYSTEM', name: 'Orion Outcome Engine' },
      tenantId: record.context.tenantId,
      action: 'OUTCOME_EVALUATION',
      entityType: 'decision_record',
      entityId: decisionId,
      afterState: { evaluationStatus, variancePercent, learningSignal },
      result: 'SUCCESS',
      classification: 'INTERNAL',
    });

    return record;
  }

  public getRecords(): DecisionRecord[] {
    return Array.from(this.records.values());
  }

  public getRecordById(decisionId: string): DecisionRecord | undefined {
    return this.records.get(decisionId);
  }
}

export const decisionRecordService = DecisionRecordService.getInstance();
