/**
 * ORION-9 WAVE 5 — AGENT REGISTRY
 *
 * Durable, tenant-scoped registry for all AI agents.
 * Strict multi-tenant boundaries: Agents belong to a tenant and cannot cross tenant isolation boundaries.
 */

import { AIAgent, AgentStatus, AIOperatingMode, AIRiskClass } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export class AgentRegistry {
  private static instance: AgentRegistry;
  private agents: Map<string, AIAgent> = new Map();

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
    const defaultAgent: AIAgent = {
      agentId: 'agent-orion-copilot',
      tenantId: 'org-global',
      name: 'Orion Supply Chain Copilot',
      description: 'Platform AI Assistant for inventory, procurement, and exception intelligence',
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
    this.agents.set(`${defaultAgent.tenantId}:${defaultAgent.agentId}`, defaultAgent);
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

    if (!agent) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const snap = await getDoc(doc(db, 'agents', `${tenantId}_${agentId}`));
          if (snap.exists()) {
            const data = snap.data() as AIAgent;
            // Strict tenant validation
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
   * List all agents within a specific tenant
   */
  public listAgents(tenantId: string): AIAgent[] {
    const results: AIAgent[] = [];
    for (const [key, agent] of this.agents.entries()) {
      if (agent.tenantId === tenantId) {
        results.push(agent);
      }
    }
    return results;
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

  /**
   * Reset in-memory registry (for tests)
   */
  public reset(): void {
    this.agents.clear();
    this.seedDefaultAgents();
  }
}

export const agentRegistry = AgentRegistry.getInstance();
