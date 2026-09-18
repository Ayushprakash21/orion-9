/**
 * ORION-9 ENTERPRISE CONTRACT LIFECYCLE MANAGEMENT & SOURCING TYPES
 * Layer 4 Kernel & Layer 7 Data Fabric Canonical Models
 */

import { Contract } from '../types';

export type ContractState =
  | 'DRAFT'
  | 'UNDER_LEGAL_REVIEW'
  | 'PENDING_EXECUTIVE_APPROVAL'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'AMENDED'
  | 'EXPIRED'
  | 'TERMINATED';

export type IncotermCode = 'EXW' | 'FCA' | 'FOB' | 'CPT' | 'CIP' | 'DAP' | 'DPU' | 'DDP' | 'CIF' | 'CFR';

export type PaymentTermsCode = 'NET_15' | 'NET_30' | 'NET_60' | 'NET_90' | '2_10_NET_30' | 'IMMEDIATE';

export interface VolumeDiscountTier {
  minUnits: number;
  maxUnits?: number;
  unitPrice: number;
  discountPercent: number;
}

export interface SlaTarget {
  id: string;
  metricKey: 'OTIF_PERCENT' | 'DEFECT_RATE_MAX' | 'EXPEDITE_RESPONSE_HOURS' | 'AUDIT_COMPLIANCE';
  name: string;
  targetValue: number;
  unit: string;
  actualValue?: number;
  penaltyRatePercent: number; // liquidated damages % of monthly spend
  status: 'COMPLIANT' | 'WARNING' | 'BREACH';
  curePeriodDays: number;
}

export interface AiRedlineFinding {
  id: string;
  clauseCategory: 'LIABILITY' | 'FORCE_MAJEURE' | 'PAYMENT_TERMS' | 'INTELLECTUAL_PROPERTY' | 'TERMINATION' | 'ESG_COMPLIANCE';
  riskSeverity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  originalText: string;
  issueAnalysis: string;
  proposedRevision: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
}

export interface ContractClause {
  clauseNumber: string;
  title: string;
  category: string;
  body: string;
  isStandard: boolean;
  redlineFindingId?: string;
}

export interface EnterpriseContract extends Contract {
  version: string;
  contractState: ContractState;
  category: 'Raw Materials' | 'Semiconductors' | 'Logistics & 3PL' | 'Packaging' | 'Sub-Assembly' | 'Direct Procurement';
  currency: string;
  totalCommitmentValue: number;
  incoterm: IncotermCode;
  paymentTerms: PaymentTermsCode;
  governingLaw: string;
  liabilityCapUsd: number;
  indemnificationScope: 'MUTUAL' | 'UNILATERAL_BUYER' | 'UNILATERAL_SUPPLIER' | 'UNCAPPED';
  forceMajeureClause: boolean;
  volumeTiers: VolumeDiscountTier[];
  slaTargets: SlaTarget[];
  clauses: ContractClause[];
  redlineFindings: AiRedlineFinding[];
  cryptoIntegrityHash: string; // SHA-256 tamper-evident seal
  classification: 'CONFIDENTIAL' | 'RESTRICTED';
  sourceSystem: string;
  signatures: {
    buyerSigner?: string;
    buyerSignedAt?: string;
    supplierSigner?: string;
    supplierSignedAt?: string;
    approvalId?: string;
  };
}

export interface SourcingBid {
  id: string;
  supplierId: string;
  supplierName: string;
  unitPrice: number;
  leadTimeDays: number;
  moq: number;
  paymentTerms: string;
  incoterm: IncotermCode;
  esgScore: number;
  historicalOtif: number;
  calculatedScore: number; // 0-100 composite ranking
  awarded: boolean;
  complianceStatus: 'VERIFIED' | 'NEEDS_AUDIT';
  notes: string;
  submittedAt: string;
}

export interface SourcingRfq {
  id: string;
  rfqNumber: string;
  title: string;
  category: string;
  sku: string;
  targetUnits: number;
  targetBudgetUsd: number;
  currency: string;
  deadline: string;
  status: 'DRAFT' | 'OPEN' | 'EVALUATING' | 'AWARDED' | 'CANCELLED';
  bids: SourcingBid[];
  awardedContractId?: string;
  awardedSupplierId?: string;
  createdAt: string;
}
