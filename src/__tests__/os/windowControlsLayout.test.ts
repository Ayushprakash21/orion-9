import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { OrionWindow } from '../../os/components/OrionWindow';
import { AppWindow } from '../../os/WindowManagerContext';

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

// Mock OrionContextMenuContext
vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({
    openContextMenu: vi.fn(),
  }),
}));

// Mock ToastContext
vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

// Mock OrionComponentMap to return a dummy component
vi.mock('../../os/OrionComponentMap', () => ({
  getAppComponent: () => () => React.createElement('div', { id: 'mock-app-content' }, 'Mock App Content'),
}));

describe('OrionWindow Global Controls Layout', () => {
  const mockWindow: AppWindow = {
    id: 'inventory',
    state: 'open',
    zIndex: 10,
    position: { x: 100, y: 100 },
    size: { width: 800, height: 600 },
    workspace: 'operations',
    isFocused: true,
    openedAt: Date.now(),
  };

  it('renders window controls on the top-left of the title bar before application identity', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    // 1. Title bar is rendered
    expect(html).toContain('data-window-titlebar="true"');

    // 2. Window controls group is rendered
    expect(html).toContain('data-window-controls="true"');

    // 3. Window controls appear BEFORE App Identity in DOM order (Top-Left placement)
    const appNameIndex = html.indexOf('Inventory');
    const controlsIndex = html.indexOf('data-window-controls="true"');
    expect(appNameIndex).toBeGreaterThan(-1);
    expect(controlsIndex).toBeGreaterThan(-1);
    expect(controlsIndex).toBeLessThan(appNameIndex);
  });

  it('preserves the order of controls: Minimize (Yellow) -> Maximize (Green) -> Close (Red)', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    const minimizeIdx = html.indexOf('aria-label="Minimize Inventory"');
    const maximizeIdx = html.indexOf('aria-label="Maximize Inventory"');
    const closeIdx = html.indexOf('aria-label="Close Inventory"');

    expect(minimizeIdx).toBeGreaterThan(-1);
    expect(maximizeIdx).toBeGreaterThan(-1);
    expect(closeIdx).toBeGreaterThan(-1);

    // Order: Minimize (Yellow) < Maximize (Green) < Close (Red) (Left -> Right)
    expect(minimizeIdx).toBeLessThan(maximizeIdx);
    expect(maximizeIdx).toBeLessThan(closeIdx);
  });

  it('preserves circular shape and traffic-light colors without square wrappers', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    // Close button has traffic-light red (#FF5F57)
    expect(html).toContain('background-color:#FF5F57');

    // Minimize button has traffic-light yellow (#FEBC2E)
    expect(html).toContain('background-color:#FEBC2E');

    // Maximize button has traffic-light green (#28C840)
    expect(html).toContain('background-color:#28C840');

    // All controls use rounded-full circular styling
    expect(html).toContain('rounded-full');

    // No square container
    expect(html).not.toContain('bg-[#171b21]');
  });
});
