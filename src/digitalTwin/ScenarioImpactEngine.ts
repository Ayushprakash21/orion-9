/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Scenario Impact Engine
 * 
 * Computes deterministic multi-vector operational and financial impact across 9 vectors:
 * 1. INVENTORY        2. SERVICE             3. SUPPLIER
 * 4. TRANSPORTATION   5. WAREHOUSE           6. WORKING_CAPITAL
 * 7. FINANCIAL_EXP    8. CUSTOMER            9. RISK
 */

import { ScenarioImpactVector, TwinEntity, ScenarioType, ScenarioParameters } from './types';

export class ScenarioImpactEngine {
  private static instance: ScenarioImpactEngine;

  public static getInstance(): ScenarioImpactEngine {
    if (!ScenarioImpactEngine.instance) {
      ScenarioImpactEngine.instance = new ScenarioImpactEngine();
    }
    return ScenarioImpactEngine.instance;
  }

  public calculate9VectorImpact(
    tenantId: string,
    scenarioType: ScenarioType,
    parameters: ScenarioParameters,
    context: {
      inventoryValue: number;
      unfulfilledOrdersCount: number;
      dailyRevenue: number;
      baselineOTIF: number;
    }
  ): any {
    const severity = parameters.severity ?? 0.5;
    const durationDays = parameters.durationDays ?? 14;

    const stockoutRiskScore = Math.min(1.0, 0.2 + severity * 0.7);
    const projectedOTIF = Math.max(50.0, context.baselineOTIF - (severity * 15));
    const affectedSupplierCount = parameters.affectedEntityIds?.length || Math.ceil(severity * 5);
    const estimatedDelayDays = Math.ceil(durationDays * 0.4 * severity);
    const capacityUtilizationRisk = severity > 0.6 ? 'CRITICAL' : 'MODERATE';
    const workingCapitalImpact = Math.round(context.inventoryValue * 0.15 * severity);
    const revenueAtRisk = Math.round(context.dailyRevenue * durationDays * severity * 0.8);
    const impactedOrders = Math.round(context.unfulfilledOrdersCount + (severity * 50));
    const compositeFragilityScore = Math.round((severity * 60) + (durationDays * 1.2));

    return {
      inventory: { stockoutRiskScore, holdingCostDelta: Math.round(context.inventoryValue * 0.05 * severity) },
      serviceLevel: { projectedOTIF, otifDelta: projectedOTIF - context.baselineOTIF },
      supplier: { affectedSupplierCount, tier1DisruptionCount: Math.ceil(affectedSupplierCount * 0.6) },
      transportation: { estimatedDelayDays, freightCostDelta: Math.round(4500 * severity) },
      warehouse: { capacityUtilizationRisk, congestionScore: Math.round(severity * 100) },
      workingCapital: { impactAmount: workingCapitalImpact, cashTiedUpDelta: workingCapitalImpact },
      financialExposure: { revenueAtRisk, totalExposure: revenueAtRisk + workingCapitalImpact },
      customer: { impactedOrderCount: impactedOrders, slaBreachCount: Math.ceil(impactedOrders * 0.3) },
      resilience: { compositeFragilityScore, recoveryTimeDays: Math.ceil(durationDays * 1.5) }
    };
  }

  public static calculateImpacts(
    baselineEntities: Record<string, TwinEntity>,
    simulatedEntities: Record<string, TwinEntity>
  ): ScenarioImpactVector[] {
    const vectors: ScenarioImpactVector[] = [];

    let baseStockouts = 0;
    let simStockouts = 0;
    let baseTotalInventoryValue = 0;
    let simTotalInventoryValue = 0;
    let baseDelayedShipments = 0;
    let simDelayedShipments = 0;
    let baseDelayedPOs = 0;
    let simDelayedPOs = 0;
    let baseRiskSum = 0;
    let simRiskSum = 0;
    let nodeCount = 0;

    for (const id of Object.keys(baselineEntities)) {
      const base = baselineEntities[id];
      const sim = simulatedEntities[id] || base;
      nodeCount++;
      baseRiskSum += base.riskScore || 0;
      simRiskSum += sim.riskScore || 0;

      if (base.entityType === 'INVENTORY') {
        const baseAvail = Number(base.properties?.available || 0);
        const simAvail = Number(sim.properties?.available || 0);
        const unitCost = Number(base.properties?.unitCost || 50);

        if (baseAvail <= 0) baseStockouts++;
        if (simAvail <= 0) simStockouts++;

        baseTotalInventoryValue += baseAvail * unitCost;
        simTotalInventoryValue += simAvail * unitCost;
      }

      if (base.entityType === 'SHIPMENT') {
        if ((base.properties?.delayDays || 0) > 0) baseDelayedShipments++;
        if ((sim.properties?.delayDays || 0) > 0) simDelayedShipments++;
      }

      if (base.entityType === 'PURCHASE_ORDER') {
        if (base.status === 'Delayed') baseDelayedPOs++;
        if (sim.status === 'Delayed') simDelayedPOs++;
      }
    }

    const avgBaseRisk = nodeCount > 0 ? baseRiskSum / nodeCount : 0;
    const avgSimRisk = nodeCount > 0 ? simRiskSum / nodeCount : 0;

    // 1. INVENTORY VECTOR
    vectors.push({
      vector: 'INVENTORY',
      metric: 'Stockout Risk & Available Units',
      baseline: baseStockouts,
      projected: simStockouts,
      delta: simStockouts - baseStockouts,
      unit: 'SKUs',
      calculationSource: 'RULE_BASED',
      confidence: 0.95,
    });

    // 2. SERVICE LEVEL VECTOR
    const baseOTIF = 98 - (baseDelayedShipments * 2);
    const simOTIF = Math.max(50, 98 - (simDelayedShipments * 2));
    vectors.push({
      vector: 'SERVICE',
      metric: 'Projected OTIF Rate',
      baseline: baseOTIF,
      projected: simOTIF,
      delta: simOTIF - baseOTIF,
      unit: '%',
      calculationSource: 'RULE_BASED',
      confidence: 0.92,
    });

    // 3. SUPPLIER VECTOR
    vectors.push({
      vector: 'SUPPLIER',
      metric: 'Supplier Delayed POs',
      baseline: baseDelayedPOs,
      projected: simDelayedPOs,
      delta: simDelayedPOs - baseDelayedPOs,
      unit: 'POs',
      calculationSource: 'RULE_BASED',
      confidence: 0.88,
    });

    // 4. TRANSPORTATION VECTOR
    vectors.push({
      vector: 'TRANSPORTATION',
      metric: 'In-Transit Shipment Delays',
      baseline: baseDelayedShipments,
      projected: simDelayedShipments,
      delta: simDelayedShipments - baseDelayedShipments,
      unit: 'Shipments',
      calculationSource: 'RULE_BASED',
      confidence: 0.91,
    });

    // 5. WAREHOUSE VECTOR
    vectors.push({
      vector: 'WAREHOUSE',
      metric: 'Warehouse Buffer Stock Capacity',
      baseline: Math.round(baseTotalInventoryValue),
      projected: Math.round(simTotalInventoryValue),
      delta: Math.round(simTotalInventoryValue - baseTotalInventoryValue),
      unit: 'USD',
      calculationSource: 'RULE_BASED',
      confidence: 0.85,
    });

    // 6. WORKING CAPITAL VECTOR
    const wcDelta = simTotalInventoryValue - baseTotalInventoryValue;
    vectors.push({
      vector: 'WORKING_CAPITAL',
      metric: 'Working Capital Tied in Inventory',
      baseline: Math.round(baseTotalInventoryValue),
      projected: Math.round(simTotalInventoryValue),
      delta: Math.round(wcDelta),
      unit: 'USD',
      calculationSource: 'RULE_BASED',
      confidence: 0.90,
    });

    // 7. FINANCIAL EXPOSURE VECTOR
    const financialExposure = Math.max(0, (simDelayedShipments * 5000) + (simStockouts * 2500));
    const baseFinancialExposure = Math.max(0, (baseDelayedShipments * 5000) + (baseStockouts * 2500));
    vectors.push({
      vector: 'FINANCIAL_EXP',
      metric: 'Disruption Cost Exposure',
      baseline: baseFinancialExposure,
      projected: financialExposure,
      delta: financialExposure - baseFinancialExposure,
      unit: 'USD',
      calculationSource: 'RULE_BASED',
      confidence: 0.82,
    });

    // 8. CUSTOMER VECTOR
    const affectedOrders = simStockouts * 3 + simDelayedShipments * 2;
    const baseAffectedOrders = baseStockouts * 3 + baseDelayedShipments * 2;
    vectors.push({
      vector: 'CUSTOMER',
      metric: 'Affected Customer Orders',
      baseline: baseAffectedOrders,
      projected: affectedOrders,
      delta: affectedOrders - baseAffectedOrders,
      unit: 'orders',
      calculationSource: 'RULE_BASED',
      confidence: 0.85,
    });

    // 9. RISK VECTOR
    vectors.push({
      vector: 'RISK',
      metric: 'Average Network Risk Score',
      baseline: Math.round(avgBaseRisk),
      projected: Math.round(avgSimRisk),
      delta: Math.round(avgSimRisk - avgBaseRisk),
      unit: 'points (0-100)',
      calculationSource: 'RULE_BASED',
      confidence: 0.89,
    });

    return vectors;
  }
}

export const scenarioImpactEngine = ScenarioImpactEngine.getInstance();
