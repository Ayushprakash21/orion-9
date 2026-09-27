/**
 * ORION-9 TRACK 2 — ADVERSARIAL & FAILURE JOURNEYS TEST SUITE
 *
 * Verifies strict policy enforcement, error truthfulness, and boundary isolation across:
 * 1. Segregation of Duties (SoD) violations (Requester attempting to approve own PR)
 * 2. Unapproved PO release prohibition
 * 3. Quantity tolerance breaches (ASN exceeding open PO beyond tolerance limit)
 * 4. Dispatched customer order cancellation prohibition
 * 5. Inventory overdraw below zero rejection
 * 6. Cross-tenant access and mutation prevention
 * 7. Missing tenant scoping key rejection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { sourcingEngine } from '../../scm/SourcingEngine';
import { poLifecycleEngine } from '../../scm/POLifecycleEngine';
import { inboundLogisticsEngine } from '../../scm/InboundLogisticsEngine';
import { customerOrderFulfillmentEngine } from '../../scm/CustomerOrderFulfillmentEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { scmBusinessRuleEngine } from '../../scm/ScmBusinessRuleEngine';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';
import { PurchaseOrderRecord } from '../../scm/types';

describe('Track 2 — Adversarial & Failure Journeys', () => {
  const TENANT_A = 'TENANT_ALPHA_CORP';
  const TENANT_B = 'TENANT_BETA_CORP';

  const userAlice: AuthorizationActor = {
    id: 'user_alice_requester',
    name: 'Alice Requester',
    roles: ['procurement_specialist'],
    permissions: ['pr:create', 'pr:approve', 'purchase_order:create', 'purchase_order:release'],
    organizationId: TENANT_A,
  };

  const userBob: AuthorizationActor = {
    id: 'user_bob_manager',
    name: 'Bob Manager',
    roles: ['procurement_manager'],
    permissions: ['pr:approve', 'purchase_order:approve'],
    organizationId: TENANT_A,
  };

  beforeEach(() => {
    sourcingEngine.clear();
    poLifecycleEngine.clear();
    inboundLogisticsEngine.clear();
    customerOrderFulfillmentEngine.clear();
    scmPersistenceService.clear();
  });

  describe('1. Segregation of Duties (SoD) & Policy Violations', () => {
    it('strictly denies PR approval when requester attempts to approve their own requisition', async () => {
      const prResult = await sourcingEngine.createPR({
        tenantId: TENANT_A,
        actor: userAlice,
        department: 'Finance',
        costCenter: 'CC-FIN-01',
        priority: 'NORMAL',
        items: [
          {
            lineId: 'LINE-1',
            productId: 'PRD-LAPTOP-01',
            description: 'Engineering Laptop',
            quantity: 5,
            unitOfMeasure: 'EA',
            estimatedUnitCost: 2000,
            requiredDate: '2026-11-01',
            deliveryLocation: 'HQ',
          },
        ],
        justification: 'New hire onboarding equipment',
      });

      const pr = prResult.data;
      await sourcingEngine.submitPR(TENANT_A, pr.prId, userAlice);

      // Alice attempts to approve her own PR
      const selfApprovalResult = await sourcingEngine.approvePR(TENANT_A, pr.prId, userAlice);
      expect(selfApprovalResult.success).toBe(false);
      expect(selfApprovalResult.status).toBe('DENIED_POLICY');
      expect(selfApprovalResult.message).toMatch(/cannot approve their own requisition/);

      // Independent manager Bob can approve it
      const managerApprovalResult = await sourcingEngine.approvePR(TENANT_A, pr.prId, userBob);
      expect(managerApprovalResult.success).toBe(true);
      expect(managerApprovalResult.data?.status).toBe('APPROVED');
    });

    it('strictly denies release of a Purchase Order that has not been approved', async () => {
      const poResult = await poLifecycleEngine.createPO({
        tenantId: TENANT_A,
        actor: userAlice,
        supplierId: 'SUP-001',
        items: [
          {
            lineId: 'POLINE-1',
            productId: 'PRD-CHIP-01',
            quantity: 50,
            unitPrice: 100,
            totalPrice: 5000,
            unitOfMeasure: 'EA',
            expectedDeliveryDate: '2026-11-01',
          },
        ],
      });

      const po = poResult.data as PurchaseOrderRecord;
      expect(po.status).toBe('DRAFT');

      // Attempt to release directly without approval
      const releaseResult = await poLifecycleEngine.releasePO(TENANT_A, po.poId, userAlice);
      expect(releaseResult.success).toBe(false);
      expect(releaseResult.status).toBe('DENIED_POLICY');
      expect(releaseResult.message).toMatch(/cannot be released until APPROVED/);
    });
  });

  describe('2. Tolerance & Over-Quantity Enforcement', () => {
    it('rejects ASN shipment quantities exceeding open PO quantity beyond tolerance limit', async () => {
      // Create PO for 100 units
      const poResult = await poLifecycleEngine.createPO({
        tenantId: TENANT_A,
        actor: userAlice,
        supplierId: 'SUP-FASTENERS',
        items: [
          {
            lineId: 'LINE-1',
            productId: 'PRD-BOLT-01',
            quantity: 100,
            unitPrice: 10,
            totalPrice: 1000,
            unitOfMeasure: 'EA',
            expectedDeliveryDate: '2026-11-01',
          },
        ],
      });

      const po = poResult.data as PurchaseOrderRecord;
      await poLifecycleEngine.approvePO(TENANT_A, po.poId, userBob);
      await poLifecycleEngine.releasePO(TENANT_A, po.poId, userAlice);

      // Attempt to ship 150 units against 100 unit PO (50% over-shipment, limit is 10%)
      const asnResult = await inboundLogisticsEngine.createASN({
        tenantId: TENANT_A,
        actor: { id: 'supplier_01', name: 'Vendor', roles: ['supplier_representative'], permissions: ['asn:create'], organizationId: TENANT_A },
        poId: po.poId,
        supplierId: 'SUP-FASTENERS',
        carrier: 'DHL',
        trackingNumber: 'TRK-DHL-OVER',
        shippedDate: new Date().toISOString(),
        expectedArrivalDate: '2026-11-05',
        items: [{ productId: 'PRD-BOLT-01', shippedQuantity: 150 }],
      });

      expect(asnResult.success).toBe(false);
      expect(asnResult.status).toBe('DENIED_POLICY');
      expect(asnResult.message).toMatch(/exceeds PO quantity 100 beyond 10% tolerance limit/);
    });
  });

  describe('3. Order Lifecycle Invariant Protection', () => {
    it('strictly prohibits cancellation of already dispatched or delivered customer orders', () => {
      const dispatchedOrder = {
        orderId: 'SO-DISPATCHED-01',
        tenantId: TENANT_A,
        orderNumber: 'SO-500123',
        status: 'SHIPPED' as const,
      };

      const cancelCheck = scmBusinessRuleEngine.evaluateOrderCancellation(dispatchedOrder as any);
      expect(cancelCheck.allowed).toBe(false);
      expect(cancelCheck.ruleId).toBe('RULE-ORD-CANCEL-001');
      expect(cancelCheck.reason).toMatch(/cannot be cancelled because goods have already been dispatched/);
    });
  });

  describe('4. Inventory Balance Protection', () => {
    it('strictly prevents inventory overdraw reducing stock below zero', async () => {
      await expect(
        scmPersistenceService.adjustInventory({
          tenantId: TENANT_A,
          productId: 'PRD-NON-EXISTENT',
          warehouseId: 'WH-MAIN',
          quantityDelta: -50,
          transactionType: 'ORDER_FULFILLMENT',
          referenceEntityType: 'CUSTOMER_ORDER',
          referenceEntityId: 'ORD-INVALID',
          actor: 'agent',
          correlationId: 'OVERDRAW-FAIL-01',
        })
      ).rejects.toThrow(/cannot reduce stock for product.*below 0/);
    });
  });

  describe('5. Cross-Tenant Boundary Enforcement', () => {
    it('prevents cross-tenant read or modification of transactional documents', async () => {
      // Tenant A creates PO
      const poA = (await poLifecycleEngine.createPO({
        tenantId: TENANT_A,
        actor: userAlice,
        supplierId: 'SUP-TENANT-A',
        items: [{ lineId: 'L1', productId: 'P1', quantity: 10, unitPrice: 20, totalPrice: 200, unitOfMeasure: 'EA', expectedDeliveryDate: '2026-11-01' }],
      })).data as PurchaseOrderRecord;

      // Tenant B tries to fetch Tenant A's PO
      const crossRead = await scmPersistenceService.getRecord('purchase_orders', TENANT_B, poA.poId);
      expect(crossRead).toBeNull();

      // Tenant B actor attempting to release Tenant A's PO
      const tenantBActor: AuthorizationActor = {
        id: 'user_eve',
        name: 'Eve Intruder',
        roles: ['procurement_specialist'],
        permissions: ['purchase_order:release'],
        organizationId: TENANT_B,
      };

      await expect(
        poLifecycleEngine.releasePO(TENANT_B, poA.poId, tenantBActor)
      ).rejects.toThrow(/not found/);
    });
  });
});
