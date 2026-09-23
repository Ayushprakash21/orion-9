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

  it('renders window controls on the right side of the title bar', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    // 1. Title bar is rendered
    expect(html).toContain('data-window-titlebar="true"');

    // 2. Window controls group is rendered with ml-auto (anchored to the right)
    expect(html).toContain('data-window-controls="true"');
    expect(html).toContain('ml-auto');

    // 3. App Identity appears BEFORE window controls in DOM order
    const appNameIndex = html.indexOf('Inventory');
    const controlsIndex = html.indexOf('data-window-controls="true"');
    expect(appNameIndex).toBeGreaterThan(-1);
    expect(controlsIndex).toBeGreaterThan(-1);
    expect(appNameIndex).toBeLessThan(controlsIndex);
  });

  it('preserves the exact order of controls: Close, Minimize, Maximize', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    const closeIdx = html.indexOf('aria-label="Close Inventory"');
    const minimizeIdx = html.indexOf('aria-label="Minimize Inventory"');
    const maximizeIdx = html.indexOf('aria-label="Maximize Inventory"');

    expect(closeIdx).toBeGreaterThan(-1);
    expect(minimizeIdx).toBeGreaterThan(-1);
    expect(maximizeIdx).toBeGreaterThan(-1);

    // Strict order: Close < Minimize < Maximize
    expect(closeIdx).toBeLessThan(minimizeIdx);
    expect(minimizeIdx).toBeLessThan(maximizeIdx);
  });

  it('preserves circular shape and visual styling classes for all three controls', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    // Close button has red theme
    expect(html).toContain('bg-red-500/80');
    expect(html).toContain('border-red-600/40');

    // Minimize button has amber theme
    expect(html).toContain('bg-amber-500/80');
    expect(html).toContain('border-amber-600/40');

    // Maximize button has emerald theme
    expect(html).toContain('bg-emerald-500/80');
    expect(html).toContain('border-emerald-600/40');

    // All controls use rounded-full circular styling
    expect(html).toContain('rounded-full');
  });
});
