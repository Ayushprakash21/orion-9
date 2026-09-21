/**
 * ORION-9 WAVE 5 — DECISION RECORD ENGINE & AI ACTION AUDIT
 *
 * Persists structured decision rationale and operational audit records
 * for all material AI recommendations and commands.
 */

import { AIDecisionRecord, AIActionAudit } from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class DecisionRecordEngine {
  private static instance: DecisionRecordEngine;
  private decisions: Map<string, AIDecisionRecord> = new Map();
  private audits: AIActionAudit[] = [];

  private constructor() {}

  public static getInstance(): DecisionRecordEngine {
    if (!DecisionRecordEngine.instance) {
      DecisionRecordEngine.instance = new DecisionRecordEngine();
    }
    return DecisionRecordEngine.instance;
  }

  /**
   * Record a material AI decision
   */
  public async recordDecision(
    record: Omit<AIDecisionRecord, 'decisionId' | 'createdAt'>
  ): Promise<AIDecisionRecord> {
    const decisionId = `dec-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullRecord: AIDecisionRecord = {
      ...record,
      decisionId,
      createdAt: new Date().toISOString(),
    };

    this.decisions.set(`${record.tenantId}:${decisionId}`, fullRecord);

    // Save to Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'ai_decisions', `${record.tenantId}_${decisionId}`), fullRecord);
      }
    } catch (e) {}

    // Emit into core Kernel Audit Engine
    await kernelAuditEngine.record({
      tenantId: record.tenantId,
      actor: {
        id: record.agentId,
        type: 'AI_AGENT',
        name: 'AI Agent Runtime',
        role: 'ai_agent',
      },
      action: `AI_DECISION_${record.risk}`,
      entityType: 'AI_DECISION',
      entityId: decisionId,
      afterState: {
        recommendation: record.recommendation,
        reason: record.reason,
        policy: record.policy,
        approvalRequired: record.approvalRequired,
      },
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
    });

    return fullRecord;
  }

  /**
   * Record an AI Action Audit entry
   */
  public async recordActionAudit(audit: Omit<AIActionAudit, 'auditId' | 'timestamp'>): Promise<AIActionAudit> {
    const auditId = `ai-aud-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const fullAudit: AIActionAudit = {
      ...audit,
      auditId,
      timestamp: new Date().toISOString(),
    };

    this.audits.push(fullAudit);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'ai_actions', `${audit.tenantId}_${auditId}`), fullAudit);
      }
    } catch (e) {}

    return fullAudit;
  }

  /**
   * Query decisions by tenant
   */
  public getDecisions(tenantId: string): AIDecisionRecord[] {
    const results: AIDecisionRecord[] = [];
    for (const [key, dec] of this.decisions.entries()) {
      if (dec.tenantId === tenantId) {
        results.push(dec);
      }
    }
    return results;
  }

  public reset(): void {
    this.decisions.clear();
    this.audits = [];
  }
}

export const decisionRecordEngine = DecisionRecordEngine.getInstance();
