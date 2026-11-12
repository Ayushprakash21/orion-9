/**
 * ORION-9 OS 21.1 — PULSAR RELEASE
 * Centralized Enterprise Design System: Color Tokens
 *
 * Strictly supports two refined operational modes:
 * DARK MODE: Deep graphite, near-black structural layers, crisp neutral text, restrained technical accents.
 * LIGHT MODE: Professional off-white, neutral grey surfaces, high contrast, subtle borders.
 */

export const ORION_ENTERPRISE_DARK = {
  // Background & structural layers
  bgWorkspace: '#0B0D10',       // Deepest canvas backing
  bgCanvas: '#0D1117',          // Standard workspace surface
  bgPanel: '#161B22',           // Card and panel backdrop
  bgPanelElevated: '#21262D',   // Raised modals, dropdowns, popovers
  bgHover: 'rgba(255, 255, 255, 0.04)',
  bgActive: 'rgba(255, 255, 255, 0.08)',
  bgSelected: 'rgba(56, 189, 248, 0.12)', // Restrained primary selection

  // Hairline borders & division lines (No excessive glows)
  borderSubtle: 'rgba(255, 255, 255, 0.06)',
  borderDefault: '#30363D',
  borderMuted: '#21262D',
  borderStrong: '#484F58',
  borderFocus: '#38BDF8',

  // High contrast neutral typography
  textPrimary: '#F0F6FC',       // Pure high-contrast foreground
  textSecondary: '#C9D1D9',     // Readable secondary content
  textMuted: '#8B949E',         // Subtle labels and captions
  textDisabled: '#484F58',      // Inactive states

  // Restrained semantic status tokens (Single truth for SCM & telemetry)
  accent: '#38BDF8',            // Technical Orion Cyan/Sky
  accentHover: '#0EA5E9',
  accentSubtle: 'rgba(56, 189, 248, 0.10)',
  
  success: '#2EA043',           // Nominal / On-Track
  successSubtle: 'rgba(46, 160, 67, 0.12)',
  successText: '#3FB950',

  warning: '#D29922',           // Attention / Advisory
  warningSubtle: 'rgba(210, 153, 34, 0.12)',
  warningText: '#E3B341',

  danger: '#DA3633',            // Critical Exception / Failure
  dangerSubtle: 'rgba(218, 54, 51, 0.12)',
  dangerText: '#F85149',

  info: '#58A6FF',              // Telemetry / Informational
  infoSubtle: 'rgba(88, 166, 255, 0.10)',
  infoText: '#79C0FF',
} as const;

export const ORION_ENTERPRISE_LIGHT = {
  // Background & structural layers
  bgWorkspace: '#EAEEF2',       // Structural light canvas
  bgCanvas: '#F6F8FA',          // Standard workspace surface
  bgPanel: '#FFFFFF',           // Card and panel backdrop
  bgPanelElevated: '#FFFFFF',   // Raised modals, dropdowns
  bgHover: 'rgba(0, 0, 0, 0.03)',
  bgActive: 'rgba(0, 0, 0, 0.06)',
  bgSelected: 'rgba(3, 102, 214, 0.08)',

  // Restrained borders (Clean architectural boundaries)
  borderSubtle: 'rgba(0, 0, 0, 0.06)',
  borderDefault: '#D0D7DE',
  borderMuted: '#E1E4E8',
  borderStrong: '#AFB8C1',
  borderFocus: '#0969DA',

  // Neutral typography
  textPrimary: '#1F2328',       // Crisp enterprise ink
  textSecondary: '#57606A',     // Secondary prose
  textMuted: '#6E7781',         // Labels and tabular headers
  textDisabled: '#8C959F',

  // Semantic status tokens
  accent: '#0969DA',            // Restrained enterprise blue
  accentHover: '#0550AE',
  accentSubtle: 'rgba(9, 105, 218, 0.08)',

  success: '#1A7F37',
  successSubtle: 'rgba(26, 127, 55, 0.10)',
  successText: '#1A7F37',

  warning: '#9A6700',
  warningSubtle: 'rgba(154, 103, 0, 0.10)',
  warningText: '#9A6700',

  danger: '#CF222E',
  dangerSubtle: 'rgba(207, 34, 46, 0.10)',
  dangerText: '#CF222E',

  info: '#0969DA',
  infoSubtle: 'rgba(9, 105, 218, 0.08)',
  infoText: '#0969DA',
} as const;
