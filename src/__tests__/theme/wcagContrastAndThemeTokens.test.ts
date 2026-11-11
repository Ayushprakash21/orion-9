import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  parseColorToRgba,
  getRelativeLuminance,
  getContrastRatio,
  calculateContrastColor,
  meetsWcagAA,
  resolveAccessibleAccentStates,
} from '../../os/theme/OrionContrast';
import { ORION_THEMES, getThemeList } from '../../os/theme/OrionThemeRegistry';
import { DEFAULT_PREFERENCES } from '../../os/theme/OrionThemeTypes';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { resolveThemeVariables } from '../../theme/themeResolver';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';

const styleProps: Record<string, string> = {};
const attrProps: Record<string, string> = {};
const classSet = new Set<string>();
const storageMap: Record<string, string> = {};

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap[k] ?? null,
    setItem: (k: string, v: string) => { storageMap[k] = String(v); },
    removeItem: (k: string) => { delete storageMap[k]; },
    clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); },
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        colorScheme: '',
        setProperty: vi.fn((k: string, v: string) => { styleProps[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleProps[k] || ''),
      },
      classList: {
        add: vi.fn((...cs: string[]) => cs.forEach(c => classSet.add(c))),
        remove: vi.fn((...cs: string[]) => cs.forEach(c => classSet.delete(c))),
        contains: vi.fn((c: string) => classSet.has(c)),
      },
      setAttribute: vi.fn((k: string, v: string) => { attrProps[k] = v; }),
      getAttribute: vi.fn((k: string) => attrProps[k] || null),
    },
    body: { style: {} },
    head: { appendChild: vi.fn() },
    getElementById: vi.fn().mockReturnValue(null),
    createElement: vi.fn().mockReturnValue({ id: '', textContent: '' }),
  };
}

describe('Orion-9 WCAG Contrast & Theme Token Consistency Verification', () => {
  beforeEach(() => {
    Object.keys(styleProps).forEach(k => delete styleProps[k]);
    Object.keys(attrProps).forEach(k => delete attrProps[k]);
    classSet.clear();
    localStorage.clear();
  });

  it('parses 3-digit HEX, 6-digit HEX, rgba/alpha, transparent, and invalid inputs cleanly', () => {
    expect(parseColorToRgba('#fff')).toEqual({ r: 255, g: 255, b: 255, a: 1 });
    expect(parseColorToRgba('#4A5056')).toEqual({ r: 74, g: 80, b: 86, a: 1 });
    expect(parseColorToRgba('rgba(74, 80, 86, 0.85)')).toEqual({ r: 74, g: 80, b: 86, a: 0.85 });
    expect(parseColorToRgba('transparent')).toEqual({ r: 0, g: 0, b: 0, a: 0 });
    expect(parseColorToRgba('invalid-hex-xyz')).toBeNull();
    expect(calculateContrastColor('invalid-color')).toBe('#FFFFFF');
  });

  it('selects WCAG-highest accessible foreground for all regression accents & presets (>= 4.5:1)', () => {
    const regressionCases: Array<{ hex: string; expectedFg: string }> = [
      { hex: '#4A5056', expectedFg: '#FFFFFF' }, // Silver: white ~8.15:1 vs dark ~2.20:1
      { hex: '#7FA58D', expectedFg: '#0F172A' }, // Muted Forest (luminance ~0.347 — old 0.45 threshold failed!)
      { hex: '#C6A15B', expectedFg: '#0F172A' }, // Amber Gold (luminance ~0.382 — old 0.45 threshold failed!)
      { hex: '#C7B7A4', expectedFg: '#0F172A' }, // Warm Cashmere
      { hex: '#5FAF8A', expectedFg: '#0F172A' }, // Sage Green (luminance ~0.369 — old 0.45 threshold failed!)
      { hex: '#D8DDE3', expectedFg: '#0F172A' }, // Graphite
      { hex: '#BFC6CE', expectedFg: '#0F172A' }, // Midnight
      { hex: '#A7AAA8', expectedFg: '#0F172A' }, // Silver Mist
      { hex: '#7BA3C9', expectedFg: '#0F172A' }, // Steel Blue
      { hex: '#B07DA3', expectedFg: '#0F172A' }, // Dusty Plum
      { hex: '#1D4ED8', expectedFg: '#FFFFFF' }, // Custom deep cobalt blue
      { hex: '#FACC15', expectedFg: '#0F172A' }, // Custom vibrant yellow
      { hex: '#7C2D12', expectedFg: '#FFFFFF' }, // Custom deep espresso
    ];

    for (const tc of regressionCases) {
      const fg = calculateContrastColor(tc.hex);
      expect(fg).toBe(tc.expectedFg);
      const ratio = getContrastRatio(fg, tc.hex);
      expect(ratio).toBeGreaterThanOrEqual(4.5);
      expect(meetsWcagAA(fg, tc.hex)).toBe(true);
    }

    // Verify exact Silver example contrast bounds
    expect(getContrastRatio('#FFFFFF', '#4A5056')).toBeGreaterThan(8.0);
    expect(getContrastRatio('#000000', '#4A5056')).toBeLessThan(2.7);
    expect(getRelativeLuminance('#FFFFFF')).toBe(1);
    expect(getRelativeLuminance('#000000')).toBe(0);
  });

  it('guarantees WCAG AA readability across ALL 5 built-in themes (background, surface, typography, buttons, focus)', () => {
    for (const theme of getThemeList()) {
      const { colors, appearance } = theme;

      // Primary, secondary, and muted text on both canvas background & card surface must satisfy >= 4.5:1
      expect(getContrastRatio(colors.textPrimary, colors.background)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.textPrimary, colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.textSecondary, colors.surface)).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(colors.textMuted, colors.surface)).toBeGreaterThanOrEqual(4.5);

      // Accent button foreground & focus ring contrast
      const states = resolveAccessibleAccentStates(colors.accent, appearance.mode, colors.surface);
      expect(states.contrastRatio).toBeGreaterThanOrEqual(4.5);
      expect(getContrastRatio(states.focusRing, colors.surface)).toBeGreaterThanOrEqual(3.0);

      // Semantic danger button foreground contrast
      const dangerFg = calculateContrastColor(colors.danger, { backingColor: colors.surface });
      expect(getContrastRatio(dangerFg, colors.danger)).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('synchronizes --os-text-primary-inverse, --orion-accent-foreground, and --orion-on-accent cleanly across theme & custom accent transitions', () => {
    // 1. Silver theme (#4A5056) -> White foreground
    applyThemeToDOM(ORION_THEMES.silver, {
      ...DEFAULT_PREFERENCES,
      themeId: 'silver',
      appearanceMode: 'light',
      customAccentEnabled: false,
    });

    expect(styleProps['--orion-accent-foreground']).toBe('#FFFFFF');
    expect(styleProps['--orion-on-accent']).toBe('#FFFFFF');
    expect(styleProps['--os-text-primary-inverse']).toBe('#FFFFFF');
    expect(styleProps['--os-on-accent']).toBe('#FFFFFF');
    expect(styleProps['--orion-bg']).toBe(ORION_THEMES.silver.colors.background);
    expect(styleProps['--os-bg']).toBe(ORION_THEMES.silver.colors.background);

    // 2. Switch Silver + Amber Gold custom accent (#C6A15B) -> Must flip foregrounds to dark (#0F172A) immediately!
    applyThemeToDOM(ORION_THEMES.silver, {
      ...DEFAULT_PREFERENCES,
      themeId: 'silver',
      appearanceMode: 'light',
      customAccentEnabled: true,
      customAccent: '#C6A15B',
    });

    expect(styleProps['--orion-accent']).toBe('#C6A15B');
    expect(styleProps['--orion-accent-foreground']).toBe('#0F172A');
    expect(styleProps['--orion-on-accent']).toBe('#0F172A');
    expect(styleProps['--os-text-primary-inverse']).toBe('#0F172A');

    // 3. Check themeResolver outputs match OrionThemeCSS contrast guarantees
    const resolvedVars = resolveThemeVariables(
      { ...DEFAULT_PERSONALIZATION_SETTINGS, themeId: 'forest', appearanceMode: 'dark' },
      true
    );
    expect(resolvedVars['--orion-on-accent']).toBe('#0F172A');
    expect(resolvedVars['--os-text-primary-inverse']).toBe('#0F172A');
    expect(resolvedVars['--orion-accent-foreground']).toBe('#0F172A');
  });
});
