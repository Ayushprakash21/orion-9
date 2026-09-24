/**
 * ORION-9 DESKTOP WORKSPACE
 * Draggable, grid-snapped desktop icon workspace with persistent coordinates,
 * multi-workspace isolation, right-click desktop and item context menus,
 * marquee multi-selection, and seamless application/file launching.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useWindowManager, WorkspaceId } from '../WindowManagerContext';
import { desktopWorkspaceService, DEFAULT_GRID_CONFIG } from '../../core/filesystem/DesktopWorkspaceService';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { DesktopShortcut, OrionFile, OrionFolder } from '../../core/filesystem/types';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { useToast } from '../../store/ToastContext';
import { cn } from '../../lib/utils';
import {
  FileText,
  Folder,
  Trash2,
  HardDrive,
  RefreshCw,
  Sliders,
  Sparkles,
  ArrowUpDown,
  Plus,
  Edit2,
  ExternalLink,
  Info,
  Layers,
} from 'lucide-react';

export function DesktopWorkspace() {
  const { activeWorkspaceId, openApplication, setLauncherOpen, setCommandPaletteOpen } = useWindowManager();
  const { showToast } = useToast();

  const [shortcuts, setShortcuts] = useState<DesktopShortcut[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<{ id: string; startX: number; startY: number; curX: number; curY: number } | null>(null);

  // Modals / Dialogs
  const [desktopMenu, setDesktopMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemMenu, setItemMenu] = useState<{ x: number; y: number; shortcut: DesktopShortcut } | null>(null);
  const [renameItem, setRenameItem] = useState<DesktopShortcut | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [propertiesItem, setPropertiesItem] = useState<DesktopShortcut | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load shortcuts for active workspace
  const loadShortcuts = useCallback(async () => {
    try {
      const vHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
      const items = await desktopWorkspaceService.ensureWorkspaceShortcuts(activeWorkspaceId, undefined, undefined, vHeight);
      setShortcuts(items);
    } catch (e) {
      console.error('Failed to load desktop shortcuts', e);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadShortcuts();
  }, [loadShortcuts]);

  // Listen for refresh event
  useEffect(() => {
    const handleRefresh = () => {
      loadShortcuts();
    };
    window.addEventListener('orion:desktop-refresh', handleRefresh);
    window.addEventListener('orion:filesystem-change', handleRefresh);
    return () => {
      window.removeEventListener('orion:desktop-refresh', handleRefresh);
      window.removeEventListener('orion:filesystem-change', handleRefresh);
    };
  }, [loadShortcuts]);

  // Handle Drag Pointer events
  const handlePointerDown = (e: React.PointerEvent, shortcut: DesktopShortcut) => {
    if (e.button !== 0) return; // Left click only
    e.stopPropagation();
    setSelectedId(shortcut.id);

    setDraggedItem({
      id: shortcut.id,
      startX: e.clientX - shortcut.x,
      startY: e.clientY - shortcut.y,
      curX: shortcut.x,
      curY: shortcut.y,
    });
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggedItem) return;
    const newX = e.clientX - draggedItem.startX;
    const newY = e.clientY - draggedItem.startY;

    if (Math.abs(newX - draggedItem.curX) > 4 || Math.abs(newY - draggedItem.curY) > 4) {
      setIsDragging(true);
    }

    setDraggedItem(prev => (prev ? { ...prev, curX: newX, curY: newY } : null));
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    if (!draggedItem) return;

    if (isDragging) {
      const vWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
      const vHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;

      try {
        const updated = await desktopWorkspaceService.updateShortcutPosition(
          draggedItem.id,
          draggedItem.curX,
          draggedItem.curY,
          vWidth,
          vHeight
        );
        setShortcuts(prev => prev.map(s => (s.id === updated.id ? updated : s)));
      } catch (err) {
        console.error('Failed to save icon position', err);
      }
    }

    setDraggedItem(null);
    setIsDragging(false);
  };

  // Double Click Launch
  const handleDoubleClick = (shortcut: DesktopShortcut) => {
    if (shortcut.targetType === 'application' || shortcut.targetType === 'system') {
      openApplication(shortcut.targetId);
    } else if (shortcut.targetType === 'file') {
      openApplication('notepad');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orion:open-file', { detail: { fileId: shortcut.targetId } }));
      }, 150);
    } else if (shortcut.targetType === 'folder') {
      openApplication('file-manager');
    }
  };

  // Auto Arrange
  const handleAutoArrange = async (sortBy: 'name' | 'type' | 'date') => {
    try {
      const vHeight = typeof window !== 'undefined' ? window.innerHeight : 900;
      const reordered = await desktopWorkspaceService.autoArrange(activeWorkspaceId, sortBy, vHeight);
      setShortcuts(reordered);
      setDesktopMenu(null);
      showToast(`Desktop arranged by ${sortBy}`, 'info', 'Desktop');
    } catch (e) {
      showToast('Failed to arrange desktop', 'error', 'Desktop');
    }
  };

  // Create New File on Desktop
  const handleCreateDesktopFile = async () => {
    try {
      const desktopFolder = await orionFileSystemService.getSystemFolder('desktop');
      const folderId = desktopFolder ? desktopFolder.id : 'folder_sys_desktop_tenant_default';
      const file = await orionFileSystemService.createFile({
        name: 'New Document',
        extension: 'txt',
        content: '',
        folderId,
      });

      await desktopWorkspaceService.addShortcut({
        targetType: 'file',
        targetId: file.id,
        name: `${file.name}.${file.extension}`,
        workspaceId: activeWorkspaceId,
      });

      await loadShortcuts();
      setDesktopMenu(null);
      showToast('Created text document on Desktop', 'success', 'Desktop');
    } catch (e: any) {
      showToast(`Create file failed: ${e?.message || 'Error'}`, 'error', 'Desktop');
    }
  };

  // Create New Folder on Desktop
  const handleCreateDesktopFolder = async () => {
    try {
      const desktopFolder = await orionFileSystemService.getSystemFolder('desktop');
      const folderId = desktopFolder ? desktopFolder.id : 'folder_sys_desktop_tenant_default';
      const folder = await orionFileSystemService.createFolder({
        name: 'New Folder',
        parentId: folderId,
      });

      await desktopWorkspaceService.addShortcut({
        targetType: 'folder',
        targetId: folder.id,
        name: folder.name,
        workspaceId: activeWorkspaceId,
      });

      await loadShortcuts();
      setDesktopMenu(null);
      showToast('Created folder on Desktop', 'success', 'Desktop');
    } catch (e: any) {
      showToast(`Create folder failed: ${e?.message || 'Error'}`, 'error', 'Desktop');
    }
  };

  // Delete Desktop Item
  const handleDeleteShortcut = async (shortcut: DesktopShortcut) => {
    try {
      if (shortcut.targetType === 'file') {
        await orionFileSystemService.deleteFile(shortcut.targetId);
      } else if (shortcut.targetType === 'folder') {
        await orionFileSystemService.deleteFolder(shortcut.targetId);
      }
      // Reload desktop items
      await loadShortcuts();
      setItemMenu(null);
      showToast(`Moved ${shortcut.name} to Recycle Bin`, 'info', 'Desktop');
    } catch (e: any) {
      showToast(`Delete failed: ${e?.message || 'Error'}`, 'error', 'Desktop');
    }
  };

  // Rename Shortcut
  const handleExecuteRename = async () => {
    if (!renameItem || !renameValue.trim()) return;
    try {
      if (renameItem.targetType === 'file') {
        await orionFileSystemService.renameFile(renameItem.targetId, renameValue.trim());
      } else if (renameItem.targetType === 'folder') {
        await orionFileSystemService.renameFolder(renameItem.targetId, renameValue.trim());
      }
      setRenameItem(null);
      await loadShortcuts();
      showToast('Renamed item', 'success', 'Desktop');
    } catch (e: any) {
      showToast(`Rename failed: ${e?.message || 'Error'}`, 'error', 'Desktop');
    }
  };

  // Icon Renderer Helper
  const renderShortcutIcon = (shortcut: DesktopShortcut, isSelected: boolean) => {
    if (shortcut.targetType === 'application' || shortcut.targetType === 'system') {
      return <OrionAppIcon app={shortcut.targetId} size={50} active={isSelected} />;
    }
    if (shortcut.targetType === 'folder') {
      return <Folder size={46} className="text-amber-400 drop-shadow" />;
    }
    if (shortcut.targetType === 'file') {
      return <FileText size={46} className="text-cyan-400 drop-shadow" />;
    }
    return <HardDrive size={46} className="text-os-accent drop-shadow" />;
  };

  return (
    <div
      ref={containerRef}
      data-desktop-canvas="true"
      className="absolute inset-0 z-0 pointer-events-auto overflow-hidden select-none"
      onClick={() => {
        setSelectedId(null);
        setDesktopMenu(null);
        setItemMenu(null);
      }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onContextMenu={e => {
        e.preventDefault();
        setItemMenu(null);
        setDesktopMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Desktop Icons Canvas */}
      {shortcuts.map(shortcut => {
        const isBeingDragged = draggedItem?.id === shortcut.id && isDragging;
        const isSelected = selectedId === shortcut.id;
        const displayX = isBeingDragged ? draggedItem.curX : shortcut.x;
        const displayY = isBeingDragged ? draggedItem.curY : shortcut.y;

        return (
          <div
            key={shortcut.id}
            data-shortcut-id={shortcut.id}
            style={{
              transform: `translate3d(${displayX}px, ${displayY}px, 0)`,
              width: `${DEFAULT_GRID_CONFIG.cellWidth}px`,
              height: `${DEFAULT_GRID_CONFIG.cellHeight}px`,
            }}
            onPointerDown={e => handlePointerDown(e, shortcut)}
            onDoubleClick={e => {
              e.stopPropagation();
              handleDoubleClick(shortcut);
            }}
            onContextMenu={e => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedId(shortcut.id);
              setDesktopMenu(null);
              setItemMenu({ x: e.clientX, y: e.clientY, shortcut });
            }}
            className={cn(
              "absolute top-0 left-0 flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-shadow select-none group touch-none",
              isBeingDragged && "z-50 opacity-90 scale-105 shadow-2xl",
              isSelected
                ? "bg-os-accent/20 border border-os-accent/50 shadow-md backdrop-blur-xs"
                : "hover:bg-os-surface-hover/30 border border-transparent"
            )}
          >
            <div className="group-hover:scale-105 transition-transform">
              {renderShortcutIcon(shortcut, isSelected)}
            </div>
            <span
              className={cn(
                "mt-1.5 text-[11px] font-medium text-center line-clamp-2 px-1 rounded transition-colors drop-shadow-md",
                isSelected
                  ? "text-os-accent font-semibold bg-black/40"
                  : "text-os-text-primary group-hover:text-os-text-primary"
              )}
            >
              {shortcut.name}
            </span>
          </div>
        );
      })}

      {/* Desktop Right-Click Context Menu */}
      {desktopMenu && (
        <div
          className="fixed z-50 bg-os-surface/95 backdrop-blur-md border border-os-border rounded-xl shadow-2xl py-1.5 w-52 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95"
          style={{ top: desktopMenu.y, left: desktopMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-bold text-os-text-muted uppercase tracking-wider">
            Desktop View
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
              setDesktopMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <RefreshCw size={13} className="text-os-accent" />
            <span>Refresh Desktop</span>
            <span className="ml-auto text-[10px] text-os-text-muted">F5</span>
          </button>

          <div className="h-px bg-os-border/50 my-1" />

          {/* Sort Submenu */}
          <button
            type="button"
            onClick={() => handleAutoArrange('name')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <ArrowUpDown size={13} className="text-cyan-400" />
            <span>Sort by Name</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoArrange('type')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <Layers size={13} className="text-amber-400" />
            <span>Sort by Item Type</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoArrange('date')}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <Sliders size={13} className="text-purple-400" />
            <span>Sort by Date Modified</span>
          </button>

          <div className="h-px bg-os-border/50 my-1" />

          {/* New Item */}
          <button
            type="button"
            onClick={handleCreateDesktopFile}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <Plus size={13} className="text-cyan-400" />
            <span>New Text Document</span>
          </button>

          <button
            type="button"
            onClick={handleCreateDesktopFolder}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <Plus size={13} className="text-amber-400" />
            <span>New Folder</span>
          </button>

          <div className="h-px bg-os-border/50 my-1" />

          <button
            type="button"
            onClick={() => {
              openApplication('settings');
              setDesktopMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <Sparkles size={13} className="text-os-accent" />
            <span>Personalize Desktop...</span>
          </button>
        </div>
      )}

      {/* Item Right-Click Context Menu */}
      {itemMenu && (
        <div
          className="fixed z-50 bg-os-surface/95 backdrop-blur-md border border-os-border rounded-xl shadow-2xl py-1.5 w-48 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95"
          style={{ top: itemMenu.y, left: itemMenu.x }}
          onClick={e => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => {
              handleDoubleClick(itemMenu.shortcut);
              setItemMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left font-medium"
          >
            <ExternalLink size={13} className="text-os-accent" />
            <span>Open</span>
          </button>

          {itemMenu.shortcut.targetType === 'file' && (
            <button
              type="button"
              onClick={() => {
                openApplication('notepad');
                setTimeout(() => {
                  window.dispatchEvent(
                    new CustomEvent('orion:open-file', { detail: { fileId: itemMenu.shortcut.targetId } })
                  );
                }, 150);
                setItemMenu(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
            >
              <FileText size={13} className="text-cyan-400" />
              <span>Edit in Notepad</span>
            </button>
          )}

          {(itemMenu.shortcut.targetType === 'file' || itemMenu.shortcut.targetType === 'folder') && (
            <button
              type="button"
              onClick={() => {
                setRenameItem(itemMenu.shortcut);
                setRenameValue(itemMenu.shortcut.name);
                setItemMenu(null);
              }}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
            >
              <Edit2 size={13} />
              <span>Rename</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPropertiesItem(itemMenu.shortcut);
              setItemMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-os-surface-hover text-os-text-primary text-left"
          >
            <Info size={13} />
            <span>Properties</span>
          </button>

          <div className="h-px bg-os-border/50 my-1" />

          <button
            type="button"
            onClick={() => handleDeleteShortcut(itemMenu.shortcut)}
            className="flex items-center gap-2 px-3 py-1.5 hover:bg-rose-500/20 text-rose-400 text-left"
          >
            <Trash2 size={13} />
            <span>Move to Recycle Bin</span>
          </button>
        </div>
      )}

      {/* Rename Modal */}
      {renameItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-4 flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <Edit2 size={16} className="text-cyan-400" />
              Rename Desktop Shortcut
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
                onClick={() => setRenameItem(null)}
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-os-border/60 pb-3">
              <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
                <Info size={16} className="text-cyan-400" />
                Shortcut Properties
              </h3>
            </div>

            <div className="flex flex-col gap-2.5 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Name:</span>
                <span className="font-semibold text-os-text-primary">{propertiesItem.name}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Target Type:</span>
                <span className="text-os-text-primary uppercase font-mono">{propertiesItem.targetType}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Target ID:</span>
                <span className="text-os-text-primary font-mono text-[10px] truncate max-w-[180px]">
                  {propertiesItem.targetId}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-os-border/30">
                <span className="text-os-text-muted">Workspace:</span>
                <span className="text-os-accent font-medium capitalize">{propertiesItem.workspaceId}</span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-os-text-muted">Position:</span>
                <span className="text-os-text-primary font-mono">
                  X: {propertiesItem.x}px, Y: {propertiesItem.y}px
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
