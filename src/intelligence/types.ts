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
