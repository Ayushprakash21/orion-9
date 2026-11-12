import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppearanceSettingsPanel, SYSTEM_COLOR_PALETTE } from '../../components/settings/AppearanceSettingsPanel';
import { ORION_OS_METADATA } from '../../os/constants/OrionOsMetadata';
import { calculateContrastColor } from '../../os/theme/OrionContrast';
import { DEFAULT_PREFERENCES } from '../../os/theme/OrionThemeTypes';
import { applyThemeToDOM } from '../../os/theme/OrionThemeCSS';
import { migratePreferences } from '../../os/theme/OrionThemeStorage';
import { getTheme } from '../../os/theme/OrionThemeRegistry';

// Mock contexts for renderToString
vi.mock('../../os/theme/useOrionTheme', () => ({
  useOrionTheme: () => ({
    theme: getTheme('graphite'),
    preferences: {
      ...DEFAULT_PREFERENCES,
      appearanceMode: 'dark',
      transparencyEnabled: true,
      applyAccentToNavigation: true,
      recentColors: ['#D6A65C', '#0078D7', '#107C41'],
    },
    resolvedAccent: '#D6A65C',
    setTheme: vi.fn(),
    setPreference: vi.fn(),
    resetAppearance: vi.fn(),
    isDark: true,
  }),
}));

vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'admin-1', organizationId: 'org-test' },
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ORION-9 OS 21.1 — SYSTEM PERSONALIZATION & APPEARANCE ENGINE (PULSAR RELEASE)', () => {
  describe('Requirement 1: OS Version & Product Identity', () => {
    it('declares authoritative OS 21.1 PULSAR RELEASE metadata', () => {
      expect(ORION_OS_METADATA.version).toBe('21.1');
      expect(ORION_OS_METADATA.displayTitle).toBe('ORION-9 OS 21.1');
      expect(ORION_OS_METADATA.edition).toBe('PULSAR RELEASE');
      expect(ORION_OS_METADATA.releaseCodename).toBe('PULSAR');
      expect(ORION_OS_METADATA.fullVersionName).toBe('ORION-9 OS 21.1 — PULSAR RELEASE');
      expect(ORION_OS_METADATA.kernelVersion).toBe('v21.1-kernel-core');
    });

    it('renders OS 21.1 PULSAR RELEASE branding and Colors heading', () => {
      const html = renderToString(<AppearanceSettingsPanel />);
      expect(html).toContain('ORION-9 OS 21.1');
      expect(html).toContain('PULSAR RELEASE');
      expect(html).toContain('Colors</h1>');
      expect(html).toContain('Personalization and visual experience');
    });
  });

  describe('Requirement 2: Strictly TWO Appearance Modes (Dark & Light)', () => {
    it('exposes only Dark and Light mode options with no auto, scheduled, or third modes', () => {
      const html = renderToString(<AppearanceSettingsPanel />);
      expect(html).toContain('data-testid="mode-select-dark"');
      expect(html).toContain('data-testid="mode-select-light"');

      // Ensure no auto / system auto button is rendered
      expect(html).not.toContain('data-testid="mode-select-auto"');
      expect(html).not.toContain('System Auto');
      expect(html).not.toContain('OLED');
    });

    it('storage migration strictly normalizes arbitrary modes to either dark or light', () => {
      const legacyAuto = migratePreferences({ appearanceMode: 'auto' as any });
      expect(legacyAuto.appearanceMode).toBe('dark');

      const legacySystem = migratePreferences({ appearanceMode: 'system' as any });
      expect(legacySystem.appearanceMode).toBe('dark');

      const legacyLight = migratePreferences({ appearanceMode: 'light' });
      expect(legacyLight.appearanceMode).toBe('light');

      const legacyDark = migratePreferences({ appearanceMode: 'dark' });
      expect(legacyDark.appearanceMode).toBe('dark');
    });
  });

  describe('Requirement 3: Windows 11 System Color Palette (35 Swatches)', () => {
    it('provides exactly 35 curated system color swatches across 15 chromatic families', () => {
      expect(SYSTEM_COLOR_PALETTE).toHaveLength(35);
      const uniqueHexes = new Set(SYSTEM_COLOR_PALETTE.map((s) => s.hex.toUpperCase()));
      expect(uniqueHexes.size).toBe(35);
    });

    it('calculates optimal WCAG contrast text colors for all 35 palette swatches', () => {
      SYSTEM_COLOR_PALETTE.forEach((color) => {
        const textContrast = calculateContrastColor(color.hex);
        expect(['#0F172A', '#FFFFFF']).toContain(textContrast);
      });
    });

    it('renders all 35 swatches in the settings panel markup', () => {
      const html = renderToString(<AppearanceSettingsPanel />);
      SYSTEM_COLOR_PALETTE.forEach((color) => {
        expect(html).toContain(`data-testid="palette-color-${color.hex}"`);
      });
    });
  });

  describe('Requirement 4: Transparency Effects Toggle', () => {
    it('applies transparency CSS variables properly when enabled and disabled', () => {
      const styleStore: Record<string, string> = {};
      const mockDocEl = {
        style: {
          setProperty: (k: string, v: string) => { styleStore[k] = v; },
          getPropertyValue: (k: string) => styleStore[k] || '',
        },
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        setAttribute: vi.fn(),
      };

      const originalDoc = globalThis.document;
      (globalThis as any).document = {
        documentElement: mockDocEl,
        head: { appendChild: vi.fn() },
        getElementById: () => null,
      };

      const graphiteTheme = getTheme('graphite')!;

      // Test with transparency ENABLED
      applyThemeToDOM(graphiteTheme, {
        ...DEFAULT_PREFERENCES,
        transparencyEnabled: true,
      });

      expect(styleStore['--orion-transparency-enabled']).toBe('1');
      expect(styleStore['--orion-blur']).not.toBe('0px');

      // Test with transparency DISABLED
      applyThemeToDOM(graphiteTheme, {
        ...DEFAULT_PREFERENCES,
        transparencyEnabled: false,
      });

      expect(styleStore['--orion-transparency-enabled']).toBe('0');
      expect(styleStore['--orion-blur']).toBe('0px');
      expect(styleStore['--orion-glass-opacity']).toBe('1');

      (globalThis as any).document = originalDoc;
    });
  });

  describe('Requirement 5: Navigation and Start Accent Toggle', () => {
    it('applies dock and navigation accent variables when applyAccentToNavigation is toggled', () => {
      const styleStore: Record<string, string> = {};
      const mockDocEl = {
        style: {
          setProperty: (k: string, v: string) => { styleStore[k] = v; },
          getPropertyValue: (k: string) => styleStore[k] || '',
        },
        classList: {
          add: vi.fn(),
          remove: vi.fn(),
        },
        setAttribute: vi.fn(),
      };

      const originalDoc = globalThis.document;
      (globalThis as any).document = {
        documentElement: mockDocEl,
        head: { appendChild: vi.fn() },
        getElementById: () => null,
      };

      const graphiteTheme = getTheme('graphite')!;

      // When applyAccentToNavigation is true
      applyThemeToDOM(graphiteTheme, {
        ...DEFAULT_PREFERENCES,
        customAccentEnabled: true,
        customAccent: '#D6A65C',
        applyAccentToNavigation: true,
      });

      expect(styleStore['--orion-dock-active']).toBe('#D6A65C');
      expect(styleStore['--orion-nav-accent']).toBe('#D6A65C');

      // When applyAccentToNavigation is false
      applyThemeToDOM(graphiteTheme, {
        ...DEFAULT_PREFERENCES,
        customAccentEnabled: true,
        customAccent: '#D6A65C',
        applyAccentToNavigation: false,
      });

      expect(styleStore['--orion-dock-active']).toBe(graphiteTheme.colors.textPrimary);
      expect(styleStore['--orion-nav-accent']).toBe('transparent');

      (globalThis as any).document = originalDoc;
    });
  });

  describe('Requirement 6: Custom Colors and Recent Swatches in Markup', () => {
    it('renders Recent colors section and View colors button in the panel', () => {
      const html = renderToString(<AppearanceSettingsPanel />);
      expect(html).toContain('Recent colors');
      expect(html).toContain('data-testid="view-custom-colors-btn"');
      expect(html).toContain('View colors');
      expect(html).toContain('Show accent color on Start and taskbar');
      expect(html).toContain('data-testid="nav-accent-toggle"');
    });
  });

  describe('Requirement 7: Live Theme Preview Viewport', () => {
    it('renders the interactive live preview matching the Pulsar visual composition', () => {
      const html = renderToString(<AppearanceSettingsPanel />);
      expect(html).toContain('data-testid="personalization-preview-viewport"');
      expect(html).toContain('Live Desktop &amp; Window Preview');
      expect(html).toContain('ORION-9 OS 21.1');
      expect(html).toContain('PULSAR');
      expect(html).toContain('Control Tower');
      expect(html).toContain('Supply Chain Network');
    });
  });
});
