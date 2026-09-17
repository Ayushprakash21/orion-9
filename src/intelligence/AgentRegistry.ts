/**
 * ORION-9 INTELLIGENCE LAYER — AGENT REGISTRY
 * Layer 2: Official registry of specialized, domain-scoped supply chain AI agents.
 * Defines agent identities, read/write boundaries, monetary limits, and approval mandates.
 */

import { AIAgentManifest } from './types';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AIAgentManifest> = new Map();

  private constructor() {
    this.registerStandardAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  public registerAgent(agent: AIAgentManifest): void {
    this.agents.set(agent.agentId, agent);
  }

  public getAgent(agentId: string): AIAgentManifest | undefined {
    return this.agents.get(agentId);
  }

  public getAllAgents(): AIAgentManifest[] {
    return Array.from(this.agents.values());
  }

  public getAgentsByDomain(domain: AIAgentManifest['domain']): AIAgentManifest[] {
    return this.getAllAgents().filter(a => a.domain === domain);
  }

  /**
   * Initializes the 13 canonical enterprise supply chain agents
   */
  private registerStandardAgents(): void {
    // 1. Procurement Agent
    this.registerAgent({
      agentId: 'agent-procurement',
      name: 'Procurement Autonomous Agent',
      purpose: 'Identifies replenishment requirements, evaluates supplier pricing, and prepares purchase order drafts.',
      domain: 'PROCUREMENT',
      version: '2.0',
      defaultMode: 'APPROVAL_GATED',
      readScope: ['inventory', 'purchase_orders', 'suppliers', 'pricing'],
      writeScope: ['purchase_order_drafts', 'rfq_proposals'],
      allowedTools: ['tool_get_inventory_levels', 'tool_get_supplier_scorecard', 'tool_request_purchase_order'],
      permissions: ['procurement.read', 'procurement.manage'],
      monetaryLimit: 10000,
      approvalRequirements: {
        alwaysRequireApproval: true,
        monetaryThreshold: 10000,
        requiresRoles: ['supply_chain_manager', 'organization_admin'],
      },
      escalationRules: {
        criticalThreshold: 50000,
        escalateTo: 'organization_admin',
      },
      auditIdentity: {
        id: 'agent-procurement-v2',
        model: 'gemini-3.8-flash',
        provider: 'Google Gemini',
      },
      status: 'ACTIVE',
    });

    // 2. Supplier Agent
    this.registerAgent({
      agentId: 'agent-supplier',
      name: 'Supplier Relationship & Performance Agent',
      purpose: 'Monitors supplier OTIF compliance, evaluates defect rates, and prepares operational inquiries.',
      domain: 'SUPPLIER',
      version: '2.0',
      defaultMode: 'ASSIST',
      readScope: ['suppliers', 'purchase_orders', 'contracts'],
      writeScope: ['supplier_communications', 'scorecard_annotations'],
      allowedTools: ['tool_get_supplier_scorecard', 'tool_draft_supplier_communication'],
      permissions: ['suppliers.read', 'suppliers.manage'],
      approvalRequirements: {
        alwaysRequireApproval: false,
        requiresRoles: ['procurement_user', 'supply_chain_manager'],
      },
      escalationRules: {
        criticalThreshold: 75,
        escalateTo: 'supply_chain_manager',
      },
      auditIdentity: {
        id: 'agent-supplier-v2',
        model: 'gemini-3.8-flash',
        provider: 'Google Gemini',
      },
      status: 'ACTIVE',
    });

    // 3. Demand Agent
    this.registerAgent({
      agentId: 'agent-demand',
      name: 'Demand Sensing & Forecasting Agent',
      purpose: 'Detects seasonal demand shifts, anomalies, and consumption spikes.',
      domain: 'DEMAND',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['inventory', 'customer_orders', 'market_signals'],
      writeScope: ['forecast_adjustments'],
      allowedTools: ['tool_get_inventory_levels', 'tool_simulate_disruption'],
      permissions: ['analytics.read'],
      approvalRequirements: {
        alwaysRequireApproval: false,
      },
      escalationRules: {
        criticalThreshold: 80,
        escalateTo: 'supply_chain_manager',
      },
      auditIdentity: {
        id: 'agent-demand-v2',
        model: 'gemini-3.8-flash',
        provider: 'Google Gemini',
      },
      status: 'ACTIVE',
    });

    // 4. Planning Agent
    this.registerAgent({
      agentId: 'agent-planning',
      name: 'Integrated Business Planning Agent',
      purpose: 'Harmonizes demand forecasts with production and supplier capacity.',
      domain: 'PLANNING',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['inventory', 'suppliers', 'production_schedules'],
      writeScope: ['planning_recommendations'],
      allowedTools: ['tool_get_inventory_levels', 'tool_simulate_disruption'],
      permissions: ['analytics.read', 'inventory.read'],
      approvalRequirements: {
        alwaysRequireApproval: true,
      },
      escalationRules: {
        criticalThreshold: 70,
        escalateTo: 'supply_chain_manager',
      },
      auditIdentity: {
        id: 'agent-planning-v2',
        model: 'gemini-3.8-flash',
        provider: 'Google Gemini',
      },
      status: 'ACTIVE',
    });

    // 5. Inventory Agent
    this.registerAgent({
      agentId: 'agent-inventory',
      name: 'Inventory Health & Optimization Agent',
      purpose: 'Audits multi-echelon stock levels, stockout risks, and calculates inter-facility rebalancing.',
      domain: 'INVENTORY',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['inventory', 'warehouses', 'products'],
      writeScope: ['inventory_transfer_proposals'],
      allowedTools: ['tool_get_inventory_levels', 'tool_propose_inventory_rebalance'],
      permissions: ['inventory.read', 'inventory.manage'],
      approvalRequirements: {
        alwaysRequireApproval: true,
        requiresRoles: ['inventory_user', 'supply_chain_manager'],
      },
      escalationRules: {
        criticalThreshold: 85,
        escalateTo: 'supply_chain_manager',
      },
      auditIdentity: {
        id: 'agent-inventory-v2',
        model: 'gemini-3.8-flash',
        provider: 'Google Gemini',
      },
      status: 'ACTIVE',
    });

    // 6. Warehouse Agent
    this.registerAgent({
      agentId: 'agent-warehouse',
      name: 'Warehouse Operations & Slotting Agent',
      purpose: 'Optimizes warehouse storage density, dock scheduling, and picking paths.',
      domain: 'WAREHOUSE',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['warehouse_details', 'inventory_lots'],
      writeScope: ['slotting_recommendations'],
      allowedTools: ['tool_get_inventory_levels'],
      permissions: ['inventory.read'],
      approvalRequirements: { alwaysRequireApproval: false },
      escalationRules: { criticalThreshold: 90, escalateTo: 'supply_chain_manager' },
      auditIdentity: { id: 'agent-warehouse-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 7. Logistics Agent
    this.registerAgent({
      agentId: 'agent-logistics',
      name: 'Freight & Transportation Agent',
      purpose: 'Monitors container tracking, port congestion, lane disruptions, and carrier OTIF.',
      domain: 'LOGISTICS',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['shipments', 'carriers', 'routes'],
      writeScope: ['freight_reroute_proposals'],
      allowedTools: ['tool_simulate_disruption'],
      permissions: ['shipments.read', 'shipments.manage'],
      approvalRequirements: { alwaysRequireApproval: true },
      escalationRules: { criticalThreshold: 75, escalateTo: 'supply_chain_manager' },
      auditIdentity: { id: 'agent-logistics-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 8. Quality Agent
    this.registerAgent({
      agentId: 'agent-quality',
      name: 'Quality Assurance & Quarantine Agent',
      purpose: 'Identifies recurring defect patterns and initiates quality quarantine holds.',
      domain: 'QUALITY',
      version: '2.0',
      defaultMode: 'APPROVAL_GATED',
      readScope: ['inventory_lots', 'suppliers', 'inspections'],
      writeScope: ['quality_holds'],
      allowedTools: ['tool_flag_quality_hold'],
      permissions: ['inventory.manage'],
      approvalRequirements: { alwaysRequireApproval: true, requiresRoles: ['supply_chain_manager'] },
      escalationRules: { criticalThreshold: 60, escalateTo: 'supply_chain_manager' },
      auditIdentity: { id: 'agent-quality-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 9. Finance / Matching Agent
    this.registerAgent({
      agentId: 'agent-finance',
      name: 'Financial 3-Way Match & Variance Agent',
      purpose: 'Compares purchase orders, goods receipts (GRNs), and supplier invoices to detect variances.',
      domain: 'FINANCE',
      version: '2.0',
      defaultMode: 'APPROVAL_GATED',
      readScope: ['invoices', 'purchase_orders', 'receipts'],
      writeScope: ['payment_authorization_requests'],
      allowedTools: ['tool_get_supplier_scorecard'],
      permissions: ['procurement.read'],
      monetaryLimit: 5000,
      approvalRequirements: { alwaysRequireApproval: true, monetaryThreshold: 5000 },
      escalationRules: { criticalThreshold: 25000, escalateTo: 'organization_admin' },
      auditIdentity: { id: 'agent-finance-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 10. Risk Agent
    this.registerAgent({
      agentId: 'agent-risk',
      name: 'Compound Supply Chain Risk Agent',
      purpose: 'Aggregates geopolitical, weather, supplier financial, and inventory risks into composite scores.',
      domain: 'RISK',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['suppliers', 'shipments', 'inventory', 'exceptions'],
      writeScope: ['risk_annotations'],
      allowedTools: ['tool_get_supplier_scorecard', 'tool_simulate_disruption'],
      permissions: ['analytics.read'],
      approvalRequirements: { alwaysRequireApproval: false },
      escalationRules: { criticalThreshold: 80, escalateTo: 'organization_admin' },
      auditIdentity: { id: 'agent-risk-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 11. Exception Agent
    this.registerAgent({
      agentId: 'agent-exception',
      name: 'Disruption & Exception Resolution Agent',
      purpose: 'Detects operational deviations, identifies root causes, and proposes mitigation actions.',
      domain: 'EXCEPTION',
      version: '2.0',
      defaultMode: 'RECOMMEND',
      readScope: ['exceptions', 'actions', 'decisions'],
      writeScope: ['action_proposals'],
      allowedTools: ['tool_get_inventory_levels', 'tool_draft_supplier_communication'],
      permissions: ['analytics.read'],
      approvalRequirements: { alwaysRequireApproval: true },
      escalationRules: { criticalThreshold: 70, escalateTo: 'supply_chain_manager' },
      auditIdentity: { id: 'agent-exception-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 12. Integration Agent
    this.registerAgent({
      agentId: 'agent-integration',
      name: 'Enterprise ERP Connector Health Agent',
      purpose: 'Monitors synchronization latency, detects schema drift, and flags sync failures.',
      domain: 'INTEGRATION',
      version: '2.0',
      defaultMode: 'OBSERVE',
      readScope: ['connectors', 'sync_jobs', 'schema_definitions'],
      writeScope: ['sync_retry_requests'],
      allowedTools: [],
      permissions: ['settings.read'],
      approvalRequirements: { alwaysRequireApproval: false },
      escalationRules: { criticalThreshold: 80, escalateTo: 'platform_admin' },
      auditIdentity: { id: 'agent-integration-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });

    // 13. Governance Agent
    this.registerAgent({
      agentId: 'agent-governance',
      name: 'Architectural Constitution & Policy Audit Agent',
      purpose: 'Enforces architectural constitution rules, verifies approval chains, and audits AI actions.',
      domain: 'GOVERNANCE',
      version: '2.0',
      defaultMode: 'OBSERVE',
      readScope: ['audit_logs', 'policies', 'approvals', 'roles'],
      writeScope: ['governance_alerts'],
      allowedTools: [],
      permissions: ['audit.read', 'settings.manage'],
      approvalRequirements: { alwaysRequireApproval: false },
      escalationRules: { criticalThreshold: 90, escalateTo: 'platform_admin' },
      auditIdentity: { id: 'agent-governance-v2', model: 'gemini-3.8-flash', provider: 'Google Gemini' },
      status: 'ACTIVE',
    });
  }
}

export const agentRegistry = AgentRegistry.getInstance();
