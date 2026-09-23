/**
 * ORION-9 ENTERPRISE SCM: CONTRACT LIFECYCLE & SLA ENGINE
 * Governed Supplier Agreements, Volume Tier Pricing, SLA Adherence & Spend Tracking
 */

import {
  EnterpriseContractRecord,
  ContractPricingTier,
  ContractSLARule,
  ContractLifecycleStatus
} from './types';
import { kernelAuditEngine } from '../kernel/AuditEngine';
import { observabilityService } from '../operations/ObservabilityService';

export class ContractLifecycleEngine {
  private static instance: ContractLifecycleEngine;

  private contracts: Map<string, EnterpriseContractRecord> = new Map();

  private constructor() {
    this.seedDefaultData();
  }

  public static getInstance(): ContractLifecycleEngine {
    if (!ContractLifecycleEngine.instance) {
      ContractLifecycleEngine.instance = new ContractLifecycleEngine();
    }
    return ContractLifecycleEngine.instance;
  }

  private seedDefaultData(): void {
    const defaultTenant = 'demo-tenant';
    const sampleContract: EnterpriseContractRecord = {
      contractId: 'cntr-master-semicon-01',
      tenantId: defaultTenant,
      contractNumber: 'AGR-2026-9901',
      title: 'Master Semiconductor & Tensor Core Procurement Agreement',
      supplierId: 'supp-quantum-semi',
      supplierName: 'Quantum Silicon Microelectronics Inc.',
      effectiveDate: '2026-01-01',
      expirationDate: '2027-12-31',
      renewalTerms: 'Automatic 12-month extension unless 60-day notice provided',
      totalCommittedValue: 5000000,
      actualSpentValue: 1250000,
      currency: 'USD',
      paymentTerms: 'NET_45',
      incoterms: 'DDP',
      status: 'ACTIVE',
      version: 1,
      pricingTiers: {
        'prod-chip-gpu': [
          { minQuantity: 1, maxQuantity: 99, unitPrice: 950 },
          { minQuantity: 100, maxQuantity: 499, unitPrice: 900 },
          { minQuantity: 500, unitPrice: 850, rebatePercent: 2.5 }
        ]
      },
      slaRules: [
        { metric: 'ON_TIME_DELIVERY', targetPercent: 98, penaltyPerBreachPercent: 1.5 },
        { metric: 'DEFECT_RATE', targetPercent: 0.1, penaltyPerBreachPercent: 3.0 }
      ],
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z'
    };

    this.contracts.set(sampleContract.contractId, sampleContract);
  }

  // ── CONTRACT LIFECYCLE ─────────────────────────────────────────────────────

  public createContractDraft(params: {
    tenantId: string;
    title: string;
    supplierId: string;
    supplierName: string;
    effectiveDate: string;
    expirationDate: string;
    totalCommittedValue: number;
    currency: string;
    paymentTerms: string;
    incoterms: string;
    pricingTiers: Record<string, ContractPricingTier[]>;
    slaRules: ContractSLARule[];
    creator: string;
  }): EnterpriseContractRecord {
    const contractId = `cntr-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const contractNumber = `AGR-${Date.now().toString().slice(-6)}`;

    const record: EnterpriseContractRecord = {
      contractId,
      tenantId: params.tenantId,
      contractNumber,
      title: params.title,
      supplierId: params.supplierId,
      supplierName: params.supplierName,
      effectiveDate: params.effectiveDate,
      expirationDate: params.expirationDate,
      totalCommittedValue: params.totalCommittedValue,
      actualSpentValue: 0,
      currency: params.currency,
      paymentTerms: params.paymentTerms,
      incoterms: params.incoterms,
      status: 'DRAFT',
      pricingTiers: params.pricingTiers,
      slaRules: params.slaRules,
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.contracts.set(contractId, record);

    kernelAuditEngine.record({
      action: 'CREATE_CONTRACT_DRAFT',
      actor: { id: params.creator, type: 'USER', name: params.creator },
      entityId: contractId,
      entityType: 'CONTRACT',
      classification: 'CONFIDENTIAL',
      details: { contractNumber, supplier: params.supplierName, committedValue: params.totalCommittedValue }
    });

    return record;
  }

  public approveContract(contractId: string, tenantId: string, approver: string): EnterpriseContractRecord {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error(`Contract [${contractId}] not found`);
    }

    contract.status = 'ACTIVE';
    contract.approvalId = `appr-${Date.now().toString(36)}`;
    contract.updatedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'APPROVE_CONTRACT',
      actor: { id: approver, type: 'USER', name: approver },
      entityId: contractId,
      entityType: 'CONTRACT',
      classification: 'CONFIDENTIAL',
      details: { contractNumber: contract.contractNumber, approver, status: contract.status }
    });

    observabilityService.log('INFO', `Contract ${contract.contractNumber} activated for supplier ${contract.supplierName}`, {
      tenantId,
      context: { contractId, committedValue: contract.totalCommittedValue }
    });

    return contract;
  }

  // ── PRICING TIER & SPEND TRACKING ──────────────────────────────────────────

  public getApplicablePrice(contractId: string, productId: string, quantity: number): number | undefined {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.status !== 'ACTIVE') return undefined;

    const tiers = contract.pricingTiers[productId];
    if (!tiers || tiers.length === 0) return undefined;

    const matchedTier = tiers.find(t => {
      const minMatch = quantity >= t.minQuantity;
      const maxMatch = t.maxQuantity === undefined || quantity <= t.maxQuantity;
      return minMatch && maxMatch;
    });

    return matchedTier ? matchedTier.unitPrice : tiers[0].unitPrice;
  }

  public recordContractSpend(contractId: string, tenantId: string, spendAmount: number, poId: string): EnterpriseContractRecord {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error(`Contract [${contractId}] not found`);
    }

    contract.actualSpentValue += spendAmount;
    contract.updatedAt = new Date().toISOString();

    kernelAuditEngine.record({
      action: 'RECORD_CONTRACT_SPEND',
      actor: { id: 'procurement_engine', type: 'SYSTEM', name: 'Procurement Engine' },
      entityId: contractId,
      entityType: 'CONTRACT',
      classification: 'CONFIDENTIAL',
      details: { contractNumber: contract.contractNumber, poId, spendAmount, totalSpent: contract.actualSpentValue }
    });

    return contract;
  }

  // ── SLA EVALUATION & PENALTY ───────────────────────────────────────────────

  public evaluateContractSLA(contractId: string, tenantId: string, actualMetrics: { metric: 'ON_TIME_DELIVERY' | 'DEFECT_RATE' | 'FILL_RATE'; actualPercent: number }[]): { totalPenaltyPercent: number; breaches: string[] } {
    const contract = this.contracts.get(contractId);
    if (!contract || contract.tenantId !== tenantId) {
      throw new Error(`Contract [${contractId}] not found`);
    }

    let totalPenalty = 0;
    const breaches: string[] = [];

    for (const rule of contract.slaRules) {
      const metric = actualMetrics.find(m => m.metric === rule.metric);
      if (metric) {
        let isBreached = false;
        if (rule.metric === 'DEFECT_RATE') {
          isBreached = metric.actualPercent > rule.targetPercent;
        } else {
          isBreached = metric.actualPercent < rule.targetPercent;
        }

        if (isBreached) {
          totalPenalty += rule.penaltyPerBreachPercent;
          breaches.push(`SLA Rule [${rule.metric}] breached: Actual ${metric.actualPercent}% vs Target ${rule.targetPercent}%. Penalty applied: ${rule.penaltyPerBreachPercent}%`);
        }
      }
    }

    return {
      totalPenaltyPercent: totalPenalty,
      breaches
    };
  }

  public listContracts(tenantId?: string): EnterpriseContractRecord[] {
    const list = Array.from(this.contracts.values());
    if (!tenantId || tenantId === 'GLOBAL') return list;
    return list.filter(c => c.tenantId === tenantId);
  }
}

export const contractLifecycleEngine = ContractLifecycleEngine.getInstance();
