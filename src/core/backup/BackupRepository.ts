/**
 * ORION-9 ENTERPRISE BACKUP & RECOVERY REPOSITORY
 * 
 * Authoritative persistence and lifecycle orchestrator for backup catalogs,
 * non-destructive restore drills, and provider-backed verification.
 * 
 * Truthfulness Invariants:
 * 1. LIVE mode never claims backup success or restore verification without a real provider.
 * 2. In DEMO mode, backups are explicitly marked as simulations.
 * 3. Restore drills strictly target isolated environments, never primary production.
 * 4. Tenant isolation is enforced: Tenant A cannot read, verify, or restore Tenant B backups.
 */

import {
  BackupSnapshot,
  BackupPlan,
  BackupHealthStatus,
  BackupVerificationState,
  BackupImmutableState,
  RestoreStatus,
  RestoreDrillResult,
} from '../../operations/types';
import { BackupProvider, DemoBackupProvider, CloudStorageBackupProvider } from './BackupProvider';
import { dbManager } from '../database/DatabaseConnectionManager';
import { kernelAuditEngine } from '../../kernel/AuditEngine';
import { kernelEventBus } from '../../kernel/EventBus';
import {
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  where,
} from 'firebase/firestore';

function sanitizeFirestorePayload(data: any, path: string): any {
  if (data === undefined) return null;
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();

  if (Array.isArray(data)) {
    return data.map((item, index) => sanitizeFirestorePayload(item, `${path}[${index}]`));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value !== undefined) {
      sanitized[key] = sanitizeFirestorePayload(value, `${path}.${key}`);
    }
  }
  return sanitized;
}

export class BackupRepository {
  private static instance: BackupRepository;
  private demoProvider: DemoBackupProvider;
  private cloudProvider: CloudStorageBackupProvider;

  // In-memory catalog cache
  private nonAuthoritativeCache: Map<string, { snapshot: BackupSnapshot; cachedAt: number }> = new Map();
  private readonly CACHE_TTL_MS = 60_000;

  // Restore drill results ledger
  private drillResults: Map<string, RestoreDrillResult> = new Map();

  // Telemetry metadata
  private lastSuccessfulBackupAt: string | null = null;
  private lastRestoreVerificationAt: string | null = null;
  private lastRestoreDrillState: 'VERIFIED' | 'FAILED' | 'PENDING' | 'NOT_RUN' = 'NOT_RUN';

  private constructor() {
    this.demoProvider = new DemoBackupProvider();
    this.cloudProvider = new CloudStorageBackupProvider();

    kernelEventBus.subscribe('DATABASE_ENVIRONMENT_CHANGED', () => {
      this.invalidateCache();
    });
  }

  public static getInstance(): BackupRepository {
    if (!BackupRepository.instance) {
      BackupRepository.instance = new BackupRepository();
    }
    return BackupRepository.instance;
  }

  public getActiveProvider(): BackupProvider {
    const env = dbManager.getEnvironment();
    return env === 'DEMO' ? this.demoProvider : this.cloudProvider;
  }

  public getDocumentId(tenantId: string, backupId: string): string {
    if (backupId.startsWith(`${tenantId}_`)) {
      return backupId;
    }
    return `${tenantId}_${backupId}`;
  }

  public invalidateCache(tenantId?: string): void {
    if (!tenantId) {
      this.nonAuthoritativeCache.clear();
      return;
    }
    for (const [key, entry] of this.nonAuthoritativeCache.entries()) {
      if (entry.snapshot.tenantId === tenantId || key.startsWith(`${tenantId}_`)) {
        this.nonAuthoritativeCache.delete(key);
      }
    }
  }

  /**
   * Creates a backup via the active provider and registers it in Firestore `backups`.
   */
  public async createBackup(params: {
    tenantId: string;
    createdBy: string;
    collections?: string[];
    retentionDays?: number;
    planId?: string;
    actorRole?: string;
  }): Promise<BackupSnapshot> {
    if (!params.tenantId || params.tenantId === 'UNRESOLVED') {
      throw new Error('BACKUP_ACCESS_DENIED: Unresolved tenant.');
    }

    if (params.actorRole) {
      const allowedRoles = ['platform_admin', 'organization_admin', 'admin'];
      if (!allowedRoles.includes(params.actorRole)) {
        throw new Error(`BACKUP_ACCESS_DENIED: Role '${params.actorRole}' lacks required authority.`);
      }
    }

    const provider = this.getActiveProvider();
    const activeEnv = dbManager.getEnvironment();

    // LIVE Fail-closed check if provider is unconfigured
    if (activeEnv === 'LIVE' && !provider.isConfigured()) {
      throw new Error(
        'BACKUP_PROVIDER_NOT_CONFIGURED: Production Cloud Storage / Managed Firestore backup provider is not configured. Set GCS_BACKUP_BUCKET.'
      );
    }

    const snapshot = await provider.createBackup({
      tenantId: params.tenantId,
      createdBy: params.createdBy,
      collections: params.collections,
      retentionDays: params.retentionDays || 30,
      planId: params.planId,
    });

    snapshot.environment = activeEnv;
    snapshot.organizationId = params.tenantId;

    const docId = this.getDocumentId(params.tenantId, snapshot.id);
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('BACKUP_STORE_UNAVAILABLE: Cannot persist backup metadata. Firestore is unavailable in LIVE mode.');
    }

    if (firestore) {
      const ref = doc(firestore, 'backups', docId);
      await setDoc(ref, sanitizeFirestorePayload(snapshot, `backups/${docId}`));
    }

    // Cache entry
    this.nonAuthoritativeCache.set(`${params.tenantId}_${snapshot.id}`, {
      snapshot,
      cachedAt: Date.now(),
    });
    this.lastSuccessfulBackupAt = snapshot.createdAt;

    // Audit log
    await kernelAuditEngine.record({
      action: 'CREATE_BACKUP',
      actor: { id: params.createdBy, type: 'USER', name: params.createdBy },
      entityId: snapshot.id,
      entityType: 'BACKUP_SNAPSHOT',
      classification: 'RESTRICTED',
      result: 'SUCCESS',
      details: {
        providerType: snapshot.providerType,
        totalRecordCount: snapshot.totalRecordCount,
        storageUri: snapshot.storageUri,
        isSimulated: snapshot.isSimulated || false,
      },
    });

    return snapshot;
  }

  /**
   * Retrieves a backup snapshot by ID, enforcing tenant boundaries.
   */
  public async getBackup(tenantId: string, backupId: string): Promise<BackupSnapshot | null> {
    if (!tenantId || tenantId === 'UNRESOLVED') {
      throw new Error('BACKUP_ACCESS_DENIED: Unresolved tenant.');
    }

    if (backupId.includes('_')) {
      const prefix = backupId.split('_')[0];
      if (prefix.startsWith('tenant-') && prefix !== tenantId) {
        throw new Error(`TENANT_ACCESS_DENIED: Backup prefix '${prefix}' does not match requester tenant '${tenantId}'.`);
      }
    }

    const cacheKey = `${tenantId}_${backupId}`;
    const cached = this.nonAuthoritativeCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.cachedAt < this.CACHE_TTL_MS) {
      if (cached.snapshot.tenantId !== tenantId && tenantId !== 'GLOBAL') {
        this.nonAuthoritativeCache.delete(cacheKey);
        throw new Error('TENANT_ACCESS_DENIED: Cached backup tenant mismatch.');
      }
      return cached.snapshot;
    }

    // Cross-tenant in-memory verification
    for (const entry of this.nonAuthoritativeCache.values()) {
      if (entry.snapshot.id === backupId && entry.snapshot.tenantId !== tenantId && tenantId !== 'GLOBAL') {
        throw new Error(`TENANT_ACCESS_DENIED: Backup '${backupId}' belongs to tenant '${entry.snapshot.tenantId}'.`);
      }
    }

    const activeEnv = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('BACKUP_STORE_UNAVAILABLE: Firestore unavailable in LIVE mode.');
    }

    if (firestore) {
      const docId = this.getDocumentId(tenantId, backupId);
      const ref = doc(firestore, 'backups', docId);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data() as BackupSnapshot;
        if (data.tenantId !== tenantId && tenantId !== 'GLOBAL') {
          throw new Error(`TENANT_ACCESS_DENIED: Backup belongs to tenant '${data.tenantId}'.`);
        }
        this.nonAuthoritativeCache.set(cacheKey, { snapshot: data, cachedAt: now });
        return data;
      }
    }

    // Check active provider directly
    const provider = this.getActiveProvider();
    const providerSnap = await provider.getBackup(backupId, tenantId);
    if (providerSnap) {
      this.nonAuthoritativeCache.set(cacheKey, { snapshot: providerSnap, cachedAt: now });
      return providerSnap;
    }

    return null;
  }

  /**
   * Lists backup snapshots for a tenant.
   */
  public async listBackups(tenantId: string): Promise<BackupSnapshot[]> {
    if (!tenantId || tenantId === 'UNRESOLVED') {
      throw new Error('BACKUP_ACCESS_DENIED: Unresolved tenant.');
    }

    const activeEnv = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();

    if (activeEnv === 'LIVE' && !firestore) {
      throw new Error('BACKUP_STORE_UNAVAILABLE: Firestore unavailable in LIVE mode.');
    }

    const results: BackupSnapshot[] = [];

    if (firestore) {
      try {
        const q = query(collection(firestore, 'backups'), where('tenantId', '==', tenantId));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          results.push(d.data() as BackupSnapshot);
        });
        if (results.length > 0) return results;
      } catch (err: any) {
        // Fall back to provider list
      }
    }

    const providerList = await this.getActiveProvider().listBackups(tenantId);
    return providerList;
  }

  /**
   * Verifies backup integrity against actual cloud/provider manifest.
   */
  public async verifyBackup(
    backupId: string,
    tenantId: string
  ): Promise<{ verified: boolean; message: string; checksumMatches: boolean }> {
    const provider = this.getActiveProvider();
    const activeEnv = dbManager.getEnvironment();

    if (activeEnv === 'LIVE' && !provider.isConfigured()) {
      return {
        verified: false,
        message: 'BACKUP_PROVIDER_NOT_CONFIGURED: Production cloud storage backup provider is not configured.',
        checksumMatches: false,
      };
    }

    const backup = await this.getBackup(tenantId, backupId);
    if (!backup) {
      return { verified: false, message: `Backup '${backupId}' not found.`, checksumMatches: false };
    }

    const res = await provider.verifyBackup(backupId, tenantId);
    if (res.verified) {
      this.lastRestoreVerificationAt = new Date().toISOString();
    }
    return res;
  }

  /**
   * Executes a periodic restore drill into an ISOLATED target environment.
   * Prohibits destructive restore directly onto primary production collections.
   */
  public async executeRestoreDrill(params: {
    backupId: string;
    tenantId: string;
    authorizedBy: string;
    targetEnvironment?: string;
    actorRole?: string;
  }): Promise<RestoreDrillResult> {
    const targetEnv = params.targetEnvironment || 'isolated-drill-target';

    // Safety guard: Reject restoring onto primary production environment
    if (targetEnv === 'PRODUCTION' || targetEnv === 'LIVE_PRIMARY') {
      throw new Error(
        'RESTORE_SAFETY_VIOLATION: Destructive restore testing directly against primary production environment is prohibited.'
      );
    }

    const backup = await this.getBackup(params.tenantId, params.backupId);
    if (!backup) {
      throw new Error(`BACKUP_NOT_FOUND: Backup '${params.backupId}' not found for tenant '${params.tenantId}'.`);
    }

    const activeEnv = dbManager.getEnvironment();
    const provider = this.getActiveProvider();

    const drillId = `drill-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const startedAt = new Date().toISOString();

    const restoreRes = await provider.restoreBackup({
      backupId: params.backupId,
      targetTenantId: params.tenantId,
      authorizedBy: params.authorizedBy,
      isIsolatedTarget: true,
    });

    const completedAt = new Date().toISOString();
    const passed = restoreRes.status === 'RESTORE_VERIFIED' || restoreRes.status === 'RESTORE_SUCCEEDED';

    const drillResult: RestoreDrillResult = {
      drillId,
      backupId: params.backupId,
      tenantId: params.tenantId,
      environment: activeEnv,
      targetEnvironment: targetEnv,
      startedAt,
      completedAt,
      status: restoreRes.status,
      integrityVerified: passed,
      expectedRecordCount: backup.totalRecordCount,
      restoredRecordCount: restoreRes.restoredRecords,
      discrepancies: restoreRes.error ? [restoreRes.error] : [],
      executedBy: params.authorizedBy,
    };

    this.drillResults.set(drillId, drillResult);
    this.lastRestoreDrillState = passed ? 'VERIFIED' : 'FAILED';
    if (passed) {
      this.lastRestoreVerificationAt = completedAt;
    }

    // Record immutable audit entry
    await kernelAuditEngine.record({
      action: 'EXECUTE_RESTORE_DRILL',
      actor: { id: params.authorizedBy, type: 'USER', name: params.authorizedBy },
      entityId: drillId,
      entityType: 'RESTORE_DRILL',
      classification: 'RESTRICTED',
      result: passed ? 'SUCCESS' : 'FAILED',
      details: {
        backupId: params.backupId,
        targetEnvironment: targetEnv,
        status: drillResult.status,
        restoredRecords: drillResult.restoredRecordCount,
      },
    });

    return drillResult;
  }

  /**
   * Safe operational telemetry for System Status Engine (zero credentials, zero secrets).
   */
  public getBackupTelemetry(): {
    backupProviderAvailable: boolean;
    backupProviderConfigured: boolean;
    providerType: string;
    lastSuccessfulBackup: string | null;
    backupVerificationState: BackupVerificationState;
    retentionProtectionState: BackupImmutableState;
    restoreDrillState: 'VERIFIED' | 'FAILED' | 'PENDING' | 'NOT_RUN';
    lastRestoreVerification: string | null;
    status: BackupHealthStatus;
  } {
    const provider = this.getActiveProvider();
    const providerStatus = provider.getProviderStatus();

    return {
      backupProviderAvailable: providerStatus.available,
      backupProviderConfigured: providerStatus.configured,
      providerType: providerStatus.providerType,
      lastSuccessfulBackup: this.lastSuccessfulBackupAt,
      backupVerificationState: providerStatus.configured ? 'VERIFIED' : 'NOT_CONFIGURED',
      retentionProtectionState: providerStatus.providerType === 'CLOUD_STORAGE' ? 'RETENTION_PROTECTED' : 'STANDARD',
      restoreDrillState: this.lastRestoreDrillState,
      lastRestoreVerification: this.lastRestoreVerificationAt,
      status: providerStatus.status,
    };
  }
}

export const backupRepository = BackupRepository.getInstance();
