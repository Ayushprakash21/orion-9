/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Design System: Typography Tokens
 *
 * Professional font hierarchy engineered for technical data density,
 * tabular numerical alignment, and long-session visual ergonomics.
 */

export const ORION_ENTERPRISE_TYPOGRAPHY = {
  // Enterprise font family stack
  fontDisplay: 'system-ui, -apple-system, "Segoe UI", Roboto, "Inter", sans-serif',
  fontBody: 'system-ui, -apple-system, "Segoe UI", Roboto, "Inter", sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace',

  // Consistent typographic sizes
  sizes: {
    display: '32px',    // System hero / big numerical totals
    title1: '20px',     // Window titles / primary views
    title2: '16px',     // Section titles / drawer headers
    title3: '14px',     // Panel titles / sub-headers
    headline: '13px',   // Metric labels / bold table headers
    body: '12px',       // Standard enterprise table & form text
    caption: '11px',    // Technical metadata / timestamps / subtext
    micro: '10px',      // System tags / badge labels / status codes
  },

  // Optical weights
  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Technical tracking
  tracking: {
    tight: '-0.015em',
    normal: '0',
    wide: '0.025em',
    uppercase: '0.06em',
  },

  // Ergonomic line heights
  lineHeights: {
    tight: 1.25,
    normal: 1.4,
    relaxed: 1.55,
  },
} as const;
