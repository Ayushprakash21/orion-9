import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionDock, DockVisibilityState } from '../../os/components/OrionDock';
import { computeDockGeometry } from '../../os/dock/DockGeometry';
import { getTheme, ORION_THEMES } from '../../os/theme/OrionThemeRegistry';
import { resolveThemeVariables, applyThemeToDocument } from '../../theme/themeResolver';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';
import { savePreferences, loadPreferences } from '../../os/theme/OrionThemeStorage';
import { DEFAULT_PREFERENCES, OrionThemeId } from '../../os/theme/OrionThemeTypes';

// Scoped mocks for WindowManager, Language, ContextMenu, Toast, and Geometry
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    windows: {},
    activeAppId: null,
    activeWorkspaceId: 'operations',
    dockPinnedApps: ['inventory', 'orders', 'analytics', 'settings'],
    openApplication: vi.fn(),
    focusApplication: vi.fn(),
    minimizeApplication: vi.fn(),
    maximizeApplication: vi.fn(),
    restoreApplication: vi.fn(),
    closeApplication: vi.fn(),
    pinToDock: vi.fn(),
    unpinFromDock: vi.fn(),
    reorderDock: vi.fn(),
    setLauncherOpen: vi.fn(),
    setCommandPaletteOpen: vi.fn(),
  }),
}));

vi.mock('../../store/LanguageContext', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({
    openContextMenu: vi.fn(),
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

let mockDockAutoHide = false;
let mockDockPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom';

vi.mock('../../os/dock/DockGeometry', async () => {
  const actual = await vi.importActual('../../os/dock/DockGeometry');
  return {
    ...actual,
    useOSGeometry: () => {
      const settings = {
        ...DEFAULT_PERSONALIZATION_SETTINGS,
        dockAutoHide: mockDockAutoHide,
        dockPosition: mockDockPosition,
      };
      const { dock, safeArea, usableRect } = (actual as any).computeDockGeometry(
        settings,
        1440,
        900,
        48,
        !mockDockAutoHide
      );
      return {
        dock,
        settings,
        usableRect,
        viewportWidth: 1440,
        viewportHeight: 900,
        systemBarHeight: 48,
        safeArea,
      };
    },
  };
});

// Scoped mocks for Node Vitest environment
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
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    setTimeout: globalThis.setTimeout,
    clearTimeout: globalThis.clearTimeout,
    innerWidth: 1440,
    innerHeight: 900,
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

describe('Orion-9 Dock Auto-Hide & Global Theme Authority', () => {
  beforeEach(() => {
    mockDockAutoHide = false;
    mockDockPosition = 'bottom';
    mockLocalStorage.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    classList.clear();
  });

  describe('DOCK-001: Authoritative Dock Geometry & Auto-Hide State Model', () => {
    it('computes correct geometry when dockAutoHide is false', () => {
      const geometry = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: false, dockPosition: 'bottom' },
        1440,
        900,
        48,
        true
      );

      expect(geometry.dock.position).toBe('bottom');
      expect(geometry.dock.orientation).toBe('horizontal');
      expect(geometry.dock.hiddenTransform).toBe('translate3d(-50%, calc(100% + 28px), 0)');
      expect(geometry.dock.safeInset).toBe(geometry.dock.thickness + 12);
    });

    it('computes reveal zone inset when dockAutoHide is true and dock is hidden', () => {
      const geometry = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'bottom' },
        1440,
        900,
        48,
        false
      );

      expect(geometry.dock.safeInset).toBe(10); // revealZoneSize
      expect(geometry.dock.hiddenTransform).toBe('translate3d(-50%, calc(100% + 28px), 0)');
    });

    it('renders dock with visible state when auto-hide is disabled', () => {
      mockDockAutoHide = false;
      const html = renderToString(React.createElement(OrionDock));

      expect(html).toContain('data-dock="true"');
      expect(html).toContain('data-dock-visible="true"');
      expect(html).toContain('data-dock-visibility-state="visible"');
      expect(html).toContain('pointer-events-auto');
      expect(html).not.toContain('data-testid="dock-activation-zone"');
      expect(html).not.toContain('data-testid="dock-reveal-handle"');
    });

    it('renders activation zone and reveal handle when auto-hide is enabled', () => {
      mockDockAutoHide = true;
      const html = renderToString(React.createElement(OrionDock));

      expect(html).toContain('data-dock="true"');
      expect(html).toContain('data-dock-visible="false"');
      expect(html).toContain('data-dock-visibility-state="hidden"');
      expect(html).toContain('pointer-events-none');
      expect(html).toContain('data-testid="dock-activation-zone"');
      expect(html).toContain('data-testid="dock-reveal-handle"');
    });

    it('positions activation zone properly for left, right, and top positions', () => {
      // Left dock
      const leftGeom = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'left' },
        1440,
        900,
        48,
        false
      );
      expect(leftGeom.dock.orientation).toBe('vertical');
      expect(leftGeom.dock.hiddenTransform).toBe('translate3d(calc(-100% - 28px), -50%, 0)');

      // Right dock
      const rightGeom = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'right' },
        1440,
        900,
        48,
        false
      );
      expect(rightGeom.dock.orientation).toBe('vertical');
      expect(rightGeom.dock.hiddenTransform).toBe('translate3d(calc(100% + 28px), -50%, 0)');

      // Top dock
      const topGeom = computeDockGeometry(
        { ...DEFAULT_PERSONALIZATION_SETTINGS, dockAutoHide: true, dockPosition: 'top' },
        1440,
        900,
        48,
        false
      );
      expect(topGeom.dock.orientation).toBe('horizontal');
      expect(topGeom.dock.hiddenTransform).toBe('translate3d(-50%, calc(-100% - 28px), 0)');
    });

    it('ensures no hardcoded ring-sky-500 or sky-500 leaks in dock items', () => {
      mockDockAutoHide = false;
      const html = renderToString(React.createElement(OrionDock));

      expect(html).not.toContain('focus-visible:ring-sky-500');
      expect(html).not.toContain('hover:bg-sky-500/50');
      expect(html).toContain('focus-visible:ring-[var(--orion-accent)]');
    });
  });

  describe('THEME-001: Global Theme Authority Reconciliation & Variables', () => {
    it('resolves canonical theme tokens for all 5 official Orion themes', () => {
      const themes: OrionThemeId[] = ['graphite', 'silver', 'midnight', 'forest', 'warm'];

      themes.forEach((themeId) => {
        const canonical = getTheme(themeId);
        const vars = resolveThemeVariables({
          ...DEFAULT_PERSONALIZATION_SETTINGS,
          themeId: themeId,
        });

        // Background & surface match canonical theme
        expect(vars['--orion-bg']).toBe(canonical.colors.background);
        expect(vars['--orion-surface']).toBe(canonical.colors.surface);
        expect(vars['--orion-surface-elevated']).toBe(canonical.colors.surfaceElevated);
        expect(vars['--orion-accent']).toBe(canonical.colors.accent);
        expect(vars['--orion-border']).toBe(canonical.colors.border);
        expect(vars['--orion-success']).toBe(canonical.colors.success);

        // Backward-compatible OS aliases match canonical theme
        expect(vars['--os-bg']).toBe(canonical.colors.background);
        expect(vars['--os-surface']).toBe(canonical.colors.surface);
        expect(vars['--os-accent']).toBe(canonical.colors.accent);
      });
    });

    it('applies theme cleanly to DOM root through applyThemeToDocument', () => {
      applyThemeToDocument({
        ...DEFAULT_PERSONALIZATION_SETTINGS,
        themeId: 'silver',
      });

      const silver = getTheme('silver');
      expect(styleStore['--orion-bg']).toBe(silver.colors.background);
      expect(styleStore['--orion-surface']).toBe(silver.colors.surface);
      expect(styleStore['--orion-accent']).toBe(silver.colors.accent);
      expect(attrStore['data-orion-theme']).toBe('silver');
      expect(attrStore['data-orion-mode']).toBe('light');
    });

    it('preserves wallpaper configuration separate from themeId', () => {
      applyThemeToDocument({
        ...DEFAULT_PERSONALIZATION_SETTINGS,
        themeId: 'forest',
        wallpaperValue: 'linear-gradient(135deg, #064E3B 0%, #022C22 100%)',
        wallpaperType: 'gradient',
      });

      const forest = getTheme('forest');
      expect(attrStore['data-orion-theme']).toBe('forest');
      expect(styleStore['--orion-accent']).toBe(forest.colors.accent);
    });

    it('synchronizes dockAutoHide to OrionThemeStorage when saved', () => {
      savePreferences({
        ...DEFAULT_PREFERENCES,
        dockAutoHide: true,
        dockPosition: 'left',
        themeId: 'midnight',
      });

      const loaded = loadPreferences();
      expect(loaded.dockAutoHide).toBe(true);
      expect(loaded.dockPosition).toBe('left');
      expect(loaded.themeId).toBe('midnight');
    });
  });
});
