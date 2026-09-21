/**
 * ORION-9 WAVE 5 — GOVERNED TOOL REGISTRY
 *
 * Governed registry for all AI tools.
 * Tools do NOT mutate authoritative database state directly.
 * Mutation tools construct typed commands dispatched through the Orion Kernel.
 */

import { AITool, AIExecutionContext, AIRiskClass, AIOperatingMode } from './types';
import { aiSecurityGuard } from './AISecurityGuard';

export class ToolRegistry {
  private static instance: ToolRegistry;
  private tools: Map<string, AITool> = new Map();

  private constructor() {
    this.registerStandardTools();
  }

  public static getInstance(): ToolRegistry {
    if (!ToolRegistry.instance) {
      ToolRegistry.instance = new ToolRegistry();
    }
    return ToolRegistry.instance;
  }

  private registerStandardTools(): void {
    // -------------------------------------------------------------
    // READ TOOLS (Low Risk, Permitted in OBSERVE, ASSIST, RECOMMEND, GOVERNED)
    // -------------------------------------------------------------
    this.registerTool({
      toolId: 'getInventory',
      name: 'Get Inventory',
      description: 'Retrieve current inventory balances for tenant facilities',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['inventory:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { productId: { type: 'string' } } },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        // Controlled read service proxy
        return [
          { productId: params.productId || 'SKU-1001', onHand: 450, reserved: 50, location: 'WH-MAIN', tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getInventoryRisks',
      name: 'Get Inventory Risks',
      description: 'Identify SKUs breaching reorder points or experiencing stockout danger',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['inventory:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { threshold: { type: 'number' } } },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { productId: 'SKU-009', risk: 'STOCKOUT_RISK', daysOfSupply: 2.1, tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getSuppliers',
      name: 'Get Suppliers',
      description: 'List qualified enterprise suppliers for a product category',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['supplier:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { category: { type: 'string' } } },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { supplierId: 'SUPP-001', name: 'Apex Industrial', status: 'ACTIVE', score: 94.5, tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getSupplierPerformance',
      name: 'Get Supplier Performance',
      description: 'Retrieve empirical performance metrics (OTD, OTIF, Quality Rate)',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['supplier:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { supplierId: { type: 'string' } }, required: ['supplierId'] },
      outputSchema: { type: 'object' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return {
          supplierId: params.supplierId,
          otdRate: 97.2,
          otifRate: 95.8,
          qualityRate: 99.1,
          fillRate: 98.4,
          tenantId: context.tenantId,
        };
      },
    });

    this.registerTool({
      toolId: 'getPurchaseOrders',
      name: 'Get Purchase Orders',
      description: 'List active purchase orders within the tenant boundary',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['po:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { status: { type: 'string' } } },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { poId: 'PO-2026-001', status: 'ISSUED', totalAmount: 14500, tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getOverduePOs',
      name: 'Get Overdue Purchase Orders',
      description: 'List purchase orders where estimated delivery date has lapsed',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['po:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object' },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { poId: 'PO-2026-089', supplierId: 'SUPP-001', daysOverdue: 4, tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getShipments',
      name: 'Get Shipments',
      description: 'Track active inbound and outbound freight shipments',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['shipment:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { carrierId: { type: 'string' } } },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { shipmentId: 'SHIP-901', carrier: 'FedEx Freight', status: 'IN_TRANSIT', eta: '2026-09-24', tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getDelayedShipments',
      name: 'Get Delayed Shipments',
      description: 'Identify in-transit shipments affected by port congestion or transit delays',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['shipment:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object' },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { shipmentId: 'SHIP-905', status: 'DELAYED', delayReason: 'Port Congestion', etaVarianceDays: 3, tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getExceptions',
      name: 'Get Exceptions',
      description: 'List operational alerts, variances, and supply chain disruptions',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['exception:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object', properties: { severity: { type: 'string' } } },
      outputSchema: { type: 'array' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return [
          { exceptionId: 'EXC-101', severity: 'HIGH', category: 'SUPPLY_SHORTAGE', title: 'Critical raw material shortage', tenantId: context.tenantId },
        ];
      },
    });

    this.registerTool({
      toolId: 'getDashboardMetrics',
      name: 'Get Dashboard Metrics',
      description: 'Aggregate KPIs across inventory, logistics, and procurement',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['inventory:read', 'po:read'],
      riskLevel: 'LOW',
      inputSchema: { type: 'object' },
      outputSchema: { type: 'object' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return {
          totalSpendYTD: 1420000,
          activePOs: 38,
          averageOTIF: 96.4,
          openExceptions: 4,
          tenantId: context.tenantId,
        };
      },
    });

    // -------------------------------------------------------------
    // ACTION TOOLS (Command Builders - Mutate Only via Kernel Pipeline)
    // -------------------------------------------------------------
    this.registerTool({
      toolId: 'createPurchaseRequisition',
      name: 'Create Purchase Requisition',
      description: 'Draft a new Purchase Requisition (PR) for human review and approval',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['pr:create'],
      riskLevel: 'MEDIUM',
      inputSchema: {
        type: 'object',
        properties: {
          items: { type: 'array' },
          estimatedTotal: { type: 'number' },
          justification: { type: 'string' },
        },
        required: ['items', 'estimatedTotal', 'justification'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
    });

    this.registerTool({
      toolId: 'createRFQ',
      name: 'Create RFQ',
      description: 'Draft a Request for Quotation to qualified suppliers',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['rfq:create'],
      riskLevel: 'MEDIUM',
      inputSchema: {
        type: 'object',
        properties: {
          prId: { type: 'string' },
          targetSuppliers: { type: 'array' },
          deadline: { type: 'string' },
        },
        required: ['prId', 'targetSuppliers'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
    });

    this.registerTool({
      toolId: 'compareQuotations',
      name: 'Compare Quotations',
      description: 'Generate structured bid comparison matrix across technical and commercial dimensions',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['rfq:read'],
      riskLevel: 'LOW',
      inputSchema: {
        type: 'object',
        properties: {
          rfqId: { type: 'string' },
        },
        required: ['rfqId'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
      execute: async (params, context) => {
        return {
          rfqId: params.rfqId,
          evaluatedBids: [
            { supplierId: 'SUPP-001', score: 94.2, rank: 1, commercialScore: 92, technicalScore: 96 },
            { supplierId: 'SUPP-002', score: 88.5, rank: 2, commercialScore: 95, technicalScore: 82 },
          ],
          tenantId: context.tenantId,
        };
      },
    });

    this.registerTool({
      toolId: 'createPurchaseOrderDraft',
      name: 'Create Purchase Order Draft',
      description: 'Prepare a Purchase Order draft; approval gated before release',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['po:create'],
      riskLevel: 'HIGH',
      inputSchema: {
        type: 'object',
        properties: {
          supplierId: { type: 'string' },
          amount: { type: 'number' },
          currency: { type: 'string' },
          lineItems: { type: 'array' },
        },
        required: ['supplierId', 'amount', 'lineItems'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
    });

    this.registerTool({
      toolId: 'requestApproval',
      name: 'Request Approval',
      description: 'Submit an action or exception to a human approver',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['approval:request'],
      riskLevel: 'LOW',
      inputSchema: {
        type: 'object',
        properties: {
          commandId: { type: 'string' },
          reason: { type: 'string' },
          approverRole: { type: 'string' },
        },
        required: ['commandId', 'reason'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
    });

    this.registerTool({
      toolId: 'createASN',
      name: 'Create Advanced Shipping Notice',
      description: 'Ingest or draft an ASN from supplier freight notice',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['asn:create'],
      riskLevel: 'MEDIUM',
      inputSchema: {
        type: 'object',
        properties: {
          poId: { type: 'string' },
          supplierId: { type: 'string' },
          items: { type: 'array' },
        },
        required: ['poId', 'supplierId', 'items'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['ASSIST', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
    });

    this.registerTool({
      toolId: 'createException',
      name: 'Create Exception',
      description: 'Log a formal supply chain exception for resolution',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['exception:create'],
      riskLevel: 'LOW',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          severity: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['title', 'severity'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['OBSERVE', 'ASSIST', 'RECOMMEND', 'APPROVAL_GATED', 'GOVERNED'],
      enabled: true,
    });

    this.registerTool({
      toolId: 'createPaymentHandoff',
      name: 'Create Payment Handoff',
      description: 'Prepare voucher handoff for matched invoice (Critical Risk: strictly gated)',
      version: '1.0.0',
      tenantScope: true,
      requiredPermissions: ['payment_handoff:create'],
      riskLevel: 'CRITICAL',
      inputSchema: {
        type: 'object',
        properties: {
          invoiceId: { type: 'string' },
          amount: { type: 'number' },
          payee: { type: 'string' },
        },
        required: ['invoiceId', 'amount', 'payee'],
      },
      outputSchema: { type: 'object' },
      allowedModes: ['APPROVAL_GATED'],
      enabled: true,
    });
  }

  /**
   * Register a tool into the registry
   */
  public registerTool(tool: AITool): void {
    // Prohibit forbidden tools
    const forbidden = ['executesql', 'rawfirestorewrite', 'admindatabasewrite', 'bypasskernel'];
    if (forbidden.includes(tool.toolId.toLowerCase())) {
      throw new Error(`Tool Security Violation: Prohibited tool registration attempt: '${tool.toolId}'`);
    }

    this.tools.set(tool.toolId, tool);
  }

  /**
   * Retrieve a tool
   */
  public getTool(toolId: string): AITool | null {
    return this.tools.get(toolId) || null;
  }

  /**
   * List all registered tools
   */
  public listTools(): AITool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Execute a tool through the Tool Execution Gate
   */
  public async executeTool(
    toolId: string,
    params: any,
    context: AIExecutionContext
  ): Promise<any> {
    const tool = this.getTool(toolId);
    if (!tool) {
      throw new Error(`Tool Execution Violation: Tool '${toolId}' is not registered in ToolRegistry.`);
    }

    if (!tool.enabled) {
      throw new Error(`Tool Execution Violation: Tool '${toolId}' is disabled.`);
    }

    // 1. Validate agent allowed tools
    if (!context.agent.allowedTools.includes(toolId)) {
      throw new Error(`Tool Security Violation: Agent '${context.agent.agentId}' is not authorized to call tool '${toolId}'.`);
    }

    // 2. Validate operating mode allows tool
    if (!tool.allowedModes.includes(context.mode)) {
      throw new Error(
        `Tool Security Violation: Tool '${toolId}' is not permitted under operating mode '${context.mode}'. Permitted: [${tool.allowedModes.join(', ')}]`
      );
    }

    // 3. Enforce operating mode restrictions
    const isMutation = tool.riskLevel !== 'LOW' || !tool.execute;
    if (context.mode === 'OBSERVE' && isMutation) {
      throw new Error('AI Execution Violation: Agent operating mode is OBSERVE (read-only). Mutations strictly forbidden.');
    }
    if (context.mode === 'PROHIBITED') {
      throw new Error('AI Execution Violation: Agent operating mode is PROHIBITED. All operations denied.');
    }

    // 4. Validate input parameters schema
    if (tool.inputSchema.required) {
      for (const req of tool.inputSchema.required) {
        if (params[req] === undefined || params[req] === null) {
          throw new Error(`Tool Validation Violation: Tool '${toolId}' missing required parameter '${req}'.`);
        }
      }
    }

    // 5. If tool has custom read executor, run and validate output
    if (tool.execute) {
      const rawOutput = await tool.execute(params, context);
      return aiSecurityGuard.validateToolOutput(context.tenantId, rawOutput);
    }

    // For mutation tools, they return structured parameters to pass to CommandBuilder
    return {
      toolId,
      parameters: params,
      riskLevel: tool.riskLevel,
      requiresApproval: tool.riskLevel === 'HIGH' || tool.riskLevel === 'CRITICAL' || context.mode === 'APPROVAL_GATED',
    };
  }
}

export const toolRegistry = ToolRegistry.getInstance();
