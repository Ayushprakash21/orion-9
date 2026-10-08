/**
 * ORION-9 WALLPAPER ASSET STORAGE SERVICE
 * Abstraction layer for managing wallpaper image assets and preventing
 * multi-megabyte Base64 image strings from bloating Cloud Firestore while ensuring
 * durable asset persistence across page reloads.
 *
 * Strategy:
 * - LIVE: Uploads to Firebase Storage and returns permanent HTTPS download URL.
 * - DEMO / Local: Controlled IndexedDB (localforage) persistence backing object URLs,
 *   with re-hydration across sessions so local wallpapers remain durable across reloads.
 */

import localforage from 'localforage';
import { getFirebaseStorage } from '../../lib/firebaseClient';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';

export interface StoredWallpaperAsset {
  id: string;
  name: string;
  dataUrl: string;
  mime: string;
  createdAt: string;
}

export class WallpaperAssetStorage {
  private static instance: WallpaperAssetStorage;
  private localStore: LocalForage;
  private memoryBlobUrls: Map<string, string> = new Map(); // assetId -> objectUrl
  private assetIdByUrl: Map<string, string> = new Map();   // objectUrl -> assetId

  private constructor() {
    this.localStore = localforage.createInstance({
      name: 'Orion_Wallpaper_Storage',
      storeName: 'wallpaper_assets',
    });
  }

  public static getInstance(): WallpaperAssetStorage {
    if (!WallpaperAssetStorage.instance) {
      WallpaperAssetStorage.instance = new WallpaperAssetStorage();
    }
    return WallpaperAssetStorage.instance;
  }

  /**
   * Prepares and persists an image asset (Base64 data URL, HTTP URL, or local asset path).
   * - LIVE: Persists to Firebase Storage and returns permanent HTTPS download URL.
   * - DEMO/Local: Persists full payload to IndexedDB (localforage) and returns durable object URL.
   * Never leaves raw multi-megabyte Base64 in Firestore metadata.
   */
  public async uploadAsset(
    dataUrlOrPath: string, 
    nameHint: string = 'wallpaper', 
    environment: string = 'DEMO'
  ): Promise<string> {
    if (!dataUrlOrPath || dataUrlOrPath.trim() === '') {
      return '/wallpaper/orion9-earth-horizon-default.png';
    }

    // Clean static paths or remote HTTPS URLs return as-is
    if (!dataUrlOrPath.startsWith('data:')) {
      return dataUrlOrPath;
    }

    const env = (environment || 'DEMO').toUpperCase();

    // 1. LIVE Environment: Authoritative durable storage via Firebase Storage
    if (env === 'LIVE') {
      try {
        const storage = getFirebaseStorage('LIVE');
        if (storage) {
          const cleanName = nameHint.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
          const assetPath = `wallpapers/live_${Date.now()}_${cleanName}.png`;
          const storageRef = ref(storage, assetPath);
          await uploadString(storageRef, dataUrlOrPath, 'data_url');
          const downloadUrl = await getDownloadURL(storageRef);
          return downloadUrl;
        }
      } catch (err: any) {
        console.error('[WallpaperAssetStorage] LIVE durable storage upload failed:', err);
        throw new Error('Failed to persist wallpaper asset to durable Cloud Storage: ' + (err?.message || err));
      }
    }

    // 2. DEMO / Local Environment: Controlled IndexedDB persistence + session Object URL
    const assetId = `wp_asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const parts = dataUrlOrPath.split(',');
    const header = parts[0] || '';
    const mimeMatch = header.match(/:(.*?);/) || header.match(/:(.*?)$/);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const rawPayload = parts.slice(1).join(',');

    try {
      await this.localStore.setItem(assetId, {
        id: assetId,
        name: nameHint,
        dataUrl: dataUrlOrPath,
        mime,
        createdAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[WallpaperAssetStorage] IndexedDB asset save notice:', e);
    }

    // Convert Base64 payload to Blob and Object URL for active browser runtime
    try {
      const hasBlob = typeof Blob !== 'undefined' || (typeof window !== 'undefined' && (window as any).Blob);
      const hasCreateObjectURL = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
      if (hasBlob && hasCreateObjectURL) {
        let blob: Blob;
        if (header.includes(';base64')) {
          const bstr = typeof atob === 'function' ? atob(rawPayload) : Buffer.from(rawPayload, 'base64').toString('binary');
          let n = bstr.length;
          const u8arr = new Uint8Array(n);
          while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
          }
          blob = new Blob([u8arr], { type: mime });
        } else {
          const text = decodeURIComponent(rawPayload);
          blob = new Blob([text], { type: mime });
        }

        const objectUrl = URL.createObjectURL(blob);
        this.memoryBlobUrls.set(assetId, objectUrl);
        this.assetIdByUrl.set(objectUrl, assetId);
        return objectUrl;
      }
    } catch (err) {
      console.warn('[WallpaperAssetStorage] Object URL generation notice:', err);
    }

    return dataUrlOrPath;
  }

  /**
   * Re-hydrates an asset from IndexedDB if a session object URL has expired or after reload.
   */
  public async rehydrateAsset(assetIdOrUrl: string): Promise<string | null> {
    const assetId = this.assetIdByUrl.get(assetIdOrUrl) || assetIdOrUrl;
    const cached = this.memoryBlobUrls.get(assetId);
    if (cached) return cached;

    try {
      const stored = await this.localStore.getItem<StoredWallpaperAsset>(assetId);
      if (stored && stored.dataUrl) {
        return this.uploadAsset(stored.dataUrl, stored.name, 'DEMO');
      }
    } catch (e) {}

    return null;
  }

  /**
   * Verifies if a given URL is a safe metadata string (not a raw multi-megabyte string).
   */
  public isFirestoreSafeUrl(url: string): boolean {
    if (!url) return true;
    if (url.startsWith('data:')) {
      // Exclude data URLs longer than 256 KB from direct Firestore document writing
      return url.length < 262144;
    }
    return true;
  }
}

export const wallpaperAssetStorage = WallpaperAssetStorage.getInstance();
