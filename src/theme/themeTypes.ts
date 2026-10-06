export type AppearanceMode = 'dark' | 'light' | 'auto' | 'oled' | 'monochrome';

export type AccentPresetKey = 
  | 'neutral' 
  | 'blue' 
  | 'indigo' 
  | 'teal' 
  | 'green' 
  | 'orange' 
  | 'red' 
  | 'purple' 
  | 'pink' 
  | 'custom';

export interface AccentConfig {
  key: AccentPresetKey;
  hex: string;
  name: string;
  textOnAccent: string;
}

export type WindowStyle = 'standard' | 'soft' | 'glass' | 'compact' | 'spacious';
export type CornerStyle = 'square' | 'subtle' | 'rounded';
export type DensityMode = 'compact' | 'comfortable' | 'spacious';

export type DesktopIconSize = 'small' | 'medium' | 'large';
export type DesktopIconLayout = 'grid' | 'freeform';

export type DockPosition = 'bottom' | 'top' | 'left' | 'right';
export type DockSize = 'small' | 'medium' | 'large';

export type ColorFilterMode = 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'grayscale';

export interface PersonalizationSettings {
  // Theme & Appearance
  appearanceMode: AppearanceMode;
  accentKey: AccentPresetKey;
  customAccentHex: string;
  windowStyle: WindowStyle;
  cornerStyle: CornerStyle;
  density: DensityMode;

  // Wallpaper & Background
  wallpaperType: 'solid' | 'gradient' | 'builtin' | 'custom';
  wallpaperValue: string;
  wallpaperFit: 'cover' | 'contain' | 'center' | 'tile';
  wallpaperBlur: number; // 0 - 20px
  wallpaperDim: number; // 0 - 80%

  // Desktop Icons
  iconSize: DesktopIconSize;
  iconLayout: DesktopIconLayout;
  autoArrangeIcons: boolean;
  snapToGrid: boolean;

  // Dock / Taskbar
  dockPosition: DockPosition;
  dockSize: DockSize;
  dockAutoHide: boolean;
  dockTransparency: number; // 0 - 100%
  dockMagnification: boolean;

  // Accessibility & Display
  uiScale: number; // 80 - 150%
  reducedMotion: boolean;
  reducedTransparency: boolean;
  highContrast: boolean;
  colorFilter: ColorFilterMode;
  highContrastFocusRing: boolean;
}

export interface CustomThemeExport {
  version: string;
  name: string;
  author?: string;
  createdAt: string;
  settings: Partial<PersonalizationSettings>;
}
