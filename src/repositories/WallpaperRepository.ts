/**
 * ORION-9 AUTHORITATIVE WALLPAPER REPOSITORY
 * Authoritative storage manager for static wallpaper records, user selections, system defaults,
 * and wallpaper policy controls with Cloud Firestore authoritative persistence & strict tenant/target isolation.
 *
 * ALL LIVE/3D/ANIMATION/CANVAS SYSTEMS HAVE BEEN COMPLETELY REMOVED.
 */

import { dbManager } from '../core/database/DatabaseConnectionManager';
import { 
  WallpaperRecord, 
  WallpaperPolicy, 
  DEFAULT_WALLPAPER_POLICY,
  WallpaperTarget
} from '../types/wallpaper';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { wallpaperAssetStorage } from '../services/wallpaper/WallpaperAssetStorage';

export { type WallpaperTarget } from '../types/wallpaper';

const WALLPAPERS_COLLECTION = 'wallpapers';
const POLICIES_COLLECTION = 'wallpaperPolicies';
const SELECTIONS_COLLECTION = 'wallpaperSelections';

/**
 * DEFAULT HOME / DESKTOP WALLPAPER:
 * "Earth's Luminous Cosmic Horizon" (Target: HOME / DESKTOP)
 */
export const DEFAULT_DESKTOP_WALLPAPER: WallpaperRecord = {
  wallpaperId: 'sys-orion-desktop-default',
  tenantId: 'global',
  ownerType: 'SYSTEM',
  ownerId: 'system',
  name: "Earth's Luminous Cosmic Horizon",
  assetUrl: '/wallpaper/orion9-desktop-horizon-moon.png',
  thumbnailUrl: '/wallpaper/orion9-desktop-horizon-moon.png',
  source: 'SYSTEM',
  target: 'desktop',
  aiGenerated: false,
  width: 2560,
  height: 1440,
  aspectRatio: '16:9',
  mode: 'STILL',
  environment: 'DEMO',
  status: 'APPROVED',
  isSystemDefault: true,
  createdAt: new Date(1700000000000).toISOString(),
  updatedAt: new Date(1700000000000).toISOString(),
};

/**
 * DEFAULT LIGHT DESKTOP WALLPAPER:
 * "Orion Luminous Silver Horizon" (Target: HOME / DESKTOP, Light Mode)
 */
export const DEFAULT_LIGHT_DESKTOP_WALLPAPER: WallpaperRecord = {
  wallpaperId: 'sys-orion-desktop-light-default',
  tenantId: 'global',
  ownerType: 'SYSTEM',
  ownerId: 'system',
  name: "Orion Luminous Silver Horizon",
  assetUrl: '/wallpaper/orion9-desktop-light.svg',
  thumbnailUrl: '/wallpaper/orion9-desktop-light.svg',
  source: 'SYSTEM',
  target: 'desktop',
  aiGenerated: false,
  width: 2560,
  height: 1440,
  aspectRatio: '16:9',
  mode: 'STILL',
  environment: 'DEMO',
  status: 'APPROVED',
  isSystemDefault: true,
  createdAt: new Date(1700000000000).toISOString(),
  updatedAt: new Date(1700000000000).toISOString(),
};

/**
 * DEFAULT LOGIN WALLPAPER:
 * Dark Cinematic Earth Horizon (Target: LOGIN)
 */
export const DEFAULT_LOGIN_WALLPAPER: WallpaperRecord = {
  wallpaperId: 'sys-orion-dark-horizon',
  tenantId: 'global',
  ownerType: 'SYSTEM',
  ownerId: 'system',
  name: 'Dark Cinematic Earth Horizon',
  assetUrl: '/wallpaper/orion9-earth-horizon-default.png',
  thumbnailUrl: '/wallpaper/orion9-earth-horizon-default.png',
  source: 'SYSTEM',
  target: 'login',
  aiGenerated: false,
  width: 2560,
  height: 1440,
  aspectRatio: '16:9',
  mode: 'STILL',
  environment: 'DEMO',
  status: 'APPROVED',
  isSystemDefault: true,
  createdAt: new Date(1700000000000).toISOString(),
  updatedAt: new Date(1700000000000).toISOString(),
};

/**
 * Resolves the effective runtime wallpaper taking active theme appearance into account.
 * Rules:
 * 1. If target is 'desktop':
 *    - If mode is 'light' and active is system dark default -> return DEFAULT_LIGHT_DESKTOP_WALLPAPER.
 *    - If mode is 'dark' and active is system light default -> return DEFAULT_DESKTOP_WALLPAPER.
 * 2. Custom wallpapers, uploads, AI-generated wallpapers, and non-default system wallpapers
 *    are NEVER mutated or overridden.
 */
export function resolveRuntimeWallpaper(
  activeWallpaper: WallpaperRecord | null | undefined,
  target: WallpaperTarget = 'desktop',
  appearanceMode: 'light' | 'dark' = 'dark'
): WallpaperRecord {
  const isLight = appearanceMode === 'light';
  const defaultRecord = isLight && target === 'desktop' 
    ? DEFAULT_LIGHT_DESKTOP_WALLPAPER 
    : (target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER);

  if (!activeWallpaper || !activeWallpaper.assetUrl) {
    return defaultRecord;
  }

  if (target === 'desktop') {
    if (isLight && activeWallpaper.wallpaperId === DEFAULT_DESKTOP_WALLPAPER.wallpaperId) {
      return DEFAULT_LIGHT_DESKTOP_WALLPAPER;
    }
    if (!isLight && activeWallpaper.wallpaperId === DEFAULT_LIGHT_DESKTOP_WALLPAPER.wallpaperId) {
      return DEFAULT_DESKTOP_WALLPAPER;
    }
  }

  return activeWallpaper;
}

export const SYSTEM_DEFAULT_WALLPAPERS: WallpaperRecord[] = [
  DEFAULT_DESKTOP_WALLPAPER,
  DEFAULT_LIGHT_DESKTOP_WALLPAPER,
  DEFAULT_LOGIN_WALLPAPER,
  {
    wallpaperId: 'sys-deep-orion-nebula',
    tenantId: 'global',
    ownerType: 'SYSTEM',
    ownerId: 'system',
    name: 'Deep Orion Atmospheric Nebula',
    assetUrl: '/orion9-space-baseline.png',
    thumbnailUrl: '/orion9-space-baseline.png',
    source: 'SYSTEM',
    aiGenerated: false,
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    mode: 'STILL',
    environment: 'DEMO',
    status: 'APPROVED',
    isSystemDefault: true,
    createdAt: new Date(1700000000000).toISOString(),
    updatedAt: new Date(1700000000000).toISOString(),
  },
  {
    wallpaperId: 'sys-orbital-grid-node',
    tenantId: 'global',
    ownerType: 'SYSTEM',
    ownerId: 'system',
    name: 'Orbital Control Tower Grid',
    assetUrl: '/orion-desktop-global-network.jpg',
    thumbnailUrl: '/orion-desktop-global-network.jpg',
    source: 'SYSTEM',
    aiGenerated: false,
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    mode: 'STILL',
    environment: 'DEMO',
    status: 'APPROVED',
    isSystemDefault: true,
    createdAt: new Date(1700000000000).toISOString(),
    updatedAt: new Date(1700000000000).toISOString(),
  },
];

export class WallpaperRepository {
  private static instance: WallpaperRepository;
  private memoryWallpapers: Map<string, WallpaperRecord> = new Map();
  private memoryActiveSelections: Map<string, string> = new Map(); // selectionKey -> wallpaperId
  private memoryPolicy: WallpaperPolicy = { ...DEFAULT_WALLPAPER_POLICY };

  private constructor() {
    for (const sysWp of SYSTEM_DEFAULT_WALLPAPERS) {
      this.memoryWallpapers.set(sysWp.wallpaperId, sysWp);
    }
    this.restoreCache();
  }

  public static getInstance(): WallpaperRepository {
    if (!WallpaperRepository.instance) {
      WallpaperRepository.instance = new WallpaperRepository();
    }
    return WallpaperRepository.instance;
  }

  /**
   * Deterministic selection key generation:
   * LOGIN: 'global_login'
   * DESKTOP: `${userId}_desktop` (or 'global_desktop' if unauthenticated)
   */
  public getSelectionKey(userId?: string, target: WallpaperTarget = 'desktop'): string {
    if (target === 'login') {
      return 'global_login';
    }
    return userId ? `${userId}_desktop` : 'global_desktop';
  }

  private restoreCache(): void {
    if (typeof window !== 'undefined') {
      try {
        const storage = window.localStorage || window.sessionStorage;
        const savedLogin = storage?.getItem('orion_active_wallpaper_id_login') || sessionStorage?.getItem('orion_active_wallpaper_id_login');
        if (savedLogin) {
          this.memoryActiveSelections.set('global_login', savedLogin);
        }
        const savedDesktopGlobal = storage?.getItem('orion_active_wallpaper_id_desktop_global') || sessionStorage?.getItem('orion_active_wallpaper_id_desktop_global');
        if (savedDesktopGlobal) {
          this.memoryActiveSelections.set('global_desktop', savedDesktopGlobal);
        }

        // Restore all user-scoped desktop active selections from localStorage
        if (typeof localStorage !== 'undefined' && localStorage) {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('orion_active_wallpaper_id_desktop_')) {
              const userKey = key.replace('orion_active_wallpaper_id_desktop_', '');
              const val = localStorage.getItem(key);
              if (val) {
                this.memoryActiveSelections.set(`${userKey}_desktop`, val);
              }
            }
          }
        }

        const savedActiveLegacy = storage?.getItem('orion_active_wallpaper_id') || sessionStorage?.getItem('orion_active_wallpaper_id');
        const savedDesktop = this.memoryActiveSelections.get('global_desktop');
        if (savedActiveLegacy && !savedDesktop) {
          this.memoryActiveSelections.set('global_desktop', savedActiveLegacy);
        }
        const savedCustoms = storage?.getItem('orion_custom_wallpapers') || sessionStorage?.getItem('orion_custom_wallpapers');
        if (savedCustoms) {
          try {
            const list: WallpaperRecord[] = JSON.parse(savedCustoms);
            if (Array.isArray(list)) {
              for (const wp of list) {
                // Ensure custom wallpapers do NOT overwrite or duplicate system default assets or IDs
                if (
                  wp &&
                  wp.wallpaperId &&
                  !wp.wallpaperId.startsWith('sys-') &&
                  wp.ownerType !== 'SYSTEM' &&
                  !wp.isSystemDefault &&
                  !SYSTEM_DEFAULT_WALLPAPERS.some(s => s.wallpaperId === wp.wallpaperId || s.assetUrl === wp.assetUrl)
                ) {
                  this.memoryWallpapers.set(wp.wallpaperId, wp);
                }
              }
            }
          } catch (e) {}
        }
      } catch (e) {}
    }
  }

  private persistCache(userId?: string, target?: WallpaperTarget): void {
    if (typeof window !== 'undefined') {
      try {
        if (!target || target === 'login') {
          const loginActive = this.memoryActiveSelections.get('global_login');
          if (loginActive) {
            localStorage?.setItem('orion_active_wallpaper_id_login', loginActive);
            sessionStorage?.setItem('orion_active_wallpaper_id_login', loginActive);
          }
        }
        if (!target || target === 'desktop') {
          const userKey = userId || 'global';
          const desktopActive = this.memoryActiveSelections.get(`${userKey}_desktop`) || this.memoryActiveSelections.get('global_desktop');
          if (desktopActive) {
            localStorage?.setItem(`orion_active_wallpaper_id_desktop_${userKey}`, desktopActive);
            sessionStorage?.setItem(`orion_active_wallpaper_id_desktop_${userKey}`, desktopActive);
            // Also maintain global fallback for desktop
            localStorage?.setItem('orion_active_wallpaper_id_desktop_global', desktopActive);
            sessionStorage?.setItem('orion_active_wallpaper_id_desktop_global', desktopActive);
          }
        }
        
        const customs = Array.from(this.memoryWallpapers.values()).filter(
          w => w.ownerType !== 'SYSTEM' && !w.isSystemDefault && !w.wallpaperId.startsWith('sys-')
        );
        localStorage?.setItem('orion_custom_wallpapers', JSON.stringify(customs));
        sessionStorage?.setItem('orion_custom_wallpapers', JSON.stringify(customs));
      } catch (e) {}
    }
  }

  /**
   * Retrieves all approved wallpapers accessible for tenant, user, and target destination.
   * Guarantees target isolation, deduplication by canonical asset reference, and system default protection.
   */
  public async getAvailableWallpapers(
    tenantId: string = 'global', 
    userId?: string,
    target?: WallpaperTarget
  ): Promise<WallpaperRecord[]> {
    const firestore = dbManager.getFirestore();
    const env = dbManager.getEnvironment();

    if (firestore) {
      try {
        const wpCol = collection(firestore, WALLPAPERS_COLLECTION);
        const snapshot = await getDocs(wpCol);
        if (!snapshot.empty) {
          snapshot.forEach(docSnap => {
            const data = docSnap.data() as WallpaperRecord;
            if (data.wallpaperId && data.assetUrl) {
              if (!data.wallpaperId.startsWith('sys-') && data.ownerType !== 'SYSTEM' && !data.isSystemDefault) {
                this.memoryWallpapers.set(data.wallpaperId, data);
              }
            }
          });
        }
      } catch (err) {
        if (env === 'LIVE') {
          console.error('[WALLPAPER-REPO] Firestore wallpaper fetch failed:', err);
        }
      }
    }

    const seenAssets = new Set<string>();
    const seenIds = new Set<string>();
    const results: WallpaperRecord[] = [];

    const normalizeUrl = (url: string) => url.trim().split('?')[0];

    // 1. First pass: Add canonical system default wallpapers (available for all targets)
    for (const sysWp of SYSTEM_DEFAULT_WALLPAPERS) {
      const norm = normalizeUrl(sysWp.assetUrl);
      seenAssets.add(norm);
      seenIds.add(sysWp.wallpaperId);
      results.push(sysWp);
    }

    // 2. Second pass: Add custom, uploaded, or AI generated wallpapers
    for (const wp of this.memoryWallpapers.values()) {
      if (wp.status !== 'APPROVED') continue;
      if (!wp.assetUrl || wp.assetUrl.trim() === '') continue;
      if (wp.ownerType === 'SYSTEM' || wp.isSystemDefault || wp.wallpaperId.startsWith('sys-')) {
        continue; // Already processed in system pass
      }

      // Target isolation: if target is specified, only include wallpapers matching target
      if (target && wp.target && wp.target !== target) {
        continue;
      }

      // Tenant / Owner filtering
      if (wp.tenantId !== tenantId && wp.tenantId !== 'global') continue;
      if (wp.ownerType !== 'ADMIN' && userId && wp.ownerId !== userId) continue;

      const norm = normalizeUrl(wp.assetUrl);
      if (seenIds.has(wp.wallpaperId) || seenAssets.has(norm)) {
        continue; // Prevent duplicate cards for identical asset URL or ID
      }

      seenIds.add(wp.wallpaperId);
      seenAssets.add(norm);
      results.push(wp);
    }

    return results.length > 0 ? results : SYSTEM_DEFAULT_WALLPAPERS;
  }

  /**
   * Gets single wallpaper by ID from Firestore / cache.
   */
  public async getWallpaperById(wallpaperId: string): Promise<WallpaperRecord | null> {
    const firestore = dbManager.getFirestore();
    if (firestore) {
      try {
        const docRef = doc(firestore, WALLPAPERS_COLLECTION, wallpaperId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as WallpaperRecord;
          this.memoryWallpapers.set(data.wallpaperId, data);
          return data;
        }
      } catch (e) {}
    }
    return this.memoryWallpapers.get(wallpaperId) || null;
  }

  /**
   * Saves or updates static wallpaper record in Cloud Firestore authoritative repository.
   * Intercepts large Base64 images to prevent multi-megabyte payloads in Firestore.
   */
  public async saveWallpaper(record: WallpaperRecord, target?: WallpaperTarget): Promise<WallpaperRecord> {
    const env = dbManager.getEnvironment();
    
    // Process image asset string via storage abstraction
    let safeAssetUrl = record.assetUrl;
    if (safeAssetUrl && safeAssetUrl.startsWith('data:')) {
      safeAssetUrl = await wallpaperAssetStorage.uploadAsset(safeAssetUrl, record.name);
    }

    const updated: WallpaperRecord = {
      ...record,
      target: record.target || target,
      assetUrl: safeAssetUrl,
      thumbnailUrl: safeAssetUrl,
      mode: 'STILL',
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    const firestore = dbManager.getFirestore();
    if (firestore) {
      try {
        const docRef = doc(firestore, WALLPAPERS_COLLECTION, updated.wallpaperId);
        await setDoc(docRef, updated, { merge: true });
      } catch (err) {
        console.error('[WALLPAPER-REPO] Firestore save wallpaper failed:', err);
        if (env === 'LIVE') {
          throw new Error('Failed to persist wallpaper to Cloud Firestore authoritative database.');
        }
      }
    }

    this.memoryWallpapers.set(updated.wallpaperId, updated);
    this.persistCache(updated.ownerId, updated.target || target);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-updated', { 
        detail: { wallpaper: updated, target: updated.target || target } 
      }));
    }

    return updated;
  }

  /**
   * Gets active wallpaper for target (login or desktop).
   * Strict isolation: LOGIN and DESKTOP selections are completely independent.
   */
  public async getActiveWallpaper(
    userId?: string, 
    tenantId: string = 'global',
    target: WallpaperTarget = 'desktop'
  ): Promise<WallpaperRecord> {
    const selectionKey = this.getSelectionKey(userId, target);
    const firestore = dbManager.getFirestore();

    if (firestore) {
      try {
        const selRef = doc(firestore, SELECTIONS_COLLECTION, selectionKey);
        const selSnap = await getDoc(selRef);
        if (selSnap.exists()) {
          const selData = selSnap.data();
          if (selData?.wallpaperId) {
            const wp = await this.getWallpaperById(selData.wallpaperId);
            if (wp && wp.assetUrl) {
              this.memoryActiveSelections.set(selectionKey, wp.wallpaperId);
              return { ...wp, target };
            }
          }
        }
      } catch (e) {}
    }

    // Try in-memory active selection
    let savedId = this.memoryActiveSelections.get(selectionKey);
    // If desktop and user-specific key not found, fallback to global_desktop
    if (!savedId && target === 'desktop') {
      savedId = this.memoryActiveSelections.get('global_desktop');
    }

    // Direct storage fallback
    if (!savedId && typeof window !== 'undefined') {
      try {
        if (target === 'login') {
          savedId = localStorage?.getItem('orion_active_wallpaper_id_login') || 
                    sessionStorage?.getItem('orion_active_wallpaper_id_login') || undefined;
        } else {
          const userKey = userId || 'global';
          savedId = localStorage?.getItem(`orion_active_wallpaper_id_desktop_${userKey}`) || 
                    localStorage?.getItem('orion_active_wallpaper_id_desktop_global') || 
                    sessionStorage?.getItem(`orion_active_wallpaper_id_desktop_${userKey}`) || 
                    sessionStorage?.getItem('orion_active_wallpaper_id_desktop_global') || undefined;
        }
      } catch (e) {}
    }

    if (savedId) {
      const found = (await this.getWallpaperById(savedId)) || this.memoryWallpapers.get(savedId);
      if (found && found.status === 'APPROVED' && found.assetUrl && found.assetUrl.trim() !== '') {
        return { ...found, target };
      }
    }

    // Default target fallbacks:
    // LOGIN default: Dark Cinematic Earth Horizon (/wallpaper/orion9-earth-horizon-default.png)
    // DESKTOP default: Earth's Luminous Cosmic Horizon (/wallpaper/orion9-desktop-horizon-moon.png)
    return target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  }

  /**
   * Synchronously returns active wallpaper from memory or storage cache for immediate, zero-flash render.
   */
  public getActiveWallpaperSync(
    userId?: string,
    target: WallpaperTarget = 'desktop'
  ): WallpaperRecord {
    const selectionKey = this.getSelectionKey(userId, target);
    let savedId = this.memoryActiveSelections.get(selectionKey);
    if (!savedId && target === 'desktop') {
      savedId = this.memoryActiveSelections.get('global_desktop');
    }

    if (!savedId && typeof window !== 'undefined') {
      try {
        if (target === 'login') {
          savedId = localStorage?.getItem('orion_active_wallpaper_id_login') || 
                    sessionStorage?.getItem('orion_active_wallpaper_id_login') || undefined;
        } else {
          const userKey = userId || 'global';
          savedId = localStorage?.getItem(`orion_active_wallpaper_id_desktop_${userKey}`) || 
                    localStorage?.getItem('orion_active_wallpaper_id_desktop_global') || 
                    sessionStorage?.getItem(`orion_active_wallpaper_id_desktop_${userKey}`) || 
                    sessionStorage?.getItem('orion_active_wallpaper_id_desktop_global') || undefined;
        }
      } catch (e) {}
    }

    if (savedId) {
      const found = this.memoryWallpapers.get(savedId);
      if (found && found.status === 'APPROVED' && found.assetUrl && found.assetUrl.trim() !== '') {
        return { ...found, target };
      }
    }

    return target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
  }

  /**
   * Sets active wallpaper for user/tenant and target (desktop or login) in Cloud Firestore.
   * Strict isolation: only updates the specified target. Never cross-writes.
   */
  public async setActiveWallpaper(
    wallpaperId: string, 
    userId?: string,
    target: WallpaperTarget = 'desktop'
  ): Promise<WallpaperRecord> {
    const wp = await this.getWallpaperById(wallpaperId) || this.memoryWallpapers.get(wallpaperId);
    if (!wp) {
      throw new Error(`Wallpaper ID ${wallpaperId} not found.`);
    }

    const selectionKey = this.getSelectionKey(userId, target);
    const targetUser = target === 'login' ? 'global' : (userId || 'global');
    const env = dbManager.getEnvironment();

    const firestore = dbManager.getFirestore();
    if (firestore) {
      try {
        const selRef = doc(firestore, SELECTIONS_COLLECTION, selectionKey);
        await setDoc(selRef, {
          wallpaperId: wp.wallpaperId,
          userId: targetUser,
          target: target,
          tenantId: wp.tenantId || 'global',
          organizationId: wp.organizationId || 'ORION_PLATFORM',
          environment: env,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (err) {
        console.error('[WALLPAPER-REPO] Firestore setActiveWallpaper failed:', err);
        if (env === 'LIVE') {
          throw new Error('Failed to set active wallpaper in Cloud Firestore.');
        }
      }
    }

    this.memoryActiveSelections.set(selectionKey, wallpaperId);
    if (target === 'desktop' && userId) {
      this.memoryActiveSelections.set('global_desktop', wallpaperId);
    }
    this.persistCache(userId, target);

    const targetWp: WallpaperRecord = {
      ...wp,
      target
    };

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[ORION:WALLPAPER] target=${target} wallpaperId=${wp.wallpaperId} action=apply`);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-active-wallpaper-changed', { 
        detail: { wallpaper: targetWp, target, wallpaperId: wp.wallpaperId } 
      }));
      window.dispatchEvent(new CustomEvent('orion-wallpaper-changed', { 
        detail: { target, wallpaperId: wp.wallpaperId, wallpaper: targetWp } 
      }));
    }

    return targetWp;
  }

  /**
   * Gets current system wallpaper policy.
   */
  public async getPolicy(): Promise<WallpaperPolicy> {
    const env = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();

    if (firestore) {
      try {
        const polRef = doc(firestore, POLICIES_COLLECTION, 'default');
        const polSnap = await getDoc(polRef);
        if (polSnap.exists()) {
          this.memoryPolicy = { ...this.memoryPolicy, ...(polSnap.data() as WallpaperPolicy) };
        }
      } catch (e) {
        console.warn('[WALLPAPER-REPO] Notice fetching wallpaper policy from Firestore:', e);
      }
    }

    return {
      ...this.memoryPolicy,
      environment: env,
    };
  }

  /**
   * Updates wallpaper policy (Admin operation) in Cloud Firestore.
   */
  public async updatePolicy(updates: Partial<WallpaperPolicy>): Promise<WallpaperPolicy> {
    const env = dbManager.getEnvironment();
    this.memoryPolicy = {
      ...this.memoryPolicy,
      ...updates,
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    const firestore = dbManager.getFirestore();
    if (firestore) {
      try {
        const polRef = doc(firestore, POLICIES_COLLECTION, 'default');
        await setDoc(polRef, this.memoryPolicy, { merge: true });
      } catch (e) {
        console.error('[WALLPAPER-REPO] Failed to persist wallpaper policy in Firestore:', e);
        if (env === 'LIVE') {
          throw new Error('Failed to update wallpaper policy in Cloud Firestore.');
        }
      }
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-policy-changed', { detail: { policy: this.memoryPolicy } }));
    }

    return this.memoryPolicy;
  }

  /**
   * Resets active wallpaper for target (login or desktop) to system default.
   */
  public async resetToSystemDefault(
    userId?: string,
    target: WallpaperTarget = 'desktop'
  ): Promise<WallpaperRecord> {
    const defaultWp = target === 'login' ? DEFAULT_LOGIN_WALLPAPER : DEFAULT_DESKTOP_WALLPAPER;
    return this.setActiveWallpaper(defaultWp.wallpaperId, userId, target);
  }

  /**
   * Deletes a user or admin uploaded/generated static wallpaper.
   * Guarantees:
   * 1. System Default Protection: Cannot delete system default wallpapers.
   * 2. Active Wallpaper Protection: If the wallpaper being deleted is currently active,
   *    automatically reverts the active target to its system default before deletion.
   * 3. Target Isolation: Deleting a login wallpaper never affects desktop, and vice versa.
   */
  public async deleteWallpaper(
    wallpaperId: string, 
    userId?: string,
    target?: WallpaperTarget
  ): Promise<{ success: boolean; replacementWallpaper?: WallpaperRecord }> {
    const wp = this.memoryWallpapers.get(wallpaperId);
    if (!wp) {
      throw new Error(`Wallpaper ID "${wallpaperId}" not found.`);
    }

    // 1. System Default Protection
    if (wp.isSystemDefault || wp.ownerType === 'SYSTEM' || wp.wallpaperId.startsWith('sys-')) {
      throw new Error('System default wallpapers cannot be deleted.');
    }

    let replacement: WallpaperRecord | undefined;
    const currentTarget = target || wp.target;

    // 2. Active Wallpaper Protection & Target Isolation
    // Check LOGIN target: only modify login if this wallpaper was active on login
    const currentLoginActive = this.memoryActiveSelections.get('global_login') || 
                               (typeof window !== 'undefined' ? (localStorage?.getItem('orion_active_wallpaper_id_login') || sessionStorage?.getItem('orion_active_wallpaper_id_login')) : null);
    if (currentLoginActive === wallpaperId) {
      await this.setActiveWallpaper(DEFAULT_LOGIN_WALLPAPER.wallpaperId, undefined, 'login');
      if (currentTarget === 'login' || !currentTarget) {
        replacement = DEFAULT_LOGIN_WALLPAPER;
      }
    }

    // Check DESKTOP target: only modify desktop if this wallpaper was active on desktop
    const userKey = userId || 'global';
    const currentDesktopActive = this.memoryActiveSelections.get(`${userKey}_desktop`) || 
                                 this.memoryActiveSelections.get('global_desktop') ||
                                 (typeof window !== 'undefined' ? (localStorage?.getItem(`orion_active_wallpaper_id_desktop_${userKey}`) || localStorage?.getItem('orion_active_wallpaper_id_desktop_global')) : null);
    if (currentDesktopActive === wallpaperId) {
      await this.setActiveWallpaper(DEFAULT_DESKTOP_WALLPAPER.wallpaperId, userId, 'desktop');
      if (currentTarget === 'desktop' || !currentTarget) {
        replacement = DEFAULT_DESKTOP_WALLPAPER;
      }
    }

    // 3. Delete from Firestore if configured
    const firestore = dbManager.getFirestore();
    if (firestore) {
      try {
        const docRef = doc(firestore, WALLPAPERS_COLLECTION, wallpaperId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('[WALLPAPER-REPO] Firestore delete error:', err);
      }
    }

    // 4. Remove from Memory
    this.memoryWallpapers.delete(wallpaperId);

    // 5. Update Cache
    this.persistCache(userId, currentTarget);

    // 6. Notify OS listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-deleted', { 
        detail: { wallpaperId, target: currentTarget, replacement } 
      }));
    }

    return { success: true, replacementWallpaper: replacement };
  }
}

export const wallpaperRepository = WallpaperRepository.getInstance();
