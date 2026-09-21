/**
 * ORION-9 WAVE 6 — PRIORITY ENGINE
 *
 * Explainable priority scoring engine for supply chain exceptions, decisions, and signals.
 * Evaluates 8 discrete operational factors:
 * 1. Business Impact
 * 2. Urgency
 * 3. Financial Exposure
 * 4. Customer Impact
 * 5. Supply Risk
 * 6. Confidence
 * 7. Time to Breach (Days)
 * 8. Dependency Count
 *
 * Produces deterministic priority tiers:
 * - P1: Critical (Score >= 80) — Immediate response required (< 4h)
 * - P2: High (Score 60 - 79) — Intervene within 24h
 * - P3: Medium (Score 40 - 59) — Standard planning review (48-72h)
 * - P4: Low (Score < 40) — Monitor
 */

import { PriorityAssessment, ExceptionIntelligence } from './types';

export class PriorityEngine {
  private static instance: PriorityEngine;

  private constructor() {}

  public static getInstance(): PriorityEngine {
    if (!PriorityEngine.instance) {
      PriorityEngine.instance = new PriorityEngine();
    }
    return PriorityEngine.instance;
  }

  /**
   * Assesses and ranks priority for an exception or operational entity
   */
  public assessPriority(
    exceptionOrParams: any,
    dependencyCount = 1
  ): PriorityAssessment {
    const tenantId = exceptionOrParams.tenantId || 'org-global';
    const exceptionId = exceptionOrParams.exceptionId || exceptionOrParams.entityId || 'ENTITY-01';
    const severity = exceptionOrParams.severity || 'MEDIUM';
    const rawFinancial = exceptionOrParams.financialImpact ?? exceptionOrParams.revenueAtRisk ?? 15000;
    const dueAt = exceptionOrParams.dueAt;
    const confidence = exceptionOrParams.confidence ?? 0.9;
    const isCritical = severity === 'CRITICAL' || exceptionOrParams.productionHaltRisk;

    // 1. Financial Exposure Score (0 - 100)
    let financialScore = 20;
    if (rawFinancial > 50000) financialScore = 100;
    else if (rawFinancial > 25000) financialScore = 80;
    else if (rawFinancial > 10000) financialScore = 60;
    else if (rawFinancial > 3000) financialScore = 40;

    // 2. Urgency & Time to Breach
    let timeToBreachDays = 3.0;
    let urgencyScore = 40;
    if (exceptionOrParams.slaMinutesRemaining !== undefined) {
      const mins = exceptionOrParams.slaMinutesRemaining;
      timeToBreachDays = Number((mins / (60 * 24)).toFixed(1));
      if (mins <= 60) urgencyScore = 100;
      else if (mins <= 240) urgencyScore = 85;
      else if (mins <= 1440) urgencyScore = 65;
      else urgencyScore = 30;
    } else if (dueAt) {
      const msLeft = new Date(dueAt).getTime() - Date.now();
      timeToBreachDays = Math.max(0, Number((msLeft / (1000 * 60 * 60 * 24)).toFixed(1)));
      if (timeToBreachDays <= 0.2) urgencyScore = 100; // < 5 hours
      else if (timeToBreachDays <= 1.0) urgencyScore = 85;
      else if (timeToBreachDays <= 2.0) urgencyScore = 65;
      else if (timeToBreachDays <= 5.0) urgencyScore = 45;
      else urgencyScore = 20;
    }

    // 3. Business & Customer Impact
    const businessImpactScore = isCritical ? 95 : (severity === 'HIGH' ? 75 : (severity === 'MEDIUM' ? 50 : 25));
    const customerImpactScore = exceptionOrParams.customerTier === 'STRATEGIC' || isCritical ? 90 : (severity === 'HIGH' ? 70 : 40);

    // 4. Supply Risk & Dependency Depth
    const supplyRiskScore = exceptionOrParams.singleSourceSupplier || exceptionOrParams.category === 'SUPPLIER' || exceptionOrParams.category === 'INVENTORY' ? 85 : 45;
    const confidenceScore = Math.round(confidence * 100);

    // Composite Priority Score (0 - 100)
    // Formula: Urgency (25%) + Financial (25%) + Business Impact (20%) + Customer Impact (15%) + Supply Risk (15%)
    const compositeScore = Math.min(100, Math.max(0, Math.round(
      (urgencyScore * 0.25) +
      (financialScore * 0.25) +
      (businessImpactScore * 0.20) +
      (customerImpactScore * 0.15) +
      (supplyRiskScore * 0.15)
    )));

    let priorityTier: 'P1' | 'P2' | 'P3' | 'P4' = 'P3';
    if (compositeScore >= 80) priorityTier = 'P1';
    else if (compositeScore >= 60) priorityTier = 'P2';
    else if (compositeScore >= 40) priorityTier = 'P3';
    else priorityTier = 'P4';

    const formattedFin = Number(rawFinancial || 0).toLocaleString();
    const explanation = `Ranked ${priorityTier} (Score ${compositeScore}/100) based on financial exposure of ₹${formattedFin} (${financialScore}/100), SLA breach window of ${timeToBreachDays} days (Urgency: ${urgencyScore}/100), and ${severity} severity rating.`;

    return {
      entityType: 'EXCEPTION',
      entityId: exceptionId,
      tenantId,
      priorityScore: compositeScore,
      compositeScore,
      priorityTier,
      tier: priorityTier,
      factors: {
        businessImpact: businessImpactScore,
        urgency: urgencyScore,
        financialExposure: financialScore,
        customerImpact: customerImpactScore,
        supplyRisk: supplyRiskScore,
        confidence: confidenceScore,
        timeToBreachDays,
        dependencyCount,
      },
      breakdown: {
        revenueFactor: financialScore,
        productionFactor: businessImpactScore,
        urgencyFactor: urgencyScore,
      },
      explanation,
      assessedAt: new Date().toISOString(),
    };
  }
}

export const priorityEngine = PriorityEngine.getInstance();
