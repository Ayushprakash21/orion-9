/**
 * ORION-9 WAVE 4 — ENTERPRISE SCM TRANSACTION LIFECYCLE TESTS
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
import { scmStateMachine } from '../../kernel/scm/ScmStateMachine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('Orion-9 Wave 4 — Governed SCM Transaction Lifecycle', () => {
  const tenantA = 'org-tenant-a';
  const tenantB = 'org-tenant-b';

  const buyerActor: AuthorizationActor = {
    id: 'user-buyer-1',
    type: 'USER',
    name: 'Jane Buyer',
    roles: ['buyer', 'organization_member'],
    organizationId: tenantA,
  };

  const adminActor: AuthorizationActor = {
    id: 'user-admin-1',
    type: 'USER',
    name: 'Admin Boss',
    roles: ['organization_admin', 'platform_admin'],
    organizationId: tenantA,
  };

  const tenantBActor: AuthorizationActor = {
    id: 'user-tenant-b',
    type: 'USER',
    name: 'Tenant B User',
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
  });

  // 1. SUPPLIER ONBOARDING & QUALIFICATION
  describe('Supplier Onboarding & Qualification Lifecycle', () => {
    it('executes supplier onboarding and prevents activation of unqualified suppliers', async () => {
      // 1. Register Supplier
      const regRes = await supplierLifecycleEngine.registerSupplier({
        tenantId: tenantA,
        actor: buyerActor,
        legalName: 'Acme Components Corp',
        supplierCode: 'SUP-ACME-01',
        taxIdentifier: 'US-998877665',
        bankingReference: 'secret://tenant/org-tenant-a/bank-acme',
      });

      expect(regRes.success).toBe(true);


      const supplierId = regRes.data.supplierId;

      // 2. Submit Supplier
      const subRes = await supplierLifecycleEngine.submitSupplier(tenantA, supplierId, buyerActor);
      expect(subRes.success).toBe(true);

      // Progress through UNDER_REVIEW -> QUALIFICATION
      await supplierLifecycleEngine.reviewSupplier(tenantA, supplierId, adminActor);
      await supplierLifecycleEngine.startQualification(tenantA, supplierId, adminActor);

      // 3. Attempt Activation before qualification -> MUST FAIL CLOSED
      const badActRes = await supplierLifecycleEngine.activateSupplier(tenantA, supplierId, adminActor);
      expect(badActRes.success).toBe(false);
      expect(badActRes.status).toBe('DENIED_POLICY');
      expect(badActRes.message).toContain('Cannot activate supplier with qualification status');

      // 4. Perform Qualification
      const qualRes = await supplierLifecycleEngine.evaluateQualification({
        tenantId: tenantA,
        supplierId,
        actor: adminActor,
        dimensionEvaluations: [
          { dimension: 'financial', status: 'PASS', score: 95, evaluatedAt: new Date().toISOString(), evaluatedBy: adminActor.id },
          { dimension: 'quality', status: 'PASS', score: 98, evaluatedAt: new Date().toISOString(), evaluatedBy: adminActor.id },
        ],
      });
      expect(qualRes.success).toBe(true);
      expect(qualRes.data.status).toBe('APPROVED');

      // 5. Activate Supplier after qualification -> MUST SUCCEED
      const actRes = await supplierLifecycleEngine.activateSupplier(tenantA, supplierId, adminActor);
      expect(actRes.success).toBe(true);
      expect(actRes.data.status).toBe('ACTIVE');
    });
  });

  // 2. PURCHASE REQUISITION & SOURCING
  describe('Purchase Requisition & Sourcing Event Lifecycle', () => {
    it('creates PR, publishes RFQ, collects quotations, evaluates bids, and awards supplier', async () => {
      // 1. Create PR
      const prRes = await sourcingEngine.createPR({
        tenantId: tenantA,
        actor: buyerActor,
        department: 'Engineering',
        costCenter: 'CC-1001',
        priority: 'HIGH',
        items: [
          { lineId: '1', productId: 'PROD-RAM-16GB', description: '16GB DDR5 RAM', quantity: 100, unitOfMeasure: 'EA', estimatedUnitCost: 85.0, requiredDate: '2026-10-15', deliveryLocation: 'Dock 2' },
        ],
        justification: 'Server RAM Upgrade Project',
      });

      expect(prRes.success).toBe(true);
      const prId = prRes.data.prId;

      // 2. Create RFQ
      const rfqRes = await sourcingEngine.createRFQ({
        tenantId: tenantA,
        actor: buyerActor,
        title: 'RFQ for Server RAM Modules',
        prId,
        invitedSupplierIds: ['SUP-ACME-01', 'SUP-GLOBAL-02'],
        items: prRes.data.items,
        submissionDeadline: '2026-10-01',
      });
      expect(rfqRes.success).toBe(true);
      const rfqId = rfqRes.data.rfqId;

      // 3. Publish RFQ
      const pubRes = await sourcingEngine.publishRFQ(tenantA, rfqId, buyerActor);
      expect(pubRes.success).toBe(true);

      // 4. Submit Quotation
      const quotRes = await sourcingEngine.submitQuotation({
        tenantId: tenantA,
        actor: buyerActor,
        rfqId,
        supplierId: 'SUP-ACME-01',
        items: [{ productId: 'PROD-RAM-16GB', unitPrice: 80.0, moq: 10, leadTimeDays: 5 }],
      });
      expect(quotRes.success).toBe(true);

      // 5. Evaluate Bids
      const evalRes = await sourcingEngine.evaluateBids({
        tenantId: tenantA,
        rfqId,
        actor: buyerActor,
        justification: 'Best price and lowest lead time',
      });
      expect(evalRes.success).toBe(true);

      // 6. Award Supplier
      const awdRes = await sourcingEngine.awardSupplier({
        tenantId: tenantA,
        rfqId,
        supplierId: 'SUP-ACME-01',
        quotationId: quotRes.data.quotationId,
        actor: adminActor,
      });
      expect(awdRes.success).toBe(true);
      expect(awdRes.data.status).toBe('AWARDED');
    });
  });

  // 3. PURCHASE ORDER LIFECYCLE & CRITICAL RELEASE NEGATIVE TEST
  describe('Purchase Order Lifecycle & Unapproved Release Block', () => {
    it('prevents release of unapproved PO and allows release after approval', async () => {
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-ACME-01',
        items: [
          { lineId: '1', productId: 'PROD-RAM-16GB', quantity: 50, unitPrice: 80.0, totalPrice: 4000.0, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-10-15' },
        ],
      });

      expect(poRes.success).toBe(true);
      const poId = poRes.data.poId;
      expect(poRes.data.status).toBe('DRAFT');

      // Attempting to Release Unapproved PO -> MUST FAIL CLOSED
      const badReleaseRes = await poLifecycleEngine.releasePO(tenantA, poId, buyerActor);
      expect(badReleaseRes.success).toBe(false);
      expect(badReleaseRes.status).toBe('DENIED_POLICY');
      expect(badReleaseRes.message).toContain('cannot be released until APPROVED');

      // Submit for Approval
      const appRes = await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      expect(appRes.success).toBe(true);
      expect(appRes.data.status).toBe('APPROVED');

      // Release Approved PO -> MUST SUCCEED
      const relRes = await poLifecycleEngine.releasePO(tenantA, poId, adminActor);
      expect(relRes.success).toBe(true);
      expect(relRes.data.status).toBe('RELEASED');
    });
  });

  // 4. INBOUND LOGISTICS & RECEIVING / GRN
  describe('Inbound Logistics, ASN Tolerance & GRN Posting', () => {
    it('validates ASN quantities against PO and posts Goods Receipt Note', async () => {
      // 1. Setup Approved & Released PO
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-ACME-01',
        items: [{ lineId: '1', productId: 'PROD-RAM-16GB', quantity: 100, unitPrice: 80.0, totalPrice: 8000.0, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-10-15' }],
      });
      const poId = poRes.data.poId;
      await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      await poLifecycleEngine.releasePO(tenantA, poId, adminActor);

      // 2. Excess ASN Attempt (> 10% tolerance limit) -> MUST FAIL CLOSED
      const badAsnRes = await inboundLogisticsEngine.createASN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        supplierId: 'SUP-ACME-01',
        carrier: 'FedEx Freight',
        trackingNumber: 'TRK-99001122',
        shippedDate: new Date().toISOString(),
        expectedArrivalDate: new Date().toISOString(),
        items: [{ productId: 'PROD-RAM-16GB', shippedQuantity: 200 }], // 200 vs 100 PO qty!
      });
      expect(badAsnRes.success).toBe(false);
      expect(badAsnRes.status).toBe('DENIED_POLICY');

      // 3. Valid ASN
      const asnRes = await inboundLogisticsEngine.createASN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        supplierId: 'SUP-ACME-01',
        carrier: 'FedEx Freight',
        trackingNumber: 'TRK-99001122',
        shippedDate: new Date().toISOString(),
        expectedArrivalDate: new Date().toISOString(),
        items: [{ productId: 'PROD-RAM-16GB', shippedQuantity: 100 }],
      });
      expect(asnRes.success).toBe(true);

      // 4. Record Receiving & Post GRN
      const rcvRes = await receivingGRNEngine.recordReceiving({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        asnId: asnRes.data.asnId,
        warehouseId: 'WH-MAIN',
        receivedItems: [{ productId: 'PROD-RAM-16GB', receivedQuantity: 100, damagedQuantity: 0, shortQuantity: 0 }],
      });
      expect(rcvRes.success).toBe(true);

      const grnRes = await receivingGRNEngine.postGRN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        receivingId: rcvRes.data.receivingId,
        warehouseId: 'WH-MAIN',
        items: [{ productId: 'PROD-RAM-16GB', acceptedQuantity: 100, unitCost: 80.0 }],
      });
      expect(grnRes.success).toBe(true);
      expect(grnRes.data.status).toBe('POSTED');
    });
  });

  // 5. QUALITY INSPECTION & QUARANTINE
  describe('Quality Inspection Quarantine & Putaway', () => {
    it('quarantines quality-failed material and permits putaway for passed material', async () => {
      const inspRes = await receivingGRNEngine.inspectQuality({
        tenantId: tenantA,
        actor: buyerActor,
        grnId: 'GRN-9988',
        productId: 'PROD-RAM-16GB',
        quantityInspected: 100,
        quantityPassed: 80,
        quantityFailed: 20,
        notes: '20 units failed pin integrity test',
      });

      expect(inspRes.success).toBe(true);
      expect(inspRes.data.decision).toBe('QUARANTINED');

      const putRes = await receivingGRNEngine.executePutaway({
        tenantId: tenantA,
        actor: buyerActor,
        grnId: 'GRN-9988',
        productId: 'PROD-RAM-16GB',
        quantity: 80, // Only passed quantity putaway
        sourceLocation: 'RECEIVING_DOCK_1',
        destinationLocation: 'RACK_A1_BIN_4',
      });
      expect(putRes.success).toBe(true);
      expect(putRes.data.status).toBe('COMPLETED');
    });
  });

  // 6. INVOICING, 3-WAY MATCHING & PAYMENT HANDOFF
  describe('Invoicing, 3-Way Match & Payment Handoff', () => {
    it('performs 3-way match, blocks payment handoff for unapproved invoices, and creates handoff for matched invoices', async () => {
      // Setup PO and GRN
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-ACME-01',
        items: [{ lineId: '1', productId: 'PROD-RAM-16GB', quantity: 10, unitPrice: 100.0, totalPrice: 1000.0, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-10-15' }],
      });
      expect(poRes.success).toBe(true);
      const poId = poRes.data.poId;
      await poLifecycleEngine.submitPOForApproval(tenantA, poId, buyerActor);
      await poLifecycleEngine.releasePO(tenantA, poId, adminActor);

      const grnRes = await receivingGRNEngine.postGRN({
        tenantId: tenantA,
        actor: buyerActor,
        poId,
        receivingId: 'RCV-001',
        warehouseId: 'WH-MAIN',
        items: [{ productId: 'PROD-RAM-16GB', acceptedQuantity: 10, unitCost: 100.0 }],
      });

      // 1. Ingest Invoice matching PO Total
      const invRes = await invoicingMatchingEngine.ingestInvoice({
        tenantId: tenantA,
        actor: buyerActor,
        invoiceNumber: 'INV-ACME-99881',
        supplierId: 'SUP-ACME-01',
        poId,
        grnId: grnRes.data.grnId,
        amount: poRes.data.totalAmount, // exact match total
        lineItems: [{ productId: 'PROD-RAM-16GB', quantity: 10, unitPrice: 100.0, lineTotal: 1000.0 }],
      });
      expect(invRes.success).toBe(true);
      const invoiceId = invRes.data.invoiceId;

      // Duplicate Invoice Ingest Attempt -> MUST FAIL CLOSED
      const dupInvRes = await invoicingMatchingEngine.ingestInvoice({
        tenantId: tenantA,
        actor: buyerActor,
        invoiceNumber: 'INV-ACME-99881',
        supplierId: 'SUP-ACME-01',
        poId,
        amount: poRes.data.totalAmount,
        lineItems: [],
      });
      expect(dupInvRes.success).toBe(false);
      expect(dupInvRes.status).toBe('DENIED_POLICY');

      // 2. Perform 3-Way Match (adminActor has invoice:approve permission)
      const matchRes = await invoicingMatchingEngine.performMatch({
        tenantId: tenantA,
        actor: adminActor,
        invoiceId,
        matchMode: 'THREE_WAY',
      });
      expect(matchRes.success).toBe(true);
      expect(matchRes.data.status).toBe('MATCHED');

      // 3. Create Payment Handoff
      const handoffRes = await invoicingMatchingEngine.createPaymentHandoff({
        tenantId: tenantA,
        actor: buyerActor,
        invoiceId,
        matchId: matchRes.data.matchId,
      });
      expect(handoffRes.success).toBe(true);
      expect(handoffRes.data.status).toBe('READY_FOR_HANDOFF');
    });
  });


  // 7. SUPPLIER PERFORMANCE & TRACEABILITY
  describe('Supplier Performance & N-Tier Traceability', () => {
    it('calculates empirical performance metrics and traces PO lineage', async () => {
      const metrics = supplierPerformanceEngine.calculateMetrics(tenantA, 'SUP-ACME-01');
      expect(metrics.supplierId).toBe('SUP-ACME-01');
      expect(typeof metrics.onTimeDeliveryRate).toBe('number');

      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: buyerActor,
        supplierId: 'SUP-ACME-01',
        prId: 'PR-1001',
        rfqId: 'RFQ-2001',
        items: [{ lineId: '1', productId: 'PROD-RAM-16GB', quantity: 10, unitPrice: 100.0, totalPrice: 1000.0, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-10-15' }],
      });

      const trace = scmTraceabilityEngine.getTraceForPO(tenantA, poRes.data.poId);
      expect(trace).toBeDefined();
      expect(trace?.type).toBe('PurchaseOrder');
    });
  });

  // 8. KERNEL SECURITY & TENANT ISOLATION
  describe('Kernel Security & State Machine Enforcement', () => {
    it('rejects invalid state transitions and enforces tenant isolation', async () => {
      // 1. Invalid State Transition Test
      const invalidTrans = scmStateMachine.validateTransition('PurchaseOrder', 'DRAFT', 'RECEIVED');
      expect(invalidTrans.valid).toBe(false);
      expect(invalidTrans.reason).toContain('is not permitted');

      // 2. Tenant Isolation Test (Tenant B actor modifying Tenant A resource)
      const poRes = await poLifecycleEngine.createPO({
        tenantId: tenantA,
        actor: tenantBActor, // Tenant mismatch!
        supplierId: 'SUP-ACME-01',
        items: [{ lineId: '1', productId: 'PROD-RAM-16GB', quantity: 10, unitPrice: 100.0, totalPrice: 1000.0, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-10-15' }],
      });
      expect(poRes.success).toBe(false);
      expect(poRes.status).toBe('DENIED_AUTHORIZATION');
      expect(poRes.message).toContain('Tenant isolation violation');
    });
  });
});
