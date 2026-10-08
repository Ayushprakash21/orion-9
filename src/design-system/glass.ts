/**
 * ORION-9 macOS / Liquid Glass Design System — Liquid Glass Specifications
 * Centralized translucent glass token definitions.
 */

export type LiquidGlassTier =
  | 'glass1'
  | 'glass2'
  | 'glass3'
  | 'window'
  | 'dock'
  | 'menu'
  | 'popover'
  | 'control'
  | 'modal';

export interface LiquidGlassStyleSpec {
  background: string;
  backdropFilter: string;
  WebkitBackdropFilter: string;
  border: string;
  boxShadow: string;
}

export const LIQUID_GLASS_TIERS: Record<LiquidGlassTier, {
  dark: LiquidGlassStyleSpec;
  light: LiquidGlassStyleSpec;
}> = {
  glass1: {
    dark: {
      background: 'rgba(24, 27, 32, 0.45)',
      backdropFilter: 'blur(10px) saturate(130%)',
      WebkitBackdropFilter: 'blur(10px) saturate(130%)',
      border: '1px solid rgba(255, 255, 255, 0.06)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.08)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.50)',
      backdropFilter: 'blur(10px) saturate(120%)',
      WebkitBackdropFilter: 'blur(10px) saturate(120%)',
      border: '1px solid rgba(0, 0, 0, 0.05)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.60)',
    },
  },
  glass2: {
    dark: {
      background: 'rgba(24, 27, 32, 0.70)',
      backdropFilter: 'blur(16px) saturate(140%)',
      WebkitBackdropFilter: 'blur(16px) saturate(140%)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.10)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.75)',
      backdropFilter: 'blur(16px) saturate(130%)',
      WebkitBackdropFilter: 'blur(16px) saturate(130%)',
      border: '1px solid rgba(0, 0, 0, 0.07)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.80)',
    },
  },
  glass3: {
    dark: {
      background: 'rgba(24, 27, 32, 0.86)',
      backdropFilter: 'blur(22px) saturate(150%)',
      WebkitBackdropFilter: 'blur(22px) saturate(150%)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(22px) saturate(140%)',
      WebkitBackdropFilter: 'blur(22px) saturate(140%)',
      border: '1px solid rgba(0, 0, 0, 0.09)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.90)',
    },
  },
  window: {
    dark: {
      background: 'rgba(20, 23, 28, 0.80)',
      backdropFilter: 'blur(28px) saturate(145%)',
      WebkitBackdropFilter: 'blur(28px) saturate(145%)',
      border: '1px solid rgba(255, 255, 255, 0.09)',
      boxShadow: '0 24px 64px rgba(0, 0, 0, 0.48), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
    },
    light: {
      background: 'rgba(250, 250, 248, 0.82)',
      backdropFilter: 'blur(28px) saturate(135%)',
      WebkitBackdropFilter: 'blur(28px) saturate(135%)',
      border: '1px solid rgba(0, 0, 0, 0.09)',
      boxShadow: '0 20px 48px rgba(0, 0, 0, 0.18), inset 0 1px 0 0 rgba(255, 255, 255, 0.85)',
    },
  },
  dock: {
    dark: {
      background: 'rgba(24, 28, 34, 0.65)',
      backdropFilter: 'blur(36px) saturate(160%)',
      WebkitBackdropFilter: 'blur(36px) saturate(160%)',
      border: '1px solid rgba(255, 255, 255, 0.11)',
      boxShadow: '0 20px 52px rgba(0, 0, 0, 0.45), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.65)',
      backdropFilter: 'blur(36px) saturate(150%)',
      WebkitBackdropFilter: 'blur(36px) saturate(150%)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.18), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
    },
  },
  menu: {
    dark: {
      background: 'rgba(28, 32, 38, 0.85)',
      backdropFilter: 'blur(24px) saturate(150%)',
      WebkitBackdropFilter: 'blur(24px) saturate(150%)',
      border: '1px solid rgba(255, 255, 255, 0.09)',
      boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 0 rgba(255, 255, 255, 0.12)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.88)',
      backdropFilter: 'blur(24px) saturate(140%)',
      WebkitBackdropFilter: 'blur(24px) saturate(140%)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: '0 10px 26px rgba(0, 0, 0, 0.15), inset 0 1px 0 0 rgba(255, 255, 255, 0.90)',
    },
  },
  popover: {
    dark: {
      background: 'rgba(26, 30, 36, 0.88)',
      backdropFilter: 'blur(26px) saturate(150%)',
      WebkitBackdropFilter: 'blur(26px) saturate(150%)',
      border: '1px solid rgba(255, 255, 255, 0.10)',
      boxShadow: '0 16px 40px rgba(0, 0, 0, 0.42), inset 0 1px 0 0 rgba(255, 255, 255, 0.14)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.90)',
      backdropFilter: 'blur(26px) saturate(140%)',
      WebkitBackdropFilter: 'blur(26px) saturate(140%)',
      border: '1px solid rgba(0, 0, 0, 0.08)',
      boxShadow: '0 14px 34px rgba(0, 0, 0, 0.16), inset 0 1px 0 0 rgba(255, 255, 255, 0.92)',
    },
  },
  control: {
    dark: {
      background: 'rgba(255, 255, 255, 0.06)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.06)',
    },
    light: {
      background: 'rgba(0, 0, 0, 0.04)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(0, 0, 0, 0.07)',
      boxShadow: 'inset 0 1px 0 0 rgba(255, 255, 255, 0.50)',
    },
  },
  modal: {
    dark: {
      background: 'rgba(20, 24, 29, 0.88)',
      backdropFilter: 'blur(32px) saturate(160%)',
      WebkitBackdropFilter: 'blur(32px) saturate(160%)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      boxShadow: '0 32px 80px rgba(0, 0, 0, 0.65), inset 0 1px 1px 0 rgba(255, 255, 255, 0.16)',
    },
    light: {
      background: 'rgba(255, 255, 255, 0.92)',
      backdropFilter: 'blur(32px) saturate(150%)',
      WebkitBackdropFilter: 'blur(32px) saturate(150%)',
      border: '1px solid rgba(0, 0, 0, 0.10)',
      boxShadow: '0 28px 64px rgba(0, 0, 0, 0.22), inset 0 1px 1px 0 rgba(255, 255, 255, 0.95)',
    },
  },
};
