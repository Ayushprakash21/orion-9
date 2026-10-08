// RuntimeSettingsAuthority.ts
// Central authority for reactive runtime personalization settings.
// It loads persisted preferences, merges with defaults, provides update APIs,
// notifies subscribers, and applies changes to the DOM.

import { RuntimeSettings, DEFAULT_RUNTIME_SETTINGS } from "./RuntimeSettingsModel";
import { loadPreferences, savePreferences } from "../theme/OrionThemeStorage"; // existing persistence layer

type Listener = (settings: RuntimeSettings) => void;

export class RuntimeSettingsAuthority {
  private static _instance: RuntimeSettingsAuthority | null = null;
  private _settings: RuntimeSettings = DEFAULT_RUNTIME_SETTINGS;
  private _listeners: Set<Listener> = new Set();
  // Generation counter for race‑condition protection during async preloads.
  private _generation: number = 0;

  private constructor() {
    this.reload(); // initial load from storage
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

  /** Subscribe to setting changes. Returns an unsubscribe function. */
  public subscribe(listener: Listener): () => void {
    this._listeners.add(listener);
    // Immediately invoke with current state for convenience
    listener(this._settings);
    return () => this._listeners.delete(listener);
  }

  /** Internal: notify all listeners of a change */
  private _notify(): void {
    for (const l of this._listeners) {
      try {
        l(this._settings);
      } catch (e) {
        console.error("RuntimeSettingsAuthority listener error", e);
      }
    }
  }

  /** Load persisted preferences, migrate if needed, and apply to DOM */
  public reload(): void {
    const persisted = loadPreferences(); // returns OrionAppearancePreferences legacy shape
    // Convert legacy shape to our RuntimeSettings structure (simple mapping).
    const migrated = this._migrateLegacy(persisted);
    this._settings = { ...DEFAULT_RUNTIME_SETTINGS, ...migrated };
    this._apply();
    this._notify();
  }

  /** Replace the entire settings object (used for reset / load) */
  public replaceSettings(newSettings: RuntimeSettings): void {
    this._settings = { ...newSettings };
    this._persist();
    this._apply();
    this._notify();
  }

  /** Partial update – merges onto current snapshot */
  public updateSettings(partial: Partial<RuntimeSettings>): void {
    // Deep merge only the top‑level groups that are present.
    const merged: RuntimeSettings = {
      ...this._settings,
      ...partial,
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
  }

  /** Reset to defaults (clears stored prefs) */
  public reset(): void {
    this._settings = { ...DEFAULT_RUNTIME_SETTINGS };
    // Clear persisted old preferences – the storage helper provides clear.
    try {
      // OrionThemeStorage has a clearPreferences method.
      // Import locally to avoid circular dependencies.
      const { clearPreferences } = require("../theme/OrionThemeStorage");
      clearPreferences();
    } catch (_) {}
    this._apply();
    this._notify();
  }

  /** Persist current snapshot using existing storage layer */
  private _persist(): void {
    // The old storage expects OrionAppearancePreferences shape; we map back.
    const legacy = this._toLegacy(this._settings);
    savePreferences(legacy);
  }

  /** Apply settings to the DOM – CSS vars, theme engine hooks, etc. */
  private _apply(): void {
    // Increment generation for any async preload consumers.
    this._generation++;
    const gen = this._generation;

    // Apply CSS custom properties – central point for all visual tweaks.
    const root = document.documentElement;
    // Theme
    root.style.setProperty("--orion-theme-id", this._settings.theme.themeId);
    root.style.setProperty("--orion-morphism-mode", this._settings.theme.morphismMode);
    root.style.setProperty("--orion-appearance-mode", this._settings.theme.appearanceMode);
    // Dock
    root.style.setProperty("--orion-dock-position", this._settings.dock.dockPosition);
    root.style.setProperty("--orion-dock-autohide", String(this._settings.dock.dockAutoHide));
    root.style.setProperty("--orion-dock-opacity", String(this._settings.dock.dockOpacity));
    root.style.setProperty("--orion-dock-scale", String(this._settings.dock.dockScale));
    // Wallpaper
    root.style.setProperty("--orion-wallpaper-id", this._settings.wallpaper.wallpaperId);
    root.style.setProperty("--orion-wallpaper-blur", `${this._settings.wallpaper.wallpaperBlur}px`);
    root.style.setProperty("--orion-wallpaper-dim", String(this._settings.wallpaper.wallpaperDim));
    // Window
    root.style.setProperty("--orion-window-corner-radius", `${this._settings.window.windowCornerRadius}px`);
    root.style.setProperty("--orion-window-header-style", this._settings.window.windowHeaderStyle);
    root.style.setProperty("--orion-window-control-position", this._settings.window.windowControlPosition);
    root.style.setProperty("--orion-glass-transparency", String(this._settings.window.glassTransparency));
    // Desktop
    root.style.setProperty("--orion-desktop-show-icons", String(this._settings.desktop.showDesktopIcons));
    root.style.setProperty("--orior-desktop-grid", String(this._settings.desktop.enableDesktopGrid));

    // Trigger any external side‑effects that need the generation ID, e.g., wallpaper pre‑load.
    // Consumers can capture the current generation via authority.generation if needed.
  }

  /** Convert legacy OrionAppearancePreferences to RuntimeSettings */
  private _migrateLegacy(legacy: any): Partial<RuntimeSettings> {
    // The legacy shape lives in OrionThemeTypes – we map only known fields.
    const theme = {
      themeId: legacy.themeId ?? "light",
      morphismMode: legacy.morphismMode ?? "material",
      appearanceMode: legacy.appearanceMode ?? "light",
    };
    const dock = {
      dockPosition: legacy.dockPosition ?? "bottom",
      dockAutoHide: legacy.dockAutoHide ?? false,
      dockOpacity: legacy.dockOpacity ?? 1.0,
      dockScale: legacy.dockScale ?? 1.0,
    };
    const wallpaper = {
      wallpaperId: legacy.wallpaperId ?? "default",
      wallpaperBlur: legacy.wallpaperBlur ?? 0,
      wallpaperDim: legacy.wallpaperDim ?? 0,
    };
    const window = {
      windowCornerRadius: legacy.windowCornerRadius ?? 8,
      windowHeaderStyle: legacy.windowHeaderStyle ?? "transparent",
      windowControlPosition: legacy.windowControlPosition ?? "right",
      glassTransparency: legacy.glassTransparency ?? 0.5,
    };
    const desktop = {
      showDesktopIcons: legacy.showDesktopIcons ?? true,
      enableDesktopGrid: legacy.enableDesktopGrid ?? false,
    };
    return { theme, dock, wallpaper, window, desktop };
  }

  /** Convert RuntimeSettings back to the legacy shape for storage */
  private _toLegacy(settings: RuntimeSettings): any {
    return {
      // Direct mapping of fields used by older code.
      themeId: settings.theme.themeId,
      morphismMode: settings.theme.morphismMode,
      appearanceMode: settings.theme.appearanceMode,
      dockPosition: settings.dock.dockPosition,
      dockAutoHide: settings.dock.dockAutoHide,
      dockOpacity: settings.dock.dockOpacity,
      dockScale: settings.dock.dockScale,
      wallpaperId: settings.wallpaper.wallpaperId,
      wallpaperBlur: settings.wallpaper.wallpaperBlur,
      wallpaperDim: settings.wallpaper.wallpaperDim,
      windowCornerRadius: settings.window.windowCornerRadius,
      windowHeaderStyle: settings.window.windowHeaderStyle,
      windowControlPosition: settings.window.windowControlPosition,
      glassTransparency: settings.window.glassTransparency,
      showDesktopIcons: settings.desktop.showDesktopIcons,
      enableDesktopGrid: settings.desktop.enableDesktopGrid,
    };
  }

  /** Expose the current generation number for async preload checks */
  public get generation(): number {
    return this._generation;
  }
}

export const runtimeSettingsAuthority = RuntimeSettingsAuthority.instance;
