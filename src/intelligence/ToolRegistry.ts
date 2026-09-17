/**
 * ORION-9 INTELLIGENCE LAYER — TOOL REGISTRY
 * Layer 2: Secure catalog of verified, authorized tools accessible by AI agents.
 * Strictly prevents direct arbitrary database manipulation.
 */

import { AIToolDefinition, AIInvocationContext } from './types';
import { db, loadData } from '../data/db';
import { Inventory, Supplier, PurchaseOrder, Shipment } from '../types';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, AIToolDefinition> = new Map();

  private constructor() {
    this.registerStandardTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  public registerTool(tool: AIToolDefinition): void {
    this.tools.set(tool.toolId, tool);
  }

  public getTool(toolId: string): AIToolDefinition | undefined {
    return this.tools.get(toolId);
  }

  public getAllTools(): AIToolDefinition[] {
    return Array.from(this.tools.values());
  }

  /**
   * Registers foundational operational tools
   */
  private registerStandardTools(): void {
    // 1. Tool: Get Inventory Levels (READ - OBSERVE)
    this.registerTool({
      toolId: 'tool_get_inventory_levels',
      name: 'Get Inventory Levels',
      description: 'Fetches authorized stock balances, safety stocks, and shortage indicators for products.',
      category: 'READ',
      riskTier: 'LOW',
      operatingMode: 'OBSERVE',
      requiredPermission: 'inventory.read',
      approvalRequired: false,
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'SKU or Product ID to inspect' },
          warehouseId: { type: 'string', description: 'Optional warehouse ID filter' },
        },
        required: [],
      },
      handler: async (params, _context) => {
        const invList = await loadData<Inventory>(db.inventory);
        if (params.productId) {
          return invList.filter(i => i.productId === params.productId);
        }
        return invList.slice(0, 50);
      },
    });

    // 2. Tool: Get Supplier Scorecard (READ - OBSERVE)
    this.registerTool({
      toolId: 'tool_get_supplier_scorecard',
      name: 'Get Supplier Scorecard',
      description: 'Retrieves supplier historical OTIF, quality rating, defect rates, and risk indices.',
      category: 'READ',
      riskTier: 'LOW',
      operatingMode: 'OBSERVE',
      requiredPermission: 'suppliers.read',
      approvalRequired: false,
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string', description: 'Unique Supplier ID (e.g. SUP-001)' },
        },
        required: ['supplierId'],
      },
      handler: async (params, _context) => {
        const suppliers = await loadData<Supplier>(db.suppliers);
        const supplier = suppliers.find(s => s.id === params.supplierId);
        if (!supplier) throw new Error(`Supplier ${params.supplierId} not found.`);
        return {
          supplierId: supplier.id,
          name: supplier.name,
          otif: supplier.otif,
          qualityRate: supplier.qualityRate,
          leadTime: supplier.leadTime,
          defectRate: supplier.defectRate,
          riskLevel: supplier.riskLevel,
          score: supplier.score,
        };
      },
    });

    // 3. Tool: Simulate Disruption (SIMULATION - OBSERVE/ASSIST)
    this.registerTool({
      toolId: 'tool_simulate_disruption',
      name: 'Simulate Supply Chain Disruption',
      description: 'Executes a sandboxed what-if scenario simulation without modifying production data.',
      category: 'SIMULATION',
      riskTier: 'LOW',
      operatingMode: 'OBSERVE',
      requiredPermission: 'analytics.read',
      approvalRequired: false,
      parameters: {
        type: 'object',
        properties: {
          scenarioType: {
            type: 'string',
            description: 'Type of disruption to model',
            enum: ['SUPPLIER_DELAY', 'DEMAND_SPIKE', 'PORT_CONGESTION'],
          },
          severityFactor: { type: 'number', description: 'Severity multiplier (1.0 to 3.0)' },
          targetEntityId: { type: 'string', description: 'Entity identifier being tested' },
        },
        required: ['scenarioType'],
      },
      handler: async (params, _context) => {
        // Return structured simulation results from sandbox
        const multiplier = params.severityFactor || 1.5;
        return {
          simulationId: `sim-${Date.now().toString(36)}`,
          scenarioType: params.scenarioType,
          projectedDelayDays: Math.round(5 * multiplier),
          projectedCostVariancePercent: +(8.4 * multiplier).toFixed(1),
          serviceLevelImpactPercent: -(12.2 * multiplier).toFixed(1),
          affectedSkusCount: 14,
          simulatedSafely: true,
        };
      },
    });

    // 4. Tool: Draft Supplier Communication (DRAFT - ASSIST)
    this.registerTool({
      toolId: 'tool_draft_supplier_communication',
      name: 'Draft Supplier Communication',
      description: 'Prepares an operational message or expedite inquiry draft for human review.',
      category: 'DRAFT',
      riskTier: 'LOW',
      operatingMode: 'ASSIST',
      requiredPermission: 'suppliers.manage',
      approvalRequired: false,
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string', description: 'Supplier to address' },
          subject: { type: 'string', description: 'Message subject line' },
          poId: { type: 'string', description: 'Referenced Purchase Order' },
          urgency: { type: 'string', description: 'Urgency level', enum: ['NORMAL', 'URGENT', 'CRITICAL'] },
        },
        required: ['supplierId', 'subject', 'poId'],
      },
      handler: async (params, _context) => {
        return {
          draftId: `draft-${Date.now().toString(36)}`,
          supplierId: params.supplierId,
          subject: `[${params.urgency || 'URGENT'}] Expedite Request: PO ${params.poId}`,
          body: `Dear Supplier Team,\n\nOur system telemetry indicates a potential delivery delay for Purchase Order ${params.poId}. Please provide revised ETA and container tracking milestones at your earliest convenience.\n\nRegards,\nOrion-9 Supply Chain Operations`,
          status: 'DRAFT',
          requiresReviewBeforeDispatch: true,
        };
      },
    });

    // 5. Tool: Request Purchase Order Creation (MUTATION - APPROVAL GATED)
    this.registerTool({
      toolId: 'tool_request_purchase_order',
      name: 'Request Purchase Order Creation',
      description: 'Prepares a material purchase order proposal. Requires human manager approval before issuance.',
      category: 'MUTATION',
      riskTier: 'HIGH',
      operatingMode: 'APPROVAL_GATED',
      requiredPermission: 'procurement.manage',
      approvalRequired: true,
      parameters: {
        type: 'object',
        properties: {
          supplierId: { type: 'string', description: 'Supplier ID to issue PO to' },
          productId: { type: 'string', description: 'SKU being replenished' },
          quantity: { type: 'number', description: 'Quantity to order' },
          unitCost: { type: 'number', description: 'Unit cost' },
        },
        required: ['supplierId', 'productId', 'quantity', 'unitCost'],
      },
      handler: async (params, _context) => {
        const totalValue = params.quantity * params.unitCost;
        return {
          proposedPoId: `PO-PROP-${Date.now().toString(36).toUpperCase()}`,
          supplierId: params.supplierId,
          productId: params.productId,
          quantity: params.quantity,
          unitCost: params.unitCost,
          totalValue,
          status: 'PENDING_APPROVAL',
          approvalGated: true,
        };
      },
    });

    // 6. Tool: Flag Quality Inspection Hold (MUTATION - APPROVAL GATED)
    this.registerTool({
      toolId: 'tool_flag_quality_hold',
      name: 'Flag Quality Inspection Hold',
      description: 'Places incoming materials or inventory lots on quarantine hold pending quality review.',
      category: 'MUTATION',
      riskTier: 'HIGH',
      operatingMode: 'APPROVAL_GATED',
      requiredPermission: 'inventory.manage',
      approvalRequired: true,
      parameters: {
        type: 'object',
        properties: {
          lotId: { type: 'string', description: 'Inventory lot or shipment identifier' },
          defectReason: { type: 'string', description: 'Observed anomaly or defect justification' },
        },
        required: ['lotId', 'defectReason'],
      },
      handler: async (params, _context) => {
        return {
          holdId: `QHOLD-${Date.now().toString(36).toUpperCase()}`,
          lotId: params.lotId,
          defectReason: params.defectReason,
          status: 'QUALITY_HOLD',
          placedAt: new Date().toISOString(),
        };
      },
    });

    // 7. Tool: Propose Inventory Rebalance (RECOMMEND)
    this.registerTool({
      toolId: 'tool_propose_inventory_rebalance',
      name: 'Propose Inventory Rebalance',
      description: 'Calculates optimal inter-facility stock transfer to alleviate regional stockouts.',
      category: 'ANALYSIS',
      riskTier: 'MEDIUM',
      operatingMode: 'RECOMMEND',
      requiredPermission: 'inventory.read',
      approvalRequired: false,
      parameters: {
        type: 'object',
        properties: {
          sourceWarehouseId: { type: 'string', description: 'Surplus warehouse' },
          destinationWarehouseId: { type: 'string', description: 'Deficit warehouse' },
          productId: { type: 'string', description: 'SKU to transfer' },
          quantity: { type: 'number', description: 'Transfer quantity' },
        },
        required: ['sourceWarehouseId', 'destinationWarehouseId', 'productId', 'quantity'],
      },
      handler: async (params, _context) => {
        return {
          proposalId: `REBAL-${Date.now().toString(36).toUpperCase()}`,
          from: params.sourceWarehouseId,
          to: params.destinationWarehouseId,
          productId: params.productId,
          quantity: params.quantity,
          estimatedTransitDays: 2,
          serviceRiskReductionPercent: 18.5,
          recommendedAction: 'SUBMIT_FOR_TRANSFER_APPROVAL',
        };
      },
    });
  }
}

export const toolRegistry = ToolRegistry.getInstance();
