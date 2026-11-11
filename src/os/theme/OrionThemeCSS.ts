import { OrionTheme, OrionAppearancePreferences, OrionCornerRadius } from './OrionThemeTypes';
import { computeMorphismTokens } from './OrionMorphismTokens';
import {
  calculateContrastColor,
  adjustHexBrightness,
  hexToRgba,
  resolveAccessibleAccentStates,
} from './OrionContrast';

export { calculateContrastColor, adjustHexBrightness, hexToRgba };

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
  root.style.setProperty('--orion-card-bg', theme.colors.surfaceElevated);
  root.style.setProperty('--orion-window-header-bg', theme.colors.surfaceElevated);

  root.style.setProperty('--orion-text', theme.colors.textPrimary);
  root.style.setProperty('--orion-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--orion-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--orion-text-muted', theme.colors.textMuted);
  root.style.setProperty('--orion-text-disabled', theme.colors.textDisabled);

  const isDark = theme.appearance.mode === 'dark';
  const subtleBorder = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(15, 23, 42, 0.06)';
  root.style.setProperty('--orion-border', theme.colors.border);
  root.style.setProperty('--orion-border-subtle', subtleBorder);
  root.style.setProperty('--orion-border-strong', theme.colors.borderStrong);

  // Synchronize OS aliases for complete shell compatibility
  root.style.setProperty('--os-bg', theme.colors.background);
  root.style.setProperty('--os-surface', theme.colors.surface);
  root.style.setProperty('--os-surface-secondary', theme.colors.surfaceElevated);
  root.style.setProperty('--os-surface-elevated', theme.colors.surfaceElevated);
  root.style.setProperty('--os-surface-hover', theme.colors.surfaceHover);
  root.style.setProperty('--os-surface-active', theme.colors.surfaceActive);
  root.style.setProperty('--os-input-bg', isDark ? theme.colors.surface : '#FFFFFF');
  root.style.setProperty('--os-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--os-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--os-text-muted', theme.colors.textMuted);
  root.style.setProperty('--os-text-disabled', theme.colors.textDisabled);
  root.style.setProperty('--os-border', theme.colors.border);
  root.style.setProperty('--os-border-subtle', subtleBorder);
  root.style.setProperty('--os-border-strong', theme.colors.borderStrong);

  // ── ACCENT RESOLUTION & LIVE WCAG CONTRAST PROPAGATION ───────────────────
  const requestedAccent = (preferences.customAccentEnabled && preferences.customAccent)
    ? preferences.customAccent
    : theme.colors.accent;

  const accentState = resolveAccessibleAccentStates(requestedAccent, theme.appearance.mode, theme.colors.surface);

  root.style.setProperty('--orion-accent', accentState.accent);
  root.style.setProperty('--orion-accent-hover', accentState.hover);
  root.style.setProperty('--orion-accent-active', accentState.active);
  root.style.setProperty('--orion-accent-muted', accentState.soft);
  root.style.setProperty('--orion-accent-soft', accentState.soft);
  root.style.setProperty('--orion-accent-subtle', accentState.soft);
  root.style.setProperty('--orion-accent-foreground', accentState.foreground);
  root.style.setProperty('--orion-accent-glow', accentState.focusGlow);
  root.style.setProperty('--orion-on-accent', accentState.foreground);
  root.style.setProperty('--os-accent', accentState.accent);
  root.style.setProperty('--os-accent-subtle', accentState.soft);
  root.style.setProperty('--os-on-accent', accentState.foreground);
  root.style.setProperty('--os-text-primary-inverse', accentState.foreground);
  root.style.setProperty('--orion-focus', accentState.focusGlow);
  root.style.setProperty('--orion-focus-ring', accentState.focusRing);

  // Status & Semantic Button Foregrounds
  const dangerFg = calculateContrastColor(theme.colors.danger, { backingColor: theme.colors.surface });
  const successFg = calculateContrastColor(theme.colors.success, { backingColor: theme.colors.surface });
  const warningFg = calculateContrastColor(theme.colors.warning, { backingColor: theme.colors.surface });
  root.style.setProperty('--orion-success', theme.colors.success);
  root.style.setProperty('--orion-success-foreground', successFg);
  root.style.setProperty('--orion-warning', theme.colors.warning);
  root.style.setProperty('--orion-warning-foreground', warningFg);
  root.style.setProperty('--orion-danger', theme.colors.danger);
  root.style.setProperty('--orion-danger-foreground', dangerFg);
  root.style.setProperty('--orion-critical', theme.colors.danger);
  root.style.setProperty('--orion-info', theme.colors.info);

  // Topbar / Chrome Surface Tokens
  root.style.setProperty(
    '--orion-topbar-bg',
    isDark ? 'rgba(18, 22, 28, 0.80)' : 'rgba(249, 250, 251, 0.90)'
  );
  root.style.setProperty(
    '--orion-topbar-border',
    isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(15, 23, 42, 0.10)'
  );

  // ── DOCK TOKENS (THEME & ACCENT UNIFIED) ───────────────────────────────────
  const accent = accentState.accent;
  const accentSoft = accentState.soft;
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

  const dockOpacityVal = ((preferences.dockOpacity ?? 85) / 100);
  const dockBlurVal = Math.round(((preferences.dockBlur ?? 80) / 100) * 40);
  root.style.setProperty('--orion-dock-opacity', dockOpacityVal.toString());
  root.style.setProperty('--orion-dock-blur', `${dockBlurVal}px`);

  const dockTint = preferences.dockTint || 'auto';
  let dockTintBg = dockSurface;
  if (dockTint === 'light') {
    dockTintBg = 'rgba(255, 255, 255, 0.70)';
  } else if (dockTint === 'accent') {
    dockTintBg = `color-mix(in srgb, ${accent} 25%, rgba(20, 24, 32, 0.70))`;
  } else if (dockTint === 'dark') {
    dockTintBg = 'rgba(10, 12, 16, 0.85)';
  }
  root.style.setProperty('--orion-dock-tint-bg', dockTintBg);

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

