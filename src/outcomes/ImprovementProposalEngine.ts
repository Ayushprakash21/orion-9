/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Improvement Proposal Engine
 * 
 * Manages the lifecycle of governed operational & model adjustments.
 * STRICT POLICY: AI Agents are strictly forbidden from approving improvement proposals.
 * Human Platform/Org Admin review is required.
 */

import { ImprovementProposal, ProposalType, ProposalStatus } from './types';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, setDoc } from 'firebase/firestore';

export class ImprovementProposalEngine {
  private static instance: ImprovementProposalEngine;
  private proposals: Map<string, ImprovementProposal> = new Map(); // key: `${tenantId}:${proposalId}`

  private constructor() {}

  public static getInstance(): ImprovementProposalEngine {
    if (!ImprovementProposalEngine.instance) {
      ImprovementProposalEngine.instance = new ImprovementProposalEngine();
    }
    return ImprovementProposalEngine.instance;
  }

  /**
   * Draft a new improvement proposal
   */
  public createProposal(params: {
    tenantId: string;
    signalId: string;
    title: string;
    description: string;
    proposalType: ProposalType;
    proposedChanges: Record<string, any>;
    baselineParameters: Record<string, any>;
    expectedImpact: {
      otifImprovementPct: number;
      costReductionAnnualized: number;
      riskReductionPct: number;
    };
    createdBy: string;
    rollbackPlan?: {
      targetVersion: string;
      automatedSteps: string[];
      safeFallbackParameters: Record<string, any>;
    };
  }): ImprovementProposal {
    const proposalId = `PROP-${params.tenantId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const rollbackPlan = params.rollbackPlan || {
      targetVersion: 'v1.0.0',
      automatedSteps: [
        'Revert policy parameters to baseline',
        'Purge challenger shadow execution workers',
        'Record rollback audit ledger event'
      ],
      safeFallbackParameters: { ...params.baselineParameters },
    };

    const proposal: ImprovementProposal = {
      proposalId,
      tenantId: params.tenantId,
      signalId: params.signalId,
      title: params.title,
      description: params.description,
      proposalType: params.proposalType,
      proposedChanges: params.proposedChanges,
      baselineParameters: params.baselineParameters,
      expectedImpact: params.expectedImpact,
      status: 'PENDING_APPROVAL',
      createdBy: params.createdBy,
      createdAt: new Date().toISOString(),
      rollbackPlan,
    };

    this.proposals.set(`${params.tenantId}:${proposalId}`, proposal);
    this.persistProposal(proposal);
    return proposal;
  }

  /**
   * Governance Review Gate — strictly rejects AI self-approval
   */
  public reviewProposal(params: {
    tenantId: string;
    proposalId: string;
    reviewedBy: string;
    userRole: string;
    isAIAgent?: boolean;
    action: 'APPROVED' | 'REJECTED';
    justification: string;
  }): { success: boolean; proposal?: ImprovementProposal; error?: string } {
    const proposal = this.proposals.get(`${params.tenantId}:${params.proposalId}`);
    if (!proposal) {
      return { success: false, error: 'Proposal not found' };
    }

    // STRICT GOVERNANCE CHECK: AI cannot approve proposals
    if (params.isAIAgent || params.reviewedBy.startsWith('AGENT-') || params.reviewedBy.startsWith('AI-')) {
      return {
        success: false,
        error: 'GOVERNANCE_VIOLATION: AI agents cannot self-approve improvement proposals. Human governance authorization required.'
      };
    }

    // Human Role Check: Must be admin
    const isAdmin = ['platform_admin', 'organization_admin', 'admin'].includes(params.userRole.toLowerCase());
    if (!isAdmin) {
      return {
        success: false,
        error: 'PERMISSION_DENIED: Only Platform Admin or Organization Admin can approve proposals.'
      };
    }

    proposal.status = params.action === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    proposal.governanceReview = {
      reviewedBy: params.reviewedBy,
      reviewedAt: new Date().toISOString(),
      action: params.action,
      justification: params.justification,
    };

    this.proposals.set(`${params.tenantId}:${params.proposalId}`, proposal);
    this.persistProposal(proposal);

    return { success: true, proposal };
  }

  /**
   * Marks an approved proposal as deployed
   */
  public markDeployed(tenantId: string, proposalId: string): ImprovementProposal | undefined {
    const proposal = this.proposals.get(`${tenantId}:${proposalId}`);
    if (!proposal || proposal.status !== 'APPROVED') return undefined;

    proposal.status = 'DEPLOYED';
    proposal.deployedAt = new Date().toISOString();
    this.proposals.set(`${tenantId}:${proposalId}`, proposal);
    this.persistProposal(proposal);
    return proposal;
  }

  private async persistProposal(proposal: ImprovementProposal): Promise<void> {
    try {
      const db = getFirebaseFirestore();
      if (db) {
        await setDoc(doc(db, 'improvement_proposals', `${proposal.tenantId}_${proposal.proposalId}`), proposal);
      }
    } catch {
      // Best-effort Firestore write
    }
  }

  public getProposal(tenantId: string, proposalId: string): ImprovementProposal | undefined {
    return this.proposals.get(`${tenantId}:${proposalId}`);
  }

  public listProposals(tenantId: string): ImprovementProposal[] {
    const list: ImprovementProposal[] = [];
    for (const [key, value] of this.proposals.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        list.push(value);
      }
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public clear(): void {
    this.proposals.clear();
  }
}
