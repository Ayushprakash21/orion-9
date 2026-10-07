import { OrionTheme, OrionAppearancePreferences, OrionCornerRadius } from './OrionThemeTypes';

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

  // Motion
  root.style.setProperty('--orion-transition-speed', preferences.reduceMotion ? '0ms' : '150ms');

  // Metadata attributes and classList toggle for light/dark Tailwind/OS styling
  root.setAttribute('data-orion-theme', theme.id);
  root.setAttribute('data-orion-mode', theme.appearance.mode);
  root.classList.remove('light', 'dark');
  root.classList.add(theme.appearance.mode);
  root.style.colorScheme = theme.appearance.mode;
  if (document.body) {
    document.body.style.backgroundColor = theme.colors.background;
    document.body.style.color = theme.colors.textPrimary;
  }
}
