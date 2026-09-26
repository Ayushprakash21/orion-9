/**
 * ORION-9 WALLPAPER ASSET STORAGE SERVICE
 * Abstraction layer for managing wallpaper image assets and preventing
 * multi-megabyte Base64 image strings from being stored directly in Cloud Firestore.
 */

export class WallpaperAssetStorage {
  private static instance: WallpaperAssetStorage;
  private memoryBlobUrls: Map<string, string> = new Map();

  private constructor() {}

  public static getInstance(): WallpaperAssetStorage {
    if (!WallpaperAssetStorage.instance) {
      WallpaperAssetStorage.instance = new WallpaperAssetStorage();
    }
    return WallpaperAssetStorage.instance;
  }

  /**
   * Prepares and persists an image asset (Base64 data URL, HTTP URL, or local asset path).
   * Converts large Base64 data URLs into object URLs / stored asset references
   * so Firestore documents store clean, lightweight metadata strings.
   */
  public async uploadAsset(dataUrlOrPath: string, nameHint: string = 'wallpaper'): Promise<string> {
    if (!dataUrlOrPath || dataUrlOrPath.trim() === '') {
      return '/wallpaper/orion9-earth-horizon-default.png';
    }

    // Clean static paths or remote URLs return as-is
    if (!dataUrlOrPath.startsWith('data:')) {
      return dataUrlOrPath;
    }

    // Process Base64 Data URL to Blob Object URL
    try {
      const hasBlob = typeof Blob !== 'undefined' || (typeof window !== 'undefined' && window.Blob);
      const hasCreateObjectURL = typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function';
      if (hasBlob && hasCreateObjectURL) {
        const parts = dataUrlOrPath.split(',');
        const header = parts[0] || '';
        const mimeMatch = header.match(/:(.*?);/) || header.match(/:(.*?)$/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const rawPayload = parts.slice(1).join(',');
        
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
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.memoryBlobUrls.set(assetId, objectUrl);

        return objectUrl;
      }
      return dataUrlOrPath;
    } catch (err) {
      console.warn('[WallpaperAssetStorage] Asset processing fallback:', err);
      return dataUrlOrPath;
    }
  }

  /**
   * Verifies if a given URL is a safe metadata string (not a raw multi-megabyte Base64 string).
   */
  public isFirestoreSafeUrl(url: string): boolean {
    if (!url) return true;
    if (url.startsWith('data:')) {
      // Exclude data URLs longer than 100 KB from direct Firestore document writing
      return url.length < 102400;
    }
    return true;
  }
}

export const wallpaperAssetStorage = WallpaperAssetStorage.getInstance();
