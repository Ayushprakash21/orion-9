/**
 * ORION AURORA DESIGN SYSTEM — CORE DESIGN TOKENS
 * 
 * Inspired by the visual elegance of modern macOS and productivity of Windows 11,
 * infused with native Orion Supply Chain Intelligence.
 * 
 * Principles:
 * 1. Calm & Spatial (Graphite / Charcoal / Frosted Translucent Acrylic)
 * 2. Reduced Glow (>70% reduced from legacy neon)
 * 3. Human-Friendly Typography (Inter / Modern Sans-Serif; Monospace strictly for technical IDs/logs)
 * 4. Clear Visual Hierarchy & Generous Breathing Space
 * 5. Universal Enterprise Accessibility & Predictable Responsiveness
 */

export const AuroraColors = {
  dark: {
    // Backgrounds (Calm Graphite & Charcoal)
    bg: '#0c0e11',
    bgSecondary: '#12151a',
    bgTertiary: '#181c22',
    
    // Acrylic Glass / Surfaces
    surface: 'rgba(22, 26, 32, 0.75)',
    surfaceElevated: 'rgba(28, 33, 40, 0.85)',
    surfaceHover: 'rgba(255, 255, 255, 0.06)',
    surfaceActive: 'rgba(255, 255, 255, 0.10)',
    surfaceTranslucent: 'rgba(18, 21, 26, 0.65)',
    surfaceSolid: '#181b20',
    surfaceSolidElevated: '#20242b',

    // Low-contrast subtle borders
    border: 'rgba(255, 255, 255, 0.08)',
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderStrong: 'rgba(255, 255, 255, 0.16)',
    borderActive: 'rgba(56, 189, 248, 0.40)',

    // Typography
    textPrimary: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
    textInverse: '#0f172a',

    // Controlled Accent Colors
    accentPrimary: '#0284c7', // Controlled Orion Blue
    accentHover: '#0369a1',
    accentSubtle: 'rgba(2, 132, 199, 0.15)',
    accentGlow: 'rgba(2, 132, 199, 0.25)',

    // AI Purple / Indigo (Reserved for Intelligence)
    aiPrimary: '#818cf8',
    aiSubtle: 'rgba(129, 140, 248, 0.12)',
    aiGlow: 'rgba(129, 140, 248, 0.20)',

    // Semantic States (Soft & Human-friendly)
    success: '#10b981',
    successSubtle: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',
    warningSubtle: 'rgba(245, 158, 11, 0.12)',
    critical: '#f43f5e',
    criticalSubtle: 'rgba(244, 63, 94, 0.12)',
    info: '#38bdf8',
    infoSubtle: 'rgba(56, 189, 248, 0.12)',
  },

  light: {
    // Warm Neutral & Clean Light Gray
    bg: '#f8fafc',
    bgSecondary: '#f1f5f9',
    bgTertiary: '#e2e8f0',

    // Surfaces
    surface: 'rgba(255, 255, 255, 0.85)',
    surfaceElevated: 'rgba(255, 255, 255, 0.95)',
    surfaceHover: 'rgba(0, 0, 0, 0.04)',
    surfaceActive: 'rgba(0, 0, 0, 0.08)',
    surfaceTranslucent: 'rgba(255, 255, 255, 0.70)',
    surfaceSolid: '#ffffff',
    surfaceSolidElevated: '#f8fafc',

    // Borders
    border: 'rgba(0, 0, 0, 0.08)',
    borderSubtle: 'rgba(0, 0, 0, 0.04)',
    borderStrong: 'rgba(0, 0, 0, 0.15)',
    borderActive: 'rgba(2, 132, 199, 0.50)',

    // Typography
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textInverse: '#f8fafc',

    // Controlled Accent Colors
    accentPrimary: '#0284c7',
    accentHover: '#0369a1',
    accentSubtle: 'rgba(2, 132, 199, 0.10)',
    accentGlow: 'rgba(2, 132, 199, 0.15)',

    // AI Purple / Indigo
    aiPrimary: '#6366f1',
    aiSubtle: 'rgba(99, 102, 241, 0.10)',
    aiGlow: 'rgba(99, 102, 241, 0.15)',

    // Semantic States
    success: '#059669',
    successSubtle: 'rgba(5, 150, 105, 0.10)',
    warning: '#d97706',
    warningSubtle: 'rgba(217, 119, 6, 0.10)',
    critical: '#e11d48',
    criticalSubtle: 'rgba(225, 29, 72, 0.10)',
    info: '#0284c7',
    infoSubtle: 'rgba(2, 132, 199, 0.10)',
  }
};

export const AuroraSpacing = {
  px: '1px',
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const;

export const AuroraRadius = {
  none: '0px',
  xs: '4px',
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '20px',
  '2xl': '28px',
  full: '9999px',
} as const;

export const AuroraTypography = {
  fontSans: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  fontMono: '"JetBrains Mono", "SF Mono", Monaco, Consolas, "Liberation Mono", monospace',
  fontSize: {
    '2xs': '10px',
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '15px',
    lg: '16px',
    xl: '18px',
    '2xl': '22px',
    '3xl': '28px',
    '4xl': '36px',
  },
  fontWeight: {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
} as const;

export const AuroraShadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.15)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.25), 0 2px 4px -1px rgba(0, 0, 0, 0.15)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.20)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.45), 0 10px 10px -5px rgba(0, 0, 0, 0.25)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.55)',
  window: '0 22px 70px 4px rgba(0, 0, 0, 0.56), 0 0 0 1px rgba(255, 255, 255, 0.08)',
  windowActive: '0 28px 80px 6px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.12)',
  dock: '0 20px 40px -6px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  menu: '0 12px 30px -4px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
  subtleGlow: '0 0 16px -2px rgba(2, 132, 199, 0.25)',
} as const;

export const AuroraBlur = {
  none: 'none',
  sm: 'blur(4px)',
  md: 'blur(12px)',
  lg: 'blur(20px)',
  xl: 'blur(32px)',
  '2xl': 'blur(48px)',
} as const;

export const AuroraTransitions = {
  fast: '150ms cubic-bezier(0.16, 1, 0.3, 1)',
  normal: '200ms cubic-bezier(0.16, 1, 0.3, 1)',
  smooth: '250ms cubic-bezier(0.16, 1, 0.3, 1)',
  slow: '350ms cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export const AuroraZIndex = {
  wallpaper: 0,
  desktopGrid: 10,
  desktopIcons: 20,
  windowMinimized: 50,
  windowNormal: 100,
  windowActive: 200,
  windowModal: 300,
  dock: 500,
  systemBar: 600,
  launcher: 700,
  commandPalette: 750,
  contextMenu: 800,
  systemModal: 850,
  notificationToast: 900,
  criticalOverlay: 1000,
} as const;

export const AuroraBreakpoints = {
  phone: 640,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

export type AuroraThemeMode = 'dark' | 'light' | 'system';
