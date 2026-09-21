/**
 * ORION-9 WAVE 6 — DECISION EVALUATION ENGINE
 *
 * Evaluates candidate decision options across 10 distinct, un-collapsed dimensions:
 * 1. Cost
 * 2. Service Level (Days protected)
 * 3. Customer Impact Score (0 - 100)
 * 4. Inventory Impact Units
 * 5. Supplier Impact Score (0 - 100)
 * 6. Operational Risk Score (0 - 100)
 * 7. Financial Exposure Delta
 * 8. Lead Time Delta Days
 * 9. Policy Compliance (COMPLIANT | WARNING | VIOLATION)
 * 10. Execution Complexity (LOW | MEDIUM | HIGH)
 *
 * Produces inspectable trade-off matrices and explainable composite rankings.
 */

import { DecisionOption, DecisionEvaluation, ExceptionIntelligence } from './types';

export class DecisionEvaluationEngine {
  private static instance: DecisionEvaluationEngine;

  private constructor() {}

  public static getInstance(): DecisionEvaluationEngine {
    if (!DecisionEvaluationEngine.instance) {
      DecisionEvaluationEngine.instance = new DecisionEvaluationEngine();
    }
    return DecisionEvaluationEngine.instance;
  }

  /**
   * Evaluates an array of decision options against the 10 operational dimensions
   */
  public evaluateOptions(options: DecisionOption[], exception: ExceptionIntelligence): DecisionEvaluation[] {
    const baseExposure = exception.financialImpact || 30000;

    return options.map(option => {
      const evaluationId = `eval-${option.decisionId}-${option.optionId}`;
      let cost = option.expectedCost;
      let serviceDays = 0;
      let customerImpact = 50; // 100 is best, 0 is worst
      let invImpact = 0;
      let supplierImpact = 80;
      let operationalRisk = 30; // 0 is lowest risk, 100 is highest
      let financialExposureDelta = 0;
      let leadTimeDelta = 0;
      let policyCompliance: 'COMPLIANT' | 'WARNING' | 'VIOLATION' = 'COMPLIANT';
      let executionComplexity: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
      let tradeOffExplanation = '';

      switch (option.actionType) {
        case 'DO_NOTHING':
          cost = 0;
          serviceDays = 0;
          customerImpact = 10; // Severe negative impact
          invImpact = 0;
          supplierImpact = 90; // No impact on supplier
          operationalRisk = 85; // High operational exposure
          financialExposureDelta = 0; // Full exposure remains
          leadTimeDelta = 0;
          policyCompliance = 'WARNING';
          executionComplexity = 'LOW';
          tradeOffExplanation = 'Zero immediate financial cost, but absorbs full customer SLA penalty and severe stockout risk.';
          break;

        case 'REROUTE_SHIPMENT':
          cost = option.expectedCost || 14500;
          serviceDays = 4.0;
          customerImpact = 95; // Fully protected
          invImpact = 200;
          supplierImpact = 85;
          operationalRisk = 20;
          financialExposureDelta = -(baseExposure * 0.85); // Mitigates 85% of exposure
          leadTimeDelta = -4.0; // 4 days faster
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'MEDIUM';
          tradeOffExplanation = `Incurs freight premium of ₹${cost.toLocaleString()} to recover 4 days of transit and protect ₹${Math.round(baseExposure * 0.85).toLocaleString()} revenue.`;
          break;

        case 'EXPEDITE_SHIPMENT':
          cost = option.expectedCost || 4500;
          serviceDays = 1.5;
          customerImpact = 80;
          invImpact = 150;
          supplierImpact = 80;
          operationalRisk = 35;
          financialExposureDelta = -(baseExposure * 0.50);
          leadTimeDelta = -1.5;
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'LOW';
          tradeOffExplanation = `Low-cost expedite (+₹${cost.toLocaleString()}) protects 1.5 days at destination port terminal.`;
          break;

        case 'TRANSFER_INVENTORY':
          cost = option.expectedCost || 3200;
          serviceDays = 3.0;
          customerImpact = 90;
          invImpact = option.parameters?.unitsToTransfer || 150;
          supplierImpact = 95;
          operationalRisk = 15;
          financialExposureDelta = -(baseExposure * 0.75);
          leadTimeDelta = -3.0;
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'LOW';
          tradeOffExplanation = `Internal stock transfer of ${invImpact} units recovers inventory buffer within 36h at minimal cost (₹${cost.toLocaleString()}).`;
          break;

        case 'SPLIT_SHIPMENT':
          cost = option.expectedCost || 5800;
          serviceDays = 2.5;
          customerImpact = 85;
          invImpact = 75;
          supplierImpact = 75;
          operationalRisk = 25;
          financialExposureDelta = -(baseExposure * 0.65);
          leadTimeDelta = -2.5;
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'MEDIUM';
          tradeOffExplanation = `Balanced approach: 30% expedited emergency quota bridges the line stoppage gap at 40% of full charter cost.`;
          break;

        case 'EXPEDITE_PO':
          cost = option.expectedCost || 6000;
          serviceDays = 5.0;
          customerImpact = 88;
          invImpact = 200;
          supplierImpact = 70;
          operationalRisk = 30;
          financialExposureDelta = -(baseExposure * 0.70);
          leadTimeDelta = -5.0;
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'MEDIUM';
          tradeOffExplanation = `Supplier shift overtime compresses manufacturing lead time by 5 days before cargo dispatch.`;
          break;

        case 'TRIGGER_SUPPLIER_OUTREACH':
          cost = 0;
          serviceDays = 2.0;
          customerImpact = 70;
          invImpact = 0;
          supplierImpact = 55; // Puts pressure on supplier
          operationalRisk = 40;
          financialExposureDelta = -(baseExposure * 0.30);
          leadTimeDelta = -2.0;
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'LOW';
          tradeOffExplanation = `Executive escalation and contract SLA notice applied without out-of-pocket spend.`;
          break;

        default:
          cost = option.expectedCost || 1000;
          serviceDays = 1.0;
          customerImpact = 60;
          invImpact = 50;
          supplierImpact = 75;
          operationalRisk = 40;
          financialExposureDelta = -5000;
          leadTimeDelta = -1.0;
          policyCompliance = 'COMPLIANT';
          executionComplexity = 'LOW';
          tradeOffExplanation = 'Standard operational intervention.';
          break;
      }

      // Compute multi-criteria composite score (0 - 100)
      // Weights: Customer Impact (30%), Net Exposure Reduction (25%), Service Level (20%), Operational Risk (15%), Cost Penalty (10%)
      const netBenefitScore = Math.min(100, Math.max(0, Math.round(
        (customerImpact * 0.30) +
        (Math.min(100, Math.abs(financialExposureDelta) / (baseExposure || 1) * 100) * 0.25) +
        (Math.min(100, serviceDays * 20) * 0.20) +
        ((100 - operationalRisk) * 0.15) -
        (Math.min(20, (cost / (baseExposure || 1)) * 20) * 0.10)
      )));

      return {
        evaluationId,
        decisionId: option.decisionId,
        optionId: option.optionId,
        cost,
        serviceLevelDaysProtected: serviceDays,
        customerImpactScore: customerImpact,
        inventoryImpactUnits: invImpact,
        supplierImpactScore: supplierImpact,
        operationalRiskScore: operationalRisk,
        financialExposureDelta,
        leadTimeDeltaDays: leadTimeDelta,
        policyCompliance,
        executionComplexity,
        compositeScore: netBenefitScore,
        tradeOffExplanation,
      };
    });
  }
}

export const decisionEvaluationEngine = DecisionEvaluationEngine.getInstance();
