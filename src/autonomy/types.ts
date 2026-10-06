export type AutonomyLevel = 
  | 'LEVEL_0_OBSERVE'
  | 'LEVEL_1_RECOMMEND'
  | 'LEVEL_2_PREPARE'
  | 'LEVEL_3_APPROVAL_GATED'
  | 'LEVEL_4_GOVERNED_AUTONOMOUS'
  | 'LEVEL_5_PROHIBITED';

export type RiskClass = 'LOW' | 'MEDIUM' | 'MATERIAL' | 'HIGH' | 'CRITICAL';

export interface AutonomyScoreCard {
  riskScore: number; // 0 - 100
  financialExposure: number; // Amount in base currency
  reversibility: boolean;
  legalImpact: boolean;
  complianceImpact: boolean;
  safetyImpact: boolean;
  customerImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  supplierImpact: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  strategicImpact: boolean;
  confidence: number; // 0 - 1 (e.g. 0.95)
  policyClassification: string;
}

export interface AutonomyDecision {
  decisionId: string;
  missionId?: string;
  agentId: string;
  actionType: string;
  scoreCard: AutonomyScoreCard;
  calculatedAutonomyLevel: AutonomyLevel;
  requiresHumanApproval: boolean;
  approvalReason?: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'EXECUTING' | 'COMPLETED' | 'FAILED' | 'ROLLED_BACK';
  createdAt: string;
  tenantId: string;
}

export interface AutonomyThresholdConfig {
  tenantId: string;
  currency: string;
  maxAutonomousFinancialLimit: number; // e.g. $50,000
  autoApproveReplenishment: boolean;
  autoApproveStockTransfers: boolean;
  autoApproveRerouting: boolean;
  autoApproveReminders: boolean;
  escalationTimeoutMinutes: number; // Default 15 mins
  secondaryApproverRole: string;
  safeFallbackAction: 'PAUSE' | 'ROLLBACK' | 'DEFAULT_ROUTING';
}

export type MissionStatus = 
  | 'MISSION_CREATED'
  | 'MISSION_ANALYZING'
  | 'MISSION_SIMULATING'
  | 'MISSION_OPTIMIZING'
  | 'MISSION_APPROVAL_REQUIRED'
  | 'MISSION_EXECUTING'
  | 'MISSION_VERIFYING'
  | 'MISSION_COMPLETED'
  | 'MISSION_FAILED'
  | 'MISSION_ROLLED_BACK';

export interface AutonomousMission {
  missionId: string;
  tenantId: string;
  title: string;
  objective: string;
  category: 'INVENTORY' | 'LOGISTICS' | 'PROCUREMENT' | 'QUALITY' | 'MANUFACTURING' | 'FINANCE' | 'NETWORK';
  status: MissionStatus;
  targetKpi: string;
  targetValue: number;
  currentValue: number;
  assignedAgentId: string;
  actionIds: string[];
  decisionTraceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ApprovalRequest {
  approvalId: string;
  decisionId: string;
  missionId?: string;
  tenantId: string;
  actionType: string;
  why: string;
  impactSummary: string;
  financialCost: number;
  riskScore: number;
  confidence: number;
  currentState: Record<string, any>;
  proposedState: Record<string, any>;
  alternatives: { option: string; cost: number; risk: string }[];
  expectedBenefit: string;
  reversibility: boolean;
  policyReference: string;
  aiReasoningSummary: string;
  digitalTwinResult: { serviceLevelImpact: string; marginImpact: string; riskVariance: string };
  primaryApproverRole: string;
  secondaryApproverRole?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ALTERNATIVE_REQUESTED' | 'DELEGATED' | 'ESCALATED' | 'TIMED_OUT';
  createdAt: string;
  updatedAt: string;
  escalatesAt: string;
}

export interface DecisionTraceRecord {
  decisionId: string;
  missionId?: string;
  agentId: string;
  modelId: string;
  inputs: Record<string, any>;
  signalsUsed: string[];
  toolsUsed: string[];
  optionsEvaluated: any[];
  selectedOption: any;
  confidence: number;
  riskScore: number;
  expectedOutcome: Record<string, any>;
  actualOutcome?: Record<string, any>;
  variance?: number;
  lessonLearned?: string;
  timestamp: string;
}
