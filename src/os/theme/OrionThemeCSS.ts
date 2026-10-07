import { OrionTheme, OrionAppearancePreferences, OrionCornerRadius } from './OrionThemeTypes';
import { computeMorphismTokens } from './OrionMorphismTokens';

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
                  --orion-surface-elevated 200ms ease, --orion-accent 200ms ease;
    }
    
    *, *::before, *::after {
      /* Apply theme transition globally if needed or scoped */
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
  root.style.setProperty('--orion-surface', theme.colors.surface);
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
  root.style.setProperty('--os-surface-elevated', theme.colors.surfaceElevated);
  root.style.setProperty('--os-surface-hover', theme.colors.surfaceHover);
  root.style.setProperty('--os-surface-active', theme.colors.surfaceActive);
  root.style.setProperty('--os-text-primary', theme.colors.textPrimary);
  root.style.setProperty('--os-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--os-text-muted', theme.colors.textMuted);
  root.style.setProperty('--os-text-disabled', theme.colors.textDisabled);
  root.style.setProperty('--os-border', theme.colors.border);
  root.style.setProperty('--os-border-strong', theme.colors.borderStrong);

  // Accent logic
  const accent = (preferences.customAccentEnabled && preferences.customAccent) 
    ? preferences.customAccent 
    : theme.colors.accent;
  root.style.setProperty('--orion-accent', accent);
  root.style.setProperty('--orion-accent-soft', theme.colors.accentSoft);
  root.style.setProperty('--os-accent', accent);
  root.style.setProperty('--os-accent-subtle', theme.colors.accentSoft);

  // Status colors
  root.style.setProperty('--orion-success', theme.colors.success);
  root.style.setProperty('--orion-warning', theme.colors.warning);
  root.style.setProperty('--orion-danger', theme.colors.danger);
  root.style.setProperty('--orion-critical', theme.colors.danger);
  root.style.setProperty('--orion-info', theme.colors.info);
  root.style.setProperty('--orion-focus', theme.colors.focus);

  // Effects and UI vars
  const glassOpacity = preferences.transparencyEnabled ? (preferences.transparencyIntensity / 100) * theme.effects.glassOpacity : 1;
  const blur = preferences.blurEnabled ? (preferences.blurIntensity / 100) * theme.effects.blur : 0;
  
  root.style.setProperty('--orion-glass-opacity', glassOpacity.toString());
  root.style.setProperty('--orion-blur', blur + 'px');
  root.style.setProperty('--orion-shadow-intensity', theme.effects.shadowIntensity.toString());
  
  const radius = getCornerRadiusValue(preferences.cornerRadius);
  root.style.setProperty('--orion-radius', radius + 'px');

  // Charts
  root.style.setProperty('--orion-chart-1', theme.chart.chart1);
  root.style.setProperty('--orion-chart-2', theme.chart.chart2);
  root.style.setProperty('--orion-chart-3', theme.chart.chart3);
  root.style.setProperty('--orion-chart-4', theme.chart.chart4);
  root.style.setProperty('--orion-chart-5', theme.chart.chart5);

  // Desktop Icon Label & Dock styling
  root.style.setProperty('--orion-desktop-icon-label', theme.colors.desktopIconLabel || (theme.appearance.mode === 'light' ? '#17191B' : '#F3EBDD'));
  root.style.setProperty('--orion-dock-bg', theme.colors.dockBg || 'rgba(241, 236, 226, 0.94)');
  root.style.setProperty('--orion-dock-border', theme.colors.dockBorder || 'rgba(70, 65, 55, 0.16)');
  root.style.setProperty('--orion-dock-shadow', theme.colors.dockShadow || '0 20px 48px rgba(0, 0, 0, 0.45)');

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
  root.setAttribute('data-orion-theme', theme.id);
  root.setAttribute('data-orion-mode', theme.appearance.mode);
  root.setAttribute('data-orion-morphism', morph.mode);
  root.setAttribute('data-window-control-position', preferences.windowControlPosition || 'left');
  root.classList.remove('light', 'dark');
  root.classList.add(theme.appearance.mode);
  root.style.colorScheme = theme.appearance.mode;
  if (document.body) {
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.textPrimary;
  }
}

