/**
 * ORION-9 SCM CONTROL TOWER — DOMAIN TYPES & CONTRACTS
 * Layer 7: Operational intelligence, SLA governance, multi-domain observability,
 * and unified exception-to-action workbench.
 */

import { Signal, ExceptionIntelligence, RootCause, Prediction, DecisionOption, Recommendation } from '../../intelligence/types';
import { AuthorizationActor } from '../../kernel/authorization/AuthorizationEngine';

export type ControlTowerDomain =
  | 'executive'
  | 'supply'
  | 'demand'
  | 'inventory'
  | 'procurement'
  | 'suppliers'
  | 'orders'
  | 'logistics'
  | 'warehouses'
  | 'quality'
  | 'finance'
  | 'exceptions'
  | 'risks'
  | 'predictions'
  | 'decisions'
  | 'scenarios'
  | 'outcomes';

export type KpiStatus = 'ON_TARGET' | 'WATCH' | 'CRITICAL';
export type KpiTrend = 'IMPROVING' | 'DEGRADING' | 'STABLE';

export interface GovernedKpiRecord {
  kpiId: string;
  tenantId: string;
  domain: ControlTowerDomain;
  name: string;
  code: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  status: KpiStatus;
  trend: KpiTrend;
  formulaDescription: string;
  calculatedAt: string;
  entityCount: number;
  metadata?: Record<string, any>;
}

export type SlaStatus = 'COMPLIANT' | 'WARNING' | 'BREACHED';

export interface SlaMonitorRecord {
  slaId: string;
  tenantId: string;
  name: string;
  domain: ControlTowerDomain;
  entityType: string;
  targetDurationMinutes: number;
  warningThresholdMinutes: number;
  activeBreachCount: number;
  evaluatedCount: number;
  status: SlaStatus;
  lastEvaluatedAt: string;
  breachedEntityIds: string[];
}

export interface DomainHealthSummary {
  domain: ControlTowerDomain;
  score: number; // 0 - 100
  status: 'Healthy' | 'Watch' | 'Critical';
  trend: string;
  activeItemCount: number;
  primaryRisk?: string;
  kpis: GovernedKpiRecord[];
}

export interface OperationalSnapshot {
  snapshotId: string;
  tenantId: string;
  timestamp: string;
  healthScore: number;
  executiveSummary: {
    overallStatus: 'Healthy' | 'Watch' | 'Critical';
    activeExceptionsCount: number;
    criticalRisksCount: number;
    pendingDecisionsCount: number;
    totalCapitalAtRisk: number;
    slaBreachCount: number;
  };
  domainSummaries: Record<ControlTowerDomain, DomainHealthSummary>;
  recentSignals: Signal[];
  topExceptions: ExceptionIntelligence[];
}

export type ExceptionWorkbenchActionType =
  | 'ACKNOWLEDGE'
  | 'INVESTIGATE'
  | 'ASSIGN'
  | 'CREATE_PROPOSAL'
  | 'REQUEST_APPROVAL'
  | 'EXECUTE_GOVERNED_ACTION'
  | 'RESOLVE'
  | 'CLOSE';

export type ExceptionWorkbenchStatus =
  | 'OPEN'
  | 'ACKNOWLEDGED'
  | 'INVESTIGATING'
  | 'PROPOSAL_PENDING'
  | 'APPROVAL_PENDING'
  | 'ACTION_EXECUTING'
  | 'RESOLVED'
  | 'CLOSED';

export interface ExceptionWorkbenchItem {
  id: string;
  tenantId: string;
  exceptionId: string;
  domain: ControlTowerDomain;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: ExceptionWorkbenchStatus;
  assignedTo?: string;
  slaDeadline: string;
  slaMinutesRemaining: number;
  isBreached: boolean;
  capitalAtRisk: number;
  signals: Signal[];
  rootCause?: RootCause;
  predictions: Prediction[];
  decisionOptions: DecisionOption[];
  recommendedOptionId?: string;
  governedActionPayload?: {
    commandType: string;
    targetAggregateId: string;
    targetAggregateType: string;
    parameters: Record<string, any>;
  };
  approvalId?: string;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  actionExecutedAt?: string;
  executionResult?: {
    success: boolean;
    transactionId?: string;
    auditLogId?: string;
    message?: string;
  };
  history: Array<{
    action: ExceptionWorkbenchActionType;
    actor: AuthorizationActor;
    timestamp: string;
    notes?: string;
  }>;
  createdAt: string;
  updatedAt: string;
}
