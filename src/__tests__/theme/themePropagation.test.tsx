import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { OrionThemeEngine } from '../../os/theme/OrionThemeEngine';
import { getTheme } from '../../os/theme/OrionThemeRegistry';
import { resolveThemeVariables } from '../../theme/themeResolver';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';

// Scoped mocks for Vitest Node runner environment
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((k: string) => storageMock[k] ?? null),
  setItem: vi.fn((k: string, v: string) => { storageMock[k] = String(v); }),
  removeItem: vi.fn((k: string) => { delete storageMock[k]; }),
  clear: vi.fn(() => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }),
};

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

const styleStore: Record<string, string> = {};
const attrStore: Record<string, string> = {};
const classList = new Set<string>();

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        setProperty: vi.fn((k: string, v: string) => { styleStore[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleStore[k] || ''),
        colorScheme: '',
      },
      classList: {
        add: vi.fn((c: string) => classList.add(c)),
        remove: vi.fn((c: string) => classList.delete(c)),
        contains: vi.fn((c: string) => classList.has(c)),
      },
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] ?? null),
      removeAttribute: vi.fn((k: string) => { delete attrStore[k]; }),
    },
    body: {
      style: {
        backgroundColor: '',
        color: '',
      },
    },
  };
}

describe('System-wide Theme Propagation & Single Source of Truth', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    classList.clear();
  });

  afterEach(() => {
    mockLocalStorage.clear();
  });

  it('1. All 5 core themes apply exact background and surface tokens to documentElement', () => {
    const engine = new OrionThemeEngine();
    const themes = ['graphite', 'silver', 'midnight', 'forest', 'warm'] as const;

    for (const themeId of themes) {
      engine.setTheme(themeId);
      const root = (globalThis as any).document.documentElement;
      const expectedTheme = getTheme(themeId);

      expect(root.getAttribute('data-orion-theme')).toBe(themeId);
      expect(root.style.getPropertyValue('--orion-bg')).toBe(expectedTheme.colors.background);
      expect(root.style.getPropertyValue('--orion-surface')).toBe(expectedTheme.colors.surface);
      expect(root.style.getPropertyValue('--orion-surface-elevated')).toBe(expectedTheme.colors.surfaceElevated);
      expect(root.style.getPropertyValue('--orion-text-primary')).toBe(expectedTheme.colors.textPrimary);
      expect(root.style.getPropertyValue('--orion-border')).toBe(expectedTheme.colors.border);
    }
  });

  it('2. Backwards-compatible --os-* aliases strictly mirror canonical --orion-* tokens', () => {
    const engine = new OrionThemeEngine();
    engine.setTheme('silver');

    const root = (globalThis as any).document.documentElement;
    expect(root.style.getPropertyValue('--os-bg')).toBe(root.style.getPropertyValue('--orion-bg'));
    expect(root.style.getPropertyValue('--os-surface')).toBe(root.style.getPropertyValue('--orion-surface'));
    expect(root.style.getPropertyValue('--os-surface-elevated')).toBe(root.style.getPropertyValue('--orion-surface-elevated'));
    expect(root.style.getPropertyValue('--os-text-primary')).toBe(root.style.getPropertyValue('--orion-text-primary'));
    expect(root.style.getPropertyValue('--os-border')).toBe(root.style.getPropertyValue('--orion-border'));
    expect(root.style.getPropertyValue('--os-accent')).toBe(root.style.getPropertyValue('--orion-accent'));
  });

  it('3. Silver theme activates genuine light mode on the document', () => {
    const engine = new OrionThemeEngine();
    engine.setTheme('silver');

    const root = (globalThis as any).document.documentElement;
    expect(root.classList.contains('light')).toBe(true);
    expect(root.classList.contains('dark')).toBe(false);
    expect(root.getAttribute('data-orion-mode')).toBe('light');
    expect(root.style.colorScheme).toBe('light');
  });

  it('4. Custom accent color overrides canonical and alias accent tokens', () => {
    const engine = new OrionThemeEngine();
    engine.setPreference('customAccentEnabled', true);
    engine.setPreference('customAccent', '#FF0055');

    const root = (globalThis as any).document.documentElement;
    expect(root.style.getPropertyValue('--orion-accent')).toBe('#FF0055');
    expect(root.style.getPropertyValue('--os-accent')).toBe('#FF0055');
    expect(engine.getResolvedAccent()).toBe('#FF0055');
  });

  it('5. Legacy resolveThemeVariables outputs both --orion-* and --os-* tokens', () => {
    const vars = resolveThemeVariables({
      ...DEFAULT_PERSONALIZATION_SETTINGS,
      appearanceMode: 'dark',
      accentKey: 'blue',
      windowStyle: 'standard',
      cornerStyle: 'subtle',
      density: 'comfortable',
      uiScale: 100,
      reducedTransparency: false,
      reducedMotion: false,
      highContrast: false,
    });

    expect(vars['--orion-bg']).toBeDefined();
    expect(vars['--os-bg']).toBe(vars['--orion-bg']);
    expect(vars['--orion-surface']).toBeDefined();
    expect(vars['--os-surface']).toBe(vars['--orion-surface']);
    expect(vars['--orion-text-primary']).toBeDefined();
    expect(vars['--os-text-primary']).toBe(vars['--orion-text-primary']);
    expect(vars['--os-accent']).toBe(vars['--orion-accent']);
  });
});
