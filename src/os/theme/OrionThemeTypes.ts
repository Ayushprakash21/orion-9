/** Theme identifiers */
export type OrionThemeId = 'graphite' | 'silver' | 'midnight' | 'forest' | 'warm';

/** Morphism material mode */
export type OrionMorphismMode = 'glass' | 'clay' | 'neumorphic';

/** Appearance mode */
export type OrionAppearanceMode = 'light' | 'dark' | 'auto';

/** Window style */
export type OrionWindowStyle = 'standard' | 'glass' | 'compact';

/** Corner radius preset */
export type OrionCornerRadius = 'compact' | 'standard' | 'rounded';

/** Dock position */
export type OrionDockPosition = 'bottom' | 'top' | 'left' | 'right';

/** Dock alignment */
export type OrionDockAlignment = 'center' | 'left';

/** Icon style */
export type OrionIconStyle = 'default' | 'monochrome' | 'soft';

/** Widget style */
export type OrionWidgetStyle = 'solid' | 'glass' | 'minimal';

/** Complete theme color palette */
export interface OrionThemeColors {
  background: string;
  surface: string;
  surfaceElevated: string;
  surfaceHover: string;
  surfaceActive: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textDisabled: string;
  border: string;
  borderStrong: string;
  accent: string;
  accentSoft: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  focus: string;
  desktopIconLabel?: string;
  dockBg?: string;
  dockBorder?: string;
  dockShadow?: string;
}

/** Theme visual effects */
export interface OrionThemeEffects {
  glassOpacity: number;
  blur: number;
  shadowIntensity: number;
  radius: number;
}

/** Chart/data visualization colors (NOT for OS chrome) */
export interface OrionChartColors {
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

/** Complete theme definition */
export interface OrionTheme {
  id: OrionThemeId;
  name: string;
  description: string;
  appearance: {
    mode: 'dark' | 'light';
  };
  colors: OrionThemeColors;
  effects: OrionThemeEffects;
  chart: OrionChartColors;
}

/** User appearance preferences - versioned for migration safety */
export interface OrionAppearancePreferences {
  version: 1;
  themeId: OrionThemeId;
  morphismMode: OrionMorphismMode;
  appearanceMode: OrionAppearanceMode;
  customAccentEnabled: boolean;
  customAccent?: string;
  transparencyEnabled: boolean;
  transparencyIntensity: number;
  blurEnabled: boolean;
  blurIntensity: number;
  reduceMotion: boolean;
  windowStyle: OrionWindowStyle;
  cornerRadius: OrionCornerRadius;
  windowControlPosition?: 'left' | 'right';
  dockPosition: OrionDockPosition;
  dockAlignment: OrionDockAlignment;
  dockAutoHide: boolean;
  dockMagnification?: boolean;
  dockSize?: 'small' | 'medium' | 'large';
  dockShowRunningIndicators: boolean;
  dockShowBadges: boolean;
  dockTransparency: boolean;
  iconStyle: OrionIconStyle;
  widgetStyle: OrionWidgetStyle;
}

/** Theme context value exposed to consumers */
export interface OrionThemeContextValue {
  theme: OrionTheme;
  preferences: OrionAppearancePreferences;
  resolvedAccent: string;
  setTheme: (id: OrionThemeId) => void;
  setPreference: <K extends keyof OrionAppearancePreferences>(key: K, value: OrionAppearancePreferences[K]) => void;
  resetAppearance: () => void;
  isDark: boolean;
}

/** Default preferences */
export const DEFAULT_PREFERENCES: OrionAppearancePreferences = {
  version: 1,
  themeId: 'graphite',
  morphismMode: 'glass',
  appearanceMode: 'dark',
  customAccentEnabled: false,
  transparencyEnabled: true,
  transparencyIntensity: 70,
  blurEnabled: true,
  blurIntensity: 60,
  reduceMotion: false,
  windowStyle: 'standard',
  cornerRadius: 'standard',
  windowControlPosition: 'left',
  dockPosition: 'bottom',
  dockAlignment: 'center',
  dockAutoHide: false,
  dockMagnification: true,
  dockSize: 'medium',
  dockShowRunningIndicators: true,
  dockShowBadges: true,
  dockTransparency: true,
  iconStyle: 'default',
  widgetStyle: 'solid',
};

