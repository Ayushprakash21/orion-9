/**
 * ORION-9 AUTHORITATIVE WALLPAPER REPOSITORY
 * Authoritative storage manager for static wallpaper records, user selections, system defaults,
 * and wallpaper policy controls with Cloud Firestore authoritative persistence & strict tenant/target isolation.
 *
 * Hardened with bounded Firestore timeouts, memory-first lookups, race-safe active selections,
 * and isolated DEMO vs LIVE persistence strategies.
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

export const DEFAULT_FIRESTORE_TIMEOUT_MS = 10000;
export const DEMO_FIRESTORE_TIMEOUT_MS = 3000;

export interface TimeoutContext {
  isTimedOut: boolean;
}

/**
 * Bounded timeout helper for all Firestore asynchronous queries and mutations.
 * Prevents UI deadlock while ensuring late responses do not mutate stale state.
 */
export async function withFirestoreTimeout<T>(
  action: (ctx: TimeoutContext) => Promise<T>,
  timeoutMs: number = DEFAULT_FIRESTORE_TIMEOUT_MS,
  operationName: string = 'Firestore operation'
): Promise<T> {
  const ctx: TimeoutContext = { isTimedOut: false };
  let timer: any;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      ctx.isTimedOut = true;
      const err = new Error(`[WALLPAPER:TIMEOUT] Operation "${operationName}" timed out after ${timeoutMs}ms.`);
      (err as any).code = 'TIMEOUT';
      reject(err);
    }, timeoutMs);
  });

  try {
    return await Promise.race([action(ctx), timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

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
   * Uses bounded timeout to protect against Firestore network hangs.
   */
  public async getAvailableWallpapers(
    tenantId: string = 'global', 
    userId?: string,
    target?: WallpaperTarget
  ): Promise<WallpaperRecord[]> {
    const firestore = dbManager.getFirestore();
    const env = dbManager.getEnvironment();

    if (firestore) {
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async (ctx) => {
          const wpCol = collection(firestore, WALLPAPERS_COLLECTION);
          const snapshot = await getDocs(wpCol);
          if (ctx.isTimedOut) return;
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
        }, timeoutMs, 'getAvailableWallpapers');
      } catch (err) {
        if (env === 'LIVE') {
          console.error('[WALLPAPER-REPO] LIVE Firestore wallpaper fetch failed:', err);
        } else {
          console.warn('[WALLPAPER-REPO] DEMO Firestore wallpaper fetch timed out or failed, using memory/local cache.');
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
        continue;
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
        continue;
      }

      seenIds.add(wp.wallpaperId);
      seenAssets.add(norm);
      results.push(wp);
    }

    return results.length > 0 ? results : SYSTEM_DEFAULT_WALLPAPERS;
  }

  /**
   * Gets single wallpaper by ID.
   * PHASE 2 ORDER:
   * 1. Check memoryWallpapers FIRST for zero-latency resolution.
   * 2. If missing, query Firestore with bounded timeout.
   * 3. Graceful fallback on DEMO, deterministic error on LIVE.
   */
  public async getWallpaperById(wallpaperId: string): Promise<WallpaperRecord | null> {
    // 1. Check memoryWallpapers FIRST
    const cached = this.memoryWallpapers.get(wallpaperId);
    if (cached && cached.wallpaperId && cached.assetUrl && cached.assetUrl.trim() !== '') {
      return cached;
    }

    // 2. Only query Firestore if not in memory
    const env = dbManager.getEnvironment();
    const firestore = dbManager.getFirestore();
    if (firestore) {
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        const found = await withFirestoreTimeout(async (ctx) => {
          const docRef = doc(firestore, WALLPAPERS_COLLECTION, wallpaperId);
          const docSnap = await getDoc(docRef);
          if (ctx.isTimedOut) return null;
          if (docSnap.exists()) {
            const data = docSnap.data() as WallpaperRecord;
            if (data.wallpaperId && data.assetUrl) {
              this.memoryWallpapers.set(data.wallpaperId, data);
              return data;
            }
          }
          return null;
        }, timeoutMs, `getWallpaperById(${wallpaperId})`);

        if (found) return found;
      } catch (err: any) {
        if (env === 'LIVE') {
          console.error(`[WALLPAPER-REPO] LIVE getWallpaperById(${wallpaperId}) failed:`, err);
          throw new Error(`Failed to retrieve wallpaper "${wallpaperId}" from authoritative database: ${err?.message || err}`);
        } else {
          console.warn(`[WALLPAPER-REPO] DEMO getWallpaperById(${wallpaperId}) timed out or failed, falling back to cache.`);
        }
      }
    }

    // 3. Fallback to memory or null
    return this.memoryWallpapers.get(wallpaperId) || null;
  }

  /**
   * Synchronously returns cached wallpaper record by ID for zero-latency lookups.
   */
  public getWallpaperByIdSync(wallpaperId: string): WallpaperRecord | null {
    return this.memoryWallpapers.get(wallpaperId) || null;
  }

  /**
   * Saves or updates static wallpaper record.
   * Sequence:
   * 1. Validate wallpaper record.
   * 2. Prepare asset via durable storage abstraction.
   * 3. Construct canonical WallpaperRecord.
   * 4. Update in-memory repository immediately.
   * 5. Persist local cache.
   * 6. DEMO: attempt Firestore sync without blocking UI.
   * 7. LIVE: authoritative Firestore persistence with bounded timeout.
   */
  public async saveWallpaper(record: WallpaperRecord, target?: WallpaperTarget): Promise<WallpaperRecord> {
    const startTime = Date.now();
    const env = dbManager.getEnvironment();
    const effectiveTarget = record.target || target || 'desktop';

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[WALLPAPER:APPLY] start action=saveWallpaper target=${effectiveTarget} wallpaperId=${record.wallpaperId} env=${env}`);
    }

    // 1. Validate wallpaper record
    if (!record || !record.wallpaperId) {
      throw new Error('Invalid wallpaper record: missing wallpaperId.');
    }
    if (!record.assetUrl || record.assetUrl.trim() === '') {
      throw new Error('Invalid wallpaper record: missing assetUrl.');
    }

    // 2. Prepare asset via durable storage abstraction
    let safeAssetUrl = record.assetUrl;
    if (safeAssetUrl && safeAssetUrl.startsWith('data:')) {
      safeAssetUrl = await wallpaperAssetStorage.uploadAsset(safeAssetUrl, record.name, env);
      if (process.env.NODE_ENV !== 'production') {
        console.info(`[WALLPAPER:APPLY] asset-prepared wallpaperId=${record.wallpaperId}`);
      }
    }

    // 3. Construct canonical WallpaperRecord
    const updated: WallpaperRecord = {
      ...record,
      target: effectiveTarget,
      assetUrl: safeAssetUrl,
      thumbnailUrl: record.thumbnailUrl && !record.thumbnailUrl.startsWith('data:') ? record.thumbnailUrl : safeAssetUrl,
      mode: 'STILL',
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    // 4. Update in-memory repository immediately
    this.memoryWallpapers.set(updated.wallpaperId, updated);

    // 5. Persist local cache
    this.persistCache(updated.ownerId, effectiveTarget);
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[WALLPAPER:APPLY] record-saved-local wallpaperId=${updated.wallpaperId}`);
    }

    // 6. DEMO vs 7. LIVE Firestore persistence
    const firestore = dbManager.getFirestore();
    if (firestore) {
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async () => {
          const docRef = doc(firestore, WALLPAPERS_COLLECTION, updated.wallpaperId);
          await setDoc(docRef, updated, { merge: true });
        }, timeoutMs, `saveWallpaper(${updated.wallpaperId})`);

        if (process.env.NODE_ENV !== 'production') {
          console.info(`[WALLPAPER:APPLY] record-saved wallpaperId=${updated.wallpaperId} env=${env}`);
        }
      } catch (err: any) {
        if (env === 'LIVE') {
          console.error(`[WALLPAPER:APPLY] failed operation=saveWallpaper environment=LIVE target=${effectiveTarget} wallpaperId=${updated.wallpaperId} durationMs=${Date.now() - startTime}`, err);
          // Rollback in-memory state on LIVE failure to prevent claiming false success
          this.memoryWallpapers.delete(updated.wallpaperId);
          this.persistCache(updated.ownerId, effectiveTarget);
          throw new Error('Failed to persist wallpaper to Cloud Firestore authoritative database: ' + (err?.message || err));
        } else {
          console.warn(`[WALLPAPER-REPO] DEMO Firestore sync timed out or failed for ${updated.wallpaperId}, continuing with local persistence.`);
        }
      }
    } else if (env === 'LIVE') {
      throw new Error('LIVE environment requires connected Cloud Firestore instance.');
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-updated', { 
        detail: { wallpaper: updated, target: effectiveTarget } 
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
    const env = dbManager.getEnvironment();

    if (firestore) {
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async (ctx) => {
          const selRef = doc(firestore, SELECTIONS_COLLECTION, selectionKey);
          const selSnap = await getDoc(selRef);
          if (ctx.isTimedOut) return;
          if (selSnap.exists()) {
            const selData = selSnap.data();
            if (selData?.wallpaperId) {
              const wp = await this.getWallpaperById(selData.wallpaperId);
              if (wp && wp.assetUrl && !ctx.isTimedOut) {
                this.memoryActiveSelections.set(selectionKey, wp.wallpaperId);
              }
            }
          }
        }, timeoutMs, `getActiveWallpaper(${selectionKey})`);
      } catch (e) {
        if (env === 'LIVE') {
          console.warn(`[WALLPAPER-REPO] Notice getting active wallpaper from Firestore:`, e);
        }
      }
    }

    // Try in-memory active selection
    let savedId = this.memoryActiveSelections.get(selectionKey);
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
   * Sets active wallpaper for user/tenant and target (desktop or login).
   * Strict isolation: only updates the specified target. Never cross-writes.
   * Emits canonical events exactly once after successful activation.
   */
  public async setActiveWallpaper(
    wallpaperId: string, 
    userId?: string,
    target: WallpaperTarget = 'desktop'
  ): Promise<WallpaperRecord> {
    const startTime = Date.now();
    const env = dbManager.getEnvironment();

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[WALLPAPER:APPLY] start action=setActiveWallpaper target=${target} wallpaperId=${wallpaperId} env=${env}`);
    }

    // 1. Resolve wallpaper from memory FIRST
    let wp = this.memoryWallpapers.get(wallpaperId);
    if (!wp) {
      // 2. If unavailable, bounded Firestore lookup
      wp = (await this.getWallpaperById(wallpaperId)) || undefined;
    }

    // 3. Validate wallpaper exists and has a valid asset URL
    if (!wp || !wp.assetUrl || wp.assetUrl.trim() === '') {
      throw new Error(`Wallpaper ID "${wallpaperId}" not found or has invalid asset.`);
    }

    const selectionKey = this.getSelectionKey(userId, target);
    const targetUser = target === 'login' ? 'global' : (userId || 'global');

    // 4. Update in-memory active selection
    const previousSelection = this.memoryActiveSelections.get(selectionKey);
    this.memoryActiveSelections.set(selectionKey, wp.wallpaperId);
    if (target === 'desktop' && userId) {
      this.memoryActiveSelections.set('global_desktop', wp.wallpaperId);
    }

    // 5. Persist local cache
    this.persistCache(userId, target);
    if (process.env.NODE_ENV !== 'production') {
      console.info(`[WALLPAPER:APPLY] selection-persisted-local target=${target} wallpaperId=${wp.wallpaperId}`);
    }

    // 6. DEMO vs 7. LIVE Firestore persistence
    const firestore = dbManager.getFirestore();
    if (firestore) {
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async () => {
          const selRef = doc(firestore, SELECTIONS_COLLECTION, selectionKey);
          await setDoc(selRef, {
            wallpaperId: wp!.wallpaperId,
            userId: targetUser,
            target: target,
            tenantId: wp!.tenantId || 'global',
            organizationId: wp!.organizationId || 'ORION_PLATFORM',
            environment: env,
            updatedAt: new Date().toISOString(),
          }, { merge: true });
        }, timeoutMs, `setActiveWallpaper(${selectionKey})`);

        if (process.env.NODE_ENV !== 'production') {
          console.info(`[WALLPAPER:APPLY] selection-persisted target=${target} wallpaperId=${wp.wallpaperId} env=${env}`);
        }
      } catch (err: any) {
        if (env === 'LIVE') {
          console.error(`[WALLPAPER:APPLY] failed operation=setActiveWallpaper environment=LIVE target=${target} wallpaperId=${wp.wallpaperId} durationMs=${Date.now() - startTime}`, err);
          // Rollback memory selection on LIVE failure
          if (previousSelection) {
            this.memoryActiveSelections.set(selectionKey, previousSelection);
          } else {
            this.memoryActiveSelections.delete(selectionKey);
          }
          this.persistCache(userId, target);
          throw new Error('Failed to set active wallpaper in Cloud Firestore: ' + (err?.message || err));
        } else {
          console.warn(`[WALLPAPER-REPO] DEMO Firestore selection sync timed out or failed for ${selectionKey}, continuing with local activation.`);
        }
      }
    } else if (env === 'LIVE') {
      throw new Error('LIVE environment requires connected Cloud Firestore instance.');
    }

    const targetWp: WallpaperRecord = {
      ...wp,
      target
    };

    if (process.env.NODE_ENV !== 'production') {
      console.info(`[ORION:WALLPAPER] target=${target} wallpaperId=${wp.wallpaperId} action=apply`);
      console.info(`[WALLPAPER:APPLY] completed target=${target} wallpaperId=${wp.wallpaperId} durationMs=${Date.now() - startTime}`);
    }

    // 8. Emit wallpaper events exactly once after successful activation
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
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async (ctx) => {
          const polRef = doc(firestore, POLICIES_COLLECTION, 'default');
          const polSnap = await getDoc(polRef);
          if (ctx.isTimedOut) return;
          if (polSnap.exists()) {
            this.memoryPolicy = { ...this.memoryPolicy, ...(polSnap.data() as WallpaperPolicy) };
          }
        }, timeoutMs, 'getPolicy');
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
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async () => {
          const polRef = doc(firestore, POLICIES_COLLECTION, 'default');
          await setDoc(polRef, this.memoryPolicy, { merge: true });
        }, timeoutMs, 'updatePolicy');
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
    const env = dbManager.getEnvironment();

    // 2. Active Wallpaper Protection & Target Isolation
    const currentLoginActive = this.memoryActiveSelections.get('global_login') || 
                               (typeof window !== 'undefined' ? (localStorage?.getItem('orion_active_wallpaper_id_login') || sessionStorage?.getItem('orion_active_wallpaper_id_login')) : null);
    if (currentLoginActive === wallpaperId) {
      await this.setActiveWallpaper(DEFAULT_LOGIN_WALLPAPER.wallpaperId, undefined, 'login');
      if (currentTarget === 'login' || !currentTarget) {
        replacement = DEFAULT_LOGIN_WALLPAPER;
      }
    }

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

    // 3. Delete from Firestore if configured with timeout
    const firestore = dbManager.getFirestore();
    if (firestore) {
      const timeoutMs = env === 'DEMO' ? DEMO_FIRESTORE_TIMEOUT_MS : DEFAULT_FIRESTORE_TIMEOUT_MS;
      try {
        await withFirestoreTimeout(async () => {
          const docRef = doc(firestore, WALLPAPERS_COLLECTION, wallpaperId);
          await deleteDoc(docRef);
        }, timeoutMs, `deleteWallpaper(${wallpaperId})`);
      } catch (err) {
        console.warn('[WALLPAPER-REPO] Firestore delete error:', err);
        if (env === 'LIVE') {
          throw new Error('Failed to delete wallpaper from Cloud Firestore: ' + (err as any)?.message);
        }
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
