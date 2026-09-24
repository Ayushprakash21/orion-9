/**
 * ORION-9 DESKTOP WORKSPACE TEST SUITE
 * Validates grid snapping mathematics, workspace shortcut seeding,
 * position updating, and auto-arrange layouts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { desktopWorkspaceService, DEFAULT_GRID_CONFIG } from '../../core/filesystem/DesktopWorkspaceService';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('DesktopWorkspaceService Tests', () => {
  const testTenant = 'tenant_desktop_test';

  beforeEach(() => {
    scmPersistenceService.clear();
  });

  it('snaps arbitrary coordinates precisely to the desktop grid', () => {
    // Top-left origin near (16, 52)
    const snap1 = desktopWorkspaceService.snapToGrid(20, 50, DEFAULT_GRID_CONFIG, 1920, 1080);
    expect(snap1.x).toBe(16);
    expect(snap1.y).toBe(52);

    // Second column (16 + 108 = 124)
    const snap2 = desktopWorkspaceService.snapToGrid(120, 55, DEFAULT_GRID_CONFIG, 1920, 1080);
    expect(snap2.x).toBe(124);
    expect(snap2.y).toBe(52);

    // Bounds clamping test
    const outOfBounds = desktopWorkspaceService.snapToGrid(5000, 5000, DEFAULT_GRID_CONFIG, 1920, 1080);
    expect(outOfBounds.x).toBeLessThanOrEqual(1920 - DEFAULT_GRID_CONFIG.cellWidth - DEFAULT_GRID_CONFIG.paddingX);
    expect(outOfBounds.y).toBeLessThanOrEqual(1080 - DEFAULT_GRID_CONFIG.cellHeight - DEFAULT_GRID_CONFIG.bottomPadding);
  });

  it('seeds default shortcuts for a workspace', async () => {
    const shortcuts = await desktopWorkspaceService.ensureWorkspaceShortcuts('operations', testTenant, 'LIVE');
    
    expect(shortcuts.length).toBeGreaterThanOrEqual(6);
    const targetIds = shortcuts.map(s => s.targetId);
    expect(targetIds).toContain('orion-computer');
    expect(targetIds).toContain('file-manager');
    expect(targetIds).toContain('notepad');
    expect(targetIds).toContain('command-center');
    expect(targetIds).toContain('inventory');
  });

  it('updates shortcut positions and saves them', async () => {
    const shortcuts = await desktopWorkspaceService.ensureWorkspaceShortcuts('operations', testTenant, 'LIVE');
    const first = shortcuts[0];

    const updated = await desktopWorkspaceService.updateShortcutPosition(
      first.id,
      250,
      180,
      1920,
      1080,
      testTenant,
      'LIVE'
    );

    expect(updated.x).toBeGreaterThan(0);
    expect(updated.y).toBeGreaterThan(0);

    const listed = await desktopWorkspaceService.listShortcuts('operations', testTenant, 'LIVE');
    const found = listed.find(s => s.id === first.id);
    expect(found?.x).toBe(updated.x);
    expect(found?.y).toBe(updated.y);
  });

  it('auto-arranges desktop shortcuts by name and type', async () => {
    await desktopWorkspaceService.ensureWorkspaceShortcuts('operations', testTenant, 'LIVE');
    
    // Auto arrange by name
    const sortedByName = await desktopWorkspaceService.autoArrange('operations', 'name', 900, testTenant, 'LIVE');
    expect(sortedByName.length).toBeGreaterThanOrEqual(6);
    for (let i = 0; i < sortedByName.length - 1; i++) {
      expect(sortedByName[i].name.localeCompare(sortedByName[i + 1].name)).toBeLessThanOrEqual(0);
    }
  });
});
