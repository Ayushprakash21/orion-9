/**
 * ORION-9 OS LIFECYCLE DESIGN TOKENS
 * Authoritative color palette, curves, and timing constants for all OS lifecycle transitions.
 * Enforces restrained, aerospace-grade dark graphite, silver, soft sky, and semantic statuses.
 */

export const ORION_LIFECYCLE_COLORS = {
  bg: '#050811',
  bgDark: '#030509',
  surface: 'rgba(255, 255, 255, 0.035)',
  surfaceHover: 'rgba(255, 255, 255, 0.065)',
  surfaceActive: 'rgba(255, 255, 255, 0.09)',
  border: 'rgba(255, 255, 255, 0.12)',
  borderHighlight: 'rgba(255, 255, 255, 0.25)',
  primary: '#FFFFFF',
  secondary: 'rgba(255, 255, 255, 0.72)',
  muted: 'rgba(255, 255, 255, 0.42)',
  faint: 'rgba(255, 255, 255, 0.18)',
  accent: '#38BDF8', // sky-400
  accentMuted: 'rgba(56, 189, 248, 0.25)',
  accentGlow: 'rgba(56, 189, 248, 0.12)',
  ready: '#34D399', // emerald-400
  readyGlow: 'rgba(52, 211, 153, 0.25)',
  shutdown: '#F87171', // red-400
  shutdownGlow: 'rgba(248, 113, 113, 0.25)',
} as const;

export const ORION_LIFECYCLE_TIMING = {
  powerInit: 3000,
  bootSequence: 2800,
  worldEntry: 1800,
  logout: 1800,
  shutdown: 2200,
  restart: 1600,
} as const;
