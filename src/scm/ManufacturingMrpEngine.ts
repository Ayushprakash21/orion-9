/**
 * ORION-9 ENTERPRISE SCM: MANUFACTURING & MRP ENGINE
 * Multi-Level BOM, Work Centers, Routing, Production Orders & Shop Floor Execution
 */

import {
  BOMRecord,
  BOMComponent,
  WorkCenterRecord,
  RoutingRecord,
  ProductionOrderRecord,
  MaterialIssueRecord,
  OperationConfirmationRecord,
  ProductionOrderStatus
} from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { observabilityService } from '../operations/ObservabilityService';


export class ManufacturingMrpEngine {
  private static instance: ManufacturingMrpEngine;

  private boms: Map<string, BOMRecord> = new Map();
  private workCenters: Map<string, WorkCenterRecord> = new Map();
  private routings: Map<string, RoutingRecord> = new Map();
  private productionOrders: Map<string, ProductionOrderRecord> = new Map();
  private materialIssues: Map<string, MaterialIssueRecord[]> = new Map(); // orderId -> issues
  private confirmations: Map<string, OperationConfirmationRecord[]> = new Map(); // orderId -> confirms

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): ManufacturingMrpEngine {
    if (!ManufacturingMrpEngine.instance) {
      ManufacturingMrpEngine.instance = new ManufacturingMrpEngine();
    }
    return ManufacturingMrpEngine.instance;
  }

  private seedDefaultData(): void {
    const defaultTenant = 'demo-tenant';

    // 1. Work Centers
    const wc1: WorkCenterRecord = {
      workCenterId: 'wc-smt-01',
      tenantId: defaultTenant,
      code: 'SMT-LINE-1',
      name: 'High-Speed SMT Surface Mount Line 1',
      warehouseId: 'wh-central-01',
      capacityHoursPerDay: 16,
      efficiencyPercent: 95,
      hourlyLaborRate: 45,
      hourlyMachineRate: 120,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const wc2: WorkCenterRecord = {
      workCenterId: 'wc-assy-01',
      tenantId: defaultTenant,
      code: 'FINAL-ASSY-1',
      name: 'Cleanroom Final Assembly & Test Station',
      warehouseId: 'wh-central-01',
      capacityHoursPerDay: 16,
      efficiencyPercent: 92,
      hourlyLaborRate: 40,
      hourlyMachineRate: 65,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.workCenters.set(wc1.workCenterId, wc1);
    this.workCenters.set(wc2.workCenterId, wc2);

    // 2. Sample BOM
    const sampleBom: BOMRecord = {
      bomId: 'bom-server-blade-01',
      tenantId: defaultTenant,
      bomNumber: 'BOM-SRV-900',
      finishedProductId: 'prod-srv-900',
      finishedProductName: 'Orion High-Density Quantum Compute Blade',
      version: 1,
      isActive: true,
      baseQuantity: 1,
      components: [
        {
          componentProductId: 'prod-chip-gpu',
          componentName: 'Tensor Accelerator Processing Unit',
          quantityPerUnit: 4,
          unitOfMeasure: 'EA',
          scrapFactorPercent: 0.5,
          isCritical: true,
          leadTimeDays: 14
        },
        {
          componentProductId: 'prod-mem-ddr5',
          componentName: '128GB ECC DDR5 Registered Memory Module',
          quantityPerUnit: 8,
          unitOfMeasure: 'EA',
          scrapFactorPercent: 0.1,
          isCritical: true,
          leadTimeDays: 7
        },
        {
          componentProductId: 'prod-pcb-main',
          componentName: 'Multi-Layer Server System Motherboard',
          quantityPerUnit: 1,
          unitOfMeasure: 'EA',
          scrapFactorPercent: 1.0,
          isCritical: true,
          leadTimeDays: 21
        }
      ],
      effectiveFrom: '2026-01-01T00:00:00Z',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.boms.set(sampleBom.bomId, sampleBom);

    // 3. Routing
    const sampleRouting: RoutingRecord = {
      routingId: 'rtg-server-blade-01',
      tenantId: defaultTenant,
      productId: 'prod-srv-900',
      routingNumber: 'RTG-SRV-900',
      version: 1,
      operations: [
        {
          operationNumber: 10,
          description: 'SMT Component Placement & Reflow Soldering',
          workCenterId: 'wc-smt-01',
          setupTimeHours: 1.5,
          runTimeHoursPerUnit: 0.25,
          inspectionRequired: true
        },
        {
          operationNumber: 20,
          description: 'Final Mechanical Chassis Assembly & Burn-In Testing',
          workCenterId: 'wc-assy-01',
          setupTimeHours: 0.5,
          runTimeHoursPerUnit: 0.75,
          inspectionRequired: true
        }
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.routings.set(sampleRouting.routingId, sampleRouting);
  }

  // ── BOM OPERATIONS ─────────────────────────────────────────────────────────

  public createBOM(params: Omit<BOMRecord, 'bomId' | 'createdAt' | 'updatedAt'>): BOMRecord {
    const bomId = `bom-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: BOMRecord = {
      ...params,
      bomId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.boms.set(bomId, record);

    kernelAuditEngine.record({
      action: 'CREATE_BILL_OF_MATERIALS',
      actor: { id: 'mfg_planner', type: 'USER', name: 'Manufacturing Planner' },
      entityId: bomId,
      entityType: 'BOM',
      classification: 'INTERNAL',
      details: { bomNumber: record.bomNumber, product: record.finishedProductId, components: record.components.length }
    });

    return record;
  }

  public getBOM(bomId: string, tenantId?: string): BOMRecord | undefined {
    const bom = this.boms.get(bomId);
    if (!bom) return undefined;
    if (tenantId && tenantId !== 'GLOBAL' && bom.tenantId !== tenantId) return undefined;
    return bom;
  }

  public listBOMs(tenantId?: string): BOMRecord[] {
    const list = Array.from(this.boms.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(b => b.tenantId === tenantId);
  }

  public explodeBOM(bomId: string, orderQuantity: number): Array<{ componentProductId: string; componentName: string; requiredQuantity: number; unitOfMeasure: string }> {
    const bom = this.boms.get(bomId);
    if (!bom) throw new Error(`BOM [${bomId}] not found`);

    return bom.components.map(c => {
      const gross = c.quantityPerUnit * orderQuantity;
      const scrapAllowance = gross * (c.scrapFactorPercent / 100);
      return {
        componentProductId: c.componentProductId,
        componentName: c.componentName,
        requiredQuantity: Math.ceil(gross + scrapAllowance),
        unitOfMeasure: c.unitOfMeasure
      };
    });
  }

  // ── WORK CENTERS & ROUTINGS ────────────────────────────────────────────────

  public listWorkCenters(tenantId?: string): WorkCenterRecord[] {
    const list = Array.from(this.workCenters.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(w => w.tenantId === tenantId);
  }

  public listRoutings(tenantId?: string): RoutingRecord[] {
    const list = Array.from(this.routings.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(r => r.tenantId === tenantId);
  }

  // ── PRODUCTION ORDERS ──────────────────────────────────────────────────────

  public createProductionOrder(params: {
    tenantId: string;
    productId: string;
    bomId: string;
    routingId: string;
    warehouseId: string;
    plannedQuantity: number;
    startDate: string;
    dueDate: string;
    actor: string;
  }): ProductionOrderRecord {
    if (params.plannedQuantity <= 0) {
      throw new Error('Production order planned quantity must be greater than zero');
    }

    const bom = this.boms.get(params.bomId);
    if (!bom || bom.tenantId !== params.tenantId) {
      throw new Error(`Invalid BOM [${params.bomId}] for tenant [${params.tenantId}]`);
    }

    const orderId = `pord-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = `PRD-${Date.now().toString().slice(-6)}`;

    const order: ProductionOrderRecord = {
      productionOrderId: orderId,
      tenantId: params.tenantId,
      orderNumber,
      productId: params.productId,
      bomId: params.bomId,
      routingId: params.routingId,
      warehouseId: params.warehouseId,
      plannedQuantity: params.plannedQuantity,
      completedQuantity: 0,
      scrappedQuantity: 0,
      startDate: params.startDate,
      dueDate: params.dueDate,
      status: 'PLANNED',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.productionOrders.set(orderId, order);

    kernelAuditEngine.record({
      action: 'CREATE_PRODUCTION_ORDER',
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: orderId,
      entityType: 'PRODUCTION_ORDER',
      classification: 'INTERNAL',
      details: { orderNumber, productId: params.productId, plannedQuantity: params.plannedQuantity }
    });

    observabilityService.log('INFO', `Production order ${orderNumber} created for product ${params.productId}`, {
      tenantId: params.tenantId,
      context: { orderId, plannedQuantity: params.plannedQuantity }
    });

    return order;
  }

  public releaseProductionOrder(orderId: string, tenantId: string, actor: string): ProductionOrderRecord {
    const order = this.productionOrders.get(orderId);
    if (!order || order.tenantId !== tenantId) {
      throw new Error(`Production order [${orderId}] not found for tenant [${tenantId}]`);
    }

    if (order.status !== 'PLANNED') {
      throw new Error(`Cannot release production order in status [${order.status}]`);
    }

    order.status = 'RELEASED';
    order.actualStartDate = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'RELEASE_PRODUCTION_ORDER',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: orderId,
      entityType: 'PRODUCTION_ORDER',
      classification: 'INTERNAL',
      details: { orderNumber: order.orderNumber, status: order.status }
    });

    return order;
  }

  public issueMaterial(params: {
    tenantId: string;
    productionOrderId: string;
    componentProductId: string;
    quantityIssued: number;
    warehouseId: string;
    lotNumber?: string;
    actor: string;
  }): MaterialIssueRecord {
    const order = this.productionOrders.get(params.productionOrderId);
    if (!order || order.tenantId !== params.tenantId) {
      throw new Error(`Production order [${params.productionOrderId}] not found`);
    }

    if (order.status !== 'RELEASED' && order.status !== 'IN_PROGRESS') {
      throw new Error(`Cannot issue materials for production order in status [${order.status}]`);
    }

    const issueId = `mat-iss-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const issueRecord: MaterialIssueRecord = {
      issueId,
      tenantId: params.tenantId,
      productionOrderId: params.productionOrderId,
      componentProductId: params.componentProductId,
      quantityIssued: params.quantityIssued,
      warehouseId: params.warehouseId,
      lotNumber: params.lotNumber,
      issuedBy: params.actor,
      issuedAt: new Date().toISOString()
    };

    const existing = this.materialIssues.get(params.productionOrderId) || [];
    existing.push(issueRecord);
    this.materialIssues.set(params.productionOrderId, existing);

    order.status = 'IN_PROGRESS';
    order.updatedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'ISSUE_PRODUCTION_MATERIAL',
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: issueId,
      entityType: 'MATERIAL_ISSUE',
      classification: 'INTERNAL',
      details: { productionOrderId: params.productionOrderId, component: params.componentProductId, quantity: params.quantityIssued }
    });

    return issueRecord;
  }

  public confirmOperation(params: {
    tenantId: string;
    productionOrderId: string;
    operationNumber: number;
    workCenterId: string;
    yieldQuantity: number;
    scrapQuantity: number;
    reworkQuantity: number;
    actualLaborHours: number;
    actualMachineHours: number;
    actor: string;
  }): OperationConfirmationRecord {
    const order = this.productionOrders.get(params.productionOrderId);
    if (!order || order.tenantId !== params.tenantId) {
      throw new Error(`Production order [${params.productionOrderId}] not found`);
    }

    const confirmId = `op-conf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const record: OperationConfirmationRecord = {
      confirmationId: confirmId,
      tenantId: params.tenantId,
      productionOrderId: params.productionOrderId,
      operationNumber: params.operationNumber,
      workCenterId: params.workCenterId,
      yieldQuantity: params.yieldQuantity,
      scrapQuantity: params.scrapQuantity,
      reworkQuantity: params.reworkQuantity,
      actualLaborHours: params.actualLaborHours,
      actualMachineHours: params.actualMachineHours,
      operatorId: params.actor,
      confirmedAt: new Date().toISOString()
    };

    const existing = this.confirmations.get(params.productionOrderId) || [];
    existing.push(record);
    this.confirmations.set(params.productionOrderId, existing);

    order.completedQuantity += params.yieldQuantity;
    order.scrappedQuantity += params.scrapQuantity;
    order.updatedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'CONFIRM_PRODUCTION_OPERATION',
      actor: { id: params.actor, type: 'USER', name: params.actor },
      entityId: confirmId,
      entityType: 'OPERATION_CONFIRMATION',
      classification: 'INTERNAL',
      details: { productionOrderId: params.productionOrderId, operation: params.operationNumber, yield: params.yieldQuantity }
    });

    return record;
  }

  public completeProductionOrder(orderId: string, tenantId: string, actor: string): ProductionOrderRecord {
    const order = this.productionOrders.get(orderId);
    if (!order || order.tenantId !== tenantId) {
      throw new Error(`Production order [${orderId}] not found`);
    }

    order.status = 'COMPLETED';
    order.actualCompletedDate = new Date().toISOString();
    order.updatedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'COMPLETE_PRODUCTION_ORDER',
      actor: { id: actor, type: 'USER', name: actor },
      entityId: orderId,
      entityType: 'PRODUCTION_ORDER',
      classification: 'INTERNAL',
      details: { orderNumber: order.orderNumber, completedQuantity: order.completedQuantity, scrappedQuantity: order.scrappedQuantity }
    });

    observabilityService.log('INFO', `Production order ${order.orderNumber} completed. Yield: ${order.completedQuantity}`, {
      tenantId,
      context: { orderId, completedQuantity: order.completedQuantity }
    });

    return order;
  }

  public listProductionOrders(tenantId?: string): ProductionOrderRecord[] {
    const list = Array.from(this.productionOrders.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(o => o.tenantId === tenantId);
  }
}

export const manufacturingMrpEngine = ManufacturingMrpEngine.getInstance();
