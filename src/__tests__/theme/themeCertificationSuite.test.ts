import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrionThemeEngine } from '../../os/theme/OrionThemeEngine';
import { getTheme, ORION_THEMES } from '../../os/theme/OrionThemeRegistry';
import { OrionThemeId } from '../../os/theme/OrionThemeTypes';
import { RuntimeSettingsAuthority } from '../../os/settings/RuntimeSettingsAuthority';

describe('PHASE 2: Orion-9 Theme Certification Suite', () => {
  let engine: OrionThemeEngine;
  let mockRoot: any;

  beforeEach(() => {
    mockRoot = {
      setAttribute: vi.fn(),
      style: {
        setProperty: vi.fn(),
        colorScheme: '',
      },
      classList: {
        remove: vi.fn(),
        add: vi.fn(),
      },
    };
    (globalThis as any).document = {
      documentElement: mockRoot,
      getElementById: vi.fn().mockReturnValue(null),
      createElement: vi.fn().mockReturnValue({ id: '', textContent: '' }),
      head: { appendChild: vi.fn() },
      body: { style: { backgroundColor: '', color: '' } },
    };

    engine = new OrionThemeEngine();
    engine.resetToDefaults();
  });

  const allThemes: OrionThemeId[] = ['graphite', 'silver', 'midnight', 'forest', 'warm'];

  allThemes.forEach((themeId) => {
    it(`THEME-CERT-${themeId.toUpperCase()}: Certifies selection, tokens, and DOM application for ${themeId}`, () => {
      engine.setTheme(themeId);
      const activeTheme = engine.getResolvedTheme();
      expect(activeTheme.id).toBe(themeId);

      const registryTheme = getTheme(themeId);
      expect(activeTheme.colors.background).toBe(registryTheme.colors.background);
      expect(activeTheme.colors.surface).toBe(registryTheme.colors.surface);
      expect(activeTheme.colors.textPrimary).toBe(registryTheme.colors.textPrimary);
      expect(activeTheme.colors.border).toBe(registryTheme.colors.border);
      expect(activeTheme.colors.accent).toBe(registryTheme.colors.accent);

      // Verify DOM attributes were updated
      expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-orion-theme', themeId);
      expect(mockRoot.setAttribute).toHaveBeenCalledWith('data-orion-mode', registryTheme.appearance.mode);

      // Verify CSS properties were injected
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-bg', registryTheme.colors.background);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-surface', registryTheme.colors.surface);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-text', registryTheme.colors.textPrimary);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-border', registryTheme.colors.border);
      expect(mockRoot.style.setProperty).toHaveBeenCalledWith('--orion-accent', registryTheme.colors.accent);
    });
  });

  it('THEME-CERT-AUTO: Adapts dynamically based on prefers-color-scheme in auto mode', () => {
    (globalThis as any).window = {
      matchMedia: vi.fn().mockImplementation((query) => ({
        matches: query.includes('dark'),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    };

    engine.setPreference('appearanceMode', 'auto');
    expect(engine.getResolvedTheme().appearance.mode).toBe('dark');

    delete (globalThis as any).window;
  });

  it('THEME-CERT-RELOAD: Persists theme selection and reloads accurately', () => {
    engine.setTheme('forest');
    expect(engine.getTheme().id).toBe('forest');

    const newEngine = new OrionThemeEngine();
    expect(newEngine.getTheme().id).toBe('forest');
  });

  it('THEME-CERT-ACCENT: Custom accent overrides theme default accent when enabled', () => {
    engine.setPreference('customAccentEnabled', true);
    engine.setPreference('customAccent', '#FF5733');
    expect(engine.getResolvedAccent()).toBe('#FF5733');
  });
});
