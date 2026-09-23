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

  public static createInventoryDepletionSensitivity(depletionPercent: number, productId?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'INVENTORY_SHORTAGE',
        targetEntityId: productId,
        deltaPercent: -Math.abs(depletionPercent),
        multiplier: 1 - (Math.abs(depletionPercent) / 100),
      },
      assumption: {
        assumptionId: `ASSUMP-INV-${Date.now()}`,
        name: `Inventory stock depletion shift of -${depletionPercent}%`,
        value: -Math.abs(depletionPercent),
        unit: '%',
        source: 'USER_DEFINED',
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createTransportationDelaySensitivity(delayDays: number, carrierId?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'SHIPMENT_DELAY',
        targetEntityId: carrierId,
        deltaDays: delayDays,
      },
      assumption: {
        assumptionId: `ASSUMP-TRANS-${Date.now()}`,
        name: `Logistics transit corridor delay of +${delayDays} days`,
        value: delayDays,
        unit: 'days',
        source: 'HISTORICAL',
        confidence: 0.8,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createSupplierCapacityReductionSensitivity(reductionPercent: number, supplierId?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'SUPPLIER_FAILURE',
        targetEntityId: supplierId,
        deltaPercent: -Math.abs(reductionPercent),
      },
      assumption: {
        assumptionId: `ASSUMP-SUP-CAP-${Date.now()}`,
        name: `Supplier manufacturing capacity reduction of -${reductionPercent}%`,
        value: -Math.abs(reductionPercent),
        unit: '%',
        source: 'HISTORICAL',
        confidence: 0.8,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createCostShockSensitivity(costIncreasePercent: number): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'COST_SHOCK',
        deltaPercent: costIncreasePercent,
        multiplier: 1 + (costIncreasePercent / 100),
      },
      assumption: {
        assumptionId: `ASSUMP-COST-${Date.now()}`,
        name: `Procurement direct material cost shock of +${costIncreasePercent}%`,
        value: costIncreasePercent,
        unit: '%',
        source: 'SYSTEM',
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public static createWarehouseCapacitySensitivity(reductionPercent: number, warehouseId?: string): {
    parameters: ScenarioParameters;
    assumption: ScenarioAssumption;
  } {
    return {
      parameters: {
        scenarioType: 'WAREHOUSE_CAPACITY_CHANGE',
        targetEntityId: warehouseId,
        deltaPercent: -Math.abs(reductionPercent),
      },
      assumption: {
        assumptionId: `ASSUMP-WH-CAP-${Date.now()}`,
        name: `Regional distribution center capacity restriction of -${reductionPercent}%`,
        value: -Math.abs(reductionPercent),
        unit: '%',
        source: 'USER_DEFINED',
        confidence: 0.85,
        createdAt: new Date().toISOString(),
      },
    };
  }

  public createInventoryDepletionSensitivity(
    arg1: string | number,
    arg2?: string,
    arg3?: string,
    arg4?: number[]
  ): any {
    if (typeof arg1 === 'number') {
      return WhatIfPlanner.createInventoryDepletionSensitivity(arg1, arg2);
    }
    const tenantId = arg1;
    const name = arg2 || 'Inventory Depletion Sensitivity';
    const productId = arg3;
    const levels = arg4 || [0.1, 0.3, 0.5];
    return {
      tenantId,
      name,
      productId,
      scenarioType: 'INVENTORY_SHORTAGE',
      steps: levels.map(l => ({ level: l, deltaPercent: -Math.round(l * 100) }))
    };
  }

  public createTransportationDelaySensitivity(
    arg1: string | number,
    arg2?: string,
    arg3?: string[] | string,
    arg4?: number[]
  ): any {
    if (typeof arg1 === 'number') {
      return WhatIfPlanner.createTransportationDelaySensitivity(arg1, arg2 as any);
    }
    const tenantId = arg1;
    const name = arg2 || 'Transportation Delay Sensitivity';
    const lanes = Array.isArray(arg3) ? arg3 : [arg3 || 'ALL'];
    const delays = arg4 || [2, 7, 14];
    return {
      tenantId,
      name,
      lanes,
      scenarioType: 'PORT_CONGESTION',
      steps: delays.map(d => ({ delayDays: d, parameters: { deltaDays: d } }))
    };
  }

  public createSupplierCapacityReductionSensitivity(
    arg1: string | number,
    arg2?: string,
    arg3?: string[] | string,
    arg4?: number[]
  ): any {
    if (typeof arg1 === 'number') {
      return WhatIfPlanner.createSupplierCapacityReductionSensitivity(arg1, arg2 as any);
    }
    const tenantId = arg1;
    const name = arg2 || 'Supplier Capacity Reduction Sensitivity';
    const suppliers = Array.isArray(arg3) ? arg3 : [arg3 || 'ALL'];
    const reductions = arg4 || [0.2, 0.5];
    return {
      tenantId,
      name,
      suppliers,
      scenarioType: 'SUPPLIER_OUTAGE',
      steps: reductions.map(r => ({ reductionPercent: r * 100, deltaPercent: -Math.round(r * 100) }))
    };
  }

  public createCostShockSensitivity(
    arg1: string | number,
    arg2?: string,
    arg3?: string,
    arg4?: number[]
  ): any {
    if (typeof arg1 === 'number') {
      return WhatIfPlanner.createCostShockSensitivity(arg1);
    }
    const tenantId = arg1;
    const name = arg2 || 'Cost Shock Sensitivity';
    const commodity = arg3;
    const increases = arg4 || [0.05, 0.15];
    return {
      tenantId,
      name,
      commodity,
      scenarioType: 'COST_SHOCK',
      steps: increases.map(inc => ({ costIncreasePercent: inc * 100, deltaPercent: Math.round(inc * 100) }))
    };
  }

  public createWarehouseCapacitySensitivity(
    arg1: string | number,
    arg2?: string,
    arg3?: string[] | string,
    arg4?: number[]
  ): any {
    if (typeof arg1 === 'number') {
      return WhatIfPlanner.createWarehouseCapacitySensitivity(arg1, arg2 as any);
    }
    const tenantId = arg1;
    const name = arg2 || 'Warehouse Capacity Sensitivity';
    const warehouses = Array.isArray(arg3) ? arg3 : [arg3 || 'ALL'];
    const reductions = arg4 || [0.1, 0.3];
    return {
      tenantId,
      name,
      warehouses,
      scenarioType: 'WAREHOUSE_CAPACITY_CHANGE',
      steps: reductions.map(r => ({ reductionPercent: r * 100, deltaPercent: -Math.round(r * 100) }))
    };
  }
}

export const whatIfPlanner = WhatIfPlanner.getInstance();
