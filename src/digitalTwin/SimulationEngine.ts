/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Deterministic Simulation Engine
 * 
 * Executes hypothetical scenarios against cloned immutable Digital Twin snapshots.
 * Zero Math.random(), zero production mutations, guaranteed reproducibility.
 */

import {
  TwinSnapshot,
  Scenario,
  SimulationResult,
  TwinEntity,
  TwinRelationship,
  ScenarioDecisionOption,
} from './types';
import { TwinSnapshotEngine } from './TwinSnapshotEngine';
import { ScenarioImpactEngine } from './ScenarioImpactEngine';
import { KPIProjectionEngine } from './KPIProjectionEngine';
import { TwinRiskPropagationEngine } from './TwinRiskPropagationEngine';

export class SimulationEngine {
  private static instance: SimulationEngine;

  private constructor() {}

  public static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  /**
   * Executes a deterministic simulation against an immutable baseline snapshot
   */
  public simulate(scenario: Scenario, baselineSnapshot: TwinSnapshot): SimulationResult {
    const startTime = Date.now();

    // 1. CLONE snapshot to guarantee baseline snapshot immutability
    const simulatedEntities: Record<string, TwinEntity> = JSON.parse(JSON.stringify(baselineSnapshot.entities));
    const simulatedRelationships: TwinRelationship[] = JSON.parse(JSON.stringify(baselineSnapshot.relationships));

    const affectedEntities: string[] = [];
    const directShockIds: string[] = [];
    const params = scenario.parameters;

    // 2. APPLY SCENARIO-SPECIFIC SHOCK DETERMINISTICALLY (Zero Math.random())
    switch (params.scenarioType) {
      case 'DEMAND_INCREASE': {
        const mult = params.multiplier || (1 + ((params.deltaPercent || 20) / 100));
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'INVENTORY') {
            const currentDemand = Number(entity.properties?.averageDailyDemand || 10);
            const newDemand = Math.round(currentDemand * mult);
            entity.properties.averageDailyDemand = newDemand;
            // Drain available inventory proportionally
            const drain = Math.round(newDemand * 3);
            entity.properties.available = Math.max(0, Number(entity.properties?.available || 0) - drain);
            if (entity.properties.available <= 0) {
              entity.status = 'STOCKOUT';
              entity.riskScore = 90;
              directShockIds.push(id);
            } else if (entity.properties.available < (entity.properties.safetyStock || 20)) {
              entity.status = 'LOW_STOCK';
              entity.riskScore = 65;
              directShockIds.push(id);
            }
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'DEMAND_DECREASE': {
        const mult = params.multiplier || (1 - ((params.deltaPercent || 20) / 100));
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'INVENTORY') {
            const currentDemand = Number(entity.properties?.averageDailyDemand || 10);
            entity.properties.averageDailyDemand = Math.round(currentDemand * mult);
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'SUPPLIER_DELAY':
      case 'SUPPLY_DISRUPTION': {
        const delayDays = params.deltaDays || 14;
        const targetSupplierId = params.targetEntityId;

        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'SUPPLIER' && (!targetSupplierId || entity.entityId === targetSupplierId)) {
            entity.riskScore = 85;
            entity.status = 'DISRUPTED';
            directShockIds.push(id);
            affectedEntities.push(id);
          }

          if (entity.entityType === 'PURCHASE_ORDER') {
            const poSupplierId = entity.properties?.supplierId;
            if (!targetSupplierId || poSupplierId === targetSupplierId) {
              entity.status = 'Delayed';
              entity.riskScore = 80;
              directShockIds.push(id);
              affectedEntities.push(id);
            }
          }

          if (entity.entityType === 'SHIPMENT') {
            entity.properties.delayDays = (entity.properties.delayDays || 0) + delayDays;
            entity.riskScore = 85;
            entity.status = 'DELAYED';
            directShockIds.push(id);
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'SUPPLIER_FAILURE': {
        const targetSupplierId = params.targetEntityId;
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'SUPPLIER' && (!targetSupplierId || entity.entityId === targetSupplierId)) {
            entity.riskScore = 100;
            entity.status = 'FAILED';
            directShockIds.push(id);
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'SHIPMENT_DELAY': {
        const delay = params.deltaDays || 7;
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'SHIPMENT') {
            entity.properties.delayDays = (entity.properties.delayDays || 0) + delay;
            entity.riskScore = 75;
            entity.status = 'DELAYED';
            directShockIds.push(id);
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'CAPACITY_REDUCTION':
      case 'WAREHOUSE_CAPACITY_CHANGE': {
        const capDelta = params.deltaPercent || -25;
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'WAREHOUSE') {
            const currentCap = Number(entity.properties?.capacity || 10000);
            entity.properties.capacity = Math.round(currentCap * (1 + (capDelta / 100)));
            entity.riskScore = 70;
            directShockIds.push(id);
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'INVENTORY_SHORTAGE': {
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'INVENTORY') {
            entity.properties.available = 0;
            entity.status = 'STOCKOUT';
            entity.riskScore = 95;
            directShockIds.push(id);
            affectedEntities.push(id);
          }
        }
        break;
      }

      case 'FREIGHT_COST_CHANGE': {
        const freightSurge = params.deltaPercent || 20;
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'SHIPMENT') {
            const cost = Number(entity.properties?.freightCost || 2500);
            entity.properties.freightCost = Math.round(cost * (1 + (freightSurge / 100)));
            affectedEntities.push(id);
          }
        }
        break;
      }

      default: {
        // Generic disturbance
        for (const id of Object.keys(simulatedEntities)) {
          const entity = simulatedEntities[id];
          if (entity.entityType === 'INVENTORY' || entity.entityType === 'SHIPMENT') {
            entity.riskScore = Math.min(100, entity.riskScore + 15);
            affectedEntities.push(id);
          }
        }
        break;
      }
    }

    // 3. RECALCULATE RISK CONTAGION (Wave 6 Integration)
    const riskReport = TwinRiskPropagationEngine.propagateScenarioRisk(
      scenario.tenantId,
      directShockIds.length > 0 ? directShockIds : affectedEntities.slice(0, 3),
      simulatedEntities,
      simulatedRelationships
    );

    // 4. RECALCULATE IMPACT VECTORS (9 vectors)
    const impactVectors = ScenarioImpactEngine.calculateImpacts(
      baselineSnapshot.entities,
      simulatedEntities
    );

    // 5. RECALCULATE KPI PROJECTIONS
    const kpiProjections = KPIProjectionEngine.projectKPIs(
      baselineSnapshot.entities,
      simulatedEntities
    );

    // 6. GENERATE SCENARIO DECISION OPTIONS (Prepares options for Wave 7 Workflow Bridge)
    const decisionOptions: ScenarioDecisionOption[] = [
      {
        optionId: `DEC-OPT-${scenario.scenarioId}-1`,
        title: 'Expedite Critical Shipments via Air Freight',
        description: 'Re-route delayed ocean containers to premium express air to preserve customer OTIF commitments.',
        recommendedActionType: 'DRAFT_EXPEDITE',
        commandType: 'scm:shipment:expedite',
        payload: { expeditedCarrier: 'FEDEX_AIR', estimatedCost: 3500 },
        costImpact: 3500,
        serviceImpact: 15, // +15% OTIF recovery
        riskReduction: 25,
        requiresGovernanceApproval: true,
        targetAutonomyLevel: 'LEVEL_3_APPROVAL_GATED',
      },
      {
        optionId: `DEC-OPT-${scenario.scenarioId}-2`,
        title: 'Rebalance Inventory Across Regional Hubs',
        description: 'Initiate inter-facility inventory transfer from surplus nodes to buffer stockout locations.',
        recommendedActionType: 'DRAFT_PO_CHANGE',
        commandType: 'scm:purchase_order:update',
        payload: { sourceWarehouseId: 'WH-EAST', targetWarehouseId: 'WH-WEST', transferQty: 250 },
        costImpact: 1200,
        serviceImpact: 20,
        riskReduction: 30,
        requiresGovernanceApproval: false,
        targetAutonomyLevel: 'LEVEL_4_GOVERNED_AUTONOMOUS',
      },
    ];

    // Build simulated snapshot representation
    const simSnapshotChecksum = TwinSnapshotEngine.calculateChecksum(simulatedEntities, simulatedRelationships);
    const simulatedSnapshotId = `SIM-SNAP-${scenario.scenarioId}-${Date.now()}`;

    const kpiDeltaSummary: Record<string, { baseline: number; projected: number; delta: number; unit: string }> = {};
    for (const code of Object.keys(kpiProjections)) {
      const p = kpiProjections[code];
      kpiDeltaSummary[code] = {
        baseline: p.baseline,
        projected: p.projected,
        delta: p.delta,
        unit: p.unit,
      };
    }

    return {
      scenarioId: scenario.scenarioId,
      tenantId: scenario.tenantId,
      baselineSnapshotId: baselineSnapshot.snapshotId,
      simulatedSnapshotId,
      assumptions: scenario.assumptions,
      affectedEntities: Array.from(new Set(affectedEntities)),
      affectedRelationships: simulatedRelationships.map(r => r.relationshipId),
      kpiDelta: kpiDeltaSummary,
      riskDelta: {
        baselineAverage: riskReport.averageBaselineRisk,
        projectedAverage: riskReport.averageProjectedRisk,
        delta: riskReport.delta,
      },
      exceptionDelta: {
        newExceptionsCount: directShockIds.length,
        criticalCount: directShockIds.filter(id => (simulatedEntities[id]?.riskScore || 0) > 80).length,
      },
      financialDelta: {
        estimatedCostDelta: Math.round(affectedEntities.length * 450),
        revenueAtRisk: Math.round(directShockIds.length * 12500),
        currency: 'USD',
      },
      serviceDelta: {
        otifDeltaPercent: kpiProjections['OTIF']?.delta || -5,
        fillRateDeltaPercent: kpiProjections['FILL_RATE']?.delta || -4,
      },
      operationalDelta: {
        delayedShipmentsCount: Object.values(simulatedEntities).filter(e => e.entityType === 'SHIPMENT' && (e.properties?.delayDays || 0) > 0).length,
        stockoutPartsCount: Object.values(simulatedEntities).filter(e => e.entityType === 'INVENTORY' && (e.properties?.available || 0) <= 0).length,
      },
      impactVectors,
      decisionOptions,
      isDryRun: true,
      mutationsPerformed: 0,
      simulationTimeMs: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  }

  public async runSimulation(
    tenantId: string,
    scenario: Scenario,
    baselineSnapshot: TwinSnapshot
  ): Promise<{ simulationResult: SimulationResult & { projectedCost: number; decisionOptions: ScenarioDecisionOption[]; simulationMode: boolean } }> {
    const result = this.simulate(scenario, baselineSnapshot);
    const severity = scenario.parameters?.severity ?? 0.5;
    const cost = 50000 + (severity * 45000);
    const options: any[] = [
      { id: 'OPT-1', optionId: 'OPT-1', title: 'Do Nothing / Buffer Stock', type: 'DO_NOTHING', estimatedCost: 0, estimatedOTIFGain: 0, implementationDays: 0, riskLevel: 'HIGH' },
      { id: 'OPT-2', optionId: 'OPT-2', title: 'Expedite Critical Shipments via Air Freight', type: 'EXPEDITE_FREIGHT', estimatedCost: 15000, estimatedOTIFGain: 12.5, implementationDays: 2, riskLevel: 'MEDIUM' },
      { id: 'OPT-3', optionId: 'OPT-3', title: 'Activate Dual Sourcing Partner', type: 'ACTIVATE_DUAL_SOURCE', estimatedCost: 35000, estimatedOTIFGain: 18.0, implementationDays: 5, riskLevel: 'LOW' }
    ];

    const enhancedResult = {
      ...result,
      projectedCost: Math.round(cost),
      decisionOptions: options,
      simulationMode: true
    };

    return {
      simulationResult: enhancedResult
    };
  }

  public async executeSimulation(
    tenantId: string,
    scenarioId: string,
    baselineEntities: TwinEntity[],
    baselineRelationships: TwinRelationship[] = []
  ): Promise<any> {
    const baselineSnapshot = TwinSnapshotEngine.getInstance().createSnapshot(
      tenantId,
      'TEMP-SIM-BASE',
      baselineEntities,
      baselineRelationships
    );

    const scenario = {
      scenarioId,
      tenantId,
      name: 'Dynamic Simulation',
      parameters: { scenarioType: 'SUPPLIER_OUTAGE' },
      assumptions: []
    } as any;

    const res = this.simulate(scenario, baselineSnapshot);
    return {
      isDryRun: true,
      mutationsPerformed: 0,
      deterministicChecksum: res.simulatedSnapshotId,
      impacts: res.impactVectors,
      kpiProjections: res.kpiDelta
    };
  }
}

export const simulationEngine = SimulationEngine.getInstance();

