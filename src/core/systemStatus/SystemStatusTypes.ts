/**
 * ORION-9 UNIFIED SYSTEM STATUS & RUNTIME HEALTH FABRIC
 * Canonical types, status models, and thresholds for enterprise telemetry.
 */

export type OverallSystemStatus = 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'OFFLINE' | 'UNKNOWN';

export type SubsystemHealthStatus = 'HEALTHY' | 'DEGRADED' | 'ERROR' | 'OFFLINE' | 'UNKNOWN';

export type ListenerHealthStatus = 'LOADING' | 'CONNECTED' | 'EMPTY' | 'STALE' | 'ERROR' | 'OFFLINE';

export type FreshnessStatus = 'FRESH' | 'AGING' | 'STALE' | 'UNKNOWN';

export type GraphHealthStatus = 'READY' | 'EMPTY' | 'STALE' | 'ERROR' | 'UNKNOWN';

export type AutomationOperatingMode = 'MANUAL' | 'COPILOT' | 'AUTOPILOT';

export interface BaseSubsystemStatus {
  status: string;
  message: string;
  lastCheckedAt: number | null;
  lastHealthyAt: number | null;
  latencyMs?: number;
  errorCode?: string;
  errorMessage?: string;
  environment: 'DEMO' | 'LIVE';
  source: string;
}

export type AuthSubsystemState =
  | 'AUTHENTICATED'
  | 'AUTHENTICATION_REQUIRED'
  | 'AUTHENTICATION_ERROR'
  | 'TENANT_UNRESOLVED'
  | 'RBAC_UNRESOLVED'
  | 'PRIVILEGED_SESSION_REQUIRED'
  | 'SESSION_EXPIRED';

export interface RuntimeSubsystemStatus extends BaseSubsystemStatus {
  status: SubsystemHealthStatus;
  applicationInitialized: boolean;
  kernelInitialized: boolean;
  authInitialized: boolean;
  isOnline: boolean;
  authState?: AuthSubsystemState;
}

export interface SchedulerSubsystemStatus extends BaseSubsystemStatus {
  status: SubsystemHealthStatus;
  configured: boolean;
  enabled: boolean;
  schedulerMode: string;
  lastScheduledHour: string | null;
  lastSuccessfulRun: string | null;
  lastFailedExecution?: string | null;
  nextScheduledRun: string | null;
  totalBatchesCompleted: number;
  totalPackagesGenerated: number;
  consecutiveFailures: number;
  isStale: boolean;
  executionDurationMs?: number;
}

export interface FirestoreSubsystemStatus extends BaseSubsystemStatus {
  status: SubsystemHealthStatus;
  configured: boolean;
  initialized: boolean;
  authenticated: boolean;
  connectionStatus: string;
  activeListenersCount: number;
}

export interface ListenerSubsystemStatus extends BaseSubsystemStatus {
  status: ListenerHealthStatus;
  domain: string;
  recordCount: number;
  lastSnapshotAt: number | null;
  lastSuccessfulUpdateAt: number | null;
  tenantId: string;
  isStale: boolean;
  subscriptionState?: string;
}

export interface FreshnessSubsystemStatus {
  status: FreshnessStatus;
  domain: string;
  ageMs: number | null;
  lastUpdatedAt: number | null;
  thresholdFreshMs: number;
  thresholdAgingMs: number;
  message: string;
}

export interface GraphSubsystemStatus extends BaseSubsystemStatus {
  status: GraphHealthStatus;
  graphsInitialized: boolean;
  sourceStateAvailable: boolean;
  seriesCount: number;
  lastSeriesUpdateAt: number | null;
  isStale: boolean;
}

export interface AutomationSubsystemStatus extends BaseSubsystemStatus {
  status: SubsystemHealthStatus;
  mode: AutomationOperatingMode;
  initialized: boolean;
  enabled: boolean;
  totalTriggered: number;
  totalCompleted: number;
  totalFailed: number;
  pendingApprovalsCount: number;
  dlqCount: number;
  consecutiveFailures: number;
  lastExecutionAt: number | null;
}

export interface GovernanceSubsystemStatus extends BaseSubsystemStatus {
  status: GovernanceHealthStatus;
  authoritativeStoreAvailable: boolean;
  lastSuccessfulLoadAt: number | null;
  lastPolicyUpdateAt: number | null;
  cacheState: 'EMPTY' | 'WARM' | 'STALE' | 'BYPASSED';
  activePoliciesCount: number;
}

export type GovernanceHealthStatus =
  | 'GOVERNANCE_HEALTHY'
  | 'GOVERNANCE_DEGRADED'
  | 'GOVERNANCE_UNAVAILABLE'
  | 'GOVERNANCE_ERROR'
  | 'GOVERNANCE_UNKNOWN';

export interface IncidentSubsystemStatus extends BaseSubsystemStatus {
  status: IncidentHealthStatus;
  incidentStoreAvailable: boolean;
  activeIncidentCount: number;
  incidentListenerState: 'ACTIVE' | 'IDLE' | 'UNINITIALIZED' | 'ERROR';
  incidentTimelineHealth: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  lastIncidentAt: number | null;
}

export type IncidentHealthStatus =
  | 'INCIDENT_HEALTHY'
  | 'INCIDENT_DEGRADED'
  | 'INCIDENT_UNAVAILABLE'
  | 'INCIDENT_ERROR';

export interface BackupSubsystemStatus extends BaseSubsystemStatus {
  status: BackupHealthStatus;
  backupProviderAvailable: boolean;
  backupProviderConfigured: boolean;
  providerType: string;
  lastSuccessfulBackup: string | null;
  backupVerificationState: 'VERIFIED' | 'FAILED' | 'PENDING' | 'UNVERIFIED' | 'NOT_CONFIGURED';
  retentionProtectionState: 'IMMUTABLE' | 'RETENTION_PROTECTED' | 'STANDARD' | 'UNKNOWN';
  restoreDrillState: 'VERIFIED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
  lastRestoreVerification: string | null;
}

export type BackupHealthStatus =
  | 'BACKUP_HEALTHY'
  | 'BACKUP_DEGRADED'
  | 'BACKUP_UNAVAILABLE'
  | 'BACKUP_NOT_CONFIGURED'
  | 'BACKUP_ERROR';

export interface SystemStatusSnapshot {
  overallStatus: OverallSystemStatus;
  generatedAt: number;
  environment: 'DEMO' | 'LIVE';
  tenantId: string;
  organizationId?: string;
  runtime: RuntimeSubsystemStatus;
  scheduler: SchedulerSubsystemStatus;
  firestore: FirestoreSubsystemStatus;
  listeners: {
    inventory: ListenerSubsystemStatus;
    purchaseOrders: ListenerSubsystemStatus;
    shipments: ListenerSubsystemStatus;
    exceptions: ListenerSubsystemStatus;
    controlTower: ListenerSubsystemStatus;
  };
  freshness: {
    inventory: FreshnessSubsystemStatus;
    purchaseOrders: FreshnessSubsystemStatus;
    shipments: FreshnessSubsystemStatus;
    exceptions: FreshnessSubsystemStatus;
    controlTower: FreshnessSubsystemStatus;
  };
  graphs: GraphSubsystemStatus;
  automation: AutomationSubsystemStatus;
  governance?: GovernanceSubsystemStatus;
  incidents?: IncidentSubsystemStatus;
  backup?: BackupSubsystemStatus;
}

/**
 * Standardized Centralized Freshness Thresholds
 */
export const FRESHNESS_THRESHOLDS = {
  FRESH_MAX_MS: 120_000,   // 2 minutes
  AGING_MAX_MS: 600_000,   // 10 minutes
  SCHEDULER_STALE_MS: 7_200_000, // 2 hours
};
