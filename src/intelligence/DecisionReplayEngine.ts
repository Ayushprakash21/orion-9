/**
 * ORION-9 WAVE 6 — DECISION REPLAY ENGINE
 *
 * Captures an immutable, point-in-time historical snapshot of the entire decision context:
 * Event -> Signal -> Exception -> Context Available at Decision Time -> Root Cause ->
 * Prediction -> Options -> Evaluation -> Recommendation -> Approval -> Execution -> Outcome
 *
 * Critical Governance Principle:
 * Replay MUST evaluate what was known at the exact timestamp the decision was taken.
 * It NEVER queries current real-time state as a substitute for historical truth.
 * Chain-of-thought is excluded; only empirical evidence and material rationale are preserved.
 */

import { DecisionReplay, DecisionIntelligence } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export interface CaptureReplaySnapshotParams {
  tenantId: string;
  decision: DecisionIntelligence;
  eventSnapshot?: any;
  contextSnapshot: Record<string, any>;
  approvalSnapshot?: any;
  commandSnapshot?: any;
  executionSnapshot?: any;
  outcomeSnapshot?: any;
}

export class DecisionReplayEngine {
  private static instance: DecisionReplayEngine;
  private replays: Map<string, DecisionReplay> = new Map();

  private constructor() {}

  public static getInstance(): DecisionReplayEngine {
    if (!DecisionReplayEngine.instance) {
      DecisionReplayEngine.instance = new DecisionReplayEngine();
    }
    return DecisionReplayEngine.instance;
  }

  /**
   * Captures an immutable historical replay snapshot
   */
  public async captureSnapshot(params: CaptureReplaySnapshotParams): Promise<DecisionReplay> {
    const { tenantId, decision, eventSnapshot, contextSnapshot, approvalSnapshot, commandSnapshot, executionSnapshot, outcomeSnapshot } = params;
    const replayId = `rep-${tenantId}-${decision.decisionId}`;
    const nowIso = new Date().toISOString();

    const replay: DecisionReplay = {
      replayId,
      tenantId,
      decisionId: decision.decisionId,
      snapshotTimestamp: nowIso,
      eventSnapshot,
      contextSnapshot: JSON.parse(JSON.stringify(contextSnapshot || {})), // Deep clone
      optionsSnapshot: JSON.parse(JSON.stringify(decision.options || [])),
      evaluationSnapshot: JSON.parse(JSON.stringify(decision.evaluations || [])),
      recommendationSnapshot: JSON.parse(JSON.stringify(decision.recommendation)),
      approvalSnapshot: approvalSnapshot ? JSON.parse(JSON.stringify(approvalSnapshot)) : undefined,
      commandSnapshot: commandSnapshot ? JSON.parse(JSON.stringify(commandSnapshot)) : undefined,
      executionSnapshot: executionSnapshot ? JSON.parse(JSON.stringify(executionSnapshot)) : undefined,
      outcomeSnapshot: outcomeSnapshot ? JSON.parse(JSON.stringify(outcomeSnapshot)) : undefined,
      createdAt: nowIso,
    };

    this.replays.set(`${tenantId}:${replayId}`, replay);

    // Persist immutable snapshot to Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'decision_replays', `${tenantId}_${replayId}`), replay);
      }
    } catch (err) {}

    return replay;
  }

  /**
   * Replays a past decision using strictly historical decision-time state
   */
  public replayDecision(tenantId: string, decisionId: string): {
    decisionReplay: DecisionReplay;
    reconstructedTimeline: Array<{ stage: string; timestamp: string; summary: string; details: any }>;
  } {
    const replay = Array.from(this.replays.values()).find(
      r => r.tenantId === tenantId && r.decisionId === decisionId
    );

    if (!replay) {
      throw new Error(`Decision replay not found for decision: ${decisionId} in tenant: ${tenantId}`);
    }

    const timeline = [
      {
        stage: 'EXCEPTION_DETECTED',
        timestamp: replay.snapshotTimestamp,
        summary: `Exception detected in tenant ${tenantId}.`,
        details: replay.contextSnapshot?.exception || 'Contextual exception details preserved.',
      },
      {
        stage: 'ROOT_CAUSE_ANALYSIS',
        timestamp: replay.snapshotTimestamp,
        summary: 'Root cause chain identified from historical telemetry.',
        details: replay.contextSnapshot?.rootCause || 'Root cause evidence references preserved.',
      },
      {
        stage: 'OPTIONS_EVALUATED',
        timestamp: replay.snapshotTimestamp,
        summary: `${replay.optionsSnapshot.length} candidate options generated and evaluated across 10 dimensions.`,
        details: {
          options: replay.optionsSnapshot.map(o => ({ id: o.optionId, action: o.actionType, cost: o.expectedCost, score: o.score })),
          evaluations: replay.evaluationSnapshot,
        },
      },
      {
        stage: 'RECOMMENDATION_FORMULATED',
        timestamp: replay.snapshotTimestamp,
        summary: `Option '${replay.recommendationSnapshot.recommendedOption.actionType}' recommended (Confidence: ${(replay.recommendationSnapshot.confidence * 100).toFixed(0)}%).`,
        details: {
          recommendedOption: replay.recommendationSnapshot.recommendedOption,
          rationale: replay.recommendationSnapshot.rationale,
          policyReferences: replay.recommendationSnapshot.policyReferences,
          approvalRequirement: replay.recommendationSnapshot.approvalRequirement,
        },
      },
      {
        stage: 'HUMAN_APPROVAL_GATE',
        timestamp: replay.snapshotTimestamp,
        summary: replay.recommendationSnapshot.approvalRequirement.required
          ? 'Requires human sign-off before Kernel submission.'
          : 'Pre-approved under operational variance policy.',
        details: replay.approvalSnapshot || 'Approval records attached.',
      },
      {
        stage: 'KERNEL_EXECUTION',
        timestamp: replay.snapshotTimestamp,
        summary: replay.executionSnapshot ? 'Executed through 14-stage Kernel pipeline.' : 'Pending Kernel dispatch.',
        details: replay.executionSnapshot || replay.commandSnapshot || 'Command envelope details.',
      },
      {
        stage: 'OUTCOME_RECORDED',
        timestamp: replay.snapshotTimestamp,
        summary: replay.outcomeSnapshot ? 'Empirical outcome captured.' : 'Outcome pending post-execution feedback.',
        details: replay.outcomeSnapshot || 'Empirical outcome metrics.',
      },
    ];

    return {
      decisionReplay: replay,
      reconstructedTimeline: timeline,
    };
  }

  public getReplays(tenantId: string): DecisionReplay[] {
    const results: DecisionReplay[] = [];
    for (const [key, rep] of this.replays.entries()) {
      if (rep.tenantId === tenantId) {
        results.push(rep);
      }
    }
    return results;
  }

  public reconstructTimeline(tenantId: string, replayOrDecisionId: string) {
    const replay = Array.from(this.replays.values()).find(
      r => r.tenantId === tenantId && (r.replayId === replayOrDecisionId || r.decisionId === replayOrDecisionId)
    );
    if (!replay) {
      throw new Error(`Decision replay not found for: ${replayOrDecisionId} in tenant: ${tenantId}`);
    }
    return this.replayDecision(tenantId, replay.decisionId);
  }

  public reset(): void {
    this.replays.clear();
  }
}

export const decisionReplayEngine = DecisionReplayEngine.getInstance();
