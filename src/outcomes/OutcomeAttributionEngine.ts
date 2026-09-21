/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Outcome Attribution Engine
 * 
 * Analyzes empirical variances to classify primary root causes and contributing factors.
 * Distinguishes between AI hypotheses, derived inferences, observed facts, and human confirmations.
 */

import { OutcomeVariance, OutcomeAttribution, AttributionCategory, EvidenceConfidence } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class OutcomeAttributionEngine {
  private static instance: OutcomeAttributionEngine;
  private attributions: Map<string, OutcomeAttribution> = new Map(); // key: `${tenantId}:${attributionId}`

  private constructor() {}

  public static getInstance(): OutcomeAttributionEngine {
    if (!OutcomeAttributionEngine.instance) {
      OutcomeAttributionEngine.instance = new OutcomeAttributionEngine();
    }
    return OutcomeAttributionEngine.instance;
  }

  /**
   * Automatically derives initial attribution from variance patterns
   */
  public attributeVariance(
    variance: OutcomeVariance,
    context?: {
      carrierDelayHours?: number;
      supplierReportedStockout?: boolean;
      portCongestionIndex?: number;
      demandSurgePct?: number;
      weatherDisruptionFlag?: boolean;
      notes?: string;
    }
  ): OutcomeAttribution {
    const attributionId = `ATTR-${variance.tenantId}-${variance.varianceId}`;

    let primaryCategory: AttributionCategory = 'MODEL_INACCURACY';
    let confidence: EvidenceConfidence = 'DERIVED_INFERENCE';
    const contributingFactors: Array<{ factor: string; impactPercentage: number; evidenceSource: string }> = [];

    if (context?.weatherDisruptionFlag) {
      primaryCategory = 'WEATHER_OR_FORCE_MAJEURE';
      confidence = 'OBSERVED_FACT';
      contributingFactors.push({
        factor: 'Severe meteorological event along transit corridor',
        impactPercentage: 70,
        evidenceSource: 'NOAA_TELEMETRY',
      });
    } else if (context?.supplierReportedStockout) {
      primaryCategory = 'SUPPLIER_EXECUTION_FAILURE';
      confidence = 'OBSERVED_FACT';
      contributingFactors.push({
        factor: 'Tier-1 supplier facility production shutdown / stockout',
        impactPercentage: 80,
        evidenceSource: 'EDI_855_PO_ACK',
      });
    } else if ((context?.demandSurgePct || 0) > 25) {
      primaryCategory = 'DEMAND_SPIKE';
      confidence = 'OBSERVED_FACT';
      contributingFactors.push({
        factor: `Unforecasted downstream consumption spike (+${context?.demandSurgePct}%)`,
        impactPercentage: 65,
        evidenceSource: 'POS_ERP_FEED',
      });
    } else if ((context?.carrierDelayHours || 0) > 48 || (context?.portCongestionIndex || 0) > 75) {
      primaryCategory = 'EXTERNAL_MARKET_SHOCK';
      confidence = 'OBSERVED_FACT';
      contributingFactors.push({
        factor: 'Port congestion dwell time spike and container detention',
        impactPercentage: 60,
        evidenceSource: 'AIS_VESSEL_TRACKING',
      });
    } else if (variance.severity === 'CRITICAL' || variance.severity === 'SIGNIFICANT') {
      primaryCategory = 'MODEL_INACCURACY';
      confidence = 'AI_HYPOTHESIS';
      contributingFactors.push({
        factor: 'Digital twin lead-time parameter variance exceeded calibration boundary',
        impactPercentage: 55,
        evidenceSource: 'PREDICTIVE_DRIFT_ANALYSIS',
      });
    } else {
      primaryCategory = 'INTERNAL_OPERATIONAL_DELAY';
      confidence = 'DERIVED_INFERENCE';
      contributingFactors.push({
        factor: 'Warehouse staging and cross-dock turnaround variance',
        impactPercentage: 40,
        evidenceSource: 'WMS_SCAN_TIMESTAMPS',
      });
    }

    const attribution: OutcomeAttribution = {
      attributionId,
      tenantId: variance.tenantId,
      varianceId: variance.varianceId,
      primaryCategory,
      confidence,
      contributingFactors,
      aiHypothesisText: context?.notes || `Variance of ${variance.compositeVariancePct}% attributed primarily to ${primaryCategory}.`,
      attributedAt: new Date().toISOString(),
    };

    this.attributions.set(`${variance.tenantId}:${attributionId}`, attribution);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        setDoc(doc(db, 'outcome_attributions', `${variance.tenantId}_${attributionId}`), attribution);
      }
    } catch {
      // Best-effort Firestore write
    }

    return attribution;
  }

  /**
   * Human operator or auditor confirms or adjusts root cause attribution
   */
  public confirmAttribution(
    tenantId: string,
    attributionId: string,
    confirmedBy: string,
    verifiedCategory?: AttributionCategory
  ): OutcomeAttribution | undefined {
    const existing = this.attributions.get(`${tenantId}:${attributionId}`);
    if (!existing) return undefined;

    const updated: OutcomeAttribution = {
      ...existing,
      confirmedByHuman: confirmedBy,
      confidence: 'CONFIRMED_ROOT_CAUSE',
      primaryCategory: verifiedCategory || existing.primaryCategory,
    };

    this.attributions.set(`${tenantId}:${attributionId}`, updated);
    return updated;
  }

  public getAttribution(tenantId: string, attributionId: string): OutcomeAttribution | undefined {
    return this.attributions.get(`${tenantId}:${attributionId}`);
  }

  public listAttributions(tenantId: string): OutcomeAttribution[] {
    const list: OutcomeAttribution[] = [];
    for (const [key, value] of this.attributions.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.attributedAt).getTime() - new Date(a.attributedAt).getTime());
  }

  public clear(): void {
    this.attributions.clear();
  }
}
