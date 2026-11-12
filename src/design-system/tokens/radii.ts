/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Design System: Corner Radii Tokens
 *
 * Replaces uncalibrated consumer-style rounded cards with deliberate
 * enterprise architectural hierarchy.
 */

export const ORION_ENTERPRISE_RADII = {
  none: '0px',
  xs: '3px',       // Technical badges, chip indicators, table tags
  sm: '5px',       // Form inputs, dropdown selectors, action buttons
  md: '8px',       // Standard panels, table containers, inner cards
  lg: '10px',      // Modals, drawers, primary section panels
  xl: '12px',      // Primary application window frames
  dock: '16px',    // System dock shell
  full: '9999px',  // Circular avatar, toggle switch, or status dot ONLY
} as const;
