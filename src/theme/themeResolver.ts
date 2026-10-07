import { PersonalizationSettings, CustomThemeExport, AccentPresetKey } from './themeTypes';
import { APPEARANCE_PRESETS, ACCENT_PRESETS, DEFAULT_PERSONALIZATION_SETTINGS } from './themePresets';

/**
 * Calculates WCAG relative luminance to determine optimal foreground text color (#FFFFFF or #0F172A).
 */
export function calculateContrastColor(hexColor: string): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return '#FFFFFF';

  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  return luminance > 0.45 ? '#0F172A' : '#FFFFFF';
}

/**
 * Lightens or darkens a hex color for hover/subtle states.
 */
export function adjustHexBrightness(hexColor: string, percent: number): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return hexColor;

  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));

  return `#${(1 << 24 | R << 16 | G << 8 | B).toString(16).slice(1)}`;
}

/**
 * Resolves full set of CSS variables for a given personalization configuration.
 */
export function resolveThemeVariables(
  settings: PersonalizationSettings,
  systemIsDark: boolean = true
): Record<string, string> {
  // 1. Resolve Effective Mode
  let effectiveMode = settings.appearanceMode;
  if (effectiveMode === 'auto') {
    effectiveMode = systemIsDark ? 'dark' : 'light';
  }

  // Handle High Contrast override
  if (settings.highContrast) {
    effectiveMode = 'monochrome';
  }

  const baseColors = APPEARANCE_PRESETS[effectiveMode as keyof typeof APPEARANCE_PRESETS] || APPEARANCE_PRESETS.dark;

  // 2. Resolve Accent Color
  let accentHex = '#64748B'; // Default slate neutral
  if (settings.accentKey === 'custom' && settings.customAccentHex) {
    accentHex = settings.customAccentHex;
  } else if (settings.accentKey && ACCENT_PRESETS[settings.accentKey as AccentPresetKey]) {
    accentHex = ACCENT_PRESETS[settings.accentKey as AccentPresetKey].hex;
  }

  const textOnAccent = calculateContrastColor(accentHex);
  const accentHover = adjustHexBrightness(accentHex, effectiveMode === 'light' ? -12 : 12);
  const accentSubtle = `${accentHex}22`; // 13% opacity hex

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
    '--os-text-primary': baseColors.text,
    '--os-text-secondary': baseColors.textSecondary,
    '--os-text-muted': baseColors.textMuted,
    '--os-accent': accentHex,
    '--os-accent-subtle': accentSubtle,

    '--orion-accent': accentHex,
    '--orion-accent-soft': accentSubtle,
    '--orion-accent-hover': accentHover,
    '--orion-accent-subtle': accentSubtle,
    '--orion-on-accent': textOnAccent,
    '--orion-focus-ring': settings.highContrastFocusRing ? '#F59E0B' : accentHex,

    '--orion-radius': radius,
    '--orion-window-blur': windowBlur,
    '--orion-ui-scale': `${uiScaleRatio}`,
    '--orion-density-padding': densityPadding,

    '--orion-window-header-bg': baseColors.windowHeaderBg,
    '--orion-dock-bg': baseColors.dockBg,
    '--orion-card-bg': baseColors.cardBg,

    '--orion-success': '#10B981',
    '--orion-warning': '#F59E0B',
    '--orion-danger': '#EF4444',
    '--orion-info': '#3B82F6'
  };
}

/**
 * Applies the personalization settings to document.documentElement.
 */
export function applyThemeToDocument(settings: PersonalizationSettings): void {
  if (typeof document === 'undefined') return;

  const systemIsDark = typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : true;

  const vars = resolveThemeVariables(settings, systemIsDark);
  const root = document.documentElement;

  // Set CSS Custom Properties
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });

  // Set DOM Data Attributes for CSS targeted rules
  let effectiveMode = settings.appearanceMode;
  if (effectiveMode === 'auto') effectiveMode = systemIsDark ? 'dark' : 'light';
  if (settings.highContrast) effectiveMode = 'monochrome';

  root.setAttribute('data-theme', effectiveMode);
  root.setAttribute('data-window-style', settings.windowStyle);
  root.setAttribute('data-corner-style', settings.cornerStyle);
  root.setAttribute('data-density', settings.density);
  root.setAttribute('data-reduced-motion', settings.reducedMotion ? 'true' : 'false');
  root.setAttribute('data-reduced-transparency', settings.reducedTransparency ? 'true' : 'false');
  root.setAttribute('data-color-filter', settings.colorFilter || 'none');

  // Toggle light/dark classes for Tailwind & system chrome
  if (root.classList) {
    root.classList.remove('light', 'dark');
    root.classList.add(effectiveMode === 'light' ? 'light' : 'dark');
  }
  if (root.style) {
    root.style.colorScheme = effectiveMode === 'light' ? 'light' : 'dark';
  }

  if (document.body) {
    document.body.style.backgroundColor = vars['--orion-bg'] || vars['--os-bg'];
    document.body.style.color = vars['--orion-text-primary'] || vars['--os-text-primary'];
  }

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
      uiScale: typeof incoming.uiScale === 'number' && incoming.uiScale >= 80 && incoming.uiScale <= 150
        ? incoming.uiScale
        : 100
    };
  } catch (err) {
    console.error('Failed to parse Orion Theme JSON:', err);
    return null;
  }
}
