/**
 * ORION-9 macOS / Liquid Glass Design System — Shadow Tokens
 * Apple-style layered soft shadows: ambient + contact + elevation.
 */

export const ORION_SHADOWS = {
  none: 'none',
  control: '0 1px 2px rgba(0, 0, 0, 0.12), 0 0 1px rgba(0, 0, 0, 0.08)',
  controlActive: '0 0 0 1px rgba(0, 0, 0, 0.15)',
  panel: '0 4px 16px rgba(0, 0, 0, 0.18), 0 1px 3px rgba(0, 0, 0, 0.12)',
  popover: '0 12px 32px rgba(0, 0, 0, 0.28), 0 2px 8px rgba(0, 0, 0, 0.16)',
  menu: '0 10px 28px rgba(0, 0, 0, 0.26), 0 2px 6px rgba(0, 0, 0, 0.12)',
  dock: '0 20px 48px rgba(0, 0, 0, 0.40), 0 4px 12px rgba(0, 0, 0, 0.20)',
  windowInactive: '0 12px 32px rgba(0, 0, 0, 0.24), 0 2px 8px rgba(0, 0, 0, 0.14)',
  windowActive: '0 24px 64px rgba(0, 0, 0, 0.48), 0 4px 16px rgba(0, 0, 0, 0.24)',
  modal: '0 32px 80px rgba(0, 0, 0, 0.60), 0 8px 24px rgba(0, 0, 0, 0.30)',
  tooltip: '0 4px 12px rgba(0, 0, 0, 0.25)',
} as const;
