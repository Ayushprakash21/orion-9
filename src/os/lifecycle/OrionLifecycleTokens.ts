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
  primary: '#F5F5F3',
  secondary: 'rgba(255, 255, 255, 0.72)',
  muted: 'rgba(255, 255, 255, 0.42)',
  faint: 'rgba(255, 255, 255, 0.16)',
  accent: '#D8DDE3',
  accentMuted: 'rgba(216, 221, 227, 0.18)',
  accentGlow: 'rgba(216, 221, 227, 0.08)',
  ready: '#5FAF8A',
  readyGlow: 'rgba(95, 175, 138, 0.14)',
  shutdown: '#C96B72',
  shutdownGlow: 'rgba(201, 107, 114, 0.12)',
} as const;

import { ORION_BOOT_MOTION_SCALE } from '../motion/OrionMotion';

export const ORION_LIFECYCLE_TIMING = {
  powerInit: Math.round(3000 * ORION_BOOT_MOTION_SCALE), // 3750ms (~80% speed)
  bootSequence: Math.round(2800 * ORION_BOOT_MOTION_SCALE), // 3500ms (~80% speed)
  worldEntry: Math.round(1800 * ORION_BOOT_MOTION_SCALE), // 2250ms (~80% speed)
  logout: 1800,
  shutdown: 2200,
  restart: 1600,
} as const;
