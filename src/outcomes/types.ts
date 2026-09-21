/**
 * ORION-9 WAVE 9: CLOSED-LOOP OUTCOME INTELLIGENCE + ENTERPRISE LEARNING + PRODUCTION CONTROL PLANE
 * Domain Types and Entity Interfaces
 * 
 * Non-negotiable architectural tenet:
 * "Orion may learn from outcomes. Orion may NOT silently change its own governance."
 */

export type OutcomeStatus = 
  | 'PENDING_OBSERVATION'
  | 'OBSERVED'
  | 'EVALUATED'
  | 'ARCHIVED';

export type VarianceSeverity = 
  | 'NEGLIGIBLE'
  | 'MODERATE'
  | 'SIGNIFICANT'
  | 'CRITICAL';

export type DirectionalBias = 
  | 'OVER_PROJECTED'
  | 'UNDER_PROJECTED'
  | 'ACCURATE';

export type AttributionCategory = 
  | 'MODEL_INACCURACY'
  | 'EXTERNAL_MARKET_SHOCK'
  | 'SUPPLIER_EXECUTION_FAILURE'
  | 'INTERNAL_OPERATIONAL_DELAY'
  | 'DEMAND_SPIKE'
  | 'WEATHER_OR_FORCE_MAJEURE'
  | 'INSUFFICIENT_DATA';

export type EvidenceConfidence = 
  | 'OBSERVED_FACT'
  | 'DERIVED_INFERENCE'
  | 'AI_HYPOTHESIS'
  | 'CONFIRMED_ROOT_CAUSE';

export type DecisionEffectivenessClass = 
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'NO_EFFECT'
  | 'NEGATIVE_OUTCOME'
  | 'INCONCLUSIVE';

export type LearningSignalStatus = 
  | 'DETECTED'
  | 'REVIEW_REQUIRED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'IMPLEMENTED'
  | 'EXPIRED';

export type ProposalType = 
  | 'POLICY_THRESHOLD_UPDATE'
  | 'SAFETY_STOCK_PARAMETER_UPDATE'
  | 'SUPPLIER_LEAD_TIME_ADJUSTMENT'
  | 'MODEL_WEIGHT_TUNING'
  | 'WORKFLOW_TRIGGER_CALIBRATION';

export type ProposalStatus = 
  | 'DRAFT'
  | 'SIMULATED'
  | 'PENDING_APPROVAL'
  | 'APPROVED'
  | 'REJECTED'
  | 'DEPLOYED'
  | 'ROLLED_BACK';

export type DriftState = 
  | 'NORMAL'
  | 'WATCH'
  | 'DRIFT'
  | 'CRITICAL_DRIFT';

export type VersionStatus = 
  | 'ACTIVE'
  | 'CHALLENGER'
  | 'RETIRED'
  | 'ROLLED_BACK';

/**
 * Baseline expected metrics registered at decision / workflow execution time
 */
export interface OutcomeExpectation {
  expectationId: string;
  tenantId: string;
  decisionId?: string;
  workflowInstanceId?: string;
  scenarioId?: string;
  actionId?: string;
  expectedCostSavings: number;
  expectedOTIF: number; // 0 - 100 percentage
  expectedTransitTimeDays: number;
  expectedInventoryDays: number;
  expectedCO2ReductionKg?: number;
  confidenceInterval: {
    p10: number;
    p50: number;
    p90: number;
  };
  timeHorizonHours: number;
  createdAt: string;
  immutableHash: string;
}

/**
 * Raw ground truth observation ingested from enterprise integration points
 */
export interface OutcomeObservation {
  observationId: string;
  tenantId: string;
  expectationId: string;
  sourceSystem: 'SAP_ERP' | 'ORACLE_TMS' | 'MANHATTAN_WMS' | 'EDI_214' | 'GRN_PORTAL' | 'IOT_TELEMETRY' | 'CARRIER_API';
  actualCost: number;
  actualOTIF: number; // 0 - 100 percentage
  actualTransitTimeDays: number;
  actualInventoryDays: number;
  actualCO2ReductionKg?: number;
  evidenceReference: string; // e.g., BOL-9942, GRN-8821, INV-4491
  observedAt: string;
  recordedBy: string;
  rawPayloadHash: string;
}

/**
 * Calculated variance between expectation and actual observation
 */
export interface OutcomeVariance {
  varianceId: string;
  tenantId: string;
  expectationId: string;
  observationId: string;
  costDelta: number; // actual - expected
  costVariancePct: number;
  otifDelta: number; // actual - expected
  otifVariancePct: number;
  transitTimeDeltaDays: number;
  inventoryDaysDelta: number;
  compositeVariancePct: number;
  directionalBias: DirectionalBias;
  severity: VarianceSeverity;
  thresholdBreached: boolean;
  calculatedAt: string;
}

/**
 * Root cause attribution record decomposing why variance occurred
 */
export interface OutcomeAttribution {
  attributionId: string;
  tenantId: string;
  varianceId: string;
  primaryCategory: AttributionCategory;
  confidence: EvidenceConfidence;
  contributingFactors: Array<{
    factor: string;
    impactPercentage: number;
    evidenceSource: string;
  }>;
  aiHypothesisText?: string;
  confirmedByHuman?: string;
  attributedAt: string;
}

/**
 * Comprehensive outcome evaluation record linking expectation, observation, variance & attribution
 */
export interface OutcomeRecord {
  outcomeId: string;
  tenantId: string;
  expectationId: string;
  observationId?: string;
  varianceId?: string;
  attributionId?: string;
  status: OutcomeStatus;
  decisionQualityScore: number; // 0 - 100
  effectivenessClass: DecisionEffectivenessClass;
  roiRealized: number;
  verifiedAt?: string;
  isImmutable: boolean;
}

/**
 * Systematic pattern signal detected across multiple outcome variances
 */
export interface OutcomeLearningSignal {
  signalId: string;
  tenantId: string;
  metric: string; // e.g. "LEAD_TIME_UNDERESTIMATION", "CONTAINER_COST_ESCALATION"
  driftMagnitudePct: number;
  sampleSize: number;
  firstObservedAt: string;
  lastObservedAt: string;
  status: LearningSignalStatus;
  recommendedAction: string;
  detectedBy: string;
  resolvedAt?: string;
}

/**
 * Formally governed proposal to adapt model parameters or policy thresholds
 */
export interface ImprovementProposal {
  proposalId: string;
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
  simulationRunId?: string;
  status: ProposalStatus;
  createdBy: string;
  createdAt: string;
  governanceReview?: {
    reviewedBy: string;
    reviewedAt: string;
    action: 'APPROVED' | 'REJECTED';
    justification: string;
  };
  rollbackPlan: {
    targetVersion: string;
    automatedSteps: string[];
    safeFallbackParameters: Record<string, any>;
  };
  deployedAt?: string;
}

/**
 * Versioned snapshot of production intelligence configuration
 */
export interface IntelligenceVersion {
  versionId: string; // e.g., "v1.2.0"
  tenantId: string;
  status: VersionStatus;
  parameters: Record<string, any>;
  policyThresholds: Record<string, any>;
  promotedFromProposalId?: string;
  checksum: string;
  promotedBy: string;
  promotedAt: string;
  retiredAt?: string;
  rollbackTargetVersion?: string;
}

/**
 * Challenger / Shadow mode evaluation metrics
 */
export interface ChallengerComparison {
  challengerRunId: string;
  tenantId: string;
  championVersion: string;
  challengerVersion: string;
  timeWindowStart: string;
  timeWindowEnd: string;
  championMetrics: {
    accuracyPct: number;
    meanVariancePct: number;
    simulatedCost: number;
  };
  challengerMetrics: {
    accuracyPct: number;
    meanVariancePct: number;
    simulatedCost: number;
  };
  recommendation: 'PROMOTE' | 'RETAIN_CHAMPION' | 'EXTEND_EVALUATION';
  confidenceScore: number;
}

/**
 * Continuous concept & data drift telemetry signal
 */
export interface DriftSignal {
  driftId: string;
  tenantId: string;
  featureName: string; // e.g. "supplier_lead_time_days", "port_dwell_time"
  baselineDistributionMean: number;
  currentDistributionMean: number;
  divergenceScore: number; // Wasserstein or KL-divergence metric
  driftState: DriftState;
  threshold: number;
  detectedAt: string;
}

/**
 * Controlled tenant-scoped A/B or multi-arm experiment record
 */
export interface ExperimentRecord {
  experimentId: string;
  tenantId: string;
  name: string;
  hypothesis: string;
  variantA: Record<string, any>; // control
  variantB: Record<string, any>; // candidate
  trafficAllocationPct: number; // e.g., 10%
  maxSpendLimit: number;
  active: boolean;
  startDate: string;
  endDate?: string;
  results?: {
    variantAAccuracy: number;
    variantBAccuracy: number;
    winner: 'VARIANT_A' | 'VARIANT_B' | 'INCONCLUSIVE';
  };
}

/**
 * Decision Trace Node for the Closed-Loop Provenance Graph
 */
export interface DecisionTraceNode {
  nodeId: string;
  nodeType: 
    | 'EVENT'
    | 'SIGNAL'
    | 'EXCEPTION'
    | 'ROOT_CAUSE'
    | 'RISK'
    | 'SCENARIO'
    | 'DECISION'
    | 'WORKFLOW'
    | 'ACTION'
    | 'EXPECTATION'
    | 'OBSERVATION'
    | 'VARIANCE'
    | 'ATTRIBUTION'
    | 'LEARNING_SIGNAL'
    | 'PROPOSAL'
    | 'VERSION';
  referenceId: string;
  timestamp: string;
  summary: string;
  tenantId: string;
  metadata?: Record<string, any>;
}
