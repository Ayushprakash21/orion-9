import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import fs from 'fs';
import path from 'path';
import { OrionWindow } from '../../os/components/OrionWindow';
import { OrionSettingsSplitLayout } from '../../components/settings/OrionSettingsSplitLayout';
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

// Mock OrionComponentMap
vi.mock('../../os/OrionComponentMap', () => ({
  getAppComponent: () => () => React.createElement('div', { id: 'mock-app-content' }, 'Mock App Content'),
}));

describe('Orion-9 Title Bar / Window Chrome Visual Repair', () => {
  const mockWindow: AppWindow = {
    id: 'profile',
    state: 'open',
    zIndex: 10,
    position: { x: 100, y: 100 },
    size: { width: 900, height: 650 },
    workspace: 'operations',
    isFocused: true,
    openedAt: Date.now(),
  };

  it('1. Window title bar is rendered with opaque background (#080a0d) and isolation', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    expect(html).toContain('data-window-titlebar="true"');
    expect(html).toContain('data-orion-window-titlebar="true"');
    expect(html).toContain('data-orion-app-topbar="true"');
    expect(html).toContain('background-color:#080a0d');
    expect(html).toContain('isolation:isolate');
    expect(html).toContain('border-b');
  });

  it('2. Title bar left identity displays application name, separator, and muted metadata category', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    // Shows "User Profile" (name) and "Platform" (category)
    expect(html).toContain('User Profile');
    expect(html).toContain('Platform');
    expect(html).toContain('·');
  });

  it('3. Window control buttons have opaque dark backgrounds (#171b21) housing colored indicators', () => {
    const element = React.createElement(OrionWindow, { window: mockWindow, isActive: true });
    const html = renderToString(element);

    expect(html).toContain('data-window-controls="true"');
    // All buttons have opaque dark surface class bg-[#171b21]
    expect(html).toContain('bg-[#171b21]');

    // Minimize button has amber indicator
    expect(html).toContain('bg-amber-500/80');
    expect(html).toContain('aria-label="Minimize User Profile"');

    // Maximize button has emerald indicator
    expect(html).toContain('bg-emerald-500/80');
    expect(html).toContain('aria-label="Maximize User Profile"');

    // Close button has red indicator
    expect(html).toContain('bg-red-500/80');
    expect(html).toContain('aria-label="Close User Profile"');
  });

  it('4. Settings Application Header in OrionSettingsSplitLayout is opaque (#0c0e11) with clean separation', () => {
    const element = React.createElement(OrionSettingsSplitLayout, {
      title: 'My Account',
      badge: 'AUTHENTICATED',
      subtitle: 'Operator Identity & Security Clearance',
      primary: React.createElement('div', null, 'Primary Content'),
    });
    const html = renderToString(element);

    expect(html).toContain('data-orion-settings-header="true"');
    expect(html).toContain('background-color:#0c0e11');
    expect(html).toContain('My Account');
    expect(html).toContain('AUTHENTICATED');
    expect(html).toContain('Operator Identity &amp; Security Clearance');
    expect(html).toContain('|');
  });

  it('5. Global index.css contains opaque chrome contract and button styling rules', () => {
    const cssPath = path.resolve(__dirname, '../../index.css');
    const cssSource = fs.readFileSync(cssPath, 'utf-8');

    expect(cssSource).toContain('[data-orion-window-titlebar="true"]');
    expect(cssSource).toContain('[data-orion-settings-header="true"]');
    expect(cssSource).toContain('[data-window-controls="true"] button');
    expect(cssSource).toContain('#080a0d !important');
    expect(cssSource).toContain('#0c0e11 !important');
    expect(cssSource).toContain('#171b21 !important');
  });

  it('6. Settings.tsx sidebar is opaque #101318 with border-r separation', () => {
    const settingsPath = path.resolve(__dirname, '../../components/Settings.tsx');
    const settingsSource = fs.readFileSync(settingsPath, 'utf-8');

    expect(settingsSource).toContain('bg-[#101318]');
    expect(settingsSource).not.toContain('bg-[#12151a] border-b md:border-b-0 md:border-r border-white/[0.08]');
  });
});
