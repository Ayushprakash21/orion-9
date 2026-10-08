/**
 * ORION-9 macOS / Liquid Glass Design System — Color Tokens
 * Single global macOS-inspired color system with deep layered neutrals.
 */

export const ORION_COLORS_LIGHT = {
  bg: '#F5F5F3',
  bgSecondary: '#EBEBEA',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  surfaceHover: '#F0F0EE',
  surfaceActive: '#E5E5E3',
  glass: 'rgba(255, 255, 255, 0.72)',
  glassHeavy: 'rgba(255, 255, 255, 0.88)',
  border: 'rgba(0, 0, 0, 0.08)',
  borderSubtle: 'rgba(0, 0, 0, 0.04)',
  borderStrong: 'rgba(0, 0, 0, 0.16)',
  text: '#17191B',
  textSecondary: '#555A5E',
  textTertiary: '#7C8286',
  textMuted: '#7C8286',
  textDisabled: '#A5A8AB',
  accent: '#0071E3', // Apple system blue or active user accent
  accentHover: '#0077ED',
  accentActive: '#0062C4',
  accentSoft: 'rgba(0, 113, 227, 0.08)',
  destructive: '#E03E3E',
  destructiveSoft: 'rgba(224, 62, 62, 0.08)',
  success: '#3F8065',
  warning: '#C68A2C',
  info: '#646B72',
  focus: 'rgba(0, 113, 227, 0.35)',
} as const;

export const ORION_COLORS_DARK = {
  bg: '#0D0F12',
  bgSecondary: '#14171C',
  surface: '#181B20',
  surfaceElevated: '#1E2229',
  surfaceHover: '#262A32',
  surfaceActive: '#2E333C',
  glass: 'rgba(24, 27, 32, 0.72)',
  glassHeavy: 'rgba(24, 27, 32, 0.88)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderSubtle: 'rgba(255, 255, 255, 0.04)',
  borderStrong: 'rgba(255, 255, 255, 0.15)',
  text: '#F2F2EF',
  textSecondary: '#A7AAA8',
  textTertiary: '#747875',
  textMuted: '#747875',
  textDisabled: '#555855',
  accent: '#2997FF', // Apple system bright blue or active user accent
  accentHover: '#3EA0FF',
  accentActive: '#1F84E6',
  accentSoft: 'rgba(41, 151, 255, 0.10)',
  destructive: '#FF453A',
  destructiveSoft: 'rgba(255, 69, 58, 0.12)',
  success: '#32D74B',
  warning: '#FFD60A',
  info: '#AEB5BE',
  focus: 'rgba(41, 151, 255, 0.35)',
} as const;

export type OrionColorScheme = 'light' | 'dark';
