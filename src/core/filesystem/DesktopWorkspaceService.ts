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
    if (existing.length === 0) {
      // Seed default 11 applications mapped per workspace
      const defaultApps: Array<{ id: string; name: string; type: DesktopItemType; iconId: string; isDir: boolean }> = [
        { id: 'orion-computer', name: 'This Computer', type: 'system', iconId: 'computer', isDir: false },
        { id: 'file-manager', name: 'File Manager', type: 'system', iconId: 'folder', isDir: true },
        { id: 'notepad', name: 'Notepad', type: 'application', iconId: 'notepad', isDir: false },
        { id: 'inventory', name: 'Inventory', type: 'application', iconId: 'inventory', isDir: false },
        { id: 'documents-folder', name: 'Documents', type: 'folder', iconId: 'documents-folder', isDir: true },
        { id: 'downloads-folder', name: 'Downloads', type: 'folder', iconId: 'downloads-folder', isDir: true },
        { id: 'projects-folder', name: 'Projects', type: 'folder', iconId: 'projects-folder', isDir: true },
        { id: 'reports-folder', name: 'Reports', type: 'folder', iconId: 'reports-folder', isDir: true },
        { id: 'command-center', name: 'Supply Chain', type: 'application', iconId: 'command-center', isDir: false },
        { id: 'intelligence-center', name: 'AI', type: 'application', iconId: 'intelligence-center', isDir: false },
        { id: 'copilot', name: 'Copilot', type: 'application', iconId: 'copilot', isDir: false },
        { id: 'settings', name: 'Settings', type: 'application', iconId: 'settings', isDir: false },
        { id: 'recycle-bin', name: 'Recycle Bin', type: 'system', iconId: 'recycle-bin', isDir: false },
      ];

      const now = new Date().toISOString();
      const effectiveHeight = DEFAULT_GRID_CONFIG.cellHeight + DEFAULT_GRID_CONFIG.gapY;
      const effectiveWidth = DEFAULT_GRID_CONFIG.cellWidth + DEFAULT_GRID_CONFIG.gapX;
      const maxRows = Math.max(1, Math.floor((viewportHeight - DEFAULT_GRID_CONFIG.paddingY - DEFAULT_GRID_CONFIG.bottomPadding) / effectiveHeight));

      for (let i = 0; i < defaultApps.length; i++) {
        const item = defaultApps[i];
        const col = Math.floor(i / maxRows);
        const row = i % maxRows;

        const x = DEFAULT_GRID_CONFIG.paddingX + col * effectiveWidth;
        const y = DEFAULT_GRID_CONFIG.paddingY + row * effectiveHeight;

        const shortcut: DesktopShortcut = {
          id: `shortcut_${workspaceId}_${item.id}_${activeTenant}`,
          type: item.type,
          targetType: item.type,
          targetId: item.id,
          name: item.name,
          iconId: item.iconId,
          isDirectory: item.isDir,
          parentId: null,
          path: `/Desktop/${item.name}`,
          mimeType: null,
          size: 0,
          x,
          y,
          workspaceId,
          ownerId: 'system',
          tenantId: activeTenant,
          organizationId: activeTenant,
          environment: activeEnv,
          createdAt: now,
          updatedAt: now,
        };

        await scmPersistenceService.saveRecord('desktop_items', shortcut.id, shortcut);
      }
    }

    // Auto-sync files and folders present in the system "desktop" folder
    try {
      const { orionFileSystemService } = await import('./OrionFileSystemService');
      const desktopFolder = await orionFileSystemService.getSystemFolder('desktop', activeTenant, activeEnv);
      if (desktopFolder) {
        const [desktopFiles, desktopSubFolders] = await Promise.all([
          orionFileSystemService.listFiles(desktopFolder.id, activeTenant, activeEnv),
          orionFileSystemService.listFolders(desktopFolder.id, activeTenant, activeEnv),
        ]);

        const updatedList = await this.listShortcuts(workspaceId, activeTenant, activeEnv);
        const existingTargetIds = new Set(updatedList.map(s => s.targetId));

        for (const file of desktopFiles) {
          if (!existingTargetIds.has(file.id)) {
            await this.addShortcut({
              targetType: 'file',
              targetId: file.id,
              name: `${file.name}.${file.extension}`,
              iconId: 'notepad',
              isDirectory: false,
              path: `/Desktop/${file.name}.${file.extension}`,
              mimeType: file.mimeType,
              size: file.size,
              workspaceId,
              tenantId: activeTenant,
              environment: activeEnv,
              viewportHeight,
            });
          }
        }

        for (const subFolder of desktopSubFolders) {
          if (!existingTargetIds.has(subFolder.id)) {
            await this.addShortcut({
              targetType: 'folder',
              targetId: subFolder.id,
              name: subFolder.name,
              iconId: 'folder',
              isDirectory: true,
              path: `/Desktop/${subFolder.name}`,
              mimeType: null,
              size: 0,
              workspaceId,
              tenantId: activeTenant,
              environment: activeEnv,
              viewportHeight,
            });
          }
        }
      }
    } catch (err) {
      console.warn('Desktop system folder auto-sync deferred:', err);
    }

    this.initializedWorkspaces.add(initKey);
    return await this.listShortcuts(workspaceId, activeTenant, activeEnv);
  }

  /**
   * Normalizes legacy or raw Firestore records to conform strictly to DesktopShortcut contract.
   */
  public normalizeShortcut(raw: any): DesktopShortcut {
    const isDir = raw.isDirectory !== undefined ? Boolean(raw.isDirectory) : raw.targetType === 'folder';
    let iconId = raw.iconId;
    if (!iconId) {
      if (typeof raw.icon === 'string') {
        iconId = raw.icon;
      } else if (raw.targetType === 'folder' || isDir) {
        iconId = 'folder';
      } else if (raw.targetType === 'file') {
        iconId = 'notepad';
      } else if (raw.targetType === 'application') {
        iconId = raw.targetId;
      } else {
        iconId = raw.targetId === 'orion-computer' ? 'computer' : (raw.targetId === 'recycle-bin' ? 'recycle-bin' : 'system');
      }
    }

    const targetType: DesktopItemType = raw.targetType || (isDir ? 'folder' : 'file');
    const name = raw.name || 'Untitled';
    const tenantId = raw.tenantId || 'tenant_default';

    return {
      id: raw.id || `shortcut_${raw.workspaceId || 'operations'}_${raw.targetId || 'item'}_${tenantId}`,
      name,
      type: raw.type || targetType,
      targetType,
      targetId: raw.targetId || raw.id,
      isDirectory: isDir,
      parentId: raw.parentId ?? null,
      path: raw.path || `/Desktop/${name}`,
      iconId,
      mimeType: raw.mimeType ?? (targetType === 'file' ? 'text/plain' : null),
      size: typeof raw.size === 'number' ? raw.size : 0,
      x: typeof raw.x === 'number' ? raw.x : DEFAULT_GRID_CONFIG.paddingX,
      y: typeof raw.y === 'number' ? raw.y : DEFAULT_GRID_CONFIG.paddingY,
      workspaceId: raw.workspaceId || 'operations',
      ownerId: raw.ownerId || 'user_current',
      tenantId,
      organizationId: raw.organizationId || tenantId,
      environment: raw.environment === 'LIVE' ? 'LIVE' : 'DEMO',
      createdAt: raw.createdAt || new Date().toISOString(),
      updatedAt: raw.updatedAt || new Date().toISOString(),
      metadata: raw.metadata || {},
    };
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
    return all
      .filter(s => s.tenantId === activeTenant && s.environment === activeEnv && s.workspaceId === workspaceId)
      .map(s => this.normalizeShortcut(s));
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

    const normalized = this.normalizeShortcut(existing);
    const snapped = this.snapToGrid(x, y, DEFAULT_GRID_CONFIG, viewportWidth, viewportHeight);
    const updated: DesktopShortcut = {
      ...normalized,
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
    iconId?: string;
    icon?: string;
    workspaceId: WorkspaceId;
    tenantId?: string;
    organizationId?: string;
    environment?: 'DEMO' | 'LIVE';
    viewportHeight?: number;
    isDirectory?: boolean;
    parentId?: string | null;
    path?: string;
    mimeType?: string | null;
    size?: number;
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

    const isDirectory = params.isDirectory !== undefined ? Boolean(params.isDirectory) : (params.targetType === 'folder');
    
    // Resolve stable iconId
    let iconId = params.iconId || params.icon;
    if (!iconId) {
      if (params.targetType === 'folder' || isDirectory) {
        iconId = 'folder';
      } else if (params.targetType === 'file') {
        iconId = 'notepad';
      } else if (params.targetType === 'application') {
        iconId = params.targetId;
      } else {
        iconId = params.targetId === 'orion-computer' ? 'computer' : (params.targetId === 'recycle-bin' ? 'recycle-bin' : 'system');
      }
    }

    const parentId = params.parentId ?? null;
    const path = params.path ?? `/Desktop/${params.name}`;
    const mimeType = params.mimeType !== undefined ? params.mimeType : (params.targetType === 'file' ? 'text/plain' : null);
    const size = typeof params.size === 'number' ? params.size : 0;
    const organizationId = params.organizationId || activeTenant;
    const now = new Date().toISOString();

    const shortcut: DesktopShortcut = {
      id: `shortcut_${params.workspaceId}_${params.targetType}_${params.targetId}_${activeTenant}`,
      type: params.targetType,
      targetType: params.targetType,
      targetId: params.targetId,
      name: params.name,
      iconId,
      isDirectory,
      parentId,
      path,
      mimeType,
      size,
      x,
      y,
      workspaceId: params.workspaceId,
      ownerId: 'user_current',
      tenantId: activeTenant,
      organizationId,
      environment: activeEnv,
      createdAt: now,
      updatedAt: now,
      metadata: {},
    };

    await scmPersistenceService.saveRecord('desktop_items', shortcut.id, shortcut);
    return shortcut;
  }

  /**
   * Rename a shortcut on Desktop.
   */
  public async renameShortcut(
    shortcutId: string,
    newName: string,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<DesktopShortcut> {
    const { activeTenant } = this.getContext(tenantId, environment);
    const existing = await scmPersistenceService.getRecord<DesktopShortcut>('desktop_items', activeTenant, shortcutId);
    if (!existing) {
      throw new Error(`Shortcut ${shortcutId} not found`);
    }

    const normalized = this.normalizeShortcut(existing);
    const updated: DesktopShortcut = {
      ...normalized,
      name: newName,
      path: `/Desktop/${newName}`,
      updatedAt: new Date().toISOString(),
    };
    await scmPersistenceService.saveRecord('desktop_items', shortcutId, updated);
    return updated;
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

  // ---------------------------------------------------------------------------
  // DESKTOP SPATIAL WIDGET MANAGEMENT
  // ---------------------------------------------------------------------------

  /**
   * List all active widgets for a workspace.
   */
  public async listWidgets(
    workspaceId: WorkspaceId = 'operations',
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<import('./types').DesktopWidgetRecord[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const records = await scmPersistenceService.listRecords<import('./types').DesktopWidgetRecord>('desktop_widgets', activeTenant);
    return records.filter((r) => r && r.workspaceId === workspaceId && r.environment === activeEnv && r.visible !== false);
  }

  /**
   * Save or update a widget instance in Firestore / persistence.
   */
  public async saveWidget(
    widget: import('./types').DesktopWidgetRecord,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<import('./types').DesktopWidgetRecord> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const record: import('./types').DesktopWidgetRecord = {
      ...widget,
      tenantId: activeTenant,
      environment: activeEnv,
      updatedAt: new Date().toISOString(),
    };
    await scmPersistenceService.saveRecord('desktop_widgets', widget.id, record);
    return record;
  }

  /**
   * Delete a widget instance.
   */
  public async removeWidget(
    widgetId: string,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<boolean> {
    const { activeTenant } = this.getContext(tenantId, environment);
    return await scmPersistenceService.deleteRecord('desktop_widgets', activeTenant, widgetId);
  }

  /**
   * Ensure baseline default desktop widgets exist for workspace.
   */
  public async ensureDefaultWidgets(
    workspaceId: WorkspaceId = 'operations',
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<import('./types').DesktopWidgetRecord[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const existing = await this.listWidgets(workspaceId, activeTenant, activeEnv);
    if (existing.length > 0) return existing;

    const now = new Date().toISOString();
    const defaults: import('./types').DesktopWidgetRecord[] = [
      {
        id: `widget_${workspaceId}_clock_${activeTenant}`,
        widgetType: 'clock',
        title: 'System Clock',
        size: 'MEDIUM',
        x: 1200,
        y: 52,
        width: 340,
        height: 150,
        zIndex: 10,
        visible: true,
        workspaceId,
        ownerId: 'user_current',
        tenantId: activeTenant,
        organizationId: activeTenant,
        environment: activeEnv,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `widget_${workspaceId}_control_tower_${activeTenant}`,
        widgetType: 'control_tower',
        title: 'Control Tower Radar',
        size: 'LARGE',
        x: 1200,
        y: 218,
        width: 440,
        height: 250,
        zIndex: 10,
        visible: true,
        workspaceId,
        ownerId: 'user_current',
        tenantId: activeTenant,
        organizationId: activeTenant,
        environment: activeEnv,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: `widget_${workspaceId}_supply_chain_pulse_${activeTenant}`,
        widgetType: 'supply_chain_pulse',
        title: 'Supply Chain Pulse',
        size: 'MEDIUM',
        x: 1200,
        y: 484,
        width: 440,
        height: 180,
        zIndex: 10,
        visible: true,
        workspaceId,
        ownerId: 'user_current',
        tenantId: activeTenant,
        organizationId: activeTenant,
        environment: activeEnv,
        createdAt: now,
        updatedAt: now,
      },
    ];

    for (const w of defaults) {
      await scmPersistenceService.saveRecord('desktop_widgets', w.id, w);
    }
    return defaults;
  }
}

export const desktopWorkspaceService = DesktopWorkspaceService.getInstance();
