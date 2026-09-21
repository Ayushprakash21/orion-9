/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Digital Twin Lifecycle, Simulation & Orchestration Integration Test Suite
 * 
 * Verifies end-to-end digital twin pipeline:
 * 1. Canonical entity mapping from transactional models
 * 2. Multi-relational directed graph traversal, upstream/downstream dependencies & cycle detection
 * 3. Twin reconciliation engine detecting discrepancies without silent mutation
 * 4. Deterministic snapshot creation, checksum generation & tamper detection
 * 5. Temporal state engine segregating current, historical & projected planes
 * 6. Scenario engine managing 12 archetypes & explicit provenance assumptions
 * 7. What-If sensitivity planner
 * 8. Comprehensive 9-vector impact evaluation
 * 9. Deterministic KPI projection engine
 * 10. Multi-tier risk propagation across the twin graph
 * 11. Deterministic simulation execution with zero mutations to baseline
 * 12. Multi-scenario trade-off comparison matrix
 * 13. Governed scenario-to-workflow bridge handoff to Wave 7
 * 14. Outcome evaluation comparing projected vs actuals
 * 15. Twin operational health & deterministic event replay
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  canonicalEntityMapper,
  TwinGraphEngine,
  twinReconciliationEngine,
  twinSnapshotEngine,
  temporalStateEngine,
  scenarioEngine,
  whatIfPlanner,
  scenarioImpactEngine,
  kpiProjectionEngine,
  twinRiskPropagationEngine,
  simulationEngine,
  scenarioComparisonEngine,
  scenarioWorkflowBridge,
  scenarioOutcomeEvaluationEngine,
  twinHealthEngine,
  twinEventReplayEngine,
  DigitalTwin,
  TwinEntity,
  TwinRelationship,
  ScenarioType,
  ScenarioParameters,
  ScenarioAssumption
} from '../../digitalTwin';
import { Inventory, PurchaseOrder, Shipment, Supplier, Product } from '../../types';

describe('Wave 8 Digital Twin Lifecycle, Simulation & Orchestration Suite', () => {
  const TENANT_A = 'TENANT_A';
  let graphEngine: TwinGraphEngine;

  beforeEach(() => {
    graphEngine = new TwinGraphEngine(TENANT_A);
    twinSnapshotEngine.clear();
    scenarioEngine.clear();
    temporalStateEngine.clear();
  });

  describe('1. Canonical Entity Mapping', () => {
    it('maps an Inventory entity to a canonical TwinEntity with computed properties', () => {
      const inv: any = {
        id: 'INV-100',
        productId: 'PROD-SKU-1',
        warehouseId: 'WH-CENTRAL',
        onHand: 1500,
        reserved: 300,
        safetyStock: 400,
        reorderPoint: 600,
        unitCost: 25.5,
        leadTime: 14,
        averageDailyDemand: 50,
        tenantId: TENANT_A,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const entity = canonicalEntityMapper.fromInventory(inv, TENANT_A);
      expect(entity.id).toBe('INV-100');
      expect(entity.type).toBe('INVENTORY');
      expect(entity.tenantId).toBe(TENANT_A);
      expect(entity.attributes.onHand).toBe(1500);
      expect(entity.attributes.reserved).toBe(300);
      expect(entity.attributes.available).toBe(1200); // 1500 - 300
      expect(entity.attributes.sku).toBe('PROD-SKU-1');
      expect(entity.status).toBe('ACTIVE');
    });

    it('maps a PurchaseOrder entity with totalValue, supplierId, and status', () => {
      const po: any = {
        id: 'PO-900',
        orderNumber: 'PO-2026-900',
        supplierId: 'SUP-ACME',
        buyerId: 'BUYER-01',
        status: 'CONFIRMED',
        items: [
          { productId: 'PROD-1', quantity: 100, unitPrice: 50, totalAmount: 5000 }
        ],
        totalAmount: 5000,
        currency: 'USD',
        tenantId: TENANT_A,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const entity = canonicalEntityMapper.fromPurchaseOrder(po, TENANT_A);
      expect(entity.id).toBe('PO-900');
      expect(entity.type).toBe('PURCHASE_ORDER');
      expect(entity.attributes.supplierId).toBe('SUP-ACME');
      expect(entity.attributes.totalAmount).toBe(5000);
      expect(entity.status).toBe('CONFIRMED');
    });

    it('maps a Shipment entity with tracking, transit times, and freight cost', () => {
      const shp: any = {
        id: 'SHP-800',
        trackingNumber: 'TRK-98765',
        carrier: 'Maersk Logistics',
        origin: 'Shanghai',
        destination: 'Long Beach',
        status: 'IN_TRANSIT',
        departureDate: '2026-03-01T00:00:00Z',
        estimatedArrival: '2026-03-20T00:00:00Z',
        items: [{ productId: 'PROD-1', quantity: 500 }],
        tenantId: TENANT_A,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        freightCost: 4500,
        delayDays: 3
      };

      const entity = canonicalEntityMapper.fromShipment(shp, TENANT_A);
      expect(entity.id).toBe('SHP-800');
      expect(entity.type).toBe('SHIPMENT');
      expect(entity.attributes.carrier).toBe('Maersk Logistics');
      expect(entity.attributes.delayDays).toBe(3);
      expect(entity.attributes.freightCost).toBe(4500);
      expect(entity.status).toBe('IN_TRANSIT');
    });

    it('maps Supplier and Product entities to TwinEntities', () => {
      const supplier: any = {
        id: 'SUP-101',
        name: 'Apex Microelectronics',
        contactEmail: 'contact@apex.com',
        rating: 4.8,
        status: 'ACTIVE',
        riskScore: 22,
        leadTime: 21,
        otif: 96.5,
        tenantId: TENANT_A,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const prod: any = {
        id: 'PROD-001',
        name: 'Quantum Sensor IC',
        sku: 'Q-SENS-01',
        description: 'High precision sensor',
        category: 'Semiconductors',
        unitPrice: 120,
        costPrice: 45,
        reorderPoint: 200,
        safetyStock: 100,
        leadTime: 30,
        tenantId: TENANT_A,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const supEntity = canonicalEntityMapper.fromSupplier(supplier, TENANT_A);
      const prodEntity = canonicalEntityMapper.fromProduct(prod, TENANT_A);

      expect(supEntity.id).toBe('SUP-101');
      expect(supEntity.type).toBe('SUPPLIER');
      expect(supEntity.attributes.otif).toBe(96.5);

      expect(prodEntity.id).toBe('PROD-001');
      expect(prodEntity.type).toBe('PRODUCT');
      expect(prodEntity.attributes.sku).toBe('Q-SENS-01');
    });
  });

  describe('2. Multi-Relational Directed Graph Traversal & Cycle Detection', () => {
    it('constructs a supply chain network graph and performs upstream dependency traversal', () => {
      // Setup network: SUP-1 -> PO-1 -> SHP-1 -> WH-1 -> INV-1
      graphEngine.addEntity({ id: 'SUP-1', type: 'SUPPLIER', name: 'Apex', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'PO-1', type: 'PURCHASE_ORDER', name: 'PO 100', tenantId: TENANT_A, status: 'CONFIRMED', attributes: {} });
      graphEngine.addEntity({ id: 'SHP-1', type: 'SHIPMENT', name: 'Shipment 1', tenantId: TENANT_A, status: 'IN_TRANSIT', attributes: {} });
      graphEngine.addEntity({ id: 'WH-1', type: 'WAREHOUSE', name: 'Central Hub', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'INV-1', type: 'INVENTORY', name: 'Inventory Stock', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });

      // Edges: SUP-1 supplies PO-1, PO-1 fulfilled by SHP-1, SHP-1 arrives at WH-1, WH-1 stores INV-1
      graphEngine.addRelationship({ sourceId: 'SUP-1', targetId: 'PO-1', type: 'SUPPLIES', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'PO-1', targetId: 'SHP-1', type: 'DEPENDS_ON', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'SHP-1', targetId: 'WH-1', type: 'SHIPS_TO', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'WH-1', targetId: 'INV-1', type: 'STORED_AT', tenantId: TENANT_A });

      // Check downstream dependencies from supplier: all should be reachable
      const downstream = graphEngine.getDownstreamDependencies('SUP-1');
      expect(downstream).toContain('PO-1');
      expect(downstream).toContain('SHP-1');
      expect(downstream).toContain('WH-1');
      expect(downstream).toContain('INV-1');

      // Check upstream dependencies from inventory: all parent chain should be reachable
      const upstream = graphEngine.getUpstreamDependencies('INV-1');
      expect(upstream).toContain('WH-1');
      expect(upstream).toContain('SHP-1');
      expect(upstream).toContain('PO-1');
      expect(upstream).toContain('SUP-1');
    });

    it('detects circular dependencies in the graph accurately', () => {
      graphEngine.addEntity({ id: 'FAC-A', type: 'MANUFACTURING_SITE', name: 'Site A', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'FAC-B', type: 'MANUFACTURING_SITE', name: 'Site B', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'FAC-C', type: 'MANUFACTURING_SITE', name: 'Site C', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });

      graphEngine.addRelationship({ sourceId: 'FAC-A', targetId: 'FAC-B', type: 'DEPENDS_ON', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'FAC-B', targetId: 'FAC-C', type: 'DEPENDS_ON', tenantId: TENANT_A });
      expect(graphEngine.detectCycles().hasCycle).toBe(false);

      // Create cycle: C -> A
      graphEngine.addRelationship({ sourceId: 'FAC-C', targetId: 'FAC-A', type: 'DEPENDS_ON', tenantId: TENANT_A });
      const cycleResult = graphEngine.detectCycles();
      expect(cycleResult.hasCycle).toBe(true);
      expect(cycleResult.cycles.length).toBeGreaterThan(0);
    });
  });

  describe('3. Twin Reconciliation Engine (Discrepancy Detection Without Silent Mutation)', () => {
    it('detects MISSING, CONFLICT, and ORPHAN entities between digital twin and transactional records', () => {
      // Twin state has SUP-1, PO-1
      const twinEntities: TwinEntity[] = [
        { id: 'SUP-1', type: 'SUPPLIER', name: 'Apex', tenantId: TENANT_A, status: 'ACTIVE', attributes: { otif: 90 } },
        { id: 'PO-1', type: 'PURCHASE_ORDER', name: 'PO 100', tenantId: TENANT_A, status: 'CONFIRMED', attributes: { totalAmount: 5000 } },
        { id: 'SHP-ORPHAN', type: 'SHIPMENT', name: 'Orphan Shp', tenantId: TENANT_A, status: 'IN_TRANSIT', attributes: { poId: 'PO-NON-EXISTENT' } }
      ];

      // Authoritative transactional state has SUP-1 (with different otif), and a new PO-2
      const authoritativeRecords = [
        { id: 'SUP-1', type: 'SUPPLIER', name: 'Apex', tenantId: TENANT_A, status: 'ACTIVE', attributes: { otif: 98 } },
        { id: 'PO-2', type: 'PURCHASE_ORDER', name: 'PO 200', tenantId: TENANT_A, status: 'CONFIRMED', attributes: { totalAmount: 12000 } }
      ];

      const discrepancies = twinReconciliationEngine.reconcile(TENANT_A, twinEntities, authoritativeRecords);
      expect(discrepancies.length).toBeGreaterThan(0);

      const conflict = discrepancies.find(d => d.type === 'CONFLICT');
      expect(conflict).toBeDefined();
      expect(conflict?.entityId).toBe('SUP-1');
      expect(conflict?.field).toBe('otif');

      const missing = discrepancies.find(d => d.type === 'MISSING');
      expect(missing).toBeDefined();
      expect(missing?.entityId).toBe('PO-2');

      const orphan = discrepancies.find(d => d.type === 'ORPHAN');
      expect(orphan).toBeDefined();
      expect(orphan?.entityId).toBe('SHP-ORPHAN');
    });
  });

  describe('4. Deterministic Snapshot Creation & Tamper Detection', () => {
    it('creates an immutable snapshot with deterministic SHA-256 checksum and verifies integrity', () => {
      const entities: TwinEntity[] = [
        { id: 'E-1', type: 'SUPPLIER', name: 'S1', tenantId: TENANT_A, status: 'ACTIVE', attributes: { score: 95 } },
        { id: 'E-2', type: 'INVENTORY', name: 'I1', tenantId: TENANT_A, status: 'ACTIVE', attributes: { onHand: 500 } }
      ];
      const relationships: TwinRelationship[] = [
        { sourceId: 'E-1', targetId: 'E-2', type: 'SUPPLIES', tenantId: TENANT_A }
      ];

      const snapshot = twinSnapshotEngine.createSnapshot(TENANT_A, 'TWIN-01', entities, relationships);
      expect(snapshot.id).toBeDefined();
      expect(snapshot.checksum).toBeDefined();
      expect(snapshot.entityCount).toBe(2);
      expect(snapshot.relationshipCount).toBe(1);

      // Verify integrity
      const isClean = twinSnapshotEngine.verifySnapshotIntegrity(snapshot);
      expect(isClean).toBe(true);

      // If snapshot data is tampered with, integrity verification must fail
      const tamperedSnapshot = {
        ...snapshot,
        entities: Array.isArray(snapshot.entities)
          ? [
              ...snapshot.entities,
              { id: 'E-TAMPERED', type: 'INVENTORY' as const, name: 'Fake', tenantId: TENANT_A, status: 'ACTIVE' as const, attributes: {} }
            ]
          : {
              ...snapshot.entities,
              'E-TAMPERED': { id: 'E-TAMPERED', type: 'INVENTORY' as const, name: 'Fake', tenantId: TENANT_A, status: 'ACTIVE' as const, attributes: {} }
            }
      };
      const isTampered = twinSnapshotEngine.verifySnapshotIntegrity(tamperedSnapshot as any);
      expect(isTampered).toBe(false);
    });
  });

  describe('5. Temporal State Engine', () => {
    it('segregates current, historical, and projected states cleanly', () => {
      const currentEntity: TwinEntity = { id: 'SKU-01', type: 'INVENTORY', name: 'Sensor', tenantId: TENANT_A, status: 'ACTIVE', attributes: { onHand: 100 } };
      const projectedEntity: TwinEntity = { id: 'SKU-01', type: 'INVENTORY', name: 'Sensor', tenantId: TENANT_A, status: 'ACTIVE', attributes: { onHand: 40 } };

      temporalStateEngine.saveState(TENANT_A, 'CURRENT_STATE', [currentEntity]);
      temporalStateEngine.saveState(TENANT_A, 'PROJECTED_STATE', [projectedEntity], 'SCENARIO-SURGE-01');

      const current = temporalStateEngine.getState(TENANT_A, 'CURRENT_STATE');
      const projected = temporalStateEngine.getState(TENANT_A, 'PROJECTED_STATE', 'SCENARIO-SURGE-01');

      expect(current[0].attributes.onHand).toBe(100);
      expect(projected[0].attributes.onHand).toBe(40);
    });
  });

  describe('6. Scenario Engine & 12 Archetypes', () => {
    it('creates and validates all 12 scenario archetypes with explicit provenance assumptions', () => {
      const archetypes: ScenarioType[] = [
        'SUPPLIER_OUTAGE', 'DEMAND_SURGE', 'PORT_CONGESTION', 'CARRIER_BANKRUPTCY',
        'FACTORY_SHUTDOWN', 'INVENTORY_SPOILAGE', 'COST_SHOCK', 'LEAD_TIME_EXPANSION',
        'BORDER_CLOSURE', 'CURRENCY_VOLATILITY', 'CYBER_INCIDENT', 'CUSTOM'
      ];

      for (const archetype of archetypes) {
        const assumptions: ScenarioAssumption[] = [
          {
            id: `ASSUMP-${archetype}-1`,
            description: `Primary assumption for ${archetype}`,
            source: 'SYSTEM',
            confidence: 0.95,
            parameter: 'durationDays',
            baselineValue: 0,
            assumedValue: 14
          }
        ];

        const scenario = scenarioEngine.createScenario(
          TENANT_A,
          `Scenario for ${archetype}`,
          `Simulating ${archetype} event`,
          archetype,
          { severity: 0.8, durationDays: 14 },
          assumptions,
          'user-admin'
        );

        expect(scenario.id).toBeDefined();
        expect(scenario.type).toBe(archetype);
        expect(scenario.status).toBe('READY');
        expect(scenario.assumptions[0].source).toBe('SYSTEM');
      }
    });

    it('rejects scenario with invalid severity parameters', () => {
      expect(() => {
        scenarioEngine.createScenario(
          TENANT_A,
          'Invalid Scenario',
          'Testing bounds',
          'SUPPLIER_OUTAGE',
          { severity: 1.5, durationDays: 10 } // severity > 1.0 is invalid
        );
      }).toThrow();
    });
  });

  describe('7. What-If Sensitivity Planner', () => {
    it('computes sensitivity impact of continuous parameter shifts deterministically', () => {
      const baselineState = {
        totalInventoryValue: 1000000,
        averageLeadTimeDays: 20,
        dailyCarryingCostRate: 0.0005,
        averageStockoutRisk: 0.12
      };

      const plan = whatIfPlanner.evaluateSensitivity(baselineState, {
        demandMultiplier: 1.3,       // +30% demand
        leadTimeIncreaseDays: 10,    // +10 days lead time
        costIncreaseRate: 0.15       // +15% cost inflation
      });

      expect(plan.projectedInventoryValue).toBeGreaterThan(baselineState.totalInventoryValue);
      expect(plan.projectedStockoutRisk).toBeGreaterThan(baselineState.averageStockoutRisk);
      expect(plan.projectedLeadTimeDays).toBe(30);
    });
  });

  describe('8. 9-Vector Scenario Impact Engine', () => {
    it('evaluates impact across all 9 dimensions comprehensively', () => {
      const params: ScenarioParameters = {
        severity: 0.75,
        durationDays: 30,
        affectedEntityIds: ['SUP-ACME', 'PROD-CHIP-1']
      };

      const impact = scenarioImpactEngine.calculate9VectorImpact(TENANT_A, 'SUPPLIER_OUTAGE', params, {
        inventoryValue: 500000,
        unfulfilledOrdersCount: 45,
        dailyRevenue: 25000,
        baselineOTIF: 95.0
      });

      expect(impact.inventory.stockoutRiskScore).toBeGreaterThan(0.5);
      expect(impact.serviceLevel.projectedOTIF).toBeLessThan(95.0);
      expect(impact.supplier.affectedSupplierCount).toBeGreaterThanOrEqual(1);
      expect(impact.transportation.estimatedDelayDays).toBeGreaterThan(0);
      expect(impact.warehouse.capacityUtilizationRisk).toBeDefined();
      expect(impact.workingCapital.impactAmount).toBeGreaterThan(0);
      expect(impact.financialExposure.revenueAtRisk).toBeGreaterThan(0);
      expect(impact.customer.impactedOrderCount).toBeGreaterThan(0);
      expect(impact.resilience.compositeFragilityScore).toBeGreaterThan(0);
    });
  });

  describe('9. KPI Projection Engine', () => {
    it('projects future OTIF, fill rate, inventory days, and freight costs deterministically', () => {
      const projections = kpiProjectionEngine.projectKPIs({
        horizonDays: 60,
        baselineOTIF: 96.0,
        baselineFillRate: 98.0,
        baselineInventoryDays: 45,
        baselineFreightCostPerUnit: 12.5,
        disruptionSeverity: 0.6,
        disruptionDurationDays: 20
      });

      expect(projections.timeline.length).toBe(60);
      // Disruption should show a dip in OTIF during the disruption period
      const day15 = projections.timeline[14];
      expect(day15.projectedOTIF).toBeLessThan(96.0);
      // Post disruption recovery
      const day55 = projections.timeline[54];
      expect(day55.projectedOTIF).toBeGreaterThan(day15.projectedOTIF);
    });
  });

  describe('10. Twin Risk Propagation Engine', () => {
    it('traces multi-tier contagion risk from supplier disruption down to customer orders', () => {
      // Setup graph: Tier 2 Supplier -> Tier 1 Supplier -> Component -> Assembly -> Customer Order
      graphEngine.addEntity({ id: 'SUP-T2', type: 'SUPPLIER', name: 'Raw Silicon', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'SUP-T1', type: 'SUPPLIER', name: 'Chipmaker', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'PROD-CHIP', type: 'PRODUCT', name: 'Microcontroller', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'PROD-DEV', type: 'PRODUCT', name: 'Medical Monitor', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });
      graphEngine.addEntity({ id: 'ORD-CUST-1', type: 'SALES_ORDER', name: 'Hospital PO', tenantId: TENANT_A, status: 'ACTIVE', attributes: {} });

      graphEngine.addRelationship({ sourceId: 'SUP-T2', targetId: 'SUP-T1', type: 'SUPPLIES', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'SUP-T1', targetId: 'PROD-CHIP', type: 'SUPPLIES', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'PROD-CHIP', targetId: 'PROD-DEV', type: 'PART_OF', tenantId: TENANT_A });
      graphEngine.addRelationship({ sourceId: 'PROD-DEV', targetId: 'ORD-CUST-1', type: 'FULFILLS', tenantId: TENANT_A });

      const propagation = twinRiskPropagationEngine.propagateRisk(
        graphEngine,
        'SUP-T2',
        0.9, // 90% severe shock at Tier 2
        0.8  // attenuation dampener
      );

      expect(propagation.affectedEntities.length).toBe(5);
      expect(propagation.blastRadiusScore).toBeGreaterThan(0);
      // Upstream origin has highest risk
      const supT2Risk = propagation.entityRiskScores['SUP-T2'];
      const custOrdRisk = propagation.entityRiskScores['ORD-CUST-1'];
      expect(supT2Risk).toBe(0.9);
      expect(custOrdRisk).toBeLessThan(supT2Risk); // Attenuated downstream
      expect(custOrdRisk).toBeGreaterThan(0);       // But still impacted
    });
  });

  describe('11. Deterministic Simulation Execution & Zero Mutation Invariant', () => {
    it('runs simulation deterministically with zero mutations to baseline twin snapshot', async () => {
      const entities: TwinEntity[] = [
        { id: 'SUP-ALPHA', type: 'SUPPLIER', name: 'Alpha Foundry', tenantId: TENANT_A, status: 'ACTIVE', attributes: { otif: 95 } },
        { id: 'INV-BETA', type: 'INVENTORY', name: 'Microchips', tenantId: TENANT_A, status: 'ACTIVE', attributes: { onHand: 1000, reserved: 200 } }
      ];
      const relationships: TwinRelationship[] = [
        { sourceId: 'SUP-ALPHA', targetId: 'INV-BETA', type: 'SUPPLIES', tenantId: TENANT_A }
      ];

      const baselineSnapshot = twinSnapshotEngine.createSnapshot(TENANT_A, 'TWIN-SIM-01', entities, relationships);
      const originalChecksum = baselineSnapshot.checksum;

      const scenario = scenarioEngine.createScenario(
        TENANT_A,
        'Simulation Test Surge',
        'Testing zero mutation invariant',
        'DEMAND_SURGE',
        { severity: 0.8, durationDays: 30, demandSurgePercent: 50 }
      );

      // Run simulation twice with same parameters to guarantee determinism
      const run1 = await simulationEngine.runSimulation(TENANT_A, scenario, baselineSnapshot);
      const run2 = await simulationEngine.runSimulation(TENANT_A, scenario, baselineSnapshot);

      expect(run1.simulationResult.projectedCost).toBe(run2.simulationResult.projectedCost);
      expect(run1.simulationResult.decisionOptions.length).toBeGreaterThanOrEqual(3);
      expect(run1.simulationResult.decisionOptions.map(d => d.id)).toEqual(run2.simulationResult.decisionOptions.map(d => d.id));

      // Verify ZERO mutation to baseline snapshot
      expect(baselineSnapshot.checksum).toBe(originalChecksum);
      const invEntity = Array.isArray(baselineSnapshot.entities)
        ? (baselineSnapshot.entities as any)[1]
        : (baselineSnapshot.entities as any)['INV-BETA'];
      expect(invEntity.attributes.onHand).toBe(1000);
    });
  });

  describe('12. Scenario Comparison Matrix', () => {
    it('compares multiple scenario results side-by-side and determines optimal decision option', () => {
      const scenarioA = scenarioEngine.createScenario(TENANT_A, 'Option A: Expedite Air', 'Fast air freight', 'PORT_CONGESTION', { severity: 0.5, durationDays: 14 });
      const scenarioB = scenarioEngine.createScenario(TENANT_A, 'Option B: Dual Source', 'Local backup supplier', 'PORT_CONGESTION', { severity: 0.5, durationDays: 14 });

      const resA = {
        scenarioId: scenarioA.id,
        projectedCost: 85000,
        projectedOTIF: 94.5,
        projectedLeadTimeDays: 8,
        residualRiskScore: 0.25,
        decisionOption: { id: 'OPT-AIR', title: 'Expedite Air', type: 'EXPEDITE_FREIGHT' }
      };

      const resB = {
        scenarioId: scenarioB.id,
        projectedCost: 120000,
        projectedOTIF: 92.0,
        projectedLeadTimeDays: 15,
        residualRiskScore: 0.45,
        decisionOption: { id: 'OPT-DUAL', title: 'Dual Source', type: 'ACTIVATE_DUAL_SOURCE' }
      };

      const comparison = scenarioComparisonEngine.compare([resA, resB]);
      expect(comparison.scenarios.length).toBe(2);
      expect(comparison.recommendedOptionId).toBe('OPT-AIR'); // Cheaper, better OTIF, lower risk
      expect(comparison.tradeOffMatrix).toBeDefined();
    });
  });

  describe('13. Governed Scenario-to-Workflow Bridge', () => {
    it('bridges an approved scenario decision option into a governed Wave 7 workflow', async () => {
      const decisionOption = {
        id: 'DEC-OPT-EXPEDITE',
        title: 'Expedite Critical Shipments via Air Freight',
        type: 'EXPEDITE_FREIGHT' as const,
        estimatedCost: 15000,
        estimatedOTIFGain: 12.5,
        implementationDays: 2,
        actionPayload: {
          shipmentIds: ['SHP-901', 'SHP-902'],
          carrier: 'FedEx Express',
          maxBudget: 20000
        },
        riskLevel: 'MEDIUM' as const
      };

      const workflowDefinition = scenarioWorkflowBridge.createWorkflowFromDecision(
        TENANT_A,
        'SCENARIO-CONGESTION-01',
        decisionOption,
        'user-logistics-lead'
      );

      expect((workflowDefinition as any).id || workflowDefinition.workflowId).toBeDefined();
      expect(workflowDefinition.tenantId).toBe(TENANT_A);
      expect(workflowDefinition.name).toContain('Expedite Critical Shipments');
      expect(workflowDefinition.autonomyLevel).toBe('LEVEL_3_APPROVAL_REQUIRED'); // Material cost requires Level 3 approval
      expect(workflowDefinition.steps.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('14. Outcome Evaluation (Projected vs Actuals)', () => {
    it('calculates variance between scenario projection and actual execution outcome', () => {
      const outcome = scenarioOutcomeEvaluationEngine.evaluateOutcome(TENANT_A, {
        scenarioId: 'SCENARIO-99',
        runId: 'RUN-01',
        projectedCost: 50000,
        actualCost: 52000,
        projectedOTIF: 92.0,
        actualOTIF: 91.5,
        projectedLeadTimeDays: 10,
        actualLeadTimeDays: 11
      });

      expect(outcome.costVariancePercent).toBeCloseTo(4.0, 1);
      expect(outcome.otifVariancePercent).toBeCloseTo(-0.54, 1);
      expect(outcome.accuracyScore).toBeGreaterThan(0.9);
      expect(outcome.modelCalibrationRecommended).toBe(false); // < 10% error, no recalibration needed
    });
  });

  describe('15. Twin Health Engine & Deterministic Event Replay', () => {
    it('assesses twin health accurately based on entity freshness, discrepancy rate, and sync latency', () => {
      const health = twinHealthEngine.evaluateHealth({
        totalEntities: 1000,
        staleEntitiesCount: 15,
        discrepanciesCount: 5,
        lastSyncTimestamp: new Date().toISOString(),
        activeAnomaliesCount: 0
      });

      expect(health.status).toBe('HEALTHY');
      expect(health.freshnessScore).toBeGreaterThan(0.95);
    });

    it('replays historical events without side effects to reconstruct state at point-in-time', () => {
      const baseEntities: TwinEntity[] = [
        { id: 'INV-1', type: 'INVENTORY', name: 'Item 1', tenantId: TENANT_A, status: 'ACTIVE', attributes: { onHand: 100 } }
      ];

      const eventLog = [
        { eventId: 'EVT-1', timestamp: '2026-03-01T10:00:00Z', type: 'INVENTORY_REDUCED', entityId: 'INV-1', payload: { delta: -20 } },
        { eventId: 'EVT-2', timestamp: '2026-03-01T12:00:00Z', type: 'INVENTORY_REDUCED', entityId: 'INV-1', payload: { delta: -30 } },
        { eventId: 'EVT-3', timestamp: '2026-03-01T15:00:00Z', type: 'INVENTORY_REDUCED', entityId: 'INV-1', payload: { delta: -10 } }
      ];

      // Replay up to 12:30:00Z: should include EVT-1 and EVT-2, but exclude EVT-3
      const replayedState = twinEventReplayEngine.replayToTimestamp(
        baseEntities,
        eventLog,
        '2026-03-01T12:30:00Z'
      );

      expect(replayedState[0].attributes.onHand).toBe(50); // 100 - 20 - 30 = 50
    });
  });
});
