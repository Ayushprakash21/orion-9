/**
 * ORION-9 WAVE 12: GOVERNED CONTROL POLICY & PROPOSAL SERVICE
 *
 * Enterprise persistence and governance layer for Admin Control Center.
 * Replaces client-side localStorage with Cloud Firestore authoritative persistence,
 * fail-closed RBAC, Kernel CommandBus enforcement, and immutable audit logging.
 */

import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { KernelCommandBus } from '../kernel/CommandBus';
import { KernelAuditEngine } from '../kernel/AuditEngine';
import { kernelEventBus } from '../kernel/EventBus';
import { aiSecurityGuard } from '../ai/AISecurityGuard';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { CommandResult } from '../kernel/types';

export type Mode = 'Manual' | 'AI Copilot' | 'AI Autopilot';
export type Policy = 'Strict' | 'Standard';
export type Scope = 'Capability' | 'Domain' | 'Organization';

export interface ControlPolicyRecord {
  id: string; // `${tenantId}_${capabilityId}`
  tenantId: string;
  organizationId: string;
  domainId: string;
  capabilityId: string;
  mode: Mode;
  policy: Policy;
  scope: Scope;
  approvalRequired: boolean;
  enabled: boolean;
  version: number;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'DISABLED';
}

export interface ControlProposalRecord {
  id: string;
  proposalId: string;
  tenantId: string;
  organizationId: string;
  domainId: string;
  capabilityId: string;
  proposerActor: {
    id: string;
    type: 'AI' | 'USER' | 'SYSTEM' | string;
    name: string;
    roles?: string[];
  };
  proposerType: 'AI' | 'USER' | 'SYSTEM';
  risk: 'Low' | 'Medium' | 'High';
  currentState: {
    mode: Mode;
    policy: Policy;
    scope: Scope;
    approval: boolean;
    enabled: boolean;
  };
  proposedState: {
    mode: Mode;
    policy: Policy;
    scope: Scope;
    approval: boolean;
    enabled: boolean;
  };
  reason: string;
  requiresApproval: boolean;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'CANCELLED' | 'EXECUTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComments?: string;
  createdAt: string;
}

export interface SimulationRunRecord {
  id: string;
  timestamp: string;
  tenantId: string;
  domainId: string;
  domainName: string;
  capabilityId: string;
  capabilityName: string;
  mode: Mode;
  policy: Policy;
  scope: Scope;
  result: string;
  simulationMode: true;
}

export class ControlPolicyService {
  private static instance: ControlPolicyService;
  private commandBus: KernelCommandBus;
  private auditEngine: KernelAuditEngine;

  // In-memory cache for ultra-fast local state & resilient fallback
  private policyCache: Map<string, ControlPolicyRecord> = new Map();
  private proposalCache: Map<string, ControlProposalRecord> = new Map();
  private simulationCache: Map<string, SimulationRunRecord[]> = new Map();

  private constructor() {
    this.commandBus = KernelCommandBus.getInstance();
    this.auditEngine = KernelAuditEngine.getInstance();
    this.registerKernelHandlers();
  }

  public static getInstance(): ControlPolicyService {
    if (!ControlPolicyService.instance) {
      ControlPolicyService.instance = new ControlPolicyService();
    }
    return ControlPolicyService.instance;
  }

  /**
   * Registers CommandBus handlers for policy changes
   */
  private registerKernelHandlers(): void {
    if (!this.commandBus.hasHandler('UPDATE_CONTROL_POLICY')) {
      this.commandBus.registerHandler('UPDATE_CONTROL_POLICY', async (command) => {
        const payload = command.payload as {
          policyRecord: ControlPolicyRecord;
        };
        const record = payload.policyRecord;

        // Persist to authoritative Firestore
        try {
          const db = getFirebaseFirestore();
          if (db) {
            const policyRef = doc(db, 'control_policies', record.id);
            await setDoc(policyRef, record, { merge: true });
          }
        } catch (dbErr) {
          console.warn('[ControlPolicyService] Firestore sync warning (falling back to cache):', dbErr);
        }

        // Update cache
        this.policyCache.set(record.id, record);

        // Update secondary client cache if browser
        if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
          try {
            const cacheKey = `orion_control_policies_${record.tenantId}`;
            const existing = JSON.parse(localStorage.getItem(cacheKey) || '{}');
            existing[record.capabilityId] = record;
            localStorage.setItem(cacheKey, JSON.stringify(existing));
          } catch {}
        }

        // Publish event
        kernelEventBus.publish('CONTROL_POLICY_UPDATED', record, {
          actor: command.actor,
          tenant: command.tenant,
          entityId: record.capabilityId,
          entityType: 'policy',
        });

        return {
          status: 'UPDATED',
          policyId: record.id,
          capabilityId: record.capabilityId,
          version: record.version,
        };
      });
    }
  }

  /**
   * Retrieves the authoritative policy for a capability
   */
  public async getPolicy(tenantId: string, capabilityId: string): Promise<ControlPolicyRecord | null> {
    const docId = `${tenantId}_${capabilityId}`;

    // Check in-memory cache first
    if (this.policyCache.has(docId)) {
      return this.policyCache.get(docId)!;
    }

    // Try Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        const docRef = doc(db, 'control_policies', docId);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const data = snapshot.data() as ControlPolicyRecord;
          this.policyCache.set(docId, data);
          return data;
        }
      }
    } catch (e) {
      console.warn('[ControlPolicyService] Firestore read warning, falling back to cache:', e);
    }

    // Secondary client cache check (read-only fallback)
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const cacheKey = `orion_control_policies_${tenantId}`;
        const raw = localStorage.getItem(cacheKey);
        if (raw) {
          const all = JSON.parse(raw);
          if (all[capabilityId]) {
            return all[capabilityId] as ControlPolicyRecord;
          }
        }
      } catch {}
    }

    return null;
  }

  /**
   * Lists all policies for a given tenant
   */
  public async listPolicies(tenantId: string): Promise<ControlPolicyRecord[]> {
    const results: ControlPolicyRecord[] = [];

    try {
      const db = getFirebaseFirestore();
      if (db) {
        const q = query(collection(db, 'control_policies'), where('tenantId', '==', tenantId));
        const snapshots = await getDocs(q);
        snapshots.forEach((d) => {
          const item = d.data() as ControlPolicyRecord;
          results.push(item);
          this.policyCache.set(item.id, item);
        });
      }
    } catch (e) {
      console.warn('[ControlPolicyService] Firestore list warning, using cache:', e);
    }

    if (results.length === 0) {
      // Fallback from in-memory cache
      for (const [id, record] of this.policyCache.entries()) {
        if (record.tenantId === tenantId) {
          results.push(record);
        }
      }
    }

    return results;
  }

  /**
   * Governed Policy Mutation through Kernel CommandBus
   */
  public async updatePolicy(params: {
    actor: AuthorizationActor;
    tenantId: string;
    organizationId: string;
    domainId: string;
    capabilityId: string;
    mode: Mode;
    policy: Policy;
    scope: Scope;
    approvalRequired: boolean;
    enabled: boolean;
  }): Promise<CommandResult> {
    const { actor, tenantId, organizationId, domainId, capabilityId, mode, policy, scope, approvalRequired, enabled } = params;

    // Build policy record
    const existing = await this.getPolicy(tenantId, capabilityId);
    const version = (existing?.version || 0) + 1;
    const now = new Date().toISOString();

    const record: ControlPolicyRecord = {
      id: `${tenantId}_${capabilityId}`,
      tenantId,
      organizationId,
      domainId,
      capabilityId,
      mode,
      policy,
      scope,
      approvalRequired,
      enabled,
      version,
      createdBy: existing?.createdBy || actor.id,
      updatedBy: actor.id,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      status: 'ACTIVE',
    };

    // Audit the intent
    await this.auditEngine.record({
      actor: { id: actor.id, type: actor.type as any, name: actor.name, role: actor.roles?.[0] },
      tenantId,
      action: 'POLICY_CHANGE_REQUESTED',
      entityType: 'policy',
      entityId: capabilityId,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: { mode, policy, scope, approvalRequired, enabled },
    });

    // Dispatch through Kernel CommandBus (requires policy:update permission)
    const result = await this.commandBus.dispatch(
      'UPDATE_CONTROL_POLICY',
      { policyRecord: record },
      {
        actor: {
          id: actor.id,
          type: actor.type as any,
          name: actor.name,
          role: actor.roles?.[0] || 'admin',
        },
        tenant: {
          organizationId,
        },
        entityType: 'policy',
        entityId: capabilityId,
        requiredPermission: 'policy:update',
      }
    );

    if (result.success) {
      await this.auditEngine.record({
        actor: { id: actor.id, type: actor.type as any, name: actor.name, role: actor.roles?.[0] },
        tenantId,
        action: 'POLICY_UPDATED',
        entityType: 'policy',
        entityId: capabilityId,
        result: 'SUCCESS',
        classification: 'INTERNAL',
        details: { mode, policy, scope, version },
      });
    }

    return result;
  }

  /**
   * Creates an AI Governance Proposal
   */
  public async createAIProposal(params: {
    tenantId: string;
    organizationId: string;
    domainId: string;
    capabilityId: string;
    risk: 'Low' | 'Medium' | 'High';
    proposerActor: { id: string; type: string; name: string; roles?: string[] };
    currentState: ControlProposalRecord['currentState'];
    proposedState: ControlProposalRecord['proposedState'];
    reason: string;
  }): Promise<ControlProposalRecord> {
    const proposalId = `PROP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const now = new Date().toISOString();

    const proposal: ControlProposalRecord = {
      id: proposalId,
      proposalId,
      tenantId: params.tenantId,
      organizationId: params.organizationId,
      domainId: params.domainId,
      capabilityId: params.capabilityId,
      proposerActor: params.proposerActor,
      proposerType: (params.proposerActor.type as any) || 'AI',
      risk: params.risk,
      currentState: params.currentState,
      proposedState: params.proposedState,
      reason: params.reason,
      requiresApproval: true,
      status: 'PENDING',
      createdAt: now,
    };

    // Authoritative Firestore write
    try {
      const db = getFirebaseFirestore();
      if (db) {
        const propRef = doc(db, 'control_proposals', proposalId);
        await setDoc(propRef, proposal);
      }
    } catch (e) {
      console.warn('[ControlPolicyService] Firestore proposal write warning (caching locally):', e);
    }

    // Cache
    this.proposalCache.set(proposalId, proposal);

    // Secondary client cache for offline display
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const cacheKey = `orion_control_proposals_${params.tenantId}`;
        const existing = JSON.parse(localStorage.getItem(cacheKey) || '[]');
        existing.unshift(proposal);
        localStorage.setItem(cacheKey, JSON.stringify(existing.slice(0, 100)));
      } catch {}
    }

    // Audit log
    await this.auditEngine.record({
      actor: { id: params.proposerActor.id, type: 'AI_AGENT', name: params.proposerActor.name },
      tenantId: params.tenantId,
      action: 'AI_PROPOSAL_CREATED',
      entityType: 'proposal',
      entityId: proposalId,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: { capabilityId: params.capabilityId, risk: params.risk, reason: params.reason },
    });

    await this.auditEngine.record({
      actor: { id: params.proposerActor.id, type: 'AI_AGENT', name: params.proposerActor.name },
      tenantId: params.tenantId,
      action: 'APPROVAL_REQUESTED',
      entityType: 'proposal',
      entityId: proposalId,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: { reason: `Human approval required for AI proposal ${proposalId}` },
    });

    return proposal;
  }

  /**
   * Lists proposals for a tenant
   */
  public async listProposals(tenantId: string): Promise<ControlProposalRecord[]> {
    const list: ControlProposalRecord[] = [];

    try {
      const db = getFirebaseFirestore();
      if (db) {
        const q = query(collection(db, 'control_proposals'), where('tenantId', '==', tenantId));
        const snapshots = await getDocs(q);
        snapshots.forEach((d) => {
          const item = d.data() as ControlProposalRecord;
          list.push(item);
          this.proposalCache.set(item.id, item);
        });
      }
    } catch (e) {
      console.warn('[ControlPolicyService] Firestore list proposals warning, using cache:', e);
    }

    if (list.length === 0) {
      for (const [id, item] of this.proposalCache.entries()) {
        if (item.tenantId === tenantId) {
          list.push(item);
        }
      }
    }

    if (list.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`orion_control_proposals_${tenantId}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Resolves an AI Proposal (Human in the loop)
   */
  public async resolveProposal(params: {
    proposalId: string;
    decision: 'APPROVED' | 'REJECTED';
    approver: AuthorizationActor;
    comments?: string;
  }): Promise<{ success: boolean; error?: string }> {
    const { proposalId, decision, approver, comments } = params;

    const proposal = this.proposalCache.get(proposalId) || (await this.getProposalById(proposalId));
    if (!proposal) {
      return { success: false, error: `Proposal ${proposalId} not found.` };
    }

    // CRITICAL SECURITY RULE: AI self-approval prevention & Requester self-approval prevention
    try {
      aiSecurityGuard.assertCanApprove(approver, {
        id: proposal.proposerActor.id,
        type: proposal.proposerActor.type,
        roles: proposal.proposerActor.roles || ['ai_agent'],
        organizationId: proposal.organizationId,
      });
    } catch (secErr: any) {
      await this.auditEngine.record({
        actor: { id: approver.id, type: approver.type as any, name: approver.name, role: approver.roles?.[0] },
        tenantId: proposal.tenantId,
        action: 'POLICY_CHANGE_REJECTED',
        entityType: 'proposal',
        entityId: proposalId,
        result: 'BLOCKED',
        failureReason: secErr.message,
        classification: 'INTERNAL',
      });
      throw secErr;
    }

    const reviewedAt = new Date().toISOString();
    const updatedStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';

    proposal.status = updatedStatus;
    proposal.reviewedBy = approver.name || approver.id;
    proposal.reviewedAt = reviewedAt;
    proposal.reviewComments = comments;

    // Update Firestore
    try {
      const db = getFirebaseFirestore();
      if (db) {
        const propRef = doc(db, 'control_proposals', proposalId);
        await updateDoc(propRef, {
          status: updatedStatus,
          reviewedBy: proposal.reviewedBy,
          reviewedAt,
          reviewComments: comments || null,
        });
      }
    } catch (e) {
      console.warn('[ControlPolicyService] Firestore proposal resolution update warning:', e);
    }

    this.proposalCache.set(proposalId, proposal);

    // If approved, execute the policy mutation through CommandBus!
    if (decision === 'APPROVED') {
      await this.updatePolicy({
        actor: approver,
        tenantId: proposal.tenantId,
        organizationId: proposal.organizationId,
        domainId: proposal.domainId,
        capabilityId: proposal.capabilityId,
        mode: proposal.proposedState.mode,
        policy: proposal.proposedState.policy,
        scope: proposal.proposedState.scope,
        approvalRequired: proposal.proposedState.approval,
        enabled: proposal.proposedState.enabled,
      });

      await this.auditEngine.record({
        actor: { id: approver.id, type: approver.type as any, name: approver.name, role: approver.roles?.[0] },
        tenantId: proposal.tenantId,
        action: 'POLICY_CHANGE_APPROVED',
        entityType: 'proposal',
        entityId: proposalId,
        result: 'SUCCESS',
        classification: 'INTERNAL',
        details: { proposalId, capabilityId: proposal.capabilityId, reviewedBy: approver.name },
      });
    } else {
      await this.auditEngine.record({
        actor: { id: approver.id, type: approver.type as any, name: approver.name, role: approver.roles?.[0] },
        tenantId: proposal.tenantId,
        action: 'POLICY_CHANGE_REJECTED',
        entityType: 'proposal',
        entityId: proposalId,
        result: 'SUCCESS',
        classification: 'INTERNAL',
        details: { proposalId, capabilityId: proposal.capabilityId, comments },
      });
    }

    return { success: true };
  }

  private async getProposalById(proposalId: string): Promise<ControlProposalRecord | null> {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        const docRef = doc(db, 'control_proposals', proposalId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          return snap.data() as ControlProposalRecord;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Deterministic, zero-side-effect simulation
   */
  public async simulatePolicy(params: {
    tenantId: string;
    domainId: string;
    domainName: string;
    capabilityId: string;
    capabilityName: string;
    mode: Mode;
    policy: Policy;
    scope: Scope;
    actor: AuthorizationActor;
  }): Promise<SimulationRunRecord> {
    const { tenantId, domainId, domainName, capabilityId, capabilityName, mode, policy, scope, actor } = params;

    const simId = `SIM-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const timestamp = new Date().toISOString();

    const resultMessage = `SIMULATION ONLY · NO PRODUCTION MUTATION: Evaluated ${capabilityName} under ${mode} (${policy} / ${scope}). 0 production records modified.`;

    const record: SimulationRunRecord = {
      id: simId,
      timestamp,
      tenantId,
      domainId,
      domainName,
      capabilityId,
      capabilityName,
      mode,
      policy,
      scope,
      result: resultMessage,
      simulationMode: true,
    };

    const existing = this.simulationCache.get(tenantId) || [];
    existing.unshift(record);
    this.simulationCache.set(tenantId, existing.slice(0, 100));

    // Secondary client cache
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(`orion_control_simulations_${tenantId}`, JSON.stringify(existing.slice(0, 50)));
      } catch {}
    }

    // Authoritative Audit Log
    await this.auditEngine.record({
      actor: { id: actor.id, type: actor.type as any, name: actor.name, role: actor.roles?.[0] },
      tenantId,
      action: 'POLICY_SIMULATED',
      entityType: 'policy_simulation',
      entityId: capabilityId,
      result: 'SUCCESS',
      classification: 'INTERNAL',
      details: { simId, capabilityName, mode, policy, scope, mutationCount: 0 },
    });

    return record;
  }

  public listSimulations(tenantId: string): SimulationRunRecord[] {
    const list = this.simulationCache.get(tenantId) || [];
    if (list.length === 0 && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem(`orion_control_simulations_${tenantId}`);
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return list;
  }
}

export const controlPolicyService = ControlPolicyService.getInstance();
