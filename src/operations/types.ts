/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE + RESILIENCE + OPERATIONS HARDENING
 * Core Domain Types and Data Contracts
 */

// ============================================================================
// 1. Environment & Configuration Governance
// ============================================================================

export type RuntimeEnvironment = 'DEVELOPMENT' | 'TEST' | 'STAGING' | 'PRODUCTION';

export type ConfigCategory = 
  | 'SYSTEM'
  | 'SECURITY'
  | 'AI'
  | 'INTEGRATION'
  | 'WORKFLOW'
  | 'NOTIFICATION'
  | 'OBSERVABILITY'
  | 'PERFORMANCE'
  | 'FEATURE'
  | 'TENANT';

export interface SystemConfig {
  key: string;
  category: ConfigCategory;
  value: any;
  defaultValue: any;
  description: string;
  isSecret: boolean;
  requiresRestart: boolean;
  isHotReloadable: boolean;
  schema?: Record<string, any>;
  tenantId?: string;
  environment?: RuntimeEnvironment;
  updatedAt: string;
  updatedBy: string;
  version: number;
}

export interface ConfigVersion {
  versionId: string;
  tenantId: string;
  environment: RuntimeEnvironment;
  category: ConfigCategory;
  parameters: Record<string, any>;
  checksum: string;
  createdBy: string;
  createdAt: string;
  reason: string;
  parentVersionId?: string;
  isApproved: boolean;
  approvedBy?: string;
  approvedAt?: string;
}

export type SecretProvider = 
  | 'GOOGLE_SECRET_MANAGER'
  | 'HASHICORP_VAULT'
  | 'AWS_SECRETS_MANAGER'
  | 'CLOUDFLARE_SECRETS'
  | 'ENVIRONMENT_VARIABLE';

export interface SecretReference {
  secretId: string;
  provider: SecretProvider;
  referenceKey: string;
  version?: string;
  isRedacted: boolean;
  maskedValue: string; // e.g., '********'
  lastRotatedAt?: string;
  expiresAt?: string;
}

// ============================================================================
// 2. Feature Flags & Rollout Governance
// ============================================================================

export interface FeatureFlag {
  key: string;
  description: string;
  enabled: boolean;
  rolloutPercentage: number; // 0 to 100
  targetedTenants: string[];
  targetedEnvironments: RuntimeEnvironment[];
  targetedRoles?: string[];
  emergencyKillSwitch: boolean;
  lastUpdated: string;
  updatedBy: string;
}

// ============================================================================
// 3. Health, Diagnostics & Probes
// ============================================================================

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'UNKNOWN';

export interface ComponentHealth {
  componentName: string;
  status: HealthStatus;
  latencyMs: number;
  lastCheckedAt: string;
  message?: string;
  details?: Record<string, any>;
}

export interface SystemHealthReport {
  overallStatus: HealthStatus;
  timestamp: string;
  environment: RuntimeEnvironment;
  components: Record<string, ComponentHealth>;
  readinessProbe: boolean;
  livenessProbe: boolean;
  startupProbe: boolean;
  version: string;
}

// ============================================================================
// 4. Observability, Telemetry & Distributed Tracing
// ============================================================================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL';

export interface StructuredLogRecord {
  id: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  tenantId: string;
  context?: Record<string, any>;
  traceId?: string;
  spanId?: string;
  causationId?: string;
  correlationId?: string;
  redacted: boolean;
}

export type MetricType = 'COUNTER' | 'GAUGE' | 'HISTOGRAM';

export interface MetricRecord {
  name: string;
  type: MetricType;
  value: number;
  tags: Record<string, string>;
  timestamp: string;
}

export interface TraceSpan {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  tags: Record<string, string>;
  events: Array<{ name: string; timestamp: number; attributes?: Record<string, any> }>;
}

// ============================================================================
// 5. Incident Management & Alerts
// ============================================================================

export type IncidentSeverity = 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4';

export type IncidentStatus = 
  | 'DETECTED'
  | 'INVESTIGATING'
  | 'MITIGATED'
  | 'RESOLVED'
  | 'CLOSED';

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  description: string;
  actor: string;
  actionTaken?: string;
  statusChange?: IncidentStatus;
}

export interface IncidentRecord {
  id: string;
  tenantId: string;
  title: string;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  impactedTenants: string[];
  impactedModules: string[];
  blastRadiusScore: number; // 0 to 100
  rootCause?: string;
  declaredBy: string;
  declaredAt: string;
  mitigatedAt?: string;
  resolvedAt?: string;
  timeline: IncidentTimelineEvent[];
}

export interface SystemAlert {
  id: string;
  tenantId: string;
  ruleId: string;
  title: string;
  message: string;
  severity: IncidentSeverity;
  source: string;
  triggeredAt: string;
  deduplicationKey: string;
  suppressed: boolean;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

// ============================================================================
// 6. Durable Job Queue & Distributed Runtime
// ============================================================================

export type JobState = 
  | 'CREATED'
  | 'SCHEDULED'
  | 'RUNNING'
  | 'SUCCEEDED'
  | 'FAILED'
  | 'RETRYING'
  | 'DEAD_LETTERED';

export interface RuntimeJob<T = any> {
  id: string;
  jobType: string;
  idempotencyKey: string;
  tenantId: string;
  state: JobState;
  payload: T;
  retryCount: number;
  maxRetries: number;
  backoffDelayMs: number;
  leaseToken?: string;
  leaseExpiresAt?: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  result?: any;
}

// ============================================================================
// 7. Backup, Recovery & Disaster Recovery
// ============================================================================

export interface BackupPlan {
  id: string;
  tenantId: string;
  name: string;
  schedule: string; // cron expression
  collectionsIncluded: string[];
  retentionDays: number;
  lastBackupAt?: string;
  status: 'ACTIVE' | 'PAUSED' | 'FAILED';
}

export interface BackupSnapshot {
  id: string;
  tenantId: string;
  planId?: string;
  createdAt: string;
  createdBy: string;
  collections: Record<string, number>; // collectionName -> docCount
  totalRecordCount: number;
  sizeBytes: number;
  checksumSha256: string;
  verifiedIntegrity: boolean;
  storageUri: string;
}

export interface RestoreVerification {
  snapshotId: string;
  verifiedAt: string;
  recordCountMatches: boolean;
  checksumMatches: boolean;
  targetTenantId: string;
  dryRunSimulationPassed: boolean;
  discrepancies: string[];
}

export interface DisasterRecoveryTier {
  tier: 0 | 1 | 2 | 3;
  name: string;
  services: string[];
  targetRpoMinutes: number;
  targetRtoMinutes: number;
  verifiedInTesting: boolean;
  verificationNotes: string;
}

// ============================================================================
// 8. Data Integrity & Consistency
// ============================================================================

export type IntegrityCheckType = 
  | 'ORPHAN_LINE_ITEMS'
  | 'BROKEN_FOREIGN_KEYS'
  | 'NEGATIVE_INVENTORY'
  | 'TWIN_ERP_DESYNCHRONIZATION'
  | 'DUPLICATE_IDEMPOTENCY_KEYS'
  | 'INVALID_STATUS_TRANSITION';

export type IntegritySeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface IntegrityFinding {
  id: string;
  tenantId: string;
  checkType: IntegrityCheckType;
  severity: IntegritySeverity;
  entityType: string;
  entityId: string;
  description: string;
  detectedAt: string;
  suggestedRemediation: string;
  resolved: boolean;
  resolvedAt?: string;
  resolvedBy?: string;
}

// ============================================================================
// 9. Release Management & Deployment Safety
// ============================================================================

export type ReleaseStage = 
  | 'DRAFT'
  | 'PREFLIGHT_PENDING'
  | 'VERIFIED'
  | 'CANARY'
  | 'PROMOTED'
  | 'ROLLED_BACK';

export interface ReleaseGate {
  gateId: string;
  name: string;
  passed: boolean;
  checkedAt: string;
  evidence: string;
}

export interface ReleaseRecord {
  id: string;
  version: string;
  commitSha: string;
  deployedAt: string;
  deployedBy: string;
  stage: ReleaseStage;
  gates: ReleaseGate[];
  rollbackTargetVersion?: string;
  notes: string;
}

// ============================================================================
// 10. Production Safety Controls & Backpressure
// ============================================================================

export interface ProductionSafetyControls {
  tenantId: string;
  maintenanceMode: boolean;
  productionWriteLock: boolean;
  aiActionKillSwitch: boolean;
  autonomousWorkflowKillSwitch: boolean;
  readOnlyMode: boolean;
  updatedAt: string;
  updatedBy: string;
  reason?: string;
}

export type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

export interface CircuitBreakerStatus {
  serviceName: string;
  state: CircuitBreakerState;
  failureCount: number;
  threshold: number;
  lastFailureTime?: number;
  resetTimeoutMs: number;
}

// ============================================================================
// 11. Track 10: Resilience, Disaster Recovery & Business Continuity
// ============================================================================

export type FailureDomain = 
  | 'PROCESS'
  | 'SERVICE'
  | 'NODE_RUNTIME'
  | 'REGION'
  | 'DATABASE'
  | 'STORAGE'
  | 'NETWORK'
  | 'EXTERNAL_SYSTEM'
  | 'EVENT_FABRIC'
  | 'WORKFLOW'
  | 'CONFIGURATION'
  | 'SECURITY'
  | 'HUMAN_OPERATION';

export type FailureClass = 
  | 'TRANSIENT'
  | 'RETRYABLE'
  | 'NON_RETRYABLE'
  | 'DEPENDENCY_FAILURE'
  | 'DATA_CORRUPTION'
  | 'SECURITY_FAILURE'
  | 'CONFIGURATION_FAILURE'
  | 'REGIONAL_FAILURE'
  | 'UNKNOWN';

export type RecoveryDecisionAction = 
  | 'FAIL_CLOSED'
  | 'QUARANTINE_AND_RECONCILE'
  | 'CIRCUIT_TRIP'
  | 'REGIONAL_FAILOVER'
  | 'DLQ_REDRIVE'
  | 'WORKFLOW_RESUME'
  | 'RETRY_WITH_BACKOFF'
  | 'NO_ACTION';

export interface FailureClassificationResult {
  failureDomain: FailureDomain;
  failureClass: FailureClass;
  isRetryable: boolean;
  requiresQuarantine: boolean;
  requiresFailover: boolean;
  recommendedAction: RecoveryDecisionAction;
  reason: string;
}

export interface RecoveryDecision {
  id: string;
  tenantId: string;
  failureDomain: FailureDomain;
  failureClass: FailureClass;
  action: RecoveryDecisionAction;
  targetComponent: string;
  reason: string;
  fencingToken?: number;
  generationId?: number;
  dataResidencyVerified: boolean;
  isSimulated: boolean;
  initiatedBy: string;
  timestamp: string;
  status: 'PROPOSED' | 'APPROVED' | 'EXECUTING' | 'COMPLETED' | 'REJECTED' | 'FAILED';
}

export interface QuarantineRecord {
  id: string;
  tenantId: string;
  entityType: string;
  entityId: string;
  reason: string;
  quarantinedAt: string;
  quarantinedBy: string;
  status: 'QUARANTINED' | 'UNDER_INVESTIGATION' | 'RECONCILED' | 'RELEASED' | 'PURGED';
  payload: Record<string, any>;
  reconciliationNotes?: string;
  reconciledAt?: string;
  reconciledBy?: string;
}

export type RunbookScenario = 
  | 'FIRESTORE_OUTAGE'
  | 'EVENT_FABRIC_OUTAGE'
  | 'WORKFLOW_OUTAGE'
  | 'INTEGRATION_OUTAGE'
  | 'REGIONAL_OUTAGE'
  | 'STORAGE_OUTAGE'
  | 'AI_OUTAGE'
  | 'KNOWLEDGE_OUTAGE'
  | 'CONFIGURATION_FAILURE'
  | 'DATA_CORRUPTION'
  | 'DLQ_STORM'
  | 'CONSUMER_LAG'
  | 'CERTIFICATE_FAILURE'
  | 'MAINTENANCE_MODE';

export interface RunbookStep {
  stepNumber: number;
  phase: 'DETECTION' | 'IMPACT' | 'CONTAINMENT' | 'RECOVERY' | 'VALIDATION' | 'RECONCILIATION' | 'RESUME' | 'ROLLBACK' | 'CLOSURE';
  title: string;
  instructions: string;
  automatedCheck?: string;
  requiresApproval: boolean;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface RunbookExecution {
  id: string;
  tenantId: string;
  scenario: RunbookScenario;
  title: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'ABORTED' | 'ROLLED_BACK';
  initiatedBy: string;
  startedAt: string;
  completedAt?: string;
  steps: RunbookStep[];
  incidentId?: string;
}

export interface AIRecoveryRecommendation {
  id: string;
  tenantId: string;
  incidentId?: string;
  observedPattern: string; // OBSERVED
  inferredRootCause: string; // INFERRED
  recommendedAction: RecoveryDecisionAction; // RECOMMENDED
  confidenceScore: number; // 0.0 to 1.0
  riskAssessment: string;
  requiresHumanApproval: boolean; // Always true for critical actions
  selfApprovalBlocked: boolean; // Always true
  timestamp: string;
}

export interface MeasuredRpoRtoStatus {
  serviceName: string;
  tier: 0 | 1 | 2 | 3;
  targetRpoMinutes: number;
  measuredRpoMinutes: number;
  targetRtoMinutes: number;
  measuredRtoMinutes: number;
  rpoSlaMet: boolean;
  rtoSlaMet: boolean;
  lastVerifiedAt: string;
  verificationMode: 'SIMULATED_DRILL' | 'EMULATOR_TEST' | 'LIVE_TELEMETRY' | 'UNVERIFIED';
}

