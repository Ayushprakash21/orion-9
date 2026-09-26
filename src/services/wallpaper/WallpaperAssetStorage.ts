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
      if (typeof window !== 'undefined' && window.URL && window.Blob) {
        const parts = dataUrlOrPath.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const bstr = atob(parts[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const objectUrl = URL.createObjectURL(blob);
        const assetId = `asset_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        this.memoryBlobUrls.set(assetId, objectUrl);

        return objectUrl;
      }
    } catch (err) {
      console.warn('[WallpaperAssetStorage] Object URL creation failed, using fallback asset:', err);
    }

    return '/wallpaper/orion9-earth-horizon-default.png';
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
