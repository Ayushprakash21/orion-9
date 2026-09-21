/**
 * ORION-9 INTELLIGENCE LAYER — CORE CONTRACTS & SCHEMAS
 * Layer 2: Centralized AI Architecture, Operating Modes, Agent Manifests,
 * Tool Registry, and Governance Guardrails.
 */

import { RoleCode, PermissionCode } from '../types/auth';
import { DataClassification, PolicyEvaluationResult } from '../kernel/types';

/**
 * 6 AI OPERATING MODES as defined by the Architectural Constitution
 */
export type AIOperatingMode =
  | 'OBSERVE'             // Mode 1: AI can analyze authorized data
  | 'ASSIST'              // Mode 2: AI can prepare drafts
  | 'RECOMMEND'           // Mode 3: AI recommends an action
  | 'APPROVAL_GATED'      // Mode 4: AI prepares the action and stops for human approval
  | 'GOVERNED_AUTOMATION' // Mode 5: AI/system can execute explicitly authorized low-risk actions
  | 'PROHIBITED';         // Mode 6: AI cannot perform the action

/**
 * Risk classification for AI tools and operations
 */
export type AIRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

/**
 * Schema for an AI Tool registered in the system
 */
export interface AIToolDefinition {
  toolId: string;
  name: string;
  description: string;
  category: 'READ' | 'ANALYSIS' | 'SIMULATION' | 'DRAFT' | 'MUTATION';
  riskTier: AIRiskTier;
  operatingMode: AIOperatingMode;
  requiredPermission?: PermissionCode | string;
  requiredRole?: RoleCode | string;
  parameters: {
    type: 'object';
    properties: Record<string, {
      type: string;
      description: string;
      required?: boolean;
      enum?: string[];
    }>;
    required: string[];
  };
  approvalRequired: boolean;
  handler: (params: any, context: AIInvocationContext) => Promise<any>;
}

/**
 * Invocation context passed to every AI operation
 */
export interface AIInvocationContext {
  caller: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM';
    name?: string;
    role?: RoleCode | string;
  };
  tenant: {
    organizationId: string;
    organizationName?: string;
  };
  agentId?: string;
  correlationId: string;
  causationId?: string;
  dataClassificationLimit?: DataClassification;
}

/**
 * Formal AI Agent Manifest
 */
export interface AIAgentManifest {
  agentId: string;
  name: string;
  purpose: string;
  domain:
    | 'PROCUREMENT'
    | 'SUPPLIER'
    | 'DEMAND'
    | 'PLANNING'
    | 'INVENTORY'
    | 'WAREHOUSE'
    | 'LOGISTICS'
    | 'QUALITY'
    | 'FINANCE'
    | 'RISK'
    | 'EXCEPTION'
    | 'INTEGRATION'
    | 'GOVERNANCE';
  version: string;
  defaultMode: AIOperatingMode;
  readScope: string[];
  writeScope: string[];
  allowedTools: string[];
  permissions: (PermissionCode | string)[];
  monetaryLimit?: number;
  approvalRequirements: {
    alwaysRequireApproval: boolean;
    monetaryThreshold?: number;
    riskScoreThreshold?: number;
    requiresRoles?: (RoleCode | string)[];
  };
  escalationRules: {
    criticalThreshold: number;
    escalateTo: 'supply_chain_manager' | 'organization_admin' | 'platform_admin';
  };
  auditIdentity: {
    id: string;
    model: string;
    provider: 'Google Gemini' | 'Orion Deterministic Fallback';
  };
  status: 'ACTIVE' | 'SUSPENDED' | 'DISABLED';
}

/**
 * AI Action Request entering the AI Action Pipeline
 */
export interface AIActionRequest {
  requestId: string;
  agentId: string;
  toolId: string;
  parameters: any;
  context: AIInvocationContext;
  estimatedMonetaryImpact?: number;
  entityType?: string;
  entityId?: string;
}

/**
 * AI Action Pipeline Execution Outcome
 */
export interface AIActionResponse {
  requestId: string;
  correlationId: string;
  agentId: string;
  toolId: string;
  status: 'EXECUTED' | 'HALTED_AWAITING_APPROVAL' | 'BLOCKED' | 'FAILED';
  result?: any;
  policyOutcome: PolicyEvaluationResult;
  requiresApproval: boolean;
  approvalId?: string;
  reason?: string;
  auditId?: string;
  timestamp: string;
}

/**
 * Comprehensive Decision Record for Learning and Outcome Tracking
 */
export interface DecisionRecord {
  decisionId: string;
  correlationId: string;
  agentId?: string;
  timestamp: string;
  problem: string;
  context: {
    entityType: string;
    entityId: string;
    tenantId: string;
    metrics: Record<string, any>;
  };
  evidence: {
    sources: string[];
    datapoints: Record<string, any>;
    groundingLevel: 'KNOWN' | 'CALCULATED' | 'INFERRED';
  };
  alternatives: Array<{
    id: string;
    name: string;
    description: string;
    pros: string[];
    cons: string[];
    estimatedCost?: number;
    estimatedRiskScore?: number;
  }>;
  recommendation: {
    optionId: string;
    rationale: string;
    confidence: number;
  };
  policy: {
    evaluatedRules: string[];
    result: PolicyEvaluationResult;
  };
  approval?: {
    required: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approvedBy?: string;
    approvedAt?: string;
    comments?: string;
  };
  action?: {
    actionType: string;
    executedAt?: string;
    status: 'PENDING' | 'EXECUTED' | 'FAILED';
  };
  expectedResult: {
    kpiTarget: string;
    projectedDelta: number;
    horizonDays: number;
  };
  actualResult?: {
    recordedAt: string;
    actualDelta: number;
    variancePercent: number;
  };
  outcomeEvaluation?: {
    status: 'SUCCESS' | 'SUB_OPTIMAL' | 'FAILURE' | 'PENDING_EVALUATION';
    varianceExplanation?: string;
    learningSignal?: string;
  };
}

// ============================================================================
// WAVE 6 — CONTROL TOWER INTELLIGENCE & DECISION ENGINE DOMAIN CONTRACTS
// ============================================================================

/**
 * 13 Canonical SCM Signal Types
 */
export type SignalType =
  | 'LOW_INVENTORY'
  | 'STOCKOUT_RISK'
  | 'SUPPLIER_DELAY'
  | 'SHIPMENT_DELAY'
  | 'ETA_DEVIATION'
  | 'PO_CONFIRMATION_DELAY'
  | 'QUALITY_DETERIORATION'
  | 'DEMAND_SPIKE'
  | 'DEMAND_DROP'
  | 'CAPACITY_SHORTAGE'
  | 'SERVICE_RISK'
  | 'COST_SPIKE'
  | 'LEAD_TIME_INCREASE';

export type SignalSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type SignalDetectionMethod =
  | 'THRESHOLD'
  | 'DEVIATION'
  | 'TREND'
  | 'DEADLINE_BREACH'
  | 'PATTERN'
  | 'DEPENDENCY_PROPAGATION';

export interface Signal {
  signalId: string;
  tenantId: string;
  signalType: SignalType;
  entityType: string;
  entityId: string;
  detectedAt: string;
  severity: SignalSeverity;
  confidence: number; // 0.0 to 1.0 numeric calibrated
  confidenceBasis: 'DETERMINISTIC' | 'CALCULATED' | 'INFERRED';
  threshold?: number;
  actualValue?: number | string;
  expectedValue?: number | string;
  evidence: string[];
  correlationId?: string;
  status: 'ACTIVE' | 'RESOLVED' | 'SUPPRESSED';
  detectionMethod: SignalDetectionMethod;
}

/**
 * 9 Standard Exception Lifecycle Statuses
 */
export type ExceptionStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'ACTION_PROPOSED'
  | 'PENDING_APPROVAL'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED'
  | 'SUPPRESSED';

export type ExceptionCategory =
  | 'INVENTORY'
  | 'PROCUREMENT'
  | 'LOGISTICS'
  | 'QUALITY'
  | 'SUPPLIER'
  | 'FINANCIAL'
  | 'SERVICE';

export interface ExceptionIntelligence {
  exceptionId: string;
  tenantId: string;
  type: string;
  category: ExceptionCategory;
  severity: SignalSeverity;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ExceptionStatus;
  owner?: string;
  entityReferences: Array<{ entityType: string; entityId: string }>;
  businessImpact: string;
  financialImpact: number;
  customerImpact: string;
  serviceImpact: string;
  detectedAt: string;
  dueAt?: string;
  rootCauseStatus: 'UNKNOWN' | 'ANALYZING' | 'IDENTIFIED' | 'CONFIRMED';
  recommendedAction?: string;
  riskScore: number; // 0 to 100
  confidence: number; // 0.0 to 1.0
  correlationId: string;
  signalIds: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * 4 Root Cause Classifications (Evidence-backed)
 */
export type RootCauseClassification =
  | 'OBSERVED_FACT'
  | 'DERIVED_INFERENCE'
  | 'AI_HYPOTHESIS'
  | 'CONFIRMED_ROOT_CAUSE';

export interface RootCauseNode {
  nodeId: string;
  entityType: string;
  entityId: string;
  label: string;
  status: string;
  evidence: string;
  causalityRole: 'ROOT_CAUSE' | 'CONTRIBUTING_FACTOR' | 'DOWNSTREAM_IMPACT' | 'MITIGATION';
  classification: RootCauseClassification;
}

export interface RootCause {
  rootCauseId: string;
  tenantId: string;
  exceptionId: string;
  classification: RootCauseClassification;
  primaryCauseNodeId: string;
  summary: string;
  causalityChain: RootCauseNode[];
  confidenceScore: number; // 0 to 100
  evidenceReferences: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Supply Chain Risk Graph
 */
export type RiskNodeType =
  | 'SUPPLIER'
  | 'MATERIAL'
  | 'PRODUCT'
  | 'INVENTORY'
  | 'PO'
  | 'SHIPMENT'
  | 'WAREHOUSE'
  | 'CUSTOMER_ORDER';

export interface RiskNode {
  nodeId: string;
  tenantId: string;
  type: RiskNodeType;
  entityId: string;
  label: string;
  baseRiskScore: number; // 0 to 100
  propagatedRiskScore: number; // 0 to 100
  status: string;
  metadata?: Record<string, any>;
  lastUpdated: string;
}

export interface RiskEdge {
  edgeId: string;
  tenantId: string;
  fromNodeId: string;
  toNodeId: string;
  relationship: string;
  weight: number; // 0.0 to 1.0
  riskTransmissionFactor: number; // 0.0 to 1.0
}

export interface SupplyChainRiskGraphState {
  tenantId: string;
  nodes: RiskNode[];
  edges: RiskEdge[];
  lastCalculatedAt: string;
}

/**
 * Calibrated Prediction Engine
 */
export type PredictionType =
  | 'STOCKOUT_PROBABILITY'
  | 'SHIPMENT_DELAY_PROBABILITY'
  | 'PO_LATE_CONFIRMATION_PROBABILITY'
  | 'SUPPLIER_DELIVERY_RISK'
  | 'CUSTOMER_SERVICE_RISK'
  | 'INVENTORY_SHORTAGE_RISK'
  | 'ETA_DEVIATION'
  | 'EXCEPTION_BREACH_PROBABILITY';

export interface Prediction {
  predictionId: string;
  tenantId: string;
  modelVersion: string;
  entityType: string;
  entityId: string;
  predictionType: PredictionType;
  predictedValue: number | string;
  probability: number; // 0.0 <= probability <= 1.0
  confidence: number; // 0.0 <= confidence <= 1.0
  horizon: string;
  evidence: string[];
  modelStatus: 'RULE_BASED' | 'SIMULATION' | 'REAL_MODEL';
  createdAt: string;
  expiresAt: string;
}

/**
 * Decision Options & Multi-Dimensional Evaluation
 */
export type DecisionActionType =
  | 'EXPEDITE_SHIPMENT'
  | 'REROUTE_SHIPMENT'
  | 'USE_ALTERNATE_INVENTORY'
  | 'RESCHEDULE_CUSTOMER_COMMITMENT'
  | 'SPLIT_SHIPMENT'
  | 'EXPEDITE_PO'
  | 'TRANSFER_INVENTORY'
  | 'TRIGGER_SUPPLIER_OUTREACH'
  | 'DO_NOTHING';

export interface DecisionOption {
  optionId: string;
  decisionId: string;
  actionType: DecisionActionType;
  description: string;
  expectedCost: number;
  expectedServiceImpact: string;
  expectedRisk: string;
  expectedBenefit: string;
  constraints: string[];
  policyImpact: string;
  requiredApproval: boolean;
  confidence: number; // 0.0 to 1.0
  evidence: string[];
  score: number; // 0 to 100
  parameters?: Record<string, any>;
}

export interface DecisionEvaluation {
  evaluationId: string;
  decisionId: string;
  optionId: string;
  cost: number;
  serviceLevelDaysProtected: number;
  customerImpactScore: number; // 0 to 100
  inventoryImpactUnits: number;
  supplierImpactScore: number; // 0 to 100
  operationalRiskScore: number; // 0 to 100
  financialExposureDelta: number;
  leadTimeDeltaDays: number;
  policyCompliance: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
  executionComplexity: 'LOW' | 'MEDIUM' | 'HIGH';
  compositeScore: number; // 0 to 100
  tradeOffExplanation: string;
}

/**
 * Structured Recommendation
 */
export interface Recommendation {
  recommendationId: string;
  decisionId: string;
  tenantId: string;
  recommendedOptionId: string;
  recommendedOption: DecisionOption;
  alternatives: DecisionOption[];
  rationale: string;
  evidenceReferences: string[];
  confidence: number;
  policyReferences: string[];
  riskAssessment: string;
  approvalRequirement: {
    required: boolean;
    reason?: string;
    requiredRoles?: string[];
  };
  createdBy: {
    id: string;
    type: 'USER' | 'AI_AGENT' | 'SYSTEM';
    name: string;
  };
  createdAt: string;
  status: 'PROPOSED' | 'ACCEPTED' | 'REJECTED' | 'SUPERSEDED';
}

/**
 * Governed Decision Entity
 */
export interface DecisionIntelligence {
  decisionId: string;
  tenantId: string;
  exceptionId: string;
  correlationId: string;
  title: string;
  issue: string;
  severity: SignalSeverity;
  status:
    | 'DETECTED'
    | 'EVALUATING'
    | 'READY_FOR_REVIEW'
    | 'PENDING_APPROVAL'
    | 'APPROVED'
    | 'EXECUTING'
    | 'EXECUTED'
    | 'REJECTED'
    | 'CLOSED';
  options: DecisionOption[];
  evaluations: DecisionEvaluation[];
  recommendedOptionId: string;
  recommendation: Recommendation;
  approvalId?: string;
  commandId?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Deterministic Decision Replay
 */
export interface DecisionReplay {
  replayId: string;
  tenantId: string;
  decisionId: string;
  snapshotTimestamp: string;
  eventSnapshot?: any;
  signalSnapshot?: Signal;
  exceptionSnapshot?: ExceptionIntelligence;
  contextSnapshot: Record<string, any>;
  rootCauseSnapshot?: RootCause;
  predictionSnapshot?: Prediction;
  optionsSnapshot: DecisionOption[];
  evaluationSnapshot: DecisionEvaluation[];
  recommendationSnapshot: Recommendation;
  approvalSnapshot?: any;
  commandSnapshot?: any;
  executionSnapshot?: any;
  outcomeSnapshot?: any;
  createdAt: string;
}

/**
 * Empirical Outcome Variance Tracking
 */
export interface OutcomeVariance {
  varianceId: string;
  tenantId: string;
  decisionId: string;
  predictedOutcome: Record<string, any>;
  actualOutcome: Record<string, any>;
  predictionVariance: number;
  decisionVariance: string;
  expectedCost: number;
  actualCost: number;
  costVariance: number;
  expectedServiceImpact: string;
  actualServiceImpact: string;
  serviceVariance: number;
  expectedDelayDays: number;
  actualDelayDays: number;
  delayVariance: number;
  executionVariance: 'ON_TRACK' | 'DEVIATED' | 'FAILED';
  calculatedAt: string;
}

/**
 * Explainable Priority Assessment
 */
export interface PriorityAssessment {
  entityType: string;
  entityId: string;
  tenantId: string;
  priorityScore: number; // 0 to 100
  priorityTier: 'P1' | 'P2' | 'P3' | 'P4';
  factors: {
    businessImpact: number;
    urgency: number;
    financialExposure: number;
    customerImpact: number;
    supplyRisk: number;
    confidence: number;
    timeToBreachDays: number;
    dependencyCount: number;
  };
  explanation: string;
  assessedAt: string;
}

