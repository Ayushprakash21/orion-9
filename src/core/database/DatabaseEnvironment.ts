/**
 * ORION-9 DATABASE ENVIRONMENT ABSTRACTION
 * Defines the authoritative runtime database environments (LIVE vs DEMO),
 * configuration boundaries, cache namespaces, outbox isolation, and event contracts.
 */

export type DatabaseEnvironmentMode = 'LIVE' | 'DEMO';

export type DatabaseConnectionStatus =
  | 'CONNECTED'
  | 'DEGRADED'
  | 'DISCONNECTED'
  | 'AUTHENTICATION_REQUIRED'
  | 'PERMISSION_DENIED'
  | 'UNKNOWN';

export interface DatabaseEnvironmentConfig {
  environment: DatabaseEnvironmentMode;
  projectId: string;
  authDomain: string;
  databaseId: string;
  isEmulator: boolean;
  isProductionSafe: boolean;
  cachePrefix: string;
  description: string;
}

export const LIVE_DATABASE_CONFIG: DatabaseEnvironmentConfig = {
  environment: 'LIVE',
  projectId: 'orion9-dev-db-2026',
  authDomain: 'orion9-dev-db-2026.firebaseapp.com',
  databaseId: '(default)',
  isEmulator: false,
  isProductionSafe: true,
  cachePrefix: 'orion9:live',
  description: 'Authoritative Cloud Firestore Production Database',
};

export const DEMO_DATABASE_CONFIG: DatabaseEnvironmentConfig = {
  environment: 'DEMO',
  projectId: 'demo-orion9-db-2026',
  authDomain: 'demo-orion9-db-2026.firebaseapp.com',
  databaseId: '(default)',
  isEmulator: true,
  isProductionSafe: false,
  cachePrefix: 'orion9:demo',
  description: 'Isolated Synthetic Demonstration & Sandbox Database',
};

export interface DatabaseEnvironmentState {
  environment: DatabaseEnvironmentMode;
  config: DatabaseEnvironmentConfig;
  status: DatabaseConnectionStatus;
  activeTenantId: string;
  activeOrganizationId: string;
  activeListenersCount: number;
  lastVerifiedAt: string;
  measuredLatencyMs: number;
  lastError: string | null;
}

export interface EnvironmentSwitchRequest {
  targetEnvironment: DatabaseEnvironmentMode;
  actorUserId: string;
  actorRole: string;
  callerType: 'human_admin' | 'ai_agent' | 'system_job';
  stepUpConfirmed: boolean;
  confirmationPhrase?: string;
  reason?: string;
}

export interface EnvironmentSwitchResult {
  success: boolean;
  previousEnvironment: DatabaseEnvironmentMode;
  currentEnvironment: DatabaseEnvironmentMode;
  switchedAt: string;
  listenersRecreatedCount: number;
  cacheNamespace: string;
  error?: string;
}
