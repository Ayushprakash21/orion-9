import { describe, it, expect, vi, afterEach } from 'vitest';
import { computeMorphismTokens, calculateMorphismTokens } from '../../os/theme/OrionMorphismTokens';
import { ORION_THEMES } from '../../os/theme/OrionThemeRegistry';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { DEFAULT_PREFERENCES } from '../../os/theme/OrionThemeTypes';
import { runtimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';

describe('Map Engine, Transparency & Morphism Regression Suite', () => {
  const graphiteTheme = ORION_THEMES.graphite;
  const silverTheme = ORION_THEMES.silver;

  afterEach(() => {
    delete (globalThis as any).document;
  });

  describe('FIX 2: Continuous Alpha Material Curve & Transparency Levels', () => {
    it('computes near-opaque surface at 0% transparency (dark mode)', () => {
      const tokens = calculateMorphismTokens(
        'glass',
        graphiteTheme,
        true,
        60,
        true,
        0, // 0%
        true
      );
      expect(tokens.mode).toBe('glass');
      // At 0% intensity, alpha should be maxAlpha (0.95)
      expect(tokens.surface).toBe('rgba(18, 20, 23, 0.95)');
    });

    it('computes near-opaque surface at 0% transparency (light mode)', () => {
      const tokens = calculateMorphismTokens(
        'glass',
        silverTheme,
        false,
        60,
        true,
        0, // 0%
        true
      );
      expect(tokens.mode).toBe('glass');
      expect(tokens.surface).toBe('rgba(255, 255, 255, 0.96)');
    });

    it('computes intermediate alpha at 50% transparency', () => {
      const tokens = calculateMorphismTokens(
        'glass',
        graphiteTheme,
        true,
        60,
        true,
        50, // 50%
        true
      );
      expect(tokens.surface).toMatch(/rgba\(18, 20, 23, 0\.\d+\)/);
      const match = tokens.surface.match(/rgba\(18, 20, 23, (0\.\d+)\)/);
      const alpha = parseFloat(match![1]);
      expect(alpha).toBeGreaterThan(0.70);
      expect(alpha).toBeLessThan(0.90);
    });

    it('computes canonical liquid glass (~0.72) at 70% transparency default', () => {
      const tokens = calculateMorphismTokens(
        'glass',
        graphiteTheme,
        true,
        60,
        true,
        70, // 70%
        true
      );
      const match = tokens.surface.match(/rgba\(18, 20, 23, (0\.\d+)\)/);
      const alpha = parseFloat(match![1]);
      expect(alpha).toBeCloseTo(0.72, 2);
    });

    it('computes airy translucency (0.48 dark / 0.52 light) at 100% transparency', () => {
      const tokensDark = calculateMorphismTokens(
        'glass',
        graphiteTheme,
        true,
        60,
        true,
        100, // 100%
        true
      );
      expect(tokensDark.surface).toBe('rgba(18, 20, 23, 0.48)');

      const tokensLight = calculateMorphismTokens(
        'glass',
        silverTheme,
        false,
        60,
        true,
        100, // 100%
        true
      );
      expect(tokensLight.surface).toBe('rgba(255, 255, 255, 0.52)');
    });

    it('falls back to near-opaque surface when transparencyEnabled is false regardless of intensity', () => {
      const tokens = calculateMorphismTokens(
        'glass',
        graphiteTheme,
        true,
        60,
        true,
        100,
        false // disabled
      );
      expect(tokens.surface).toBe('rgba(18, 20, 23, 0.95)');
    });

    it('independent blur control produces none when blurEnabled is false', () => {
      const tokens = calculateMorphismTokens(
        'glass',
        graphiteTheme,
        true,
        60,
        false, // blur disabled
        70,
        true
      );
      expect(tokens.blur).toBe('0px');
      expect(tokens.backdrop).toBe('none');
    });
  });

  describe('FIX 3: Morphism Modes (Glass, Clay, Neumorphic)', () => {
    it('computes tactile highlight and shadow for Claymorphism', () => {
      const tokens = calculateMorphismTokens(
        'clay',
        graphiteTheme,
        true
      );
      expect(tokens.mode).toBe('clay');
      expect(tokens.surface).toBe(graphiteTheme.colors.surface);
      expect(tokens.backdrop).toBe('none');
      expect(tokens.blur).toBe('0px');
      expect(tokens.shadow).toContain('inset');
    });

    it('computes dual-axis light/dark shadows for Neumorphism', () => {
      const tokens = calculateMorphismTokens(
        'neumorphic',
        graphiteTheme,
        true
      );
      expect(tokens.mode).toBe('neumorphic');
      expect(tokens.surface).toBe(graphiteTheme.colors.surface);
      expect(tokens.backdrop).toBe('none');
      expect(tokens.blur).toBe('0px');
      expect(tokens.shadow).toContain('-4px -4px');
    });

    it('applies morphism tokens and attributes to document DOM', () => {
      const mockRoot = {
        style: {
          setProperty: vi.fn(),
          getPropertyValue: vi.fn(),
        },
        setAttribute: vi.fn(),
        classList: { remove: vi.fn(), add: vi.fn() },
      };
      const mockDoc = {
        documentElement: mockRoot,
        body: { style: {} },
        head: { appendChild: vi.fn() },
        getElementById: vi.fn(),
        createElement: vi.fn(() => ({ id: '', textContent: '' })),
      };
      (globalThis as any).document = mockDoc;

      const testPreferences = {
        ...DEFAULT_PREFERENCES,
        transparencyIntensity: 85,
        morphismMode: 'clay' as const,
      };

      applyThemeToDOM(graphiteTheme, testPreferences);

      expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-orion-morphism', 'clay');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-morph-mode', 'clay');
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-transparency-intensity', '85');
    });
  });

  describe('RuntimeSettingsAuthority Migration & Edge-Case Handling', () => {
    it('correctly migrates transparencyIntensity === 0 without evaluating to fallback falsy', () => {
      runtimeSettingsAuthority.updateSettings({
        window: {
          ...runtimeSettingsAuthority.settings.window,
          glassTransparency: 0,
        }
      });
      expect(runtimeSettingsAuthority.settings.window.glassTransparency).toBe(0);
    });
  });
});
