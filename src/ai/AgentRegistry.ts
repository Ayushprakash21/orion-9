/**
 * ORION-9 PART 4 TRACK 5 — GOVERNED AI AGENT REGISTRY & WORKFORCE MANAGEMENT
 *
 * Durable, tenant-scoped registry for all 20 specialized enterprise AI workforce agents.
 * Strict multi-tenant boundaries: Agents belong to a tenant and cannot cross isolation boundaries.
 * Governed Quarantine Engine: Quarantined agents are suspended from all execution until administrative reinstatement.
 */

import {
  AIAgent,
  AgentStatus,
  AIOperatingMode,
  AIRiskClass,
  AgentDomain,
  QuarantineReason,
  AgentQuarantineRecord,
} from './types';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface AgentBlueprint {
  agentId: string;
  name: string;
  description: string;
  domain: AgentDomain;
  operatingMode: AIOperatingMode;
  riskClass: AIRiskClass;
  capabilities: string[];
  allowedTools: string[];
  allowedCommands: string[];
}

export const ENTERPRISE_WORKFORCE_BLUEPRINTS: AgentBlueprint[] = [
  {
    agentId: 'agent-control-tower',
    name: 'Control Tower Sentinel Agent',
    description: 'Enterprise-wide end-to-end supply chain monitoring, milestone tracking, and cross-domain alerting',
    domain: 'CONTROL_TOWER',
    operatingMode: 'OBSERVE',
    riskClass: 'LOW',
    capabilities: ['control_tower:observe', 'kpi:read', 'telemetry:read', 'alert:dispatch', 'signals:read'],
    allowedTools: ['getDashboardMetrics', 'query_signals', 'getExceptions', 'getDelayedShipments', 'getOverduePOs'],
    allowedCommands: ['CREATE_EXCEPTION'],
  },
  {
    agentId: 'agent-procurement',
    name: 'Autonomous & Governed Procurement Agent',
    description: 'Autonomous purchase requisition preparation, RFQ generation, quotation comparison, and PO drafting',
    domain: 'PROCUREMENT',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['po:read', 'pr:create', 'rfq:create', 'po:create', 'supplier:read', 'quotation:compare'],
    allowedTools: ['getSuppliers', 'getSupplierPerformance', 'getPurchaseOrders', 'createPurchaseRequisition', 'createRFQ', 'compareQuotations', 'createPurchaseOrderDraft'],
    allowedCommands: ['CREATE_PURCHASE_REQUISITION', 'CREATE_RFQ', 'CREATE_PURCHASE_ORDER'],
  },
  {
    agentId: 'agent-supplier-intel',
    name: 'Supplier Intelligence & Scorecard Agent',
    description: 'Tier-N supplier risk analysis, compliance evaluation, ESG tracking, and delivery reliability scoring',
    domain: 'SUPPLIER_INTELLIGENCE',
    operatingMode: 'RECOMMEND',
    riskClass: 'LOW',
    capabilities: ['supplier:read', 'tier_n:read', 'esg:read', 'scorecard:evaluate', 'lead_time:predict'],
    allowedTools: ['getSuppliers', 'getSupplierPerformance', 'query_risk_graph', 'query_predictions'],
    allowedCommands: [],
  },
  {
    agentId: 'agent-inventory',
    name: 'Multi-Echelon Inventory Optimization Agent',
    description: 'Continuous inventory health monitoring, safety stock re-calculation, stockout prevention, and rebalancing',
    domain: 'INVENTORY',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['inventory:read', 'safety_stock:optimize', 'rebalance:propose', 'stockout:prevent'],
    allowedTools: ['getInventory', 'getInventoryRisks', 'getDashboardMetrics', 'query_predictions'],
    allowedCommands: ['REBALANCE_INVENTORY', 'CREATE_REQUISITION'],
  },
  {
    agentId: 'agent-demand-planning',
    name: 'Demand Forecasting & Consensus Agent',
    description: 'Multi-model demand forecasting, demand sensing, promotion lifting, and consensus forecast preparation',
    domain: 'DEMAND_PLANNING',
    operatingMode: 'RECOMMEND',
    riskClass: 'LOW',
    capabilities: ['demand:forecast', 'signals:analyze', 'baseline:compute', 'consensus:propose'],
    allowedTools: ['query_signals', 'query_predictions', 'getDashboardMetrics'],
    allowedCommands: [],
  },
  {
    agentId: 'agent-sop',
    name: 'Sales & Operations Planning Consensus Agent',
    description: 'Cross-functional S&OP scenario alignment, supply-demand balancing, and executive tradeoff formulation',
    domain: 'SOP',
    operatingMode: 'RECOMMEND',
    riskClass: 'MEDIUM',
    capabilities: ['sop:scenario', 'tradeoff:evaluate', 'capacity:balance', 'consensus:align'],
    allowedTools: ['query_decision_options', 'query_recommendations', 'query_outcomes', 'getDashboardMetrics'],
    allowedCommands: [],
  },
  {
    agentId: 'agent-logistics',
    name: 'Logistics & Freight Orchestration Agent',
    description: 'Dynamic carrier route optimization, transit exception prediction, demurrage prevention, and freight handoff',
    domain: 'LOGISTICS',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['shipment:read', 'route:optimize', 'carrier:select', 'freight:dispatch', 'eta:predict'],
    allowedTools: ['getShipments', 'getDelayedShipments', 'query_predictions', 'query_signals'],
    allowedCommands: ['UPDATE_SHIPMENT_ROUTE', 'EXPEDITE_SHIPMENT'],
  },
  {
    agentId: 'agent-warehouse',
    name: 'Warehouse Operations & Slotting Agent',
    description: 'Dynamic dock scheduling, wave pick optimization, slotting re-assignment, and cycle count triggers',
    domain: 'WAREHOUSE',
    operatingMode: 'GOVERNED',
    riskClass: 'LOW',
    capabilities: ['warehouse:slot', 'wave:plan', 'dock:schedule', 'cycle_count:trigger'],
    allowedTools: ['getInventory', 'getDashboardMetrics'],
    allowedCommands: ['SCHEDULE_CYCLE_COUNT', 'ALLOCATE_DOCK_DOOR'],
  },
  {
    agentId: 'agent-customer-fulfillment',
    name: 'Customer Fulfillment & Allocation Agent',
    description: 'Real-time Available-to-Promise (ATP) calculation, order prioritization, and allocation rules execution',
    domain: 'CUSTOMER_FULFILLMENT',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['order:allocate', 'atp:calculate', 'promise_date:evaluate', 'backorder:manage'],
    allowedTools: ['getInventory', 'getPurchaseOrders', 'getShipments'],
    allowedCommands: ['ALLOCATE_CUSTOMER_ORDER', 'SPLIT_ORDER'],
  },
  {
    agentId: 'agent-finance-matching',
    name: 'Finance & 3-Way Invoice Matching Agent',
    description: 'Automated 3-way matching between PO, GRN, and Invoice with tolerance enforcement and dispute flagging',
    domain: 'FINANCE_MATCHING',
    operatingMode: 'GOVERNED',
    riskClass: 'MEDIUM',
    capabilities: ['invoice:match', 'tolerance:check', 'variance:flag', 'payment_handoff:prepare'],
    allowedTools: ['getPurchaseOrders', 'getDashboardMetrics'],
    allowedCommands: ['APPROVE_INVOICE_MATCH', 'HOLD_INVOICE_DISPUTE'],
  },
  {
    agentId: 'agent-risk',
    name: 'Multi-Tier Supply Chain Risk Agent',
    description: 'Geopolitical, meteorological, financial, and logistical risk propagation modeling with early-warning signals',
    domain: 'RISK',
    operatingMode: 'RECOMMEND',
    riskClass: 'MEDIUM',
    capabilities: ['risk:evaluate', 'contagion:simulate', 'geopolitical:monitor', 'disruption:alert'],
    allowedTools: ['query_risk_graph', 'query_signals', 'query_exceptions', 'getInventoryRisks'],
    allowedCommands: ['RAISE_RISK_ALERT'],
  },
  {
    agentId: 'agent-master-data',
    name: 'Master Data Quality & Golden Record Agent',
    description: '7-dimension data quality audits, entity deduplication, schema validation, and golden record survivorship',
    domain: 'MASTER_DATA',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['master_data:inspect', 'deduplicate:propose', 'golden_record:merge', 'dq:score'],
    allowedTools: ['getSuppliers', 'getInventory', 'getDashboardMetrics'],
    allowedCommands: ['PROPOSE_GOLDEN_RECORD_MERGE', 'FLAG_DATA_QUALITY_ISSUE'],
  },
  {
    agentId: 'agent-quality',
    name: 'Inbound & In-Process Quality Inspection Agent',
    description: 'Statistical sampling plan generation, quality inspection validation, lot quarantine, and CAPA logging',
    domain: 'QUALITY',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['inspection:evaluate', 'quarantine:tag', 'nonconformance:log', 'sampling:plan'],
    allowedTools: ['getPurchaseOrders', 'getShipments', 'getExceptions'],
    allowedCommands: ['QUARANTINE_INVENTORY_LOT', 'LOG_NONCONFORMANCE'],
  },
  {
    agentId: 'agent-integration-ops',
    name: 'B2B Gateway & EDI Operations Agent',
    description: 'X12/EDIFACT transmission health monitoring, partner acknowledgement verification, and syntax triage',
    domain: 'INTEGRATION_OPERATIONS',
    operatingMode: 'OBSERVE',
    riskClass: 'LOW',
    capabilities: ['edi:monitor', 'schema:validate', 'partner_sync:diagnose', 'retry:propose'],
    allowedTools: ['getDashboardMetrics', 'getExceptions'],
    allowedCommands: ['TRIGGER_EDI_RETRY'],
  },
  {
    agentId: 'agent-scenario-planning',
    name: 'Digital Twin Scenario & What-If Agent',
    description: 'Parametric shock simulations, demand swing testing, supplier outage modeling, and tradeoff comparison',
    domain: 'SCENARIO_PLANNING',
    operatingMode: 'RECOMMEND',
    riskClass: 'LOW',
    capabilities: ['twin:simulate', 'whatif:execute', 'stress_test:run', 'comparison:evaluate'],
    allowedTools: ['query_decision_options', 'query_predictions', 'query_risk_graph'],
    allowedCommands: [],
  },
  {
    agentId: 'agent-executive-intel',
    name: 'Executive Supply Chain Briefing Agent',
    description: 'Synthesizes enterprise-wide telemetry into daily C-suite briefings, working capital trends, and board summaries',
    domain: 'EXECUTIVE_INTELLIGENCE',
    operatingMode: 'OBSERVE',
    riskClass: 'LOW',
    capabilities: ['briefing:synthesize', 'csuite_kpi:summarize', 'board_deck:prepare'],
    allowedTools: ['getDashboardMetrics', 'query_outcomes', 'getInventoryRisks'],
    allowedCommands: [],
  },
  {
    agentId: 'agent-compliance',
    name: 'Trade Compliance & Sanctions Agent',
    description: 'Denied party screening, export control classification, dual-use item checking, and tariff compliance',
    domain: 'COMPLIANCE',
    operatingMode: 'RECOMMEND',
    riskClass: 'HIGH',
    capabilities: ['compliance:audit', 'sanctions:screen', 'tariff:classify', 'export_control:verify'],
    allowedTools: ['getSuppliers', 'getPurchaseOrders', 'query_signals'],
    allowedCommands: ['FLAG_COMPLIANCE_HOLD'],
  },
  {
    agentId: 'agent-knowledge',
    name: 'Enterprise SCM Knowledge & SOP Agent',
    description: 'Instant contextual retrieval of standard operating procedures, trade regulations, and corporate policies',
    domain: 'KNOWLEDGE',
    operatingMode: 'OBSERVE',
    riskClass: 'LOW',
    capabilities: ['sop:search', 'policy:explain', 'regulatory:retrieve', 'guideline:reference'],
    allowedTools: ['getDashboardMetrics'],
    allowedCommands: [],
  },
  {
    agentId: 'agent-workflow',
    name: 'Workflow Orchestration & SLA Sentinel Agent',
    description: 'Monitors long-running business workflows, SLA bottlenecks, deadlocks, and automated compensation triggers',
    domain: 'WORKFLOW',
    operatingMode: 'APPROVAL_GATED',
    riskClass: 'MEDIUM',
    capabilities: ['workflow:monitor', 'sla:predict', 'bottleneck:remediate', 'compensation:trigger'],
    allowedTools: ['getExceptions', 'query_signals', 'getDashboardMetrics'],
    allowedCommands: ['TRIGGER_WORKFLOW_RETRY', 'ESCALATE_WORKFLOW_SLA'],
  },
  {
    agentId: 'agent-observability',
    name: 'Platform Telemetry & Incident Sentinel Agent',
    description: 'Observes system-level telemetry, transaction rates, drift metrics, and coordinates incident triaging',
    domain: 'OBSERVABILITY_INCIDENT',
    operatingMode: 'OBSERVE',
    riskClass: 'LOW',
    capabilities: ['telemetry:analyze', 'drift:detect', 'incident:triage', 'root_cause:trace'],
    allowedTools: ['getDashboardMetrics', 'query_signals', 'query_root_causes'],
    allowedCommands: ['DECLARE_INCIDENT'],
  },
];

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AIAgent> = new Map();
  private quarantineLedger: Map<string, AgentQuarantineRecord[]> = new Map();

  private constructor() {
    this.seedDefaultAgents();
  }

  public static getInstance(): AgentRegistry {
    if (!AgentRegistry.instance) {
      AgentRegistry.instance = new AgentRegistry();
    }
    return AgentRegistry.instance;
  }

  private seedDefaultAgents(): void {
    // 1. Seed classic Orion Copilot for backward compatibility
    const defaultCopilot: AIAgent = {
      agentId: 'agent-orion-copilot',
      tenantId: 'org-global',
      name: 'Orion Supply Chain Copilot',
      description: 'Platform AI Assistant for inventory, procurement, and exception intelligence',
      domain: 'CONTROL_TOWER',
      version: '1.0.0',
      status: 'ACTIVE',
      operatingMode: 'APPROVAL_GATED',
      capabilities: [
        'inventory:read',
        'supplier:read',
        'po:read',
        'shipment:read',
        'exception:read',
        'signals:read',
        'exceptions:read',
        'root_causes:read',
        'risk_graph:read',
        'predictions:read',
        'decisions:read',
        'recommendations:read',
        'outcomes:read',
        'decision_replays:read',
        'pr:create',
        'rfq:create',
        'po:create',
      ],
      allowedTools: [
        'getInventory',
        'getInventoryRisks',
        'getSuppliers',
        'getSupplierPerformance',
        'getPurchaseOrders',
        'getOverduePOs',
        'getShipments',
        'getDelayedShipments',
        'getExceptions',
        'getDashboardMetrics',
        'query_signals',
        'query_exceptions',
        'query_root_causes',
        'query_risk_graph',
        'query_predictions',
        'query_decisions',
        'query_decision_options',
        'query_recommendations',
        'query_outcomes',
        'query_decision_replay',
        'createPurchaseRequisition',
        'createRFQ',
        'compareQuotations',
        'createPurchaseOrderDraft',
      ],
      allowedCommands: [
        'CREATE_PURCHASE_REQUISITION',
        'CREATE_RFQ',
        'CREATE_PURCHASE_ORDER',
        'CREATE_EXCEPTION',
      ],
      riskClass: 'MEDIUM',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.agents.set(`${defaultCopilot.tenantId}:${defaultCopilot.agentId}`, defaultCopilot);

    // 2. Seed all 20 specialized enterprise workforce agents
    for (const bp of ENTERPRISE_WORKFORCE_BLUEPRINTS) {
      const agent: AIAgent = {
        agentId: bp.agentId,
        tenantId: 'org-global',
        name: bp.name,
        description: bp.description,
        domain: bp.domain,
        version: '1.0.0',
        status: 'ACTIVE',
        operatingMode: bp.operatingMode,
        capabilities: [...bp.capabilities],
        allowedTools: [...bp.allowedTools],
        allowedCommands: [...bp.allowedCommands],
        riskClass: bp.riskClass,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.agents.set(`${agent.tenantId}:${agent.agentId}`, agent);
    }
  }

  /**
   * Provision the full 20-agent workforce for a specific tenant
   */
  public async seedTenantWorkforce(tenantId: string): Promise<AIAgent[]> {
    if (!tenantId || tenantId === 'org-global') {
      return this.listAgents('org-global');
    }

    const seeded: AIAgent[] = [];
    for (const bp of ENTERPRISE_WORKFORCE_BLUEPRINTS) {
      const existing = await this.getAgent(tenantId, bp.agentId);
      if (!existing) {
        const agent: AIAgent = {
          agentId: bp.agentId,
          tenantId,
          name: bp.name,
          description: bp.description,
          domain: bp.domain,
          version: '1.0.0',
          status: 'ACTIVE',
          operatingMode: bp.operatingMode,
          capabilities: [...bp.capabilities],
          allowedTools: [...bp.allowedTools],
          allowedCommands: [...bp.allowedCommands],
          riskClass: bp.riskClass,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await this.registerAgent(agent);
        seeded.push(agent);
      } else {
        seeded.push(existing);
      }
    }
    return seeded;
  }

  /**
   * Register a new tenant-scoped agent
   */
  public async registerAgent(agent: AIAgent): Promise<AIAgent> {
    if (!agent.agentId || !agent.tenantId) {
      throw new Error('Agent registration requires valid agentId and tenantId');
    }

    const key = `${agent.tenantId}:${agent.agentId}`;
    const timestampedAgent: AIAgent = {
      ...agent,
      createdAt: agent.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.agents.set(key, timestampedAgent);

    // Durable Firestore backup if emulator / cloud is connected
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'agents', `${agent.tenantId}_${agent.agentId}`), timestampedAgent);
      }
    } catch (err) {
      // Non-blocking for offline / test runs
    }

    return timestampedAgent;
  }

  /**
   * Retrieve an agent ensuring strict tenant isolation
   */
  public async getAgent(tenantId: string, agentId: string): Promise<AIAgent | null> {
    if (!tenantId || !agentId) return null;

    const key = `${tenantId}:${agentId}`;
    let agent = this.agents.get(key);

    // If not found in specific tenant, check org-global default blueprint
    if (!agent && tenantId !== 'org-global') {
      const globalAgent = this.agents.get(`org-global:${agentId}`);
      if (globalAgent) {
        // Return a tenant-adapted copy
        agent = {
          ...globalAgent,
          tenantId,
        };
        this.agents.set(key, agent);
      }
    }

    if (!agent) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const snap = await getDoc(doc(db, 'agents', `${tenantId}_${agentId}`));
          if (snap.exists()) {
            const data = snap.data() as AIAgent;
            if (data.tenantId === tenantId) {
              agent = data;
              this.agents.set(key, agent);
            }
          }
        }
      } catch (err) {
        // Non-blocking
      }
    }

    return agent || null;
  }

  /**
   * List all agents within a specific tenant (including globally available workforce)
   */
  public listAgents(tenantId: string): AIAgent[] {
    const resultsMap = new Map<string, AIAgent>();

    // 1. First add org-global templates adapted to this tenant
    for (const [key, agent] of this.agents.entries()) {
      if (agent.tenantId === 'org-global') {
        resultsMap.set(agent.agentId, { ...agent, tenantId });
      }
    }

    // 2. Override with tenant-specific customized instances
    for (const [key, agent] of this.agents.entries()) {
      if (agent.tenantId === tenantId) {
        resultsMap.set(agent.agentId, agent);
      }
    }

    return Array.from(resultsMap.values());
  }

  /**
   * Update agent lifecycle status
   */
  public async updateAgentStatus(tenantId: string, agentId: string, status: AgentStatus): Promise<AIAgent> {
    const agent = await this.getAgent(tenantId, agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in tenant '${tenantId}'`);
    }

    agent.status = status;
    agent.updatedAt = new Date().toISOString();
    this.agents.set(`${tenantId}:${agentId}`, agent);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'agents', `${tenantId}_${agentId}`), {
          status,
          updatedAt: agent.updatedAt,
        });
      }
    } catch (e) {}

    return agent;
  }

  /**
   * Update agent operating mode
   */
  public async updateOperatingMode(tenantId: string, agentId: string, mode: AIOperatingMode): Promise<AIAgent> {
    const agent = await this.getAgent(tenantId, agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in tenant '${tenantId}'`);
    }

    agent.operatingMode = mode;
    agent.updatedAt = new Date().toISOString();
    this.agents.set(`${tenantId}:${agentId}`, agent);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'agents', `${tenantId}_${agentId}`), {
          operatingMode: mode,
          updatedAt: agent.updatedAt,
        });
      }
    } catch (e) {}

    return agent;
  }

  /**
   * Check if an agent possesses a required capability
   */
  public async hasCapability(tenantId: string, agentId: string, capability: string): Promise<boolean> {
    const agent = await this.getAgent(tenantId, agentId);
    if (!agent || agent.status !== 'ACTIVE') return false;
    return agent.capabilities.includes(capability);
  }

  // ============================================================================
  // GOVERNED QUARANTINE ENGINE
  // ============================================================================

  /**
   * Quarantine an agent immediately upon policy violation or security trigger
   */
  public async quarantineAgent(
    tenantId: string,
    agentId: string,
    reason: QuarantineReason,
    details: string,
    evidence?: any
  ): Promise<AgentQuarantineRecord> {
    const agent = await this.getAgent(tenantId, agentId);
    const agentName = agent ? agent.name : agentId;

    if (agent) {
      agent.status = 'QUARANTINED';
      agent.quarantineReason = reason;
      agent.quarantinedAt = new Date().toISOString();
      agent.updatedAt = new Date().toISOString();
      this.agents.set(`${tenantId}:${agentId}`, agent);
    }

    const record: AgentQuarantineRecord = {
      quarantineId: `quarantine-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId,
      agentId,
      agentName,
      reason,
      severity: reason === 'PROMPT_INJECTION' || reason === 'ATTEMPTED_SELF_APPROVAL' ? 'CRITICAL' : 'WARNING',
      details,
      quarantinedAt: new Date().toISOString(),
      evidence,
    };

    const records = this.quarantineLedger.get(tenantId) || [];
    records.push(record);
    this.quarantineLedger.set(tenantId, records);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'ai_quarantine', record.quarantineId), record);
        if (agent) {
          await updateDoc(doc(db, 'agents', `${tenantId}_${agentId}`), {
            status: 'QUARANTINED',
            quarantineReason: reason,
            quarantinedAt: agent.quarantinedAt,
          });
        }
      }
    } catch (e) {}

    return record;
  }

  /**
   * Reinstate a quarantined agent — strictly restricted to authorized human administrators
   */
  public async reinstateAgent(
    tenantId: string,
    agentId: string,
    adminActor: AuthorizationActor,
    justification: string
  ): Promise<AIAgent> {
    if (!justification || justification.trim().length < 10) {
      throw new Error('Agent Reinstatement Violation: Formal justification of at least 10 characters is required.');
    }

    // AI agents can NEVER reinstate another agent or themselves
    if (adminActor.type === 'AI_AGENT' || adminActor.roles?.includes('ai_agent')) {
      throw new Error('Agent Reinstatement Violation: AI agents cannot reinstate quarantined agents.');
    }

    const isAdmin = adminActor.roles?.some(r => ['platform_admin', 'organization_admin', 'admin'].includes(r));
    if (!isAdmin) {
      throw new Error(`Agent Reinstatement Violation: Actor '${adminActor.id}' lacks administrative authority.`);
    }

    const agent = await this.getAgent(tenantId, agentId);
    if (!agent) {
      throw new Error(`Agent '${agentId}' not found in tenant '${tenantId}'`);
    }

    agent.status = 'ACTIVE';
    agent.reinstatedAt = new Date().toISOString();
    agent.reinstatedBy = adminActor.id;
    delete agent.quarantineReason;
    delete agent.quarantinedAt;
    agent.updatedAt = new Date().toISOString();

    this.agents.set(`${tenantId}:${agentId}`, agent);

    // Update the latest quarantine record
    const records = this.quarantineLedger.get(tenantId) || [];
    const latest = [...records].reverse().find(r => r.agentId === agentId && !r.reinstatedAt);
    if (latest) {
      latest.reinstatedAt = agent.reinstatedAt;
      latest.reinstatedBy = adminActor.id;
      latest.reinstatementJustification = justification;
    }

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'agents', `${tenantId}_${agentId}`), {
          status: 'ACTIVE',
          reinstatedAt: agent.reinstatedAt,
          reinstatedBy: adminActor.id,
        });
      }
    } catch (e) {}

    return agent;
  }

  /**
   * Get all quarantine records for a tenant
   */
  public getQuarantineRecords(tenantId: string): AgentQuarantineRecord[] {
    return this.quarantineLedger.get(tenantId) || [];
  }

  /**
   * Check if an agent is currently quarantined
   */
  public async isAgentQuarantined(tenantId: string, agentId: string): Promise<boolean> {
    const agent = await this.getAgent(tenantId, agentId);
    return agent?.status === 'QUARANTINED';
  }

  /**
   * Reset in-memory registry (for tests)
   */
  public reset(): void {
    this.agents.clear();
    this.quarantineLedger.clear();
    this.seedDefaultAgents();
  }
}

export const agentRegistry = AgentRegistry.getInstance();
