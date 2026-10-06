import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateContrastColor, 
  adjustHexBrightness, 
  resolveThemeVariables, 
  applyThemeToDocument, 
  exportThemeJSON, 
  importThemeJSON 
} from '../../theme/themeResolver';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { PersonalizationSettings } from '../../theme/themeTypes';

describe('Orion-9 Theme Engine & Personalization System', () => {
  describe('WCAG Contrast Engine', () => {
    it('returns #FFFFFF for dark backgrounds', () => {
      expect(calculateContrastColor('#0F1115')).toBe('#FFFFFF');
      expect(calculateContrastColor('#3B82F6')).toBe('#FFFFFF');
      expect(calculateContrastColor('#000000')).toBe('#FFFFFF');
    });

    it('returns #0F172A for light backgrounds', () => {
      expect(calculateContrastColor('#FFFFFF')).toBe('#0F172A');
      expect(calculateContrastColor('#F5F7FA')).toBe('#0F172A');
    });
  });

  describe('Hex Brightness Adjustment', () => {
    it('adjusts hex color values up and down correctly', () => {
      const lighter = adjustHexBrightness('#101010', 10);
      expect(lighter.toUpperCase()).not.toBe('#101010');
      const darker = adjustHexBrightness('#FFFFFF', -10);
      expect(darker.toUpperCase()).not.toBe('#FFFFFF');
    });
  });

  describe('Theme Resolution', () => {
    it('resolves dark graphite mode CSS variables correctly', () => {
      const vars = resolveThemeVariables(DEFAULT_PERSONALIZATION_SETTINGS, true);
      expect(vars['--orion-background']).toBe('#0F1115');
      expect(vars['--orion-surface']).toBe('#14171C');
      expect(vars['--orion-border']).toBe('#2B313A');
    });

    it('resolves custom accent color and text contrast correctly', () => {
      const settings: PersonalizationSettings = {
        ...DEFAULT_PERSONALIZATION_SETTINGS,
        accentKey: 'custom',
        customAccentHex: '#EC4899'
      };
      const vars = resolveThemeVariables(settings, true);
      expect(vars['--orion-accent']).toBe('#EC4899');
      expect(vars['--orion-on-accent']).toBe('#FFFFFF');
    });

    it('resolves radius according to corner style', () => {
      const squareVars = resolveThemeVariables({ ...DEFAULT_PERSONALIZATION_SETTINGS, cornerStyle: 'square' });
      expect(squareVars['--orion-radius']).toBe('4px');

      const roundedVars = resolveThemeVariables({ ...DEFAULT_PERSONALIZATION_SETTINGS, cornerStyle: 'rounded' });
      expect(roundedVars['--orion-radius']).toBe('12px');
    });
  });

  describe('DOM Application Guard', () => {
    it('safely applies variables when mock document object is provided', () => {
      const setPropertyCalls: [string, string][] = [];
      const setAttributeCalls: [string, string][] = [];

      const mockElement = {
        style: {
          setProperty: (k: string, v: string) => setPropertyCalls.push([k, v]),
          fontSize: ''
        },
        setAttribute: (k: string, v: string) => setAttributeCalls.push([k, v])
      };

      (globalThis as any).document = {
        documentElement: mockElement
      };

      applyThemeToDocument(DEFAULT_PERSONALIZATION_SETTINGS);

      expect(setPropertyCalls.length).toBeGreaterThan(5);
      expect(setAttributeCalls.some(([k, v]) => k === 'data-theme' && v === 'dark')).toBe(true);

      delete (globalThis as any).document;
    });
  });

  describe('Theme Export and Import JSON', () => {
    it('exports theme as valid JSON string and imports back safely', () => {
      const customSettings: PersonalizationSettings = {
        ...DEFAULT_PERSONALIZATION_SETTINGS,
        appearanceMode: 'oled',
        accentKey: 'purple',
        cornerStyle: 'rounded',
        uiScale: 110
      };

      const jsonStr = exportThemeJSON(customSettings, 'Test Custom Theme');
      expect(jsonStr).toContain('Test Custom Theme');

      const imported = importThemeJSON(jsonStr);
      expect(imported).not.toBeNull();
      expect(imported?.appearanceMode).toBe('oled');
      expect(imported?.accentKey).toBe('purple');
      expect(imported?.cornerStyle).toBe('rounded');
      expect(imported?.uiScale).toBe(110);
    });

    it('handles malformed theme JSON gracefully without crashing', () => {
      const imported = importThemeJSON('invalid json string {');
      expect(imported).toBeNull();
    });
  });
});
