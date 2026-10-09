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

vi.mock('../../os/contextMenu/OrionContextMenuContext', () => ({
  useOrionContextMenu: () => ({ openContextMenu: vi.fn() }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

vi.mock('../../os/OrionComponentMap', () => ({
  getAppComponent: () => () => React.createElement('div', { id: 'mock-app-content' }, 'Mock App Content'),
}));

describe('ORION-9 macOS-Style Traffic-Light Window Controls Specification', () => {
  const mockWindow: AppWindow = {
    id: 'analytics',
    state: 'open',
    zIndex: 10,
    position: { x: 50, y: 50 },
    size: { width: 900, height: 600 },
    workspace: 'operations',
    isFocused: true,
    openedAt: Date.now(),
  };

  it('1. Minimize is first (Yellow #FEBC2E)', () => {
    const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));
    expect(html).toContain('aria-label="Minimize Analytics"');
    expect(html).toContain('background-color:#FEBC2E');
  });

  it('2. Maximize is second (Green #28C840)', () => {
    const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));
    expect(html).toContain('aria-label="Maximize Analytics"');
    expect(html).toContain('background-color:#28C840');
  });

  it('3. Close is third (Red #FF5F57)', () => {
    const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));
    expect(html).toContain('aria-label="Close Analytics"');
    expect(html).toContain('background-color:#FF5F57');
  });

  it('4. Controls are rendered top-left inside the window titlebar before app title', () => {
    const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));
    const titlebarIndex = html.indexOf('data-window-titlebar="true"');
    const controlsIndex = html.indexOf('data-window-controls="true"');
    const appTitleIndex = html.indexOf('Analytics');

    expect(titlebarIndex).toBeGreaterThan(-1);
    expect(controlsIndex).toBeGreaterThan(titlebarIndex);
    expect(appTitleIndex).toBeGreaterThan(controlsIndex);
  });

  it('5. Controls are circular with NO visible square/rounded rectangle containers', () => {
    const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));

    // Traffic light indicator elements are circular
    expect(html).toContain('rounded-full');

    // Controls must NOT have dark square button backgrounds or borders
    expect(html).not.toContain('bg-[#171b21]');
    expect(html).not.toContain('w-8 h-8 rounded-lg');
    expect(html).not.toContain('w-8 h-8 rounded-xl');
  });

  it('6. Strict left-to-right order: Yellow (Minimize) -> Green (Maximize) -> Red (Close)', () => {
    const html = renderToString(React.createElement(OrionWindow, { window: mockWindow, isActive: true }));
    const minIdx = html.indexOf('aria-label="Minimize Analytics"');
    const maxIdx = html.indexOf('aria-label="Maximize Analytics"');
    const closeIdx = html.indexOf('aria-label="Close Analytics"');

    expect(minIdx).toBeLessThan(maxIdx);
    expect(maxIdx).toBeLessThan(closeIdx);
  });
});
