/**
 * ORION-9 WAVE 6 — RECOMMENDATION ENGINE
 *
 * Formulates governed operational recommendations from evaluated decision options.
 *
 * Absolute Governance Rules:
 * - Recommendation NEVER directly mutates business state or executes transactions.
 * - Recommendations must route through Kernel CommandBus via human approval gating.
 * - Multi-tenant Firestore persistence in 'recommendations' and 'decisions' collections.
 */

import {
  Recommendation,
  DecisionIntelligence,
  DecisionOption,
  DecisionEvaluation,
  ExceptionIntelligence,
  RootCause,
  Prediction,
} from './types';
import { decisionOptionEngine } from './DecisionOptionEngine';
import { decisionEvaluationEngine } from './DecisionEvaluationEngine';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export interface FormulateRecommendationParams {
  tenantId: string;
  exception: ExceptionIntelligence;
  rootCause?: RootCause;
  prediction?: Prediction;
  caller?: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM';
    name: string;
  };
  businessContext?: Record<string, any>;
}

export class RecommendationEngine {
  private static instance: RecommendationEngine;
  private decisions: Map<string, DecisionIntelligence> = new Map();
  private recommendations: Map<string, Recommendation> = new Map();

  private constructor() {}

  public static getInstance(): RecommendationEngine {
    if (!RecommendationEngine.instance) {
      RecommendationEngine.instance = new RecommendationEngine();
    }
    return RecommendationEngine.instance;
  }

  /**
   * Formulates a fully evaluated decision and recommendation for an exception
   */
  public async formulateRecommendation(params: FormulateRecommendationParams): Promise<{
    decision: DecisionIntelligence;
    recommendation: Recommendation;
  }> {
    const { tenantId, exception, rootCause, prediction, caller, businessContext } = params;
    const decisionId = `dec-${tenantId}-${exception.exceptionId}`;
    const recommendationId = `rec-${tenantId}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const nowIso = new Date().toISOString();

    // 1. Generate Candidate Options
    const options = decisionOptionEngine.generateOptions({
      decisionId,
      exception,
      rootCause,
      prediction,
      businessContext,
    });

    // 2. Multi-Dimensional Evaluation (10 dimensions)
    const evaluations = decisionEvaluationEngine.evaluateOptions(options, exception);

    // 3. Map evaluations back to update option scores
    for (const opt of options) {
      const ev = evaluations.find(e => e.optionId === opt.optionId);
      if (ev) {
        opt.score = ev.compositeScore;
      }
    }

    // Rank options by evaluated score
    options.sort((a, b) => b.score - a.score);
    const recommendedOption = options[0];
    const alternatives = options.slice(1);
    const bestEval = evaluations.find(e => e.optionId === recommendedOption.optionId);

    // 4. Formulate Recommendation
    const requiresApproval = recommendedOption.requiredApproval || recommendedOption.expectedCost > 10000;
    const recommendation: Recommendation = {
      recommendationId,
      decisionId,
      tenantId,
      recommendedOptionId: recommendedOption.optionId,
      recommendedOption,
      alternatives,
      rationale: bestEval?.tradeOffExplanation || recommendedOption.description,
      evidenceReferences: [
        ...recommendedOption.evidence,
        ...(rootCause?.evidenceReferences || []),
        ...(prediction?.evidence || []),
      ],
      confidence: recommendedOption.confidence,
      policyReferences: [
        'POL-SCM-DISRUPTION-RESPONSE-v2',
        'POL-PROCUREMENT-EXPEDITE-AUTHORITY-v1',
      ],
      riskAssessment: recommendedOption.expectedRisk,
      approvalRequirement: {
        required: requiresApproval,
        reason: requiresApproval
          ? `Action '${recommendedOption.actionType}' requires manager sign-off (Estimated spend: ₹${recommendedOption.expectedCost.toLocaleString()}).`
          : 'Pre-authorized under standard operational variance policy.',
        requiredRoles: requiresApproval ? ['supply_chain_manager', 'admin'] : undefined,
      },
      createdBy: caller,
      createdAt: nowIso,
      status: 'PROPOSED',
    };

    // 5. Construct Decision Intelligence Record
    const decision: DecisionIntelligence = {
      decisionId,
      tenantId,
      exceptionId: exception.exceptionId,
      correlationId: exception.correlationId,
      title: `Resolve ${exception.severity} ${exception.type} on ${exception.entityReferences[0]?.entityId || 'Item'}`,
      issue: exception.businessImpact,
      severity: exception.severity,
      status: requiresApproval ? 'PENDING_APPROVAL' : 'READY_FOR_REVIEW',
      options,
      evaluations,
      recommendedOptionId: recommendedOption.optionId,
      recommendation,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // Cache
    this.decisions.set(`${tenantId}:${decisionId}`, decision);
    this.recommendations.set(`${tenantId}:${recommendationId}`, recommendation);

    // Persist to Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'decisions', `${tenantId}_${decisionId}`), decision);
        await setDoc(doc(db, 'recommendations', `${tenantId}_${recommendationId}`), recommendation);
        for (const opt of options) {
          await setDoc(doc(db, 'decision_options', `${tenantId}_${opt.optionId}`), opt);
        }
      }
    } catch (err) {}

    return { decision, recommendation };
  }

  public getDecision(tenantId: string, decisionId: string): DecisionIntelligence | undefined {
    return this.decisions.get(`${tenantId}:${decisionId}`);
  }

  public getDecisions(tenantId: string): DecisionIntelligence[] {
    const results: DecisionIntelligence[] = [];
    for (const [key, dec] of this.decisions.entries()) {
      if (dec.tenantId === tenantId) {
        results.push(dec);
      }
    }
    return results;
  }

  public getRecommendations(tenantId: string): Recommendation[] {
    const results: Recommendation[] = [];
    for (const [key, rec] of this.recommendations.entries()) {
      if (rec.tenantId === tenantId) {
        results.push(rec);
      }
    }
    return results;
  }

  public reset(): void {
    this.decisions.clear();
    this.recommendations.clear();
  }
}

export const recommendationEngine = RecommendationEngine.getInstance();
