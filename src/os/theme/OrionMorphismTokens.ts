/**
 * ORION-9 GLOBAL MORPHIC DESIGN SYSTEM TOKENS & CALCULATOR
 * 
 * Separates Color Theme from UI Material / Morphism.
 * Supported Material Modes:
 * 1. GLASSMORPHISM  — translucent, layered, backdrop-blur, subtle saturation, crisp readable content
 * 2. CLAYMORPHISM   — soft, tactile, physical, top-left highlight + bottom-right soft shadow
 * 3. NEUMORPHISM    — embossed, recessed, same-family surface, dual-axis light/dark shadows
 */

import { OrionTheme, OrionMorphismMode, OrionAppearancePreferences } from './OrionThemeTypes';

export interface OrionMorphismTokens {
  mode: OrionMorphismMode;
  
  // Surfaces
  surface: string;
  surfaceSubtle: string;
  surfaceElevated: string;
  surfaceHover: string;
  surfaceActive: string;
  surfacePressed: string;
  surfaceDisabled: string;
  
  // Borders
  border: string;
  borderStrong: string;
  
  // Optical Depth & Blur
  blur: string;
  backdrop: string;
  saturation: string;
  
  // Shadows & Highlights
  shadow: string;
  shadowSoft: string;
  shadowDeep: string;
  shadowInset: string;
  highlight: string;
  
  // Depths & Elevations
  elevation0: string;
  elevation1: string;
  elevation2: string;
  elevation3: string;
  elevationModal: string;
}

export const MORPHISM_MODES: OrionMorphismMode[] = ['glass', 'clay', 'neumorphic'];

/**
 * Calculates CSS variables and tokens for the given theme and morphism mode
 */
export function computeMorphismTokens(
  theme: OrionTheme,
  preferences: OrionAppearancePreferences
): OrionMorphismTokens {
  const mode: OrionMorphismMode = preferences.morphismMode || 'glass';
  const isDark = theme.appearance.mode === 'dark';
  const transparencyEnabled = preferences.transparencyEnabled !== false;
  const rawIntensity = typeof preferences.transparencyIntensity === 'number'
    ? preferences.transparencyIntensity
    : 70;
  const transparencyIntensity = Math.min(100, Math.max(0, rawIntensity));
  const reduceTransparency = !transparencyEnabled || transparencyIntensity === 0;

  if (mode === 'clay') {
    // -------------------------------------------------------------------------
    // CLAYMORPHISM: Soft, tactile, dimensional, top-left highlight + soft bottom-right shadow
    // -------------------------------------------------------------------------
    const highlightColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)';
    const shadowColor = isDark ? 'rgba(0, 0, 0, 0.55)' : 'rgba(160, 168, 180, 0.40)';
    const shadowDeepColor = isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(140, 150, 165, 0.50)';

    return {
      mode: 'clay',
      surface: theme.colors.surface,
      surfaceSubtle: theme.colors.surfaceElevated,
      surfaceElevated: theme.colors.surfaceElevated,
      surfaceHover: theme.colors.surfaceHover,
      surfaceActive: theme.colors.surfaceActive,
      surfacePressed: theme.colors.surfaceActive,
      surfaceDisabled: theme.colors.surface,

      border: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
      borderStrong: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.14)',

      blur: '0px',
      backdrop: 'none',
      saturation: '100%',

      shadow: `inset 1px 1px 2px ${highlightColor}, 4px 6px 14px ${shadowColor}`,
      shadowSoft: `inset 1px 1px 1px ${highlightColor}, 2px 3px 8px ${shadowColor}`,
      shadowDeep: `inset 1.5px 1.5px 2px ${highlightColor}, 8px 12px 24px ${shadowDeepColor}`,
      shadowInset: `inset 2px 3px 6px ${shadowColor}, inset -1px -1px 2px ${highlightColor}`,
      highlight: highlightColor,

      elevation0: 'none',
      elevation1: `inset 1px 1px 1.5px ${highlightColor}, 3px 4px 10px ${shadowColor}`,
      elevation2: `inset 1.5px 1.5px 2px ${highlightColor}, 6px 8px 18px ${shadowColor}`,
      elevation3: `inset 2px 2px 3px ${highlightColor}, 10px 14px 28px ${shadowDeepColor}`,
      elevationModal: `inset 2px 2px 3px ${highlightColor}, 14px 20px 40px ${shadowDeepColor}`,
    };
  }

  if (mode === 'neumorphic') {
    // -------------------------------------------------------------------------
    // NEUMORPHISM: Embossed, recessed, same-family surface, subtle dual-axis lighting
    // -------------------------------------------------------------------------
    const lightShadow = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.90)';
    const darkShadow = isDark ? 'rgba(0, 0, 0, 0.70)' : 'rgba(165, 172, 185, 0.45)';
    const deepDarkShadow = isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(145, 155, 170, 0.55)';

    return {
      mode: 'neumorphic',
      surface: theme.colors.surface,
      surfaceSubtle: theme.colors.background,
      surfaceElevated: theme.colors.surfaceElevated,
      surfaceHover: theme.colors.surfaceHover,
      surfaceActive: theme.colors.surfaceActive,
      surfacePressed: theme.colors.background,
      surfaceDisabled: theme.colors.surface,

      border: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)',
      borderStrong: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',

      blur: '0px',
      backdrop: 'none',
      saturation: '100%',

      shadow: `-4px -4px 10px ${lightShadow}, 4px 4px 10px ${darkShadow}`,
      shadowSoft: `-2px -2px 6px ${lightShadow}, 2px 2px 6px ${darkShadow}`,
      shadowDeep: `-6px -6px 16px ${lightShadow}, 6px 6px 16px ${deepDarkShadow}`,
      shadowInset: `inset 3px 3px 6px ${darkShadow}, inset -3px -3px 6px ${lightShadow}`,
      highlight: lightShadow,

      elevation0: 'none',
      elevation1: `-2px -2px 6px ${lightShadow}, 2px 2px 6px ${darkShadow}`,
      elevation2: `-4px -4px 12px ${lightShadow}, 4px 4px 12px ${darkShadow}`,
      elevation3: `-6px -6px 18px ${lightShadow}, 6px 6px 18px ${deepDarkShadow}`,
      elevationModal: `-8px -8px 24px ${lightShadow}, 8px 8px 24px ${deepDarkShadow}`,
    };
  }

  // ---------------------------------------------------------------------------
  // GLASSMORPHISM (Default): Continuous transparency calculation from transparencyIntensity
  // ---------------------------------------------------------------------------
  const rawBase = isDark ? '18, 20, 23' : '255, 255, 255';

  // Continuous curve:
  // 0% => 0.95 dark / 0.96 light (near-opaque)
  // 70% (default) => 0.72 dark / 0.74 light (canonical liquid glass)
  // 100% => 0.48 dark / 0.52 light (maximum airy translucency while maintaining text contrast)
  const minAlpha = isDark ? 0.48 : 0.52;
  const maxAlpha = isDark ? 0.95 : 0.96;
  const tNorm = transparencyIntensity / 100;
  const tCurve = Math.pow(tNorm, 2.0);
  const alphaSurface = reduceTransparency 
    ? maxAlpha 
    : Number((maxAlpha - tCurve * (maxAlpha - minAlpha)).toFixed(3));

  const alphaElevated = reduceTransparency 
    ? (isDark ? 0.98 : 0.98) 
    : Number((Math.min(0.98, alphaSurface + 0.10)).toFixed(3));

  const alphaHover = reduceTransparency 
    ? 0.98 
    : Number((Math.min(0.98, alphaSurface + 0.14)).toFixed(3));

  const alphaSubtle = reduceTransparency 
    ? (isDark ? 0.90 : 0.92) 
    : Number((Math.max(0.25, alphaSurface * 0.85)).toFixed(3));

  const blurPx = !preferences.blurEnabled 
    ? 0 
    : reduceTransparency 
      ? 6 
      : Math.max(0, Math.round(preferences.blurIntensity / 4));

  const shadowColor = isDark ? 'rgba(0, 0, 0, 0.45)' : 'rgba(0, 0, 0, 0.10)';
  const shadowDeepColor = isDark ? 'rgba(0, 0, 0, 0.65)' : 'rgba(0, 0, 0, 0.18)';

  return {
    mode: 'glass',
    surface: `rgba(${rawBase}, ${alphaSurface})`,
    surfaceSubtle: `rgba(${rawBase}, ${alphaSubtle})`,
    surfaceElevated: `rgba(${rawBase}, ${alphaElevated})`,
    surfaceHover: `rgba(${rawBase}, ${alphaHover})`,
    surfaceActive: `rgba(${rawBase}, 0.92)`,
    surfacePressed: `rgba(${rawBase}, 0.96)`,
    surfaceDisabled: `rgba(${rawBase}, 0.40)`,

    border: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.09)',
    borderStrong: isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.16)',

    blur: `${blurPx}px`,
    backdrop: blurPx > 0 ? `blur(${blurPx}px) saturate(125%)` : 'none',
    saturation: '125%',

    shadow: `0 8px 24px ${shadowColor}`,
    shadowSoft: `0 4px 12px ${shadowColor}`,
    shadowDeep: `0 16px 40px ${shadowDeepColor}`,
    shadowInset: `inset 0 1px 1px rgba(255, 255, 255, ${isDark ? 0.10 : 0.60})`,
    highlight: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.75)',

    elevation0: 'none',
    elevation1: `0 4px 12px ${shadowColor}`,
    elevation2: `0 8px 24px ${shadowColor}`,
    elevation3: `0 16px 36px ${shadowDeepColor}`,
    elevationModal: `0 24px 54px ${shadowDeepColor}`,
  };
}

/**
 * Functional overload / shorthand for testing or direct programmatic calculation
 */
export function calculateMorphismTokens(
  mode: OrionMorphismMode,
  theme: OrionTheme,
  isDark: boolean = theme.appearance.mode === 'dark',
  blurIntensity: number = 60,
  blurEnabled: boolean = true,
  transparencyIntensity: number = 70,
  transparencyEnabled: boolean = true
): OrionMorphismTokens {
  const syntheticPreferences: OrionAppearancePreferences = {
    version: 1,
    themeId: theme.id,
    appearanceMode: isDark ? 'dark' : 'light',
    customAccentEnabled: false,
    transparencyEnabled,
    transparencyIntensity,
    blurEnabled,
    blurIntensity,
    reduceMotion: false,
    windowStyle: 'standard',
    cornerRadius: 'standard',
    dockPosition: 'bottom',
    dockAlignment: 'center',
    dockAutoHide: true,
    dockShowRunningIndicators: true,
    dockShowBadges: true,
    dockTransparency: true,
    iconStyle: 'default',
    widgetStyle: 'solid',
    morphismMode: mode,
  };

  return computeMorphismTokens(theme, syntheticPreferences);
}
