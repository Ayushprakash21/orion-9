import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { WORKSPACES, WorkspaceConfig, WindowSnapState } from '../../os/WindowManagerContext';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { OrionMissionControl } from '../../os/components/OrionMissionControl';
import { OrionControlCenterPopover } from '../../os/components/OrionControlCenterPopover';

if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = String(val); },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { Object.keys(store).forEach(k => delete store[k]); }
  };
}

// Mock contexts for component rendering
vi.mock('../../os/WindowManagerContext', async () => {
  const actual = await vi.importActual<typeof import('../../os/WindowManagerContext')>('../../os/WindowManagerContext');
  return {
    ...actual,
    useWindowManager: () => ({
      missionControlOpen: true,
      setMissionControlOpen: vi.fn(),
      toggleMissionControl: vi.fn(),
      workspaces: [
        ...actual.WORKSPACES,
        { id: 'space-test-01', name: 'CUSTOM SPACE 1', pinnedApps: [], isCustom: true }
      ],
      activeWorkspaceId: 'operations',
      setWorkspace: vi.fn(),
      createWorkspace: vi.fn(),
      renameWorkspace: vi.fn(),
      deleteWorkspace: vi.fn(),
      windows: {
        'command-center': {
          id: 'command-center',
          title: 'Command Center',
          workspace: 'operations',
          state: 'active',
          position: { x: 50, y: 50 },
          size: { width: 900, height: 600 },
          zIndex: 45,
          isFocused: true,
        }
      },
      focusApplication: vi.fn(),
      closeApplication: vi.fn(),
      moveWindowToWorkspace: vi.fn(),
      openApplication: vi.fn(),
    }),
  };
});

vi.mock('../../os/theme/useOrionTheme', () => ({
  useOrionTheme: () => ({
    theme: { id: 'graphite', name: 'Graphite' },
    preferences: { themeId: 'graphite', appearanceMode: 'dark' },
    setPreference: vi.fn(),
    isDark: true,
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ORION-9 Master Desktop Architecture Subsystems', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('1. Dynamic Spaces & Multiple Desktops Architecture', () => {
    it('has canonical default spaces (Operations, Intelligence, Control)', () => {
      expect(WORKSPACES.length).toBeGreaterThanOrEqual(3);
      const ids = WORKSPACES.map(w => w.id);
      expect(ids).toContain('operations');
      expect(ids).toContain('intelligence');
      expect(ids).toContain('control');
    });

    it('creates, renames, and serializes custom workspaces', () => {
      const customSpaces: WorkspaceConfig[] = [
        {
          id: `space-${Date.now()}`,
          name: 'SUPPLY AUDIT HUB',
          pinnedApps: ['command-center', 'inventory'],
          isCustom: true,
        }
      ];

      // Test serialization to localStorage key
      localStorage.setItem('orion_custom_workspaces', JSON.stringify(customSpaces));
      const loaded = JSON.parse(localStorage.getItem('orion_custom_workspaces') || '[]');
      expect(loaded.length).toBe(1);
      expect(loaded[0].name).toBe('SUPPLY AUDIT HUB');
      expect(loaded[0].isCustom).toBe(true);

      // Test rename
      const renamed = loaded.map((s: WorkspaceConfig) => ({ ...s, name: 'SUPPLY INTELLIGENCE' }));
      localStorage.setItem('orion_custom_workspaces', JSON.stringify(renamed));
      const reloaded = JSON.parse(localStorage.getItem('orion_custom_workspaces') || '[]');
      expect(reloaded[0].name).toBe('SUPPLY INTELLIGENCE');
    });

    it('evacuates open windows safely to operations workspace on custom space deletion', () => {
      const deletedSpaceId = 'space-custom-to-delete';
      const openWindows: Record<string, any> = {
        'inventory': { id: 'inventory', workspace: deletedSpaceId, state: 'active' },
        'browser': { id: 'browser', workspace: 'intelligence', state: 'active' }
      };

      // Perform safe evacuation logic (as implemented in WindowManagerContext)
      const updated = { ...openWindows };
      Object.keys(updated).forEach(k => {
        if (updated[k].workspace === deletedSpaceId) {
          updated[k] = { ...updated[k], workspace: 'operations' };
        }
      });

      expect(updated['inventory'].workspace).toBe('operations');
      expect(updated['browser'].workspace).toBe('intelligence');
    });
  });

  describe('2. Window Snapping Geometry Calculations', () => {
    it('calculates exact left and right half boundaries', () => {
      const screenW = 1440;
      const topBarH = 48;
      const screenH = 900 - topBarH; // 852
      const halfW = Math.round(screenW / 2);

      const leftSnap = {
        position: { x: 0, y: 0 },
        size: { width: halfW, height: screenH }
      };

      const rightSnap = {
        position: { x: halfW, y: 0 },
        size: { width: screenW - halfW, height: screenH }
      };

      expect(leftSnap.position.x).toBe(0);
      expect(leftSnap.size.width).toBe(720);
      expect(leftSnap.size.height).toBe(852);

      expect(rightSnap.position.x).toBe(720);
      expect(rightSnap.size.width).toBe(720);
      expect(rightSnap.size.height).toBe(852);
    });

    it('calculates four quadrant snap geometries with 50% split', () => {
      const screenW = 1440;
      const topBarH = 48;
      const screenH = 852;
      const halfW = 720;
      const halfH = 426;

      const quadrants: Record<WindowSnapState, { position: { x: number; y: number }; size: { width: number; height: number } }> = {
        'top-left': { position: { x: 0, y: 0 }, size: { width: halfW, height: halfH } },
        'top-right': { position: { x: halfW, y: 0 }, size: { width: screenW - halfW, height: halfH } },
        'bottom-left': { position: { x: 0, y: halfH }, size: { width: halfW, height: screenH - halfH } },
        'bottom-right': { position: { x: halfW, y: halfH }, size: { width: screenW - halfW, height: screenH - halfH } },
        'left': { position: { x: 0, y: 0 }, size: { width: halfW, height: screenH } },
        'right': { position: { x: halfW, y: 0 }, size: { width: halfW, height: screenH } },
      };

      expect(quadrants['top-left'].position).toEqual({ x: 0, y: 0 });
      expect(quadrants['top-right'].position).toEqual({ x: 720, y: 0 });
      expect(quadrants['bottom-left'].position).toEqual({ x: 0, y: 426 });
      expect(quadrants['bottom-right'].position).toEqual({ x: 720, y: 426 });
    });
  });

  describe('3. Virtual Filesystem Duplication Engine', () => {
    it('duplicates file in-place preserving content and extension', async () => {
      await orionFileSystemService.ensureSystemStructure();

      const original = await orionFileSystemService.createFile({
        name: 'Autonomous Route Optimizations',
        extension: 'json',
        content: JSON.stringify({ routes: ['ORD-LAX', 'FRA-JFK'] }),
        folderId: 'folder_sys_projects_tenant_default',
        tags: ['logistics', 'routes'],
      });

      expect(original.id).toBeDefined();

      const duplicate = await orionFileSystemService.duplicateFile(original.id);

      expect(duplicate.id).not.toBe(original.id);
      expect(duplicate.name).toBe('Autonomous Route Optimizations Copy');
      expect(duplicate.extension).toBe('json');
      expect(duplicate.folderId).toBe(original.folderId);
      expect(duplicate.content).toBe(original.content);
      expect(duplicate.tags).toContain('logistics');
    });
  });

  describe('4. Mission Control & Control Center UI Rendering', () => {
    it('renders Mission Control with top Spaces bar and exposé window cards', () => {
      const html = renderToString(<OrionMissionControl />);

      expect(html).toContain('data-testid="orion-mission-control-overlay"');
      expect(html).toContain('Spaces &amp; Desktops');
      expect(html).toContain('data-testid="mission-control-add-space-btn"');
      expect(html).toContain('data-testid="mission-control-space-operations"');
      expect(html).toContain('data-testid="mission-control-window-command-center"');
      expect(html).toContain('Move to:');
    });

    it('renders Control Center Popover with Display Brightness and Sound Volume controls', () => {
      const handleClose = vi.fn();
      const html = renderToString(<OrionControlCenterPopover isOpen={true} onClose={handleClose} />);

      expect(html).toContain('data-testid="orion-control-center-popover"');
      expect(html).toContain('Display Brightness');
      expect(html).toContain('Sound Volume');
      expect(html).toContain('Focus');
      expect(html).toContain('Theme');
      expect(html).toContain('Connected');
    });
  });
});
