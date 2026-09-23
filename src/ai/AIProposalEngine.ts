/**
 * ORION-9 PART 4 TRACK 5 — GOVERNED AI PROPOSAL ENGINE
 *
 * Formulates structured decisions and action proposals without direct database mutation.
 * Enforces:
 * 1. Strict reasoning step classification (FACT, OBSERVATION, MODELLED, PREDICTION, ASSUMPTION, RECOMMENDATION).
 * 2. Multi-vector risk assessment (score, blast radius, financial exposure, reversibility).
 * 3. Formal human approval gates (strictly prohibits AI self-approval or peer approval).
 * 4. Governed Kernel Execution: Approved proposals translate to authorized CommandEnvelopes dispatched
 *    exclusively via kernelCommandBus.
 */

import {
  AIProposal,
  AIProposalStatus,
  AIProposalEvidence,
  AIProposalRisk,
  ReasoningStep,
  AICommandPayload,
  AgentDomain,
} from './types';
import { agentRegistry } from './AgentRegistry';
import { aiSecurityGuard } from './AISecurityGuard';
import { aiCommandBuilder } from './AICommandBuilder';
import { decisionRecordEngine } from './DecisionRecordEngine';
import { kernelCommandBus } from '../kernel/CommandBus';
import { AuthorizationActor, ActorType } from '../kernel/authorization/AuthorizationEngine';
import { CommandResult } from '../kernel/types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface CreateProposalOptions {
  tenantId: string;
  agentId: string;
  intent: string;
  proposedCommand: AICommandPayload;
  evidence: AIProposalEvidence;
  reasoningChain: ReasoningStep[];
  riskAssessment?: Partial<AIProposalRisk>;
  confidence: number;
  requiredApproverRoles?: string[];
  expiresInHours?: number;
}

export class AIProposalEngine {
  private static instance: AIProposalEngine;
  private proposals: Map<string, AIProposal> = new Map();

  private constructor() {}

  public static getInstance(): AIProposalEngine {
    if (!AIProposalEngine.instance) {
      AIProposalEngine.instance = new AIProposalEngine();
    }
    return AIProposalEngine.instance;
  }

  /**
   * Create a structured, evidence-backed AI Proposal
   */
  public async createProposal(options: CreateProposalOptions): Promise<AIProposal> {
    const { tenantId, agentId, intent, proposedCommand, evidence, reasoningChain, confidence } = options;

    if (!tenantId || !agentId) {
      throw new Error('AI Proposal Error: tenantId and agentId are required.');
    }

    // 1. Verify agent existence, tenant scope, and health
    const agent = await agentRegistry.getAgent(tenantId, agentId);
    if (!agent) {
      throw new Error(`AI Proposal Error: Agent '${agentId}' not found in tenant '${tenantId}'.`);
    }

    aiSecurityGuard.assertNotQuarantined(agent.status, agent.name);

    if (agent.status !== 'ACTIVE') {
      throw new Error(`AI Proposal Error: Agent '${agent.name}' is currently in '${agent.status}' state.`);
    }

    // 2. Validate reasoning step classifications
    const validCategories = ['FACT', 'OBSERVATION', 'MODELLED', 'PREDICTION', 'ASSUMPTION', 'RECOMMENDATION'];
    for (const step of reasoningChain) {
      if (!validCategories.includes(step.category)) {
        throw new Error(`AI Proposal Error: Invalid reasoning category '${step.category}'. Must be one of: ${validCategories.join(', ')}`);
      }
      if (!step.statement || step.statement.trim().length === 0) {
        throw new Error('AI Proposal Error: Reasoning steps must contain non-empty statements.');
      }
    }

    // 3. Compute risk assessment
    const riskAssessment: AIProposalRisk = {
      score: options.riskAssessment?.score ?? (agent.riskClass === 'CRITICAL' ? 90 : agent.riskClass === 'HIGH' ? 70 : agent.riskClass === 'MEDIUM' ? 40 : 15),
      blastRadius: options.riskAssessment?.blastRadius ?? (agent.riskClass === 'HIGH' || agent.riskClass === 'CRITICAL' ? 'GLOBAL' : 'LOCAL'),
      financialExposure: options.riskAssessment?.financialExposure ?? (proposedCommand.parameters?.totalAmount || proposedCommand.parameters?.amount || 0),
      reversibility: options.riskAssessment?.reversibility ?? (agent.riskClass === 'HIGH' || agent.riskClass === 'CRITICAL' ? 'IRREVERSIBLE' : 'REVERSIBLE'),
      riskClass: agent.riskClass,
    };

    // 4. Determine initial approval status based on agent operating mode
    let initialStatus: AIProposalStatus = 'PENDING_HUMAN_APPROVAL';
    if (agent.operatingMode === 'OBSERVE' || agent.operatingMode === 'RECOMMEND') {
      initialStatus = 'DRAFT';
    } else if (agent.operatingMode === 'APPROVAL_GATED') {
      initialStatus = 'PENDING_HUMAN_APPROVAL';
    } else if (agent.operatingMode === 'GOVERNED') {
      // Governed low risk can be pre-approved for execution
      initialStatus = riskAssessment.score < 30 ? 'APPROVED' : 'PENDING_HUMAN_APPROVAL';
    }

    const proposalId = `prop-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const now = new Date();
    const expiresInHours = options.expiresInHours || 72;
    const expiresAt = new Date(now.getTime() + expiresInHours * 60 * 60 * 1000).toISOString();

    const proposal: AIProposal = {
      proposalId,
      tenantId,
      agentId,
      agentName: agent.name,
      domain: (agent.domain as AgentDomain) || 'CONTROL_TOWER',
      intent,
      proposedCommand,
      evidence,
      reasoningChain,
      riskAssessment,
      confidence: Math.max(0, Math.min(1, confidence)),
      approvalStatus: initialStatus,
      requiredApproverRoles: options.requiredApproverRoles || ['platform_admin', 'organization_admin', 'procurement_manager'],
      createdAt: now.toISOString(),
      expiresAt,
    };

    this.proposals.set(`${tenantId}:${proposalId}`, proposal);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'ai_proposals', `${tenantId}_${proposalId}`), proposal);
      }
    } catch (e) {}

    return proposal;
  }

  /**
   * Submit draft proposal for human approval
   */
  public async submitForApproval(tenantId: string, proposalId: string): Promise<AIProposal> {
    const proposal = await this.getProposal(tenantId, proposalId);
    if (!proposal) {
      throw new Error(`AI Proposal '${proposalId}' not found.`);
    }

    proposal.approvalStatus = 'PENDING_HUMAN_APPROVAL';
    this.proposals.set(`${tenantId}:${proposalId}`, proposal);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'ai_proposals', `${tenantId}_${proposalId}`), {
          approvalStatus: 'PENDING_HUMAN_APPROVAL',
        });
      }
    } catch (e) {}

    return proposal;
  }

  /**
   * Approve a proposal — strictly restricted to human approvers with required roles
   */
  public async approveProposal(
    tenantId: string,
    proposalId: string,
    approver: AuthorizationActor,
    comment?: string
  ): Promise<AIProposal> {
    const proposal = await this.getProposal(tenantId, proposalId);
    if (!proposal) {
      throw new Error(`AI Proposal '${proposalId}' not found.`);
    }

    // Build synthetic requester actor from the proposal's creating agent
    const requesterActor: AuthorizationActor = {
      id: proposal.agentId,
      type: ActorType.AI_AGENT,
      name: proposal.agentName,
      roles: ['ai_agent'],
      organizationId: tenantId,
    };

    // Strict Anti-Self-Approval and Role Verification
    aiSecurityGuard.assertCanApprove(approver, requesterActor, proposalId, tenantId);

    // Verify approver has at least one of the required roles
    const hasRequiredRole = approver.roles?.some(r => proposal.requiredApproverRoles.includes(r));
    if (!hasRequiredRole) {
      throw new Error(`AI Approval Violation: Approver '${approver.id}' does not possess required roles [${proposal.requiredApproverRoles.join(', ')}].`);
    }

    proposal.approvalStatus = 'APPROVED';
    proposal.approvedBy = approver.id;
    proposal.approvedAt = new Date().toISOString();
    proposal.approverComment = comment;

    this.proposals.set(`${tenantId}:${proposalId}`, proposal);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'ai_proposals', `${tenantId}_${proposalId}`), {
          approvalStatus: 'APPROVED',
          approvedBy: approver.id,
          approvedAt: proposal.approvedAt,
          approverComment: comment,
        });
      }
    } catch (e) {}

    return proposal;
  }

  /**
   * Reject a proposal with formal rationale
   */
  public async rejectProposal(
    tenantId: string,
    proposalId: string,
    approver: AuthorizationActor,
    reason: string
  ): Promise<AIProposal> {
    const proposal = await this.getProposal(tenantId, proposalId);
    if (!proposal) {
      throw new Error(`AI Proposal '${proposalId}' not found.`);
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('AI Proposal Rejection Error: Formal rejection reason is required.');
    }

    proposal.approvalStatus = 'REJECTED';
    proposal.rejectedBy = approver.id;
    proposal.rejectedAt = new Date().toISOString();
    proposal.approverComment = reason;

    this.proposals.set(`${tenantId}:${proposalId}`, proposal);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'ai_proposals', `${tenantId}_${proposalId}`), {
          approvalStatus: 'REJECTED',
          rejectedBy: approver.id,
          rejectedAt: proposal.rejectedAt,
          approverComment: reason,
        });
      }
    } catch (e) {}

    return proposal;
  }

  /**
   * Execute an APPROVED proposal strictly through the Orion Kernel Command Bus
   */
  public async executeProposal(
    tenantId: string,
    proposalId: string,
    executingActor: AuthorizationActor
  ): Promise<{ proposal: AIProposal; commandResult: CommandResult }> {
    const proposal = await this.getProposal(tenantId, proposalId);
    if (!proposal) {
      throw new Error(`AI Proposal '${proposalId}' not found.`);
    }

    if (proposal.approvalStatus !== 'APPROVED') {
      throw new Error(`AI Execution Violation: Cannot execute proposal in status '${proposal.approvalStatus}'. Approval required.`);
    }

    // Verify agent is still active and not quarantined
    const agent = await agentRegistry.getAgent(tenantId, proposal.agentId);
    if (!agent) {
      throw new Error(`AI Execution Error: Agent '${proposal.agentId}' not found.`);
    }
    aiSecurityGuard.assertNotQuarantined(agent.status, agent.name);

    // Build typed CommandEnvelope via aiCommandBuilder
    const envelope = aiCommandBuilder.buildCommand(
      proposal.proposedCommand,
      agent
    );

    // Dispatch EXCLUSIVELY through Kernel Command Bus (Zero direct database mutation)
    const commandResult = await kernelCommandBus.execute(envelope);

    if (!commandResult.success) {
      throw new Error(`Kernel Execution Failure: ${commandResult.error || 'Unknown error'}`);
    }

    // Record formal decision record
    const decisionRecord = await decisionRecordEngine.recordDecision({
      tenantId,
      agentId: proposal.agentId,
      humanInitiatorId: executingActor.id,
      commandId: commandResult.commandId,
      reason: proposal.intent,
      recommendation: `Executed proposal ${proposal.proposalId}`,
      evidenceReferences: proposal.evidence.facts,
      risk: proposal.riskAssessment.riskClass,
      policy: 'GOVERNED_AI_WORKFORCE_POLICY',
      approvalRequired: true,
      outcome: 'EXECUTED_VIA_KERNEL',
    });

    proposal.approvalStatus = 'EXECUTED';
    proposal.executedAt = new Date().toISOString();
    proposal.executionCommandId = commandResult.commandId;
    proposal.outcomeId = decisionRecord.decisionId;

    this.proposals.set(`${tenantId}:${proposalId}`, proposal);

    try {
      const db = getFirebaseFirestore();
      if (db) {
        await updateDoc(doc(db, 'ai_proposals', `${tenantId}_${proposalId}`), {
          approvalStatus: 'EXECUTED',
          executedAt: proposal.executedAt,
          executionCommandId: commandResult.commandId,
          outcomeId: decisionRecord.decisionId,
        });
      }
    } catch (e) {}

    return { proposal, commandResult };
  }

  /**
   * Retrieve a proposal by ID ensuring tenant scoping
   */
  public async getProposal(tenantId: string, proposalId: string): Promise<AIProposal | null> {
    if (!tenantId || !proposalId) return null;
    const key = `${tenantId}:${proposalId}`;
    let proposal = this.proposals.get(key);

    if (!proposal) {
      try {
        const db = getFirebaseFirestore();
        if (db) {
          const snap = await getDoc(doc(db, 'ai_proposals', `${tenantId}_${proposalId}`));
          if (snap.exists()) {
            const data = snap.data() as AIProposal;
            if (data.tenantId === tenantId) {
              proposal = data;
              this.proposals.set(key, proposal);
            }
          }
        }
      } catch (e) {}
    }

    return proposal || null;
  }

  /**
   * List all proposals for a tenant with optional filtering
   */
  public listProposals(tenantId: string, filter?: { status?: AIProposalStatus; agentId?: string }): AIProposal[] {
    const results: AIProposal[] = [];
    for (const [key, proposal] of this.proposals.entries()) {
      if (proposal.tenantId === tenantId) {
        if (filter?.status && proposal.approvalStatus !== filter.status) continue;
        if (filter?.agentId && proposal.agentId !== filter.agentId) continue;
        results.push(proposal);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Reset in-memory proposals (for tests)
   */
  public reset(): void {
    this.proposals.clear();
  }
}

export const aiProposalEngine = AIProposalEngine.getInstance();
