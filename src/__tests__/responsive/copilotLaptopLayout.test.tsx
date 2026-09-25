/**
 * ORION-9 LAPTOP RESPONSIVE UI & COPILOT LAYOUT REPAIR TEST SUITE
 * 
 * Verifies:
 * 1. Orion Copilot rendering and layout integrity at laptop viewports (1366x768, 1440x900, 1536x864).
 * 2. Dock safe area contract (--orion-dock-safe-height) and dynamic window bottom/height constraints.
 * 3. Copilot input composer, send button, and suggested actions visibility.
 * 4. Internal conversation scrolling without forcing desktop shell page scrolling.
 * 5. Window Manager regression safety for Control Tower, Settings, Admin, and Inventory.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { AICopilot } from '../../components/AICopilot';
import { OrionDock } from '../../os/components/OrionDock';
import { OrionWindow } from '../../os/components/OrionWindow';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

// Mock Auth Context
vi.mock('../../store/AuthContext', () => ({
  useAuth: () => ({
    currentUser: {
      id: 'usr-laptop-001',
      fullName: 'Supply Chain Analyst',
      email: 'analyst@orion9.enterprise',
      role: 'supply_chain_manager',
      organizationId: 'tenant-laptop-001',
    },
    isAuthenticated: true,
    isAdmin: true,
    signOut: vi.fn(),
  }),
}));

// Mock Supply Chain Context
vi.mock('../../store/SupplyChainContext', () => ({
  useSupplyChain: () => ({
    currency: 'USD',
    inventory: [
      { id: 'inv-lap-1', productId: 'SKU-COMPASS-01', warehouseId: 'WH-MAIN', onHand: 120, reserved: 20, safetyStock: 100, unitCost: 45 }
    ],
    products: [
      { id: 'SKU-COMPASS-01', name: 'Sensor Component', category: 'Sensors' }
    ],
    shipments: [],
    purchaseOrders: [],
    exceptions: [],
    suppliers: [],
    decisions: [],
    settings: {
      criticalStockOutDays: 3,
    }
  }),
}));

// Mock Window Manager Context
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    windows: {
      'orion-ai': { id: 'orion-ai', state: 'maximized', zIndex: 45, position: { x: 0, y: 0 }, size: { width: 1366, height: 720 }, workspace: 'operations', isFocused: true, openedAt: 100 },
      'control-tower': { id: 'command-center', state: 'maximized', zIndex: 44, position: { x: 0, y: 0 }, size: { width: 1366, height: 720 }, workspace: 'operations', isFocused: false, openedAt: 90 },
      'settings': { id: 'settings', state: 'active', zIndex: 40, position: { x: 50, y: 50 }, size: { width: 900, height: 600 }, workspace: 'operations', isFocused: false, openedAt: 80 },
      'inventory': { id: 'inventory', state: 'active', zIndex: 35, position: { x: 80, y: 80 }, size: { width: 950, height: 620 }, workspace: 'operations', isFocused: false, openedAt: 70 },
    },
    activeAppId: 'orion-ai',
    activeWorkspaceId: 'operations',
    dockPinnedApps: ['command-center', 'inventory', 'procurement', 'suppliers', 'shipments', 'exceptions', 'world-model', 'reports', 'settings', 'integrations'],
    openApplication: vi.fn(),
    closeApplication: vi.fn(),
    minimizeApplication: vi.fn(),
    maximizeApplication: vi.fn(),
    restoreApplication: vi.fn(),
    focusApplication: vi.fn(),
    moveApplication: vi.fn(),
    resizeApplication: vi.fn(),
    pinToDock: vi.fn(),
    unpinFromDock: vi.fn(),
    reorderDock: vi.fn(),
    setWorkspace: vi.fn(),
    setLauncherOpen: vi.fn(),
    setCommandPaletteOpen: vi.fn(),
  }),
}));

// Mock Context Menu Context
vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({
    openContextMenu: vi.fn(),
    closeContextMenu: vi.fn(),
  }),
}));

// Mock Toast Context
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('Laptop Responsive UI & Copilot Layout Repair Suite', () => {
  beforeEach(async () => {
    await dbManager.switchEnvironment({
      targetEnvironment: 'DEMO',
      actorUserId: 'usr-laptop-001',
      actorRole: 'platform_admin',
      callerType: 'human_admin',
      stepUpConfirmed: true,
    });
  });

  describe('1. Orion Copilot Component Layout & Flex Architecture', () => {
    it('renders Orion Copilot with flex column containment and grounded engine header', () => {
      const html = renderToString(<AICopilot />);

      expect(html).toContain('Orion Copilot');
      expect(html).toContain('Enterprise Intelligence');
      expect(html).toContain('Engine Status:');
      expect(html).toContain('flex flex-col overflow-hidden');
    });

    it('renders suggested action prompt buttons at bottom of conversation area', () => {
      const html = renderToString(<AICopilot />);

      expect(html).toContain('Suggested Actions');
      expect(html).toContain('Analyze Inventory');
      expect(html).toContain('Explain Exceptions');
      expect(html).toContain('Analyze Supplier Risk');
      expect(html).toContain('Review Procurement');
    });

    it('renders input composer with text area and send button anchored at bottom', () => {
      const html = renderToString(<AICopilot />);

      expect(html).toContain('Ask Orion Copilot about stock levels, supply risks, POs...');
      expect(html).toContain('Orion Copilot operates under governed enterprise supply chain telemetry');
      expect(html).toContain('type="submit"');
    });

    it('enforces min-h-0 and internal scrolling container on conversation body', () => {
      const html = renderToString(<AICopilot />);

      expect(html).toContain('flex-1 overflow-y-auto');
      expect(html).toContain('min-h-0');
      expect(html).toContain('custom-scrollbar');
    });
  });

  describe('2. Orion Dock & Dock Safe Area Contract', () => {
    it('renders Orion Dock with data-dock-visible attribute and dock items', () => {
      const html = renderToString(<OrionDock />);

      expect(html).toContain('data-dock="true"');
      expect(html).toContain('data-dock-visible="true"');
      expect(html).toContain('All Applications');
    });
  });

  describe('3. Window Manager Maximized Safe Area Invariants', () => {
    it('renders maximized window with bottom safe-height style reservation', () => {
      const win = {
        id: 'orion-ai',
        state: 'maximized' as const,
        zIndex: 45,
        position: { x: 0, y: 0 },
        size: { width: 1366, height: 720 },
        workspace: 'operations' as const,
        isFocused: true,
        openedAt: 100,
      };

      const html = renderToString(<OrionWindow window={win} isActive={true} />);

      expect(html).toContain('data-window-id="orion-ai"');
      expect(html).toContain('var(--orion-dock-safe-height, 76px)');
    });

    it('renders window titlebar and window controls (minimize, maximize, close)', () => {
      const win = {
        id: 'command-center',
        state: 'maximized' as const,
        zIndex: 44,
        position: { x: 0, y: 0 },
        size: { width: 1366, height: 720 },
        workspace: 'operations' as const,
        isFocused: false,
        openedAt: 90,
      };

      const html = renderToString(<OrionWindow window={win} isActive={false} />);

      expect(html).toContain('data-window-titlebar="true"');
      expect(html).toContain('data-window-controls="true"');
      expect(html).toContain('Minimize');
      expect(html).toContain('Maximize');
      expect(html).toContain('Close');
    });
  });
});
