/**
 * ORION-9 TRACK 2 — GOLDEN JOURNEY #2: MAKE-TO-STOCK (MANUFACTURING & MRP)
 *
 * Full End-to-End Execution:
 * Demand/Forecast -> Gross-to-Net Planning -> Planned Order Conversion ->
 * Production Order Creation -> BOM Explode & Validation -> Component Inventory Decrement ->
 * Shop Floor Operation Confirmation -> Production Output -> Finished Goods Inventory Increment
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { manufacturingMrpEngine } from '../../scm/ManufacturingMrpEngine';
import { supplyPlanningEngine } from '../../scm/SupplyPlanningEngine';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('Track 2 — Golden Journey #2: Make-to-Stock (Manufacturing Execution)', () => {
  const TENANT = 'TENANT_MFG_01';
  const WAREHOUSE = 'WH-PLANT-01';

  const FINISHED_PRODUCT = 'PRD-QUANTUM-BLADE-01';
  const COMPONENT_CHIP = 'COMP-GPU-CHIP-99';
  const COMPONENT_MEMORY = 'COMP-DDR5-MODULE-64G';

  beforeEach(async () => {
    scmPersistenceService.clear();

    // 0. Seed Inventory for Components: 500 Chips, 1000 Memory Modules
    await scmPersistenceService.adjustInventory({
      tenantId: TENANT,
      productId: COMPONENT_CHIP,
      warehouseId: WAREHOUSE,
      quantityDelta: 500,
      transactionType: 'GRN_RECEIPT',
      referenceEntityType: 'GRN',
      referenceEntityId: 'GRN-INIT-CHIP',
      actor: 'system_seeder',
      correlationId: 'INIT-CHIP-01',
    });

    await scmPersistenceService.adjustInventory({
      tenantId: TENANT,
      productId: COMPONENT_MEMORY,
      warehouseId: WAREHOUSE,
      quantityDelta: 1000,
      transactionType: 'GRN_RECEIPT',
      referenceEntityType: 'GRN',
      referenceEntityId: 'GRN-INIT-MEM',
      actor: 'system_seeder',
      correlationId: 'INIT-MEM-01',
    });
  });

  it('authoritatively executes complete Make-to-Stock flow with material consumption and finished goods receipt', async () => {
    // =========================================================================
    // STEP 1: Define Multi-Level BOM & Routing
    // =========================================================================
    const bom = manufacturingMrpEngine.createBOM({
      tenantId: TENANT,
      bomNumber: 'BOM-QB-001',
      finishedProductId: FINISHED_PRODUCT,
      finishedProductName: 'Quantum Accelerator Server Blade',
      version: 1,
      isActive: true,
      baseQuantity: 1,
      components: [
        {
          componentProductId: COMPONENT_CHIP,
          componentName: 'Quantum AI TPU Chip',
          quantityPerUnit: 2, // 2 chips per finished server blade
          unitOfMeasure: 'EA',
          scrapFactorPercent: 0,
          isCritical: true,
          leadTimeDays: 7,
        },
        {
          componentProductId: COMPONENT_MEMORY,
          componentName: '64GB ECC DDR5 Module',
          quantityPerUnit: 4, // 4 memory sticks per finished server blade
          unitOfMeasure: 'EA',
          scrapFactorPercent: 0,
          isCritical: true,
          leadTimeDays: 5,
        },
      ],
      effectiveFrom: new Date().toISOString(),
    });

    expect(bom.bomId).toBeDefined();

    // =========================================================================
    // STEP 2: Gross-to-Net Demand Planning & Planned Order
    // =========================================================================
    const grossDemand = 50; // Plan to build 50 Quantum Server Blades
    const gtn = supplyPlanningEngine.calculateGrossToNet({
      productId: FINISHED_PRODUCT,
      period: '2026-11',
      grossDemand,
      onHandStock: 0,
      scheduledReceipts: 0,
      safetyStock: 10,
    });

    expect(gtn.netRequirements).toBe(60); // 50 gross demand + 10 safety stock

    const plan = supplyPlanningEngine.createSupplyPlan({
      tenantId: TENANT,
      planName: 'November Quantum Blade Production Plan',
      horizonStart: '2026-11-01',
      horizonEnd: '2026-11-30',
      items: [gtn],
      plannedOrders: [
        {
          type: 'PLANNED_PRODUCTION',
          productId: FINISHED_PRODUCT,
          warehouseId: WAREHOUSE,
          quantity: 50,
          requiredDate: '2026-11-20',
          orderReleaseDate: '2026-11-05',
          status: 'FIRM',
        },
      ],
      createdBy: 'mfg_planner_01',
    });

    const plannedOrder = plan.plannedOrders[0];
    expect(plannedOrder.plannedOrderId).toBeDefined();

    // =========================================================================
    // STEP 3: Convert Planned Order to Shop Floor Production Order
    // =========================================================================
    const prodOrder = manufacturingMrpEngine.createProductionOrder({
      tenantId: TENANT,
      productId: FINISHED_PRODUCT,
      bomId: bom.bomId,
      routingId: 'RTG-QB-001',
      warehouseId: WAREHOUSE,
      plannedQuantity: 50,
      startDate: '2026-11-05',
      dueDate: '2026-11-20',
      actor: 'mfg_planner_01',
    });

    expect(prodOrder.status).toBe('PLANNED');
    expect(prodOrder.plannedQuantity).toBe(50);

    supplyPlanningEngine.convertPlannedOrder({
      plannedOrderId: plannedOrder.plannedOrderId,
      tenantId: TENANT,
      convertedEntityId: prodOrder.productionOrderId,
      actor: 'mfg_planner_01',
    });

    // Release Production Order
    manufacturingMrpEngine.releaseProductionOrder(prodOrder.productionOrderId, TENANT, 'shop_floor_supervisor');
    expect(prodOrder.status).toBe('RELEASED');

    // =========================================================================
    // STEP 4: Explode BOM & Issue Materials (Consume Components from Inventory)
    // =========================================================================
    const requiredComponents = manufacturingMrpEngine.explodeBOM(bom.bomId, prodOrder.plannedQuantity);
    expect(requiredComponents.length).toBe(2);

    // Issue 100 Chips (50 * 2)
    const chipRequirement = requiredComponents.find((c) => c.componentProductId === COMPONENT_CHIP)!;
    expect(chipRequirement.requiredQuantity).toBe(100);

    await manufacturingMrpEngine.issueMaterial({
      tenantId: TENANT,
      productionOrderId: prodOrder.productionOrderId,
      componentProductId: COMPONENT_CHIP,
      quantityIssued: chipRequirement.requiredQuantity,
      warehouseId: WAREHOUSE,
      lotNumber: 'LOT-CHIP-2026-9',
      actor: 'storekeeper_01',
    });

    // Issue 200 Memory Modules (50 * 4)
    const memRequirement = requiredComponents.find((c) => c.componentProductId === COMPONENT_MEMORY)!;
    expect(memRequirement.requiredQuantity).toBe(200);

    await manufacturingMrpEngine.issueMaterial({
      tenantId: TENANT,
      productionOrderId: prodOrder.productionOrderId,
      componentProductId: COMPONENT_MEMORY,
      quantityIssued: memRequirement.requiredQuantity,
      warehouseId: WAREHOUSE,
      lotNumber: 'LOT-MEM-2026-11',
      actor: 'storekeeper_01',
    });

    // Verify component stocks decreased authoritatively in inventory
    const chipStock = await scmPersistenceService.getRecord<any>('inventory', TENANT, `INV-${WAREHOUSE}-${COMPONENT_CHIP}`);
    expect(chipStock?.onHand).toBe(400); // 500 initial - 100 issued

    const memStock = await scmPersistenceService.getRecord<any>('inventory', TENANT, `INV-${WAREHOUSE}-${COMPONENT_MEMORY}`);
    expect(memStock?.onHand).toBe(800); // 1000 initial - 200 issued

    // =========================================================================
    // STEP 5: Confirm Shop Floor Operations (SMT & Assembly)
    // =========================================================================
    manufacturingMrpEngine.confirmOperation({
      tenantId: TENANT,
      productionOrderId: prodOrder.productionOrderId,
      operationNumber: 10,
      workCenterId: 'wc-smt-01',
      yieldQuantity: 50,
      scrapQuantity: 0,
      reworkQuantity: 0,
      actualLaborHours: 12.5,
      actualMachineHours: 12.5,
      actor: 'smt_operator_04',
    });

    // =========================================================================
    // STEP 6: Complete Production Order & Receive Finished Goods into Stock
    // =========================================================================
    const completedOrder = await manufacturingMrpEngine.completeProductionOrder(
      prodOrder.productionOrderId,
      TENANT,
      'qc_inspector_02'
    );

    expect(completedOrder.status).toBe('COMPLETED');
    expect(completedOrder.completedQuantity).toBe(50);

    // Verify finished goods inventory on-hand increased by 50
    const finishedStock = await scmPersistenceService.getRecord<any>(
      'inventory',
      TENANT,
      `INV-${WAREHOUSE}-${FINISHED_PRODUCT}`
    );
    expect(finishedStock).toBeDefined();
    expect(finishedStock?.onHand).toBe(50);
  });
});
