// Runtime Settings Model for Orion-9
// Single authoritative schema for reactive runtime settings across the entire OS.

import { OrionThemeId, OrionMorphismMode, OrionAppearanceMode, OrionDockPosition, OrionCornerRadius, OrionWindowStyle } from '../theme/OrionThemeTypes';

export interface RuntimeSettingsTheme {
  themeId: OrionThemeId;
  morphismMode: OrionMorphismMode;
  appearanceMode: OrionAppearanceMode;
  customAccentEnabled: boolean;
  customAccent?: string;
  reducedMotion: boolean;
}

export interface RuntimeSettingsDock {
  dockPosition: OrionDockPosition;
  dockAutoHide: boolean;
  dockSize: 'small' | 'medium' | 'large';
  dockMagnification: boolean;
  dockOpacity: number;
  dockScale: number;
  dockTransparency: boolean;
  dockShowRunningIndicators: boolean;
  dockShowBadges: boolean;
}

export interface RuntimeSettingsWallpaper {
  // Strict target isolation
  desktopWallpaperId: string;
  loginWallpaperId: string;
  wallpaperBlur: number;
  wallpaperDim: number;
  fit: 'cover' | 'contain' | 'fill';
}

export interface RuntimeSettingsWindow {
  windowCornerRadius: number;
  cornerRadiusPreset: OrionCornerRadius;
  windowStyle: OrionWindowStyle;
  windowHeaderStyle: 'standard' | 'glass' | 'compact';
  windowControlPosition: 'left' | 'right';
  glassTransparency: number;
  blurEnabled: boolean;
  blurIntensity: number;
}

export interface RuntimeSettingsDesktop {
  showDesktopIcons: boolean;
  enableDesktopGrid: boolean;
  iconSize: 'small' | 'medium' | 'large';
}

export interface RuntimeSettings {
  version: 1;
  theme: RuntimeSettingsTheme;
  dock: RuntimeSettingsDock;
  wallpaper: RuntimeSettingsWallpaper;
  window: RuntimeSettingsWindow;
  desktop: RuntimeSettingsDesktop;
}

export const DEFAULT_RUNTIME_SETTINGS: RuntimeSettings = {
  version: 1,
  theme: {
    themeId: 'graphite',
    morphismMode: 'glass',
    appearanceMode: 'dark',
    customAccentEnabled: false,
    reducedMotion: false,
  },
  dock: {
    dockPosition: 'bottom',
    dockAutoHide: true,
    dockSize: 'medium',
    dockMagnification: true,
    dockOpacity: 1.0,
    dockScale: 1.0,
    dockTransparency: true,
    dockShowRunningIndicators: true,
    dockShowBadges: true,
  },
  wallpaper: {
    desktopWallpaperId: 'sys-orion-desktop-default',
    loginWallpaperId: 'sys-orion-dark-horizon',
    wallpaperBlur: 0,
    wallpaperDim: 0,
    fit: 'cover',
  },
  window: {
    windowCornerRadius: 10,
    cornerRadiusPreset: 'standard',
    windowStyle: 'standard',
    windowHeaderStyle: 'standard',
    windowControlPosition: 'left',
    glassTransparency: 0.12,
    blurEnabled: true,
    blurIntensity: 60,
  },
  desktop: {
    showDesktopIcons: true,
    enableDesktopGrid: true,
    iconSize: 'medium',
  },
};
