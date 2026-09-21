/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * What-If Planner
 * 
 * Generates standardized parametric permutations for interactive sensitivity analysis:
 * - Demand Spikes: +5%, +10%, +20%
 * - Supplier Delays: +2d, +5d, +10d
 * - Warehouse/Transport Capacity Reductions: -10%, -20%, -30%
 * - Freight Surcharges: +5%, +10%, +20%
 */

import { ScenarioParameters, ScenarioAssumption } from './types';

export class WhatIfPlanner {
  private static instance: WhatIfPlanner;

  public static getInstance(): WhatIfPlanner {
    if (!WhatIfPlanner.instance) {
      WhatIfPlanner.instance = new WhatIfPlanner();
    }
    return WhatIfPlanner.instance;
  }

  public evaluateSensitivity(baselineState: any, params: {
    demandMultiplier?: number;
    leadTimeIncreaseDays?: number;
    costIncreaseRate?: number;
  }): any {
    const demandMult = params.demandMultiplier ?? 1.0;
    const leadTimeDelta = params.leadTimeIncreaseDays ?? 0;
    const costRate = params.costIncreaseRate ?? 0;

    return {
      projectedInventoryValue: Math.round(baselineState.totalInventoryValue * (1 + (demandMult - 1) * 0.5 + costRate)),
      projectedStockoutRisk: Math.min(1.0, baselineState.averageStockoutRisk + ((demandMult - 1) * 0.4) + (leadTimeDelta * 0.02)),
      projectedLeadTimeDays: baselineState.averageLeadTimeDays + leadTimeDelta
    };
  }

  public static createDemandSensitivity(multiplierPercent: number, targetCategory?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: multiplierPercent >= 0 ? 'DEMAND_INCREASE' : 'DEMAND_DECREASE',
        multiplier: 1 + (multiplierPercent / 100),
        deltaPercent: multiplierPercent,
        affectedCategories: targetCategory ? [targetCategory] : undefined,
      },
      assumption: {
        assumptionId: `ASSUMP-DEMAND-${Date.now()}`,
        name: `Customer demand delta of ${multiplierPercent > 0 ? '+' : ''}${multiplierPercent}%`,
        value: multiplierPercent,
        unit: '%',
        source: 'USER_DEFINED',
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createSupplierDelaySensitivity(delayDays: number, supplierId?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'SUPPLIER_DELAY',
        targetEntityId: supplierId,
        deltaDays: delayDays,
      },
      assumption: {
        assumptionId: `ASSUMP-DELAY-${Date.now()}`,
        name: `Upstream vendor lead time extension of +${delayDays} days`,
        value: delayDays,
        unit: 'days',
        source: 'HISTORICAL',
        confidence: 0.8,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createCapacityReductionSensitivity(reductionPercent: number, targetWarehouseId?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'CAPACITY_REDUCTION',
        targetEntityId: targetWarehouseId,
        deltaPercent: -Math.abs(reductionPercent),
      },
      assumption: {
        assumptionId: `ASSUMP-CAPACITY-${Date.now()}`,
        name: `Node throughput/storage capacity constraint reduction of ${reductionPercent}%`,
        value: -Math.abs(reductionPercent),
        unit: '%',
        source: 'USER_DEFINED',
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createFreightSurchargeSensitivity(surchargePercent: number): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'FREIGHT_SURCHARGE',
        deltaPercent: surchargePercent,
        multiplier: 1 + (surchargePercent / 100),
      },
      assumption: {
        assumptionId: `ASSUMP-FREIGHT-${Date.now()}`,
        name: `Freight fuel and capacity surcharge index shift of +${surchargePercent}%`,
        value: surchargePercent,
        unit: '%',
        source: 'HISTORICAL',
        confidence: 0.75,
        createdAt: new Date().toISOString(),
      },
    };
  }
}

export const whatIfPlanner = WhatIfPlanner.getInstance();
