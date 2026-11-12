/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Typography Tokens
 * (Section 2, 3, 4, 10 Specification)
 */

export * from './typography/typography.tokens';
export * from './typography/font-loader';

export const ORION_TYPOGRAPHY = {
  fontDisplay: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  fontBody: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  fontMono: '"Roboto Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',

  sizes: {
    displayXL: '40px',
    display: '32px',
    pageTitle: '26px',
    title1: '20px',
    title2: '16px',
    title3: '14px',
    headline: '13px',
    body: '14px',
    table: '13px',
    callout: '12px',
    subheadline: '12px',
    caption: '11px',
    micro: '10px',
  },

  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    black: 900,
  },

  tracking: {
    tight: '-0.02em',
    normal: '0',
    wide: '0.015em',
    uppercase: '0.05em',
  },

  lineHeights: {
    display: 1.15,
    heading: 1.25,
    tight: 1.25,
    normal: 1.45,
    relaxed: 1.6,
  },
} as const;
