/**
 * ORION-9 STARTUP PREFERENCE HYDRATION & CROSS-TAB/CROSS-DEVICE SYNC HOOK
 *
 * Ensures user preferences and organization policies are hydrated and applied
 * BEFORE Orion Desktop renders, preventing theme, font, dock, or scaling flicker.
 */

import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { getFirebaseFirestore } from '../../lib/firebaseClient';
import { userPersistenceService, UserPreferencesRecord, OrganizationSettingsPolicy } from '../userPersistenceService';
import {
  normalizeUserPreferenceRecord,
  reconcileUserPreferences,
  resolveEffectivePreferences,
} from './PreferenceResolutionEngine';
import { applyResolvedPreferencesToDOMAndRuntime } from './PreferenceRuntimeApplier';

export interface PreferenceHydrationInput {
  isAuthenticated: boolean;
  userId?: string | null;
  organizationId?: string | null;
}

export interface PreferenceHydrationState {
  isHydratingPreferences: boolean;
  preferencesHydratedForUserId: string | null;
  lockedFields: Set<string>;
}

export function usePreferenceHydration({
  isAuthenticated,
  userId,
  organizationId,
}: PreferenceHydrationInput): PreferenceHydrationState {
  const [hydratedUserId, setHydratedUserId] = useState<string | null>(null);
  const [lockedFields, setLockedFields] = useState<Set<string>>(() => new Set());
  const generationRef = useRef(0);

  useEffect(() => {
    if (!isAuthenticated || !userId) {
      setHydratedUserId(null);
      setLockedFields(new Set());
      return;
    }

    const gen = ++generationRef.current;
    const activeEnv = dbManager.getEnvironment();
    const orgId = organizationId || 'ORION_PLATFORM';

    const applyLatestSnapshot = (
      userRec: UserPreferencesRecord | null,
      orgPolicy: OrganizationSettingsPolicy | null
    ) => {
      if (gen !== generationRef.current) return;
      const resolved = resolveEffectivePreferences(userId, userRec, orgPolicy);
      applyResolvedPreferencesToDOMAndRuntime(resolved, { tenantId: orgId, env: activeEnv });
      setLockedFields(resolved.lockedFields);
    };

    // 1. Synchronous pre-paint cache application (zero flash on warm reloads)
    const syncLocalUser = userPersistenceService.getUserPreferencesLocalSync(userId, activeEnv);
    const syncLocalOrg = userPersistenceService.getOrganizationPolicyLocalSync(orgId, activeEnv);
    if (syncLocalUser || syncLocalOrg) {
      applyLatestSnapshot(syncLocalUser, syncLocalOrg);
    }

    let cancelled = false;
    let unsubUserSnap: (() => void) | undefined;
    let unsubOrgSnap: (() => void) | undefined;

    const hydrateFromCloud = async () => {
      try {
        const [cloudOrg, cloudUser] = await Promise.all([
          userPersistenceService.getOrganizationPolicy(orgId, activeEnv, { forceCloud: activeEnv === 'LIVE' || activeEnv === 'STAGING' }),
          userPersistenceService.getUserPreferences(userId, activeEnv, { forceCloud: activeEnv === 'LIVE' || activeEnv === 'STAGING' }),
        ]);

        if (cancelled || gen !== generationRef.current) return;

        if (cloudUser || cloudOrg || syncLocalUser || syncLocalOrg) {
          applyLatestSnapshot(cloudUser || syncLocalUser, cloudOrg || syncLocalOrg);
        }
      } catch (err) {
        console.warn('[PREF-HYDRATION] Non-fatal hydration warning:', err);
      } finally {
        if (!cancelled && gen === generationRef.current) {
          setHydratedUserId(userId);
        }
      }
    };

    void hydrateFromCloud();

    // 2. Attach real-time Firestore listeners in LIVE / STAGING for instant cross-device sync
    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      try {
        const db = dbManager.getFirestore(activeEnv) || getFirebaseFirestore(activeEnv);
        if (db) {
          unsubUserSnap = onSnapshot(
            doc(db, 'user_preferences', userId),
            (snap) => {
              if (!snap.exists() || cancelled || gen !== generationRef.current) return;
              const remote = snap.data() as UserPreferencesRecord;
              if (remote.userId && remote.userId !== userId) return;
              const localCur = userPersistenceService.getUserPreferencesLocalSync(userId, activeEnv);
              const reconciled = reconcileUserPreferences(
                userId,
                localCur,
                normalizeUserPreferenceRecord(userId, { ...remote, userId })
              );
              if (reconciled) {
                userPersistenceService.syncPreferencesToLocal(reconciled);
                const curOrg = userPersistenceService.getOrganizationPolicyLocalSync(orgId, activeEnv);
                applyLatestSnapshot(reconciled, curOrg);
              }
            },
            () => {}
          );

          unsubOrgSnap = onSnapshot(
            doc(db, 'policies', `org_os_policy_${orgId}`),
            (snap) => {
              if (!snap.exists() || cancelled || gen !== generationRef.current) return;
              const orgPol = snap.data() as OrganizationSettingsPolicy;
              if (orgPol.organizationId && orgPol.organizationId !== orgId) return;
              const curUser = userPersistenceService.getUserPreferencesLocalSync(userId, activeEnv);
              applyLatestSnapshot(curUser, orgPol);
            },
            () => {}
          );
        }
      } catch {}
    }

    // 3. Cross-tab storage listener strictly filtered to the active user & org
    const handleStorageEvent = (e: StorageEvent) => {
      if (cancelled || gen !== generationRef.current || !e.key) return;
      const validKeys = [
        `orion_user_prefs_${activeEnv}_${userId}`,
        `orion_user_prefs_${userId}`,
        `orion_display_preferences:${userId}`,
        `orion_org_os_policy_${activeEnv}_${orgId}`,
      ];
      if (!validKeys.includes(e.key)) return;

      const latestUser = userPersistenceService.getUserPreferencesLocalSync(userId, activeEnv);
      const latestOrg = userPersistenceService.getOrganizationPolicyLocalSync(orgId, activeEnv);
      applyLatestSnapshot(latestUser, latestOrg);
    };

    // 4. Local in-tab org policy / sync change listeners
    const handleOrgPolicyChanged = (e: Event) => {
      if (cancelled || gen !== generationRef.current) return;
      const detail = (e as CustomEvent<OrganizationSettingsPolicy>)?.detail;
      if (detail && detail.organizationId === orgId) {
        const latestUser = userPersistenceService.getUserPreferencesLocalSync(userId, activeEnv);
        applyLatestSnapshot(latestUser, detail);
      }
    };

    window.addEventListener('storage', handleStorageEvent);
    window.addEventListener('orion-org-policy-changed', handleOrgPolicyChanged);

    return () => {
      cancelled = true;
      if (unsubUserSnap) unsubUserSnap();
      if (unsubOrgSnap) unsubOrgSnap();
      window.removeEventListener('storage', handleStorageEvent);
      window.removeEventListener('orion-org-policy-changed', handleOrgPolicyChanged);
    };
  }, [isAuthenticated, userId, organizationId]);

  const isHydratingPreferences = Boolean(isAuthenticated && userId && hydratedUserId !== userId);

  return {
    isHydratingPreferences,
    preferencesHydratedForUserId: hydratedUserId,
    lockedFields,
  };
}
