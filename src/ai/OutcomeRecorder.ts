/**
 * ORION-9 WAVE 5 — OUTCOME RECORDER
 *
 * Captures empirical outcomes and performance variances of AI decisions.
 * Strictly non-escalating: data serves as analytical evidence, never privilege escalation.
 */

import { AIOutcomeRecord } from './types';
import { DatabaseConnectionManager } from '../core/database/DatabaseConnectionManager';
import { doc, setDoc } from 'firebase/firestore';

export class OutcomeRecorder {
  private static instance: OutcomeRecorder;
  private outcomes: Map<string, AIOutcomeRecord> = new Map();

  private constructor() {}

  public static getInstance(): OutcomeRecorder {
    if (!OutcomeRecorder.instance) {
      OutcomeRecorder.instance = new OutcomeRecorder();
    }
    return OutcomeRecorder.instance;
  }

  /**
   * Record an empirical execution outcome
   */
  public async recordOutcome(
    outcome: Omit<AIOutcomeRecord, 'outcomeId' | 'timestamp'>
  ): Promise<AIOutcomeRecord> {
    const outcomeId = `out-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullOutcome: AIOutcomeRecord = {
      ...outcome,
      outcomeId,
      timestamp: new Date().toISOString(),
    };

    this.outcomes.set(`${outcome.tenantId}:${outcomeId}`, fullOutcome);

    const env = DatabaseConnectionManager.getInstance().getEnvironment();
    if (env === 'LIVE') {
      const db = DatabaseConnectionManager.getInstance().getFirestore('LIVE');
      if (!db) {
        throw new Error(`[OUTCOME-PERSISTENCE] LIVE environment active but Firestore instance unavailable for outcome ${outcomeId}`);
      }
      try {
        await setDoc(doc(db, 'ai_outcomes', `${outcome.tenantId}_${outcomeId}`), fullOutcome);
      } catch (err: any) {
        console.error(`[OUTCOME-PERSISTENCE] Firestore write failed for outcome ${outcomeId}:`, err);
        throw new Error(`[OUTCOME-PERSISTENCE] Authoritative write failed for outcome ${outcomeId}: ${err?.message || err}`);
      }
    } else {
      const db = DatabaseConnectionManager.getInstance().getFirestore('DEMO');
      if (db) {
        try {
          await setDoc(doc(db, 'ai_outcomes', `${outcome.tenantId}_${outcomeId}`), fullOutcome);
        } catch (e) {
          // Graceful fallback for non-Firebase local demo/test environments
        }
      }
    }

    return fullOutcome;
  }

  /**
   * Query outcomes by tenant
   */
  public getOutcomes(tenantId: string): AIOutcomeRecord[] {
    const results: AIOutcomeRecord[] = [];
    for (const [key, out] of this.outcomes.entries()) {
      if (out.tenantId === tenantId) {
        results.push(out);
      }
    }
    return results;
  }

  public reset(): void {
    this.outcomes.clear();
  }
}

export const outcomeRecorder = OutcomeRecorder.getInstance();
