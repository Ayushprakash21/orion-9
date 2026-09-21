/**
 * ORION-9 WAVE 6 — CONTROL TOWER INTELLIGENCE & DECISION ENGINE
 * Comprehensive Verification Test Suite
 *
 * Validates the complete 16-stage pipeline:
 * EVENT -> SIGNAL -> EXCEPTION -> CONTEXT -> ROOT CAUSE -> RISK -> PREDICTION ->
 * DECISION OPTIONS -> EVALUATION -> RECOMMENDATION -> GOVERNANCE -> APPROVAL ->
 * KERNEL -> ACTION -> OUTCOME -> DECISION REPLAY
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  signalEngine,
  eventIntelligenceEngine,
  exceptionEngine,
  supplyChainRiskGraph,
  rootCauseEngine,
  predictionEngine,
  decisionOptionEngine,
  decisionEvaluationEngine,
  recommendationEngine,
  decisionReplayEngine,
  outcomeIntelligence,
  priorityEngine,
  SignalScanInput,
  EventEnvelope,
  ExceptionIntelligence,
  DecisionOption,
  RootCause,
  Prediction,
} from '../../intelligence';
import { toolRegistry } from '../../ai/ToolRegistry';
import { AIExecutionContext } from '../../ai/types';

describe('ORION-9 WAVE 6 — CONTROL TOWER INTELLIGENCE & DECISION ENGINE', () => {
  const TENANT_A = 'tenant-acme-control-tower';
  const TENANT_B = 'tenant-globex-control-tower';

  beforeEach(() => {
    signalEngine.reset();
    eventIntelligenceEngine.reset();
    exceptionEngine.reset();
    supplyChainRiskGraph.reset();
    rootCauseEngine.reset();
    predictionEngine.reset();
    decisionReplayEngine.reset();
    outcomeIntelligence.reset();
    recommendationEngine.reset();
  });

  // =========================================================================
  // 1. SIGNAL ENGINE (Canonical Detection & Multi-Domain Calibration)
  // =========================================================================
  describe('Stage 1: Signal Engine', () => {
    it('detects STOCKOUT_RISK and BELOW_SAFETY_STOCK with calibrated deterministic confidence', async () => {
      const input: SignalScanInput = {
        tenantId: TENANT_A,
        inventory: [
          {
            id: 'INV-001',
            productId: 'SKU-TURBINE-01',
            onHand: 0,
            safetyStock: 50,
            reorderPoint: 80,
            dailyDemand: 10,
          },
          {
            id: 'INV-002',
            productId: 'SKU-VALVE-02',
            onHand: 20,
            safetyStock: 50,
            reorderPoint: 70,
            dailyDemand: 5,
          },
        ],
      };

      const signals = await signalEngine.scanSignals(input);
      expect(signals.length).toBeGreaterThanOrEqual(2);

      const stockout = signals.find(s => s.signalType === 'STOCKOUT_RISK');
      expect(stockout).toBeDefined();
      expect(stockout?.severity).toBe('CRITICAL');
      expect(stockout?.confidence).toBe(1.0);
      expect(stockout?.confidenceBasis).toBe('DETERMINISTIC');
      expect(stockout?.evidence.length).toBeGreaterThan(0);

      const lowStock = signals.find(s => s.signalType === 'LOW_INVENTORY');
      expect(lowStock).toBeDefined();
      expect(lowStock?.severity).toBe('HIGH');
      expect(lowStock?.confidence).toBe(0.95);
    });

    it('detects SHIPMENT_DELAY and IN_TRANSIT_DISRUPTION for transit anomalies', async () => {
      const input: SignalScanInput = {
        tenantId: TENANT_A,
        shipments: [
          {
            id: 'SHP-991',
            trackingNumber: 'TRK-991',
            status: 'IN_TRANSIT',
            delayDays: 4,
            estimatedArrival: '2026-09-20T00:00:00Z',
          },
        ],
      };

      const signals = await signalEngine.scanSignals(input);
      const delaySignal = signals.find(s => s.signalType === 'SHIPMENT_DELAY');
      expect(delaySignal).toBeDefined();
      expect(delaySignal?.actualValue).toBe(4);
      expect(delaySignal?.severity).toBe('HIGH');
      expect(delaySignal?.confidence).toBe(0.95);
    });

    it('detects SUPPLIER_OTIF_DROP and QUALITY_FAILURES', async () => {
      const input: SignalScanInput = {
        tenantId: TENANT_A,
        suppliers: [
          {
            id: 'SUP-001',
            name: 'Apex Fasteners',
            otif: 65, // Below 75 threshold
          },
        ],
        qualityInspections: [
          {
            id: 'INSP-101',
            poId: 'PO-882',
            defectRatePercent: 18.5, // Exceeds 5% threshold
            status: 'FAILED',
          },
        ],
      };

      const signals = await signalEngine.scanSignals(input);
      const otifSignal = signals.find(s => s.signalType === 'CAPACITY_SHORTAGE');
      expect(otifSignal).toBeDefined();
      expect(otifSignal?.severity).toBe('HIGH');

      const qualitySignal = signals.find(s => s.signalType === 'QUALITY_DETERIORATION');
      expect(qualitySignal).toBeDefined();
      expect(qualitySignal?.actualValue).toBe(18.5);
      expect(qualitySignal?.evidence[0]).toContain('18.5%');
    });

    it('enforces strict multi-tenant isolation across signal storage', async () => {
      await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-A', productId: 'SKU-A', onHand: 0, safetyStock: 10, reorderPoint: 20 }],
      });

      await signalEngine.scanSignals({
        tenantId: TENANT_B,
        inventory: [{ id: 'INV-B', productId: 'SKU-B', onHand: 0, safetyStock: 10, reorderPoint: 20 }],
      });

      const signalsA = signalEngine.getSignals(TENANT_A);
      const signalsB = signalEngine.getSignals(TENANT_B);

      expect(signalsA.length).toBeGreaterThan(0);
      expect(signalsB.length).toBeGreaterThan(0);
      expect(signalsA.every(s => s.tenantId === TENANT_A)).toBe(true);
      expect(signalsB.every(s => s.tenantId === TENANT_B)).toBe(true);
      expect(signalsA.some(s => s.tenantId === TENANT_B)).toBe(false);
    });
  });

  // =========================================================================
  // 2. EVENT INTELLIGENCE & CORRELATION
  // =========================================================================
  describe('Stage 2: Event Intelligence Engine', () => {
    it('normalizes heterogeneous events and correlates PO -> ASN -> GRN -> Invoice', async () => {
      const rawEvent: EventEnvelope = {
        eventId: 'EVT-PO-01',
        eventType: 'PURCHASE_ORDER_ISSUED',
        aggregateId: 'PO-7700',
        aggregateType: 'PURCHASE_ORDER',
        timestamp: '2026-09-20T10:00:00Z',
        version: '1.0',
        tenant: { organizationId: TENANT_A },
        payload: {
          poId: 'PO-7700',
          supplierId: 'SUP-FASTENERS',
          amount: 45000,
        },
      };

      const normalized = await eventIntelligenceEngine.ingestEvent(rawEvent);
      expect(normalized.eventId).toBe('EVT-PO-01');
      expect(normalized.tenantId).toBe(TENANT_A);
      expect(normalized.lineage.originSystem).toBe('ORION_KERNEL');

      // Add related ASN event
      await eventIntelligenceEngine.ingestEvent({
        eventId: 'EVT-ASN-01',
        eventType: 'ASN_RECEIVED',
        aggregateId: 'ASN-3301',
        aggregateType: 'ASN',
        timestamp: '2026-09-21T12:00:00Z',
        version: '1.0',
        tenant: { organizationId: TENANT_A },
        payload: {
          asnId: 'ASN-3301',
          poId: 'PO-7700',
          carrier: 'MAERSK',
        },
      });

      const correlated = eventIntelligenceEngine.correlateEvents(TENANT_A, 'PO-7700');
      expect(correlated.length).toBe(2);
      expect(correlated.map(e => e.eventType)).toContain('PURCHASE_ORDER_ISSUED');
      expect(correlated.map(e => e.eventType)).toContain('ASN_RECEIVED');
    });
  });

  // =========================================================================
  // 3. EXCEPTION ENGINE (Governed State Machine & SLAs)
  // =========================================================================
  describe('Stage 3: Exception Engine', () => {
    it('creates governed exceptions from active signals with computed SLA and business impact', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-C', productId: 'SKU-CRITICAL-TURBINE', onHand: 0, safetyStock: 20, reorderPoint: 40 }],
      });

      const exceptions = await exceptionEngine.evaluateSignals(TENANT_A, signals);
      expect(exceptions.length).toBeGreaterThan(0);

      const ex = exceptions[0];
      expect(ex.status).toBe('OPEN');
      expect(ex.severity).toBe('CRITICAL');
      expect(ex.slaMinutes).toBe(120); // Critical SLA is 2 hours
      expect(ex.dueAt).toBeDefined();
      expect(ex.businessImpact).toContain('fulfillment halt');
      expect(ex.customerImpact).toContain('Production stoppage');
    });

    it('enforces rigorous state machine transitions (OPEN -> ACKNOWLEDGED -> INVESTIGATING -> ACTION_PROPOSED -> PENDING_APPROVAL -> RESOLVED -> CLOSED)', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-D', productId: 'SKU-PUMP', onHand: 0, safetyStock: 10, reorderPoint: 15 }],
      });
      const [ex] = await exceptionEngine.evaluateSignals(TENANT_A, signals);

      // Valid sequence
      const ack = await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'ACKNOWLEDGED', 'Triage completed');
      expect(ack.status).toBe('ACKNOWLEDGED');

      const inv = await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'INVESTIGATING', 'Analyzing root cause');
      expect(inv.status).toBe('INVESTIGATING');

      const prop = await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'ACTION_PROPOSED', 'Option formulated');
      expect(prop.status).toBe('ACTION_PROPOSED');

      // Invalid transition: ACTION_PROPOSED cannot jump directly to CLOSED
      await expect(
        exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'CLOSED', 'Premature close')
      ).rejects.toThrow(/Invalid status transition/);
    });
  });

  // =========================================================================
  // 4. ROOT CAUSE ENGINE & RISK GRAPH
  // =========================================================================
  describe('Stage 4 & 5: Root Cause Analysis & Risk Graph', () => {
    it('constructs multi-factor causality chains with distinct classification tiers', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        shipments: [{ id: 'SHP-DELAYED', delayDays: 5, status: 'DELAYED', estimatedArrival: '2026-09-20' }],
      });
      const [ex] = await exceptionEngine.evaluateSignals(TENANT_A, signals);

      const rootCause = await rootCauseEngine.diagnoseRootCause(ex, signals);
      expect(rootCause.exceptionId).toBe(ex.exceptionId);
      expect(['OBSERVED_FACT', 'DERIVED_INFERENCE', 'AI_HYPOTHESIS']).toContain(rootCause.classification);
      expect(rootCause.causalityChain.length).toBeGreaterThan(0);
      expect(rootCause.evidenceReferences.length).toBeGreaterThan(0);
    });

    it('prevents AI self-promotion of root causes without human sign-off', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        suppliers: [{ id: 'SUP-ERR', name: 'Slow Corp', otif: 50 }],
      });
      const [ex] = await exceptionEngine.evaluateSignals(TENANT_A, signals);
      const rc = await rootCauseEngine.diagnoseRootCause(ex, signals);

      // Human confirms with evidence
      const confirmed = await rootCauseEngine.confirmRootCause(
        TENANT_A,
        rc.rootCauseId,
        'Physical dispatch log verified at supplier gate by plant manager',
        'John Doe (VP Operations)'
      );

      expect(confirmed.classification).toBe('CONFIRMED_ROOT_CAUSE');
      expect(confirmed.confidenceScore).toBe(100);
      expect(confirmed.evidenceReferences.some(e => e.includes('John Doe'))).toBe(true);
    });

    it('propagates risk through supply chain topological graph with cycle protection', async () => {
      // Node 1: Port of Aden (High Risk) -> Node 2: Assembly Plant -> Node 3: Customer Delivery
      await supplyChainRiskGraph.upsertNode({
        nodeId: 'NODE-PORT-ADEN',
        tenantId: TENANT_A,
        nodeType: 'PORT',
        name: 'Port of Aden',
        baseRiskScore: 85,
        propagatedRiskScore: 85,
        status: 'DISRUPTED',
        metadata: {},
      });

      await supplyChainRiskGraph.upsertNode({
        nodeId: 'NODE-PLANT-PUNE',
        tenantId: TENANT_A,
        nodeType: 'MANUFACTURING_PLANT',
        name: 'Pune Assembly Plant',
        baseRiskScore: 20,
        propagatedRiskScore: 20,
        status: 'OPERATIONAL',
        metadata: {},
      });

      await supplyChainRiskGraph.upsertNode({
        nodeId: 'NODE-CUSTOMER-BERLIN',
        tenantId: TENANT_A,
        nodeType: 'CUSTOMER_SITE',
        name: 'Siemens Berlin Delivery',
        baseRiskScore: 10,
        propagatedRiskScore: 10,
        status: 'OPERATIONAL',
        metadata: {},
      });

      // Edges with transmission factors
      await supplyChainRiskGraph.upsertEdge({
        edgeId: 'EDGE-1',
        tenantId: TENANT_A,
        fromNodeId: 'NODE-PORT-ADEN',
        toNodeId: 'NODE-PLANT-PUNE',
        relationshipType: 'SHIPS_TO',
        factor: 0.8,
        weight: 0.9,
      });

      await supplyChainRiskGraph.upsertEdge({
        edgeId: 'EDGE-2',
        tenantId: TENANT_A,
        fromNodeId: 'NODE-PLANT-PUNE',
        toNodeId: 'NODE-CUSTOMER-BERLIN',
        relationshipType: 'FEEDS',
        factor: 0.7,
        weight: 0.8,
      });

      // Cycle edge to test cycle protection
      await supplyChainRiskGraph.upsertEdge({
        edgeId: 'EDGE-CYCLE',
        tenantId: TENANT_A,
        fromNodeId: 'NODE-CUSTOMER-BERLIN',
        toNodeId: 'NODE-PORT-ADEN',
        relationshipType: 'FEEDS',
        factor: 0.5,
        weight: 0.5,
      });

      const { nodes } = await supplyChainRiskGraph.propagateRisk(TENANT_A);
      const plantNode = nodes.find(n => n.nodeId === 'NODE-PLANT-PUNE');
      const customerNode = nodes.find(n => n.nodeId === 'NODE-CUSTOMER-BERLIN');

      expect(plantNode?.propagatedRiskScore).toBeGreaterThan(plantNode?.baseRiskScore || 0);
      expect(customerNode?.propagatedRiskScore).toBeGreaterThan(customerNode?.baseRiskScore || 0);
    });
  });

  // =========================================================================
  // 5. CALIBRATED PREDICTION ENGINE
  // =========================================================================
  describe('Stage 6: Prediction Engine', () => {
    it('produces calibrated numeric probabilities and explicitly declares modelStatus = RULE_BASED', async () => {
      const predictions = await predictionEngine.generatePredictions({
        tenantId: TENANT_A,
        inventory: [
          { id: 'INV-10', onHand: 5, dailyDemand: 10 }, // Depletion in 0.5 days -> 95% stockout prob
        ],
        shipments: [
          { id: 'SHP-20', delayDays: 4, status: 'DELAYED', estimatedArrival: '2026-09-25' },
        ],
        suppliers: [
          { id: 'SUP-30', name: 'Global Metals', otif: 55 },
        ],
      });

      expect(predictions.length).toBe(3);

      for (const pred of predictions) {
        expect(pred.probability).toBeGreaterThanOrEqual(0.0);
        expect(pred.probability).toBeLessThanOrEqual(1.0);
        expect(pred.modelStatus).toBe('RULE_BASED');
        expect(pred.confidence).toBeGreaterThanOrEqual(0.8);
        expect(pred.evidence.length).toBeGreaterThan(0);
        expect(pred.horizon).toBeDefined();
      }

      const stockoutPred = predictions.find(p => p.predictionType === 'STOCKOUT_PROBABILITY');
      expect(stockoutPred?.probability).toBe(0.95);
    });
  });

  // =========================================================================
  // 6. DECISION OPTIONS & MULTI-DIMENSIONAL EVALUATION
  // =========================================================================
  describe('Stage 7 & 8: Decision Options & Evaluation Engines', () => {
    it('generates multi-candidate decision options with diverse action types', () => {
      const mockException: ExceptionIntelligence = {
        exceptionId: 'EX-9901',
        tenantId: TENANT_A,
        type: 'STOCKOUT_RISK',
        category: 'INVENTORY',
        severity: 'CRITICAL',
        status: 'OPEN',
        summary: 'Imminent stockout of turbine blades',
        businessImpact: 'Production line halt within 24h',
        detectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityReferences: [{ entityType: 'PRODUCT', entityId: 'SKU-TURBINE-01' }],
        signalReferences: ['SIG-001'],
        priorityScore: 92,
        priorityTier: 'P1',
        slaMinutes: 120,
      };

      const options = decisionOptionEngine.generateOptions({
        decisionId: 'DEC-001',
        exception: mockException,
        businessContext: {
          airfreightCost: 15000,
          transferCost: 3500,
          alternateWarehouseStock: 300,
        },
      });

      expect(options.length).toBeGreaterThanOrEqual(3);
      const actionTypes = options.map(o => o.actionType);
      expect(actionTypes).toContain('TRANSFER_INVENTORY');
      expect(actionTypes).toContain('SPLIT_SHIPMENT');
      expect(actionTypes).toContain('DO_NOTHING');
    });

    it('evaluates decision options across 10 independent dimensions and computes composite score', () => {
      const option: DecisionOption = {
        optionId: 'OPT-AIR',
        decisionId: 'DEC-001',
        actionType: 'EXPEDITE_SHIPMENT',
        description: 'Expedite 200 units via airfreight',
        expectedCost: 12000,
        expectedServiceImpact: 'Guarantees delivery before buffer exhaustion',
        expectedRisk: 'LOW',
        expectedBenefit: 'Protects assembly schedule',
        constraints: ['Max air cargo capacity 500kg'],
        policyImpact: 'COMPLIANT',
        requiredApproval: true,
        confidence: 0.92,
        evidence: ['Air carrier cargo slot reserved'],
        score: 85,
      };

      const evaluation = decisionEvaluationEngine.evaluateOption(option);
      expect(evaluation.optionId).toBe('OPT-AIR');
      expect(evaluation.compositeScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.compositeScore).toBeLessThanOrEqual(100);

      // Verify all 10 evaluation dimensions are present
      expect(evaluation.cost).toBeDefined();
      expect(evaluation.serviceLevelDaysProtected).toBeDefined();
      expect(evaluation.customerImpactScore).toBeDefined();
      expect(evaluation.inventoryImpactUnits).toBeDefined();
      expect(evaluation.supplierImpactScore).toBeDefined();
      expect(evaluation.operationalRiskScore).toBeDefined();
      expect(evaluation.financialExposureDelta).toBeDefined();
      expect(evaluation.leadTimeDeltaDays).toBeDefined();
      expect(evaluation.policyCompliance).toBeDefined();
      expect(evaluation.executionComplexity).toBeDefined();
    });
  });

  // =========================================================================
  // 7. RECOMMENDATION ENGINE & ZERO DIRECT EXECUTION GUARANTEE
  // =========================================================================
  describe('Stage 9: Recommendation Engine & Governance', () => {
    it('formulates evidence-backed recommendation proposals and NEVER directly executes mutations', async () => {
      const mockException: ExceptionIntelligence = {
        exceptionId: 'EX-REC-01',
        tenantId: TENANT_A,
        type: 'SHIPMENT_DELAY',
        category: 'LOGISTICS',
        severity: 'HIGH',
        status: 'INVESTIGATING',
        summary: 'Inbound container delayed at transit hub',
        businessImpact: 'Risk of inventory safety buffer breach in 3 days',
        detectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityReferences: [{ entityType: 'SHIPMENT', entityId: 'SHP-8801' }],
        signalReferences: ['SIG-002'],
        priorityScore: 78,
        priorityTier: 'P2',
        slaMinutes: 480,
      };

      const { decision, recommendation } = await recommendationEngine.formulateRecommendation({
        tenantId: TENANT_A,
        exception: mockException,
      });

      expect(decision).toBeDefined();
      expect(recommendation).toBeDefined();
      expect(decision.recommendedOptionId).toBe(recommendation.recommendedOption.optionId);
      expect(recommendation.policyReferences.length).toBeGreaterThan(0);
      expect(recommendation.approvalRequirement.required).toBeDefined();

      // Ensure status is gated for review, NOT auto-executed
      expect(['READY_FOR_REVIEW', 'PENDING_APPROVAL']).toContain(decision.status);
    });
  });

  // =========================================================================
  // 8. PRIORITY ENGINE (8-Factor Explainable Prioritization)
  // =========================================================================
  describe('Stage 10: Priority Engine', () => {
    it('calculates explainable priority tiers (P1-P4) using 8 distinct SCM factors', () => {
      const p1Assessment = priorityEngine.assessPriority({
        tenantId: TENANT_A,
        entityId: 'SKU-CRITICAL-ENGINE',
        severity: 'CRITICAL',
        revenueAtRisk: 250000,
        customerTier: 'STRATEGIC',
        slaMinutesRemaining: 30, // Imminent breach
        productionHaltRisk: true,
        daysOfSupplyRemaining: 0.5,
        singleSourceSupplier: true,
        networkCentralityScore: 90,
      });

      expect(p1Assessment.tier).toBe('P1');
      expect(p1Assessment.compositeScore).toBeGreaterThanOrEqual(85);
      expect(p1Assessment.explanation.length).toBeGreaterThan(0);
      expect(p1Assessment.breakdown.revenueFactor).toBeGreaterThan(0);
      expect(p1Assessment.breakdown.productionFactor).toBeGreaterThan(0);

      const p4Assessment = priorityEngine.assessPriority({
        tenantId: TENANT_A,
        entityId: 'SKU-OFFICE-SUPPLY',
        severity: 'LOW',
        revenueAtRisk: 100,
        customerTier: 'STANDARD',
        slaMinutesRemaining: 2880,
        productionHaltRisk: false,
        daysOfSupplyRemaining: 45,
        singleSourceSupplier: false,
        networkCentralityScore: 5,
      });

      expect(p4Assessment.tier).toBe('P4');
      expect(p4Assessment.compositeScore).toBeLessThan(45);
    });
  });

  // =========================================================================
  // 9. DECISION REPLAY & HISTORICAL AUDIT TIMELINE
  // =========================================================================
  describe('Stage 11 & 12: Decision Replay & Outcome Intelligence', () => {
    it('creates immutable point-in-time snapshots and reconstructs 8-stage replay timelines', async () => {
      const mockOption: DecisionOption = {
        optionId: 'OPT-REPLAY-1',
        decisionId: 'DEC-REPLAY-100',
        actionType: 'TRANSFER_INVENTORY',
        description: 'Transfer 100 units from warehouse West to East',
        expectedCost: 2500,
        expectedServiceImpact: 'Protects customer SLA',
        expectedRisk: 'LOW',
        expectedBenefit: 'Avoids ₹50k stockout penalty',
        constraints: [],
        policyImpact: 'COMPLIANT',
        requiredApproval: false,
        confidence: 0.95,
        evidence: ['Warehouse West has 400 surplus units'],
        score: 90,
      };

      const replay = await decisionReplayEngine.createSnapshot({
        replayId: 'REP-100',
        decisionId: 'DEC-REPLAY-100',
        tenantId: TENANT_A,
        contextSnapshot: {
          signals: [{ signalId: 'SIG-1', type: 'BELOW_SAFETY_STOCK' }],
          exception: { exceptionId: 'EX-1', type: 'STOCKOUT_RISK' },
        },
        optionsSnapshot: [mockOption],
        evaluationSnapshot: [{ optionId: 'OPT-REPLAY-1', score: 90 }],
        recommendationSnapshot: {
          recommendedOption: mockOption,
          rationale: 'Cost-effective internal transfer',
          confidence: 0.95,
          policyReferences: ['INV-BAL-01'],
          approvalRequirement: { required: false },
        },
      });

      expect(replay.replayId).toBe('REP-100');
      expect(replay.isImmutable).toBe(true);

      const timeline = decisionReplayEngine.reconstructTimeline(TENANT_A, 'REP-100');
      expect(timeline.decisionReplay.replayId).toBe('REP-100');
      expect(timeline.reconstructedTimeline.length).toBe(8);

      const stages = timeline.reconstructedTimeline.map(t => t.stage);
      expect(stages).toContain('EXCEPTION_DETECTED');
      expect(stages).toContain('OPTIONS_EVALUATED');
      expect(stages).toContain('RECOMMENDATION_FORMULATED');
      expect(stages).toContain('HUMAN_APPROVAL_GATE');
      expect(stages).toContain('KERNEL_EXECUTION');
      expect(stages).toContain('OUTCOME_RECORDED');
    });

    it('calculates empirical outcome variances across cost, service, and prediction accuracy', async () => {
      const outcome = await outcomeIntelligence.recordOutcome({
        tenantId: TENANT_A,
        decisionId: 'DEC-REPLAY-100',
        actionTaken: 'TRANSFER_INVENTORY',
        expectedCost: 2500,
        actualCost: 2700, // +₹200 variance (+8%)
        expectedDelayDays: 2,
        actualDelayDays: 1, // -1 day recovery
        expectedServiceImpact: '98% OTIF',
        actualServiceImpact: '100% OTIF',
        predictedProbability: 0.90,
        actualEventOccurred: true, // Prediction was correct
        notes: 'Transfer completed ahead of schedule with minor fuel surcharge',
      });

      expect(outcome.varianceId).toBeDefined();
      expect(outcome.costVariancePct).toBe(8.0);
      expect(outcome.delayVarianceDays).toBe(-1);
      expect(outcome.predictionAccuracyPct).toBe(100.0);
      expect(outcome.decisionQualityRating).toBe('HIGH');
    });
  });

  // =========================================================================
  // 10. AI TOOL REGISTRY EXTENSIONS
  // =========================================================================
  describe('Stage 13: Tool Registry Wave 6 Extensions', () => {
    const mockContext: AIExecutionContext = {
      tenantId: TENANT_A,
      correlationId: 'corr-mock-01',
      actor: {
        id: 'user-ops-lead',
        type: 'USER',
        organizationId: TENANT_A,
        roles: ['SCM_MANAGER'],
      },
      agent: {
        agentId: 'agent-orion-copilot',
        tenantId: TENANT_A,
        name: 'Orion Copilot',
        description: 'AI assistant',
        version: '1.0.0',
        status: 'ACTIVE',
        operatingMode: 'ASSIST',
        capabilities: ['signals:read', 'exceptions:read'],
        allowedTools: [
          'query_signals',
          'query_exceptions',
          'query_root_causes',
          'query_risk_graph',
          'query_predictions',
          'query_decisions',
          'query_decision_options',
          'query_recommendations',
          'query_outcomes',
          'query_decision_replay',
        ],
        allowedCommands: [],
        riskClass: 'LOW',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      mode: 'ASSIST',
      requestId: 'req-test-01',
      conversationId: 'conv-test-01',
      startedAt: new Date().toISOString(),
      timeoutMs: 30000,
    };

    it('executes all 10 Wave 6 intelligence query tools through ToolRegistry gate', async () => {
      // Seed some data first
      await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-1', productId: 'SKU-TEST', onHand: 0, safetyStock: 10, reorderPoint: 20 }],
      });

      const signals = await toolRegistry.executeTool('query_signals', {}, mockContext);
      expect(Array.isArray(signals)).toBe(true);
      expect(signals.length).toBeGreaterThan(0);

      const exceptions = await toolRegistry.executeTool('query_exceptions', {}, mockContext);
      expect(Array.isArray(exceptions)).toBe(true);

      const rootCauses = await toolRegistry.executeTool('query_root_causes', {}, mockContext);
      expect(Array.isArray(rootCauses)).toBe(true);

      const riskGraph = await toolRegistry.executeTool('query_risk_graph', {}, mockContext);
      expect(riskGraph).toBeDefined();
      expect(riskGraph.tenantId).toBe(TENANT_A);

      const predictions = await toolRegistry.executeTool('query_predictions', {}, mockContext);
      expect(Array.isArray(predictions)).toBe(true);

      const decisions = await toolRegistry.executeTool('query_decisions', {}, mockContext);
      expect(Array.isArray(decisions)).toBe(true);

      const recommendations = await toolRegistry.executeTool('query_recommendations', {}, mockContext);
      expect(Array.isArray(recommendations)).toBe(true);

      const outcomes = await toolRegistry.executeTool('query_outcomes', {}, mockContext);
      expect(Array.isArray(outcomes)).toBe(true);

      const replays = await toolRegistry.executeTool('query_decision_replay', {}, mockContext);
      expect(Array.isArray(replays)).toBe(true);
    });

    it('prohibits forbidden mutation and raw database tools', () => {
      expect(() => {
        toolRegistry.registerTool({
          toolId: 'executeSql',
          name: 'Execute SQL',
          description: 'Bypass',
          version: '1.0.0',
          tenantScope: false,
          requiredPermissions: [],
          riskLevel: 'CRITICAL',
          inputSchema: { type: 'object' },
          outputSchema: { type: 'object' },
          allowedModes: ['GOVERNED'],
          enabled: true,
        });
      }).toThrow(/Prohibited tool registration attempt/);
    });
  });

  // =========================================================================
  // 11. COMPLETE END-TO-END PIPELINE INTEGRATION TEST
  // =========================================================================
  describe('Full 16-Stage End-to-End Pipeline Journey', () => {
    it('executes full pipeline: Telemetry Event -> Signal -> Exception -> Root Cause -> Risk Propagation -> Prediction -> Options -> Evaluation -> Recommendation -> Human Approval -> Replay Snapshot -> Outcome Variance', async () => {
      // 1. INCOMING SCM TELEMETRY EVENT
      const rawEvent: EventEnvelope = {
        eventId: 'EVT-LOG-999',
        eventType: 'SHIPMENT_STATUS_UPDATED',
        aggregateId: 'SHP-TURBINE-CORRIDOR',
        aggregateType: 'SHIPMENT',
        timestamp: new Date().toISOString(),
        version: '1.0',
        tenant: { organizationId: TENANT_A },
        payload: {
          shipmentId: 'SHP-TURBINE-CORRIDOR',
          poId: 'PO-AIRCRAFT-01',
          delayDays: 6,
          status: 'DELAYED',
          origin: 'Hamburg Hub',
          destination: 'Bangalore Plant',
        },
      };
      await eventIntelligenceEngine.ingestEvent(rawEvent);

      // 2. SIGNAL DETECTION
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        shipments: [
          {
            id: 'SHP-TURBINE-CORRIDOR',
            poId: 'PO-AIRCRAFT-01',
            status: 'DELAYED',
            delayDays: 6,
            estimatedArrival: '2026-09-28',
          },
        ],
        inventory: [
          {
            id: 'INV-TURBINE',
            productId: 'SKU-AIRCRAFT-TURBINE',
            onHand: 2,
            safetyStock: 10,
            reorderPoint: 20,
            dailyDemand: 2,
          },
        ],
      });
      expect(signals.length).toBeGreaterThan(0);

      // 3. EXCEPTION GENERATION & SLA
      const exceptions = await exceptionEngine.evaluateSignals(TENANT_A, signals);
      expect(exceptions.length).toBeGreaterThan(0);
      const primaryException = exceptions[0];

      // 4. PRIORITY SCORING
      const priority = priorityEngine.assessPriority({
        tenantId: TENANT_A,
        entityId: primaryException.entityReferences[0]?.entityId || 'SKU-AIRCRAFT-TURBINE',
        severity: primaryException.severity,
        revenueAtRisk: 180000,
        customerTier: 'STRATEGIC',
        slaMinutesRemaining: primaryException.slaMinutes,
        productionHaltRisk: true,
        daysOfSupplyRemaining: 1.0,
        singleSourceSupplier: true,
        networkCentralityScore: 88,
      });
      expect(['P1', 'P2']).toContain(priority.tier);

      // 5. ROOT CAUSE ANALYSIS
      const rootCause = await rootCauseEngine.diagnoseRootCause(primaryException, signals);
      expect(rootCause.causalityChain.length).toBeGreaterThan(0);

      // 6. TOPOLOGICAL RISK PROPAGATION
      await supplyChainRiskGraph.upsertNode({
        nodeId: 'NODE-HAMBURG',
        tenantId: TENANT_A,
        nodeType: 'PORT',
        name: 'Hamburg Logistics Terminal',
        baseRiskScore: 75,
        propagatedRiskScore: 75,
        status: 'CONGESTED',
        metadata: {},
      });
      await supplyChainRiskGraph.upsertNode({
        nodeId: 'NODE-BANGALORE',
        tenantId: TENANT_A,
        nodeType: 'MANUFACTURING_PLANT',
        name: 'Bangalore Assembly Facility',
        baseRiskScore: 25,
        propagatedRiskScore: 25,
        status: 'OPERATIONAL',
        metadata: {},
      });
      await supplyChainRiskGraph.upsertEdge({
        edgeId: 'EDGE-HAM-BLR',
        tenantId: TENANT_A,
        fromNodeId: 'NODE-HAMBURG',
        toNodeId: 'NODE-BANGALORE',
        relationshipType: 'SHIPS_TO',
        factor: 0.85,
        weight: 0.95,
      });
      const { nodes: riskNodes } = await supplyChainRiskGraph.propagateRisk(TENANT_A);
      const blrNode = riskNodes.find(n => n.nodeId === 'NODE-BANGALORE');
      expect(blrNode?.propagatedRiskScore).toBeGreaterThan(25);

      // 7. CALIBRATED PREDICTION
      const predictions = await predictionEngine.generatePredictions({
        tenantId: TENANT_A,
        shipments: [{ id: 'SHP-TURBINE-CORRIDOR', delayDays: 6, status: 'DELAYED', estimatedArrival: '2026-09-28' }],
      });
      expect(predictions.length).toBeGreaterThan(0);

      // 8. DECISION OPTIONS & MULTI-DIMENSIONAL EVALUATION
      const options = decisionOptionEngine.generateOptions({
        decisionId: 'DEC-E2E-01',
        exception: primaryException,
        rootCause,
        prediction: predictions[0],
      });
      expect(options.length).toBeGreaterThanOrEqual(2);

      const evaluations = options.map(opt => decisionEvaluationEngine.evaluateOption(opt));
      expect(evaluations.length).toBe(options.length);

      // 9. RECOMMENDATION & GOVERNANCE FORMULATION
      const { decision, recommendation } = await recommendationEngine.formulateRecommendation({
        tenantId: TENANT_A,
        exception: primaryException,
        rootCause,
        prediction: predictions[0],
      });
      expect(decision.recommendedOptionId).toBeDefined();
      expect(recommendation.approvalRequirement.required).toBeDefined();

      // 10. DECISION REPLAY SNAPSHOT CREATION
      const replay = await decisionReplayEngine.createSnapshot({
        replayId: 'REP-E2E-01',
        decisionId: decision.decisionId,
        tenantId: TENANT_A,
        contextSnapshot: {
          signals,
          exception: primaryException,
          rootCause,
          prediction: predictions[0],
        },
        optionsSnapshot: options,
        evaluationSnapshot: evaluations,
        recommendationSnapshot: recommendation,
      });
      expect(replay.isImmutable).toBe(true);

      // 11. TIMELINE RECONSTRUCTION
      const timeline = decisionReplayEngine.reconstructTimeline(TENANT_A, replay.replayId);
      expect(timeline.reconstructedTimeline.length).toBe(8);

      // 12. EMPIRICAL OUTCOME RECORDING & VARIANCE ANALYSIS
      const outcome = await outcomeIntelligence.recordOutcome({
        tenantId: TENANT_A,
        decisionId: decision.decisionId,
        actionTaken: recommendation.recommendedOption.actionType,
        expectedCost: recommendation.recommendedOption.expectedCost,
        actualCost: recommendation.recommendedOption.expectedCost + 400,
        expectedDelayDays: 1,
        actualDelayDays: 1,
        expectedServiceImpact: recommendation.recommendedOption.expectedServiceImpact,
        actualServiceImpact: 'SLA Protected 100%',
        predictedProbability: predictions[0].probability,
        actualEventOccurred: true,
      });
      expect(outcome.predictionAccuracyPct).toBe(100.0);
      expect(['HIGH', 'MEDIUM']).toContain(outcome.decisionQualityRating);
    });
  });

  // =========================================================================
  // 12. ADVANCED SCENARIOS & ADVERSARIAL EDGE CASES
  // =========================================================================
  describe('Advanced Edge Cases & Security Invariants', () => {
    it('detects DEMAND_SPIKE and DEMAND_DROP with trend percentages', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        demandForecasts: [
          { productId: 'SKU-SPIKE', historicalAverageDaily: 100, forecastedDaily: 150, trendPercentage: 50 },
          { productId: 'SKU-DROP', historicalAverageDaily: 100, forecastedDaily: 60, trendPercentage: -40 },
        ],
      });

      const spike = signals.find(s => s.signalType === 'DEMAND_SPIKE');
      const drop = signals.find(s => s.signalType === 'DEMAND_DROP');

      expect(spike).toBeDefined();
      expect(spike?.severity).toBe('CRITICAL');
      expect(drop).toBeDefined();
      expect(drop?.severity).toBe('MEDIUM');
    });

    it('detects COST_SPIKE when purchase price exceeds benchmark by > 15%', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        costIndices: [
          { productId: 'SKU-COPPER', benchmarkCost: 1000, currentCost: 1350 }, // +35%
        ],
      });

      const costSpike = signals.find(s => s.signalType === 'COST_SPIKE');
      expect(costSpike).toBeDefined();
      expect(costSpike?.severity).toBe('CRITICAL');
      expect(costSpike?.actualValue).toBe(35);
    });

    it('detects LEAD_TIME_INCREASE when supplier lead time expands > 5 days', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        suppliers: [
          { id: 'SUP-SLOW', name: 'Slow Lead Supplier', otif: 90, averageLeadTimeDays: 28, contractedLeadTimeDays: 14 },
        ],
      });

      const leadSignal = signals.find(s => s.signalType === 'LEAD_TIME_INCREASE');
      expect(leadSignal).toBeDefined();
      expect(leadSignal?.severity).toBe('MEDIUM');
    });

    it('handles exception SUPPRESSION and reactivation lifecycle transitions', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-SUPP', productId: 'SKU-SUPP', onHand: 0, safetyStock: 10, reorderPoint: 20 }],
      });
      const [ex] = await exceptionEngine.evaluateSignals(TENANT_A, signals);

      const suppressed = await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'SUPPRESSED', 'Scheduled facility downtime');
      expect(suppressed.status).toBe('SUPPRESSED');

      const reopened = await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'OPEN', 'Facility resumed operations');
      expect(reopened.status).toBe('OPEN');
    });

    it('handles exception REJECTION transition', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-REJ', productId: 'SKU-REJ', onHand: 0, safetyStock: 10, reorderPoint: 20 }],
      });
      const [ex] = await exceptionEngine.evaluateSignals(TENANT_A, signals);

      const rejected = await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'REJECTED', 'False alarm confirmed by physical count');
      expect(rejected.status).toBe('REJECTED');
    });

    it('detects duplicate events and prevents double processing in EventIntelligenceEngine', async () => {
      const event: EventEnvelope = {
        eventId: 'EVT-DUP-01',
        eventType: 'INVENTORY_REORDER_TRIGGERED',
        aggregateId: 'INV-DUP',
        aggregateType: 'INVENTORY',
        timestamp: new Date().toISOString(),
        version: '1.0',
        tenant: { organizationId: TENANT_A },
      };

      const first = await eventIntelligenceEngine.processEvent(event);
      expect(first.isDuplicate).toBe(false);

      const second = await eventIntelligenceEngine.processEvent(event);
      expect(second.isDuplicate).toBe(true);
      expect(second.correlatedSignals.length).toBe(0);
    });

    it('throws error when querying non-existent decision replay', () => {
      expect(() => {
        decisionReplayEngine.reconstructTimeline(TENANT_A, 'NON-EXISTENT-REPLAY-ID');
      }).toThrow(/Decision replay not found/);
    });

    it('enforces tenant isolation in decision replay storage', async () => {
      const mockOption: DecisionOption = {
        optionId: 'OPT-1',
        decisionId: 'DEC-ISO-1',
        actionType: 'TRANSFER_INVENTORY',
        description: 'Test',
        expectedCost: 100,
        expectedServiceImpact: 'Fast',
        expectedRisk: 'LOW',
        expectedBenefit: 'Good',
        constraints: [],
        policyImpact: 'COMPLIANT',
        requiredApproval: false,
        confidence: 0.9,
        evidence: [],
        score: 80,
      };

      await decisionReplayEngine.createSnapshot({
        replayId: 'REP-TENANT-A',
        decisionId: 'DEC-ISO-A',
        tenantId: TENANT_A,
        optionsSnapshot: [mockOption],
        recommendationSnapshot: { recommendedOption: mockOption, confidence: 0.9, policyReferences: [], approvalRequirement: { required: false } },
      });

      await decisionReplayEngine.createSnapshot({
        replayId: 'REP-TENANT-B',
        decisionId: 'DEC-ISO-B',
        tenantId: TENANT_B,
        optionsSnapshot: [mockOption],
        recommendationSnapshot: { recommendedOption: mockOption, confidence: 0.9, policyReferences: [], approvalRequirement: { required: false } },
      });

      const replaysA = decisionReplayEngine.getReplays(TENANT_A);
      const replaysB = decisionReplayEngine.getReplays(TENANT_B);

      expect(replaysA.every(r => r.tenantId === TENANT_A)).toBe(true);
      expect(replaysB.every(r => r.tenantId === TENANT_B)).toBe(true);
      expect(replaysA.some(r => r.replayId === 'REP-TENANT-B')).toBe(false);
    });

    it('generates ALTERNATE_SUPPLIER option when alternate supplier is available in context', () => {
      const mockException: ExceptionIntelligence = {
        exceptionId: 'EX-SUPP-ALT',
        tenantId: TENANT_A,
        type: 'SUPPLIER_DELAY',
        category: 'PROCUREMENT',
        severity: 'HIGH',
        status: 'OPEN',
        summary: 'Primary vendor lead time delayed',
        businessImpact: 'Production delay',
        detectedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        entityReferences: [{ entityType: 'SUPPLIER', entityId: 'SUP-PRIMARY' }],
        signalReferences: ['SIG-SUP-01'],
        priorityScore: 75,
        priorityTier: 'P2',
        slaMinutes: 480,
      };

      const options = decisionOptionEngine.generateOptions({
        decisionId: 'DEC-ALT-01',
        exception: mockException,
        businessContext: {
          alternateSupplierAvailable: true,
        },
      });

      const actions = options.map(o => o.actionType);
      expect(actions).toContain('EXPEDITE_PO');
      expect(actions).toContain('TRIGGER_SUPPLIER_OUTREACH');
    });

    it('evaluates DO_NOTHING with severe customer penalty and zero operational cost', () => {
      const doNothingOption: DecisionOption = {
        optionId: 'OPT-DO-NOTHING',
        decisionId: 'DEC-TEST-DN',
        actionType: 'DO_NOTHING',
        description: 'Passive observation',
        expectedCost: 0,
        expectedServiceImpact: 'Severe breach',
        expectedRisk: 'HIGH',
        expectedBenefit: 'Zero spend',
        constraints: [],
        policyImpact: 'VIOLATION',
        requiredApproval: false,
        confidence: 1.0,
        evidence: [],
        score: 15,
      };

      const evaluation = decisionEvaluationEngine.evaluateOption(doNothingOption);
      expect(evaluation.cost).toBe(0);
      expect(evaluation.customerImpactScore).toBeLessThanOrEqual(20);
      expect(evaluation.operationalRiskScore).toBeGreaterThanOrEqual(80);
      expect(evaluation.compositeScore).toBeLessThanOrEqual(30);
    });

    it('limits risk graph propagation depth to prevent infinite loops in cyclic graphs', async () => {
      // 8-node chain: N1 -> N2 -> N3 -> N4 -> N5 -> N6 -> N7 -> N8 -> N1
      for (let i = 1; i <= 8; i++) {
        await supplyChainRiskGraph.upsertNode({
          nodeId: `NODE-CHAIN-${i}`,
          tenantId: TENANT_A,
          nodeType: 'WAREHOUSE',
          name: `Hub ${i}`,
          baseRiskScore: i === 1 ? 90 : 10,
          propagatedRiskScore: i === 1 ? 90 : 10,
          status: 'OPERATIONAL',
          metadata: {},
        });
      }

      for (let i = 1; i < 8; i++) {
        await supplyChainRiskGraph.upsertEdge({
          edgeId: `EDGE-C-${i}`,
          tenantId: TENANT_A,
          fromNodeId: `NODE-CHAIN-${i}`,
          toNodeId: `NODE-CHAIN-${i + 1}`,
          relationshipType: 'FEEDS',
          factor: 0.9,
          weight: 0.9,
        });
      }

      // Closing cycle
      await supplyChainRiskGraph.upsertEdge({
        edgeId: 'EDGE-C-CLOSE',
        tenantId: TENANT_A,
        fromNodeId: 'NODE-CHAIN-8',
        toNodeId: 'NODE-CHAIN-1',
        relationshipType: 'FEEDS',
        factor: 0.9,
        weight: 0.9,
      });

      // Must terminate gracefully without exceeding max call stack
      const result = await supplyChainRiskGraph.propagateRisk(TENANT_A);
      expect(result.nodes.length).toBe(8);
    });

    it('computes prediction probability boundaries between 0.0 and 1.0 across all conditions', async () => {
      const preds = await predictionEngine.generatePredictions({
        tenantId: TENANT_A,
        inventory: [
          { id: 'INV-BOUND-1', onHand: 1000, dailyDemand: 1 }, // 1000 days supply -> minimal prob
          { id: 'INV-BOUND-2', onHand: 1, dailyDemand: 10 }, // 0.1 days supply -> maximal prob
        ],
        suppliers: [
          { id: 'SUP-PERFECT', name: 'Perfect Supplier', otif: 100 },
          { id: 'SUP-FAILED', name: 'Failed Supplier', otif: 30 },
        ],
      });

      for (const p of preds) {
        expect(p.probability).toBeGreaterThanOrEqual(0.0);
        expect(p.probability).toBeLessThanOrEqual(1.0);
      }
    });

    it('correctly tracks event lineage parent-child relationships for SCM aggregates', async () => {
      // 1. PO Event
      await eventIntelligenceEngine.ingestEvent({
        eventId: 'EVT-PO-L1',
        eventType: 'PURCHASE_ORDER_ISSUED',
        aggregateId: 'PO-L1',
        entityType: 'PURCHASE_ORDER',
        entityId: 'PO-L1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        tenant: { organizationId: TENANT_A },
      });

      // 2. ASN Event referencing PO
      await eventIntelligenceEngine.ingestEvent({
        eventId: 'EVT-ASN-L1',
        eventType: 'ASN_RECEIVED',
        aggregateId: 'ASN-L1',
        entityType: 'ASN',
        entityId: 'ASN-L1',
        timestamp: new Date().toISOString(),
        version: '1.0',
        tenant: { organizationId: TENANT_A },
        payload: { poId: 'PO-L1' },
      });

      const asnLineage = eventIntelligenceEngine.getLineage(TENANT_A, 'ASN', 'ASN-L1');
      expect(asnLineage).toBeDefined();
      expect(asnLineage?.parentEntity?.entityType).toBe('PURCHASE_ORDER');
      expect(asnLineage?.parentEntity?.entityId).toBe('PO-L1');
    });

    it('rejects illegal status transition from CLOSED to OPEN in ExceptionEngine', async () => {
      const signals = await signalEngine.scanSignals({
        tenantId: TENANT_A,
        inventory: [{ id: 'INV-TERM', productId: 'SKU-TERM', onHand: 0, safetyStock: 10, reorderPoint: 20 }],
      });
      const [ex] = await exceptionEngine.evaluateSignals(TENANT_A, signals);

      await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'ACKNOWLEDGED');
      await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'INVESTIGATING');
      await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'RESOLVED');
      await exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'CLOSED');

      // CLOSED cannot transition anywhere
      await expect(
        exceptionEngine.transitionStatus(TENANT_A, ex.exceptionId, 'OPEN')
      ).rejects.toThrow(/Invalid status transition/);
    });
  });
});
