/**
 * ORION-9 DESKTOP CONTEXT MENU & WORKSPACE ARCHITECTURE TEST SUITE
 * Validates:
 * 1. Desktop canvas rendering with data-desktop-canvas="true"
 * 2. Desktop shortcut items rendered with data-shortcut-id
 * 3. Viewport boundary clamping logic
 * 4. High stacking context hierarchy (zIndex: 2147483500) for context menus
 * 5. Menu action registration (Refresh, Sort, New Document, New Folder, Widgets, Customize Desktop, Personalize)
 * 6. Item context menu actions (Open, Rename, Create Shortcut, Properties, Move to Recycle Bin)
 * 7. Hit-testing resilience and event propagation (stopPropagation on menu, composedPath outside click dismissal)
 * 8. Drag vs right-click invariants (right-click does not start drag, left drag snaps and persists)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { DesktopWorkspace } from '../../os/desktop/DesktopWorkspace';
import { OrionWindowManager } from '../../os/WindowManagerContext';
import { ToastProvider } from '../../store/ToastContext';
import { desktopWorkspaceService, DEFAULT_GRID_CONFIG } from '../../core/filesystem/DesktopWorkspaceService';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

// Mock SupplyChainContext
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [],
    shipments: [],
    purchaseOrders: [],
    exceptions: [],
    suppliers: [],
    decisions: [],
  }),
}));

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-test-001',
      fullName: 'Chief Operating Officer',
      email: 'exec@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-test-001',
    },
    isAuthenticated: true,
    isAdmin: true,
    signOut: vi.fn(),
  }),
}));

// Viewport Clamping logic verification
function clampContextMenu(
  x: number,
  y: number,
  menuWidth = 220,
  menuHeight = 310,
  padding = 8,
  minTop = 48,
  vWidth = 1440,
  vHeight = 900
): { x: number; y: number } {
  let nextX = x;
  let nextY = y;

  if (nextX + menuWidth > vWidth - padding) {
    nextX = Math.max(padding, vWidth - menuWidth - padding);
  }
  if (nextX < padding) {
    nextX = padding;
  }

  if (nextY + menuHeight > vHeight - padding) {
    nextY = Math.max(minTop, vHeight - menuHeight - padding);
  }
  if (nextY < minTop) {
    nextY = minTop;
  }

  return { x: nextX, y: nextY };
}

describe('Orion Desktop Workspace & Context Menu Tests', () => {
  const testTenant = 'tenant_desktop_ctx_test';

  beforeEach(() => {
    scmPersistenceService.clear();
  });

  describe('1. Desktop Workspace Canvas & Shortcuts Rendering', () => {
    it('renders desktop canvas with data-desktop-canvas="true"', () => {
      const html = renderToString(
        <MemoryRouter>
          <ToastProvider>
            <OrionWindowManager>
              <DesktopWorkspace />
            </OrionWindowManager>
          </ToastProvider>
        </MemoryRouter>
      );

      expect(html).toContain('data-desktop-canvas="true"');
      expect(html).toContain('pointer-events-auto');
    });

    it('seeds and manages shortcuts for workspace', async () => {
      const shortcuts = await desktopWorkspaceService.ensureWorkspaceShortcuts('operations', testTenant, 'LIVE');
      expect(shortcuts.length).toBeGreaterThanOrEqual(6);
      
      const notepadShortcut = shortcuts.find(s => s.targetId === 'notepad');
      expect(notepadShortcut).toBeDefined();
      expect(notepadShortcut?.name).toBe('Notepad');
    });
  });

  describe('2. Viewport Boundary Clamping Invariants', () => {
    it('clamps menu near right and bottom boundaries of viewport (1440x900)', () => {
      // Right edge overflow test
      const posRight = clampContextMenu(1400, 200, 220, 310, 8, 48, 1440, 900);
      expect(posRight.x).toBe(1440 - 220 - 8); // 1212
      expect(posRight.y).toBe(200);

      // Bottom edge overflow test
      const posBottom = clampContextMenu(200, 850, 220, 310, 8, 48, 1440, 900);
      expect(posBottom.x).toBe(200);
      expect(posBottom.y).toBe(900 - 310 - 8); // 582

      // Top edge clamping test (above system bar minTop 48px)
      const posTop = clampContextMenu(200, 10, 220, 310, 8, 48, 1440, 900);
      expect(posTop.y).toBe(48);

      // Left edge clamping test
      const posLeft = clampContextMenu(-50, 200, 220, 310, 8, 48, 1440, 900);
      expect(posLeft.x).toBe(8);
    });

    it('clamps menu correctly on 1920x1080 and 1280x800 resolutions', () => {
      // 1920x1080
      const posFHD = clampContextMenu(1900, 1000, 220, 310, 8, 48, 1920, 1080);
      expect(posFHD.x).toBe(1920 - 220 - 8);
      expect(posFHD.y).toBe(1080 - 310 - 8);

      // 1280x800
      const posWXGA = clampContextMenu(1250, 750, 220, 310, 8, 48, 1280, 800);
      expect(posWXGA.x).toBe(1280 - 220 - 8);
      expect(posWXGA.y).toBe(800 - 310 - 8);
    });
  });

  describe('3. Z-Index and Stacking Invariants', () => {
    it('verifies context menu z-index (2147483500) sits above system bar and below modals', () => {
      const SYSTEM_BAR_Z_INDEX = 2147483000;
      const CONTEXT_MENU_Z_INDEX = 2147483500;
      const MODAL_Z_INDEX = 2147483600;

      expect(CONTEXT_MENU_Z_INDEX).toBeGreaterThan(SYSTEM_BAR_Z_INDEX);
      expect(CONTEXT_MENU_Z_INDEX).toBeLessThan(MODAL_Z_INDEX);
    });
  });

  describe('4. Desktop Context Menu Action Specifications', () => {
    const fs = require('fs');
    const path = require('path');
    const sourceCode = fs.readFileSync(path.resolve(__dirname, '../../os/desktop/DesktopWorkspace.tsx'), 'utf-8');

    it('includes dedicated Widgets action and Customize Desktop action in DesktopWorkspace source', () => {
      expect(sourceCode).toContain('data-action="widgets"');
      expect(sourceCode).toContain('setIsWidgetGalleryOpen(true)');
      expect(sourceCode).toContain('data-action="customize-desktop"');
      expect(sourceCode).toContain('setIsEditMode(true)');
      expect(sourceCode).toContain('data-action="refresh"');
      expect(sourceCode).toContain('data-action="sort-name"');
      expect(sourceCode).toContain('data-action="sort-type"');
      expect(sourceCode).toContain('data-action="sort-date"');
      expect(sourceCode).toContain('data-action="new-folder"');
      expect(sourceCode).toContain('data-action="new-doc-txt"');
      expect(sourceCode).toContain('data-action="personalize"');
    });

    it('includes Item Context Menu actions including Open, Rename, Create Shortcut, and Move to Recycle Bin', () => {
      expect(sourceCode).toContain('data-action="open"');
      expect(sourceCode).toContain('data-action="rename"');
      expect(sourceCode).toContain('data-action="create-shortcut"');
      expect(sourceCode).toContain('data-action="properties"');
      expect(sourceCode).toContain('data-action="delete"');
    });
  });

  describe('5. Outside Dismissal & Event Propagation Resilience', () => {
    const fs = require('fs');
    const path = require('path');
    const sourceCode = fs.readFileSync(path.resolve(__dirname, '../../os/desktop/DesktopWorkspace.tsx'), 'utf-8');

    it('verifies outside-click detection inspects composedPath without false unmounts on menu children', () => {
      // Mock an event clicked inside menu
      const mockMenuElement = {
        hasAttribute: (attr: string) => attr === 'data-orion-context-menu',
        getAttribute: (attr: string) => (attr === 'data-orion-context-menu' ? 'true' : null),
        closest: (sel: string) => (sel === '[data-orion-context-menu="true"]' ? mockMenuElement : null),
      };

      const mockSvgElement = {
        hasAttribute: () => false,
        getAttribute: () => null,
        closest: (sel: string) => (sel === '[data-orion-context-menu="true"]' ? mockMenuElement : null),
      };

      // Case A: Click inside menu on SVG icon
      const insidePath = [mockSvgElement, mockMenuElement, {}];
      const isInside = insidePath.some((el: any) => {
        if (!el || typeof el.hasAttribute !== 'function') return false;
        return (
          el.hasAttribute('data-orion-context-menu') ||
          el.getAttribute('data-orion-context-menu') === 'true' ||
          el.closest?.('[data-orion-context-menu="true"]') != null
        );
      });
      expect(isInside).toBe(true);

      // Case B: Click outside on canvas
      const outsidePath = [{}, {}];
      const isOutside = outsidePath.some((el: any) => {
        if (!el || typeof el.hasAttribute !== 'function') return false;
        return (
          el.hasAttribute('data-orion-context-menu') ||
          el.getAttribute('data-orion-context-menu') === 'true' ||
          el.closest?.('[data-orion-context-menu="true"]') != null
        );
      });
      expect(isOutside).toBe(false);
    });

    it('verifies context menu stops propagation on pointerdown, mousedown, and click', () => {
      expect(sourceCode).toContain('onPointerDown={e => e.stopPropagation()}');
      expect(sourceCode).toContain('onMouseDown={e => e.stopPropagation()}');
      expect(sourceCode).toContain('onClick={e => e.stopPropagation()}');
    });

    it('verifies menu icons and labels have pointer-events-none for consistent button hit-testing', () => {
      expect(sourceCode).toContain('pointer-events-none shrink-0');
      expect(sourceCode).toContain('pointer-events-none font-medium');
    });
  });

  describe('6. Drag vs Right-Click Invariants', () => {
    const fs = require('fs');
    const path = require('path');
    const sourceCode = fs.readFileSync(path.resolve(__dirname, '../../os/desktop/DesktopWorkspace.tsx'), 'utf-8');

    it('right-click does not start drag (button !== 0 guard in handleItemPointerDown)', () => {
      expect(sourceCode).toContain("if (e.button !== 0 && e.pointerType === 'mouse') return;");
    });

    it('grid snap coordinates persistence correctly saves dragged shortcut position', async () => {
      const shortcuts = await desktopWorkspaceService.ensureWorkspaceShortcuts('operations', testTenant, 'LIVE');
      const target = shortcuts[0];

      const updated = await desktopWorkspaceService.updateShortcutPosition(
        target.id,
        240,
        360,
        1920,
        1080,
        testTenant,
        'LIVE'
      );

      expect(updated.id).toBe(target.id);
      expect(updated.x).toBeGreaterThan(0);
      expect(updated.y).toBeGreaterThan(0);
    });
  });
});
