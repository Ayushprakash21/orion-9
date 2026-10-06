export const ORION_THEME_VARIABLES = {
  // Base Foundations
  background: '--orion-background',
  backgroundSecondary: '--orion-background-secondary',
  surface: '--orion-surface',
  surfaceSecondary: '--orion-surface-secondary',
  surfaceElevated: '--orion-surface-elevated',
  surfaceHover: '--orion-surface-hover',
  border: '--orion-border',
  borderStrong: '--orion-border-strong',
  text: '--orion-text',
  textSecondary: '--orion-text-secondary',
  textMuted: '--orion-text-muted',

  // Accent Colors
  accent: '--orion-accent',
  accentHover: '--orion-accent-hover',
  accentSubtle: '--orion-accent-subtle',
  onAccent: '--orion-on-accent',
  focusRing: '--orion-focus-ring',

  // Layout & Geometry
  radius: '--orion-radius',
  windowBlur: '--orion-window-blur',
  uiScale: '--orion-ui-scale',

  // Dock & Window SPECIFICS
  windowHeaderBg: '--orion-window-header-bg',
  dockBg: '--orion-dock-bg',
  cardBg: '--orion-card-bg',

  // Functional Status Colors
  success: '--orion-success',
  warning: '--orion-warning',
  danger: '--orion-danger',
  info: '--orion-info'
} as const;

export type OrionThemeVariableKey = keyof typeof ORION_THEME_VARIABLES;
