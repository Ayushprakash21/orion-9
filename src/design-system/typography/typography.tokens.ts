/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Typography Tokens Architecture (Section 3, 4, 10 Specification)
 * 
 * Strict typographic scale, weight mapping, line-heights and tabular numbers.
 */

export const ORION_TYPOGRAPHY_SCALE = {
  displayXL: {
    size: '40px',
    weight: 700,
    lineHeight: 1.15,
    letterSpacing: '-0.02em',
    role: 'Orion system brand titles, major welcome hero headings',
  },
  displayL: {
    size: '32px',
    weight: 700,
    lineHeight: 1.2,
    letterSpacing: '-0.015em',
    role: 'Major application header titles, executive KPIs',
  },
  pageTitle: {
    size: '26px',
    weight: 700,
    lineHeight: 1.25,
    letterSpacing: '-0.01em',
    role: 'Window titles, primary module headers',
  },
  sectionTitle: {
    size: '20px',
    weight: 600,
    lineHeight: 1.3,
    letterSpacing: '-0.005em',
    role: 'Card headers, panel titles, drawer headers',
  },
  subsection: {
    size: '16px',
    weight: 600,
    lineHeight: 1.35,
    letterSpacing: '0',
    role: 'Subsections, modal sub-headers, widget labels',
  },
  bodyLarge: {
    size: '16px',
    weight: 400,
    lineHeight: 1.45,
    letterSpacing: '0',
    role: 'Featured introductions, executive summaries',
  },
  body: {
    size: '14px',
    weight: 400,
    lineHeight: 1.45,
    letterSpacing: '0',
    role: 'Standard application content, descriptions, instructions',
  },
  navigation: {
    size: '13px',
    weight: 500,
    lineHeight: 1.3,
    letterSpacing: '0',
    role: 'Menu items, top bar navigation, sidebar tabs',
  },
  tableContent: {
    size: '13px',
    weight: 400,
    lineHeight: 1.4,
    letterSpacing: '0',
    role: 'Table cells, list items, entity records',
  },
  metadata: {
    size: '12px',
    weight: 400,
    lineHeight: 1.35,
    letterSpacing: '0',
    role: 'Secondary captions, timestamps, status subtext',
  },
  technicalValues: {
    size: '12px',
    weight: 500,
    lineHeight: 1.35,
    letterSpacing: '0.02em',
    role: 'Stock codes, SKU IDs, hash codes, latencies, telemetry values',
  },
  micro: {
    size: '10px',
    weight: 600,
    lineHeight: 1.2,
    letterSpacing: '0.05em',
    role: 'Badges, pill tags, compact status chips',
  },
} as const;

export const ORION_FONT_FAMILIES = {
  primary: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  display: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
  ui: '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  mono: '"Roboto Mono", "JetBrains Mono", ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
} as const;

export type OrionTypographyRole = keyof typeof ORION_TYPOGRAPHY_SCALE;
