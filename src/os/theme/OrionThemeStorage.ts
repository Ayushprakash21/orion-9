import { OrionAppearancePreferences, DEFAULT_PREFERENCES, OrionThemeId, CANONICAL_APPEARANCE_PREFERENCES_VERSION } from './OrionThemeTypes';
import { isValidThemeId } from './OrionThemeRegistry';

export const STORAGE_KEY = 'orion-appearance-preferences';

/**
 * Migrates older preferences objects to the current version
 */
export function migratePreferences(raw: unknown): OrionAppearancePreferences {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_PREFERENCES };
  }

  const rawObj = raw as any;
  const prefs = { ...DEFAULT_PREFERENCES, ...rawObj } as OrionAppearancePreferences;
  
  if (!isValidThemeId(prefs.themeId)) {
    // If an appearanceMode was specified in raw or legacy config
    if (rawObj.appearanceMode === 'light') {
      prefs.themeId = 'silver';
    } else {
      prefs.themeId = 'graphite';
    }
  }

  // Idempotent migration from legacy accentKey to canonical customAccent
  if (rawObj.accentKey && !rawObj.customAccent) {
    const ACCENT_PRESET_MAP: Record<string, string> = {
      green: '#5FAF8A',
      blue: '#7BA3C9',
      orange: '#C6A15B',
      purple: '#B07DA3',
      teal: '#6DBAB0',
      red: '#C96B72',
      indigo: '#7B8EC9',
      pink: '#C97BA8',
      neutral: '#D8DDE3',
    };

    if (rawObj.accentKey === 'custom' && rawObj.customAccentHex) {
      prefs.customAccentEnabled = true;
      prefs.customAccent = rawObj.customAccentHex;
    } else if (ACCENT_PRESET_MAP[rawObj.accentKey]) {
      prefs.customAccentEnabled = true;
      prefs.customAccent = ACCENT_PRESET_MAP[rawObj.accentKey];
    }
  }

  // Validate morphismMode
  if (!['glass', 'clay', 'neumorphic'].includes(prefs.morphismMode)) {
    prefs.morphismMode = 'glass';
  }
  
  // Detect schema version. Canonical schema version is >= 2.
  // Pre-fix versions (< 2 or undefined) suffered from a bug where legacy migration
  // converted missing dockAutoHide to false (Boolean(undefined) === false).
  // Therefore, for pre-fix versions, normalize dockAutoHide to TRUE.
  // Only when raw explicitly has appearancePreferencesVersion >= 2 do we preserve an explicit user choice.
  const isCurrentSchema = typeof rawObj.appearancePreferencesVersion === 'number' && rawObj.appearancePreferencesVersion >= CANONICAL_APPEARANCE_PREFERENCES_VERSION;

  if (isCurrentSchema) {
    if (rawObj.dockAutoHide !== undefined) {
      prefs.dockAutoHide = Boolean(rawObj.dockAutoHide);
    } else {
      prefs.dockAutoHide = true;
    }
  } else {
    // Stale/legacy preference record: normalize to canonical default true
    prefs.dockAutoHide = true;
  }

  // Ensure version markers are correct
  prefs.version = 1;
  prefs.appearancePreferencesVersion = CANONICAL_APPEARANCE_PREFERENCES_VERSION;

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
      const migrated = migratePreferences(parsed);
      // Safe one-time migration for stale pre-fix preference state in browser storage
      if (!parsed || typeof parsed.appearancePreferencesVersion !== 'number' || parsed.appearancePreferencesVersion < CANONICAL_APPEARANCE_PREFERENCES_VERSION) {
        savePreferences(migrated);
      }
      return migrated;
    }

    // Secondary fallback: check 'orion_settings' legacy config
    const legacyData = storage.getItem('orion_settings');
    if (legacyData) {
      const parsedLegacy = JSON.parse(legacyData);
      if (parsedLegacy && parsedLegacy.personalization) {
        const p = parsedLegacy.personalization;
        const migrated = migratePreferences({
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
        savePreferences(migrated);
        return migrated;
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
    const toSave: OrionAppearancePreferences = {
      ...prefs,
      version: 1,
      appearancePreferencesVersion: CANONICAL_APPEARANCE_PREFERENCES_VERSION,
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
      window.dispatchEvent(new CustomEvent('orion-appearance-preferences-changed', { detail: toSave }));
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

