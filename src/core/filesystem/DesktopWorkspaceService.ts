/**
 * ORION-9 DESKTOP WORKSPACE SERVICE
 * Manages desktop shortcut placement, drag-and-drop coordinate persistence,
 * grid snapping, collision prevention, multi-workspace layouts, and auto-arrange algorithms.
 */

import { DesktopShortcut, DesktopItemType } from './types';
import { WorkspaceId } from '../../os/WindowManagerContext';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { DatabaseConnectionManager } from '../database/DatabaseConnectionManager';

export interface GridConfig {
  cellWidth: number;   // 96px
  cellHeight: number;  // 96px
  paddingX: number;    // 16px
  paddingY: number;    // 48px top bar offset
  gapX: number;        // 12px
  gapY: number;        // 12px
  bottomPadding: number; // 80px dock offset
}

export const DEFAULT_GRID_CONFIG: GridConfig = {
  cellWidth: 96,
  cellHeight: 96,
  paddingX: 16,
  paddingY: 52,
  gapX: 12,
  gapY: 12,
  bottomPadding: 84,
};

export class DesktopWorkspaceService {
  private static instance: DesktopWorkspaceService;
  private initializedWorkspaces: Set<string> = new Set();

  private constructor() {}

  public static getInstance(): DesktopWorkspaceService {
    if (!DesktopWorkspaceService.instance) {
      DesktopWorkspaceService.instance = new DesktopWorkspaceService();
    }
    return DesktopWorkspaceService.instance;
  }

  public clear(): void {
    this.initializedWorkspaces.clear();
  }

  private getContext(tenantId?: string, environment?: 'DEMO' | 'LIVE') {
    const activeEnv = environment || DatabaseConnectionManager.getInstance().getEnvironment();
    const activeTenant = tenantId || 'tenant_default';
    return { activeTenant, activeEnv };
  }

  /**
   * Snap arbitrary (x, y) coordinates to the desktop grid.
   */
  public snapToGrid(
    x: number,
    y: number,
    grid: GridConfig = DEFAULT_GRID_CONFIG,
    viewportWidth: number = 1920,
    viewportHeight: number = 1080
  ): { x: number; y: number } {
    const effectiveWidth = grid.cellWidth + grid.gapX;
    const effectiveHeight = grid.cellHeight + grid.gapY;

    // Relative to padding
    const relX = Math.max(0, x - grid.paddingX);
    const relY = Math.max(0, y - grid.paddingY);

    const col = Math.round(relX / effectiveWidth);
    const row = Math.round(relY / effectiveHeight);

    let snappedX = grid.paddingX + col * effectiveWidth;
    let snappedY = grid.paddingY + row * effectiveHeight;

    // Bounds clamp
    const maxX = Math.max(grid.paddingX, viewportWidth - grid.cellWidth - grid.paddingX);
    const maxY = Math.max(grid.paddingY, viewportHeight - grid.cellHeight - grid.bottomPadding);

    snappedX = Math.min(Math.max(grid.paddingX, snappedX), maxX);
    snappedY = Math.min(Math.max(grid.paddingY, snappedY), maxY);

    return { x: snappedX, y: snappedY };
  }

  /**
   * Ensure default desktop shortcuts exist for a workspace.
   */
  public async ensureWorkspaceShortcuts(
    workspaceId: WorkspaceId,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE',
    viewportHeight: number = 900
  ): Promise<DesktopShortcut[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const initKey = `${activeTenant}:${activeEnv}:${workspaceId}`;

    const existing = await this.listShortcuts(workspaceId, activeTenant, activeEnv);
    if (existing.length > 0) {
      return existing;
    }

    // Default applications mapped per workspace
    const defaultApps: Record<WorkspaceId, Array<{ id: string; name: string; type: DesktopItemType }>> = {
      operations: [
        { id: 'orion-computer', name: 'This Computer', type: 'system' },
        { id: 'file-manager', name: 'File Explorer', type: 'system' },
        { id: 'notepad', name: 'Notepad', type: 'application' },
        { id: 'command-center', name: 'Command Center', type: 'application' },
        { id: 'inventory', name: 'Inventory', type: 'application' },
        { id: 'procurement', name: 'Procurement', type: 'application' },
        { id: 'shipments', name: 'Shipments', type: 'application' },
        { id: 'suppliers', name: 'Suppliers', type: 'application' },
        { id: 'recycle-bin', name: 'Recycle Bin', type: 'system' },
      ],
      intelligence: [
        { id: 'orion-computer', name: 'This Computer', type: 'system' },
        { id: 'file-manager', name: 'File Explorer', type: 'system' },
        { id: 'notepad', name: 'Notepad', type: 'application' },
        { id: 'intelligence-center', name: 'Intelligence Center', type: 'application' },
        { id: 'predictions', name: 'Predictions', type: 'application' },
        { id: 'demand-forecasting', name: 'Demand Forecasting', type: 'application' },
        { id: 'scenarios', name: 'Scenarios', type: 'application' },
        { id: 'digital-twin', name: 'Digital Twin', type: 'application' },
        { id: 'recycle-bin', name: 'Recycle Bin', type: 'system' },
      ],
      control: [
        { id: 'orion-computer', name: 'This Computer', type: 'system' },
        { id: 'file-manager', name: 'File Explorer', type: 'system' },
        { id: 'notepad', name: 'Notepad', type: 'application' },
        { id: 'control-center', name: 'Control Policy', type: 'application' },
        { id: 'exceptions', name: 'Exceptions', type: 'application' },
        { id: 'decision-center', name: 'Decisions', type: 'application' },
        { id: 'observability', name: 'Observability', type: 'application' },
        { id: 'settings', name: 'System Settings', type: 'application' },
        { id: 'recycle-bin', name: 'Recycle Bin', type: 'system' },
      ],
    };

    const targetList = defaultApps[workspaceId] || defaultApps.operations;
    const now = new Date().toISOString();
    const createdShortcuts: DesktopShortcut[] = [];

    const effectiveHeight = DEFAULT_GRID_CONFIG.cellHeight + DEFAULT_GRID_CONFIG.gapY;
    const effectiveWidth = DEFAULT_GRID_CONFIG.cellWidth + DEFAULT_GRID_CONFIG.gapX;
    const maxRows = Math.max(1, Math.floor((viewportHeight - DEFAULT_GRID_CONFIG.paddingY - DEFAULT_GRID_CONFIG.bottomPadding) / effectiveHeight));

    for (let i = 0; i < targetList.length; i++) {
      const item = targetList[i];
      const col = Math.floor(i / maxRows);
      const row = i % maxRows;

      const x = DEFAULT_GRID_CONFIG.paddingX + col * effectiveWidth;
      const y = DEFAULT_GRID_CONFIG.paddingY + row * effectiveHeight;

      const shortcut: DesktopShortcut = {
        id: `shortcut_${workspaceId}_${item.id}_${activeTenant}`,
        targetType: item.type,
        targetId: item.id,
        name: item.name,
        x,
        y,
        workspaceId,
        ownerId: 'system',
        tenantId: activeTenant,
        environment: activeEnv,
        createdAt: now,
        updatedAt: now,
      };

      await scmPersistenceService.saveRecord('desktop_items', shortcut.id, shortcut);
      createdShortcuts.push(shortcut);
    }

    this.initializedWorkspaces.add(initKey);
    return createdShortcuts;
  }

  /**
   * List all shortcuts for a specific workspace.
   */
  public async listShortcuts(
    workspaceId: WorkspaceId,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<DesktopShortcut[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const all = await scmPersistenceService.listRecords<DesktopShortcut>('desktop_items', activeTenant);
    return all.filter(
      s => s.tenantId === activeTenant && s.environment === activeEnv && s.workspaceId === workspaceId
    );
  }

  /**
   * Update shortcut position with grid snapping.
   */
  public async updateShortcutPosition(
    shortcutId: string,
    x: number,
    y: number,
    viewportWidth: number = 1920,
    viewportHeight: number = 1080,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<DesktopShortcut> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const existing = await scmPersistenceService.getRecord<DesktopShortcut>('desktop_items', activeTenant, shortcutId);
    if (!existing) {
      throw new Error(`Shortcut ${shortcutId} not found`);
    }

    const snapped = this.snapToGrid(x, y, DEFAULT_GRID_CONFIG, viewportWidth, viewportHeight);
    const updated: DesktopShortcut = {
      ...existing,
      x: snapped.x,
      y: snapped.y,
      updatedAt: new Date().toISOString(),
    };

    await scmPersistenceService.saveRecord('desktop_items', shortcutId, updated);
    return updated;
  }

  /**
   * Auto-arrange desktop shortcuts by Name, Type, or Date.
   */
  public async autoArrange(
    workspaceId: WorkspaceId,
    sortBy: 'name' | 'type' | 'date',
    viewportHeight: number = 900,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<DesktopShortcut[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const shortcuts = await this.listShortcuts(workspaceId, activeTenant, activeEnv);

    // Sort items
    shortcuts.sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'type') return a.targetType.localeCompare(b.targetType) || a.name.localeCompare(b.name);
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    const effectiveHeight = DEFAULT_GRID_CONFIG.cellHeight + DEFAULT_GRID_CONFIG.gapY;
    const effectiveWidth = DEFAULT_GRID_CONFIG.cellWidth + DEFAULT_GRID_CONFIG.gapX;
    const maxRows = Math.max(1, Math.floor((viewportHeight - DEFAULT_GRID_CONFIG.paddingY - DEFAULT_GRID_CONFIG.bottomPadding) / effectiveHeight));

    const updatedShortcuts: DesktopShortcut[] = [];
    for (let i = 0; i < shortcuts.length; i++) {
      const s = shortcuts[i];
      const col = Math.floor(i / maxRows);
      const row = i % maxRows;

      const x = DEFAULT_GRID_CONFIG.paddingX + col * effectiveWidth;
      const y = DEFAULT_GRID_CONFIG.paddingY + row * effectiveHeight;

      const updated: DesktopShortcut = {
        ...s,
        x,
        y,
        updatedAt: new Date().toISOString(),
      };

      await scmPersistenceService.saveRecord('desktop_items', updated.id, updated);
      updatedShortcuts.push(updated);
    }

    return updatedShortcuts;
  }

  /**
   * Add a file or folder shortcut to Desktop.
   */
  public async addShortcut(params: {
    targetType: DesktopItemType;
    targetId: string;
    name: string;
    icon?: string;
    workspaceId: WorkspaceId;
    tenantId?: string;
    environment?: 'DEMO' | 'LIVE';
    viewportHeight?: number;
  }): Promise<DesktopShortcut> {
    const { activeTenant, activeEnv } = this.getContext(params.tenantId, params.environment);
    const existing = await this.listShortcuts(params.workspaceId, activeTenant, activeEnv);
    const count = existing.length;

    const effectiveHeight = DEFAULT_GRID_CONFIG.cellHeight + DEFAULT_GRID_CONFIG.gapY;
    const effectiveWidth = DEFAULT_GRID_CONFIG.cellWidth + DEFAULT_GRID_CONFIG.gapX;
    const maxRows = Math.max(1, Math.floor(((params.viewportHeight || 900) - DEFAULT_GRID_CONFIG.paddingY - DEFAULT_GRID_CONFIG.bottomPadding) / effectiveHeight));

    const col = Math.floor(count / maxRows);
    const row = count % maxRows;
    const x = DEFAULT_GRID_CONFIG.paddingX + col * effectiveWidth;
    const y = DEFAULT_GRID_CONFIG.paddingY + row * effectiveHeight;

    const now = new Date().toISOString();
    const shortcut: DesktopShortcut = {
      id: `shortcut_${params.workspaceId}_${params.targetType}_${params.targetId}_${activeTenant}`,
      targetType: params.targetType,
      targetId: params.targetId,
      name: params.name,
      icon: params.icon,
      x,
      y,
      workspaceId: params.workspaceId,
      ownerId: 'user_current',
      tenantId: activeTenant,
      environment: activeEnv,
      createdAt: now,
      updatedAt: now,
    };

    await scmPersistenceService.saveRecord('desktop_items', shortcut.id, shortcut);
    return shortcut;
  }

  /**
   * Remove a shortcut from Desktop by shortcut ID.
   */
  public async removeShortcut(
    shortcutId: string,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<boolean> {
    const { activeTenant } = this.getContext(tenantId, environment);
    return await scmPersistenceService.deleteRecord('desktop_items', activeTenant, shortcutId);
  }
}

export const desktopWorkspaceService = DesktopWorkspaceService.getInstance();
