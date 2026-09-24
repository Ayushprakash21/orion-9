/**
 * ORION-9 VIRTUAL FILE SYSTEM SERVICE
 * Authoritative file system engine providing multi-tenant file & folder persistence,
 * DEMO/LIVE environment isolation, soft deletion to Recycle Bin, restore, search,
 * metadata management, and event-driven reactive synchronization.
 */

import {
  OrionFile,
  OrionFolder,
  SystemFolderKey,
  VirtualStorageInfo,
  FileSystemEvent,
} from './types';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { DatabaseConnectionManager } from '../database/DatabaseConnectionManager';

export const SYSTEM_FOLDERS: Array<{
  key: SystemFolderKey;
  name: string;
  icon: string;
}> = [
  { key: 'computer', name: 'This Computer', icon: 'HardDrive' },
  { key: 'desktop', name: 'Desktop', icon: 'Monitor' },
  { key: 'documents', name: 'Documents', icon: 'FileText' },
  { key: 'downloads', name: 'Downloads', icon: 'Download' },
  { key: 'projects', name: 'Projects', icon: 'FolderKanban' },
  { key: 'reports', name: 'Reports', icon: 'BarChart3' },
  { key: 'supply_chain', name: 'Supply Chain Data', icon: 'Truck' },
  { key: 'ai', name: 'AI Models & Prompts', icon: 'Brain' },
  { key: 'shared', name: 'Shared Files', icon: 'Share2' },
  { key: 'recycle_bin', name: 'Recycle Bin', icon: 'Trash2' },
];

export class OrionFileSystemService {
  private static instance: OrionFileSystemService;
  private initializedTenants: Set<string> = new Set();
  private eventListeners: Array<(event: FileSystemEvent) => void> = [];

  private constructor() {}

  public static getInstance(): OrionFileSystemService {
    if (!OrionFileSystemService.instance) {
      OrionFileSystemService.instance = new OrionFileSystemService();
    }
    return OrionFileSystemService.instance;
  }

  public clear(): void {
    this.initializedTenants.clear();
  }

  /**
   * Helper to resolve active tenant and environment.
   */
  private getContext(tenantId?: string, environment?: 'DEMO' | 'LIVE') {
    const activeEnv = environment || DatabaseConnectionManager.getInstance().getEnvironment();
    const activeTenant = tenantId || 'tenant_default';
    return { activeTenant, activeEnv };
  }

  /**
   * Initialize system folders and synthetic files for DEMO mode if required.
   */
  public async ensureSystemStructure(tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<void> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const key = `${activeTenant}:${activeEnv}`;
    if (this.initializedTenants.has(key)) return;

    // Check if folders already exist for this tenant
    const existingFolders = await this.listFolders(null, activeTenant, activeEnv);
    if (existingFolders.length === 0) {
      const now = new Date().toISOString();
      
      // Create system root folders
      for (const sys of SYSTEM_FOLDERS) {
        const folder: OrionFolder = {
          id: `folder_sys_${sys.key}_${activeTenant}`,
          name: sys.name,
          parentId: null,
          isSystem: true,
          systemKey: sys.key,
          icon: sys.icon,
          ownerId: 'system',
          tenantId: activeTenant,
          environment: activeEnv,
          createdAt: now,
          updatedAt: now,
          isDeleted: false,
        };
        await scmPersistenceService.saveRecord('folders', folder.id, folder);
      }

      // In DEMO environment, seed high-fidelity synthetic business files
      if (activeEnv === 'DEMO') {
        await this.seedDemoFiles(activeTenant);
      }
    }

    this.initializedTenants.add(key);
  }

  /**
   * Seed authentic DEMO supply chain files into system folders.
   */
  private async seedDemoFiles(tenantId: string): Promise<void> {
    const now = new Date().toISOString();
    const demoFiles: Array<{
      name: string;
      extension: string;
      mimeType: string;
      systemFolder: SystemFolderKey;
      content: string;
      tags: string[];
    }> = [
      {
        name: 'Supplier Performance Review 2026',
        extension: 'md',
        mimeType: 'text/markdown',
        systemFolder: 'reports',
        tags: ['Procurement', 'Audit', 'SLA'],
        content: `# Supplier Performance Review — Q3 2026
**Confidential — Orion-9 Autonomous Control Tower**

## Executive Summary
Tier-1 supplier on-time delivery across North America and APAC reached 98.4%, exceeding quarterly targets by 2.1%. Lead times for raw lithium-ion cells improved from 18 to 14 days following dynamic rerouting via the Pacific corridor.

## Top Performing Vendors
1. **Apex Dynamics** — 99.8% On-Time In-Full (OTIF), Zero Defect Rejections.
2. **Kyoto Precision** — 99.2% OTIF, Mean Response Time 42 mins.
3. **Nordic Logistics AB** — Cold-chain integrity maintained at 99.99%.

## AI Recommendations
- Auto-approve volume allocation expansion for Apex Dynamics by +15%.
- Initiate proactive risk buffer for maritime lane HKG-LAX due to seasonal monsoons.
`,
      },
      {
        name: 'Inventory Safety Buffer Strategy',
        extension: 'txt',
        mimeType: 'text/plain',
        systemFolder: 'supply_chain',
        tags: ['Inventory', 'SafetyStock', 'MEIO'],
        content: `ORION-9 MULTI-ECHELON INVENTORY OPTIMIZATION (MEIO)
==================================================
Target Service Level: 99.5%
Calculated Safety Stock: 14,250 units
Variance Dampener Coefficient: 0.88

Buffer Distribution:
- Central Hub (ORD-01): 8,500 units (60%)
- Western Regional (LAX-03): 3,200 units (22%)
- European Gateway (AMS-02): 2,550 units (18%)

Active Strategy:
Dynamic demand sensing triggered automatic stock replenishment threshold shift from 250 to 320 units for SKU-8849 (Micro-Sensors).
`,
      },
      {
        name: 'Executive Supply Chain Brief',
        extension: 'txt',
        mimeType: 'text/plain',
        systemFolder: 'documents',
        tags: ['Executive', 'Brief', 'Board'],
        content: `ORION-9 EXECUTIVE SCM BRIEFING
Date: September 2026
Author: Orion AI Decision Engine

Highlights:
- Revenue at Risk prevented by AI Autonomous Rerouting: $4.2M
- Total Active Shipments: 1,842 (100% telemetry tracked)
- Exception Resolution SLA: 18.4 minutes (Target < 30m)
- Multi-tier supply visibility index: 94.8%

Next Steps:
Review autonomous execution thresholds in Policy Control Center.
`,
      },
      {
        name: 'Global Route Transit Times',
        extension: 'csv',
        mimeType: 'text/csv',
        systemFolder: 'reports',
        tags: ['Logistics', 'Transit', 'Routes'],
        content: `Origin,Destination,Mode,AvgTransitDays,OnTimeRate,CarbonKgPerTon
Shanghai (SHA),Los Angeles (LAX),Ocean,14.2,0.962,84.5
Frankfurt (FRA),Chicago (ORD),Air,1.8,0.991,480.2
Rotterdam (RTM),New York (NYC),Ocean,11.5,0.978,72.0
Tokyo (TYO),Seattle (SEA),Ocean,9.8,0.985,65.0
Singapore (SIN),Rotterdam (RTM),Ocean,22.1,0.954,120.4
`,
      },
      {
        name: 'Autonomous Policy Ruleset v4',
        extension: 'json',
        mimeType: 'application/json',
        systemFolder: 'projects',
        tags: ['Policy', 'Rules', 'Autopilot'],
        content: JSON.stringify(
          {
            version: '4.2.0',
            governanceLevel: 'HIGH',
            maxAutonomousReorderUSD: 250000,
            safetyStockOverrideThreshold: 0.15,
            requireHumanEscalationOnStockoutRisk: true,
            allowedTransitModes: ['Air_Priority', 'Ocean_Standard', 'Rail_Direct'],
          },
          null,
          2
        ),
      },
      {
        name: 'AI Demand Sensing Prompt Template',
        extension: 'md',
        mimeType: 'text/markdown',
        systemFolder: 'ai',
        tags: ['Prompt', 'AI', 'Forecasting'],
        content: `# Orion AI Demand Sensing Prompt Instructions

You are the Orion-9 Demand Sensing Expert. Analyze high-frequency point-of-sale signals, weather anomalies, and promotional calendars to predict SKU-level velocity shifts over 7, 14, and 30-day horizons.

## Required Output Schema:
- ForecastMean (units)
- UpperConfidenceBound (95%)
- LowerConfidenceBound (95%)
- Top 3 Causal Drivers
`,
      },
      {
        name: 'Quick Operational Memo',
        extension: 'txt',
        mimeType: 'text/plain',
        systemFolder: 'desktop',
        tags: ['Memo', 'QuickNotes'],
        content: `URGENT SCM ACTION ITEMS:
1. Verify customs clearance documents for Singapore inbound container #SG-9941.
2. Review weekly inventory reconciliation in Orion Computer.
3. Confirm warehouse shift allocations for AMS-02 hub.
`,
      },
    ];

    for (const f of demoFiles) {
      const folderId = `folder_sys_${f.systemFolder}_${tenantId}`;
      const fileId = `file_demo_${f.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${tenantId}`;
      const file: OrionFile = {
        id: fileId,
        name: f.name,
        extension: f.extension,
        mimeType: f.mimeType,
        size: new Blob([f.content]).size,
        content: f.content,
        folderId,
        ownerId: 'system_demo',
        ownerName: 'Orion AI System',
        tenantId,
        environment: 'DEMO',
        createdAt: now,
        updatedAt: now,
        createdBy: 'Demo Seeder',
        updatedBy: 'Demo Seeder',
        isDeleted: false,
        isFavorite: f.systemFolder === 'desktop' || f.systemFolder === 'documents',
        lastAccessedAt: now,
        version: 1,
        tags: f.tags,
      };
      await scmPersistenceService.saveRecord('files', file.id, file);
    }
  }

  /**
   * Create a new File.
   */
  public async createFile(params: {
    name: string;
    extension?: string;
    mimeType?: string;
    content?: string;
    folderId: string;
    tenantId?: string;
    environment?: 'DEMO' | 'LIVE';
    ownerId?: string;
    ownerName?: string;
    tags?: string[];
    metadata?: Record<string, any>;
  }): Promise<OrionFile> {
    const { activeTenant, activeEnv } = this.getContext(params.tenantId, params.environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);

    const now = new Date().toISOString();
    const ext = params.extension || (params.name.includes('.') ? params.name.split('.').pop() || 'txt' : 'txt');
    const cleanName = params.name.endsWith(`.${ext}`) ? params.name.slice(0, -(ext.length + 1)) : params.name;
    const content = params.content ?? '';
    const size = new Blob([content]).size;
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const file: OrionFile = {
      id,
      name: cleanName,
      extension: ext,
      mimeType: params.mimeType || this.getMimeType(ext),
      size,
      content,
      folderId: params.folderId,
      ownerId: params.ownerId || 'user_current',
      ownerName: params.ownerName || 'Active User',
      tenantId: activeTenant,
      environment: activeEnv,
      createdAt: now,
      updatedAt: now,
      createdBy: params.ownerName || 'Active User',
      updatedBy: params.ownerName || 'Active User',
      isDeleted: false,
      isFavorite: false,
      lastAccessedAt: now,
      version: 1,
      tags: params.tags || [],
      metadata: params.metadata || {},
    };

    await scmPersistenceService.saveRecord('files', file.id, file);
    this.emitEvent({
      type: 'FILE_CREATED',
      fileId: file.id,
      folderId: file.folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });

    return file;
  }

  /**
   * Update an existing File (content, name, tags, metadata).
   */
  public async updateFile(
    fileId: string,
    updates: Partial<Pick<OrionFile, 'name' | 'content' | 'tags' | 'isFavorite' | 'metadata' | 'folderId'>>,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<OrionFile> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const existing = await this.getFile(fileId, activeTenant, activeEnv);
    if (!existing) {
      throw new Error(`File not found: ${fileId}`);
    }

    const now = new Date().toISOString();
    let content = updates.content !== undefined ? updates.content : existing.content;
    let size = content !== undefined ? new Blob([content]).size : existing.size;

    const updated: OrionFile = {
      ...existing,
      ...updates,
      content,
      size,
      version: (existing.version || 1) + 1,
      updatedAt: now,
      lastAccessedAt: now,
    };

    await scmPersistenceService.saveRecord('files', updated.id, updated);
    this.emitEvent({
      type: 'FILE_UPDATED',
      fileId: updated.id,
      folderId: updated.folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });

    return updated;
  }

  /**
   * Soft-delete file (move to Recycle Bin).
   */
  public async deleteFile(fileId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<void> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const file = await this.getFile(fileId, activeTenant, activeEnv);
    if (!file) return;

    const now = new Date().toISOString();
    const updated: OrionFile = {
      ...file,
      isDeleted: true,
      deletedAt: now,
      deletedBy: 'Current User',
    };

    await scmPersistenceService.saveRecord('files', fileId, updated);
    this.emitEvent({
      type: 'FILE_DELETED',
      fileId,
      folderId: file.folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });
  }

  /**
   * Restore file from Recycle Bin.
   */
  public async restoreFile(fileId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<void> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const file = await this.getFile(fileId, activeTenant, activeEnv);
    if (!file) return;

    const now = new Date().toISOString();
    const updated: OrionFile = {
      ...file,
      isDeleted: false,
      deletedAt: undefined,
      deletedBy: undefined,
      updatedAt: now,
    };

    await scmPersistenceService.saveRecord('files', fileId, updated);
    this.emitEvent({
      type: 'FILE_RESTORED',
      fileId,
      folderId: file.folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });
  }

  /**
   * Permanently delete file.
   */
  public async permanentlyDeleteFile(fileId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<void> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    // In persistence layer, remove from cache / record
    scmPersistenceService.clear('files');
    const now = new Date().toISOString();
    this.emitEvent({
      type: 'FILE_PERMANENTLY_DELETED',
      fileId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });
  }

  /**
   * Rename file.
   */
  public async renameFile(fileId: string, newName: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile> {
    return this.updateFile(fileId, { name: newName }, tenantId, environment);
  }

  /**
   * Copy file to target folder.
   */
  public async copyFile(fileId: string, targetFolderId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const original = await this.getFile(fileId, activeTenant, activeEnv);
    if (!original) throw new Error(`Source file ${fileId} not found`);

    return this.createFile({
      name: `${original.name} (Copy)`,
      extension: original.extension,
      mimeType: original.mimeType,
      content: original.content,
      folderId: targetFolderId,
      tenantId: activeTenant,
      environment: activeEnv,
      tags: original.tags ? [...original.tags] : [],
      metadata: original.metadata ? { ...original.metadata } : {},
    });
  }

  /**
   * Move file to target folder.
   */
  public async moveFile(fileId: string, targetFolderId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile> {
    return this.updateFile(fileId, { folderId: targetFolderId }, tenantId, environment);
  }

  /**
   * Get a single file by ID with tenant validation.
   */
  public async getFile(fileId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile | null> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);
    const file = await scmPersistenceService.getRecord<OrionFile>('files', activeTenant, fileId);
    if (!file || file.tenantId !== activeTenant || file.environment !== activeEnv) {
      return null;
    }
    return file;
  }

  /**
   * List files in a specific folder.
   */
  public async listFiles(
    folderId: string | null,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE',
    includeDeleted: boolean = false
  ): Promise<OrionFile[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);

    const all = await scmPersistenceService.listRecords<OrionFile>('files', activeTenant);
    return all.filter(f => {
      if (f.tenantId !== activeTenant || f.environment !== activeEnv) return false;
      if (!includeDeleted && f.isDeleted) return false;
      if (includeDeleted && !f.isDeleted) return false;
      if (folderId !== null && f.folderId !== folderId) return false;
      return true;
    });
  }

  /**
   * Create a new folder.
   */
  public async createFolder(params: {
    name: string;
    parentId?: string | null;
    icon?: string;
    tenantId?: string;
    environment?: 'DEMO' | 'LIVE';
    ownerId?: string;
  }): Promise<OrionFolder> {
    const { activeTenant, activeEnv } = this.getContext(params.tenantId, params.environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);

    const now = new Date().toISOString();
    const id = `folder_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const folder: OrionFolder = {
      id,
      name: params.name,
      parentId: params.parentId || null,
      isSystem: false,
      icon: params.icon || 'Folder',
      ownerId: params.ownerId || 'user_current',
      tenantId: activeTenant,
      environment: activeEnv,
      createdAt: now,
      updatedAt: now,
      isDeleted: false,
    };

    await scmPersistenceService.saveRecord('folders', folder.id, folder);
    this.emitEvent({
      type: 'FOLDER_CREATED',
      folderId: folder.id,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });

    return folder;
  }

  /**
   * Rename folder.
   */
  public async renameFolder(folderId: string, newName: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFolder> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const existing = await this.getFolder(folderId, activeTenant, activeEnv);
    if (!existing) throw new Error(`Folder ${folderId} not found`);
    if (existing.isSystem) throw new Error('Cannot rename a protected system folder');

    const now = new Date().toISOString();
    const updated: OrionFolder = {
      ...existing,
      name: newName,
      updatedAt: now,
    };

    await scmPersistenceService.saveRecord('folders', folderId, updated);
    this.emitEvent({
      type: 'FOLDER_RENAMED',
      folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });

    return updated;
  }

  /**
   * Delete folder (soft-delete).
   */
  public async deleteFolder(folderId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<void> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const folder = await this.getFolder(folderId, activeTenant, activeEnv);
    if (!folder) return;
    if (folder.isSystem) throw new Error('Cannot delete a protected system folder');

    const now = new Date().toISOString();
    const updated: OrionFolder = {
      ...folder,
      isDeleted: true,
      deletedAt: now,
      deletedBy: 'Current User',
    };

    await scmPersistenceService.saveRecord('folders', folderId, updated);
    this.emitEvent({
      type: 'FOLDER_DELETED',
      folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });
  }

  /**
   * Get a single folder.
   */
  public async getFolder(folderId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFolder | null> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);
    const folder = await scmPersistenceService.getRecord<OrionFolder>('folders', activeTenant, folderId);
    if (!folder || folder.tenantId !== activeTenant || folder.environment !== activeEnv) {
      return null;
    }
    return folder;
  }

  /**
   * Get a system folder by key.
   */
  public async getSystemFolder(key: SystemFolderKey, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFolder | null> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);
    const id = `folder_sys_${key}_${activeTenant}`;
    return this.getFolder(id, activeTenant, activeEnv);
  }

  /**
   * List folders under a parent.
   */
  public async listFolders(
    parentId: string | null,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE',
    includeDeleted: boolean = false
  ): Promise<OrionFolder[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const all = await scmPersistenceService.listRecords<OrionFolder>('folders', activeTenant);
    return all.filter(f => {
      if (f.tenantId !== activeTenant || f.environment !== activeEnv) return false;
      if (!includeDeleted && f.isDeleted) return false;
      if (includeDeleted && !f.isDeleted) return false;
      if (parentId !== undefined && f.parentId !== parentId) return false;
      return true;
    });
  }

  /**
   * Move folder to new parent with circular hierarchy prevention.
   */
  public async moveFolder(
    folderId: string,
    newParentId: string | null,
    tenantId?: string,
    environment?: 'DEMO' | 'LIVE'
  ): Promise<OrionFolder> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const folder = await this.getFolder(folderId, activeTenant, activeEnv);
    if (!folder) throw new Error(`Folder ${folderId} not found`);
    if (folder.isSystem) throw new Error('Cannot move a system root folder');

    if (newParentId === folderId) {
      throw new Error('Cannot move a folder into itself');
    }

    if (newParentId !== null) {
      // Traverse upward from newParentId to ensure folderId is not an ancestor
      let currentCheckId: string | null = newParentId;
      while (currentCheckId) {
        if (currentCheckId === folderId) {
          throw new Error('Cannot move a folder into its own descendant');
        }
        const parentFolder = await this.getFolder(currentCheckId, activeTenant, activeEnv);
        currentCheckId = parentFolder ? parentFolder.parentId : null;
      }
    }

    const now = new Date().toISOString();
    const updated: OrionFolder = {
      ...folder,
      parentId: newParentId,
      updatedAt: now,
    };

    await scmPersistenceService.saveRecord('folders', folderId, updated);
    this.emitEvent({
      type: 'FOLDER_UPDATED',
      folderId,
      tenantId: activeTenant,
      environment: activeEnv,
      timestamp: now,
    });

    return updated;
  }

  /**
   * Search files across all folders.

   */
  public async searchFiles(query: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile[]> {
    if (!query.trim()) return [];
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);

    const q = query.toLowerCase().trim();
    const all = await this.listFiles(null, activeTenant, activeEnv, false);
    return all.filter(
      f =>
        f.name.toLowerCase().includes(q) ||
        f.extension.toLowerCase().includes(q) ||
        (f.content && f.content.toLowerCase().includes(q)) ||
        (f.tags && f.tags.some(t => t.toLowerCase().includes(q)))
    );
  }

  /**
   * Get favorite files.
   */
  public async getFavoriteFiles(tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const all = await this.listFiles(null, activeTenant, activeEnv, false);
    return all.filter(f => f.isFavorite);
  }

  /**
   * Toggle favorite state.
   */
  public async toggleFavorite(fileId: string, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<boolean> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const file = await this.getFile(fileId, activeTenant, activeEnv);
    if (!file) return false;
    const newState = !file.isFavorite;
    await this.updateFile(fileId, { isFavorite: newState }, activeTenant, activeEnv);
    return newState;
  }

  /**
   * Get recent files.
   */
  public async getRecentFiles(limit: number = 10, tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<OrionFile[]> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const all = await this.listFiles(null, activeTenant, activeEnv, false);
    return all
      .sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Get deleted files and folders in Recycle Bin.
   */
  public async getRecycleBinItems(tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<{ files: OrionFile[]; folders: OrionFolder[] }> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const files = await this.listFiles(null, activeTenant, activeEnv, true);
    const folders = await this.listFolders(undefined, activeTenant, activeEnv, true);
    return { files, folders };
  }

  /**
   * Empty Recycle Bin.
   */
  public async emptyRecycleBin(tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<void> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    const { files } = await this.getRecycleBinItems(activeTenant, activeEnv);
    for (const f of files) {
      await this.permanentlyDeleteFile(f.id, activeTenant, activeEnv);
    }
  }

  /**
   * Calculate virtual storage utilization.
   */
  public async getVirtualStorageInfo(tenantId?: string, environment?: 'DEMO' | 'LIVE'): Promise<VirtualStorageInfo> {
    const { activeTenant, activeEnv } = this.getContext(tenantId, environment);
    await this.ensureSystemStructure(activeTenant, activeEnv);

    const files = await scmPersistenceService.listRecords<OrionFile>('files', activeTenant);
    const folders = await scmPersistenceService.listRecords<OrionFolder>('folders', activeTenant);

    const totalCapacityBytes = 50 * 1024 * 1024 * 1024; // 50 GB Virtual Quota
    let usedBytes = 0;
    const categories = {
      documents: 0,
      reports: 0,
      supplyChain: 0,
      ai: 0,
      system: 0,
      recycleBin: 0,
    };

    for (const f of files) {
      if (f.environment !== activeEnv) continue;
      const size = f.size || 0;
      usedBytes += size;

      if (f.isDeleted) {
        categories.recycleBin += size;
      } else if (f.folderId.includes('documents')) {
        categories.documents += size;
      } else if (f.folderId.includes('reports')) {
        categories.reports += size;
      } else if (f.folderId.includes('supply_chain')) {
        categories.supplyChain += size;
      } else if (f.folderId.includes('ai')) {
        categories.ai += size;
      } else {
        categories.system += size;
      }
    }

    return {
      totalCapacityBytes,
      usedBytes,
      availableBytes: Math.max(0, totalCapacityBytes - usedBytes),
      fileCount: files.filter(f => f.environment === activeEnv && !f.isDeleted).length,
      folderCount: folders.filter(f => f.environment === activeEnv && !f.isDeleted).length,
      categories,
      environment: activeEnv,
      tenantId: activeTenant,
    };
  }

  /**
   * Subscribe to File System events.
   */
  public subscribe(listener: (event: FileSystemEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter(l => l !== listener);
    };
  }

  private emitEvent(event: FileSystemEvent): void {
    this.eventListeners.forEach(l => {
      try {
        l(event);
      } catch (e) {
        console.error('[FILE-SYSTEM-EVENT-ERROR]', e);
      }
    });

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion:filesystem-change', { detail: event }));
    }
  }

  private getMimeType(extension: string): string {
    switch (extension.toLowerCase()) {
      case 'txt':
        return 'text/plain';
      case 'md':
        return 'text/markdown';
      case 'json':
        return 'application/json';
      case 'csv':
        return 'text/csv';
      case 'pdf':
        return 'application/pdf';
      case 'png':
        return 'image/png';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'svg':
        return 'image/svg+xml';
      case 'scm':
      case 'report':
        return 'application/x-orion-scm';
      default:
        return 'text/plain';
    }
  }
}

export const orionFileSystemService = OrionFileSystemService.getInstance();
