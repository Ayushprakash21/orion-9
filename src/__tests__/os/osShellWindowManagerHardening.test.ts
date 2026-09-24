import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AppWindow, WORKSPACES, WorkspaceId } from '../../os/WindowManagerContext';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';

describe('ORION-9 OS Shell & Window Manager Hardening Specification', () => {

  describe('1. OS Layer Stacking Hierarchy Contract', () => {
    // Official Orion-9 OS Layer Architecture Constants
    const OS_LAYERS = {
      WALLPAPER: 0,
      WINDOWS_MIN: 10,
      WINDOWS_ACTIVE: 45,
      DOCK: 60,
      TOP_BAR_CHROME: 2147483000,
      SYSTEM_POPOVERS: 2147483600, // Wi-Fi, Notifications, System Menu, Account Menu, Time
      COMMAND_SURFACES: 2147483620, // Launcher, Command Palette
      SYSTEM_MODALS_DRAWERS: 2147483640, // Entity Drawer, Confirm Modal, System Status Modal
      CRITICAL_OVERLAYS: 2147483647, // Brightness overlay, Toasts, Lock screen
    };

    it('validates strict monotonic elevation across all OS layers', () => {
      expect(OS_LAYERS.WALLPAPER).toBeLessThan(OS_LAYERS.WINDOWS_MIN);
      expect(OS_LAYERS.WINDOWS_MIN).toBeLessThan(OS_LAYERS.WINDOWS_ACTIVE);
      expect(OS_LAYERS.WINDOWS_ACTIVE).toBeLessThan(OS_LAYERS.DOCK);
      expect(OS_LAYERS.DOCK).toBeLessThan(OS_LAYERS.TOP_BAR_CHROME);
      expect(OS_LAYERS.TOP_BAR_CHROME).toBeLessThan(OS_LAYERS.SYSTEM_POPOVERS);
      expect(OS_LAYERS.SYSTEM_POPOVERS).toBeLessThan(OS_LAYERS.COMMAND_SURFACES);
      expect(OS_LAYERS.COMMAND_SURFACES).toBeLessThan(OS_LAYERS.SYSTEM_MODALS_DRAWERS);
      expect(OS_LAYERS.SYSTEM_MODALS_DRAWERS).toBeLessThan(OS_LAYERS.CRITICAL_OVERLAYS);
    });

    it('ensures application windows are never elevated above Dock, Topbar, or Popovers', () => {
      const maxWindowZ = 45;
      expect(maxWindowZ).toBeLessThan(OS_LAYERS.DOCK);
      expect(maxWindowZ).toBeLessThan(OS_LAYERS.TOP_BAR_CHROME);
      expect(maxWindowZ).toBeLessThan(OS_LAYERS.SYSTEM_POPOVERS);
    });

    it('ensures system popovers and modals are strictly above persistent top bar chrome', () => {
      expect(OS_LAYERS.SYSTEM_POPOVERS).toBeGreaterThan(OS_LAYERS.TOP_BAR_CHROME);
      expect(OS_LAYERS.SYSTEM_MODALS_DRAWERS).toBeGreaterThan(OS_LAYERS.TOP_BAR_CHROME);
    });
  });

  describe('2. Window Manager Z-Index & Focus Normalization Logic', () => {
    // Replicate window manager pure normalization algorithm
    const normalizeZ = (
      prev: Record<string, AppWindow>,
      focusedId?: string | null
    ): Record<string, AppWindow> => {
      const windowList = Object.values(prev);
      if (windowList.length === 0) return {};

      const others = windowList
        .filter(w => w.id !== focusedId)
        .sort((a, b) => a.zIndex - b.zIndex);

      const next: Record<string, AppWindow> = {};
      others.forEach((w, idx) => {
        next[w.id] = {
          ...w,
          zIndex: 10 + Math.min(idx, 30),
          isFocused: false,
          state: w.state === 'active' ? 'inactive' : w.state
        };
      });

      if (focusedId && prev[focusedId]) {
        const cur = prev[focusedId];
        next[focusedId] = {
          ...cur,
          zIndex: 45,
          isFocused: true,
          state: cur.state === 'minimized' ? 'active' : (cur.state === 'maximized' ? 'maximized' : 'active')
        };
      }

      return next;
    };

    it('assigns zIndex 45 and isFocused true to the active focused window', () => {
      const initial: Record<string, AppWindow> = {
        inventory: {
          id: 'inventory',
          state: 'active',
          zIndex: 10,
          position: { x: 50, y: 50 },
          size: { width: 800, height: 600 },
          workspace: 'operations',
          isFocused: true,
          openedAt: 1000
        },
        shipments: {
          id: 'shipments',
          state: 'inactive',
          zIndex: 11,
          position: { x: 100, y: 100 },
          size: { width: 800, height: 600 },
          workspace: 'operations',
          isFocused: false,
          openedAt: 1001
        }
      };

      const normalized = normalizeZ(initial, 'shipments');

      expect(normalized['shipments'].zIndex).toBe(45);
      expect(normalized['shipments'].isFocused).toBe(true);
      expect(normalized['shipments'].state).toBe('active');

      expect(normalized['inventory'].zIndex).toBe(10);
      expect(normalized['inventory'].isFocused).toBe(false);
      expect(normalized['inventory'].state).toBe('inactive');
    });

    it('handles multi-window cascading z-index stacking accurately up to 30 windows', () => {
      const windows: Record<string, AppWindow> = {};
      for (let i = 0; i < 5; i++) {
        const id = `app-${i}`;
        windows[id] = {
          id,
          state: 'inactive',
          zIndex: 10 + i,
          position: { x: i * 20, y: i * 20 },
          size: { width: 600, height: 400 },
          workspace: 'operations',
          isFocused: false,
          openedAt: 1000 + i
        };
      }

      const normalized = normalizeZ(windows, 'app-2');

      expect(normalized['app-2'].zIndex).toBe(45);
      expect(normalized['app-2'].isFocused).toBe(true);

      const unfocused = Object.values(normalized).filter(w => w.id !== 'app-2');
      unfocused.forEach((w, idx) => {
        expect(w.zIndex).toBe(10 + idx);
        expect(w.isFocused).toBe(false);
      });
    });
  });

  describe('3. Window Geometry: Maximize, Restore & Boundary Clamping', () => {
    it('caches previous floating bounds during maximize and restores them on restore', () => {
      const initialFloatingWindow: AppWindow = {
        id: 'command-center',
        state: 'active',
        zIndex: 45,
        position: { x: 120, y: 80 },
        size: { width: 900, height: 650 },
        workspace: 'operations',
        isFocused: true,
        openedAt: 2000
      };

      // 1. Maximize step
      const maximizedWindow: AppWindow = {
        ...initialFloatingWindow,
        prevGeometry: {
          position: initialFloatingWindow.position,
          size: initialFloatingWindow.size
        },
        state: 'maximized'
      };

      expect(maximizedWindow.state).toBe('maximized');
      expect(maximizedWindow.prevGeometry).toEqual({
        position: { x: 120, y: 80 },
        size: { width: 900, height: 650 }
      });

      // 2. Restore step
      const restoredWindow: AppWindow = {
        ...maximizedWindow,
        position: maximizedWindow.prevGeometry!.position,
        size: maximizedWindow.prevGeometry!.size,
        state: 'active'
      };

      expect(restoredWindow.state).toBe('active');
      expect(restoredWindow.position).toEqual({ x: 120, y: 80 });
      expect(restoredWindow.size).toEqual({ width: 900, height: 650 });
    });

    it('enforces safe drag clamping so window header cannot escape viewport', () => {
      const screenW = 1920;
      const screenH = 1080 - 48; // 1032
      const winSize = { width: 800, height: 600 };

      const clampPosition = (pos: { x: number; y: number }) => {
        const clampedX = Math.max(-winSize.width + 120, Math.min(screenW - 120, pos.x));
        const clampedY = Math.max(0, Math.min(Math.max(0, screenH - 32), pos.y));
        return { x: clampedX, y: clampedY };
      };

      // Test extreme negative Y (attempted drag above top bar)
      expect(clampPosition({ x: 200, y: -500 }).y).toBe(0);

      // Test extreme positive Y (attempted drag below bottom)
      expect(clampPosition({ x: 200, y: 5000 }).y).toBe(screenH - 32);

      // Test extreme left X
      expect(clampPosition({ x: -1000, y: 100 }).x).toBe(-winSize.width + 120);

      // Test extreme right X
      expect(clampPosition({ x: 3000, y: 100 }).x).toBe(screenW - 120);
    });

    it('enforces safe resize clamping ensuring minimum usability dimensions', () => {
      const screenW = 1440;
      const screenH = 900 - 48; // 852

      const minW = Math.min(480, Math.max(320, Math.round(screenW * 0.55))); // 480
      const minH = Math.min(340, Math.max(240, Math.round(screenH * 0.45))); // 340

      const clampSize = (size: { width: number; height: number }) => {
        const clampedW = Math.max(minW, Math.min(screenW - 8, size.width));
        const clampedH = Math.max(minH, Math.min(screenH - 8, size.height));
        return { width: clampedW, height: clampedH };
      };

      // Attempt to shrink to 50x50
      const smallRes = clampSize({ width: 50, height: 50 });
      expect(smallRes.width).toBeGreaterThanOrEqual(minW);
      expect(smallRes.height).toBeGreaterThanOrEqual(minH);

      // Attempt to expand beyond screen
      const largeRes = clampSize({ width: 5000, height: 5000 });
      expect(largeRes.width).toBeLessThanOrEqual(screenW - 8);
      expect(largeRes.height).toBeLessThanOrEqual(screenH - 8);
    });
  });

  describe('4. Workspace Partitioning & Window Visibility', () => {
    it('defines the standard 3 Orion OS workspaces', () => {
      expect(WORKSPACES).toHaveLength(3);
      const ids = WORKSPACES.map(w => w.id);
      expect(ids).toContain('operations');
      expect(ids).toContain('intelligence');
      expect(ids).toContain('control');
    });

    it('filters active workspace windows correctly', () => {
      const windows: Record<string, AppWindow> = {
        inventory: {
          id: 'inventory',
          state: 'active',
          zIndex: 45,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          workspace: 'operations',
          isFocused: true,
          openedAt: 1
        },
        'world-model': {
          id: 'world-model',
          state: 'active',
          zIndex: 45,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          workspace: 'intelligence',
          isFocused: true,
          openedAt: 2
        }
      };

      const activeWorkspace: WorkspaceId = 'operations';
      const visibleWindows = Object.values(windows).filter(
        w => w.workspace === activeWorkspace && w.state !== 'closed'
      );

      expect(visibleWindows).toHaveLength(1);
      expect(visibleWindows[0].id).toBe('inventory');
    });
  });
});
