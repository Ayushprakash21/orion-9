import { OrionTheme, OrionThemeId } from './OrionThemeTypes';

/** Theme registry containing all built-in themes */
export const ORION_THEMES: Record<OrionThemeId, OrionTheme> = {
  graphite: {
    id: 'graphite',
    name: 'Graphite',
    description: 'Default dark theme',
    appearance: { mode: 'dark' },
    colors: {
      background: '#0B0D0F',
      surface: '#121417',
      surfaceElevated: '#191C20',
      surfaceHover: '#22262B',
      surfaceActive: '#292E34',
      textPrimary: '#F2F2EF',
      textSecondary: '#A7AAA8',
      textMuted: '#747875',
      textDisabled: '#555855',
      border: 'rgba(255,255,255,.08)',
      borderStrong: 'rgba(255,255,255,.15)',
      accent: '#D8DDE3',
      accentSoft: 'rgba(216,221,227,.10)',
      success: '#5FAF8A',
      warning: '#C6A15B',
      danger: '#C96B72',
      info: '#AEB5BE',
      focus: 'rgba(216,221,227,.40)',
      desktopIconLabel: '#F3EBDD', // Warm off-white / cream
      dockBg: 'rgba(22, 25, 29, 0.88)', // Deep charcoal graphite glass
      dockBorder: 'rgba(255, 255, 255, 0.10)',
      dockShadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
    },
    effects: {
      glassOpacity: 0.12,
      blur: 12,
      shadowIntensity: 0.3,
      radius: 10,
    },
    chart: {
      chart1: '#7BA3C9',
      chart2: '#A3C4A0',
      chart3: '#C9A76C',
      chart4: '#B07DA3',
      chart5: '#6DBAB0',
    },
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    description: 'Light theme with clean contrasts',
    appearance: { mode: 'light' },
    colors: {
      background: '#F5F5F3',
      surface: '#FFFFFF',
      surfaceElevated: '#FFFFFF',
      surfaceHover: '#ECEDEB',
      surfaceActive: '#E1E3E1',
      textPrimary: '#17191B',
      textSecondary: '#555A5E',
      textMuted: '#7C8286',
      textDisabled: '#A5A8AB',
      border: 'rgba(0,0,0,.09)',
      borderStrong: 'rgba(0,0,0,.16)',
      accent: '#4A5056',
      accentSoft: 'rgba(74,80,86,.08)',
      success: '#3F8065',
      warning: '#92733B',
      danger: '#A94F57',
      info: '#646B72',
      focus: 'rgba(74,80,86,.30)',
      desktopIconLabel: '#17191B', // Dark graphite
      dockBg: 'rgba(255, 255, 255, 0.90)', // Translucent porcelain glass
      dockBorder: 'rgba(0, 0, 0, 0.10)',
      dockShadow: '0 16px 40px rgba(0, 0, 0, 0.12)',
    },
    effects: {
      glassOpacity: 0.08,
      blur: 10,
      shadowIntensity: 0.12,
      radius: 10,
    },
    chart: {
      chart1: '#4A7FAA',
      chart2: '#5A9A6E',
      chart3: '#B08A40',
      chart4: '#8E5E85',
      chart5: '#4A9E94',
    },
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep blue dark theme',
    appearance: { mode: 'dark' },
    colors: {
      background: '#07090C',
      surface: '#0E1116',
      surfaceElevated: '#151922',
      surfaceHover: '#1C212B',
      surfaceActive: '#242A35',
      textPrimary: '#F5F7F8',
      textSecondary: '#AEB5BE',
      textMuted: '#717983',
      textDisabled: '#515860',
      border: 'rgba(255,255,255,.09)',
      borderStrong: 'rgba(255,255,255,.16)',
      accent: '#BFC6CE',
      accentSoft: 'rgba(191,198,206,.10)',
      success: '#63A987',
      warning: '#C5A05A',
      danger: '#C86A72',
      info: '#AAB2BC',
      focus: 'rgba(191,198,206,.35)',
      desktopIconLabel: '#F3F0E8', // Light ivory
      dockBg: 'rgba(15, 19, 27, 0.88)', // Deep sapphire slate glass
      dockBorder: 'rgba(255, 255, 255, 0.12)',
      dockShadow: '0 20px 48px rgba(0, 0, 0, 0.65)',
    },
    effects: {
      glassOpacity: 0.14,
      blur: 14,
      shadowIntensity: 0.35,
      radius: 10,
    },
    chart: {
      chart1: '#6E99C2',
      chart2: '#8DB88A',
      chart3: '#C4A060',
      chart4: '#A87A9E',
      chart5: '#60B3A8',
    },
  },
  forest: {
    id: 'forest',
    name: 'Forest',
    description: 'Earthy green dark theme',
    appearance: { mode: 'dark' },
    colors: {
      background: '#0B100E',
      surface: '#111814',
      surfaceElevated: '#19221C',
      surfaceHover: '#202B24',
      surfaceActive: '#29362D',
      textPrimary: '#EEF3EF',
      textSecondary: '#AAB5AD',
      textMuted: '#737D76',
      textDisabled: '#555D58',
      border: 'rgba(255,255,255,.08)',
      borderStrong: 'rgba(255,255,255,.14)',
      accent: '#7FA58D',
      accentSoft: 'rgba(127,165,141,.12)',
      success: '#72A98A',
      warning: '#C2A05B',
      danger: '#C96E75',
      info: '#A9B5AE',
      focus: 'rgba(127,165,141,.35)',
      desktopIconLabel: '#F3ECE0', // Warm ivory
      dockBg: 'rgba(18, 25, 21, 0.88)', // Deep forest moss glass
      dockBorder: 'rgba(255, 255, 255, 0.10)',
      dockShadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
    },
    effects: {
      glassOpacity: 0.11,
      blur: 12,
      shadowIntensity: 0.28,
      radius: 10,
    },
    chart: {
      chart1: '#6B9BA5',
      chart2: '#8DB88A',
      chart3: '#C4A060',
      chart4: '#A87A9E',
      chart5: '#5FAF8A',
    },
  },
  warm: {
    id: 'warm',
    name: 'Warm',
    description: 'Cozy dark theme with earth tones',
    appearance: { mode: 'dark' },
    colors: {
      background: '#12100E',
      surface: '#191614',
      surfaceElevated: '#211D19',
      surfaceHover: '#29241F',
      surfaceActive: '#332D27',
      textPrimary: '#F4F0EA',
      textSecondary: '#B8AEA2',
      textMuted: '#81786F',
      textDisabled: '#5D564F',
      border: 'rgba(255,255,255,.08)',
      borderStrong: 'rgba(255,255,255,.14)',
      accent: '#C7B7A4',
      accentSoft: 'rgba(199,183,164,.12)',
      success: '#719B82',
      warning: '#C39D5D',
      danger: '#C86D70',
      info: '#AAA49C',
      focus: 'rgba(199,183,164,.35)',
      desktopIconLabel: '#F5ECE1', // Soft cream
      dockBg: 'rgba(26, 22, 19, 0.88)', // Dark warm espresso glass
      dockBorder: 'rgba(255, 255, 255, 0.10)',
      dockShadow: '0 20px 48px rgba(0, 0, 0, 0.55)',
    },
    effects: {
      glassOpacity: 0.11,
      blur: 12,
      shadowIntensity: 0.28,
      radius: 10,
    },
    chart: {
      chart1: '#7BA3A8',
      chart2: '#A3B88A',
      chart3: '#C4A060',
      chart4: '#A87A9E',
      chart5: '#719B82',
    },
  }
};

/**
 * Gets a theme by its identifier
 */
export function getTheme(id: OrionThemeId): OrionTheme {
  return ORION_THEMES[id] || ORION_THEMES.graphite;
}

/**
 * Returns an array of all available themes
 */
export function getThemeList(): OrionTheme[] {
  return Object.values(ORION_THEMES);
}

/**
 * Checks if a given string is a valid theme ID
 */
export function isValidThemeId(id: string): id is OrionThemeId {
  return id in ORION_THEMES;
}

/**
 * Checks if a theme is compatible with a given appearance mode ('light' | 'dark').
 */
export function isThemeCompatibleWithMode(themeId: OrionThemeId, mode: 'light' | 'dark'): boolean {
  const theme = getTheme(themeId);
  return theme.appearance.mode === mode;
}

/**
 * Resolves a compatible theme for the given appearance mode.
 * - If effective mode is 'light': returns 'silver' (or preserving light theme if multiple existed).
 * - If effective mode is 'dark': preserves requested dark theme (graphite, midnight, forest, warm),
 *   or falls back to 'graphite' if the requested theme was light.
 */
export function resolveCompatibleTheme(
  requestedThemeId: OrionThemeId,
  effectiveAppearanceMode: 'light' | 'dark'
): OrionTheme {
  const candidate = getTheme(requestedThemeId);
  if (candidate.appearance.mode === effectiveAppearanceMode) {
    return candidate;
  }
  return getTheme(effectiveAppearanceMode === 'dark' ? 'graphite' : 'silver');
}
