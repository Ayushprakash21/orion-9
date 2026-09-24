/**
 * ORION-9 VIRTUAL FILE SYSTEM TYPES & INTERFACES
 * Defines file, folder, shortcut, storage and operation contracts.
 */

import { WorkspaceId } from '../../os/WindowManagerContext';

export type SystemFolderKey = 
  | 'computer'
  | 'desktop'
  | 'documents'
  | 'downloads'
  | 'projects'
  | 'reports'
  | 'supply_chain'
  | 'ai'
  | 'shared'
  | 'recycle_bin';

export type FileExtension = 
  | 'txt' 
  | 'csv' 
  | 'json' 
  | 'md' 
  | 'pdf' 
  | 'png' 
  | 'jpg' 
  | 'svg' 
  | 'scm' 
  | 'report'
  | 'log';

export interface OrionFile {
  id: string;
  name: string;
  extension: string;
  mimeType: string;
  size: number; // in bytes
  content?: string;
  storageUrl?: string;
  folderId: string;
  ownerId: string;
  ownerName?: string;
  tenantId: string;
  organizationId?: string;
  environment: 'DEMO' | 'LIVE';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
  isFavorite?: boolean;
  lastAccessedAt?: string;
  version?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface OrionFolder {
  id: string;
  name: string;
  parentId: string | null;
  isSystem: boolean;
  systemKey?: SystemFolderKey;
  icon?: string;
  ownerId: string;
  tenantId: string;
  environment: 'DEMO' | 'LIVE';
  createdAt: string;
  updatedAt: string;
  isDeleted: boolean;
  deletedAt?: string;
  deletedBy?: string;
}

export type DesktopItemType = 'application' | 'folder' | 'file' | 'system' | 'shortcut';

/**
 * Authoritative Firestore document contract for Desktop Items.
 * Stored in `desktop_items/{id}` collection.
 */
export interface DesktopItemRecord {
  id: string;
  name: string;
  type: DesktopItemType;
  targetType: DesktopItemType;
  targetId: string; // appId, fileId, folderId, systemId
  isDirectory: boolean;
  parentId: string | null;
  path: string;
  iconId: string;
  mimeType: string | null;
  size: number;
  x: number;
  y: number;
  workspaceId: WorkspaceId;
  ownerId: string;
  tenantId: string;
  organizationId: string;
  environment: 'DEMO' | 'LIVE';
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export interface DesktopShortcut extends DesktopItemRecord {
  icon?: string; // Legacy fallback
}

export interface VirtualStorageInfo {
  totalCapacityBytes: number;
  usedBytes: number;
  availableBytes: number;
  fileCount: number;
  folderCount: number;
  categories: {
    documents: number;
    reports: number;
    supplyChain: number;
    ai: number;
    system: number;
    recycleBin: number;
  };
  environment: 'DEMO' | 'LIVE';
  tenantId: string;
}

export interface FileSystemEvent {
  type: 
    | 'FILE_CREATED'
    | 'FILE_UPDATED'
    | 'FILE_DELETED'
    | 'FILE_RESTORED'
    | 'FILE_PERMANENTLY_DELETED'
    | 'FILE_RENAMED'
    | 'FILE_MOVED'
    | 'FILE_COPIED'
    | 'FOLDER_CREATED'
    | 'FOLDER_RENAMED'
    | 'FOLDER_DELETED'
    | 'FOLDER_UPDATED'
    | 'FOLDER_MOVED'
    | 'DESKTOP_LAYOUT_UPDATED';
  fileId?: string;
  folderId?: string;
  shortcutId?: string;
  tenantId: string;
  environment: 'DEMO' | 'LIVE';
  timestamp: string;
}
