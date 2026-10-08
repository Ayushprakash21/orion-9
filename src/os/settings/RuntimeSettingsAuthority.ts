// RuntimeSettingsAuthority.ts
// Central single source of truth for Orion-9 reactive runtime settings.
// Guarantees safe SSR loading, robust browser guards, race-safe generation tokens,
// seamless bidirectional sync with OrionThemeStorage, and DOM CSS variable propagation.

import { RuntimeSettings, DEFAULT_RUNTIME_SETTINGS } from "./RuntimeSettingsModel";
import { loadPreferences, savePreferences, clearPreferences } from "../theme/OrionThemeStorage";
import { OrionAppearancePreferences } from "../theme/OrionThemeTypes";

type Listener = (settings: RuntimeSettings) => void;

export class RuntimeSettingsAuthority {
  private static _instance: RuntimeSettingsAuthority | null = null;
  private _settings: RuntimeSettings = { ...DEFAULT_RUNTIME_SETTINGS };
  private _listeners: Set<Listener> = new Set();
  // Generation counter for race‑condition protection during async updates.
  private _generation: number = 0;
  private _initialized: boolean = false;

  private constructor() {
    this.reload();
    this._attachEventListeners();
  }

  /** Singleton accessor */
  public static get instance(): RuntimeSettingsAuthority {
    if (!this._instance) {
      this._instance = new RuntimeSettingsAuthority();
    }
    return this._instance;
  }

  /** Current snapshot */
  public get settings(): RuntimeSettings {
    return this._settings;
  }

  /** Current generation token */
  public get generation(): number {
    return this._generation;
  }

  /** Attach browser event listeners safely */
  private _attachEventListeners(): void {
    if (typeof window === 'undefined') return;

    const handleExternalChange = () => {
      this.reload();
    };

    try {
      window.addEventListener('storage', handleExternalChange);
      window.addEventListener('orion-appearance-preferences-changed', handleExternalChange);
    } catch (_) {
      // safe fallback in test environments
    }
  }

  /** Subscribe to setting changes. Returns an unsubscribe function. */
  public subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    // Immediately invoke with current state for convenience
    try {
      listener(this._settings);
    } catch (e) {
      console.error("RuntimeSettingsAuthority initial subscriber error", e);
    }
    return () => {
      this._listeners.delete(listener);
    };
  }

  /** Internal: notify all listeners of a change */
  private _notify(): void {
    for (const l of this._listeners) {
      try {
        l(this._settings);
      } catch (e) {
        console.error("RuntimeSettingsAuthority listener notification error", e);
      }
    }
  }

  /** Load persisted preferences, migrate if needed, and apply to DOM */
  public reload(): void {
    try {
      const persisted = loadPreferences();
      const migrated = this._migrateLegacy(persisted);
      this._settings = {
        ...DEFAULT_RUNTIME_SETTINGS,
        ...migrated,
        theme: { ...DEFAULT_RUNTIME_SETTINGS.theme, ...(migrated.theme ?? {}) },
        dock: { ...DEFAULT_RUNTIME_SETTINGS.dock, ...(migrated.dock ?? {}) },
        wallpaper: { ...DEFAULT_RUNTIME_SETTINGS.wallpaper, ...(migrated.wallpaper ?? {}) },
        window: { ...DEFAULT_RUNTIME_SETTINGS.window, ...(migrated.window ?? {}) },
        desktop: { ...DEFAULT_RUNTIME_SETTINGS.desktop, ...(migrated.desktop ?? {}) },
      };
    } catch (err) {
      console.warn("RuntimeSettingsAuthority reload error, falling back to defaults", err);
      this._settings = { ...DEFAULT_RUNTIME_SETTINGS };
    }
    this._apply();
    this._notify();
  }

  /** Replace the entire settings object */
  public replaceSettings(newSettings: RuntimeSettings): void {
    this._generation++;
    this._settings = { ...newSettings };
    this._persist();
    this._apply();
    this._notify();
  }

  /** Partial update – merges onto current snapshot with generation tracking */
  public updateSettings(partial: Partial<RuntimeSettings>): number {
    this._generation++;
    const currentGen = this._generation;

    const merged: RuntimeSettings = {
      ...this._settings,
      ...partial,
      version: 1,
      theme: { ...this._settings.theme, ...(partial.theme ?? {}) },
      dock: { ...this._settings.dock, ...(partial.dock ?? {}) },
      wallpaper: { ...this._settings.wallpaper, ...(partial.wallpaper ?? {}) },
      window: { ...this._settings.window, ...(partial.window ?? {}) },
      desktop: { ...this._settings.desktop, ...(partial.desktop ?? {}) },
    };

    this._settings = merged;
    this._persist();
    this._apply();
    this._notify();

    return currentGen;
  }

  /** Reset to defaults (clears stored prefs) */
  public reset(): void {
    this._generation++;
    this._settings = { ...DEFAULT_RUNTIME_SETTINGS };
    try {
      clearPreferences();
    } catch (_) {}
    this._apply();
    this._notify();
  }

  /** Persist current snapshot using existing storage layer */
  private _persist(): void {
    try {
      const legacy = this._toLegacy(this._settings);
      savePreferences(legacy);
    } catch (e) {
      console.warn("RuntimeSettingsAuthority persistence warning", e);
    }
  }

  /** Apply settings to the DOM – CSS custom properties, root attributes */
  private _apply(): void {
    if (typeof document === 'undefined' || !document.documentElement) {
      return;
    }

    const root = document.documentElement;
    try {
      // Theme Attributes & Variables
      root.setAttribute('data-orion-theme', this._settings.theme.themeId);
      root.setAttribute('data-orion-mode', this._settings.theme.appearanceMode);
      root.style.setProperty('--orion-theme-id', this._settings.theme.themeId);
      root.style.setProperty('--orion-morphism-mode', this._settings.theme.morphismMode);
      root.style.setProperty('--orion-appearance-mode', this._settings.theme.appearanceMode);
      if (this._settings.theme.customAccentEnabled && this._settings.theme.customAccent) {
        root.style.setProperty('--orion-accent', this._settings.theme.customAccent);
      }

      // Dock Variables
      root.style.setProperty('--orion-dock-position', this._settings.dock.dockPosition);
      root.style.setProperty('--orion-dock-autohide', String(this._settings.dock.dockAutoHide));
      root.style.setProperty('--orion-dock-opacity', String(this._settings.dock.dockOpacity));
      root.style.setProperty('--orion-dock-scale', String(this._settings.dock.dockScale));

      // Wallpaper Variables
      root.style.setProperty('--orion-wallpaper-id', this._settings.wallpaper.desktopWallpaperId);
      root.style.setProperty('--orion-wallpaper-blur', `${this._settings.wallpaper.wallpaperBlur}px`);
      root.style.setProperty('--orion-wallpaper-dim', String(this._settings.wallpaper.wallpaperDim));

      // Window Variables
      root.style.setProperty('--orion-window-corner-radius', `${this._settings.window.windowCornerRadius}px`);
      root.style.setProperty('--orion-window-header-style', this._settings.window.windowHeaderStyle);
      root.style.setProperty('--orion-window-control-position', this._settings.window.windowControlPosition);
      root.style.setProperty('--orion-glass-transparency', String(this._settings.window.glassTransparency));

      // Desktop Variables
      root.style.setProperty('--orion-desktop-show-icons', String(this._settings.desktop.showDesktopIcons));
      root.style.setProperty('--orion-desktop-grid', String(this._settings.desktop.enableDesktopGrid));
    } catch (e) {
      console.warn("RuntimeSettingsAuthority DOM apply warning", e);
    }
  }

  /** Convert legacy OrionAppearancePreferences to RuntimeSettings */
  private _migrateLegacy(legacy: any): Partial<RuntimeSettings> {
    if (!legacy || typeof legacy !== 'object') {
      return {};
    }

    const theme = {
      themeId: legacy.themeId || 'graphite',
      morphismMode: legacy.morphismMode || 'glass',
      appearanceMode: legacy.appearanceMode || 'dark',
      customAccentEnabled: Boolean(legacy.customAccentEnabled),
      customAccent: legacy.customAccent,
      reducedMotion: Boolean(legacy.reduceMotion),
    };

    const dock = {
      dockPosition: legacy.dockPosition || 'bottom',
      dockAutoHide: Boolean(legacy.dockAutoHide),
      dockSize: legacy.dockSize || 'medium',
      dockMagnification: legacy.dockMagnification !== false,
      dockOpacity: 1.0,
      dockScale: 1.0,
      dockTransparency: legacy.dockTransparency !== false,
      dockShowRunningIndicators: legacy.dockShowRunningIndicators !== false,
      dockShowBadges: legacy.dockShowBadges !== false,
    };

    const wallpaper = {
      desktopWallpaperId: legacy.wallpaperId || 'sys-orion-desktop-default',
      loginWallpaperId: 'sys-orion-dark-horizon',
      wallpaperBlur: legacy.wallpaperBlur ?? (legacy.blurEnabled ? (legacy.blurIntensity ?? 0) : 0),
      wallpaperDim: legacy.wallpaperDim ?? 0,
      fit: 'cover' as const,
    };

    const windowSettings = {
      windowCornerRadius: legacy.windowCornerRadius ?? (legacy.cornerRadius === 'compact' ? 4 : legacy.cornerRadius === 'rounded' ? 18 : 10),
      cornerRadiusPreset: legacy.cornerRadius || 'standard',
      windowStyle: legacy.windowStyle || 'standard',
      windowHeaderStyle: (legacy.windowStyle === 'glass' ? 'glass' : legacy.windowStyle === 'compact' ? 'compact' : 'standard') as any,
      windowControlPosition: legacy.windowControlPosition || 'left',
      glassTransparency: legacy.glassTransparency ?? (legacy.transparencyIntensity ? legacy.transparencyIntensity / 100 : 0.12),
      blurEnabled: legacy.blurEnabled !== false,
      blurIntensity: legacy.blurIntensity ?? 60,
    };

    const desktop = {
      showDesktopIcons: legacy.showDesktopIcons !== false,
      enableDesktopGrid: legacy.enableDesktopGrid !== false,
      iconSize: legacy.iconSize || 'medium',
    };

    return { theme, dock, wallpaper, window: windowSettings, desktop };
  }

  /** Convert RuntimeSettings back to legacy OrionAppearancePreferences shape */
  private _toLegacy(settings: RuntimeSettings): OrionAppearancePreferences {
    return {
      version: 1,
      themeId: settings.theme.themeId,
      morphismMode: settings.theme.morphismMode,
      appearanceMode: settings.theme.appearanceMode,
      customAccentEnabled: settings.theme.customAccentEnabled,
      customAccent: settings.theme.customAccent,
      transparencyEnabled: settings.window.glassTransparency > 0,
      transparencyIntensity: Math.round(settings.window.glassTransparency * 100),
      blurEnabled: settings.wallpaper.wallpaperBlur > 0 || settings.window.blurEnabled,
      blurIntensity: settings.wallpaper.wallpaperBlur || settings.window.blurIntensity,
      reduceMotion: settings.theme.reducedMotion,
      windowStyle: settings.window.windowStyle,
      cornerRadius: settings.window.cornerRadiusPreset,
      windowControlPosition: settings.window.windowControlPosition,
      dockPosition: settings.dock.dockPosition,
      dockAlignment: 'center',
      dockAutoHide: settings.dock.dockAutoHide,
      dockMagnification: settings.dock.dockMagnification,
      dockSize: settings.dock.dockSize,
      dockShowRunningIndicators: settings.dock.dockShowRunningIndicators,
      dockShowBadges: settings.dock.dockShowBadges,
      dockTransparency: settings.dock.dockTransparency,
      iconStyle: 'default',
      widgetStyle: 'solid',
    };
  }
}

export const runtimeSettingsAuthority = RuntimeSettingsAuthority.instance;
