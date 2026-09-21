/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * KPI Projection Engine
 * 
 * Computes deterministic rule-based KPI projections for simulated digital twin scenarios.
 * All projections are explicitly labeled as RULE_BASED.
 */

import { TwinEntity } from './types';

export interface KPIProjection {
  kpiCode: string;
  name: string;
  baseline: number;
  projected: number;
  delta: number;
  unit: string;
  projectionMethod: 'RULE_BASED';
  interpretation: 'FAVORABLE' | 'UNFAVORABLE' | 'NEUTRAL';
}

export class KPIProjectionEngine {
  private static instance: KPIProjectionEngine;

  public static getInstance(): KPIProjectionEngine {
    if (!KPIProjectionEngine.instance) {
      KPIProjectionEngine.instance = new KPIProjectionEngine();
    }
    return KPIProjectionEngine.instance;
  }

  public static projectKPIs(
    arg1: any,
    arg2?: Record<string, TwinEntity>
  ): any {
    if (arg2) {
      return KPIProjectionEngine.projectKPIsFromEntities(arg1, arg2);
    }

    // Options object interface:
    const params = arg1 as {
      horizonDays?: number;
      baselineOTIF?: number;
      baselineFillRate?: number;
      baselineInventoryDays?: number;
      baselineFreightCostPerUnit?: number;
      disruptionSeverity?: number;
      disruptionDurationDays?: number;
    };

    const horizonDays = params.horizonDays || 30;
    const baselineOTIF = params.baselineOTIF ?? 95.0;
    const baselineFillRate = params.baselineFillRate ?? 98.0;
    const baselineInventoryDays = params.baselineInventoryDays ?? 45;
    const baselineFreight = params.baselineFreightCostPerUnit ?? 12.0;
    const severity = params.disruptionSeverity ?? 0.5;
    const durationDays = params.disruptionDurationDays ?? 14;

    const timeline = [];
    for (let day = 1; day <= horizonDays; day++) {
      let otifDrop = 0;
      let fillDrop = 0;
      let freightHike = 0;

      if (day <= durationDays) {
        // Active disruption period
        const progress = day / durationDays;
        otifDrop = severity * 18 * Math.sin(progress * Math.PI);
        fillDrop = severity * 12 * Math.sin(progress * Math.PI);
        freightHike = severity * 6 * Math.sin(progress * Math.PI);
      } else {
        // Recovery period
        const recoveryProgress = (day - durationDays) / Math.max(1, (horizonDays - durationDays));
        otifDrop = Math.max(0, severity * 8 * (1 - recoveryProgress));
        fillDrop = Math.max(0, severity * 5 * (1 - recoveryProgress));
        freightHike = Math.max(0, severity * 2 * (1 - recoveryProgress));
      }

      timeline.push({
        day,
        projectedOTIF: Math.round((baselineOTIF - otifDrop) * 10) / 10,
        projectedFillRate: Math.round((baselineFillRate - fillDrop) * 10) / 10,
        projectedInventoryDays: Math.round((baselineInventoryDays + (severity * 10)) * 10) / 10,
        projectedFreightCostPerUnit: Math.round((baselineFreight + freightHike) * 10) / 10
      });
    }

    return {
      timeline,
      averageOTIF: Math.round((timeline.reduce((acc, curr) => acc + curr.projectedOTIF, 0) / timeline.length) * 10) / 10,
      lowestOTIF: Math.min(...timeline.map(t => t.projectedOTIF)),
      recoveryDay: Math.min(horizonDays, durationDays + Math.round(durationDays * 0.8))
    };
  }

  public projectKPIs(
    arg1: any,
    arg2?: Record<string, TwinEntity>
  ): any {
    return KPIProjectionEngine.projectKPIs(arg1, arg2);
  }

  public static projectKPIsFromEntities(
    baselineEntities: Record<string, TwinEntity>,
    simulatedEntities: Record<string, TwinEntity>
  ): Record<string, KPIProjection> {
    const projections: Record<string, KPIProjection> = {};

    let baseStockouts = 0;
    let simStockouts = 0;
    let baseDelayDaysSum = 0;
    let simDelayDaysSum = 0;
    let shipmentCount = 0;
    let baseInventoryDaysSum = 0;
    let simInventoryDaysSum = 0;
    let inventoryItemCount = 0;

    for (const id of Object.keys(baselineEntities)) {
      const base = baselineEntities[id];
      const sim = simulatedEntities[id] || base;

      if (base.entityType === 'INVENTORY') {
        inventoryItemCount++;
        const baseAvail = Number(base.properties?.available || 0);
        const simAvail = Number(sim.properties?.available || 0);
        const dailyDemand = Number(base.properties?.averageDailyDemand || 10);

        if (baseAvail <= 0) baseStockouts++;
        if (simAvail <= 0) simStockouts++;

        baseInventoryDaysSum += dailyDemand > 0 ? baseAvail / dailyDemand : 30;
        simInventoryDaysSum += dailyDemand > 0 ? simAvail / dailyDemand : 30;
      }

      if (base.entityType === 'SHIPMENT') {
        shipmentCount++;
        baseDelayDaysSum += Number(base.properties?.delayDays || 0);
        simDelayDaysSum += Number(sim.properties?.delayDays || 0);
      }
    }

    // 1. OTIF
    const baseOTIF = Math.max(50, 98 - (baseDelayDaysSum * 1.5));
    const simOTIF = Math.max(50, 98 - (simDelayDaysSum * 1.5));
    projections['OTIF'] = {
      kpiCode: 'OTIF',
      name: 'On-Time In-Full Delivery',
      baseline: Math.round(baseOTIF * 10) / 10,
      projected: Math.round(simOTIF * 10) / 10,
      delta: Math.round((simOTIF - baseOTIF) * 10) / 10,
      unit: '%',
      projectionMethod: 'RULE_BASED',
      interpretation: simOTIF >= baseOTIF ? 'FAVORABLE' : 'UNFAVORABLE',
    };

    // 2. FILL_RATE
    const baseFillRate = inventoryItemCount > 0 ? Math.max(50, 100 - (baseStockouts / inventoryItemCount * 100)) : 100;
    const simFillRate = inventoryItemCount > 0 ? Math.max(50, 100 - (simStockouts / inventoryItemCount * 100)) : 100;
    projections['FILL_RATE'] = {
      kpiCode: 'FILL_RATE',
      name: 'Order Fill Rate',
      baseline: Math.round(baseFillRate * 10) / 10,
      projected: Math.round(simFillRate * 10) / 10,
      delta: Math.round((simFillRate - baseFillRate) * 10) / 10,
      unit: '%',
      projectionMethod: 'RULE_BASED',
      interpretation: simFillRate >= baseFillRate ? 'FAVORABLE' : 'UNFAVORABLE',
    };

    // 3. INVENTORY_DAYS
    const baseDays = inventoryItemCount > 0 ? Math.round(baseInventoryDaysSum / inventoryItemCount) : 45;
    const simDays = inventoryItemCount > 0 ? Math.round(simInventoryDaysSum / inventoryItemCount) : 45;
    projections['INVENTORY_DAYS'] = {
      kpiCode: 'INVENTORY_DAYS',
      name: 'Days of Supply (Inventory)',
      baseline: baseDays,
      projected: simDays,
      delta: simDays - baseDays,
      unit: 'days',
      projectionMethod: 'RULE_BASED',
      interpretation: simDays >= 15 && simDays <= 60 ? 'FAVORABLE' : 'UNFAVORABLE',
    };

    // 4. STOCKOUT_RISK
    const baseRisk = inventoryItemCount > 0 ? Math.round((baseStockouts / inventoryItemCount) * 100) : 0;
    const simRisk = inventoryItemCount > 0 ? Math.round((simStockouts / inventoryItemCount) * 100) : 0;
    projections['STOCKOUT_RISK'] = {
      kpiCode: 'STOCKOUT_RISK',
      name: 'Stockout Exposure Index',
      baseline: baseRisk,
      projected: simRisk,
      delta: simRisk - baseRisk,
      unit: 'index (0-100)',
      projectionMethod: 'RULE_BASED',
      interpretation: simRisk <= baseRisk ? 'FAVORABLE' : 'UNFAVORABLE',
    };

    // 5. FREIGHT_COST
    const baseFreight = 10000 + (baseDelayDaysSum * 500);
    const simFreight = 10000 + (simDelayDaysSum * 500);
    projections['FREIGHT_COST'] = {
      kpiCode: 'FREIGHT_COST',
      name: 'Transportation Logistics Cost',
      baseline: baseFreight,
      projected: simFreight,
      delta: simFreight - baseFreight,
      unit: 'USD',
      projectionMethod: 'RULE_BASED',
      interpretation: simFreight <= baseFreight ? 'FAVORABLE' : 'UNFAVORABLE',
    };

    return projections;
  }
}

export const kpiProjectionEngine = KPIProjectionEngine.getInstance();
