/**
 * ORION-9 SCM CONTROL TOWER — INTEGRATION & GOVERNANCE TEST SUITE
 * Validates the complete 16-stage Control Tower nervous system:
 * EVENT -> SIGNAL -> EXCEPTION -> CONTEXT -> ROOT CAUSE -> RISK -> PREDICTION ->
 * DECISION OPTIONS -> RECOMMENDATION -> POLICY -> APPROVAL -> KERNEL -> ACTION ->
 * OUTCOME -> LEARNING
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { controlTowerKpiService } from '../../services/controltower/ControlTowerKpiService';
import { controlTowerBridge } from '../../services/controltower/ControlTowerBridge';
import { exceptionWorkbenchService } from '../../services/controltower/ExceptionWorkbenchService';
import { controlTowerRiskIntegrator } from '../../services/controltower/ControlTowerRiskIntegrator';
import { ScmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { signalEngine } from '../../intelligence/SignalEngine';
import { eventIntelligenceEngine } from '../../intelligence/EventIntelligenceEngine';
import { exceptionEngine } from '../../intelligence/ExceptionEngine';
import { supplyChainRiskGraph } from '../../intelligence/SupplyChainRiskGraph';
import { rootCauseEngine } from '../../intelligence/RootCauseEngine';
import { predictionEngine } from '../../intelligence/PredictionEngine';
import { decisionOptionEngine } from '../../intelligence/DecisionOptionEngine';
import { decisionReplayEngine } from '../../intelligence/DecisionReplayEngine';
import { outcomeIntelligence } from '../../intelligence/OutcomeIntelligence';
import { EventEnvelope } from '../../kernel/types';

describe('ORION-9 SCM CONTROL TOWER — INTEGRATION & GOVERNANCE', () => {
  const TENANT_A = 'tenant-control-tower-alpha';
  const TENANT_B = 'tenant-control-tower-beta';
  const persistence = ScmPersistenceService.getInstance();

  beforeEach(async () => {
    persistence.clear();
    controlTowerKpiService.reset();
    controlTowerBridge.reset();
    exceptionWorkbenchService.reset();
    signalEngine.reset();
    eventIntelligenceEngine.reset();
    exceptionEngine.reset();
    supplyChainRiskGraph.reset();
    rootCauseEngine.reset();
    predictionEngine.reset();
    decisionReplayEngine.reset();
    outcomeIntelligence.reset();
  });

  // =========================================================================
  // 1. AUTHORITATIVE KPI SERVICE & MULTI-DOMAIN EVALUATION
  // =========================================================================
  describe('Stage 1: Governed KPI Service', () => {
    it('computes authoritative domain KPIs directly from SCM persistence records', async () => {
      // Seed Tenant A POs
      await persistence.saveRecord('purchase_orders', 'PO-101', {
        id: 'PO-101',
        tenantId: TENANT_A,
        totalValue: 50000,
        status: 'CONFIRMED',
        supplierId: 'SUP-01',
        createdAt: new Date().toISOString(),
      });
      await persistence.saveRecord('purchase_orders', 'PO-102', {
        id: 'PO-102',
        tenantId: TENANT_A,
        totalValue: 30000,
        status: 'RELEASED',
        supplierId: 'SUP-02',
        createdAt: new Date().toISOString(),
      });

      // Seed Tenant A Shipments
      await persistence.saveRecord('shipments', 'SHP-201', {
        id: 'SHP-201',
        tenantId: TENANT_A,
        status: 'In Transit',
        delayDays: 0,
      });
      await persistence.saveRecord('shipments', 'SHP-202', {
        id: 'SHP-202',
        tenantId: TENANT_A,
        status: 'Delayed',
        delayDays: 4,
      });

      // Seed Tenant A Inventory
      await persistence.saveRecord('inventory', 'INV-301', {
        id: 'INV-301',
        tenantId: TENANT_A,
        onHand: 100,
        safetyStock: 50,
        unitCost: 200,
        dailyDemand: 10,
      });
      await persistence.saveRecord('inventory', 'INV-302', {
        id: 'INV-302',
        tenantId: TENANT_A,
        onHand: 5,
        safetyStock: 50,
        unitCost: 150,
        dailyDemand: 10,
      });

      // Seed Tenant A Suppliers
      await persistence.saveRecord('suppliers', 'SUP-01', {
        id: 'SUP-01',
        tenantId: TENANT_A,
        name: 'Apex Precision',
        status: 'Active',
        otif: 96,
        riskLevel: 'Low',
      });
      await persistence.saveRecord('suppliers', 'SUP-02', {
        id: 'SUP-02',
        tenantId: TENANT_A,
        name: 'Titan Logistics',
        status: 'Active',
        otif: 82,
        riskLevel: 'High',
      });

      const kpis = await controlTowerKpiService.computeDomainKpis(TENANT_A);
      expect(kpis.length).toBeGreaterThanOrEqual(8);

      const spendKpi = kpis.find((k) => k.code === 'PO_COMMITTED_SPEND');
      expect(spendKpi?.currentValue).toBe(80000);

      const transitKpi = kpis.find((k) => k.code === 'ON_TIME_TRANSIT_RATE');
      expect(transitKpi?.currentValue).toBe(50.0);
      expect(transitKpi?.status).toBe('CRITICAL');

      const stockoutKpi = kpis.find((k) => k.code === 'STOCKOUT_RISK_SKU_COUNT');
      expect(stockoutKpi?.currentValue).toBe(1);

      const otifKpi = kpis.find((k) => k.code === 'SUPPLIER_AVERAGE_OTIF');
      expect(otifKpi?.currentValue).toBe(89.0);
      expect(otifKpi?.status).toBe('WATCH');
    });

    it('enforces strict tenant isolation on KPI calculation', async () => {
      // Seed Tenant A record
      await persistence.saveRecord('purchase_orders', 'PO-A', {
        id: 'PO-A',
        tenantId: TENANT_A,
        totalValue: 100000,
        status: 'CONFIRMED',
      });

      // Seed Tenant B record
      await persistence.saveRecord('purchase_orders', 'PO-B', {
        id: 'PO-B',
        tenantId: TENANT_B,
        totalValue: 500000,
        status: 'CONFIRMED',
      });

      const kpisA = await controlTowerKpiService.computeDomainKpis(TENANT_A);
      const spendA = kpisA.find((k) => k.code === 'PO_COMMITTED_SPEND');
      expect(spendA?.currentValue).toBe(100000);

      const kpisB = await controlTowerKpiService.computeDomainKpis(TENANT_B);
      const spendB = kpisB.find((k) => k.code === 'PO_COMMITTED_SPEND');
      expect(spendB?.currentValue).toBe(500000);
    });

    it('generates multi-domain operational snapshots with history retention', async () => {
      const snapshot = await controlTowerKpiService.generateOperationalSnapshot(TENANT_A, 2, 1, 3);
      expect(snapshot.tenantId).toBe(TENANT_A);
      expect(snapshot.healthScore).toBeGreaterThan(0);
      expect(snapshot.domainSummaries.procurement).toBeDefined();
      expect(snapshot.domainSummaries.logistics).toBeDefined();
      expect(snapshot.domainSummaries.inventory).toBeDefined();

      const history = controlTowerKpiService.getSnapshotHistory(TENANT_A);
      expect(history.length).toBe(1);
    });
  });

  // =========================================================================
  // 2. REAL-TIME EVENT BRIDGE & OPERATIONAL SLA MONITORS
  // =========================================================================
  describe('Stage 2: Event Bridge & SLA Governance', () => {
    it('ingests live SCM domain events and triggers calibrated signals', async () => {
      const event: EventEnvelope = {
        eventId: 'EVT-CORR-01',
        eventType: 'SHIPMENT_DELAYED',
        aggregateId: 'SHP-900',
        aggregateType: 'SHIPMENT',
        timestamp: new Date().toISOString(),
        version: '2.0',
        tenant: { organizationId: TENANT_A },
        payload: {
          shipmentId: 'SHP-900',
          delayDays: 5,
        },
      };

      const result = await controlTowerBridge.handleIncomingEvent(event);
      expect(result.correlatedSignals.length).toBeGreaterThan(0);
      expect(result.generatedExceptions.length).toBeGreaterThan(0);
    });

    it('evaluates operational SLAs and flags breached transactions', async () => {
      // Seed a PO created 60 hours ago that is still unconfirmed (SLA is 48h)
      const oldDate = new Date(Date.now() - 60 * 3600 * 1000).toISOString();
      await persistence.saveRecord('purchase_orders', 'PO-STALE-1', {
        id: 'PO-STALE-1',
        tenantId: TENANT_A,
        status: 'SUBMITTED',
        createdAt: oldDate,
        totalValue: 25000,
      });

      const slas = await controlTowerBridge.evaluateOperationalSlas(TENANT_A);
      const poSla = slas.find((s) => s.entityType === 'PURCHASE_ORDER');
      expect(poSla).toBeDefined();
      expect(poSla?.status).toBe('BREACHED');
      expect(poSla?.activeBreachCount).toBe(1);
      expect(poSla?.breachedEntityIds).toContain('PO-STALE-1');
    });
  });

  // =========================================================================
  // 3. TOPOLOGICAL RISK GRAPH INTEGRATION
  // =========================================================================
  describe('Stage 3: Topological Risk Propagation', () => {
    it('synchronizes SCM network topology and propagates risk downstream', async () => {
      await persistence.saveRecord('suppliers', 'SUP-RISK-01', {
        id: 'SUP-RISK-01',
        tenantId: TENANT_A,
        name: 'Vulnerable Silicon Fab',
        riskLevel: 'High',
        otif: 70,
      });

      await persistence.saveRecord('purchase_orders', 'PO-CRIT-01', {
        id: 'PO-CRIT-01',
        tenantId: TENANT_A,
        supplierId: 'SUP-RISK-01',
        totalValue: 90000,
      });

      const { nodeCount, edgeCount } = await controlTowerRiskIntegrator.syncNetworkTopology(TENANT_A);
      expect(nodeCount).toBeGreaterThanOrEqual(3); // Supplier + Hub + Plant
      expect(edgeCount).toBeGreaterThanOrEqual(2); // Supplier->Hub, Hub->Plant

      const { highRiskNodes, nodes } = await controlTowerRiskIntegrator.evaluateSystemicRisk(TENANT_A);
      expect(nodes.length).toBeGreaterThanOrEqual(3);
      expect(highRiskNodes.length).toBeGreaterThan(0);
    });
  });

  // =========================================================================
  // 4. EXCEPTION WORKBENCH & GOVERNED KERNEL ACTION EXECUTION
  // =========================================================================
  describe('Stage 4: Exception-to-Action Workbench', () => {
    it('manages exception lifecycle from ingestion to Kernel-governed resolution', async () => {
      // 1. Ingest exception into workbench
      const item = await exceptionWorkbenchService.createWorkbenchItem(TENANT_A, {
        exceptionId: 'EXC-TURBINE-01',
        tenantId: TENANT_A,
        summary: 'Turbine Hub Logistics Delay',
        type: 'SHIPMENT_DELAY',
        category: 'LOGISTICS',
        severity: 'CRITICAL',
        status: 'OPEN',
        entityReferences: [{ entityType: 'SHIPMENT', entityId: 'SHP-TURBINE' }],
        slaMinutes: 120,
        financialImpact: 60000,
        detectedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      expect(item.status).toBe('OPEN');

      // 2. Investigate and formulate decision options
      const actor = { 
        id: 'usr-lead-01', 
        type: 'USER', 
        name: 'Lead Operations Director',
        roles: ['operations_director'],
        organizationId: TENANT_A,
      };
      const investigated = await exceptionWorkbenchService.investigateAndFormulate(TENANT_A, item.id, actor);

      expect(investigated.status).toBe('PROPOSAL_PENDING');
      expect(investigated.rootCause).toBeDefined();
      expect(investigated.decisionOptions.length).toBeGreaterThan(0);

      // 3. Execute Governed Action through Kernel
      const chosenOption = investigated.decisionOptions[0];
      const { item: resolved, commandResult } = await exceptionWorkbenchService.executeGovernedAction(
        TENANT_A,
        item.id,
        chosenOption.optionId,
        actor
      );

      expect(commandResult.success).toBe(true);
      expect(resolved.status).toBe('RESOLVED');
      expect(resolved.executionResult?.success).toBe(true);

      // 4. Close item
      const closed = await exceptionWorkbenchService.closeItem(TENANT_A, item.id, actor);
      expect(closed.status).toBe('CLOSED');
      expect(closed.history.length).toBeGreaterThanOrEqual(4);
    });

    it('rejects action execution if actor identity is missing or unauthenticated', async () => {
      const item = await exceptionWorkbenchService.createWorkbenchItem(TENANT_A, {
        exceptionId: 'EXC-FAIL-01',
        tenantId: TENANT_A,
        summary: 'Unauthorized Attempt',
        type: 'STOCKOUT_RISK',
        category: 'INVENTORY',
        severity: 'HIGH',
        status: 'OPEN',
        entityReferences: [],
        slaMinutes: 60,
        financialImpact: 10000,
        detectedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });

      const validActor = { 
        id: 'usr-01', 
        type: 'USER', 
        name: 'Valid User',
        roles: ['operations_director'],
        organizationId: TENANT_A,
      };
      await exceptionWorkbenchService.investigateAndFormulate(TENANT_A, item.id, validActor);

      // Execute with empty actor
      const emptyActor = { 
        id: '', 
        type: 'USER', 
        name: '',
        roles: [],
        organizationId: TENANT_A,
      };
      const result = await exceptionWorkbenchService.executeGovernedAction(
        TENANT_A,
        item.id,
        item.decisionOptions[0].optionId,
        emptyActor
      );

      expect(result.commandResult.success).toBe(false);
      expect(result.item.status).toBe('PROPOSAL_PENDING');
    });
  });

  // =========================================================================
  // 5. FULL 16-STAGE END-TO-END CONTROL TOWER JOURNEY
  // =========================================================================
  describe('Full 16-Stage End-to-End Control Tower Journey', () => {
    it('executes the full closed loop from SCM domain event to empirical learning replay', async () => {
      // 1. SCM Telemetry Event
      const incomingEvent: EventEnvelope = {
        eventId: 'EVT-E2E-001',
        eventType: 'SHIPMENT_DELAYED',
        aggregateId: 'SHP-CRITICAL-LANE',
        aggregateType: 'SHIPMENT',
        timestamp: new Date().toISOString(),
        version: '2.0',
        tenant: { organizationId: TENANT_A },
        payload: {
          shipmentId: 'SHP-CRITICAL-LANE',
          delayDays: 6,
        },
      };

      // 2. Event Bridge ingestion
      const bridgeResult = await controlTowerBridge.handleIncomingEvent(incomingEvent);
      expect(bridgeResult.correlatedSignals.length).toBeGreaterThan(0);
      expect(bridgeResult.generatedExceptions.length).toBeGreaterThan(0);

      const rawException = bridgeResult.generatedExceptions[0];

      // 3. Exception Workbench Ingestion
      const wbItem = await exceptionWorkbenchService.createWorkbenchItem(
        TENANT_A,
        rawException,
        bridgeResult.correlatedSignals
      );
      expect(wbItem.id).toBeDefined();

      // 4. Investigation & Formulation
      const leadActor = { 
        id: 'usr-chief', 
        type: 'USER', 
        name: 'Chief Supply Chain Officer',
        roles: ['platform_admin', 'operations_director'],
        organizationId: TENANT_A,
      };
      const formulated = await exceptionWorkbenchService.investigateAndFormulate(TENANT_A, wbItem.id, leadActor);
      expect(formulated.decisionOptions.length).toBeGreaterThan(0);

      // 5. Governed Kernel Execution
      const bestOption = formulated.decisionOptions[0];
      const execution = await exceptionWorkbenchService.executeGovernedAction(
        TENANT_A,
        wbItem.id,
        bestOption.optionId,
        leadActor
      );

      expect(execution.commandResult.success).toBe(true);
      expect(execution.item.status).toBe('RESOLVED');

      // 6. Decision Replay Verification
      const timeline = decisionReplayEngine.reconstructTimeline(TENANT_A, `REP-${wbItem.id}`);
      expect(timeline.reconstructedTimeline.length).toBeGreaterThan(0);

      // 7. Authoritative Control Tower KPI Refresh
      const updatedKpis = await controlTowerKpiService.computeDomainKpis(TENANT_A);
      expect(updatedKpis.length).toBeGreaterThan(0);
    });
  });
});
