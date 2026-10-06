import { AppearanceMode, AccentConfig, AccentPresetKey, PersonalizationSettings } from './themeTypes';

export interface ThemeColors {
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceSecondary: string;
  surfaceElevated: string;
  surfaceHover: string;
  border: string;
  borderStrong: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  windowHeaderBg: string;
  dockBg: string;
  cardBg: string;
}

export const APPEARANCE_PRESETS: Record<Exclude<AppearanceMode, 'auto'>, ThemeColors> = {
  dark: {
    background: '#0F1115', // Graphite foundation
    backgroundSecondary: '#14171C',
    surface: '#14171C',
    surfaceSecondary: '#1C2026',
    surfaceElevated: '#222730',
    surfaceHover: '#2A303C',
    border: '#2B313A',
    borderStrong: '#3F4754',
    text: '#F1F5F9',
    textSecondary: '#94A3B8',
    textMuted: '#64748B',
    windowHeaderBg: '#181C22',
    dockBg: 'rgba(20, 23, 28, 0.85)',
    cardBg: '#161A20'
  },
  light: {
    background: '#F5F7FA',
    backgroundSecondary: '#EBF0F5',
    surface: '#FFFFFF',
    surfaceSecondary: '#F0F4F8',
    surfaceElevated: '#FFFFFF',
    surfaceHover: '#E2E8F0',
    border: '#CBD5E1',
    borderStrong: '#94A3B8',
    text: '#0F172A',
    textSecondary: '#475569',
    textMuted: '#64748B',
    windowHeaderBg: '#E2E8F0',
    dockBg: 'rgba(255, 255, 255, 0.88)',
    cardBg: '#FFFFFF'
  },
  oled: {
    background: '#000000',
    backgroundSecondary: '#08080A',
    surface: '#0A0A0C',
    surfaceSecondary: '#121215',
    surfaceElevated: '#18181C',
    surfaceHover: '#222228',
    border: '#222226',
    borderStrong: '#383840',
    text: '#FFFFFF',
    textSecondary: '#A1A1AA',
    textMuted: '#71717A',
    windowHeaderBg: '#0A0A0C',
    dockBg: 'rgba(10, 10, 12, 0.92)',
    cardBg: '#0D0D10'
  },
  monochrome: {
    background: '#121212',
    backgroundSecondary: '#1E1E1E',
    surface: '#181818',
    surfaceSecondary: '#242424',
    surfaceElevated: '#2D2D2D',
    surfaceHover: '#383838',
    border: '#404040',
    borderStrong: '#666666',
    text: '#F5F5F5',
    textSecondary: '#CCCCCC',
    textMuted: '#999999',
    windowHeaderBg: '#1F1F1F',
    dockBg: 'rgba(24, 24, 24, 0.90)',
    cardBg: '#1A1A1A'
  }
};

export const ACCENT_PRESETS: Record<AccentPresetKey, AccentConfig> = {
  neutral: { key: 'neutral', hex: '#64748B', name: 'Slate Neutral', textOnAccent: '#FFFFFF' },
  blue: { key: 'blue', hex: '#3B82F6', name: 'Royal Blue', textOnAccent: '#FFFFFF' },
  indigo: { key: 'indigo', hex: '#6366F1', name: 'Deep Indigo', textOnAccent: '#FFFFFF' },
  teal: { key: 'teal', hex: '#0D9488', name: 'Teal Emerald', textOnAccent: '#FFFFFF' },
  green: { key: 'green', hex: '#10B981', name: 'Forest Green', textOnAccent: '#FFFFFF' },
  orange: { key: 'orange', hex: '#F97316', name: 'Vibrant Orange', textOnAccent: '#FFFFFF' },
  red: { key: 'red', hex: '#EF4444', name: 'Crimson Red', textOnAccent: '#FFFFFF' },
  purple: { key: 'purple', hex: '#8B5CF6', name: 'Amethyst Purple', textOnAccent: '#FFFFFF' },
  pink: { key: 'pink', hex: '#EC4899', name: 'Rose Pink', textOnAccent: '#FFFFFF' },
  custom: { key: 'custom', hex: '#3B82F6', name: 'Custom Accent', textOnAccent: '#FFFFFF' }
};

export const DEFAULT_PERSONALIZATION_SETTINGS: PersonalizationSettings = {
  appearanceMode: 'dark',
  accentKey: 'neutral',
  customAccentHex: '#64748B',
  windowStyle: 'standard',
  cornerStyle: 'subtle',
  density: 'comfortable',

  wallpaperType: 'gradient',
  wallpaperValue: 'linear-gradient(135deg, #0F1115 0%, #1A1F29 50%, #0F1115 100%)',
  wallpaperFit: 'cover',
  wallpaperBlur: 0,
  wallpaperDim: 0,

  iconSize: 'medium',
  iconLayout: 'grid',
  autoArrangeIcons: true,
  snapToGrid: true,

  dockPosition: 'bottom',
  dockSize: 'medium',
  dockAutoHide: false,
  dockTransparency: 85,
  dockMagnification: true,

  uiScale: 100,
  reducedMotion: false,
  reducedTransparency: false,
  highContrast: false,
  colorFilter: 'none',
  highContrastFocusRing: false
};
