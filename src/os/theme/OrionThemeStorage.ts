import { OrionAppearancePreferences, DEFAULT_PREFERENCES, OrionThemeId } from './OrionThemeTypes';
import { isValidThemeId } from './OrionThemeRegistry';

export const STORAGE_KEY = 'orion-appearance-preferences';

/**
 * Migrates older preferences objects to the current version
 */
export function migratePreferences(raw: unknown): OrionAppearancePreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const prefs = { ...DEFAULT_PREFERENCES, ...raw } as OrionAppearancePreferences;
  
  if (!isValidThemeId(prefs.themeId)) {
    // If an appearanceMode was specified in raw or legacy config
    if ((raw as any).appearanceMode === 'light') {
      prefs.themeId = 'silver';
    } else {
      prefs.themeId = 'graphite';
    }
  }

  // Validate morphismMode
  if (!['glass', 'clay', 'neumorphic'].includes(prefs.morphismMode)) {
    prefs.morphismMode = 'glass';
  }
  
  // Ensure version is correct
  prefs.version = 1;

  return prefs;
}


/**
 * Loads preferences from localStorage
 */
let inMemoryStorage: Record<string, string> = {};

function getSafeStorage() {
  if (typeof localStorage !== 'undefined') return localStorage;
  if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
  return {
    getItem: (key: string) => inMemoryStorage[key] ?? null,
    setItem: (key: string, val: string) => { inMemoryStorage[key] = val; },
    removeItem: (key: string) => { delete inMemoryStorage[key]; },
  };
}

/**
 * Loads preferences from storage
 */
export function loadPreferences(): OrionAppearancePreferences {
  const storage = getSafeStorage();
  
  try {
    const data = storage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return migratePreferences(parsed);
    }

    // Secondary fallback: check 'orion_settings' legacy config
    const legacyData = storage.getItem('orion_settings');
    if (legacyData) {
      const parsedLegacy = JSON.parse(legacyData);
      if (parsedLegacy && parsedLegacy.personalization) {
        const p = parsedLegacy.personalization;
        return migratePreferences({
          themeId: p.themeId || (p.appearanceMode === 'light' ? 'silver' : 'graphite'),
          appearanceMode: p.appearanceMode || 'dark',
          customAccentEnabled: p.accentKey === 'custom',
          customAccent: p.customAccentHex,
          transparencyEnabled: !p.reducedTransparency,
          transparencyIntensity: p.dockTransparency ?? 70,
          blurEnabled: (p.wallpaperBlur ?? 0) > 0,
          reduceMotion: Boolean(p.reducedMotion),
          windowStyle: p.windowStyle || 'standard',
          windowControlPosition: p.windowControlPosition || 'left',
          morphismMode: p.morphismMode || 'glass',
          dockPosition: p.dockPosition || 'bottom',
        });
      }
    }

    return { ...DEFAULT_PREFERENCES };
  } catch (error) {
    console.warn('Failed to load Orion theme preferences', error);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Saves preferences to storage
 */
export function savePreferences(prefs: OrionAppearancePreferences): void {
  const storage = getSafeStorage();
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', { detail: prefs }));
    }
  } catch (error) {
    console.error('Failed to save Orion theme preferences', error);
  }
}

/**
 * Clears preferences from storage
 */
export function clearPreferences(): void {
  const storage = getSafeStorage();
  try {
    storage.removeItem(STORAGE_KEY);
    inMemoryStorage = {};
  } catch (error) {
    console.error('Failed to clear Orion theme preferences', error);
  }
}

