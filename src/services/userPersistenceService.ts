/**
 * ORION-9 USER PERSISTENCE & CROSS-DEVICE SYNCHRONIZATION SERVICE
 * Provides authoritative persistence of user profiles and user preferences
 * to Cloud Firestore (/users and /user_preferences) with offline caching
 * and role anti-tamper security.
 */

import { UserProfile, RoleCode } from '../types/auth';
import { DatabaseConnectionManager } from '../core/database/DatabaseConnectionManager';
import { getFirebaseFirestore } from '../lib/firebaseClient';
import { doc, getDoc, setDoc, updateDoc, Firestore } from 'firebase/firestore';
import { sanitizeFirestorePayload } from '../core/database/firestoreSanitizer';

export interface UserPreferencesRecord {
  userId: string;
  theme?: 'dark' | 'light' | 'system' | 'os-obsidian';
  wallpaperId?: string;
  wallpaperUrl?: string;
  dynamicIslandMode?: 'compact' | 'expanded' | 'minimal' | 'disabled';
  desktopLayout?: {
    iconGridSize?: 'small' | 'medium' | 'large';
    dockPosition?: 'bottom' | 'top' | 'left' | 'right';
    autoHideDock?: boolean;
    soundEnabled?: boolean;
  };
  lastSyncedAt?: string;
  syncedFromDevice?: string;
}

export class UserPersistenceService {
  private static instance: UserPersistenceService;
  private profileCache: Map<string, UserProfile> = new Map();
  private preferencesCache: Map<string, UserPreferencesRecord> = new Map();

  private constructor() {}

  public static getInstance(): UserPersistenceService {
    if (!UserPersistenceService.instance) {
      UserPersistenceService.instance = new UserPersistenceService();
    }
    return UserPersistenceService.instance;
  }

  private getFirestoreInstance(env?: 'LIVE' | 'DEMO' | 'STAGING'): Firestore | null {
    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();
    try {
      return DatabaseConnectionManager.getInstance().getFirestore(activeEnv) || getFirebaseFirestore(activeEnv);
    } catch {
      return null;
    }
  }

  /**
   * Registers a profile in fast in-memory cache for immediate lookup.
   */
  public registerProfileInMemory(profile: UserProfile): void {
    if (profile && profile.id) {
      this.profileCache.set(profile.id, profile);
      if (profile.email) {
        this.profileCache.set(profile.email.toLowerCase(), profile);
      }
    }
  }

  /**
   * Synchronous getter from in-memory cache for immediate access.
   */
  public getUserProfileSync(idOrEmail: string): UserProfile | undefined {
    if (!idOrEmail) return undefined;
    return this.profileCache.get(idOrEmail) || this.profileCache.get(idOrEmail.toLowerCase());
  }

  /**
   * Loads authoritative user profile from Cloud Firestore or local cache.
   */
  public async getUserProfile(
    userId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserProfile | null> {
    if (!userId) return null;

    // Check fast cache first
    if (this.profileCache.has(userId)) {
      return this.profileCache.get(userId)!;
    }

    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const userRef = doc(db, 'users', userId);
          const snap = await getDoc(userRef);
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

  /**
   * Authoritatively persists a user profile to Cloud Firestore with privilege protection.
   */
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

  /**
   * Ensures a profile exists in Firestore upon authentication.
   * Creates initial profile if missing, without granting administrative escalation.
   */
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
      role: 'user', // Default safe role, prevents privilege escalation
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
   * Fetches user preferences from Cloud Firestore /user_preferences/{userId}
   * for cross-device synchronicity.
   */
  public async getUserPreferences(
    userId: string,
    env?: 'LIVE' | 'DEMO' | 'STAGING'
  ): Promise<UserPreferencesRecord | null> {
    if (!userId) return null;

    if (this.preferencesCache.has(userId)) {
      return this.preferencesCache.get(userId)!;
    }

    const activeEnv = env || DatabaseConnectionManager.getInstance().getEnvironment();

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const prefRef = doc(db, 'user_preferences', userId);
          const snap = await getDoc(prefRef);
          if (snap.exists()) {
            const data = snap.data() as UserPreferencesRecord;
            this.preferencesCache.set(userId, data);
            this.syncPreferencesToLocal(data);
            return data;
          }
        } catch (err) {
          console.warn(`[USER-PERSISTENCE] Failed to fetch preferences for ${userId}:`, err);
        }
      }
    }

    // Fall back to localStorage cached preferences
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(`orion_user_prefs_${userId}`);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.preferencesCache.set(userId, parsed);
          return parsed;
        }
      } catch {}
    }

    return null;
  }

  /**
   * Saves user preferences to Cloud Firestore and syncs locally for instant UI update.
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
    const existing = (await this.getUserPreferences(userId, env)) || { userId };

    const merged: UserPreferencesRecord = {
      ...existing,
      ...prefs,
      userId,
      lastSyncedAt: new Date().toISOString(),
      syncedFromDevice: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown Device',
    };

    const sanitized = sanitizeFirestorePayload(merged, `user_preferences/${userId}`);

    if (activeEnv === 'LIVE' || activeEnv === 'STAGING') {
      const db = this.getFirestoreInstance(activeEnv);
      if (db) {
        try {
          const prefRef = doc(db, 'user_preferences', userId);
          await setDoc(prefRef, sanitized, { merge: true });
        } catch (err) {
          console.warn(`[USER-PERSISTENCE] Failed to persist user preferences to Firestore for ${userId}:`, err);
        }
      }
    }

    this.preferencesCache.set(userId, merged);
    this.syncPreferencesToLocal(merged);

    return merged;
  }

  /**
   * Synchronizes preferences into browser localStorage so that the OS shell,
   * wallpaper manager, and dynamic island react instantly without network wait.
   */
  public syncPreferencesToLocal(prefs: UserPreferencesRecord): void {
    if (typeof window === 'undefined') return;

    try {
      localStorage.setItem(`orion_user_prefs_${prefs.userId}`, JSON.stringify(prefs));

      if (prefs.theme) {
        localStorage.setItem('orion_theme', prefs.theme);
        document.documentElement.setAttribute('data-theme', prefs.theme);
      }

      if (prefs.wallpaperId) {
        localStorage.setItem(`orion_active_wallpaper_id_desktop_${prefs.userId}`, prefs.wallpaperId);
        localStorage.setItem('orion_active_wallpaper_id_desktop_global', prefs.wallpaperId);
      }

      if (prefs.dynamicIslandMode) {
        localStorage.setItem('orion_dynamic_island_mode', prefs.dynamicIslandMode);
      }
    } catch (e) {
      console.warn('[USER-PERSISTENCE] Error syncing preferences to local store:', e);
    }
  }
}

export const userPersistenceService = UserPersistenceService.getInstance();
