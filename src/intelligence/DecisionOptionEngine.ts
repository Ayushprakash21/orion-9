/**
 * ORION-9 WAVE 6 — DECISION OPTION ENGINE
 *
 * Generates structured, data-driven operational decision options from:
 * Exception + Root Cause + Prediction + Business Constraints + Policies
 *
 * Supports canonical SCM decision actions:
 * - EXPEDITE_SHIPMENT
 * - REROUTE_SHIPMENT
 * - USE_ALTERNATE_INVENTORY
 * - RESCHEDULE_CUSTOMER_COMMITMENT
 * - SPLIT_SHIPMENT
 * - EXPEDITE_PO
 * - TRANSFER_INVENTORY
 * - TRIGGER_SUPPLIER_OUTREACH
 * - DO_NOTHING (baseline comparison)
 */

import {
  DecisionOption,
  DecisionActionType,
  ExceptionIntelligence,
  RootCause,
  Prediction,
} from './types';

export interface DecisionContext {
  decisionId: string;
  exception: ExceptionIntelligence;
  rootCause?: RootCause;
  prediction?: Prediction;
  businessContext?: {
    expediteCostPerDay?: number;
    airfreightCost?: number;
    transferCost?: number;
    revenueAtRisk?: number;
    customerPriority?: 'STRATEGIC' | 'STANDARD';
    alternateWarehouseStock?: number;
    alternateSupplierAvailable?: boolean;
  };
}

export class DecisionOptionEngine {
  private static instance: DecisionOptionEngine;

  private constructor() {}

  public static getInstance(): DecisionOptionEngine {
    if (!DecisionOptionEngine.instance) {
      DecisionOptionEngine.instance = new DecisionOptionEngine();
    }
    return DecisionOptionEngine.instance;
  }

  /**
   * Generates candidate decision options based on contextual supply chain evidence
   */
  public generateOptions(ctx: DecisionContext): DecisionOption[] {
    const { decisionId, exception, rootCause, prediction, businessContext } = ctx;
    const options: DecisionOption[] = [];

    const revenueAtRisk = businessContext?.revenueAtRisk || exception.financialImpact || 25000;
    const airfreightCost = businessContext?.airfreightCost || 14500;
    const transferCost = businessContext?.transferCost || 3200;

    // 1. DO_NOTHING (Baseline option)
    options.push({
      optionId: `opt-${decisionId}-do-nothing`,
      decisionId,
      actionType: 'DO_NOTHING',
      description: 'Accept current schedule and absorb downstream impacts without active intervention.',
      expectedCost: 0,
      expectedServiceImpact: 'Significant service delay; projected stockout or SLA breach.',
      expectedRisk: 'HIGH — Revenue loss and customer penalty exposure.',
      expectedBenefit: 'Zero incremental operational expenditure.',
      constraints: ['No immediate budget spend'],
      policyImpact: 'Violates standard on-time delivery customer SLA.',
      requiredApproval: false,
      confidence: 1.0,
      evidence: [
        `Base exposure: ₹${revenueAtRisk.toLocaleString()}.`,
        `Root cause: ${rootCause?.summary || exception.businessImpact}.`,
      ],
      score: 20,
    });

    // 2. EXPEDITE_SHIPMENT / REROUTE_SHIPMENT (Logistics / Delayed Shipment)
    if (exception.category === 'LOGISTICS' || exception.type.includes('Shipment') || (rootCause && rootCause.primaryCauseNodeId.startsWith('SHP-'))) {
      options.push({
        optionId: `opt-${decisionId}-reroute-air`,
        decisionId,
        actionType: 'REROUTE_SHIPMENT',
        description: 'Reroute critical consignment via dedicated air freight carrier to bypass transit bottleneck.',
        expectedCost: airfreightCost,
        expectedServiceImpact: 'Protects delivery schedule; reduces transit delay by 4 calendar days.',
        expectedRisk: 'LOW — High reliability of chartered cargo flights.',
        expectedBenefit: `Preserves ₹${revenueAtRisk.toLocaleString()} revenue and prevents manufacturing halt.`,
        constraints: ['Requires carrier booking confirmation within 4 hours'],
        policyImpact: 'COMPLIANT — Requires Manager Approval for logistics expedites > ₹10,000.',
        requiredApproval: true,
        confidence: 0.94,
        evidence: [
          `Airfreight transit takes 24 hours vs 5 days remaining ocean delay.`,
          `Net benefit: ₹${(revenueAtRisk - airfreightCost).toLocaleString()}.`,
        ],
        score: 85,
        parameters: { carrierMode: 'AIR_CARGO', transitTimeDays: 1, cost: airfreightCost },
      });

      options.push({
        optionId: `opt-${decisionId}-expedite-port`,
        decisionId,
        actionType: 'EXPEDITE_SHIPMENT',
        description: 'Authorize priority hot-hatch discharge and dedicated port drayage at destination terminal.',
        expectedCost: 4500,
        expectedServiceImpact: 'Accelerates container availability by 36 hours.',
        expectedRisk: 'MEDIUM — Subject to port terminal crane congestion.',
        expectedBenefit: 'Saves 1.5 days at moderate expenditure.',
        constraints: ['Port operator must confirm priority slot'],
        policyImpact: 'COMPLIANT — Within standard freight variance authorization threshold.',
        requiredApproval: false,
        confidence: 0.88,
        evidence: [
          `Estimated customs & gate release reduced from 48h to 12h.`,
        ],
        score: 72,
        parameters: { action: 'HOT_HATCH_EXPEDITE', cost: 4500 },
      });
    }

    // 3. TRANSFER_INVENTORY / USE_ALTERNATE_INVENTORY (Inventory Shortage)
    if (exception.category === 'INVENTORY' || exception.type.includes('Inventory') || exception.type.includes('Stock')) {
      const alternateStock = businessContext?.alternateWarehouseStock || 250;
      if (alternateStock > 0) {
        options.push({
          optionId: `opt-${decisionId}-transfer-inv`,
          decisionId,
          actionType: 'TRANSFER_INVENTORY',
          description: `Execute inter-facility stock transfer from regional hub (${alternateStock} units available).`,
          expectedCost: transferCost,
          expectedServiceImpact: 'Restores safety stock buffer within 48 hours.',
          expectedRisk: 'LOW — Internal logistics network under full operational control.',
          expectedBenefit: `Mitigates immediate stockout on ${exception.entityReferences[0]?.entityId || 'SKU'}.`,
          constraints: ['Source hub must maintain minimum local buffer'],
          policyImpact: 'COMPLIANT — Inter-warehouse transfers pre-authorized under inventory balancing policy.',
          requiredApproval: false,
          confidence: 0.95,
          evidence: [
            `Secondary hub holds surplus stock above 45 days of supply.`,
            `Transfer transit takes 36 hours.`,
          ],
          score: 88,
          parameters: { unitsToTransfer: Math.min(alternateStock, 150), cost: transferCost },
        });
      }

      options.push({
        optionId: `opt-${decisionId}-split-shipment`,
        decisionId,
        actionType: 'SPLIT_SHIPMENT',
        description: 'Split inbound batch: expedite 30% emergency quantity via air, transport remaining 70% by ground.',
        expectedCost: Math.round(airfreightCost * 0.4),
        expectedServiceImpact: 'Provides immediate bridge stock to maintain continuity until main shipment arrives.',
        expectedRisk: 'LOW — Balanced risk and cost profile.',
        expectedBenefit: 'Solves stockout at 60% lower cost than full airfreight.',
        constraints: ['Supplier must support partial pallet breakdown'],
        policyImpact: 'COMPLIANT — Requires Buyer supervisor sign-off.',
        requiredApproval: true,
        confidence: 0.91,
        evidence: [
          `Immediate requirement: 30% covers next 10 days of production.`,
        ],
        score: 82,
        parameters: { splitPercent: 30, cost: Math.round(airfreightCost * 0.4) },
      });
    }

    // 4. TRIGGER_SUPPLIER_OUTREACH & EXPEDITE_PO (Procurement / Supplier Delay)
    if (exception.category === 'PROCUREMENT' || exception.category === 'SUPPLIER' || exception.type.includes('PO') || exception.type.includes('Supplier')) {
      options.push({
        optionId: `opt-${decisionId}-supplier-escalation`,
        decisionId,
        actionType: 'TRIGGER_SUPPLIER_OUTREACH',
        description: 'Trigger Tier-1 executive supplier escalation and enforce contractual liquidated damages clause.',
        expectedCost: 0,
        expectedServiceImpact: 'Accelerates production line priority at supplier factory.',
        expectedRisk: 'MEDIUM — May strain commercial relationship if misaligned.',
        expectedBenefit: 'Contractual enforcement of priority dispatch without additional cost.',
        constraints: ['Supplier account must have active Master Services Agreement'],
        policyImpact: 'COMPLIANT — Requires Procurement Lead approval.',
        requiredApproval: true,
        confidence: 0.85,
        evidence: [
          `Supplier contract SLA clause 14.2 specifies 48-hour cure period for critical delays.`,
        ],
        score: 75,
        parameters: { escalationLevel: 'DIRECTOR', applyPenalties: true },
      });

      options.push({
        optionId: `opt-${decisionId}-expedite-po`,
        decisionId,
        actionType: 'EXPEDITE_PO',
        description: 'Authorize supplier overtime run with premium dispatch surcharge.',
        expectedCost: 6000,
        expectedServiceImpact: 'Pulls forward manufacturing dispatch date by 5 calendar days.',
        expectedRisk: 'LOW — Supplier confirmed overtime crew availability.',
        expectedBenefit: 'Recovers lost lead time before material reaches transit phase.',
        constraints: ['Supplier factory must have raw stock available'],
        policyImpact: 'COMPLIANT — Requires Financial Approver authorization.',
        requiredApproval: true,
        confidence: 0.90,
        evidence: [
          `Supplier confirmed shift availability to compress cycle time from 10 to 5 days.`,
        ],
        score: 80,
        parameters: { expediteDays: 5, surchargeCost: 6000 },
      });
    }

    // Sort descending by score
    options.sort((a, b) => b.score - a.score);

    return options;
  }
}

export const decisionOptionEngine = DecisionOptionEngine.getInstance();
