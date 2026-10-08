/**
 * ORION-9 macOS / Liquid Glass Design System — Master Tokens
 * Canonical export aggregating colors, typography, spacing, radii, shadows, glass, motion, and cursor.
 */

import { ORION_COLORS_LIGHT, ORION_COLORS_DARK } from './colors';
import { ORION_TYPOGRAPHY } from './typography';
import { ORION_SPACING } from './spacing';
import { ORION_RADII } from './radii';
import { ORION_SHADOWS } from './shadows';
import { LIQUID_GLASS_TIERS, LiquidGlassTier } from './glass';
import { ORION_SPRINGS, ORION_WINDOW_VARIANTS, ORION_MODAL_VARIANTS, ORION_POPOVER_VARIANTS, ORION_TOOLTIP_VARIANTS } from './motion';
import { OrionCursorState, getLiquidGlassHighlight } from './cursor';

export const ORION_DESIGN_TOKENS = {
  colors: {
    light: ORION_COLORS_LIGHT,
    dark: ORION_COLORS_DARK,
  },
  typography: ORION_TYPOGRAPHY,
  spacing: ORION_SPACING,
  radii: ORION_RADII,
  shadows: ORION_SHADOWS,
  glass: LIQUID_GLASS_TIERS,
  motion: {
    springs: ORION_SPRINGS,
    window: ORION_WINDOW_VARIANTS,
    modal: ORION_MODAL_VARIANTS,
    popover: ORION_POPOVER_VARIANTS,
    tooltip: ORION_TOOLTIP_VARIANTS,
  },
} as const;

export * from './colors';
export * from './typography';
export * from './spacing';
export * from './radii';
export * from './shadows';
export * from './glass';
export * from './motion';
export * from './cursor';
