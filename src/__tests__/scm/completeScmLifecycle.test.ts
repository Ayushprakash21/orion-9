/**
 * ORION-9 PART 4 / TRACK 2 — COMPLETE SCM BUSINESS CORE TEST SUITE
 *
 * Verifies the full 15-stage supply chain lifecycle:
 * Demand → Demand Planning → S&OP → PR → RFQ → Quote → Bid Comparison → Award →
 * PO → ASN → Shipment → Gate Entry → Receiving → GRN → Quality → Putaway →
 * Inventory → Customer Order → Fulfillment → Invoice → 2-Way/3-Way Match →
 * Payment Handoff → Supplier Performance → Traceability.
 *
 * Enforces Cloud Firestore authoritative persistence with Dexie offline caching,
 * Kernel governance, strict tenant isolation, immutable inventory transactions,
 * and AI non-escalation mandates.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { supplierLifecycleEngine } from '../../scm/SupplierLifecycleEngine';
import { sourcingEngine } from '../../scm/SourcingEngine';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { inboundLogisticsEngine } from '../../scm/InboundLogisticsEngine';
import { receivingGRNEngine } from '../../scm/ReceivingGRNEngine';
import { invoicingMatchingEngine } from '../../scm/InvoicingMatchingEngine';
import { supplierPerformanceEngine } from '../../scm/SupplierPerformanceEngine';
import { scmTraceabilityEngine } from '../../scm/ScmTraceabilityEngine';
import { demandPlanningEngine } from '../../scm/DemandPlanningEngine';
import { customerOrderFulfillmentEngine } from '../../scm/CustomerOrderFulfillmentEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('Orion-9 Part 4 / Track 2: Complete SCM Business Core Lifecycle', () => {
  const tenantA = 'org-tenant-a';
  const tenantB = 'org-tenant-b';

  const buyerActor: AuthorizationActor = {
    id: 'user-buyer-1',
    type: 'USER',
    name: 'Sarah Buyer',
    roles: ['buyer', 'organization_member'],
    organizationId: tenantA,
  };

  const procurementManagerActor: AuthorizationActor = {
    id: 'user-pm-1',
    type: 'USER',
    name: 'Marcus Procurement Manager',
    roles: ['procurement_manager', 'organization_admin'],
    organizationId: tenantA,
  };

  const warehouseOperatorActor: AuthorizationActor = {
    id: 'user-wh-1',
    type: 'USER',
    name: 'Dave Warehouse',
    roles: ['warehouse_operator', 'warehouse_manager', 'organization_member'],
    organizationId: tenantA,
  };

  const financeDirectorActor: AuthorizationActor = {
    id: 'user-fin-1',
    type: 'USER',
    name: 'Fiona Finance',
    roles: ['finance_director', 'organization_admin'],
    organizationId: tenantA,
  };

  const aiAgentActor: AuthorizationActor = {
    id: 'ai-scm-copilot',
    type: 'AI_AGENT',
    name: 'Orion SCM Copilot',
    roles: ['ai_agent', 'buyer'],
    organizationId: tenantA,
  };

  const tenantBActor: AuthorizationActor = {
    id: 'user-tenant-b-1',
    type: 'USER',
    name: 'Intruder B',
    roles: ['organization_admin'],
    organizationId: tenantB,
  };

  beforeEach(() => {
    supplierLifecycleEngine.clear();
    sourcingEngine.clear();
    poLifecycleEngine.clear();
    inboundLogisticsEngine.clear();
    receivingGRNEngine.clear();
    invoicingMatchingEngine.clear();
    demandPlanningEngine.clear();
    customerOrderFulfillmentEngine.clear();
    scmPersistenceService.clear();
  });

  // ── 1. DEMAND PLANNING & S&OP SCENARIOS ─────────────────────────────────────
  describe('1. Demand Planning & S&OP Integration', () => {
    it('creates, approves, and publishes a consensus demand plan', async () => {
      const planRes = await demandPlanningEngine.createDemandPlan({
        tenantId: tenantA,
        actor: buyerActor,
        title: 'Q4 2026 High-Tech Microprocessor Plan',
        horizonStart: '2026-10-01',
        horizonEnd: '2026-12-31',
        items: [
          {
            productId: 'SKU-CPU-900',
            forecastPeriod: '2026-10',
            statisticalForecast: 1000,
            salesAdjustment: 150,
            marketingAdjustment: 50,
            consensusDemand: 1200,
            unitOfMeasure: 'PCS',
            confidenceInterval: { lower: 1100, upper: 1300 },
          },
        ],
      });

      expect(planRes.success).toBe(true);
      expect(planRes.data.status).toBe('DRAFT');

      const planId = planRes.data.planId;

      // Approve demand plan via manager
      const approveRes = await demandPlanningEngine.approveDemandPlan(tenantA, planId, procurementManagerActor);
      expect(approveRes.success).toBe(true);
      expect(approveRes.data.status).toBe('APPROVED');

      // Publish demand plan to supply chain
      const publishRes = await demandPlanningEngine.publishDemandPlan(tenantA, planId, procurementManagerActor);
      expect(publishRes.success).toBe(true);
      expect(publishRes.data.status).toBe('PUBLISHED');

      // Create S&OP scenario
      const scenarioRes = await demandPlanningEngine.createSopScenario({
        tenantId: tenantA,
        actor: procurementManagerActor,
        name: 'Optimistic Upside Scenario +15%',
        type: 'UPSIDE',
        planId,
        demandTotal: 1380,
        supplyCapacity: 1500,
        projectedRevenue: 690000,
        projectedCost: 345000,
        serviceLevelTarget: 98.5,
        assumptions: ['Component yield at 99.2%', 'Dual freight lane available'],
      });

      expect(scenarioRes.success).toBe(true);
      expect(scenarioRes.data.status).toBe('DRAFT');
    });
  });

  // ── 2. SOURCING: PR → RFQ → QUOTATION → BID COMPARISON → AWARD ──────────────
  describe('2. Sourcing Lifecycle: PR to Award', () => {
    it('executes PR generation, RFQ bidding, bid scoring, and supplier award', async () => {
      // 1. Onboard qualified supplier first
      const supRes = await supplierLifecycleEngine.registerSupplier({
        tenantId: tenantA,
        actor: buyerActor,
        legalName: 'Apex Silicon Tech',
        supplierCode: 'SUP-APEX-01',
        taxIdentifier: 'US-99112233',
      });
      const supplierId = supRes.data.supplierId;
      await supplierLifecycleEngine.submitSupplier(tenantA, supplierId, buyerActor);
      await supplierLifecycleEngine.reviewSupplier(tenantA, supplierId, procurementManagerActor);
      await supplierLifecycleEngine.startQualification(tenantA, supplierId, procurementManagerActor);
      await supplierLifecycleEngine.evaluateQualification({
        tenantId: tenantA,
        supplierId,
        actor: procurementManagerActor,
        dimensionEvaluations: [
          { dimension: 'quality', status: 'PASS', score: 96, evaluatedAt: new Date().toISOString(), evaluatedBy: procurementManagerActor.id },
          { dimension: 'financial', status: 'PASS', score: 94, evaluatedAt: new Date().toISOString(), evaluatedBy: procurementManagerActor.id },
        ],
      });
      await supplierLifecycleEngine.activateSupplier(tenantA, supplierId, procurementManagerActor);

      // 2. Create and Submit PR
      const prRes = await sourcingEngine.createPR({
        tenantId: tenantA,
        actor: buyerActor,
        department: 'Operations',
        costCenter: 'CC-MFG-01',
        priority: 'HIGH',
        justification: 'Replenishment for Q4 Production Schedule',
        items: [
          {
            lineId: 'PR-LINE-1',
            productId: 'SKU-CPU-900',
            description: 'Enterprise 8-Core AI Co-Processor',
            quantity: 500,
            unitOfMeasure: 'PCS',
            estimatedUnitCost: 250,
            requiredDate: '2026-11-15',
            deliveryLocation: 'Warehouse Austin D1',
          },
        ],
      });
      expect(prRes.success).toBe(true);
      const prId = prRes.data.prId;

      const prSubRes = await sourcingEngine.submitPR(tenantA, prId, buyerActor);
      expect(prSubRes.success).toBe(true);

      // 3. Create and Publish RFQ
      const rfqRes = await sourcingEngine.createRFQ({
        tenantId: tenantA,
        actor: buyerActor,
        title: 'Microprocessor RFP 2026',
        prId,
        invitedSupplierIds: [supplierId],
        items: prRes.data.items,
        submissionDeadline: '2026-10-31',
      });
      expect(rfqRes.success).toBe(true);
      const rfqId = rfqRes.data.rfqId;

      await sourcingEngine.publishRFQ(tenantA, rfqId, buyerActor);

      // 4. Submit Quotation
      const quotRes = await sourcingEngine.submitQuotation({
        tenantId: tenantA,
        actor: buyerActor,
        rfqId,
        supplierId,
        items: [{ productId: 'SKU-CPU-900', unitPrice: 240, moq: 100, leadTimeDays: 14 }],
        currency: 'USD',
      });
      expect(quotRes.success).toBe(true);
      const quotationId = quotRes.data.quotationId;

      // 5. Evaluate Bids
      const evalRes = await sourcingEngine.evaluateBids({
        tenantId: tenantA,
        rfqId,
        actor: buyerActor,
        justification: 'Apex Silicon offered lowest unit price with superior lead time adherence',
      });
      expect(evalRes.success).toBe(true);
      expect(evalRes.data.recommendedSupplierId).toBe(supplierId);

      // 6. Award Supplier
      const awardRes = await sourcingEngine.awardSupplier({
        tenantId: tenantA,
        rfqId,
        supplierId,
        quotationId,
        actor: procurementManagerActor,
      });
      expect(awardRes.success).toBe(true);
      expect(awardRes.data.status).toBe('AWARDED');
    });
  });

  // ── 3. PURCHASE ORDER LIFECYCLE & POLICY GATES ─────────────────────────────
  describe('3. Purchase Order Governance & Release', () => {
    it('creates PO, blocks release of unapproved PO, approves, and releases', async () => {
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-APEX-01',
        items: [
          {
            lineId: 'LINE-1',
            productId: 'SKU-CPU-900',
            quantity: 200,
            unitPrice: 240,
            totalPrice: 48000,
            unitOfMeasure: 'PCS',
            expectedDeliveryDate: '2026-11-20',
          },
        ],
      });
      expect(poRes.success).toBe(true);
      const poId = poRes.data.poId;

      // Attempting to release unapproved PO MUST fail closed under policy
      const badRelease = await poLifecycleEngine.releasePO(tenantA, poId, buyerActor);
      expect(badRelease.success).toBe(false);
      expect(badRelease.status).toBe('DENIED_POLICY');
      expect(badRelease.message).toContain('cannot be released until APPROVED');

      // Submit for approval
      const subApprove = await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      expect(subApprove.success).toBe(true);
      expect(subApprove.data.status).toBe('APPROVED');

      // Now release PO to supplier
      const releaseRes = await poLifecycleEngine.releasePO(tenantA, poId, procurementManagerActor);
      expect(releaseRes.success).toBe(true);
      expect(releaseRes.data.status).toBe('RELEASED');

      // Supplier confirmation
      const confirmRes = await poLifecycleEngine.confirmPO(tenantA, poId, buyerActor);
      expect(confirmRes.success).toBe(true);
      expect(confirmRes.data.status).toBe('CONFIRMED');
    });
  });

  // ── 4. INBOUND LOGISTICS, GATE, RECEIVING, GRN & QUALITY ────────────────────
  describe('4. Inbound Logistics, Gate Entry, GRN & Quality Inspection', () => {
    it('creates ASN, checks in gate, posts GRN with inventory increment, and inspects quality', async () => {
      // Setup PO
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-APEX-01',
        items: [
          {
            lineId: 'LINE-1',
            productId: 'SKU-CPU-900',
            quantity: 100,
            unitPrice: 240,
            totalPrice: 24000,
            unitOfMeasure: 'PCS',
            expectedDeliveryDate: '2026-11-20',
          },
        ],
      });
      const poId = poRes.data.poId;
      await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      await poLifecycleEngine.releasePO(tenantA, poId, procurementManagerActor);

      // 1. Create ASN with quantity check (over-shipment by >10% must be rejected)
      const badAsn = await inboundLogisticsEngine.createASN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        supplierId: 'SUP-APEX-01',
        carrier: 'FastFreight Logistics',
        trackingNumber: 'FF-TRK-9900',
        shippedDate: '2026-11-10',
        expectedArrivalDate: '2026-11-15',
        items: [{ productId: 'SKU-CPU-900', shippedQuantity: 150 }], // 150 > 100 * 1.1 = 110!
      });
      expect(badAsn.success).toBe(false);
      expect(badAsn.status).toBe('DENIED_POLICY');

      // Valid ASN
      const goodAsn = await inboundLogisticsEngine.createASN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        supplierId: 'SUP-APEX-01',
        carrier: 'FastFreight Logistics',
        trackingNumber: 'FF-TRK-9900',
        shippedDate: '2026-11-10',
        expectedArrivalDate: '2026-11-15',
        items: [{ productId: 'SKU-CPU-900', shippedQuantity: 100 }],
      });
      expect(goodAsn.success).toBe(true);
      const asnId = goodAsn.data.asnId;

      // 2. Gate Entry check-in
      const gateRes = await inboundLogisticsEngine.createGateEntry({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        vehicleNumber: 'TX-7744-TRUCK',
        carrier: 'FastFreight Logistics',
        driverName: 'Robert Vance',
        warehouseId: 'WH-AUSTIN',
      });
      expect(gateRes.success).toBe(true);
      expect(gateRes.data.status).toBe('ARRIVED');

      // 3. Receiving Transaction
      const rcvRes = await receivingGRNEngine.recordReceiving({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        poId,
        asnId,
        warehouseId: 'WH-AUSTIN',
        receivedItems: [
          { productId: 'SKU-CPU-900', receivedQuantity: 100, damagedQuantity: 2, shortQuantity: 0 },
        ],
      });
      expect(rcvRes.success).toBe(true);
      const receivingId = rcvRes.data.receivingId;

      // 4. Post GRN and verify authoritative inventory increment
      const grnRes = await receivingGRNEngine.postGRN({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        poId,
        receivingId,
        warehouseId: 'WH-AUSTIN',
        items: [{ productId: 'SKU-CPU-900', acceptedQuantity: 98, unitCost: 240 }],
      });
      expect(grnRes.success).toBe(true);
      expect(grnRes.data.status).toBe('POSTED');
      const grnId = grnRes.data.grnId;

      // Authoritative Inventory verification
      const invRecord = scmPersistenceService.getCachedRecord<any>('inventory', tenantA, 'INV-WH-AUSTIN-SKU-CPU-900');
      expect(invRecord).toBeDefined();
      expect(invRecord.onHand).toBe(98);

      // Verify immutable inventory transaction was logged
      const txs = scmPersistenceService.listCachedRecords<any>('inventory_transactions', tenantA);
      const grnTx = txs.find((t) => t.referenceEntityId === grnId && t.transactionType === 'GRN_RECEIPT');
      expect(grnTx).toBeDefined();
      expect(grnTx.quantityDelta).toBe(98);
      expect(grnTx.balanceAfter).toBe(98);

      // 5. Quality Inspection with quarantine check
      const inspectRes = await receivingGRNEngine.inspectQuality({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        grnId,
        productId: 'SKU-CPU-900',
        quantityInspected: 98,
        quantityPassed: 96,
        quantityFailed: 2,
        notes: '2 units exhibited bent connector pins; quarantined in Bay Q-4',
      });
      expect(inspectRes.success).toBe(true);
      expect(inspectRes.data.decision).toBe('QUARANTINED');

      // 6. Putaway Execution
      const putawayRes = await receivingGRNEngine.executePutaway({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        grnId,
        productId: 'SKU-CPU-900',
        quantity: 96,
        sourceLocation: 'RECEIVING-DOCK-1',
        destinationLocation: 'WH-AUSTIN-AISLE-4-BIN-12',
        warehouseId: 'WH-AUSTIN',
      });
      expect(putawayRes.success).toBe(true);
      expect(putawayRes.data.status).toBe('COMPLETED');
    });
  });

  // ── 5. CUSTOMER ORDER ALLOCATION & FULFILLMENT ──────────────────────────────
  describe('5. Customer Order Allocation & Stock Fulfillment', () => {
    it('creates customer order, allocates inventory, fulfills order, and decrements physical stock', async () => {
      // Seed inventory with 100 units
      await scmPersistenceService.adjustInventory({
        tenantId: tenantA,
        productId: 'SKU-CPU-900',
        warehouseId: 'WH-AUSTIN',
        quantityDelta: 100,
        transactionType: 'CYCLE_COUNT_ADJUSTMENT',
        referenceEntityType: 'CYCLE_COUNT',
        referenceEntityId: 'INIT-100',
        actor: warehouseOperatorActor.id,
        correlationId: 'INIT-SEED',
      });

      // 1. Create Customer Order
      const orderRes = await customerOrderFulfillmentEngine.createCustomerOrder({
        tenantId: tenantA,
        actor: buyerActor,
        customerId: 'CUST-OMEGA-CORP',
        customerName: 'Omega Defense Systems',
        shippingAddress: 'Building 7, Aerospace Way, Dallas TX',
        deliveryDateRequested: '2026-12-01',
        items: [
          {
            lineId: 'SO-LINE-1',
            productId: 'SKU-CPU-900',
            quantityOrdered: 25,
            quantityAllocated: 0,
            quantityFulfilled: 0,
            unitPrice: 450,
            totalPrice: 11250,
            warehouseId: 'WH-AUSTIN',
          },
        ],
      });
      expect(orderRes.success).toBe(true);
      const orderId = orderRes.data.orderId;

      // 2. Allocate inventory
      const allocRes = await customerOrderFulfillmentEngine.allocateOrder(tenantA, orderId, warehouseOperatorActor);
      expect(allocRes.success).toBe(true);
      expect(allocRes.data.status).toBe('ALLOCATED');
      expect(allocRes.data.items[0].quantityAllocated).toBe(25);

      // 3. Fulfill order: decrements warehouse stock by 25
      const fulfillRes = await customerOrderFulfillmentEngine.fulfillOrder(tenantA, orderId, warehouseOperatorActor, 'FEDEX-PRIORITY-98765');
      expect(fulfillRes.success).toBe(true);
      expect(fulfillRes.data.status).toBe('SHIPPED');
      expect(fulfillRes.data.trackingNumber).toBe('FEDEX-PRIORITY-98765');

      // Verify physical inventory stock decremented from 100 to 75
      const updatedInv = scmPersistenceService.getCachedRecord<any>('inventory', tenantA, 'INV-WH-AUSTIN-SKU-CPU-900');
      expect(updatedInv).toBeDefined();
      expect(updatedInv.onHand).toBe(75);

      // Verify immutable inventory transaction
      const txs = scmPersistenceService.listCachedRecords<any>('inventory_transactions', tenantA);
      const fulfillmentTx = txs.find((t) => t.referenceEntityId === orderId && t.transactionType === 'ORDER_FULFILLMENT');
      expect(fulfillmentTx).toBeDefined();
      expect(fulfillmentTx.quantityDelta).toBe(-25);
      expect(fulfillmentTx.balanceAfter).toBe(75);
    });
  });

  // ── 6. INVOICING, 2-WAY & 3-WAY MATCHING, GOVERNED PAYMENT HANDOFF ───────────
  describe('6. Invoicing, 2-Way / 3-Way Matching & Governed Payment Handoff', () => {
    it('executes matching, detects price & quantity discrepancies, and enforces payment approval', async () => {
      // Setup PO ($24,000 for 100 units = $240/ea)
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-APEX-01',
        items: [
          {
            lineId: 'LINE-1',
            productId: 'SKU-CPU-900',
            quantity: 100,
            unitPrice: 240,
            totalPrice: 24000,
            unitOfMeasure: 'PCS',
            expectedDeliveryDate: '2026-11-20',
          },
        ],
      });
      const poId = poRes.data.poId;
      await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      await poLifecycleEngine.releasePO(tenantA, poId, procurementManagerActor);

      // Setup GRN for 100 units
      const grnRes = await receivingGRNEngine.postGRN({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        poId,
        receivingId: 'RCV-DUMMY',
        warehouseId: 'WH-AUSTIN',
        items: [{ productId: 'SKU-CPU-900', acceptedQuantity: 100, unitCost: 240 }],
      });
      const grnId = grnRes.data.grnId;

      // Ingest mismatched invoice with price variance ($28,000 vs $26,070 total with freight/tax)
      const badInvRes = await invoicingMatchingEngine.ingestInvoice({
        tenantId: tenantA,
        actor: buyerActor,
        invoiceNumber: 'INV-APEX-9001',
        supplierId: 'SUP-APEX-01',
        poId,
        grnId,
        amount: 28000, // inflated price
        lineItems: [{ productId: 'SKU-CPU-900', quantity: 100, unitPrice: 280, lineTotal: 28000 }],
      });
      expect(badInvRes.success).toBe(true);
      const badInvId = badInvRes.data.invoiceId;

      // Duplicate invoice protection check
      const dupCheck = await invoicingMatchingEngine.ingestInvoice({
        tenantId: tenantA,
        actor: buyerActor,
        invoiceNumber: 'INV-APEX-9001', // same number & supplier
        supplierId: 'SUP-APEX-01',
        poId,
        amount: 28000,
        lineItems: [],
      });
      expect(dupCheck.success).toBe(false);
      expect(dupCheck.status).toBe('DENIED_POLICY');
      expect(dupCheck.message).toContain('Duplicate Invoice Protection');

      // 3-Way matching with discrepancy detection
      const badMatch = await invoicingMatchingEngine.performMatch({
        tenantId: tenantA,
        actor: financeDirectorActor,
        invoiceId: badInvId,
        matchMode: 'THREE_WAY',
      });
      expect(badMatch.success).toBe(true);
      expect(badMatch.data.status).toBe('MISMATCH');
      expect(badMatch.data.discrepancies.length).toBeGreaterThan(0);

      // Attempt payment handoff for mismatched invoice -> MUST BE DENIED
      const badHandoff = await invoicingMatchingEngine.createPaymentHandoff({
        tenantId: tenantA,
        actor: financeDirectorActor,
        invoiceId: badInvId,
        matchId: badMatch.data.matchId,
      });
      expect(badHandoff.success).toBe(false);
      expect(badHandoff.status).toBe('DENIED_POLICY');

      // Ingest correct invoice ($26,070 matches PO totalAmount)
      const poObj = poLifecycleEngine.getPO(tenantA, poId)!;
      const goodInvRes = await invoicingMatchingEngine.ingestInvoice({
        tenantId: tenantA,
        actor: buyerActor,
        invoiceNumber: 'INV-APEX-9002',
        supplierId: 'SUP-APEX-01',
        poId,
        grnId,
        amount: poObj.totalAmount,
        lineItems: [{ productId: 'SKU-CPU-900', quantity: 100, unitPrice: 240, lineTotal: 24000 }],
      });
      const goodInvId = goodInvRes.data.invoiceId;

      const goodMatch = await invoicingMatchingEngine.performMatch({
        tenantId: tenantA,
        actor: financeDirectorActor,
        invoiceId: goodInvId,
        matchMode: 'THREE_WAY',
      });
      expect(goodMatch.success).toBe(true);
      expect(goodMatch.data.status).toBe('MATCHED');

      // Governed Payment Handoff succeeds for approved matched invoice
      const goodHandoff = await invoicingMatchingEngine.createPaymentHandoff({
        tenantId: tenantA,
        actor: financeDirectorActor,
        invoiceId: goodInvId,
        matchId: goodMatch.data.matchId,
      });
      expect(goodHandoff.success).toBe(true);
      expect(goodHandoff.data.status).toBe('READY_FOR_HANDOFF');
    });
  });

  // ── 7. TRACEABILITY & SUPPLIER ANALYTICS ───────────────────────────────────
  describe('7. End-to-End Traceability & Supplier Analytics', () => {
    it('constructs a connected multi-stage traceability graph and calculates performance metrics', async () => {
      // 1. Create PR
      const pr = await sourcingEngine.createPR({
        tenantId: tenantA,
        actor: buyerActor,
        department: 'Engineering',
        costCenter: 'CC-ENG',
        priority: 'NORMAL',
        justification: 'New prototype run',
        items: [{ lineId: 'L1', productId: 'SKU-CPU-900', description: 'CPU', quantity: 50, unitOfMeasure: 'PCS', estimatedUnitCost: 240, requiredDate: '2026-12-01', deliveryLocation: 'Austin' }],
      });

      // 2. Create RFQ & Quote
      const rfq = await sourcingEngine.createRFQ({
        tenantId: tenantA,
        actor: buyerActor,
        title: 'Prototype RFQ',
        prId: pr.data.prId,
        invitedSupplierIds: ['SUP-APEX-01'],
        items: pr.data.items,
        submissionDeadline: '2026-11-01',
      });

      const quot = await sourcingEngine.submitQuotation({
        tenantId: tenantA,
        actor: buyerActor,
        rfqId: rfq.data.rfqId,
        supplierId: 'SUP-APEX-01',
        items: [{ productId: 'SKU-CPU-900', unitPrice: 240, moq: 50, leadTimeDays: 7 }],
      });

      // 3. Create PO linked to PR, RFQ, and Quotation
      const po = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-APEX-01',
        prId: pr.data.prId,
        rfqId: rfq.data.rfqId,
        quotationId: quot.data.quotationId,
        items: [{ lineId: 'L1', productId: 'SKU-CPU-900', quantity: 50, unitPrice: 240, totalPrice: 12000, unitOfMeasure: 'PCS', expectedDeliveryDate: '2026-12-01' }],
      });
      const poId = po.data.poId;
      await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      await poLifecycleEngine.releasePO(tenantA, poId, procurementManagerActor);
      await poLifecycleEngine.confirmPO(tenantA, poId, buyerActor);

      // 4. Create ASN
      await inboundLogisticsEngine.createASN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        supplierId: 'SUP-APEX-01',
        carrier: 'DHL Express',
        trackingNumber: 'DHL-8877',
        shippedDate: '2026-11-20',
        expectedArrivalDate: '2026-11-25',
        items: [{ productId: 'SKU-CPU-900', shippedQuantity: 50 }],
      });

      // 5. Post GRN
      await receivingGRNEngine.postGRN({
        tenantId: tenantA,
        actor: warehouseOperatorActor,
        poId,
        receivingId: 'RCV-PROTO',
        warehouseId: 'WH-AUSTIN',
        items: [{ productId: 'SKU-CPU-900', acceptedQuantity: 50, unitCost: 240 }],
      });

      // Query Traceability Tree
      const trace = scmTraceabilityEngine.getTraceForPO(tenantA, poId);
      expect(trace).toBeDefined();
      expect(trace?.type).toBe('PurchaseOrder');
      expect(trace?.id).toBe(poId);

      // Verify PR, RFQ, Quotation, ASN, and GRN child nodes exist
      const childTypes = trace?.children?.map((c) => c.type) || [];
      expect(childTypes).toContain('PurchaseRequisition');
      expect(childTypes).toContain('RFQ');
      expect(childTypes).toContain('Quotation');
      expect(childTypes).toContain('ASN');
      expect(childTypes).toContain('GRN');

      // Calculate Supplier Performance Metrics
      const metrics = supplierPerformanceEngine.calculateMetrics(tenantA, 'SUP-APEX-01');
      expect(metrics.tenantId).toBe(tenantA);
      expect(metrics.supplierId).toBe('SUP-APEX-01');
      expect(metrics.totalOrdersProcessed).toBeGreaterThan(0);
      expect(metrics.onTimeDeliveryRate).toBeGreaterThan(0);
    });
  });

  // ── 8. STRICT TENANT ISOLATION & AUTHORIZATION DENIALS ──────────────────────
  describe('8. Multi-Tenant Isolation & Role Authorization Gates', () => {
    it('prevents cross-tenant data leaks and unauthorized state mutations', async () => {
      // Create PO in Tenant A and approve it
      const poA = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-APEX-01',
        items: [{ lineId: 'L1', productId: 'SKU-1', quantity: 10, unitPrice: 100, totalPrice: 1000, unitOfMeasure: 'PCS', expectedDeliveryDate: '2026-12-01' }],
      });
      const poId = poA.data.poId;
      await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);

      // Tenant B actor attempting to mutate Tenant A PO -> MUST FAIL CLOSED
      const crossTenantRes = await poLifecycleEngine.releasePO(tenantA, poId, tenantBActor);
      expect(crossTenantRes.success).toBe(false);
      expect(crossTenantRes.status).toBe('DENIED_AUTHORIZATION');
      expect(crossTenantRes.message).toContain('Tenant isolation violation');

      // AI Agent attempting to release PO without human approval -> MUST FAIL CLOSED
      const aiRelease = await poLifecycleEngine.releasePO(tenantA, poId, aiAgentActor);
      expect(aiRelease.success).toBe(false);
      expect(aiRelease.status).toBe('DENIED_AUTHORIZATION');
    });
  });
});
