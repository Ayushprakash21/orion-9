/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Design System: Typography Tokens
 *
 * Professional font hierarchy engineered for technical data density,
 * tabular numerical alignment, and long-session visual ergonomics.
 */

export * from '../typography/typography.tokens';

export const ORION_ENTERPRISE_TYPOGRAPHY = {
  // Enterprise font family stack: Approved Lato UI + Roboto Mono technical
  fontDisplay: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  fontBody: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: '"Roboto Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',

  // Consistent typographic sizes (Section 4 Specification)
  sizes: {
    displayXL: '40px',   // System brand titles / major hero
    display: '32px',     // System hero / big numerical totals
    pageTitle: '26px',   // Window titles / primary views
    title1: '20px',      // Section titles / drawer headers
    title2: '16px',      // Subsections / modal sub-headers
    title3: '14px',      // Panel titles / sub-headers
    bodyLarge: '16px',   // Featured content
    body: '14px',        // Standard enterprise text
    headline: '13px',    // Navigation / bold table headers
    table: '13px',       // Table content
    caption: '12px',     // Metadata / timestamps / subtext
    technical: '12px',   // Technical values / SKUs / telemetry
    micro: '10px',       // System tags / badge labels / status codes
  },

  // Optical weights
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  // Technical tracking
  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.015em',
    uppercase: '0.05em',
  },

  // Ergonomic line heights
  lineHeights: {
    display: 1.15,
    heading: 1.25,
    tight: 1.25,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;
