/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Design System: Spacing & Density Tokens
 */

export const ORION_ENTERPRISE_SPACING = {
  '3xs': '2px',
  '2xs': '4px',
  xs: '6px',
  sm: '8px',
  md: '12px',
  lg: '16px',
  xl: '20px',
  '2xl': '24px',
  '3xl': '32px',
  '4xl': '48px',
} as const;

export const ORION_ENTERPRISE_SHADOWS = {
  none: 'none',
  subtle: '0 1px 2px rgba(0, 0, 0, 0.12)',
  panel: '0 2px 6px rgba(0, 0, 0, 0.18)',
  elevated: '0 6px 16px rgba(0, 0, 0, 0.28)',
  window: '0 12px 32px rgba(0, 0, 0, 0.42)',
  modal: '0 20px 48px rgba(0, 0, 0, 0.60)',
} as const;

export const ORION_ENTERPRISE_SURFACES = {
  glassDark: 'backdrop-blur-md bg-[#161b22]/90 border border-white/[0.08]',
  glassLight: 'backdrop-blur-md bg-white/95 border border-black/[0.08]',
  solidDark: 'bg-[#161b22] border border-[#30363d]',
  solidLight: 'bg-white border border-[#d0d7de]',
  tableHeaderDark: 'bg-[#0d1117] text-white/60 font-semibold border-b border-[#30363d]',
  tableHeaderLight: 'bg-[#f6f8fa] text-black/60 font-semibold border-b border-[#d0d7de]',
} as const;
