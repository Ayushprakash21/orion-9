/**
 * CSS Variable map for theme consumption
 */
export const ORION_CSS_VARS = {
  bg: 'var(--orion-bg)',
  surface: 'var(--orion-surface)',
  surfaceElevated: 'var(--orion-surface-elevated)',
  surfaceHover: 'var(--orion-surface-hover)',
  surfaceActive: 'var(--orion-surface-active)',
  textPrimary: 'var(--orion-text-primary)',
  textSecondary: 'var(--orion-text-secondary)',
  textMuted: 'var(--orion-text-muted)',
  textDisabled: 'var(--orion-text-disabled)',
  border: 'var(--orion-border)',
  borderStrong: 'var(--orion-border-strong)',
  accent: 'var(--orion-accent)',
  accentSoft: 'var(--orion-accent-soft)',
  success: 'var(--orion-success)',
  warning: 'var(--orion-warning)',
  danger: 'var(--orion-danger)',
  info: 'var(--orion-info)',
  focus: 'var(--orion-focus)',
  glassOpacity: 'var(--orion-glass-opacity)',
  blur: 'var(--orion-blur)',
  shadowIntensity: 'var(--orion-shadow-intensity)',
  radius: 'var(--orion-radius)',
  chart1: 'var(--orion-chart-1)',
  chart2: 'var(--orion-chart-2)',
  chart3: 'var(--orion-chart-3)',
  chart4: 'var(--orion-chart-4)',
  chart5: 'var(--orion-chart-5)',
  transitionSpeed: 'var(--orion-transition-speed)',

  // Morphic Tokens
  morphMode: 'var(--orion-morph-mode)',
  morphSurface: 'var(--orion-morph-surface)',
  morphSurfaceSubtle: 'var(--orion-morph-surface-subtle)',
  morphSurfaceElevated: 'var(--orion-morph-surface-elevated)',
  morphSurfaceHover: 'var(--orion-morph-surface-hover)',
  morphSurfaceActive: 'var(--orion-morph-surface-active)',
  morphSurfacePressed: 'var(--orion-morph-surface-pressed)',
  morphSurfaceDisabled: 'var(--orion-morph-surface-disabled)',
  morphBorder: 'var(--orion-morph-border)',
  morphBorderStrong: 'var(--orion-morph-border-strong)',
  morphBlur: 'var(--orion-morph-blur)',
  morphBackdrop: 'var(--orion-morph-backdrop)',
  morphSaturation: 'var(--orion-morph-saturation)',
  morphShadow: 'var(--orion-morph-shadow)',
  morphShadowSoft: 'var(--orion-morph-shadow-soft)',
  morphShadowDeep: 'var(--orion-morph-shadow-deep)',
  morphShadowInset: 'var(--orion-morph-shadow-inset)',
  morphHighlight: 'var(--orion-morph-highlight)',
  morphElevation0: 'var(--orion-morph-elevation-0)',
  morphElevation1: 'var(--orion-morph-elevation-1)',
  morphElevation2: 'var(--orion-morph-elevation-2)',
  morphElevation3: 'var(--orion-morph-elevation-3)',
  morphElevationModal: 'var(--orion-morph-elevation-modal)',
};


/**
 * Returns the CSS variable string for a given token name
 */
export function orionVar(name: string): string {
  return `var(--orion-${name})`;
}

/**
 * Helper to build arbitrary class values for Tailwind like 'text-[var(--orion-accent)]'
 */
export function orionColor(name: string): string {
  return `var(--orion-${name})`;
}
