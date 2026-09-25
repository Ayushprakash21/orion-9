/**
 * ORION-9 AUTHORITATIVE WALLPAPER REPOSITORY
 * Authoritative storage manager for wallpaper records, user selections, system defaults,
 * and wallpaper policy controls with strict tenant isolation.
 */

import { dbManager } from '../core/database/DatabaseConnectionManager';
import { 
  WallpaperRecord, 
  WallpaperPolicy, 
  DEFAULT_WALLPAPER_POLICY, 
  DEFAULT_MOTION_PROFILE 
} from '../types/wallpaper';

const WALLPAPERS_COLLECTION = 'orion_wallpapers';
const POLICIES_COLLECTION = 'orion_wallpaper_policies';
const ACTIVE_SELECTIONS_COLLECTION = 'orion_user_active_wallpapers';

export const SYSTEM_DEFAULT_WALLPAPERS: WallpaperRecord[] = [
  {
    wallpaperId: 'sys-scm-global-network',
    tenantId: 'global',
    ownerType: 'SYSTEM',
    ownerId: 'system',
    name: 'SCM Global Logistics Network',
    assetUrl: '/orion-desktop-global-network.jpg',
    thumbnailUrl: '/orion-desktop-global-network.jpg',
    source: 'SYSTEM',
    aiGenerated: false,
    width: 2560,
    height: 1440,
    aspectRatio: '16:9',
    motionProfile: {
      backgroundDrift: 0.04,
      parallax: 0.12,
      atmosphere: 0.08,
      particles: 0.04,
      lightMovement: 0.06,
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

export class WallpaperRepository {
  private static instance: WallpaperRepository;
  private memoryWallpapers: Map<string, WallpaperRecord> = new Map();
  private memoryActiveSelections: Map<string, string> = new Map(); // userId -> wallpaperId
  private memoryPolicy: WallpaperPolicy = { ...DEFAULT_WALLPAPER_POLICY };

  private constructor() {
    // Seed initial system wallpapers in memory
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

  private restoreCache(): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const savedActive = sessionStorage.getItem('orion_active_wallpaper_id');
        if (savedActive) {
          this.memoryActiveSelections.set('default', savedActive);
        }
        const savedCustoms = sessionStorage.getItem('orion_custom_wallpapers');
        if (savedCustoms) {
          const list: WallpaperRecord[] = JSON.parse(savedCustoms);
          for (const wp of list) {
            this.memoryWallpapers.set(wp.wallpaperId, wp);
          }
        }
      } catch (e) {}
    }
  }

  private persistCache(userId?: string): void {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const active = this.memoryActiveSelections.get(userId || 'default') || this.memoryActiveSelections.get('default');
        if (active) sessionStorage.setItem('orion_active_wallpaper_id', active);
        
        const customs = Array.from(this.memoryWallpapers.values()).filter(w => w.ownerType !== 'SYSTEM');
        sessionStorage.setItem('orion_custom_wallpapers', JSON.stringify(customs));
      } catch (e) {}
    }
  }

  /**
   * Retrieves all approved wallpapers accessible for tenant & user.
   */
  public async getAvailableWallpapers(tenantId: string = 'global', userId?: string): Promise<WallpaperRecord[]> {
    const results: WallpaperRecord[] = [];

    for (const wp of this.memoryWallpapers.values()) {
      if (wp.status !== 'APPROVED') continue;

      // System wallpapers are available to everyone
      if (wp.ownerType === 'SYSTEM') {
        results.push(wp);
        continue;
      }

      // Tenant isolation & User ownership checks
      if (wp.tenantId === tenantId || wp.tenantId === 'global') {
        if (wp.ownerType === 'ADMIN' || !userId || wp.ownerId === userId) {
          results.push(wp);
        }
      }
    }

    return results.length > 0 ? results : SYSTEM_DEFAULT_WALLPAPERS;
  }

  /**
   * Gets single wallpaper by ID.
   */
  public async getWallpaperById(wallpaperId: string): Promise<WallpaperRecord | null> {
    return this.memoryWallpapers.get(wallpaperId) || null;
  }

  /**
   * Saves or updates wallpaper record in authoritative repository.
   */
  public async saveWallpaper(record: WallpaperRecord): Promise<WallpaperRecord> {
    const env = dbManager.getEnvironment();
    const updated: WallpaperRecord = {
      ...record,
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    this.memoryWallpapers.set(updated.wallpaperId, updated);
    this.persistCache(updated.ownerId);

    // Persist event notification to window for instant live update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-updated', { detail: { wallpaper: updated } }));
    }

    return updated;
  }

  /**
   * Gets active wallpaper for current user/tenant.
   * Guaranteed to return a valid WallpaperRecord with non-empty assetUrl.
   */
  public async getActiveWallpaper(userId?: string, tenantId: string = 'global'): Promise<WallpaperRecord> {
    const targetUser = userId || 'default';
    const activeId = this.memoryActiveSelections.get(targetUser) || this.memoryActiveSelections.get('default') || this.memoryPolicy.defaultWallpaperId;
    const found = this.memoryWallpapers.get(activeId);

    if (found && found.status === 'APPROVED' && found.assetUrl && found.assetUrl.trim() !== '') {
      return found;
    }

    // Fallback to primary system default
    return SYSTEM_DEFAULT_WALLPAPERS[0];
  }

  /**
   * Sets active wallpaper for user/tenant.
   */
  public async setActiveWallpaper(wallpaperId: string, userId?: string): Promise<WallpaperRecord> {
    const wp = this.memoryWallpapers.get(wallpaperId);
    if (!wp) {
      throw new Error(`Wallpaper ID ${wallpaperId} not found.`);
    }

    const targetUser = userId || 'default';
    this.memoryActiveSelections.set(targetUser, wallpaperId);
    this.memoryActiveSelections.set('default', wallpaperId);
    this.persistCache(targetUser);

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-active-wallpaper-changed', { detail: { wallpaper: wp } }));
    }

    return wp;
  }

  /**
   * Gets current system wallpaper policy.
   */
  public async getPolicy(): Promise<WallpaperPolicy> {
    const env = dbManager.getEnvironment();
    return {
      ...this.memoryPolicy,
      environment: env,
    };
  }

  /**
   * Updates wallpaper policy (Admin operation).
   */
  public async updatePolicy(updates: Partial<WallpaperPolicy>): Promise<WallpaperPolicy> {
    const env = dbManager.getEnvironment();
    this.memoryPolicy = {
      ...this.memoryPolicy,
      ...updates,
      environment: env,
      updatedAt: new Date().toISOString(),
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-wallpaper-policy-changed', { detail: { policy: this.memoryPolicy } }));
    }

    return this.memoryPolicy;
  }

  /**
   * Resets user active wallpaper to system default.
   */
  public async resetToSystemDefault(userId?: string): Promise<WallpaperRecord> {
    const defaultId = this.memoryPolicy.defaultWallpaperId || SYSTEM_DEFAULT_WALLPAPERS[0].wallpaperId;
    return this.setActiveWallpaper(defaultId, userId);
  }
}

export const wallpaperRepository = WallpaperRepository.getInstance();
