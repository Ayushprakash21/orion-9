/**
 * ORION-9 WALLPAPER PRELOAD UTILITY
 * Asynchronously and non-blockingly preloads core system wallpapers and brand assets
 * into browser image cache so that desktop and authentication transitions render immediately
 * without exposing black frames.
 */

const PRELOAD_ASSETS = [
  '/wallpaper/orion9-desktop-horizon-moon.png',
  '/wallpaper/orion9-desktop-light.svg',
  '/wallpaper/orion9-earth-horizon-default.png',
  '/orion-9-official-logo.png',
];

const preloadedCache = new Set<string>();

/**
 * Preloads an image URL into browser cache
 */
export function preloadImage(url: string): Promise<boolean> {
  if (typeof window === 'undefined' || !url) return Promise.resolve(false);
  if (preloadedCache.has(url)) return Promise.resolve(true);

  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    if (img.complete) {
      preloadedCache.add(url);
      resolve(true);
      return;
    }
    img.onload = () => {
      preloadedCache.add(url);
      resolve(true);
    };
    img.onerror = () => {
      resolve(false);
    };
  });
}

/**
 * Immediately triggers preloading of all essential system assets.
 */
export function preloadCoreSystemAssets(): void {
  if (typeof window === 'undefined') return;
  for (const asset of PRELOAD_ASSETS) {
    preloadImage(asset).catch(() => {});
  }
}

// Automatically invoke on module evaluation in browser
if (typeof window !== 'undefined') {
  preloadCoreSystemAssets();
}
