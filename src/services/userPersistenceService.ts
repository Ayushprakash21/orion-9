/**
 * ORION-9 USER PERSISTENCE & CROSS-DEVICE SYNCHRONIZATION SERVICE
 * Provides authoritative persistence of user profiles, user preferences
 * (/user_preferences/{userId}), and organization defaults/policies
 * (/policies/org_os_policy_{orgId}) to Cloud Firestore with offline caching,
 * revision/timestamp conflict reconciliation, and automatic online retry.
 */

import { UserProfile, RoleCode } from '../types/auth';
import { DatabaseConnectionManager } from '../core/database/DatabaseConnectionManager';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, Firestore } from 'firebase/firestore';
import { sanitizeFirestorePayload } from '../core/database/firestoreSanitizer';
import {
  UserPreferencesRecord,
  OrganizationSettingsPolicy,
  PREFERENCE_SCHEMA_VERSION,
  normalizeUserPreferenceRecord,
  reconcileUserPreferences,
} from './preferences/PreferenceResolutionEngine';

export type {
  UserPreferencesRecord,
  OrganizationSettingsPolicy,
  PreferenceSyncStatus,
} from './preferences/PreferenceResolutionEngine';

const FIRESTORE_TIMEOUT_MS = 2500;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([
    promise.finally(() => {
      if (timer) clearTimeout(timer);
    }),
    new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`[USER-PERSISTENCE] ${label} timed out after ${ms}ms`);
        (err as any).code = 'deadline-exceeded';
        reject(err);
      }, ms);
    }),
  ]);
}

function getScopedUserPrefKey(userId: string, env: 'LIVE' | 'DEMO' | 'STAGING'): string {
  return `orion_user_prefs_${env}_${userId}`;
}

function getScopedOrgPolicyKey(orgId: string, env: 'LIVE' | 'DEMO' | 'STAGING'): string {
  return `orion_org_os_policy_${env}_${orgId}`;
}

export class UserPersistenceService {
  private static instance: UserPersistenceService;
  private profileCache: Map<string, UserProfile> = new Map();
  private preferencesCache: Map<string, UserPreferencesRecord> = new Map();
  private orgPolicyCache: Map<string, OrganizationSettingsPolicy> = new Map();
  private syncListeners: Set<(record: UserPreferencesRecord) => void> = new Set();
  private orgListeners: Set<(policy: OrganizationSettingsPolicy) => void> = new Set();
  private onlineHookAttached = false;

  private constructor() {
    this.attachOnlineRecoveryHook();
  }

  public static getInstance(): UserPersistenceService {
    if (!UserPersistenceService.instance) {
      UserPersistenceService.instance = new UserPersistenceService();
    }
    return UserPersistenceService.instance;
  }

  private attachOnlineRecoveryHook(): void {
    if (typeof window === 'undefined' || this.onlineHookAttached) return;
    this.onlineHookAttached = true;

    window.addEventListener('online', () => {
      void this.flushPendingSyncs();
    });
  }

  public onPreferencesSyncChange(listener: (record: UserPreferencesRecord) => void): () => void {
    this.syncListeners.add(listener);
    return () => this.syncListeners.delete(listener);
  }

  public onOrganizationPolicyChange(listener: (policy: OrganizationSettingsPolicy) => void): () => void {
    this.orgListeners.add(listener);
    return () => this.orgListeners.delete(listener);
  }

  private notifySyncListeners(record: UserPreferencesRecord): void {
    for (const listener of this.syncListeners) {
      try {
        listener(record);
      } catch (e) {
        console.warn('[USER-PERSISTENCE] Sync listener warning:', e);
      }
    }
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('orion-preferences-sync-status', { detail: record }));
      } catch {}
    }
  }

  private notifyOrgListeners(policy: OrganizationSettingsPolicy): void {
    for (const listener of this.orgListeners) {
      try {
        listener(policy);
      } catch (e) {
        console.warn('[USER-PERSISTENCE] Org policy listener warning:', e);
      }
    }
    if (typeof window !== 'undefined' && typeof CustomEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('orion-org-policy-changed', { detail: policy }));
      } catch {}
    }
  }

  private getFirestoreInstance(env?: 'LIVE' | 'DEMO' | 'STAGING'): Firestore | null {
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    try {
      return DatabaseConnectionManager.getInstance().getFirestore(activeEnv) || getFirebaseFirestore(activeEnv);
    } catch {
      return null;
    }
  }

  public registerProfileInMemory(profile: UserProfile): void {
    if (profile && profile.id) {
      this.profileCache.set(profile.id, profile);
      if (profile.email) {
        this.profileCache.set(profile.email.toLowerCase(), profile);
      }
    }
  }

  public getUserProfileSync(idOrEmail: string): UserProfile | undefined {
    if (!idOrEmail) return undefined;
    return this.profileCache.get(idOrEmail) || this.profileCache.get(idOrEmail.toLowerCase());
  }

  public async getUserProfile(
    userId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserProfile | null> {
    if (!userId) return null;

    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const userRef = doc(db, 'users', userId);
          const snap = await withTimeout(getDoc(userRef), FIRESTORE_TIMEOUT_MS, `users/${userId}`);
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            const profile: UserProfile = {
              id: snap.id,
              username: data.username || data.email?.split('@')[0] || userId,
              displayName: data.displayName || data.fullName || 'User',
              fullName: data.fullName || data.displayName || 'User',
              email: data.email || `${userId}@orion.network`,
              role: (data.role as RoleCode) || 'user',
              status: data.status || 'active',
              organizationId: data.organizationId || 'ORION_PLATFORM',
              organizationName: data.organizationName || 'ORION_PLATFORM',
              onboardingCompleted: data.onboardingCompleted ?? true,
              jobTitle: data.jobTitle,
              department: data.department,
              createdAt: data.createdAt || new Date().toISOString(),
              updatedAt: data.updatedAt || new Date().toISOString(),
            };
            this.registerProfileInMemory(profile);
            return profile;
          }
        } catch (err) {
          console.warn(`[USER-PERSISTENCE] Failed to fetch profile from Firestore for ${userId}:`, err);
        }
      }
    }

    return null;
  }

  public async saveUserProfile(
    profile: UserProfile,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserProfile> {
    if (!profile || !profile.id) {
      throw new Error('[USER-PERSISTENCE] Invalid profile: id is required.');
    }

    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const sanitized = sanitizeFirestorePayload(profile, `users/${profile.id}`);

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const userRef = doc(db, 'users', profile.id);
          await setDoc(userRef, {
            ...sanitized,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        } catch (err: any) {
          console.error(`[USER-PERSISTENCE] Firestore write failed for user ${profile.id}:`, err);
          throw new Error(`[USER-PERSISTENCE] Failed to save profile to Firestore: ${err?.message || err}`);
        }
      }
    }

    this.registerProfileInMemory(profile);
    return profile;
  }

  public async ensureUserProfile(
    userData: { id: string; email: string; displayName?: string },
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserProfile> {
    const existing = await this.getUserProfile(userData.id, env);
    if (existing) {
      return existing;
    }

    const username = (userData.displayName || userData.email.split('@')[0] || userData.id).trim();
    const newProfile: UserProfile = {
      id: userData.id,
      username,
      displayName: userData.displayName || username,
      fullName: userData.displayName || username,
      email: userData.email,
      role: 'user',
      status: 'active',
      organizationId: 'ORION_PLATFORM',
      organizationName: 'ORION_PLATFORM',
      onboardingCompleted: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.saveUserProfile(newProfile, env);
  }

  /**
   * Synchronous cache reader scoped strictly by environment & userId for flicker-free first render.
   */
  public getUserPreferencesLocalSync(
    userId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): UserPreferencesRecord | null {
    if (!userId) return null;
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cacheKey = `${activeEnv}:${userId}`;
    const mem = this.preferencesCache.get(cacheKey);
    if (mem && mem.userId === userId) {
      return mem;
    }

    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;

    try {
      const scopedRaw = localStorage.getItem(getScopedUserPrefKey(userId, activeEnv));
      const legacyRaw = !scopedRaw ? localStorage.getItem(`orion_user_prefs_${userId}`) : null;
      const rawStr = scopedRaw || legacyRaw;
      if (rawStr) {
        const parsed = JSON.parse(rawStr) as UserPreferencesRecord;
        if (parsed && parsed.userId === userId) {
          const normalized = normalizeUserPreferenceRecord(userId, parsed);
          this.preferencesCache.set(cacheKey, normalized);
          return normalized;
        }
      }
    } catch {}

    return null;
  }

  /**
   * Fetches user preferences from Cloud Firestore (/user_preferences/{userId}) and reconciles
   * against scoped local cache by revision & updatedAt timestamp.
   */
  public async getUserPreferences(
    userId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING',
    options?: { forceCloud?: boolean }
  ): Promise<UserPreferencesRecord | null> {
    if (!userId) return null;

    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cacheKey = `${activeEnv}:${userId}`;
    const localCached = this.getUserPreferencesLocalSync(userId, activeEnv);

    if (!options?.forceCloud && localCached && activeEnv === 'DEMO') {
      return localCached;
    }

    let remoteData: UserPreferencesRecord | null = null;
    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const prefRef = doc(db, 'user_preferences', userId);
          const snap = await withTimeout(getDoc(prefRef), FIRESTORE_TIMEOUT_MS, `user_preferences/${userId}`);
          if (snap.exists()) {
            const rawRemote = snap.data() as UserPreferencesRecord;
            if (!rawRemote.userId || rawRemote.userId === userId) {
              remoteData = normalizeUserPreferenceRecord(userId, { ...rawRemote, userId });
            }
          }
        } catch (err) {
          console.warn(`[USER-PERSISTENCE] Failed to fetch preferences for ${userId}:`, err);
        }
      }
    }

    const reconciled = reconcileUserPreferences(userId, localCached, remoteData);
    if (reconciled) {
      this.preferencesCache.set(cacheKey, reconciled);
      this.writeLocalPrefCacheOnly(reconciled, activeEnv);
      // If offline modifications existed cleanly ahead of remote, flush in background when online
      if (
        reconciled.pendingSync &&
        (activeEnv === 'LIVE' || activeEnv === 'STAGING') &&
        (typeof navigator === 'undefined' || navigator.onLine !== false)
      ) {
        void this.saveUserPreferences(userId, reconciled, activeEnv).catch(() => {});
      }
    }

    return reconciled;
  }

  private writeLocalPrefCacheOnly(prefs: UserPreferencesRecord, env: 'LIVE' | 'DEMO' | 'STAGING'): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const serialized = JSON.stringify(prefs);
      localStorage.setItem(getScopedUserPrefKey(prefs.userId, env), serialized);
      localStorage.setItem(`orion_user_prefs_${prefs.userId}`, serialized);
    } catch {}
  }

  /**
   * Immediately updates local cache & UI status, then persists to Cloud Firestore /user_preferences/{userId}.
   * Never reports `cloudSynced: true` prior to confirmed Firestore acknowledgement.
   */
  public async saveUserPreferences(
    userId: string,
    prefs: Partial<UserPreferencesRecord>,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserPreferencesRecord> {
    if (!userId) {
      throw new Error('[USER-PERSISTENCE] userId is required for preferences.');
    }

    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cacheKey = `${activeEnv}:${userId}`;
    const existing = this.getUserPreferencesLocalSync(userId, activeEnv) || { userId };

    const now = new Date().toISOString();
    const nextVersion = (existing.version || 0) + 1;
    const nextRevision = (existing.revision ?? existing.version ?? 0) + 1;

    // Record explicitly modified fields so org defaults apply cleanly only to unedited keys
    const incomingExplicit = Object.keys(prefs).filter(
      (k) =>
        (prefs as any)[k] !== undefined &&
        ![
          'userId',
          'organizationId',
          'environment',
          'schemaVersion',
          'revision',
          'version',
          'updatedAt',
          'lastSyncedAt',
          'lastLocalSavedAt',
          'syncedFromDevice',
          'localSaved',
          'cloudSynced',
          'pendingSync',
          'syncStatus',
          'syncError',
          'userReadableError',
          'isRetryable',
          'conflictDetails',
          'explicitFields',
        ].includes(k)
    );

    const mergedExplicit = Array.from(
      new Set([...(existing.explicitFields || []), ...(prefs.explicitFields || []), ...incomingExplicit])
    );

    const baseMerged: UserPreferencesRecord = normalizeUserPreferenceRecord(userId, {
      ...existing,
      ...prefs,
      userId,
      environment: activeEnv,
      schemaVersion: PREFERENCE_SCHEMA_VERSION,
      version: nextVersion,
      revision: nextRevision,
      updatedAt: now,
      lastLocalSavedAt: now,
      localSaved: true,
      cloudSynced: false,
      pendingSync: activeEnv === 'LIVE' || activeEnv === 'STAGING',
      syncStatus: activeEnv === 'LIVE' || activeEnv === 'STAGING' ? 'SAVING' : 'LOCAL_ONLY',
      syncedFromDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device',
      explicitFields: mergedExplicit,
    });

    // Save locally immediately so instant UI & offline safety are guaranteed
    this.preferencesCache.set(cacheKey, baseMerged);
    this.writeLocalPrefCacheOnly(baseMerged, activeEnv);
    this.syncPreferencesToLocal(baseMerged);
    this.notifySyncListeners(baseMerged);

    const merged: UserPreferencesRecord = { ...baseMerged };

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const db = !isOffline ? this.getFirestoreInstance(activeEnv) : null;

      if (db && !isOffline) {
        try {
          const prefRef = doc(db, 'user_preferences', userId);

          // Remote conflict check
          try {
            const remoteSnap = await withTimeout(getDoc(prefRef), FIRESTORE_TIMEOUT_MS, `conflictCheck/${userId}`);
            if (remoteSnap.exists()) {
              const remoteData = remoteSnap.data() as UserPreferencesRecord;
              const remoteTs = remoteData.updatedAt ? Date.parse(remoteData.updatedAt) : (remoteData.lastSyncedAt ? Date.parse(remoteData.lastSyncedAt) : 0);
              const existingTs = existing.updatedAt ? Date.parse(existing.updatedAt) : (existing.lastSyncedAt ? Date.parse(existing.lastSyncedAt) : 0);

              if (remoteTs > existingTs) {
                merged.conflictDetails = {
                  remoteTimestamp: remoteData.updatedAt || remoteData.lastSyncedAt,
                  localTimestamp: now,
                  resolution: 'MERGED',
                };
                Object.keys(remoteData).forEach((key) => {
                  if ((prefs as any)[key] === undefined && (remoteData as any)[key] !== undefined && !incomingExplicit.includes(key)) {
                    (merged as any)[key] = (remoteData as any)[key];
                  }
                });
                merged.revision = Math.max(nextRevision, (remoteData.revision ?? remoteData.version ?? 0) + 1);
              }
            }
          } catch {
            // Pre-read failure non-fatal
          }

          const sanitized = sanitizeFirestorePayload(
            {
              ...merged,
              lastSyncedAt: now,
              updatedAt: now,
              cloudSynced: true,
              pendingSync: false,
              syncStatus: 'SYNCED',
              isRetryable: false,
            },
            `user_preferences/${userId}`
          );

          await withTimeout(setDoc(prefRef, sanitized, { merge: true }), FIRESTORE_TIMEOUT_MS + 1500, `setDoc/${userId}`);
          merged.lastSyncedAt = now;
          merged.cloudSynced = true;
          merged.pendingSync = false;
          merged.syncStatus = 'SYNCED';
          merged.isRetryable = false;
          delete merged.syncError;
          delete merged.userReadableError;
        } catch (err: any) {
          const syncError = err?.message || String(err);
          const errCode = (err?.code || '').toLowerCase();
          const isNetworkError =
            errCode === 'unavailable' ||
            errCode === 'deadline-exceeded' ||
            syncError.toLowerCase().includes('network') ||
            syncError.toLowerCase().includes('offline') ||
            syncError.toLowerCase().includes('timeout');

          merged.cloudSynced = false;
          merged.pendingSync = true;
          merged.syncStatus = isNetworkError ? 'PENDING' : 'FAILED';
          merged.isRetryable = true;
          merged.syncError = syncError;
          merged.userReadableError = isNetworkError
            ? 'Offline: Preferences saved locally and queued for cloud sync.'
            : 'Cloud sync failed. Preferences saved locally — click Retry Sync to try again.';

          console.warn(`[USER-PERSISTENCE] Failed to persist user preferences to Firestore for ${userId}:`, err);
        }
      } else {
        merged.cloudSynced = false;
        merged.pendingSync = true;
        merged.syncStatus = 'LOCAL_ONLY';
        merged.isRetryable = true;
        merged.syncError = isOffline ? 'Browser offline' : 'Firestore client instance unavailable';
        merged.userReadableError = 'Cloud Firestore is temporarily offline. Preferences saved locally and queued for cloud synchronization.';
      }
    } else {
      merged.lastSyncedAt = now;
      merged.cloudSynced = false;
      merged.pendingSync = false;
      merged.syncStatus = 'LOCAL_ONLY';
      merged.isRetryable = false;
    }

    this.preferencesCache.set(cacheKey, merged);
    this.writeLocalPrefCacheOnly(merged, activeEnv);
    this.syncPreferencesToLocal(merged);
    this.notifySyncListeners(merged);

    return merged;
  }

  public async retrySync(
    userId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserPreferencesRecord> {
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cached = this.getUserPreferencesLocalSync(userId, activeEnv) || (await this.getUserPreferences(userId, activeEnv));
    if (!cached) {
      throw new Error(`[USER-PERSISTENCE] No local preferences found to retry for user ${userId}`);
    }
    return this.saveUserPreferences(userId, cached, activeEnv);
  }

  public async flushPendingSyncs(): Promise<void> {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    const activeEnv = DatabaseConnectionManager.getInstance().getEnvironment();
    if (activeEnv !== 'LIVE' && activeEnv !== 'STAGING') return;

    const prefixes = [`orion_user_prefs_${activeEnv}_`];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !prefixes.some((p) => key.startsWith(p))) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null') as UserPreferencesRecord | null;
        if (parsed?.userId && parsed.pendingSync) {
          await this.saveUserPreferences(parsed.userId, parsed, activeEnv);
        }
      } catch {}
    }

    // Flush any pending org policy updates as well
    const orgPrefix = `orion_org_os_policy_${activeEnv}_`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(orgPrefix)) continue;
      try {
        const parsed = JSON.parse(localStorage.getItem(key) || 'null') as (OrganizationSettingsPolicy & { pendingSync?: boolean }) | null;
        if (parsed?.organizationId && parsed.pendingSync) {
          await this.saveOrganizationPolicy(parsed.organizationId, parsed, activeEnv);
        }
      } catch {}
    }
  }

  /**
   * Synchronous org policy reader for instant flicker-free startup resolution.
   */
  public getOrganizationPolicyLocalSync(
    organizationId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): OrganizationSettingsPolicy | null {
    const orgId = organizationId || 'ORION_PLATFORM';
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cacheKey = `${activeEnv}:${orgId}`;
    const mem = this.orgPolicyCache.get(cacheKey);
    if (mem) return mem;

    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
    try {
      const raw = localStorage.getItem(getScopedOrgPolicyKey(orgId, activeEnv));
      if (raw) {
        const parsed = JSON.parse(raw) as OrganizationSettingsPolicy;
        if (parsed && parsed.organizationId === orgId) {
          this.orgPolicyCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {}
    return null;
  }

  /**
   * Fetches organization-wide OS display & localization defaults/policies from Cloud Firestore
   * (/policies/org_os_policy_{organizationId}) and reconciles with local cache by revision/timestamp.
   */
  public async getOrganizationPolicy(
    organizationId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING',
    options?: { forceCloud?: boolean }
  ): Promise<OrganizationSettingsPolicy | null> {
    const orgId = organizationId || 'ORION_PLATFORM';
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cacheKey = `${activeEnv}:${orgId}`;
    const localPolicy = this.getOrganizationPolicyLocalSync(orgId, activeEnv);

    if (!options?.forceCloud && localPolicy && activeEnv === 'DEMO') {
      return localPolicy;
    }

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const ref = doc(db, 'policies', `org_os_policy_${orgId}`);
          const snap = await withTimeout(getDoc(ref), FIRESTORE_TIMEOUT_MS, `policies/org_os_policy_${orgId}`);
          if (snap.exists()) {
            const remote = snap.data() as OrganizationSettingsPolicy;
            const localTs = localPolicy?.updatedAt ? Date.parse(localPolicy.updatedAt) || 0 : 0;
            const remoteTs = remote.updatedAt ? Date.parse(remote.updatedAt) || 0 : 0;
            const localRev = localPolicy?.revision || 0;
            const remoteRev = remote.revision || 0;

            const winner =
              (localPolicy as any)?.pendingSync
                ? { ...remote, ...localPolicy }
                : remoteTs > localTs || (remoteTs === localTs && remoteRev >= localRev)
                  ? remote
                  : localPolicy || remote;

            this.orgPolicyCache.set(cacheKey, winner);
            if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
              try {
                localStorage.setItem(getScopedOrgPolicyKey(orgId, activeEnv), JSON.stringify(winner));
              } catch {}
            }
            return winner;
          }
        } catch (err) {
          console.warn(`[USER-PERSISTENCE] Failed to fetch org policy for ${orgId}:`, err);
        }
      }
    }

    return localPolicy;
  }

  /**
   * Persists organization defaults and enforced admin policies to Cloud Firestore (/policies/org_os_policy_{orgId}).
   */
  public async saveOrganizationPolicy(
    organizationId: string,
    patch: Partial<OrganizationSettingsPolicy>,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<OrganizationSettingsPolicy & { cloudSynced?: boolean; syncStatus?: string; syncError?: string }> {
    const orgId = organizationId || 'ORION_PLATFORM';
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    const cacheKey = `${activeEnv}:${orgId}`;
    const existing = this.getOrganizationPolicyLocalSync(orgId, activeEnv);
    const now = new Date().toISOString();

    const merged: OrganizationSettingsPolicy & {
      cloudSynced?: boolean;
      pendingSync?: boolean;
      syncStatus?: string;
      syncError?: string;
    } = {
      schemaVersion: PREFERENCE_SCHEMA_VERSION,
      ...(existing || {}),
      ...patch,
      organizationId: orgId,
      tenantId: orgId,
      revision: (existing?.revision || 0) + 1,
      updatedAt: now,
    };

    this.orgPolicyCache.set(cacheKey, merged);
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(getScopedOrgPolicyKey(orgId, activeEnv), JSON.stringify(merged));
      } catch {}
    }

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const isOffline = typeof navigator !== 'undefined' && navigator.onLine === false;
      const db = !isOffline ? this.getFirestoreInstance(activeEnv) : null;
      if (db && !isOffline) {
        try {
          const ref = doc(db, 'policies', `org_os_policy_${orgId}`);
          const payload = sanitizeFirestorePayload(
            {
              ...merged,
              cloudSynced: true,
              pendingSync: false,
              syncStatus: 'SYNCED',
            },
            `policies/org_os_policy_${orgId}`
          );
          await withTimeout(setDoc(ref, payload, { merge: true }), FIRESTORE_TIMEOUT_MS + 1500, `setOrgPolicy/${orgId}`);
          merged.cloudSynced = true;
          merged.pendingSync = false;
          merged.syncStatus = 'SYNCED';
        } catch (err: any) {
          merged.cloudSynced = false;
          merged.pendingSync = true;
          merged.syncStatus = 'FAILED';
          merged.syncError = err?.message || String(err);
        }
      } else {
        merged.cloudSynced = false;
        merged.pendingSync = true;
        merged.syncStatus = 'LOCAL_ONLY';
      }
    } else {
      merged.cloudSynced = false;
      merged.pendingSync = false;
      merged.syncStatus = 'LOCAL_ONLY';
    }

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(getScopedOrgPolicyKey(orgId, activeEnv), JSON.stringify(merged));
      } catch {}
    }

    this.orgPolicyCache.set(cacheKey, merged);
    this.notifyOrgListeners(merged);
    return merged;
  }

  /**
   * Synchronizes user preferences into active session browser caches when owned by current session.
   */
  public syncPreferencesToLocal(prefs: UserPreferencesRecord): void {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;

    try {
      const activeEnv = prefs.environment || DatabaseConnectionManager.getInstance().getEnvironment();
      this.writeLocalPrefCacheOnly(prefs, activeEnv);

      // Update active display preferences key ONLY when matching currently signed-in user (or unauthenticated guest matching 'guest')
      let activeSessionUserId: string | null = null;
      try {
        const sessRaw = localStorage.getItem('orion_auth_session');
        if (sessRaw) {
          const parsedSess = JSON.parse(sessRaw);
          activeSessionUserId = parsedSess?.user?.id || parsedSess?.profile?.id || null;
        }
      } catch {}

      if (activeSessionUserId && activeSessionUserId !== prefs.userId) {
        return;
      }

      localStorage.setItem(
        `orion_display_preferences:${prefs.userId}`,
        JSON.stringify({
          displayScale: prefs.displayScale ?? 100,
          textSize: prefs.textSize ?? 100,
          fontFamily: prefs.fontFamily ?? 'ROBOTO',
        })
      );

      if (prefs.theme) {
        localStorage.setItem('orion_theme', prefs.theme);
      }

      if (prefs.wallpaperId) {
        localStorage.setItem(`orion_active_wallpaper_id_desktop_${prefs.userId}`, prefs.wallpaperId);
        localStorage.setItem('orion_active_wallpaper_id_desktop_global', prefs.wallpaperId);
      }

      if (prefs.dynamicIslandMode) {
        localStorage.setItem(`orion_dynamic_island_mode:${prefs.userId}`, prefs.dynamicIslandMode);
        localStorage.setItem('orion_dynamic_island_mode', prefs.dynamicIslandMode);
      }

      if (typeof prefs.dynamicIslandPinned === 'boolean') {
        localStorage.setItem(`orion_dynamic_island_pinned:${prefs.userId}`, String(prefs.dynamicIslandPinned));
        localStorage.setItem('orion_dynamic_island_pinned', String(prefs.dynamicIslandPinned));
      }
    } catch (e) {
      console.warn('[USER-PERSISTENCE] Error syncing preferences to local store:', e);
    }
  }
}

export const userPersistenceService = UserPersistenceService.getInstance();
