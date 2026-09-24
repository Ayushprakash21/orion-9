/**
 * ORION-9 FILE MANAGER (FILE EXPLORER)
 * Enterprise OS file browser featuring system sidebar navigation, breadcrumbs,
 * grid & list views, real-time search, folder hierarchy, soft-delete to Recycle Bin,
 * file restore, properties inspection, and seamless Notepad integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Folder,
  FolderOpen,
  FileText,
  FileCode,
  FileSpreadsheet,
  File,
  HardDrive,
  Monitor,
  Download,
  FolderKanban,
  BarChart3,
  Truck,
  Brain,
  Share2,
  Trash2,
  ChevronRight,
  ChevronLeft,
  ArrowUp,
  RotateCw,
  Search,
  LayoutGrid,
  List as ListIcon,
  Plus,
  Edit2,
  Copy,
  Star,
  Info,
  Check,
  X,
  ExternalLink,
  SlidersHorizontal,
  MoreVertical,
} from 'lucide-react';
import { orionFileSystemService, SYSTEM_FOLDERS } from '../core/filesystem/OrionFileSystemService';
import { OrionFile, OrionFolder, SystemFolderKey, VirtualStorageInfo } from '../core/filesystem/types';
import { useWindowManager } from '../os/WindowManagerContext';
import { useToast } from '../store/ToastContext';
import { cn } from '../lib/utils';

export interface FileManagerProps {
  initialFolderKey?: SystemFolderKey;
  initialFolderId?: string;
}

export function FileManager({ initialFolderKey = 'documents', initialFolderId }: FileManagerProps) {
  const { openApplication } = useWindowManager();
  const { showToast } = useToast();

  // Navigation State
  const [currentFolder, setCurrentFolder] = useState<OrionFolder | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Data
  const [folders, setFolders] = useState<OrionFolder[]>([]);
  const [files, setFiles] = useState<OrionFile[]>([]);
  const [systemFolders, setSystemFolders] = useState<OrionFolder[]>([]);
  const [storageInfo, setStorageInfo] = useState<VirtualStorageInfo | null>(null);

  // UI state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedItem, setSelectedItem] = useState<{ type: 'file' | 'folder'; id: string } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isNewFolderOpen, setIsNewFolderOpen] = useState<boolean>(false);
  const [newFolderName, setNewFolderName] = useState<string>('New Folder');
  const [isNewFileOpen, setIsNewFileOpen] = useState<boolean>(false);
  const [newFileName, setNewFileName] = useState<string>('New Document.txt');
  const [newFileContent, setNewFileContent] = useState<string>('');
  const [isRenameOpen, setIsRenameOpen] = useState<boolean>(false);
  const [renameValue, setRenameValue] = useState<string>('');
  const [propertiesItem, setPropertiesItem] = useState<OrionFile | OrionFolder | null>(null);

  // Right-click context menu on item
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    item: { type: 'file' | 'folder'; data: OrionFile | OrionFolder };
  } | null>(null);

  // Load Directory contents
  const loadDirectory = useCallback(async (folderId: string | null) => {
    setIsLoading(true);
    try {
      await orionFileSystemService.ensureSystemStructure();
      const [allSysFolders, current, storage] = await Promise.all([
        orionFileSystemService.listFolders(null),
        folderId ? orionFileSystemService.getFolder(folderId) : null,
        orionFileSystemService.getVirtualStorageInfo(),
      ]);

      setSystemFolders(allSysFolders.filter(f => f.isSystem));
      setStorageInfo(storage);

      const targetFolder = current || allSysFolders.find(f => f.systemKey === initialFolderKey) || allSysFolders[0];
      setCurrentFolder(targetFolder);

      if (targetFolder) {
        const isRecycle = targetFolder.systemKey === 'recycle_bin';
        const [subFolders, dirFiles] = await Promise.all([
          orionFileSystemService.listFolders(targetFolder.id, undefined, undefined, isRecycle),
          orionFileSystemService.listFiles(targetFolder.id, undefined, undefined, isRecycle),
        ]);
        setFolders(subFolders);
        setFiles(dirFiles);
      }
    } catch (err) {
      console.error('Failed to load file manager directory', err);
      showToast('Error loading directory', 'error', 'File Explorer');
    } finally {
      setIsLoading(false);
    }
  }, [initialFolderKey, showToast]);

  // Initial Boot
  useEffect(() => {
    loadDirectory(initialFolderId || null);
  }, [loadDirectory, initialFolderId]);

  // Listen to FS changes
  useEffect(() => {
    const unsub = orionFileSystemService.subscribe(() => {
      if (currentFolder) {
        loadDirectory(currentFolder.id);
      }
    });
    return unsub;
  }, [currentFolder, loadDirectory]);

  // Navigate to folder
  const navigateToFolder = (folder: OrionFolder) => {
    setHistory(prev => [...prev.slice(0, historyIndex + 1), folder.id]);
    setHistoryIndex(prev => prev + 1);
    setCurrentFolder(folder);
    setSelectedItem(null);
    loadDirectory(folder.id);
  };

  // Nav Buttons
  const handleGoBack = () => {
    if (historyIndex > 0) {
      const targetId = history[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      loadDirectory(targetId);
    }
  };

  const handleGoForward = () => {
    if (historyIndex < history.length - 1) {
      const targetId = history[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      loadDirectory(targetId);
    }
  };

  const handleGoUp = async () => {
    if (currentFolder && currentFolder.parentId) {
      const parent = await orionFileSystemService.getFolder(currentFolder.parentId);
      if (parent) navigateToFolder(parent);
    }
  };

  // Open File
  const handleOpenFile = (file: OrionFile) => {
    // Dispatch open event to Notepad or open Notepad window
    openApplication('notepad');
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('orion:open-file', { detail: { fileId: file.id } }));
    }, 150);
  };

  // File deletion
  const handleDeleteItem = async (item: { type: 'file' | 'folder'; data: OrionFile | OrionFolder }) => {
    try {
      if (item.type === 'file') {
        const file = item.data as OrionFile;
        if (file.isDeleted) {
          await orionFileSystemService.permanentlyDeleteFile(file.id);
          showToast(`Permanently deleted ${file.name}`, 'info', 'File Explorer');
        } else {
          await orionFileSystemService.deleteFile(file.id);
          showToast(`Moved ${file.name} to Recycle Bin`, 'info', 'File Explorer');
        }
      } else {
        const folder = item.data as OrionFolder;
        await orionFileSystemService.deleteFolder(folder.id);
        showToast(`Moved ${folder.name} to Recycle Bin`, 'info', 'File Explorer');
      }
      if (currentFolder) loadDirectory(currentFolder.id);
    } catch (e: any) {
      showToast(`Delete failed: ${e?.message || 'Error'}`, 'error', 'File Explorer');
    }
  };

  // File restore
  const handleRestoreFile = async (fileId: string) => {
    try {
      await orionFileSystemService.restoreFile(fileId);
      showToast('Item restored successfully', 'success', 'File Explorer');
      if (currentFolder) loadDirectory(currentFolder.id);
    } catch (e: any) {
      showToast('Failed to restore item', 'error', 'File Explorer');
    }
  };

  // Empty Recycle Bin
  const handleEmptyRecycleBin = async () => {
    if (!window.confirm('Are you sure you want to permanently empty the Recycle Bin?')) return;
    try {
      await orionFileSystemService.emptyRecycleBin();
      showToast('Recycle Bin emptied', 'info', 'File Explorer');
      if (currentFolder) loadDirectory(currentFolder.id);
    } catch (e) {
      showToast('Failed to empty recycle bin', 'error', 'File Explorer');
    }
  };

  // Create Folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim() || !currentFolder) return;
    try {
      await orionFileSystemService.createFolder({
        name: newFolderName.trim(),
        parentId: currentFolder.id,
      });
      setIsNewFolderOpen(false);
      setNewFolderName('New Folder');
      showToast('Folder created', 'success', 'File Explorer');
      loadDirectory(currentFolder.id);
    } catch (e: any) {
      showToast(`Create folder failed: ${e?.message || 'Error'}`, 'error', 'File Explorer');
    }
  };

  // Create File
  const handleCreateFile = async () => {
    if (!newFileName.trim() || !currentFolder) return;
    try {
      const parts = newFileName.split('.');
      const ext = parts.length > 1 ? parts.pop()! : 'txt';
      const baseName = parts.join('.');

      await orionFileSystemService.createFile({
        name: baseName,
        extension: ext,
        content: newFileContent,
        folderId: currentFolder.id,
      });
      setIsNewFileOpen(false);
      setNewFileName('New Document.txt');
      setNewFileContent('');
      showToast('Document created', 'success', 'File Explorer');
      loadDirectory(currentFolder.id);
    } catch (e: any) {
      showToast(`Create file failed: ${e?.message || 'Error'}`, 'error', 'File Explorer');
    }
  };

  // Execute Rename
  const handleExecuteRename = async () => {
    if (!renameValue.trim() || !selectedItem) return;
    try {
      if (selectedItem.type === 'file') {
        await orionFileSystemService.renameFile(selectedItem.id, renameValue.trim());
      } else {
        await orionFileSystemService.renameFolder(selectedItem.id, renameValue.trim());
      }
      setIsRenameOpen(false);
      showToast('Item renamed', 'success', 'File Explorer');
      if (currentFolder) loadDirectory(currentFolder.id);
    } catch (e: any) {
      showToast(`Rename failed: ${e?.message || 'Error'}`, 'error', 'File Explorer');
    }
  };

  // Get File Icon Helper
  const getFileIcon = (file: OrionFile) => {
    switch (file.extension.toLowerCase()) {
      case 'txt':
      case 'md':
        return <FileText size={viewMode === 'grid' ? 36 : 18} className="text-cyan-400" />;
      case 'csv':
        return <FileSpreadsheet size={viewMode === 'grid' ? 36 : 18} className="text-emerald-400" />;
      case 'json':
        return <FileCode size={viewMode === 'grid' ? 36 : 18} className="text-amber-400" />;
      case 'scm':
      case 'report':
        return <BarChart3 size={viewMode === 'grid' ? 36 : 18} className="text-purple-400" />;
      default:
        return <File size={viewMode === 'grid' ? 36 : 18} className="text-blue-400" />;
    }
  };

  // System Folder Icon Helper
  const getFolderIcon = (key?: SystemFolderKey) => {
    switch (key) {
      case 'desktop':
        return <Monitor size={15} className="text-blue-400" />;
      case 'documents':
        return <FileText size={15} className="text-cyan-400" />;
      case 'downloads':
        return <Download size={15} className="text-amber-400" />;
      case 'projects':
        return <FolderKanban size={15} className="text-indigo-400" />;
      case 'reports':
        return <BarChart3 size={15} className="text-emerald-400" />;
      case 'supply_chain':
        return <Truck size={15} className="text-emerald-500" />;
      case 'ai':
        return <Brain size={15} className="text-purple-400" />;
      case 'shared':
        return <Share2 size={15} className="text-sky-400" />;
      case 'recycle_bin':
        return <Trash2 size={15} className="text-rose-400" />;
      default:
        return <Folder size={15} className="text-amber-400" />;
    }
  };

  // Filtering
  const filteredFolders = folders.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.extension.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isRecycleBin = currentFolder?.systemKey === 'recycle_bin';

  return (
    <div
      className="flex h-full w-full bg-os-surface text-os-text-primary select-none overflow-hidden rounded-b-xl"
      onClick={() => setContextMenu(null)}
    >
      {/* Left Sidebar: Navigation & Storage */}
      <div className="w-56 bg-os-surface-tint border-r border-os-border/50 flex flex-col justify-between p-3 gap-3">
        <div className="flex flex-col gap-4 overflow-y-auto">
          {/* Quick Access Title */}
          <div>
            <div className="text-[10px] font-bold text-os-text-muted uppercase tracking-wider px-2 mb-1.5">
              System Folders
            </div>
            <div className="flex flex-col gap-0.5">
              {systemFolders.map(sys => {
                const isActive = currentFolder?.id === sys.id;
                return (
                  <button
                    type="button"
                    key={sys.id}
                    onClick={() => navigateToFolder(sys)}
                    className={cn(
                      "flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left group",
                      isActive
                        ? "bg-os-accent/20 text-os-accent border border-os-accent/30 font-semibold"
                        : "hover:bg-os-surface-hover text-os-text-secondary hover:text-os-text-primary"
                    )}
                  >
                    {getFolderIcon(sys.systemKey)}
                    <span className="truncate">{sys.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Bottom Storage Meter */}
        <div className="bg-os-surface p-2.5 rounded-lg border border-os-border/50 flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-semibold text-os-text-primary flex items-center gap-1">
              <HardDrive size={13} className="text-cyan-400" />
              Virtual Disk
            </span>
            <span className="text-os-text-muted text-[10px]">
              {storageInfo ? `${Math.round(storageInfo.usedBytes / (1024 * 1024) * 10) / 10} MB / 50 GB` : '0 MB / 50 GB'}
            </span>
          </div>
          <div className="w-full bg-os-surface-tint rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${storageInfo ? Math.max(4, (storageInfo.usedBytes / storageInfo.totalCapacityBytes) * 100) : 4}%`,
              }}
            />
          </div>
          <div className="text-[10px] text-os-text-muted">
            {storageInfo ? `${storageInfo.fileCount} files • ${storageInfo.folderCount} folders` : 'Reading storage...'}
          </div>
        </div>
      </div>

      {/* Main Explorer Pane */}
      <div className="flex-1 flex flex-col overflow-hidden bg-os-surface">
        {/* Top Explorer Toolbar */}
        <div className="flex flex-wrap items-center justify-between px-3 py-2 bg-os-surface-tint border-b border-os-border/50 gap-2 text-xs">
          {/* Nav Controls & Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleGoBack}
                disabled={historyIndex <= 0}
                className="p-1 rounded hover:bg-os-surface-hover disabled:opacity-30 text-os-text-secondary"
                title="Back"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleGoForward}
                disabled={historyIndex >= history.length - 1}
                className="p-1 rounded hover:bg-os-surface-hover disabled:opacity-30 text-os-text-secondary"
                title="Forward"
              >
                <ChevronRight size={16} />
              </button>
              <button
                type="button"
                onClick={handleGoUp}
                disabled={!currentFolder?.parentId}
                className="p-1 rounded hover:bg-os-surface-hover disabled:opacity-30 text-os-text-secondary"
                title="Up"
              >
                <ArrowUp size={16} />
              </button>
              <button
                type="button"
                onClick={() => currentFolder && loadDirectory(currentFolder.id)}
                className="p-1 rounded hover:bg-os-surface-hover text-os-text-secondary"
                title="Refresh"
              >
                <RotateCw size={14} />
              </button>
            </div>

            {/* Breadcrumb Path */}
            <div className="flex items-center gap-1 bg-os-surface px-2.5 py-1 rounded-lg border border-os-border/60 text-xs text-os-text-primary flex-1 overflow-hidden">
              <HardDrive size={13} className="text-os-accent shrink-0" />
              <span className="text-os-text-muted">Orion OS</span>
              <ChevronRight size={12} className="text-os-text-muted shrink-0" />
              <span className="font-semibold text-os-text-primary truncate">
                {currentFolder?.name || 'Explorer'}
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex items-center gap-1.5 bg-os-surface px-2.5 py-1 rounded-lg border border-os-border/60 text-xs w-48">
            <Search size={13} className="text-os-text-muted" />
            <input
              type="text"
              placeholder={`Search ${currentFolder?.name || 'files'}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="bg-transparent border-none outline-none w-full text-os-text-primary text-xs"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5">
            {isRecycleBin ? (
              <button
                type="button"
                onClick={handleEmptyRecycleBin}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-medium text-xs border border-rose-500/40"
              >
                <Trash2 size={13} />
                <span>Empty Bin</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-os-surface hover:bg-os-surface-hover border border-os-border/60 text-os-text-secondary hover:text-os-text-primary text-xs"
                >
                  <Plus size={13} className="text-amber-400" />
                  <span>New Folder</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewFileOpen(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-os-accent/20 hover:bg-os-accent/30 text-os-accent font-medium text-xs border border-os-accent/30"
                >
                  <Plus size={13} />
                  <span>New Document</span>
                </button>
              </>
            )}

            <div className="h-4 w-px bg-os-border/60 mx-0.5" />

            {/* View Mode Toggle */}
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'grid' ? "bg-os-accent/20 text-os-accent" : "hover:bg-os-surface-hover text-os-text-muted"
              )}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>

            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={cn(
                "p-1.5 rounded transition-colors",
                viewMode === 'list' ? "bg-os-accent/20 text-os-accent" : "hover:bg-os-surface-hover text-os-text-muted"
              )}
              title="List View"
            >
              <ListIcon size={15} />
            </button>
          </div>
        </div>

        {/* Content View */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full text-os-text-muted text-xs animate-pulse">
              Reading virtual directory...
            </div>
          ) : filteredFolders.length === 0 && filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-os-text-muted gap-2">
              <FolderOpen size={42} className="text-os-text-muted/40" />
              <div className="text-xs font-medium">This folder is empty</div>
              <div className="text-[11px] text-os-text-muted/60">
                Create a new document or folder to get started.
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Grid View */
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {/* Folders */}
              {filteredFolders.map(folder => {
                const isSelected = selectedItem?.type === 'folder' && selectedItem.id === folder.id;
                return (
                  <div
                    key={folder.id}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedItem({ type: 'folder', id: folder.id });
                    }}
                    onDoubleClick={() => navigateToFolder(folder)}
                    onContextMenu={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedItem({ type: 'folder', id: folder.id });
                      setContextMenu({ x: e.clientX, y: e.clientY, item: { type: 'folder', data: folder } });
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer group text-center select-none",
                      isSelected
                        ? "bg-os-accent/20 border-os-accent/50 shadow-sm"
                        : "hover:bg-os-surface-hover border-transparent"
                    )}
                  >
                    <Folder size={44} className="text-amber-400 group-hover:scale-105 transition-transform" />
                    <span className="mt-2 text-xs font-medium text-os-text-primary truncate w-full">
                      {folder.name}
                    </span>
                    <span className="text-[10px] text-os-text-muted">Folder</span>
                  </div>
                );
              })}

              {/* Files */}
              {filteredFiles.map(file => {
                const isSelected = selectedItem?.type === 'file' && selectedItem.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={e => {
                      e.stopPropagation();
                      setSelectedItem({ type: 'file', id: file.id });
                    }}
                    onDoubleClick={() => handleOpenFile(file)}
                    onContextMenu={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedItem({ type: 'file', id: file.id });
                      setContextMenu({ x: e.clientX, y: e.clientY, item: { type: 'file', data: file } });
                    }}
                    className={cn(
                      "flex flex-col items-center justify-center p-3 rounded-xl border transition-all cursor-pointer group text-center select-none",
                      isSelected
                        ? "bg-os-accent/20 border-os-accent/50 shadow-sm"
                        : "hover:bg-os-surface-hover border-transparent"
                    )}
                  >
                    <div className="group-hover:scale-105 transition-transform">
                      {getFileIcon(file)}
                    </div>
                    <span className="mt-2 text-xs font-medium text-os-text-primary truncate w-full">
                      {file.name}.{file.extension}
                    </span>
                    <span className="text-[10px] text-os-text-muted">
                      {Math.round(file.size / 1024 * 10) / 10} KB
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            /* List View */
            <div className="w-full text-xs">
              <div className="grid grid-cols-12 py-2 px-3 border-b border-os-border/50 text-[11px] font-semibold text-os-text-muted">
                <span className="col-span-6">Name</span>
                <span className="col-span-3">Date Modified</span>
                <span className="col-span-2">Type</span>
                <span className="col-span-1 text-right">Size</span>
              </div>

              {/* Folders in List */}
              {filteredFolders.map(folder => (
                <div
                  key={folder.id}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'folder', id: folder.id });
                  }}
                  onDoubleClick={() => navigateToFolder(folder)}
                  onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedItem({ type: 'folder', id: folder.id });
                    setContextMenu({ x: e.clientX, y: e.clientY, item: { type: 'folder', data: folder } });
                  }}
                  className={cn(
                    "grid grid-cols-12 items-center py-2 px-3 rounded-lg hover:bg-os-surface-hover cursor-pointer transition-colors border border-transparent",
                    selectedItem?.type === 'folder' && selectedItem.id === folder.id && "bg-os-accent/20 border-os-accent/40"
                  )}
                >
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    <Folder size={16} className="text-amber-400 shrink-0" />
                    <span className="font-medium text-os-text-primary truncate">{folder.name}</span>
                  </div>
                  <span className="col-span-3 text-os-text-muted truncate">
                    {new Date(folder.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="col-span-2 text-os-text-muted">Folder</span>
                  <span className="col-span-1 text-right text-os-text-muted">—</span>
                </div>
              ))}

              {/* Files in List */}
              {filteredFiles.map(file => (
                <div
                  key={file.id}
                  onClick={e => {
                    e.stopPropagation();
                    setSelectedItem({ type: 'file', id: file.id });
                  }}
                  onDoubleClick={() => handleOpenFile(file)}
                  onContextMenu={e => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedItem({ type: 'file', id: file.id });
                    setContextMenu({ x: e.clientX, y: e.clientY, item: { type: 'file', data: file } });
                  }}
                  className={cn(
                    "grid grid-cols-12 items-center py-2 px-3 rounded-lg hover:bg-os-surface-hover cursor-pointer transition-colors border border-transparent",
                    selectedItem?.type === 'file' && selectedItem.id === file.id && "bg-os-accent/20 border-os-accent/40"
                  )}
                >
                  <div className="col-span-6 flex items-center gap-2 truncate">
                    {getFileIcon(file)}
                    <span className="font-medium text-os-text-primary truncate">
                      {file.name}.{file.extension}
                    </span>
                  </div>
                  <span className="col-span-3 text-os-text-muted truncate">
                    {new Date(file.updatedAt).toLocaleDateString()}
                  </span>
                  <span className="col-span-2 text-os-text-muted uppercase text-[10px]">
                    {file.extension} Document
                  </span>
                  <span className="col-span-1 text-right text-os-text-muted">
                    {Math.round(file.size / 1024 * 10) / 10} KB
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Status Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-os-surface-tint border-t border-os-border/50 text-[11px] text-os-text-muted">
          <div className="flex items-center gap-3">
            <span>{filteredFolders.length + filteredFiles.length} items</span>
            {selectedItem && (
              <span className="text-os-accent font-medium">1 item selected</span>
            )}
          </div>
          <span>Orion Virtual File System • Secure Cloud Sync</span>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-os-surface border border-os-border rounded-xl shadow-2xl py-1.5 w-48 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          {contextMenu.item.type === 'file' ? (
            <>
              <button
                type="button"
                onClick={() => {
                  handleOpenFile(contextMenu.item.data as OrionFile);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
              >
                <ExternalLink size={13} className="text-cyan-400" />
                <span>Open in Notepad</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRenameValue((contextMenu.item.data as OrionFile).name);
                  setIsRenameOpen(true);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
              >
                <Edit2 size={13} />
                <span>Rename</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPropertiesItem(contextMenu.item.data);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
              >
                <Info size={13} />
                <span>Properties</span>
              </button>

              <div className="h-px bg-os-border/60 my-1" />

              {isRecycleBin ? (
                <button
                  type="button"
                  onClick={() => {
                    handleRestoreFile(contextMenu.item.data.id);
                    setContextMenu(null);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-emerald-400 text-left"
                >
                  <RotateCw size={13} />
                  <span>Restore</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  handleDeleteItem(contextMenu.item);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 text-left"
              >
                <Trash2 size={13} />
                <span>{isRecycleBin ? 'Delete Permanently' : 'Move to Trash'}</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  navigateToFolder(contextMenu.item.data as OrionFolder);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
              >
                <FolderOpen size={13} className="text-amber-400" />
                <span>Open Folder</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setRenameValue((contextMenu.item.data as OrionFolder).name);
                  setIsRenameOpen(true);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
              >
                <Edit2 size={13} />
                <span>Rename</span>
              </button>

              <div className="h-px bg-os-border/60 my-1" />

              <button
                type="button"
                onClick={() => {
                  handleDeleteItem(contextMenu.item);
                  setContextMenu(null);
                }}
                className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 text-left"
              >
                <Trash2 size={13} />
                <span>Delete Folder</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <Folder size={16} className="text-amber-400" />
              Create New Folder
            </h3>
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              placeholder="Folder name"
              className="bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-xs text-os-text-primary outline-none focus:border-os-accent"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFolderOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFolder}
                className="px-4 py-1.5 rounded-lg bg-os-accent text-black font-semibold text-xs"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {isNewFileOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-md p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <FileText size={16} className="text-cyan-400" />
              Create New Document
            </h3>
            <input
              type="text"
              value={newFileName}
              onChange={e => setNewFileName(e.target.value)}
              placeholder="Document name (e.g. Analysis.txt)"
              className="bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-xs text-os-text-primary outline-none focus:border-os-accent"
              autoFocus
            />
            <textarea
              value={newFileContent}
              onChange={e => setNewFileContent(e.target.value)}
              placeholder="Optional initial content..."
              rows={4}
              className="bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-xs text-os-text-primary outline-none focus:border-os-accent resize-none"
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsNewFileOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateFile}
                className="px-4 py-1.5 rounded-lg bg-os-accent text-black font-semibold text-xs"
              >
                Create Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {isRenameOpen && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <Edit2 size={16} className="text-cyan-400" />
              Rename Item
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              className="bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-xs text-os-text-primary outline-none focus:border-os-accent"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsRenameOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRename}
                className="px-4 py-1.5 rounded-lg bg-os-accent text-black font-semibold text-xs"
              >
                Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Properties Modal */}
      {propertiesItem && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-os-border/60 pb-3">
              <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
                <Info size={16} className="text-cyan-400" />
                Item Properties
              </h3>
              <button
                type="button"
                onClick={() => setPropertiesItem(null)}
                className="text-os-text-muted hover:text-os-text-primary"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Name:</span>
                <span className="font-semibold text-os-text-primary truncate max-w-[180px]">
                  {propertiesItem.name}
                </span>
              </div>

              {'extension' in propertiesItem && (
                <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                  <span className="text-os-text-muted">Type:</span>
                  <span className="text-os-text-primary uppercase font-mono">
                    {(propertiesItem as OrionFile).extension} Document
                  </span>
                </div>
              )}

              {'size' in propertiesItem && (
                <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                  <span className="text-os-text-muted">Size:</span>
                  <span className="text-os-text-primary font-mono">
                    {Math.round((propertiesItem as OrionFile).size / 1024 * 10) / 10} KB ({(propertiesItem as OrionFile).size} bytes)
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Environment:</span>
                <span className="px-2 py-0.5 rounded bg-os-accent/20 text-os-accent font-bold text-[10px]">
                  {propertiesItem.environment}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Created:</span>
                <span className="text-os-text-primary">
                  {new Date(propertiesItem.createdAt).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-os-text-muted">Modified:</span>
                <span className="text-os-text-primary">
                  {new Date(propertiesItem.updatedAt).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setPropertiesItem(null)}
                className="px-4 py-1.5 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-primary text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
