import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderToString } from 'react-dom/server';

const mockWindows: Record<string, any> = {};
let mockActiveWorkspaceId = 'operations';

vi.mock('../../os/WindowManagerContext', () => ({
  useOptionalWindowManager: () => ({
    activeAppId: null,
    activeWorkspaceId: mockActiveWorkspaceId,
    windows: mockWindows,
    openApplication: vi.fn(),
    setCommandPaletteOpen: vi.fn(),
  }),
  WORKSPACES: {},
}));

vi.mock('../../store/SupplyChainContext', () => ({
  useOptionalSupplyChain: () => ({
    exceptions: [],
    inventory: [],
    shipments: [],
    purchaseOrders: [],
    settings: { reducedMotion: false },
  }),
}));

vi.mock('../../store/NotificationContext', () => ({
  useOptionalNotifications: () => ({
    unreadCount: 0,
    notifications: [],
  }),
}));

vi.mock('../../integration/useIntegrationFabric', () => ({
  useIntegrationFabric: () => ({
    connectors: [{ id: 'c1', status: 'CONNECTED' }],
    syncJobs: [],
  }),
}));

import { DynamicIsland } from '../../os/components/dynamicIsland/DynamicIsland';
import { useDynamicIslandState } from '../../os/components/dynamicIsland/useDynamicIslandState';
import { DynamicIslandState } from '../../os/components/dynamicIsland/DynamicIslandTypes';

describe('Orion-9 Astraeus-Inspired Dynamic Island 5-State Lifecycle', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    for (const k of Object.keys(mockWindows)) delete mockWindows[k];
    mockActiveWorkspaceId = 'operations';
    (global as any).localStorage = {
      getItem: () => null,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ISLAND-LIFE-01: Starts in idle surface state with zero 1000ms idle polling intervals', () => {
    const intervalSpy = vi.spyOn(globalThis, 'setInterval');
    let state!: DynamicIslandState;
    const Harness = () => {
      state = useDynamicIslandState();
      return <DynamicIsland />;
    };
    const html = renderToString(<Harness />);

    expect(state.surfaceState).toBe('idle');
    expect(state.mode).toBe('compact');
    expect(state.isCompactOverMaximized).toBe(false);
    expect(html).toContain('data-surface-state="idle"');
    expect(html).toContain('data-compact-over-maximized="false"');
    // Zero per-second polling intervals registered
    expect(intervalSpy).not.toHaveBeenCalled();
    intervalSpy.mockRestore();
  });

  it('ISLAND-LIFE-02: Condenses over maximized windows in active workspace (Astraeus pattern)', () => {
    mockWindows['command-center'] = {
      id: 'command-center',
      workspace: 'operations',
      state: 'maximized',
    };

    let state!: DynamicIslandState;
    const Harness = () => {
      state = useDynamicIslandState();
      return <DynamicIsland />;
    };
    const html = renderToString(<Harness />);

    expect(state.isCompactOverMaximized).toBe(true);
    expect(html).toContain('data-compact-over-maximized="true"');
    expect(html).toContain('h-[30px]');
  });

  it('ISLAND-LIFE-03: Exposes pushActivity / dismissActivity / expand / collapse / togglePin contracts', () => {
    let state!: DynamicIslandState;
    const Harness = () => {
      state = useDynamicIslandState();
      return <div />;
    };
    renderToString(<Harness />);

    expect(typeof state.pushActivity).toBe('function');
    expect(typeof state.dismissActivity).toBe('function');
    expect(typeof state.expand).toBe('function');
    expect(typeof state.collapse).toBe('function');
    expect(typeof state.togglePin).toBe('function');
    expect(Array.isArray(state.activities)).toBe(true);
  });
});
