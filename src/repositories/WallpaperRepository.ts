/**
 * ORION-9 AUTHORITATIVE WALLPAPER REPOSITORY
 * Authoritative storage manager for wallpaper records, user selections, system defaults,
 * and wallpaper policy controls with Cloud Firestore authoritative persistence & strict tenant isolation.
 */

import { dbManager } from '../core/database/DatabaseConnectionManager';
import { 
  WallpaperRecord, 
  WallpaperPolicy, 
  DEFAULT_WALLPAPER_POLICY, 
  DEFAULT_MOTION_PROFILE 
} from '../types/wallpaper';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

const WALLPAPERS_COLLECTION = 'wallpapers';
const POLICIES_COLLECTION = 'wallpaperPolicies';
const SELECTIONS_COLLECTION = 'wallpaperSelections';

const ORION_AURORA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1440" viewBox="0 0 2560 1440"><defs><radialGradient id="sp1" cx="50%" cy="50%" r="70%"><stop offset="0%" stop-color="%23091322"/><stop offset="50%" stop-color="%23050a14"/><stop offset="100%" stop-color="%23010307"/></radialGradient><radialGradient id="sp2" cx="75%" cy="30%" r="50%"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.25"/><stop offset="50%" stop-color="%231e3a8a" stop-opacity="0.10"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs><rect width="2560" height="1440" fill="url(%23sp1)"/><rect width="2560" height="1440" fill="url(%23sp2)"/><g stroke="%2393c5fd" stroke-opacity="0.25" stroke-width="1.5"><line x1="1817" y1="259" x2="2150" y2="273"/><line x1="1817" y1="259" x2="1971" y2="187"/><line x1="2150" y1="273" x2="1971" y2="187"/><line x1="1817" y1="259" x2="1894" y2="475"/><line x1="2150" y1="273" x2="2124" y2="446"/><line x1="1894" y1="475" x2="1996" y2="460"/><line x1="1996" y1="460" x2="2124" y2="446"/><line x1="1894" y1="475" x2="1868" y2="691"/><line x1="2124" y1="446" x2="2201" y2="676"/><line x1="1868" y1="691" x2="2201" y2="676"/></g><circle cx="1817" cy="259" r="6" fill="%23f97316"/><circle cx="2150" cy="273" r="5" fill="%2393c5fd"/><circle cx="1894" cy="475" r="5" fill="%2360a5fa"/><circle cx="1996" cy="460" r="5" fill="%2393c5fd"/><circle cx="2124" cy="446" r="5" fill="%23bfdbfe"/><circle cx="1868" cy="691" r="5" fill="%2393c5fd"/><circle cx="2201" cy="676" r="7" fill="%23a5f3fc"/></svg>`;

export const SYSTEM_DEFAULT_WALLPAPERS: WallpaperRecord[] = [
  {
    wallpaperId: 'sys-orion-aurora-space',
    tenantId: 'global',
    ownerType: 'SYSTEM',
    ownerId: 'system',
    name: 'Orion Aurora Space Environment',
    assetUrl: '/wallpaper/orion9-earth-horizon-default.png',
    thumbnailUrl: '/wallpaper/orion9-earth-horizon-default.png',
    source: 'SYSTEM',
    aiGenerated: false,
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    motionProfile: {
      backgroundDrift: 0.05,
      parallax: 0.12,
      atmosphere: 0.10,
      particles: 0.05,
      lightMovement: 0.08,
      objectMotion: 0.03,
    },
    runtimeReactive: true,
    environment: 'DEMO',
    status: 'APPROVED',
    isSystemDefault: true,
    createdAt: new Date(1700000000000).toISOString(),
    updatedAt: new Date(1700000000000).toISOString(),
  },
  {
    wallpaperId: 'sys-deep-orion-nebula',
    tenantId: 'global',
    ownerType: 'SYSTEM',
    ownerId: 'system',
    name: 'Deep Orion Atmospheric Nebula',
    assetUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1440" viewBox="0 0 2560 1440"><defs><radialGradient id="n1" cx="60%" cy="35%" r="65%"><stop offset="0%" stop-color="%231e3a8a" stop-opacity="0.95"/><stop offset="45%" stop-color="%230f172a" stop-opacity="0.98"/><stop offset="100%" stop-color="%23010307"/></radialGradient><radialGradient id="n2" cx="30%" cy="60%" r="45%"><stop offset="0%" stop-color="%230284c7" stop-opacity="0.35"/><stop offset="100%" stop-color="transparent"/></radialGradient></defs><rect width="2560" height="1440" fill="url(%23n1)"/><rect width="2560" height="1440" fill="url(%23n2)"/></svg>',
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%230f172a"/><circle cx="200" cy="70" r="90" fill="%231e3a8a" opacity="0.8"/></svg>',
    source: 'SYSTEM',
    aiGenerated: false,
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    motionProfile: {
      backgroundDrift: 0.06,
      parallax: 0.15,
      atmosphere: 0.14,
      particles: 0.08,
      lightMovement: 0.10,
      objectMotion: 0.04,
    },
    runtimeReactive: true,
    environment: 'DEMO',
    status: 'APPROVED',
    createdAt: new Date(1700000000000).toISOString(),
    updatedAt: new Date(1700000000000).toISOString(),
  },
  {
    wallpaperId: 'sys-orbital-grid-node',
    tenantId: 'global',
    ownerType: 'SYSTEM',
    ownerId: 'system',
    name: 'Orbital Control Tower Grid',
    assetUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="2560" height="1440" viewBox="0 0 2560 1440"><defs><radialGradient id="g1" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="%230369a1" stop-opacity="0.30"/><stop offset="100%" stop-color="%2302050a"/></radialGradient></defs><rect width="2560" height="1440" fill="%2302050a"/><rect width="2560" height="1440" fill="url(%23g1)"/></svg>',
    thumbnailUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%2302050a"/><circle cx="160" cy="90" r="70" fill="%230369a1" opacity="0.4"/></svg>',
    source: 'SYSTEM',
    aiGenerated: false,
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    motionProfile: {
      backgroundDrift: 0.03,
      parallax: 0.10,
      atmosphere: 0.05,
      particles: 0.03,
      lightMovement: 0.08,
      objectMotion: 0.02,
    },
    runtimeReactive: true,
    environment: 'DEMO',
    status: 'APPROVED',
    createdAt: new Date(1700000000000).toISOString(),
    updatedAt: new Date(1700000000000).toISOString(),
  },
];

import { wallpaperAssetStorage } from '../services/wallpaper/WallpaperAssetStorage';

export type WallpaperTarget = 'login' | 'desktop';

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
        const savedActiveLegacy = storage?.getItem('orion_active_wallpaper_id') || sessionStorage?.getItem('orion_active_wallpaper_id');
        const savedDesktop = this.memoryActiveSelections.get('global_desktop');
        if (savedActiveLegacy && !savedDesktop) {
          this.memoryActiveSelections.set('default_desktop', savedActiveLegacy);
        }
        const savedCustoms = storage?.getItem('orion_custom_wallpapers') || sessionStorage?.getItem('orion_custom_wallpapers');
        if (savedCustoms) {
          const list: WallpaperRecord[] = JSON.parse(savedCustoms);
          for (const wp of list) {
            this.memoryWallpapers.set(wp.wallpaperId, wp);
          }
        }
      } catch (e) {}
    }
  }

  private persistCache(userId?: string, target?: WallpaperTarget): void {
    if (typeof window !== 'undefined') {
      try {
        const loginActive = this.memoryActiveSelections.get('global_login');
        if (loginActive) {
          localStorage?.setItem('orion_active_wallpaper_id_login', loginActive);
          sessionStorage?.setItem('orion_active_wallpaper_id_login', loginActive);
        }
        const userKey = userId || 'global';
        const desktopActive = this.memoryActiveSelections.get(`${userKey}_desktop`) || this.memoryActiveSelections.get('global_desktop');
        if (desktopActive) {
          localStorage?.setItem(`orion_active_wallpaper_id_desktop_${userKey}`, desktopActive);
          sessionStorage?.setItem(`orion_active_wallpaper_id_desktop_${userKey}`, desktopActive);
        }
        
        const customs = Array.from(this.memoryWallpapers.values()).filter(w => w.ownerType !== 'SYSTEM');
        localStorage?.setItem('orion_custom_wallpapers', JSON.stringify(customs));
        sessionStorage?.setItem('orion_custom_wallpapers', JSON.stringify(customs));
      } catch (e) {}
    }
  }

  /**
   * Retrieves all approved wallpapers accessible for tenant & user.
   */
  public async getAvailableWallpapers(tenantId: string = 'global', userId?: string): Promise<WallpaperRecord[]> {
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
              this.memoryWallpapers.set(data.wallpaperId, data);
            }
          });
        }
      } catch (err) {
        if (env === 'LIVE') {
          console.error('[WALLPAPER-REPO] Firestore wallpaper fetch failed:', err);
        }
      }
    }

    const results: WallpaperRecord[] = [];
    for (const wp of this.memoryWallpapers.values()) {
      if (wp.status !== 'APPROVED') continue;
      if (wp.ownerType === 'SYSTEM') {
        results.push(wp);
        continue;
      }
      if (wp.tenantId === tenantId || wp.tenantId === 'global') {
        if (wp.ownerType === 'ADMIN' || !userId || wp.ownerId === userId) {
          results.push(wp);
        }
      }
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
   * Saves or updates wallpaper record in Cloud Firestore authoritative repository.
   * Intercepts large Base64 images to prevent multi-megabyte payloads in Firestore.
   */
  public async saveWallpaper(record: WallpaperRecord): Promise<WallpaperRecord> {
    const env = dbManager.getEnvironment();
    
    // Process image asset string via storage abstraction
    let safeAssetUrl = record.assetUrl;
    if (safeAssetUrl && safeAssetUrl.startsWith('data:')) {
      safeAssetUrl = await wallpaperAssetStorage.uploadAsset(safeAssetUrl, record.name);
    }

    const updated: WallpaperRecord = {
      ...record,
      assetUrl: safeAssetUrl,
      thumbnailUrl: safeAssetUrl,
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
    this.persistCache(updated.ownerId);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-updated', { detail: { wallpaper: updated } }));
    }

    return updated;
  }

  /**
   * Gets active wallpaper for current user/tenant and target (desktop or login) from Cloud Firestore.
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
              return wp;
            }
          }
        }
      } catch (e) {}
    }

    const activeId =
      this.memoryActiveSelections.get(selectionKey) ||
      this.memoryActiveSelections.get(`default_${target}`) ||
      this.memoryPolicy.defaultWallpaperId;
    const found = this.memoryWallpapers.get(activeId);

    if (found && found.status === 'APPROVED' && found.assetUrl && found.assetUrl.trim() !== '') {
      return found;
    }

    return SYSTEM_DEFAULT_WALLPAPERS[0];
  }

  /**
   * Sets active wallpaper for user/tenant and target (desktop or login) in Cloud Firestore.
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
    this.persistCache(userId, target);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-active-wallpaper-changed', { 
        detail: { wallpaper: wp, target } 
      }));
    }

    return wp;
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
      } catch (e) {}
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
      } catch (e) {}
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
    const defaultId = this.memoryPolicy.defaultWallpaperId || SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId;
    return this.setActiveWallpaper(defaultId, userId, target);
  }
}

export const wallpaperRepository = WallpaperRepository.getInstance();

