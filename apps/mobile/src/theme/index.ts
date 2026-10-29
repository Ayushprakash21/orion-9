/**
 * ORION-9 MOBILE DESIGN SYSTEM
 * Enterprise mobile theme tokens tailored for critical supply-chain operations.
 * Palette: Deep charcoal, midnight slate, restrained cyan telemetry accents, and high-contrast semantic indicators.
 */

export const Colors = {
  // Foundations
  background: '#070a10',
  surfacePrimary: '#0d131f',
  surfaceSecondary: '#131b2a',
  surfaceElevated: '#1a2438',
  surfaceHighlight: '#222f48',

  // Borders
  borderSubtle: 'rgba(255, 255, 255, 0.08)',
  borderMedium: 'rgba(255, 255, 255, 0.16)',
  borderCyan: 'rgba(6, 182, 212, 0.35)',
  borderActive: '#06b6d4',

  // Primary Cyan Accents
  cyan: {
    50: '#ecfeff',
    100: '#cffafe',
    200: '#a5f3fc',
    300: '#67e8f9',
    400: '#22d3ee',
    500: '#06b6d4',
    600: '#0891b2',
    700: '#0e7490',
    800: '#155e75',
    900: '#164e63',
    glow: 'rgba(6, 182, 212, 0.15)',
  },

  // Typography
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  textDisabled: '#475569',
  textInverse: '#070a10',

  // Status & Severity Semantics
  status: {
    critical: {
      text: '#f87171',
      bg: 'rgba(239, 68, 68, 0.12)',
      border: 'rgba(239, 68, 68, 0.35)',
      solid: '#ef4444',
    },
    high: {
      text: '#fbbf24',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'rgba(245, 158, 11, 0.35)',
      solid: '#f59e0b',
    },
    medium: {
      text: '#38bdf8',
      bg: 'rgba(56, 189, 248, 0.12)',
      border: 'rgba(56, 189, 248, 0.35)',
      solid: '#0284c7',
    },
    low: {
      text: '#94a3b8',
      bg: 'rgba(148, 163, 184, 0.1)',
      border: 'rgba(148, 163, 184, 0.25)',
      solid: '#64748b',
    },
    success: {
      text: '#34d399',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'rgba(16, 185, 129, 0.35)',
      solid: '#10b981',
    },
    warning: {
      text: '#fb923c',
      bg: 'rgba(249, 115, 22, 0.12)',
      border: 'rgba(249, 115, 22, 0.35)',
      solid: '#ea580c',
    },
  },

  // Environment Tints
  environment: {
    demo: {
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      badgeText: '#fbbf24',
      badgeBorder: 'rgba(245, 158, 11, 0.35)',
    },
    live: {
      badgeBg: 'rgba(16, 185, 129, 0.15)',
      badgeText: '#34d399',
      badgeBorder: 'rgba(16, 185, 129, 0.35)',
    },
  },
};

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
};

export const BorderRadius = {
  xs: 4,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  round: 9999,
  full: 9999,
};

export const Radius = BorderRadius;

export const Typography = {
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    display: 30,
  },
  lineHeights: {
    xs: 15,
    sm: 18,
    base: 21,
    md: 23,
    lg: 25,
    xl: 28,
    xxl: 32,
    display: 38,
  },
  fontWeights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  letterSpacings: {
    tighter: -0.5,
    tight: -0.2,
    normal: 0,
    wide: 0.5,
    wider: 1,
    widest: 1.5,
  },

  // Composite TextStyle Presets
  titleLarge: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.2,
  },
  titleMedium: {
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  titleSmall: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600' as const,
  },
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  bodySmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  labelLarge: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600' as const,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600' as const,
  },
  caption: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '400' as const,
  },
  monoSmall: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500' as const,
  },
  monoMedium: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500' as const,
  },
};

export const Layout = {
  touchTargetMin: 44,
  hitSlop: { top: 8, bottom: 8, left: 8, right: 8 },
  headerHeight: 56,
  tabBarHeight: 64,
  cardPadding: 16,
};

export const Shadows = {
  subtle: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 4,
  },
};
