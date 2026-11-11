import { PersonalizationSettings, CustomThemeExport, AccentPresetKey } from './themeTypes';
import { APPEARANCE_PRESETS, ACCENT_PRESETS, DEFAULT_PERSONALIZATION_SETTINGS } from './themePresets';
import { getTheme, ORION_THEMES, isValidThemeId, resolveCompatibleTheme } from '../os/theme/OrionThemeRegistry';
import { loadPreferences } from '../os/theme/OrionThemeStorage';
import { OrionThemeId } from '../os/theme/OrionThemeTypes';
import { applyThemeToDOM } from '../os/theme/OrionThemeCSS';
import {
  calculateContrastColor,
  adjustHexBrightness,
  resolveAccessibleAccentStates,
} from '../os/theme/OrionContrast';

export { calculateContrastColor, adjustHexBrightness };

/**
 * Resolves full set of CSS variables for a given personalization configuration.
 */
export function resolveThemeVariables(
  settings: PersonalizationSettings,
  systemIsDark: boolean = true
): Record<string, string> {
  // Determine canonical theme if specified or active in storage
  const activePrefs = loadPreferences();
  const targetThemeId: OrionThemeId = (settings.themeId && isValidThemeId(settings.themeId))
    ? settings.themeId
    : (activePrefs.themeId || 'graphite');

  const canonicalTheme = getTheme(targetThemeId);

  // 1. Resolve Effective Mode
  let effectiveMode = settings.appearanceMode;
  if (effectiveMode === 'auto') {
    effectiveMode = systemIsDark ? 'dark' : 'light';
  }

  // Handle High Contrast override
  if (settings.highContrast) {
    effectiveMode = 'monochrome';
  }

  // Base colors prioritize canonical theme palette
  const presetColors = APPEARANCE_PRESETS[effectiveMode as keyof typeof APPEARANCE_PRESETS] || APPEARANCE_PRESETS.dark;

  const baseColors = (effectiveMode === 'monochrome' || effectiveMode === 'oled')
    ? presetColors
    : (settings.themeId
        ? {
            background: canonicalTheme.colors.background,
            backgroundSecondary: canonicalTheme.colors.surface,
            surface: canonicalTheme.colors.surface,
            surfaceSecondary: canonicalTheme.colors.surfaceElevated,
            surfaceElevated: canonicalTheme.colors.surfaceElevated,
            surfaceHover: canonicalTheme.colors.surfaceHover,
            border: canonicalTheme.colors.border,
            borderStrong: canonicalTheme.colors.borderStrong,
            text: canonicalTheme.colors.textPrimary,
            textSecondary: canonicalTheme.colors.textSecondary,
            textMuted: canonicalTheme.colors.textMuted,
            windowHeaderBg: canonicalTheme.colors.surface,
            dockBg: canonicalTheme.colors.dockBg || canonicalTheme.colors.surfaceElevated,
            dockBorder: canonicalTheme.colors.dockBorder || canonicalTheme.colors.borderStrong,
            dockShadow: canonicalTheme.colors.dockShadow || '0 20px 48px rgba(0,0,0,0.50)',
            cardBg: canonicalTheme.colors.surfaceElevated,
            desktopIconLabel: canonicalTheme.colors.desktopIconLabel || (canonicalTheme.appearance.mode === 'light' ? '#17191B' : '#F3EBDD')
          }
        : presetColors
      );

  // 2. Resolve Accent Color (Prioritize active persistent custom accent)
  let accentHex = canonicalTheme.colors.accent; // Default to canonical theme accent
  if (activePrefs.customAccentEnabled && activePrefs.customAccent) {
    accentHex = activePrefs.customAccent;
  } else if (settings.accentKey === 'custom' && settings.customAccentHex) {
    accentHex = settings.customAccentHex;
  } else if (settings.accentKey && settings.accentKey !== 'neutral' && ACCENT_PRESETS[settings.accentKey as AccentPresetKey]) {
    accentHex = ACCENT_PRESETS[settings.accentKey as AccentPresetKey].hex;
  }

  const modeResolved = effectiveMode === 'light' ? 'light' : 'dark';
  const accentState = resolveAccessibleAccentStates(accentHex, modeResolved, baseColors.surface);
  const textOnAccent = accentState.foreground;
  const accentHover = accentState.hover;
  const accentActive = accentState.active;
  const accentSubtle = accentState.soft;
  const dockSurface = canonicalTheme.colors.dockBg || canonicalTheme.colors.surfaceElevated;
  const dockBorder = canonicalTheme.colors.dockBorder || canonicalTheme.colors.borderStrong;
  const dockShadow = canonicalTheme.colors.dockShadow || '0 20px 48px rgba(0,0,0,0.50)';

  // 3. Resolve Geometry / Radius
  let radius = '8px';
  if (settings.cornerStyle === 'square') radius = '4px';
  if (settings.cornerStyle === 'rounded') radius = '12px';

  // 4. Resolve Density Paddings
  let densityPadding = '1rem';
  if (settings.density === 'compact') densityPadding = '0.5rem';
  if (settings.density === 'spacious') densityPadding = '1.5rem';

  // 5. Window Blur & Glass Translucency
  let windowBlur = '0px';
  if (!settings.reducedTransparency && settings.windowStyle === 'glass') {
    windowBlur = '12px';
  }

  // 6. UI Scale
  const uiScaleRatio = (settings.uiScale || 100) / 100;

  return {
    '--orion-bg': baseColors.background,
    '--orion-background': baseColors.background,
    '--orion-background-secondary': baseColors.backgroundSecondary,
    '--orion-surface': baseColors.surface,
    '--orion-surface-secondary': baseColors.surfaceSecondary,
    '--orion-surface-elevated': baseColors.surfaceElevated,
    '--orion-surface-hover': baseColors.surfaceHover,
    '--orion-surface-active': baseColors.surfaceHover,
    '--orion-border': baseColors.border,
    '--orion-border-strong': baseColors.borderStrong,
    '--orion-text': baseColors.text,
    '--orion-text-primary': baseColors.text,
    '--orion-text-secondary': baseColors.textSecondary,
    '--orion-text-muted': baseColors.textMuted,
    '--orion-text-disabled': baseColors.textMuted,

    // Backward-compatible OS aliases
    '--os-bg': baseColors.background,
    '--os-surface': baseColors.surface,
    '--os-surface-secondary': baseColors.surfaceSecondary,
    '--os-surface-elevated': baseColors.surfaceElevated,
    '--os-surface-hover': baseColors.surfaceHover,
    '--os-border': baseColors.border,
    '--os-border-strong': baseColors.borderStrong,
    '--os-input-bg': effectiveMode === 'light' ? '#FFFFFF' : baseColors.surface,
    '--os-text-primary': baseColors.text,
    '--os-text-secondary': baseColors.textSecondary,
    '--os-text-muted': baseColors.textMuted,
    '--os-text-primary-inverse': textOnAccent,
    '--os-on-accent': textOnAccent,
    '--os-accent': accentState.accent,
    '--os-accent-subtle': accentSubtle,

    '--orion-accent': accentState.accent,
    '--orion-accent-hover': accentHover,
    '--orion-accent-active': accentActive,
    '--orion-accent-muted': accentSubtle,
    '--orion-accent-soft': accentSubtle,
    '--orion-accent-subtle': accentSubtle,
    '--orion-accent-foreground': textOnAccent,
    '--orion-on-accent': textOnAccent,
    '--orion-focus': accentState.focusGlow,
    '--orion-focus-ring': settings.highContrastFocusRing ? '#F59E0B' : accentState.focusRing,
    '--orion-topbar-bg': effectiveMode === 'light' ? 'rgba(249, 250, 251, 0.90)' : 'rgba(18, 22, 28, 0.80)',
    '--orion-topbar-border': effectiveMode === 'light' ? 'rgba(15, 23, 42, 0.10)' : 'rgba(255, 255, 255, 0.08)',
    '--orion-danger-foreground': calculateContrastColor(canonicalTheme.colors.danger, { backingColor: baseColors.surface }),

    '--orion-dock-surface': dockSurface,
    '--orion-dock-bg': dockSurface,
    '--orion-dock-opacity': `${(settings.dockTransparency ?? 85) / 100}`,
    '--orion-dock-border': dockBorder,
    '--orion-dock-shadow': dockShadow,
    '--orion-dock-active': accentHex,
    '--orion-dock-hover': accentSubtle,
    '--orion-dock-text': canonicalTheme.colors.textPrimary,
    '--orion-dock-text-muted': canonicalTheme.colors.textMuted,

    '--orion-radius': radius,
    '--orion-window-blur': windowBlur,
    '--orion-ui-scale': `${uiScaleRatio}`,
    '--orion-density-padding': densityPadding,

    '--orion-window-header-bg': baseColors.windowHeaderBg,
    '--orion-card-bg': baseColors.cardBg,
    '--orion-desktop-icon-label': baseColors.desktopIconLabel || '#F3EBDD',

    '--orion-wallpaper-blur': `${settings.wallpaperBlur ?? 0}px`,
    '--orion-wallpaper-dim': `${(settings.wallpaperDim ?? 0) / 100}`,

    '--orion-success': canonicalTheme.colors.success,
    '--orion-warning': canonicalTheme.colors.warning,
    '--orion-danger': canonicalTheme.colors.danger,
    '--orion-info': canonicalTheme.colors.info
  };
}

/**
 * Applies the personalization settings to document.documentElement.
 * Canonical delegate to applyThemeToDOM to eliminate dual-writer state fragmentation.
 */
export function applyThemeToDocument(settings: PersonalizationSettings): void {
  if (typeof document === 'undefined') return;

  const systemIsDark = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true;

  const activePrefs = loadPreferences();
  const targetThemeId: OrionThemeId = (settings.themeId && isValidThemeId(settings.themeId))
    ? settings.themeId
    : (activePrefs.themeId || 'graphite');
  const targetTheme = getTheme(targetThemeId);

  let effectiveMode: 'light' | 'dark';
  if (settings.themeId && isValidThemeId(settings.themeId)) {
    effectiveMode = targetTheme.appearance.mode;
  } else if (settings.appearanceMode === 'auto') {
    effectiveMode = systemIsDark ? 'dark' : 'light';
  } else {
    effectiveMode = ((settings.appearanceMode as 'light' | 'dark') || (systemIsDark ? 'dark' : 'light'));
  }

  const canonicalTheme = resolveCompatibleTheme(targetThemeId, effectiveMode);

  // Authoritative canonical DOM update
  applyThemeToDOM(canonicalTheme, {
    ...activePrefs,
    themeId: canonicalTheme.id,
    appearanceMode: effectiveMode,
    windowControlPosition: settings.windowControlPosition || activePrefs.windowControlPosition,
    reduceMotion: settings.reducedMotion ?? activePrefs.reduceMotion,
  });

  const root = document.documentElement;

  // Set non-conflicting peripheral layout data attributes
  const animationStyle = settings.reducedMotion ? 'reduced' : (settings.animationStyle || 'premium');
  const isReducedMotion = Boolean(settings.reducedMotion || animationStyle === 'reduced');
  const isReducedTransparency = Boolean(settings.reducedTransparency || animationStyle === 'minimal');

  root.setAttribute('data-theme', canonicalTheme.appearance.mode);
  root.setAttribute('data-window-style', settings.windowStyle || activePrefs.windowStyle);
  root.setAttribute('data-corner-style', settings.cornerStyle || 'rounded');
  root.setAttribute('data-density', settings.density || 'comfortable');
  root.setAttribute('data-color-filter', settings.colorFilter || 'none');
  root.setAttribute('data-animation-style', animationStyle);
  root.setAttribute('data-reduced-motion', String(isReducedMotion));
  root.setAttribute('data-reduced-transparency', String(isReducedTransparency));

  // Apply UI Scale transform variable if specified
  if (settings.uiScale && settings.uiScale !== 100) {
    root.style.fontSize = `${(settings.uiScale / 100) * 16}px`;
  } else {
    root.style.fontSize = '';
  }
}

/**
 * Safely exports personalization settings as JSON string.
 */
export function exportThemeJSON(settings: PersonalizationSettings, themeName = 'Orion Custom Theme'): string {
  const exportPayload: CustomThemeExport = {
    version: '1.0.0',
    name: themeName.replace(/[<>]/g, ''),
    createdAt: new Date().toISOString(),
    settings: { ...settings }
  };
  return JSON.stringify(exportPayload, null, 2);
}

/**
 * Validates and imports theme JSON safely without script/injection risk.
 */
export function importThemeJSON(jsonString: string): PersonalizationSettings | null {
  try {
    const parsed = JSON.parse(jsonString) as CustomThemeExport;
    if (!parsed || typeof parsed !== 'object' || !parsed.settings) {
      return null;
    }
    const incoming = parsed.settings;
    return {
      ...DEFAULT_PERSONALIZATION_SETTINGS,
      ...incoming,
      // Enforce clean types
      appearanceMode: ['dark', 'light', 'auto', 'oled', 'monochrome'].includes(incoming.appearanceMode as any)
        ? incoming.appearanceMode!
        : 'dark',
      windowStyle: ['standard', 'soft', 'glass', 'compact', 'spacious'].includes(incoming.windowStyle as any)
        ? incoming.windowStyle!
        : 'standard',
      cornerStyle: ['square', 'subtle', 'rounded'].includes(incoming.cornerStyle as any)
        ? incoming.cornerStyle!
        : 'subtle',
      density: ['compact', 'comfortable', 'spacious'].includes(incoming.density as any)
        ? incoming.density!
        : 'comfortable',
      windowControlPosition: ['left', 'right'].includes(incoming.windowControlPosition as any)
        ? (incoming.windowControlPosition as 'left' | 'right')
        : 'left',
      uiScale: typeof incoming.uiScale === 'number' && incoming.uiScale >= 80 && incoming.uiScale <= 150
        ? incoming.uiScale
        : 100
    };
  } catch (err) {
    console.error('Failed to parse Orion Theme JSON:', err);
    return null;
  }
}
