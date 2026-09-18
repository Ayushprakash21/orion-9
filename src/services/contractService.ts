/**
 * ORION-9 ENTERPRISE CONTRACT & SOURCING SERVICE
 * Layer 4 Kernel & Layer 5 System Services
 * 
 * Orchestrates Contract Lifecycle:
 * DRAFT -> UNDER_LEGAL_REVIEW -> PENDING_EXECUTIVE_APPROVAL -> ACTIVE -> EXPIRING_SOON -> EXPIRED / TERMINATED
 * 
 * Integrates:
 * - State Machine enforcement (contractStateMachine)
 * - Central Command Bus (KernelCommandBus)
 * - Policy Engine governance (POL-CTR-001)
 * - Event Bus pub/sub (KernelEventBus)
 * - Cryptographic Audit Trail (KernelAuditEngine)
 * - Persistent Store (db.contracts & db.rfqs)
 */

import { EnterpriseContract, SourcingRfq, SourcingBid, ContractState, AiRedlineFinding } from '../types/contract';
import { contractStateMachine } from '../kernel/StateMachine';
import { KernelCommandBus } from '../kernel/CommandBus';
import { kernelEventBus } from '../kernel/EventBus';
import { KernelAuditEngine } from '../kernel/AuditEngine';
import { db, saveData } from '../data/db';
import { sha256 } from '../kernel/security/crypto';

export interface ContractEvaluationResult {
  contractId: string;
  contractNumber: string;
  supplierId: string;
  supplierName: string;
  status: ContractState;
  daysUntilExpiration: number;
  isRenewalWindowOpen: boolean;
  otifGap: number;
  defectGap: number;
  totalLiquidatedDamagesUsd: number;
  slaBreachedCount: number;
  redlineAlertsCount: number;
  riskRating: 'Low' | 'Moderate' | 'High';
  executiveApprovalRequired: boolean;
  recommendations: string[];
}

export class ContractService {
  private static instance: ContractService;
  private commandBus: KernelCommandBus;
  private auditEngine: KernelAuditEngine;

  private constructor() {
    this.commandBus = KernelCommandBus.getInstance();
    this.auditEngine = KernelAuditEngine.getInstance();
    this.registerKernelCommands();
  }

  public static getInstance(): ContractService {
    if (!ContractService.instance) {
      ContractService.instance = new ContractService();
    }
    return ContractService.instance;
  }

  /**
   * Register kernel command handlers with KernelCommandBus
   */
  private registerKernelCommands(): void {
    // 1. CREATE_CONTRACT
    this.commandBus.registerHandler('CREATE_CONTRACT', async (envelope) => {
      const contract = envelope.payload as EnterpriseContract;
      return this.handleCreateContract(contract, envelope);
    });

    // 2. SUBMIT_LEGAL_REVIEW
    this.commandBus.registerHandler('SUBMIT_LEGAL_REVIEW', async (envelope) => {
      const { contractId } = envelope.payload;
      return this.handleSubmitLegalReview(contractId, envelope);
    });

    // 3. REQUEST_EXECUTIVE_APPROVAL
    this.commandBus.registerHandler('REQUEST_EXECUTIVE_APPROVAL', async (envelope) => {
      const { contractId, justifiedNote } = envelope.payload;
      return this.handleRequestExecutiveApproval(contractId, justifiedNote, envelope);
    });

    // 4. EXECUTE_CONTRACT
    this.commandBus.registerHandler('EXECUTE_CONTRACT', async (envelope) => {
      const { contractId, signatoryName } = envelope.payload;
      return this.handleExecuteContract(contractId, signatoryName, envelope);
    });

    // 5. AWARD_RFQ
    this.commandBus.registerHandler('AWARD_RFQ', async (envelope) => {
      const { rfqId, bidId } = envelope.payload;
      return this.handleAwardRfq(rfqId, bidId, envelope);
    });
  }

  /**
   * Handler: Create new contract
   */
  public async handleCreateContract(
    contract: EnterpriseContract,
    context?: any
  ): Promise<EnterpriseContract> {
    const actor = context?.actor || { id: 'usr-procurement', type: 'USER', name: 'Strategic Procurement Buyer', role: 'procurement_manager' };
    const tenantId = context?.tenant?.organizationId || 'org-global-ops';

    // Verify initial state
    contract.contractState = 'DRAFT';
    contract.status = 'Under Review';

    // Generate cryptographic hash
    const canonicalContent = `${contract.contractNumber}|${contract.supplierId}|${contract.annualValue}|${contract.startDate}|${contract.endDate}`;
    contract.cryptoIntegrityHash = await sha256(canonicalContent);

    // Run initial AI redline scan
    contract.redlineFindings = this.performAiRedlineAudit(contract);

    // Audit log
    await this.auditEngine.record({
      actor,
      tenantId,
      action: 'CREATE_CONTRACT',
      entityId: contract.id,
      entityType: 'contract',
      result: 'SUCCESS',
      classification: contract.classification || 'CONFIDENTIAL',
      details: {
        contractNumber: contract.contractNumber,
        supplierName: contract.supplierName,
        annualValue: contract.annualValue,
        sha256Seal: contract.cryptoIntegrityHash
      }
    });

    // Event bus notification
    kernelEventBus.publish('CONTRACT_CREATED', {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      supplierId: contract.supplierId,
      annualValue: contract.annualValue,
    }, {
      actor,
      entityId: contract.id,
      entityType: 'contract'
    });

    return contract;
  }

  /**
   * Handler: Submit contract to Legal Review
   */
  public async handleSubmitLegalReview(
    contractId: string,
    context?: any
  ): Promise<{ contractId: string; newState: ContractState }> {
    const actor = context?.actor || { id: 'usr-procurement', type: 'USER', name: 'Strategic Procurement Buyer', role: 'procurement_manager' };
    const tenantId = context?.tenant?.organizationId || 'org-global-ops';

    // Transition state machine
    const newState = contractStateMachine.transition(contractId, 'DRAFT', 'UNDER_LEGAL_REVIEW', {
      actorId: actor.id,
      actorRole: actor.role,
      tenantId
    });

    await this.auditEngine.record({
      actor,
      tenantId,
      action: 'SUBMIT_LEGAL_REVIEW',
      entityId: contractId,
      entityType: 'contract',
      result: 'SUCCESS',
      classification: 'CONFIDENTIAL',
      details: { contractId, newState }
    });

    kernelEventBus.publish('CONTRACT_STATE_CHANGED', {
      contractId,
      fromState: 'DRAFT',
      toState: newState
    }, {
      actor,
      entityId: contractId,
      entityType: 'contract'
    });

    return { contractId, newState };
  }

  /**
   * Handler: Request Executive Approval (Triggers Policy Engine)
   */
  public async handleRequestExecutiveApproval(
    contractId: string,
    justifiedNote: string,
    context?: any
  ): Promise<{ contractId: string; newState: ContractState }> {
    const actor = context?.actor || { id: 'usr-legal', type: 'USER', name: 'Senior Legal Counsel', role: 'legal_counsel' };
    const tenantId = context?.tenant?.organizationId || 'org-global-ops';

    const newState = contractStateMachine.transition(contractId, 'UNDER_LEGAL_REVIEW', 'PENDING_EXECUTIVE_APPROVAL', {
      actorId: actor.id,
      actorRole: actor.role,
      tenantId,
      metadata: { justifiedNote }
    });

    await this.auditEngine.record({
      actor,
      tenantId,
      action: 'REQUEST_EXECUTIVE_APPROVAL',
      entityId: contractId,
      entityType: 'contract',
      result: 'SUCCESS',
      classification: 'RESTRICTED',
      details: { contractId, newState, justifiedNote }
    });

    kernelEventBus.publish('CONTRACT_APPROVAL_REQUESTED', {
      contractId,
      requestedBy: actor.name,
      justifiedNote
    }, {
      actor,
      entityId: contractId,
      entityType: 'contract'
    });

    return { contractId, newState };
  }

  /**
   * Handler: Execute & Digitally Sign Contract
   */
  public async handleExecuteContract(
    contractId: string,
    signatoryName: string,
    context?: any
  ): Promise<{ contractId: string; newState: ContractState; timestamp: string }> {
    const actor = context?.actor || { id: 'usr-executive', type: 'USER', name: signatoryName || 'VP Operations', role: 'executive' };
    const tenantId = context?.tenant?.organizationId || 'org-global-ops';
    const timestamp = new Date().toISOString();

    const newState = contractStateMachine.transition(contractId, 'PENDING_EXECUTIVE_APPROVAL', 'ACTIVE', {
      actorId: actor.id,
      actorRole: actor.role,
      tenantId
    });

    await this.auditEngine.record({
      actor,
      tenantId,
      action: 'EXECUTE_CONTRACT',
      entityId: contractId,
      entityType: 'contract',
      result: 'SUCCESS',
      classification: 'RESTRICTED',
      details: { contractId, newState, signatoryName, timestamp }
    });

    kernelEventBus.publish('CONTRACT_EXECUTED', {
      contractId,
      signatoryName,
      executedAt: timestamp
    }, {
      actor,
      entityId: contractId,
      entityType: 'contract'
    });

    return { contractId, newState, timestamp };
  }

  /**
   * Handler: Award Sourcing RFQ Bid and draft contract
   */
  public async handleAwardRfq(
    rfqId: string,
    bidId: string,
    context?: any
  ): Promise<{ rfqId: string; bidId: string; generatedContractId: string }> {
    const actor = context?.actor || { id: 'usr-sourcing', type: 'USER', name: 'Strategic Sourcing Lead', role: 'procurement_manager' };
    const tenantId = context?.tenant?.organizationId || 'org-global-ops';
    const generatedContractId = `CNT-${Date.now().toString().slice(-4)}`;

    await this.auditEngine.record({
      actor,
      tenantId,
      action: 'AWARD_RFQ',
      entityId: rfqId,
      entityType: 'rfq',
      result: 'SUCCESS',
      classification: 'RESTRICTED',
      details: { rfqId, bidId, generatedContractId }
    });

    kernelEventBus.publish('RFQ_AWARDED', {
      rfqId,
      bidId,
      contractId: generatedContractId
    }, {
      actor,
      entityId: rfqId,
      entityType: 'rfq'
    });

    return { rfqId, bidId, generatedContractId };
  }

  /**
   * Evaluates a contract against real-time operational telemetry
   */
  public evaluateContractPerformance(
    contract: EnterpriseContract,
    supplierOtif: number = 95.0,
    supplierDefectRate: number = 1.0
  ): ContractEvaluationResult {
    const today = new Date();
    const endDate = new Date(contract.endDate);
    const msDiff = endDate.getTime() - today.getTime();
    const daysUntilExpiration = Math.ceil(msDiff / (1000 * 60 * 60 * 24));
    const isRenewalWindowOpen = daysUntilExpiration <= contract.renewalNoticeDays && daysUntilExpiration > 0;

    const otifGap = Math.round((supplierOtif - contract.agreedOtifTarget) * 10) / 10;
    const defectGap = Math.round((supplierDefectRate - contract.maxDefectRateAllowed) * 10) / 10;

    let slaBreachedCount = 0;
    let totalLiquidatedDamagesUsd = 0;

    contract.slaTargets.forEach(target => {
      if (target.metricKey === 'OTIF_PERCENT' && otifGap < 0) {
        slaBreachedCount++;
        const monthlySpend = contract.annualValue / 12;
        const damage = Math.round(monthlySpend * (target.penaltyRatePercent / 100) * Math.abs(otifGap / 2));
        totalLiquidatedDamagesUsd += damage;
      }
      if (target.metricKey === 'DEFECT_RATE_MAX' && defectGap > 0) {
        slaBreachedCount++;
        const monthlySpend = contract.annualValue / 12;
        const damage = Math.round(monthlySpend * (target.penaltyRatePercent / 100) * (defectGap * 2));
        totalLiquidatedDamagesUsd += damage;
      }
    });

    const recommendations: string[] = [];
    if (isRenewalWindowOpen) {
      recommendations.push(`Renewal notice period is active (${daysUntilExpiration} days remaining). Initiate commercial term renegotiations.`);
    }
    if (otifGap < -3.0) {
      recommendations.push(`Severe OTIF shortfall (${supplierOtif.toFixed(1)}% vs ${contract.agreedOtifTarget}% SLA). Trigger formal Cure Notice within 14 days.`);
    }
    if (contract.liabilityCapUsd < contract.annualValue) {
      recommendations.push(`Liability cap ($${(contract.liabilityCapUsd/1000).toFixed(0)}k) is lower than annual spend ($${(contract.annualValue/1000).toFixed(0)}k). Renegotiate higher indemnity protection.`);
    }
    if (contract.redlineFindings.some(f => f.status === 'PENDING' && f.riskSeverity === 'CRITICAL')) {
      recommendations.push(`Critical redline flags detected by Orion Neural Playbook. Legal resolution mandatory prior to renewal.`);
    }

    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      supplierId: contract.supplierId,
      supplierName: contract.supplierName,
      status: contract.contractState,
      daysUntilExpiration,
      isRenewalWindowOpen,
      otifGap,
      defectGap,
      totalLiquidatedDamagesUsd,
      slaBreachedCount,
      redlineAlertsCount: contract.redlineFindings.filter(f => f.status === 'PENDING').length,
      riskRating: slaBreachedCount > 0 || otifGap < -4 ? 'High' : isRenewalWindowOpen ? 'Moderate' : 'Low',
      executiveApprovalRequired: contract.annualValue > 100000 || contract.liabilityCapUsd > 1000000,
      recommendations: recommendations.length ? recommendations : ['Contract performance strictly adhering to agreed SLA benchmarks.']
    };
  }

  /**
   * Neural AI Redline Analyzer (Simulates Layer 2 Redline Engine)
   */
  public performAiRedlineAudit(contract: EnterpriseContract): AiRedlineFinding[] {
    const findings: AiRedlineFinding[] = [];

    // Check 1: Indemnification Scope
    if (contract.indemnificationScope === 'UNCAPPED' || contract.indemnificationScope === 'UNILATERAL_BUYER') {
      findings.push({
        id: `RED-${Date.now()}-01`,
        clauseCategory: 'LIABILITY',
        riskSeverity: 'HIGH',
        originalText: `Indemnification clause is designated as ${contract.indemnificationScope}.`,
        issueAnalysis: 'Asymmetric or uncapped indemnification exposes buyer balance sheet to catastrophic supplier operational errors.',
        proposedRevision: 'Mutual indemnification capped at 2.0x aggregate annual contract fees with carve-outs for willful misconduct and IP infringement.',
        status: 'PENDING'
      });
    }

    // Check 2: Force Majeure
    if (!contract.forceMajeureClause) {
      findings.push({
        id: `RED-${Date.now()}-02`,
        clauseCategory: 'FORCE_MAJEURE',
        riskSeverity: 'CRITICAL',
        originalText: 'No explicit bilateral Force Majeure provision detected.',
        issueAnalysis: 'Absence of force majeure creates acute breach vulnerability during regional pandemics, severe weather, or port closures.',
        proposedRevision: 'Add standard Orion-9 Bilateral Force Majeure clause providing 30-day suspension with mutual termination rights thereafter.',
        status: 'PENDING'
      });
    }

    // Check 3: Payment Terms
    if (contract.paymentTerms === 'NET_15' || contract.paymentTerms === 'IMMEDIATE') {
      findings.push({
        id: `RED-${Date.now()}-03`,
        clauseCategory: 'PAYMENT_TERMS',
        riskSeverity: 'MEDIUM',
        originalText: `Payment term specified as ${contract.paymentTerms}.`,
        issueAnalysis: 'Standard enterprise treasury policy requires minimum Net 45 or Net 60 to protect operational working capital.',
        proposedRevision: 'Revise payment terms to Net 60 or offer 2% discount for payment within 15 days (2/10 Net 30).',
        status: 'PENDING'
      });
    }

    return findings;
  }
}

export const contractService = ContractService.getInstance();
