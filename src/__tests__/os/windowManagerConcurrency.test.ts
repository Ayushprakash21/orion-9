import { describe, it, expect } from 'vitest';
import { AppWindow, WORKSPACES, WorkspaceId } from '../../os/WindowManagerContext';
import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';

/**
 * Normalization function matching WindowManagerContext
 */
const normalizeWindowZIndexes = (
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

describe('Window Manager Concurrency & Atomic State Transition Suite', () => {
  it('handles rapid sequential open of 20 windows maintaining strict z-index invariants', () => {
    let windows: Record<string, AppWindow> = {};
    const appIds = Object.keys(ORION_REGISTRY).slice(0, 20);

    expect(appIds.length).toBeGreaterThanOrEqual(20);

    for (let i = 0; i < appIds.length; i++) {
      const id = appIds[i];
      // Open application logic
      windows = normalizeWindowZIndexes({
        ...windows,
        [id]: {
          id,
          state: 'maximized',
          zIndex: 45,
          position: { x: 50 + i * 10, y: 50 + i * 10 },
          size: { width: 800, height: 600 },
          workspace: 'operations',
          isFocused: true,
          openedAt: Date.now() + i
        }
      }, id);

      // Verify that the currently opened window is focused and at zIndex 45
      expect(windows[id].zIndex).toBe(45);
      expect(windows[id].isFocused).toBe(true);

      // Verify all other windows are not focused and have zIndex <= 40
      Object.entries(windows).forEach(([wId, win]) => {
        if (wId !== id) {
          expect(win.isFocused).toBe(false);
          expect(win.zIndex).toBeLessThanOrEqual(40);
          expect(win.zIndex).toBeGreaterThanOrEqual(10);
        }
      });
    }

    expect(Object.keys(windows).length).toBe(20);
  });

  it('handles rapid interleaved open and close operations atomically', () => {
    let windows: Record<string, AppWindow> = {};
    const appIds = Object.keys(ORION_REGISTRY).slice(0, 10);
    let activeId: string | null = null;

    // Simulate interleaved operations
    for (let i = 0; i < appIds.length; i++) {
      const openId = appIds[i];
      // Open app
      windows = normalizeWindowZIndexes({
        ...windows,
        [openId]: {
          id: openId,
          state: 'maximized',
          zIndex: 45,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          workspace: 'operations',
          isFocused: true,
          openedAt: Date.now() + i
        }
      }, openId);
      activeId = openId;

      // Close previous app if even
      if (i > 1 && i % 2 === 0) {
        const closeId = appIds[i - 2];
        const next = { ...windows };
        delete next[closeId];

        const remaining = Object.values(next)
          .filter(w => w.workspace === 'operations' && w.state !== 'minimized')
          .sort((a, b) => b.zIndex - a.zIndex);

        activeId = remaining.length > 0 ? remaining[0].id : null;
        windows = activeId ? normalizeWindowZIndexes(next, activeId) : next;
      }
    }

    // Active window must be valid and present in windows
    expect(activeId).not.toBeNull();
    expect(windows[activeId!]).toBeDefined();
    expect(windows[activeId!].zIndex).toBe(45);
    expect(windows[activeId!].isFocused).toBe(true);
  });

  it('correctly shifts active focus to the next highest z-index window when active is closed', () => {
    let windows: Record<string, AppWindow> = {};
    const [appA, appB, appC] = ['inventory', 'shipments', 'command-center'];

    // Open A, then B, then C
    [appA, appB, appC].forEach((id, idx) => {
      windows = normalizeWindowZIndexes({
        ...windows,
        [id]: {
          id,
          state: 'active',
          zIndex: 45,
          position: { x: 0, y: 0 },
          size: { width: 800, height: 600 },
          workspace: 'operations',
          isFocused: true,
          openedAt: 1000 + idx
        }
      }, id);
    });

    expect(windows[appC].isFocused).toBe(true);
    expect(windows[appC].zIndex).toBe(45);
    expect(windows[appB].zIndex).toBe(11);
    expect(windows[appA].zIndex).toBe(10);

    // Close C (the active window)
    const next = { ...windows };
    delete next[appC];

    const remaining = Object.values(next)
      .filter(w => w.workspace === 'operations' && w.state !== 'minimized')
      .sort((a, b) => b.zIndex - a.zIndex);

    const nextActive = remaining[0].id;
    windows = normalizeWindowZIndexes(next, nextActive);

    // B should now be promoted to active (zIndex 45)
    expect(nextActive).toBe(appB);
    expect(windows[appB].isFocused).toBe(true);
    expect(windows[appB].zIndex).toBe(45);
    expect(windows[appA].zIndex).toBe(10);
  });
});
