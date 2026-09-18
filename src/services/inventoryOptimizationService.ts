/**
 * ORION-9 MULTI-ECHELON INVENTORY OPTIMIZATION & AUTONOMOUS REPLENISHMENT SERVICE
 * Layer 4 Kernel & Layer 2 Intelligence Services
 * 
 * Orchestrates:
 * - Dynamic Multi-Echelon Safety Stock & Decoupling Buffer Calculations
 * - Bullwhip Variance Dampening across Supply Network Tiers
 * - Autonomous Purchase Requisition & Inter-Echelon Stock Transfer Order (STO) Generation
 * - Kernel State Machine transitions & Governance Policy Enforcement (POL-MEIO-001, POL-MEIO-002)
 * - Cryptographic SHA-256 Audit Trails & Event Bus Broadcasts
 */

import { 
  EchelonNode, 
  SKUBuffer, 
  ReplenishmentOrder, 
  BullwhipMetric, 
  BufferStatus 
} from '../types/inventoryOptimization';
import { replenishmentOrderStateMachine } from '../kernel/StateMachine';
import { KernelCommandBus } from '../kernel/CommandBus';
import { kernelEventBus } from '../kernel/EventBus';
import { KernelAuditEngine } from '../kernel/AuditEngine';
import { KernelPolicyEngine } from '../kernel/PolicyEngine';
import { db, saveData } from '../data/db';
import { sha256 } from '../kernel/security/crypto';
import { 
  initialEchelonNodes, 
  initialSKUBuffers, 
  initialReplenishmentOrders, 
  initialBullwhipMetrics 
} from '../data/db/inventoryOptimizationSeed';

export class InventoryOptimizationService {
  private static instance: InventoryOptimizationService;
  private commandBus: KernelCommandBus;
  private auditEngine: KernelAuditEngine;
  private policyEngine: KernelPolicyEngine;

  private constructor() {
    this.commandBus = KernelCommandBus.getInstance();
    this.auditEngine = KernelAuditEngine.getInstance();
    this.policyEngine = KernelPolicyEngine.getInstance();
    this.registerKernelCommands();
  }

  public static getInstance(): InventoryOptimizationService {
    if (!InventoryOptimizationService.instance) {
      InventoryOptimizationService.instance = new InventoryOptimizationService();
    }
    return InventoryOptimizationService.instance;
  }

  public async getEchelonNodes(): Promise<EchelonNode[]> {
    let items = ((await db.echelonNodes.getItem('all')) as EchelonNode[]) || [];
    if (!items || items.length === 0) {
      items = [...initialEchelonNodes];
      await saveData(db.echelonNodes, items);
    }
    return items;
  }

  public async getSKUBuffers(): Promise<SKUBuffer[]> {
    let items = ((await db.skuBuffers.getItem('all')) as SKUBuffer[]) || [];
    if (!items || items.length === 0) {
      items = [...initialSKUBuffers];
      await saveData(db.skuBuffers, items);
    }
    return items;
  }

  public async getReplenishmentOrders(): Promise<ReplenishmentOrder[]> {
    let items = ((await db.replenishmentOrders.getItem('all')) as ReplenishmentOrder[]) || [];
    if (!items || items.length === 0) {
      items = [...initialReplenishmentOrders];
      await saveData(db.replenishmentOrders, items);
    }
    return items;
  }

  public async getBullwhipMetrics(): Promise<BullwhipMetric[]> {
    let items = ((await db.bullwhipMetrics.getItem('all')) as BullwhipMetric[]) || [];
    if (!items || items.length === 0) {
      items = [...initialBullwhipMetrics];
      await saveData(db.bullwhipMetrics, items);
    }
    return items;
  }

  private registerKernelCommands(): void {
    // 1. CALCULATE_MEIO_BUFFERS
    this.commandBus.registerHandler('CALCULATE_MEIO_BUFFERS', async (envelope) => {
      const { bufferId, targetSlaPct, leadTimeVarMultiplier } = envelope.payload as {
        bufferId: string;
        targetSlaPct?: number;
        leadTimeVarMultiplier?: number;
      };
      return this.handleRecalculateBuffer(bufferId, targetSlaPct, leadTimeVarMultiplier, envelope);
    });

    // 2. GENERATE_REPLENISHMENT_ORDER
    this.commandBus.registerHandler('GENERATE_REPLENISHMENT_ORDER', async (envelope) => {
      const orderParams = envelope.payload as Partial<ReplenishmentOrder>;
      return this.handleGenerateReplenishmentOrder(orderParams, envelope);
    });

    // 3. APPROVE_REPLENISHMENT_ORDER
    this.commandBus.registerHandler('APPROVE_REPLENISHMENT_ORDER', async (envelope) => {
      const { orderId } = envelope.payload as { orderId: string };
      return this.handleApproveReplenishmentOrder(orderId, envelope);
    });

    // 4. REBALANCE_ECHELON_STOCK
    this.commandBus.registerHandler('REBALANCE_ECHELON_STOCK', async (envelope) => {
      const { sourceBufferId, targetBufferId, transferUnits } = envelope.payload as {
        sourceBufferId: string;
        targetBufferId: string;
        transferUnits: number;
      };
      return this.handleRebalanceEchelonStock(sourceBufferId, targetBufferId, transferUnits, envelope);
    });
  }

  /**
   * Recalculates dynamic safety stock, ROP, and buffer health using standard DDLT MEIO formula
   * SS = Z * sqrt(L * sigma_D^2 + D^2 * sigma_LT^2)
   */
  public async handleRecalculateBuffer(
    bufferId: string,
    targetSlaPct?: number,
    leadTimeVarMultiplier: number = 1.0,
    envelope?: any
  ): Promise<SKUBuffer> {
    const buffers = await this.getSKUBuffers();
    const index = buffers.findIndex((b) => b.id === bufferId);
    if (index === -1) throw new Error(`SKU Buffer ${bufferId} not found in repository.`);

    const buf = { ...buffers[index] };
    if (targetSlaPct !== undefined) {
      buf.targetSlaPct = targetSlaPct;
      // Z-score lookup approximation
      if (targetSlaPct >= 99.5) buf.zScore = 2.58;
      else if (targetSlaPct >= 99.0) buf.zScore = 2.33;
      else if (targetSlaPct >= 98.0) buf.zScore = 2.05;
      else if (targetSlaPct >= 95.0) buf.zScore = 1.65;
      else buf.zScore = 1.28;
    }

    const D = buf.avgDailyDemand;
    const sigmaD = buf.demandStdDev;
    const L = buf.replenishmentLeadTimeDays;
    const sigmaLT = buf.leadTimeStdDevDays * leadTimeVarMultiplier;

    // MEIO Safety Stock Formula
    const varianceDemand = L * (sigmaD * sigmaD);
    const varianceLeadTime = (D * D) * (sigmaLT * sigmaLT);
    const calculatedSS = Math.round(buf.zScore * Math.sqrt(varianceDemand + varianceLeadTime));

    buf.calculatedSafetyStock = calculatedSS;
    buf.reorderPoint = Math.round((D * L) + calculatedSS);
    buf.orderUpToLevel = Math.round(buf.reorderPoint * 1.8);
    buf.effectiveStock = buf.onHandUnits + buf.inTransitUnits - buf.committedUnits;

    // Buffer Status Evaluation
    let status: BufferStatus = 'HEALTHY_GREEN';
    let risk = 5.0;

    if (buf.effectiveStock <= 0) {
      status = 'STOCKOUT_BLACK';
      risk = 99.0;
    } else if (buf.effectiveStock < buf.calculatedSafetyStock * 0.5) {
      status = 'CRITICAL_RED';
      risk = 85.0;
    } else if (buf.effectiveStock < buf.reorderPoint) {
      status = 'WARNING_YELLOW';
      risk = 45.0;
    } else if (buf.effectiveStock > buf.orderUpToLevel * 1.4) {
      status = 'OVERSTOCK_BLUE';
      risk = 0.5;
    }

    buf.bufferStatus = status;
    buf.stockoutRiskPct = risk;
    buf.lastRebalancedAt = new Date().toISOString();

    buffers[index] = buf;
    await saveData(db.skuBuffers, buffers);

    // Audit and Event
    await this.auditEngine.record({
      action: 'CALCULATE_MEIO_BUFFERS',
      entityType: 'sku_buffer',
      entityId: buf.id,
      actor: envelope?.actor || {
        id: 'ORION_MEIO_ENGINE',
        name: 'MEIO Autonomous Engine',
        role: 'system',
        type: 'AI_AGENT',
      },
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: {
        sku: buf.sku,
        newSafetyStock: calculatedSS,
        reorderPoint: buf.reorderPoint,
        bufferStatus: status,
      },
    });

    kernelEventBus.publish('MEIO_BUFFER_RECALCULATED', { buffer: buf });
    return buf;
  }

  /**
   * Generates a new Replenishment Requisition or Stock Transfer Order with POL-MEIO-001 governance
   */
  public async handleGenerateReplenishmentOrder(
    params: Partial<ReplenishmentOrder>,
    envelope?: any
  ): Promise<ReplenishmentOrder> {
    const orders = await this.getReplenishmentOrders();
    const orderId = `REP-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const orderNumber = `RO-${params.sku?.replace('SKU-OR9-', '') || 'GEN'}-${Math.floor(10 + Math.random() * 90)}`;
    
    const requestedUnits = params.requestedUnits || 50;
    const unitCost = params.unitCost || 1200;
    const totalValue = requestedUnits * unitCost;

    const actor = envelope?.actor || {
      id: 'ORION_MEIO_AGENT',
      name: 'MEIO Replenishment Agent',
      role: 'supply_chain_manager',
      type: 'AI_AGENT' as const,
    };

    // Policy Governance Check (POL-MEIO-001)
    const policyEvaluation = this.policyEngine.evaluate({
      actor,
      tenantId: 'orion-global',
      action: 'GENERATE_REPLENISHMENT_ORDER',
      entityType: 'replenishment_order',
      amount: totalValue,
    });

    const requiresApproval = policyEvaluation.requiresApproval || totalValue > 25000;
    const initialStatus = requiresApproval ? 'PENDING_APPROVAL' : 'AUTO_APPROVED';

    // State machine transition verification
    const smCheck1 = replenishmentOrderStateMachine.canTransition('DRAFT_PROPOSED', 'POLICY_EVALUATED');
    if (!smCheck1.valid) {
      throw new Error(`State machine error: ${smCheck1.reason}`);
    }
    replenishmentOrderStateMachine.transition(orderId, 'DRAFT_PROPOSED', 'POLICY_EVALUATED');

    const smCheck2 = replenishmentOrderStateMachine.canTransition('POLICY_EVALUATED', initialStatus);
    if (!smCheck2.valid) {
      throw new Error(`State machine error: ${smCheck2.reason}`);
    }
    replenishmentOrderStateMachine.transition(orderId, 'POLICY_EVALUATED', initialStatus);

    const cryptographicSeal = await sha256(
      JSON.stringify({ orderId, orderNumber, totalValue, requestedUnits, ts: Date.now() })
    );

    const newOrder: ReplenishmentOrder = {
      id: orderId,
      orderNumber,
      orderType: params.orderType || 'STOCK_TRANSFER_ORDER',
      sku: params.sku || 'SKU-OR9-701',
      skuName: params.skuName || 'Quantum Solid-State Sensor Core',
      sourceNodeId: params.sourceNodeId || 'ECH-001',
      sourceNodeName: params.sourceNodeName || 'Munich Advanced Manufacturing Plant',
      destinationNodeId: params.destinationNodeId || 'ECH-002',
      destinationNodeName: params.destinationNodeName || 'Chicago Central Logistics Center',
      requestedUnits,
      unitCost,
      totalValue,
      urgency: params.urgency || (totalValue > 50000 ? 'EXPEDITE_CRITICAL' : 'ELEVATED'),
      status: initialStatus,
      suggestedBy: params.suggestedBy || 'AI_AUTOPILOT',
      confidencePct: params.confidencePct || 97.5,
      projectedStockoutDate: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      policyClearance: {
        cleared: !requiresApproval,
        ruleId: policyEvaluation.ruleId || 'POL-MEIO-001',
        requiresApproval,
        approvalRole: policyEvaluation.approvalRole || 'supply_chain_manager',
        reason: requiresApproval
          ? `Order value ($${totalValue.toLocaleString()}) exceeds $25,000 threshold. Unified Approval Center sign-off required.`
          : `Autonomous execution authorized ($${totalValue.toLocaleString()} <= $25,000 limit).`,
      },
      cryptographicSeal,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orders.unshift(newOrder);
    await saveData(db.replenishmentOrders, orders);

    // Audit Logging
    await this.auditEngine.record({
      action: 'GENERATE_REPLENISHMENT_ORDER',
      entityType: 'replenishment_order',
      entityId: newOrder.id,
      actor: envelope?.actor || {
        id: 'ORION_AUTOPILOT',
        name: 'Autonomous Replenishment Engine',
        role: 'supply_chain_manager',
        type: 'AI_AGENT',
      },
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: {
        orderNumber: newOrder.orderNumber,
        totalValue,
        status: newOrder.status,
        requiresApproval,
        cryptographicSeal,
      },
    });

    kernelEventBus.publish('REPLENISHMENT_ORDER_GENERATED', { order: newOrder });
    return newOrder;
  }

  /**
   * Approves and dispatches a replenishment order into ERP (SAP S/4HANA)
   */
  public async handleApproveReplenishmentOrder(
    orderId: string,
    envelope?: any
  ): Promise<ReplenishmentOrder> {
    const orders = await this.getReplenishmentOrders();
    const index = orders.findIndex((o) => o.id === orderId);
    if (index === -1) throw new Error(`Replenishment Order ${orderId} not found.`);

    const order = { ...orders[index] };
    const actor = envelope?.actor || {
      id: 'HUMAN_SUPERVISOR',
      name: 'Supply Chain Director',
      role: 'supply_chain_manager',
      type: 'HUMAN' as const,
    };

    const checkApprove = replenishmentOrderStateMachine.canTransition(order.status, 'AUTO_APPROVED', actor.role);
    if (!checkApprove.valid) {
      throw new Error(`Cannot approve order: ${checkApprove.reason}`);
    }
    replenishmentOrderStateMachine.transition(orderId, order.status, 'AUTO_APPROVED', { actorRole: actor.role });

    const checkErp = replenishmentOrderStateMachine.canTransition('AUTO_APPROVED', 'TRANSMITTED_TO_ERP', actor.role);
    if (!checkErp.valid) {
      throw new Error(`ERP transmission failed: ${checkErp.reason}`);
    }
    replenishmentOrderStateMachine.transition(orderId, 'AUTO_APPROVED', 'TRANSMITTED_TO_ERP', { actorRole: actor.role });

    order.status = 'TRANSMITTED_TO_ERP';
    order.policyClearance.cleared = true;
    order.policyClearance.reason = `Approved by authorized supervisor. ERP Order created.`;
    order.updatedAt = new Date().toISOString();

    orders[index] = order;
    await saveData(db.replenishmentOrders, orders);

    // Update in-transit stock in target buffer
    const buffers = await this.getSKUBuffers();
    const targetBufIndex = buffers.findIndex(
      (b) => b.sku === order.sku && b.echelonNodeId === order.destinationNodeId
    );
    if (targetBufIndex !== -1) {
      buffers[targetBufIndex].inTransitUnits += order.requestedUnits;
      buffers[targetBufIndex].effectiveStock = 
        buffers[targetBufIndex].onHandUnits + 
        buffers[targetBufIndex].inTransitUnits - 
        buffers[targetBufIndex].committedUnits;
      await saveData(db.skuBuffers, buffers);
    }

    // Audit
    await this.auditEngine.record({
      action: 'APPROVE_REPLENISHMENT_ORDER',
      entityType: 'replenishment_order',
      entityId: order.id,
      actor,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: {
        orderNumber: order.orderNumber,
        transmittedToERP: true,
      },
    });

    kernelEventBus.publish('REPLENISHMENT_ORDER_APPROVED', { order });
    return order;
  }

  /**
   * Executes inter-echelon stock transfer to rebalance inventory
   */
  public async handleRebalanceEchelonStock(
    sourceBufferId: string,
    targetBufferId: string,
    transferUnits: number,
    envelope?: any
  ): Promise<{ sourceBuffer: SKUBuffer; targetBuffer: SKUBuffer; order: ReplenishmentOrder }> {
    const buffers = await this.getSKUBuffers();
    const srcIndex = buffers.findIndex((b) => b.id === sourceBufferId);
    const tgtIndex = buffers.findIndex((b) => b.id === targetBufferId);

    if (srcIndex === -1 || tgtIndex === -1) {
      throw new Error('Source or target SKU buffer not found.');
    }

    const src = { ...buffers[srcIndex] };
    const tgt = { ...buffers[tgtIndex] };

    if (src.onHandUnits < transferUnits) {
      throw new Error(`Insufficient on-hand units in source node (${src.onHandUnits} < ${transferUnits})`);
    }

    // Deduct from source onHand, add to target inTransit
    src.onHandUnits -= transferUnits;
    src.effectiveStock = src.onHandUnits + src.inTransitUnits - src.committedUnits;

    tgt.inTransitUnits += transferUnits;
    tgt.effectiveStock = tgt.onHandUnits + tgt.inTransitUnits - tgt.committedUnits;

    buffers[srcIndex] = src;
    buffers[tgtIndex] = tgt;
    await saveData(db.skuBuffers, buffers);

    // Create STO record
    const order = await this.handleGenerateReplenishmentOrder(
      {
        orderType: 'STOCK_TRANSFER_ORDER',
        sku: src.sku,
        skuName: src.skuName,
        sourceNodeId: src.echelonNodeId,
        sourceNodeName: src.echelonNodeName,
        destinationNodeId: tgt.echelonNodeId,
        destinationNodeName: tgt.echelonNodeName,
        requestedUnits: transferUnits,
        unitCost: src.unitCost,
        urgency: 'EXPEDITE_CRITICAL',
        suggestedBy: 'AI_AUTOPILOT',
      },
      envelope
    );

    kernelEventBus.publish('ECHELON_STOCK_REBALANCED', { sourceBuffer: src, targetBuffer: tgt, order });
    return { sourceBuffer: src, targetBuffer: tgt, order };
  }
}

export const inventoryOptimizationService = InventoryOptimizationService.getInstance();
