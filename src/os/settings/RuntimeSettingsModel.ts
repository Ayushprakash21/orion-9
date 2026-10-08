// Runtime Settings Model for Orion-9
// This file defines the authoritative runtime settings schema used across the OS.

export interface RuntimeSettingsTheme {
  /** Theme identifier (e.g., "light", "dark", "midnight") */
  themeId: string;
  /** Morphism mode: "material" | "neumorphic" */
  morphismMode: string;
  /** Appearance mode: "light" | "dark" */
  appearanceMode: string;
}

export interface RuntimeSettingsDock {
  /** Dock position: "left", "right", "bottom", "top" */
  dockPosition: string;
  /** Whether the dock should auto‑hide */
  dockAutoHide: boolean;
  /** Dock opacity (0‑1) */
  dockOpacity: number;
  /** Dock size scale factor (0‑1) */
  dockScale: number;
}

export interface RuntimeSettingsWallpaper {
  /** Wallpaper image identifier or URL */
  wallpaperId: string;
  /** Blur radius applied to wallpaper (px) */
  wallpaperBlur: number;
  /** Dim amount (0‑1) applied to wallpaper */
  wallpaperDim: number;
}

export interface RuntimeSettingsWindow {
  /** Corner radius for windows (px) */
  windowCornerRadius: number;
  /** Header style: "transparent" | "opaque" | "glass" */
  windowHeaderStyle: string;
  /** Control position: "left" | "right" */
  windowControlPosition: string;
  /** Glass transparency amount (0‑1) */
  glassTransparency: number;
}

export interface RuntimeSettingsDesktop {
  /** Enables desktop icons */
  showDesktopIcons: boolean;
  /** Enables desktop grid snapping */
  enableDesktopGrid: boolean;
}

export interface RuntimeSettings {
  theme: RuntimeSettingsTheme;
  dock: RuntimeSettingsDock;
  wallpaper: RuntimeSettingsWallpaper;
  window: RuntimeSettingsWindow;
  desktop: RuntimeSettingsDesktop;
}

// Default values – these should mirror the defaults used by the previous
// OrionAppearancePreferences where possible.
export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  theme: {
    themeId: "light",
    morphismMode: "material",
    appearanceMode: "light",
  },
  dock: {
    dockPosition: "bottom",
    dockAutoHide: false,
    dockOpacity: 1.0,
    dockScale: 1.0,
  },
  wallpaper: {
    wallpaperId: "default",
    wallpaperBlur: 0,
    wallpaperDim: 0,
  },
  window: {
    windowCornerRadius: 8,
    windowHeaderStyle: "transparent",
    windowControlPosition: "right",
    glassTransparency: 0.5,
  },
  desktop: {
    showDesktopIcons: true,
    enableDesktopGrid: false,
  },
};
