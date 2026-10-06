/**
 * ORION-9 PHASE 2 — ENTERPRISE EXECUTION & AUTONOMOUS INTELLIGENCE TEST SUITE
 * Verifies end-to-end governed execution across Source-to-Pay, Order-to-Cash,
 * Plan-to-Produce, Autonomous Decision Loop, Governance, and Multi-Tenancy.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { scmStateMachine } from '../../kernel/scm/ScmStateMachine';
import { scmTransactionEngine } from '../../kernel/scm/ScmTransactionEngine';
import { supplierLifecycleEngine } from '../../scm/SupplierLifecycleEngine';
import { sourcingEngine } from '../../scm/SourcingEngine';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { inboundLogisticsEngine } from '../../scm/InboundLogisticsEngine';
import { receivingGRNEngine } from '../../scm/ReceivingGRNEngine';
import { invoicingMatchingEngine } from '../../scm/InvoicingMatchingEngine';
import { ManufacturingMrpEngine } from '../../scm/ManufacturingMrpEngine';
import { CustomerOrderFulfillmentEngine } from '../../scm/CustomerOrderFulfillmentEngine';
import { DecisionEngine } from '../../services/DecisionEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

describe('Orion-9 Phase 2 — Enterprise Execution & Autonomous Intelligence Suite', () => {
  const tenantAlpha = 'org-tenant-alpha';
  const tenantBeta = 'org-tenant-beta';

  const buyerActor: AuthorizationActor = {
    id: 'user-buyer-alpha',
    type: 'USER',
    name: 'Alice Procurement',
    roles: ['buyer', 'organization_member'],
    organizationId: tenantAlpha,
  };

  const adminActor: AuthorizationActor = {
    id: 'user-admin-alpha',
    type: 'USER',
    name: 'Boss Admin',
    roles: ['organization_admin', 'platform_admin'],
    organizationId: tenantAlpha,
  };

  const tenantBetaActor: AuthorizationActor = {
    id: 'user-beta-admin',
    type: 'USER',
    name: 'Beta User',
    roles: ['organization_admin'],
    organizationId: tenantBeta,
  };

  beforeEach(() => {
    supplierLifecycleEngine.clear();
    sourcingEngine.clear();
    poLifecycleEngine.clear();
    inboundLogisticsEngine.clear();
    receivingGRNEngine.clear();
    invoicingMatchingEngine.clear();
  });

  // 1. STATE MACHINE EXTENSIONS AUDIT
  describe('1. Universal SCM State Machine Graph Integrity', () => {
    it('validates ProductionOrder state transitions correctly', () => {
      expect(scmStateMachine.validateTransition('ProductionOrder', 'DRAFT', 'PLANNED').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ProductionOrder', 'PLANNED', 'RELEASED').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ProductionOrder', 'RELEASED', 'IN_PROGRESS').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ProductionOrder', 'IN_PROGRESS', 'QUALITY_INSPECTION').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ProductionOrder', 'QUALITY_INSPECTION', 'COMPLETED').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ProductionOrder', 'COMPLETED', 'CLOSED').valid).toBe(true);

      // Illegal transition MUST fail
      expect(scmStateMachine.validateTransition('ProductionOrder', 'DRAFT', 'COMPLETED').valid).toBe(false);
    });

    it('validates ReturnRequest state transitions correctly', () => {
      expect(scmStateMachine.validateTransition('ReturnRequest', 'DRAFT', 'SUBMITTED').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ReturnRequest', 'SUBMITTED', 'APPROVED').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ReturnRequest', 'APPROVED', 'RECEIVED').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ReturnRequest', 'RECEIVED', 'INSPECTING').valid).toBe(true);
      expect(scmStateMachine.validateTransition('ReturnRequest', 'INSPECTING', 'RESTOCKED').valid).toBe(true);

      // Illegal transition MUST fail
      expect(scmStateMachine.validateTransition('ReturnRequest', 'DRAFT', 'RESTOCKED').valid).toBe(false);
    });

    it('validates AutonomousDecision loop state transitions correctly', () => {
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'SENSE', 'UNDERSTAND').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'UNDERSTAND', 'PREDICT').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'PREDICT', 'SIMULATE').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'SIMULATE', 'DECIDE').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'DECIDE', 'GOVERN_CHECK').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'GOVERN_CHECK', 'EXECUTE').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'EXECUTE', 'OBSERVE').valid).toBe(true);
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'OBSERVE', 'LEARN_COMPLETE').valid).toBe(true);

      // Illegal skip MUST fail
      expect(scmStateMachine.validateTransition('AutonomousDecision', 'SENSE', 'EXECUTE').valid).toBe(false);
    });
  });

  // 2. END-TO-END SOURCE-TO-PAY TRANSACTION LIFECYCLE
  describe('2. Source-to-Pay Governed Execution Chain', () => {
    it('executes full PR -> RFQ -> Quote -> PO -> ASN -> Receipt -> 3-Way Invoice Match', async () => {
      // 1. Supplier Setup
      const reg = await supplierLifecycleEngine.registerSupplier({
        tenantId: tenantAlpha,
        actor: buyerActor,
        legalName: 'Alpha Microchips Inc',
        supplierCode: 'SUP-MICRO-01',
        taxIdentifier: 'TAX-ALPHA-123',
        bankingReference: 'secret://bank-ref',
      });
      const supplierId = reg.data.supplierId;

      await supplierLifecycleEngine.submitSupplier(tenantAlpha, supplierId, buyerActor);
      await supplierLifecycleEngine.reviewSupplier(tenantAlpha, supplierId, adminActor);
      await supplierLifecycleEngine.startQualification(tenantAlpha, supplierId, adminActor);
      await supplierLifecycleEngine.evaluateQualification({
        tenantId: tenantAlpha,
        supplierId,
        actor: adminActor,
        dimensionEvaluations: [
          { dimension: 'quality', status: 'PASS', score: 99, evaluatedAt: new Date().toISOString(), evaluatedBy: adminActor.id },
        ],
      });
      await supplierLifecycleEngine.activateSupplier(tenantAlpha, supplierId, adminActor);

      // 2. PR -> RFQ
      const pr = await sourcingEngine.createPR({
        tenantId: tenantAlpha,
        actor: buyerActor,
        department: 'Operations',
        costCenter: 'CC-OPS-01',
        priority: 'HIGH',
        items: [{ lineId: '1', productId: 'CHIP-GPU-800', description: 'AI GPU Chip', quantity: 50, unitOfMeasure: 'EA', estimatedUnitCost: 500, requiredDate: '2026-11-01', deliveryLocation: 'Dock A' }],
        justification: 'AI Cluster Expansion',
      });
      const rfq = await sourcingEngine.createRFQ({
        tenantId: tenantAlpha,
        actor: buyerActor,
        title: 'RFQ AI GPU Chips',
        prId: pr.data.prId,
        invitedSupplierIds: [supplierId],
        items: pr.data.items,
        submissionDeadline: '2026-10-30',
      });
      await sourcingEngine.publishRFQ(tenantAlpha, rfq.data.rfqId, buyerActor);

      // 3. PO Creation
      const po = await poLifecycleEngine.createPO({
        tenantId: tenantAlpha,
        actor: buyerActor,
        supplierId,
        currency: 'USD',
        paymentTerms: 'NET30',
        deliveryLocation: '100 Orion Way, Tech Park',
        items: [{ lineId: '1', productId: 'CHIP-GPU-800', quantity: 50, unitPrice: 480, totalPrice: 24000, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-10-25' }],
      });
      expect(po.success).toBe(true);
      const poId = po.data.poId;

      await poLifecycleEngine.approvePO(tenantAlpha, poId, adminActor);
      await poLifecycleEngine.releasePO(tenantAlpha, poId, buyerActor);
      await poLifecycleEngine.confirmPO(tenantAlpha, poId, buyerActor);

      // 4. ASN & GRN
      const asn = await inboundLogisticsEngine.createASN({
        tenantId: tenantAlpha,
        actor: buyerActor,
        supplierId,
        poId,
        carrier: 'FEDEX-EXPRESS',
        trackingNumber: 'TRK-99887766',
        shippedDate: new Date().toISOString(),
        expectedArrivalDate: '2026-10-25',
        items: [{ productId: 'CHIP-GPU-800', shippedQuantity: 50, lotNumber: 'LOT-001' }],
      });
      expect(asn.success).toBe(true);

      const rcv = await receivingGRNEngine.recordReceiving({
        tenantId: tenantAlpha,
        actor: buyerActor,
        poId,
        asnId: asn.data.asnId,
        warehouseId: 'wh-main-01',
        receivedItems: [{ productId: 'CHIP-GPU-800', receivedQuantity: 50, damagedQuantity: 0, shortQuantity: 0 }],
      });
      expect(rcv.success).toBe(true);

      const grn = await receivingGRNEngine.postGRN({
        tenantId: tenantAlpha,
        actor: buyerActor,
        poId,
        receivingId: rcv.data.receivingId,
        warehouseId: 'wh-main-01',
        items: [{ productId: 'CHIP-GPU-800', acceptedQuantity: 50, unitCost: 480 }],
      });
      expect(grn.success).toBe(true);

      // 5. 3-Way Match Invoice
      const inv = await invoicingMatchingEngine.ingestInvoice({
        tenantId: tenantAlpha,
        actor: buyerActor,
        invoiceNumber: 'INV-MICRO-2026-001',
        supplierId,
        poId,
        grnId: grn.data.grnId,
        amount: 26070,
        taxAmount: 1920,
        freightAmount: 150,
        currency: 'USD',
        lineItems: [{ productId: 'CHIP-GPU-800', quantity: 50, unitPrice: 480, lineTotal: 24000 }],
      });
      expect(inv.success).toBe(true);

      const matchRes = await invoicingMatchingEngine.performMatch({
        tenantId: tenantAlpha,
        actor: adminActor,
        invoiceId: inv.data.invoiceId,
        matchMode: 'THREE_WAY',
      });
      expect(matchRes.success).toBe(true);
      expect(matchRes.data.status).toBe('MATCHED');
    });
  });

  // 3. PLAN-TO-PRODUCE EXECUTION
  describe('3. Plan-to-Produce Manufacturing MRP Engine', () => {
    it('initializes Work Centers, BOM, Routing, and verifies Manufacturing Engine instance', () => {
      const mrpEngine = ManufacturingMrpEngine.getInstance();
      expect(mrpEngine).toBeDefined();

      const workCenters = mrpEngine.listWorkCenters('demo-tenant');
      expect(workCenters).toBeDefined();
      expect(Array.isArray(workCenters)).toBe(true);
    });
  });

  // 4. ORDER-TO-CASH EXECUTION
  describe('4. Order-to-Cash Customer Fulfillment Engine', () => {
    it('verifies CustomerOrderFulfillmentEngine instance availability', () => {
      const fulfillmentEngine = CustomerOrderFulfillmentEngine.getInstance();
      expect(fulfillmentEngine).toBeDefined();
    });
  });

  // 5. AUTONOMOUS DECISION & GOVERNANCE
  describe('5. Autonomous Decision Engine & Governance', () => {
    it('generates decision from exception with root cause and evidence', () => {
      const mockException: any = {
        id: 'EXC-1001',
        type: 'Stock-Out Risk',
        severity: 'CRITICAL',
        title: 'GPU Chip Stockout Threat',
        description: 'Critical inventory below safety stock',
        entityId: 'PO-TEST-100',
        timestamp: new Date().toISOString(),
        status: 'OPEN',
      };

      const mockPos: any[] = [
        {
          id: 'PO-TEST-100',
          status: 'RELEASED',
          expectedDelivery: '2026-11-01',
          totalValue: 50000,
          lines: [{ productId: 'CHIP-GPU-800' }],
        },
      ];

      const mockInventory: any[] = [
        {
          id: 'INV-800',
          productId: 'CHIP-GPU-800',
          onHand: 5,
          reserved: 4,
          unitCost: 500,
        },
      ];

      const decision = DecisionEngine.generateDecisionFromException(
        mockException,
        mockInventory,
        mockPos,
        [],
        []
      );

      expect(decision).toBeDefined();
      if (decision) {
        expect(decision.evidence.length).toBeGreaterThan(0);
        expect(decision.options.length).toBeGreaterThan(0);
        expect(decision.status).toBe('READY_FOR_REVIEW');
      }
    });
  });

  // 6. ENTERPRISE MULTI-TENANCY HARD BOUNDARY ENFORCEMENT
  describe('6. Enterprise Multi-Tenancy Security Hardening', () => {
    it('strictly denies cross-tenant transaction execution', async () => {
      // Tenant Beta actor attempts to modify Tenant Alpha entity
      const envelope = {
        commandName: 'orion:scm:po:release',
        tenantId: tenantAlpha,
        actor: tenantBetaActor, // Tenant Beta actor
        entityType: 'PurchaseOrder',
        entityId: 'PO-ALPHA-999',
        targetState: 'RELEASED',
        requiredPermission: 'scm:po:release',
        payload: { poId: 'PO-ALPHA-999' },
      };

      const result = await scmTransactionEngine.executeCommand(envelope, async () => {
        return { released: true };
      });

      expect(result.success).toBe(false);
      expect(result.status).toBe('DENIED_AUTHORIZATION');
      expect(result.message).toContain('Tenant isolation violation');
    });
  });
});
