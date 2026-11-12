/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Typography Tokens
 */

export const ORION_TYPOGRAPHY = {
  fontDisplay: 'system-ui, -apple-system, "Segoe UI", Roboto, "Inter", sans-serif',
  fontBody: 'system-ui, -apple-system, "Segoe UI", Roboto, "Inter", sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", ui-monospace, Menlo, Consolas, monospace',

  sizes: {
    display: '36px',
    title1: '24px',
    title2: '20px',
    title3: '16px',
    headline: '14px',
    body: '13px',
    callout: '12px',
    subheadline: '11px',
    footnote: '10px',
    caption: '9px',
  },

  weights: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  tracking: {
    tight: '-0.022em',
    normal: '-0.006em',
    wide: '0.012em',
    uppercase: '0.06em',
  },

  lineHeights: {
    tight: 1.2,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;
