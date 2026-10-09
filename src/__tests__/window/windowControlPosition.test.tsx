import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionWindowControls } from '../../os/components/OrionWindowControls';
import { OrionWindow } from '../../os/components/OrionWindow';
import { AppWindow } from '../../os/WindowManagerContext';
import { AppearanceSettingsPanel } from '../../components/settings/AppearanceSettingsPanel';
import { PersonalizationSettingsPanel } from '../../components/settings/PersonalizationSettingsPanel';
import { OrionThemeProvider } from '../../os/theme/OrionThemeProvider';
import { loadPreferences, savePreferences, clearPreferences, migratePreferences } from '../../os/theme/OrionThemeStorage';
import { DEFAULT_PREFERENCES } from '../../os/theme/OrionThemeTypes';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../../theme/themePresets';

// Mock WindowManagerContext
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    focusApplication: vi.fn(),
    closeApplication: vi.fn(),
    minimizeApplication: vi.fn(),
    maximizeApplication: vi.fn(),
    restoreApplication: vi.fn(),
    moveApplication: vi.fn(),
    resizeApplication: vi.fn(),
  }),
  WORKSPACES: [],
}));

vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({ openContextMenu: vi.fn() }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../os/OrionComponentMap', () => ({
  getAppComponent: () => () => React.createElement('div', { id: 'mock-app-content' }, 'Mock App Content'),
}));

// Mock OSGeometry for controllable windowControlPosition in tests
let mockGeometrySettings = { ...DEFAULT_PERSONALIZATION_SETTINGS };
vi.mock('../../os/dock/DockGeometry', () => ({
  useOSGeometry: () => ({
    viewportWidth: 1440,
    viewportHeight: 900,
    systemBarHeight: 48,
    dock: {
      position: 'bottom',
      orientation: 'horizontal',
      iconSize: 48,
      iconContainerSize: 52,
      dockHeight: 76,
      dockWidth: 800,
      thickness: 76,
      safeInset: 88,
      revealZoneSize: 10,
      hiddenTransform: '',
      tooltipPlacement: 'top',
      magnificationOrigin: 'bottom center'
    },
    safeArea: { top: 48, right: 0, bottom: 0, left: 0 },
    usableRect: { x: 0, y: 48, width: 1440, height: 852 },
    settings: mockGeometrySettings,
    previewSettings: vi.fn((preview) => {
      if (preview) {
        mockGeometrySettings = { ...mockGeometrySettings, ...preview };
      }
    }),
  }),
  OSGeometryProvider: ({ children }: { children: React.ReactNode }) => React.createElement(React.Fragment, null, children),
}));

// In-memory localStorage mock for Node test environment
const createLocalStorageMock = () => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value.toString(); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
};

describe('ORION-9 Window Control Position Personalization Engine', () => {
  beforeEach(() => {
    const mockStorage = createLocalStorageMock();
    if (typeof globalThis.localStorage === 'undefined') {
      (globalThis as any).localStorage = mockStorage;
    } else {
      globalThis.localStorage.clear();
    }

    mockGeometrySettings = { ...DEFAULT_PERSONALIZATION_SETTINGS, windowControlPosition: 'left' };
  });

  afterEach(() => {
    if (globalThis.localStorage) {
      globalThis.localStorage.clear();
    }
  });

  describe('1. OrionWindowControls Component (Isolated Unit Specs)', () => {
    it('renders position="left" with control order: Yellow (Minimize) -> Green (Maximize) -> Red (Close)', () => {
      const html = renderToString(React.createElement(OrionWindowControls, { appName: 'Control Tower', position: 'left' }));
      
      const minIdx = html.indexOf('aria-label="Minimize Control Tower"');
      const maxIdx = html.indexOf('aria-label="Maximize Control Tower"');
      const closeIdx = html.indexOf('aria-label="Close Control Tower"');

      expect(minIdx).toBeGreaterThan(-1);
      expect(maxIdx).toBeGreaterThan(-1);
      expect(closeIdx).toBeGreaterThan(-1);

      // Order check: Minimize (Yellow) < Maximize (Green) < Close (Red)
      expect(minIdx).toBeLessThan(maxIdx);
      expect(maxIdx).toBeLessThan(closeIdx);

      // Correct color tokens
      expect(html).toContain('background-color:#FEBC2E'); // Minimize
      expect(html).toContain('background-color:#28C840'); // Maximize
      expect(html).toContain('background-color:#FF5F57'); // Close
      expect(html).toContain('data-position="left"');
    });

    it('renders position="right" with control order: Yellow (Minimize) -> Green (Maximize) -> Red (Close)', () => {
      const html = renderToString(React.createElement(OrionWindowControls, { appName: 'Control Tower', position: 'right' }));

      const minIdx = html.indexOf('aria-label="Minimize Control Tower"');
      const maxIdx = html.indexOf('aria-label="Maximize Control Tower"');
      const closeIdx = html.indexOf('aria-label="Close Control Tower"');

      expect(minIdx).toBeGreaterThan(-1);
      expect(maxIdx).toBeGreaterThan(-1);
      expect(closeIdx).toBeGreaterThan(-1);

      // Order check: Minimize (Yellow) < Maximize (Green) < Close (Red)
      expect(minIdx).toBeLessThan(maxIdx);
      expect(maxIdx).toBeLessThan(closeIdx);

      expect(html).toContain('data-position="right"');
    });

    it('renders accessible title and aria-labels for all buttons in left and right positions', () => {
      const leftHtml = renderToString(React.createElement(OrionWindowControls, { appName: 'Inventory', position: 'left' }));
      expect(leftHtml).toContain('aria-label="Close Inventory"');
      expect(leftHtml).toContain('aria-label="Minimize Inventory"');
      expect(leftHtml).toContain('aria-label="Maximize Inventory"');

      const rightHtml = renderToString(React.createElement(OrionWindowControls, { appName: 'Inventory', position: 'right' }));
      expect(rightHtml).toContain('aria-label="Close Inventory"');
      expect(rightHtml).toContain('aria-label="Minimize Inventory"');
      expect(rightHtml).toContain('aria-label="Maximize Inventory"');
    });
  });

  describe('2. OrionWindow Chrome Integration (Left vs Right Placement)', () => {
    const mockWindow: AppWindow = {
      id: 'control-tower',
      state: 'open',
      zIndex: 10,
      position: { x: 50, y: 50 },
      size: { width: 1000, height: 700 },
      workspace: 'operations',
      isFocused: true,
      openedAt: Date.now(),
    };

    it('places controls on the LEFT when windowControlPosition is "left"', () => {
      mockGeometrySettings.windowControlPosition = 'left';
      const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));

      const controlsIndex = html.indexOf('data-window-controls="true"');
      const appTitleIndex = html.indexOf('Control-tower');

      expect(controlsIndex).toBeGreaterThan(-1);
      expect(appTitleIndex).toBeGreaterThan(-1);
      // In left mode, controls appear before the app title in DOM order
      expect(controlsIndex).toBeLessThan(appTitleIndex);
      expect(html).toContain('data-position="left"');
    });

    it('places controls on the RIGHT when windowControlPosition is "right"', () => {
      mockGeometrySettings.windowControlPosition = 'right';
      const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));

      const controlsIndex = html.indexOf('data-window-controls="true"');
      const appTitleIndex = html.indexOf('Control-tower');

      expect(controlsIndex).toBeGreaterThan(-1);
      expect(appTitleIndex).toBeGreaterThan(-1);
      // In right mode, app title appears on the left, controls appear on the right
      expect(appTitleIndex).toBeLessThan(controlsIndex);
      expect(html).toContain('data-position="right"');
    });
  });

  describe('3. Appearance Settings Panel Non-Duplication', () => {
    it('does not duplicate the Window Controls Position section in Appearance settings panel (Desktop & Windows is the single home)', () => {
      const html = renderToString(
        React.createElement(OrionThemeProvider, null, 
          React.createElement(AppearanceSettingsPanel, null)
        )
      );

      // Section header must NOT be duplicated in Appearance
      expect(html).not.toContain('Window Controls Position');
      expect(html).not.toContain('Right — Windows style');
    });
  });

  describe('4. Personalization Settings Panel Consistency', () => {
    it('renders window control position selector with dual cards in Personalization panel', () => {
      const html = renderToString(
        React.createElement(PersonalizationSettingsPanel, {
          settings: { ...DEFAULT_PERSONALIZATION_SETTINGS, windowControlPosition: 'left' },
          onChange: vi.fn(),
        })
      );

      expect(html).toContain('Window Controls Position');
      expect(html).toContain('role="radiogroup"');
      expect(html).toContain('role="radio"');
      expect(html).toContain('Left — Mac style');
      expect(html).toContain('Right — Windows style');
    });
  });

  describe('5. Persistence and Reset to Defaults', () => {
    it('persists windowControlPosition preference in localStorage and restores default on reset', () => {
      // 1. Initial default is 'left'
      expect(DEFAULT_PREFERENCES.windowControlPosition).toBe('left');
      const initialPrefs = loadPreferences();
      expect(initialPrefs.windowControlPosition).toBe('left');

      // 2. Save preference to 'right'
      savePreferences({ ...initialPrefs, windowControlPosition: 'right' });
      const reloaded = loadPreferences();
      expect(reloaded.windowControlPosition).toBe('right');

      // 3. Reset defaults restores 'left'
      clearPreferences();
      const afterClear = loadPreferences();
      expect(afterClear.windowControlPosition).toBe('left');
    });

    it('migrates legacy preferences safely ensuring windowControlPosition defaults to left if omitted', () => {
      const migrated = migratePreferences({ version: 1, themeId: 'graphite' });
      expect(migrated.windowControlPosition).toBe('left');

      const migratedRight = migratePreferences({ version: 1, themeId: 'graphite', windowControlPosition: 'right' });
      expect(migratedRight.windowControlPosition).toBe('right');
    });
  });
});
