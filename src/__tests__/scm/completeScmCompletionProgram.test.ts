/**
 * ORION-9 SCM 0→100 COMPLETION PROGRAM TEST SUITE
 * Manufacturing/MRP, Returns & Reverse Logistics, Supply Planning, Landed Cost & Contracts
 */

import { describe, it, expect } from 'vitest';
import { manufacturingMrpEngine } from '../../scm/ManufacturingMrpEngine';
import { returnsReverseLogisticsEngine } from '../../scm/ReturnsReverseLogisticsEngine';
import { supplyPlanningEngine } from '../../scm/SupplyPlanningEngine';
import { landedCostEngine } from '../../scm/LandedCostEngine';
import { contractLifecycleEngine } from '../../scm/ContractLifecycleEngine';

describe('ORION-9 Master SCM Completion Program Suite', () => {
  const tenantA = 'demo-tenant';
  const tenantB = 'TENANT_BETA';

  // --------------------------------------------------------------------------
  // 1. Manufacturing & MRP Lifecycle
  // --------------------------------------------------------------------------
  describe('Manufacturing & MRP Lifecycle', () => {
    it('creates BOM, explodes components and generates a production order', () => {
      const bom = manufacturingMrpEngine.createBOM({
        tenantId: tenantA,
        bomNumber: 'BOM-TEST-100',
        finishedProductId: 'prod-test-srv',
        finishedProductName: 'Test Server Blade',
        version: 1,
        isActive: true,
        baseQuantity: 1,
        components: [
          {
            componentProductId: 'prod-chip-gpu',
            componentName: 'GPU Processor',
            quantityPerUnit: 2,
            unitOfMeasure: 'EA',
            scrapFactorPercent: 5,
            isCritical: true,
            leadTimeDays: 7
          }
        ],
        effectiveFrom: '2026-01-01'
      });

      expect(bom.bomId).toBeDefined();

      // Explode BOM
      const exploded = manufacturingMrpEngine.explodeBOM(bom.bomId, 10);
      expect(exploded.length).toBe(1);
      expect(exploded[0].requiredQuantity).toBe(21); // 20 + 5% scrap = 21

      // Create Production Order
      const order = manufacturingMrpEngine.createProductionOrder({
        tenantId: tenantA,
        productId: 'prod-test-srv',
        bomId: bom.bomId,
        routingId: 'rtg-01',
        warehouseId: 'wh-central-01',
        plannedQuantity: 10,
        startDate: '2026-10-01',
        dueDate: '2026-10-15',
        actor: 'planner_user'
      });

      expect(order.status).toBe('PLANNED');

      // Release Order
      const released = manufacturingMrpEngine.releaseProductionOrder(order.productionOrderId, tenantA, 'supervisor');
      expect(released.status).toBe('RELEASED');

      // Issue Material
      const issue = manufacturingMrpEngine.issueMaterial({
        tenantId: tenantA,
        productionOrderId: order.productionOrderId,
        componentProductId: 'prod-chip-gpu',
        quantityIssued: 21,
        warehouseId: 'wh-central-01',
        actor: 'storekeeper'
      });
      expect(issue.quantityIssued).toBe(21);

      // Confirm Operation
      const confirm = manufacturingMrpEngine.confirmOperation({
        tenantId: tenantA,
        productionOrderId: order.productionOrderId,
        operationNumber: 10,
        workCenterId: 'wc-smt-01',
        yieldQuantity: 10,
        scrapQuantity: 0,
        reworkQuantity: 0,
        actualLaborHours: 4,
        actualMachineHours: 4,
        actor: 'line_tech'
      });
      expect(confirm.yieldQuantity).toBe(10);

      // Complete Order
      const completed = manufacturingMrpEngine.completeProductionOrder(order.productionOrderId, tenantA, 'qa_lead');
      expect(completed.status).toBe('COMPLETED');
      expect(completed.completedQuantity).toBe(10);
    });
  });

  // --------------------------------------------------------------------------
  // 2. Returns & Reverse Logistics
  // --------------------------------------------------------------------------
  describe('Returns & Reverse Logistics', () => {
    it('executes full RMA lifecycle from request to disposition and credit note', () => {
      // 1. Request RMA
      const rma = returnsReverseLogisticsEngine.requestRMA({
        tenantId: tenantA,
        customerOrderId: 'cord-5511',
        customerId: 'cust-apex-corp',
        productId: 'prod-srv-900',
        quantityReturned: 1,
        returnReason: 'DEFECTIVE',
        notes: 'Faulty memory socket'
      });
      expect(rma.status).toBe('REQUESTED');

      // 2. Approve RMA
      const approved = returnsReverseLogisticsEngine.approveRMA(rma.rmaId, tenantA, 'cs_manager');
      expect(approved.status).toBe('APPROVED');

      // 3. Receive Return at Gate
      const receipt = returnsReverseLogisticsEngine.receiveReturn({
        tenantId: tenantA,
        rmaId: rma.rmaId,
        warehouseId: 'wh-central-01',
        quantityReceived: 1,
        receiver: 'dock_worker'
      });
      expect(receipt.quantityReceived).toBe(1);

      // 4. Inspect Return
      const inspection = returnsReverseLogisticsEngine.inspectReturn({
        tenantId: tenantA,
        rmaId: rma.rmaId,
        productId: 'prod-srv-900',
        inspectedQuantity: 1,
        condition: 'OPEN_BOX',
        inspectorNotes: 'Needs board rework',
        inspector: 'qa_inspector'
      });
      expect(inspection.condition).toBe('OPEN_BOX');

      // 5. Disposition Return
      const disposition = returnsReverseLogisticsEngine.dispositionReturn({
        tenantId: tenantA,
        rmaId: rma.rmaId,
        disposition: 'RESTOCK',
        quantity: 1,
        destinationWarehouseId: 'wh-central-01',
        actionTaken: 'Refurbished and restocked to B-stock',
        dispositioner: 'plant_lead'
      });
      expect(disposition.disposition).toBe('RESTOCK');

      // 6. Issue Credit Note
      const credit = returnsReverseLogisticsEngine.issueCustomerCredit({
        tenantId: tenantA,
        rmaId: rma.rmaId,
        customerId: 'cust-apex-corp',
        creditAmount: 950.00,
        currency: 'USD',
        actor: 'finance_clerk'
      });
      expect(credit.creditAmount).toBe(950.00);
      expect(credit.status).toBe('ISSUED');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Supply Planning & Gross-to-Net Netting
  // --------------------------------------------------------------------------
  describe('Supply Planning & Gross-to-Net Netting', () => {
    it('accurately computes gross-to-net demand and converts planned orders', () => {
      const g2n = supplyPlanningEngine.calculateGrossToNet({
        productId: 'prod-srv-900',
        period: '2026-11',
        grossDemand: 200,
        onHandStock: 50,
        scheduledReceipts: 30,
        safetyStock: 40
      });

      // Total Available = 50 + 30 = 80; Required = 200 + 40 = 240; Net = 160
      expect(g2n.netRequirements).toBe(160);
      expect(g2n.plannedOrderReceipts).toBe(160);
      expect(g2n.projectedEndingStock).toBe(40);

      // Create and Publish Plan
      const plan = supplyPlanningEngine.createSupplyPlan({
        tenantId: tenantA,
        planName: 'November 2026 Supply Schedule',
        horizonStart: '2026-11-01',
        horizonEnd: '2026-11-30',
        items: [g2n],
        plannedOrders: [
          {
            type: 'PLANNED_PRODUCTION',
            productId: 'prod-srv-900',
            warehouseId: 'wh-central-01',
            quantity: 160,
            requiredDate: '2026-11-20',
            orderReleaseDate: '2026-11-05',
            status: 'FIRM',
            sourceDemandReference: 'DEM-NOV-26'
          }
        ],
        createdBy: 'master_scheduler'
      });

      expect(plan.isPublished).toBe(false);
      const published = supplyPlanningEngine.publishSupplyPlan(plan.supplyPlanId, tenantA, 'director');
      expect(published.isPublished).toBe(true);

      // Convert Planned Order
      const poId = plan.plannedOrders[0].plannedOrderId;
      const converted = supplyPlanningEngine.convertPlannedOrder({
        plannedOrderId: poId,
        tenantId: tenantA,
        convertedEntityId: 'prd-actual-901',
        actor: 'planner'
      });
      expect(converted.status).toBe('CONVERTED');
      expect(converted.convertedEntityId).toBe('prd-actual-901');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Landed Cost & PPV
  // --------------------------------------------------------------------------
  describe('Landed Cost & Purchase Price Variance (PPV)', () => {
    it('computes unit landed cost breakdown and evaluates PPV variance', () => {
      const landed = landedCostEngine.calculateLandedCost({
        tenantId: tenantA,
        poId: 'po-991',
        productId: 'prod-chip-gpu',
        quantity: 100,
        components: [
          { type: 'PURCHASE', amount: 90000, currency: 'USD', isEstimated: false },
          { type: 'FREIGHT', amount: 2500, currency: 'USD', isEstimated: false },
          { type: 'CUSTOMS_DUTY', amount: 3500, currency: 'USD', isEstimated: false },
          { type: 'INSURANCE', amount: 800, currency: 'USD', isEstimated: false }
        ]
      });

      // Total = 90000 + 2500 + 3500 + 800 = 96800; Unit = 968.00
      expect(landed.totalLandedCost).toBe(96800);
      expect(landed.unitLandedCost).toBe(968.00);

      // Calculate PPV
      const ppv = landedCostEngine.calculatePPV({
        tenantId: tenantA,
        poId: 'po-991',
        invoiceId: 'inv-991',
        productId: 'prod-chip-gpu',
        quantity: 100,
        standardUnitCost: 920.00,
        actualUnitCost: 900.00,
        currency: 'USD'
      });

      expect(ppv.variancePerUnit).toBe(-20.00);
      expect(ppv.totalPurchasePriceVariance).toBe(-2000.00); // Favorable variance
    });
  });

  // --------------------------------------------------------------------------
  // 5. Contract Lifecycle & SLA Governance
  // --------------------------------------------------------------------------
  describe('Contract Lifecycle & SLA Governance', () => {
    it('manages contract lifecycle, resolves tiered pricing and evaluates SLA penalties', () => {
      const contract = contractLifecycleEngine.createContractDraft({
        tenantId: tenantA,
        title: 'Semiconductor Multi-Year Agreement',
        supplierId: 'supp-semi-01',
        supplierName: 'Silicon Fab Inc.',
        effectiveDate: '2026-01-01',
        expirationDate: '2027-12-31',
        totalCommittedValue: 1000000,
        currency: 'USD',
        paymentTerms: 'NET_30',
        incoterms: 'FOB',
        pricingTiers: {
          'prod-chip-gpu': [
            { minQuantity: 1, maxQuantity: 49, unitPrice: 950 },
            { minQuantity: 50, unitPrice: 880 }
          ]
        },
        slaRules: [
          { metric: 'ON_TIME_DELIVERY', targetPercent: 95, penaltyPerBreachPercent: 2.0 },
          { metric: 'DEFECT_RATE', targetPercent: 0.2, penaltyPerBreachPercent: 5.0 }
        ],
        creator: 'buyer_lead'
      });

      expect(contract.status).toBe('DRAFT');

      // Approve Contract
      const active = contractLifecycleEngine.approveContract(contract.contractId, tenantA, 'procurement_director');
      expect(active.status).toBe('ACTIVE');

      // Check Tiered Pricing
      const smallQtyPrice = contractLifecycleEngine.getApplicablePrice(contract.contractId, 'prod-chip-gpu', 20);
      expect(smallQtyPrice).toBe(950);

      const largeQtyPrice = contractLifecycleEngine.getApplicablePrice(contract.contractId, 'prod-chip-gpu', 100);
      expect(largeQtyPrice).toBe(880);

      // Record Spend
      contractLifecycleEngine.recordContractSpend(contract.contractId, tenantA, 88000, 'po-991');
      const updated = contractLifecycleEngine.listContracts(tenantA).find(c => c.contractId === contract.contractId);
      expect(updated?.actualSpentValue).toBe(88000);

      // Evaluate SLA Penalty
      const slaResult = contractLifecycleEngine.evaluateContractSLA(contract.contractId, tenantA, [
        { metric: 'ON_TIME_DELIVERY', actualPercent: 90 }, // Breached (90 < 95) -> 2% penalty
        { metric: 'DEFECT_RATE', actualPercent: 0.1 } // Met (0.1 < 0.2) -> 0% penalty
      ]);

      expect(slaResult.totalPenaltyPercent).toBe(2.0);
      expect(slaResult.breaches.length).toBe(1);
    });
  });

  // --------------------------------------------------------------------------
  // 6. Multi-Tenant Isolation
  // --------------------------------------------------------------------------
  describe('Multi-Tenant Isolation Gate', () => {
    it('isolates BOMs, RMAs, Supply Plans and Contracts across tenants', () => {
      const bomsA = manufacturingMrpEngine.listBOMs(tenantA);
      const bomsB = manufacturingMrpEngine.listBOMs(tenantB);
      expect(bomsB.length).toBe(0);

      const rmasB = returnsReverseLogisticsEngine.listRMAs(tenantB);
      expect(rmasB.length).toBe(0);

      const plansB = supplyPlanningEngine.listSupplyPlans(tenantB);
      expect(plansB.length).toBe(0);

      const contractsB = contractLifecycleEngine.listContracts(tenantB);
      expect(contractsB.length).toBe(0);
    });
  });
});
