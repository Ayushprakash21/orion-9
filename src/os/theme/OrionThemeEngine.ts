import { OrionTheme, OrionAppearancePreferences, OrionThemeId } from './OrionThemeTypes';
import { getTheme, resolveCompatibleTheme, isThemeCompatibleWithMode } from './OrionThemeRegistry';
import { DEFAULT_PREFERENCES } from './OrionThemeTypes';
import { loadPreferences, savePreferences } from './OrionThemeStorage';
import { applyThemeToDOM } from './OrionThemeCSS';

type ChangeCallback = () => void;

/**
 * The core engine orchestrating the Orion theme system
 */
export class OrionThemeEngine {
  private preferences: OrionAppearancePreferences;
  private listeners: Set<ChangeCallback> = new Set();
  
  constructor() {
    this.preferences = loadPreferences();
    this.ensureThemeCompatibility();
  }

  /** Reloads preferences from storage and reapplies */
  public reloadFromStorage(): void {
    this.preferences = loadPreferences();
    this.ensureThemeCompatibility();
    this.apply();
    this.notify();
  }

  /** Ensures internal preferences state maintains theme and mode harmony */
  private ensureThemeCompatibility(): void {
    let mode = this.preferences.appearanceMode;
    if (mode === 'auto') {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = prefersDark ? 'dark' : 'light';
    }

    if (!isThemeCompatibleWithMode(this.preferences.themeId, mode)) {
      this.preferences.themeId = mode === 'dark' ? 'graphite' : 'silver';
    }
  }

  /** Gets the current preferences */
  public getPreferences(): OrionAppearancePreferences {
    return { ...this.preferences };
  }

  /** Gets the explicit theme selected */
  public getTheme(): OrionTheme {
    return getTheme(this.preferences.themeId);
  }

  /** Gets the resolved theme (handling auto mode) */
  public getResolvedTheme(): OrionTheme {
    let mode = this.preferences.appearanceMode;
    if (mode === 'auto') {
      const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
      mode = prefersDark ? 'dark' : 'light';
    }

    return resolveCompatibleTheme(this.preferences.themeId, mode);
  }

  /** Updates the active theme ID */
  public setTheme(id: OrionThemeId): void {
    const targetTheme = getTheme(id);
    this.preferences.themeId = id;
    this.preferences.appearanceMode = targetTheme.appearance.mode;
    this.persistAndApply();
  }

  /** Updates a single preference */
  public setPreference<K extends keyof OrionAppearancePreferences>(key: K, value: OrionAppearancePreferences[K]): void {
    this.preferences[key] = value;

    if (key === 'appearanceMode') {
      const mode = value as OrionAppearancePreferences['appearanceMode'];
      let effectiveMode: 'light' | 'dark';
      if (mode === 'auto') {
        const prefersDark = typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
        effectiveMode = prefersDark ? 'dark' : 'light';
      } else {
        effectiveMode = mode;
      }

      // Synchronize themeId with effective mode
      if (!isThemeCompatibleWithMode(this.preferences.themeId, effectiveMode)) {
        this.preferences.themeId = effectiveMode === 'dark' ? 'graphite' : 'silver';
      }
    }

    this.persistAndApply();
  }

  /** Resets preferences to default */
  public resetToDefaults(): void {
    this.preferences = { ...DEFAULT_PREFERENCES };
    this.persistAndApply();
  }

  /** Applies the current theme and preferences to the DOM */
  public apply(): void {
    applyThemeToDOM(this.getResolvedTheme(), this.preferences);
  }

  /** Returns the active accent color (custom or theme default) */
  public getResolvedAccent(): string {
    const theme = this.getResolvedTheme();
    if (this.preferences.customAccentEnabled && this.preferences.customAccent) {
      return this.preferences.customAccent;
    }
    return theme.colors.accent;
  }

  /** Returns whether the currently resolved theme is dark */
  public isDark(): boolean {
    return this.getResolvedTheme().appearance.mode === 'dark';
  }

  /** Register an onChange callback */
  public onChange(callback: ChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private persistAndApply(): void {
    savePreferences(this.preferences);
    this.apply();
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }
}
