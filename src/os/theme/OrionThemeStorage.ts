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
    prefs.themeId = 'graphite';
  }
  
  // Ensure version is correct
  prefs.version = 1;

  return prefs;
}

/**
 * Loads preferences from localStorage
 */
export function loadPreferences(): OrionAppearancePreferences {
  if (typeof window === 'undefined') {
    return { ...DEFAULT_PREFERENCES };
  }
  
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      return { ...DEFAULT_PREFERENCES };
    }
    const parsed = JSON.parse(data);
    return migratePreferences(parsed);
  } catch (error) {
    console.warn('Failed to load Orion theme preferences', error);
    return { ...DEFAULT_PREFERENCES };
  }
}

/**
 * Saves preferences to localStorage
 */
export function savePreferences(prefs: OrionAppearancePreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (error) {
    console.error('Failed to save Orion theme preferences', error);
  }
}

/**
 * Clears preferences from localStorage
 */
export function clearPreferences(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear Orion theme preferences', error);
  }
}
