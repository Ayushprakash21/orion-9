/**
 * ORION-9 macOS / Liquid Glass Design System — Typography Tokens
 * System Apple font stack and optical hierarchy.
 */

export const ORION_TYPOGRAPHY = {
  fontDisplay: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  fontBody: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
  fontMono: '"SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace',

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
