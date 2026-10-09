import { OrionTheme, OrionAppearancePreferences, OrionCornerRadius } from './OrionThemeTypes';
import { computeMorphismTokens } from './OrionMorphismTokens';

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
 * Converts a hex color to an rgba string with specified opacity.
 */
export function hexToRgba(hexColor: string, alpha: number): string {
  let hex = hexColor.replace('#', '');
  if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
  if (hex.length !== 6) return `rgba(216, 221, 227, ${alpha})`;
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Maps corner radius preset to actual pixel value
 */
export function getCornerRadiusValue(preset: OrionCornerRadius): number {
  switch (preset) {
    case 'compact':
      return 4;
    case 'standard':
      return 10;
    case 'rounded':
      return 18;
    default:
      return 10;
  }
}

/**
 * Injects base CSS transitions for theme variables
 */
export function injectBaseTransitions(): void {
  if (typeof document === 'undefined') return;

  const styleId = 'orion-theme-transitions';
  if (document.getElementById(styleId)) return;

  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    :root {
      transition: background-color 200ms ease, color 200ms ease, border-color 200ms ease, 
                  --orion-bg 200ms ease, --orion-surface 200ms ease, 
                  --orion-surface-elevated 200ms ease, --orion-accent 200ms ease,
                  --orion-accent-soft 200ms ease, --orion-dock-surface 200ms ease,
                  --orion-dock-bg 200ms ease, --orion-dock-border 200ms ease,
                  --orion-dock-active 200ms ease, --orion-dock-hover 200ms ease;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Applies the provided theme and preferences to the DOM
 */
export function applyThemeToDOM(theme: OrionTheme, preferences: OrionAppearancePreferences): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  // Apply basic color palette
  root.style.setProperty('--orion-bg', theme.colors.background);
  root.style.setProperty('--orion-background', theme.colors.background);
  root.style.setProperty('--orion-background-secondary', theme.colors.surface);
  root.style.setProperty('--orion-surface', theme.colors.surface);
  root.style.setProperty('--orion-surface-secondary', theme.colors.surfaceElevated);
  root.style.setProperty('--orion-surface-elevated', theme.colors.surfaceElevated);
  root.style.setProperty('--orion-surface-hover', theme.colors.surfaceHover);
  root.style.setProperty('--orion-surface-active', theme.colors.surfaceActive);

  root.style.setProperty('--orion-text', theme.colors.textPrimary);
  root.style.setProperty('--orion-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--orion-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--orion-text-muted', theme.colors.textMuted);
  root.style.setProperty('--orion-text-disabled', theme.colors.textDisabled);

  root.style.setProperty('--orion-border', theme.colors.border);
  root.style.setProperty('--orion-border-strong', theme.colors.borderStrong);

  // Synchronize OS aliases for complete shell compatibility
  root.style.setProperty('--os-bg', theme.colors.background);
  root.style.setProperty('--os-surface', theme.colors.surface);
  root.style.setProperty('--os-surface-secondary', theme.colors.surfaceElevated);
  root.style.setProperty('--os-surface-elevated', theme.colors.surfaceElevated);
  root.style.setProperty('--os-surface-hover', theme.colors.surfaceHover);
  root.style.setProperty('--os-surface-active', theme.colors.surfaceActive);
  root.style.setProperty('--os-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--os-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--os-text-muted', theme.colors.textMuted);
  root.style.setProperty('--os-text-disabled', theme.colors.textDisabled);
  root.style.setProperty('--os-border', theme.colors.border);
  root.style.setProperty('--os-border-strong', theme.colors.borderStrong);

  // ── ACCENT RESOLUTION & LIVE PROPAGATION ───────────────────────────────────
  const isDark = theme.appearance.mode === 'dark';
  const accent = (preferences.customAccentEnabled && preferences.customAccent) 
    ? preferences.customAccent 
    : theme.colors.accent;

  const accentForeground = calculateContrastColor(accent);
  const accentHover = adjustHexBrightness(accent, isDark ? 12 : -12);
  const accentActive = adjustHexBrightness(accent, isDark ? 20 : -20);
  const accentSoft = hexToRgba(accent, 0.15);
  const accentFocusGlow = hexToRgba(accent, 0.40);

  root.style.setProperty('--orion-accent', accent);
  root.style.setProperty('--orion-accent-hover', accentHover);
  root.style.setProperty('--orion-accent-active', accentActive);
  root.style.setProperty('--orion-accent-muted', accentSoft);
  root.style.setProperty('--orion-accent-soft', accentSoft);
  root.style.setProperty('--orion-accent-subtle', accentSoft);
  root.style.setProperty('--orion-accent-foreground', accentForeground);
  root.style.setProperty('--orion-accent-glow', accentFocusGlow);
  root.style.setProperty('--orion-on-accent', accentForeground);
  root.style.setProperty('--os-accent', accent);
  root.style.setProperty('--os-accent-subtle', accentSoft);
  root.style.setProperty('--orion-focus', accentFocusGlow);
  root.style.setProperty('--orion-focus-ring', accent);

  // Status colors
  root.style.setProperty('--orion-success', theme.colors.success);
  root.style.setProperty('--orion-warning', theme.colors.warning);
  root.style.setProperty('--orion-danger', theme.colors.danger);
  root.style.setProperty('--orion-critical', theme.colors.danger);
  root.style.setProperty('--orion-info', theme.colors.info);

  // ── DOCK TOKENS (THEME & ACCENT UNIFIED) ───────────────────────────────────
  const dockSurface = theme.colors.dockBg || theme.colors.surfaceElevated;
  const dockBorder = theme.colors.dockBorder || theme.colors.borderStrong;
  const dockShadow = theme.colors.dockShadow || '0 20px 48px rgba(0, 0, 0, 0.50)';

  root.style.setProperty('--orion-dock-surface', dockSurface);
  root.style.setProperty('--orion-dock-bg', dockSurface);
  root.style.setProperty('--orion-dock-border', dockBorder);
  root.style.setProperty('--orion-dock-shadow', dockShadow);
  root.style.setProperty('--orion-dock-active', accent);
  root.style.setProperty('--orion-dock-hover', accentSoft);
  root.style.setProperty('--orion-dock-text', theme.colors.textPrimary);
  root.style.setProperty('--orion-dock-text-muted', theme.colors.textMuted);

  // Effects and UI vars
  const glassOpacity = preferences.transparencyEnabled ? (preferences.transparencyIntensity / 100) * theme.effects.glassOpacity : 1;
  const blur = preferences.blurEnabled ? (preferences.blurIntensity / 100) * theme.effects.blur : 0;
  
  root.style.setProperty('--orion-glass-opacity', glassOpacity.toString());
  root.style.setProperty('--orion-blur', blur + 'px');
  root.style.setProperty('--orion-shadow-intensity', theme.effects.shadowIntensity.toString());
  root.style.setProperty('--orion-transparency-intensity', (preferences.transparencyIntensity ?? 70).toString());
  root.style.setProperty('--orion-transparency-alpha', ((preferences.transparencyIntensity ?? 70) / 100).toFixed(3));
  
  const radius = getCornerRadiusValue(preferences.cornerRadius);
  root.style.setProperty('--orion-radius', radius + 'px');

  // Charts
  root.style.setProperty('--orion-chart-1', theme.chart.chart1);
  root.style.setProperty('--orion-chart-2', theme.chart.chart2);
  root.style.setProperty('--orion-chart-3', theme.chart.chart3);
  root.style.setProperty('--orion-chart-4', theme.chart.chart4);
  root.style.setProperty('--orion-chart-5', theme.chart.chart5);

  // Desktop Icon Label styling
  root.style.setProperty('--orion-desktop-icon-label', theme.colors.desktopIconLabel || (theme.appearance.mode === 'light' ? '#17191B' : '#F3EBDD'));
  root.style.setProperty('--orion-desktop-icon-shadow', theme.appearance.mode === 'light' ? '0 1px 2px rgba(255, 255, 255, 0.9)' : '0 1px 3px rgba(0, 0, 0, 0.75)');

  // Motion
  root.style.setProperty('--orion-transition-speed', preferences.reduceMotion ? '0ms' : '150ms');

  // Compute and inject Canonical Morphic System Tokens
  const morph = computeMorphismTokens(theme, preferences);
  root.style.setProperty('--orion-morph-mode', morph.mode);
  root.style.setProperty('--orion-morph-surface', morph.surface);
  root.style.setProperty('--orion-morph-surface-subtle', morph.surfaceSubtle);
  root.style.setProperty('--orion-morph-surface-elevated', morph.surfaceElevated);
  root.style.setProperty('--orion-morph-surface-hover', morph.surfaceHover);
  root.style.setProperty('--orion-morph-surface-active', morph.surfaceActive);
  root.style.setProperty('--orion-morph-surface-pressed', morph.surfacePressed);
  root.style.setProperty('--orion-morph-surface-disabled', morph.surfaceDisabled);

  root.style.setProperty('--orion-morph-border', morph.border);
  root.style.setProperty('--orion-morph-border-strong', morph.borderStrong);

  root.style.setProperty('--orion-morph-blur', morph.blur);
  root.style.setProperty('--orion-morph-backdrop', morph.backdrop);
  root.style.setProperty('--orion-morph-saturation', morph.saturation);

  root.style.setProperty('--orion-morph-shadow', morph.shadow);
  root.style.setProperty('--orion-morph-shadow-soft', morph.shadowSoft);
  root.style.setProperty('--orion-morph-shadow-deep', morph.shadowDeep);
  root.style.setProperty('--orion-morph-shadow-inset', morph.shadowInset);
  root.style.setProperty('--orion-morph-highlight', morph.highlight);

  root.style.setProperty('--orion-morph-elevation-0', morph.elevation0);
  root.style.setProperty('--orion-morph-elevation-1', morph.elevation1);
  root.style.setProperty('--orion-morph-elevation-2', morph.elevation2);
  root.style.setProperty('--orion-morph-elevation-3', morph.elevation3);
  root.style.setProperty('--orion-morph-elevation-modal', morph.elevationModal);

  // Metadata attributes and classList toggle for light/dark Tailwind/OS styling
  if (root.setAttribute) {
    root.setAttribute('data-orion-theme', theme.id);
    root.setAttribute('data-orion-mode', theme.appearance.mode);
    root.setAttribute('data-orion-morphism', morph.mode);
    root.setAttribute('data-window-control-position', preferences.windowControlPosition || 'left');
  }
  if (root.classList) {
    root.classList.remove('light', 'dark');
    root.classList.add(theme.appearance.mode);
  }
  if (root.style) {
    root.style.colorScheme = theme.appearance.mode;
  }
  if (typeof document !== 'undefined' && document.body && document.body.style) {
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.textPrimary;
  }
}

