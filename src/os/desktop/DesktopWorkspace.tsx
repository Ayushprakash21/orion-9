/**
 * ORION-9 DESKTOP WORKSPACE (CROSS-DEVICE: DESKTOP & TABLET)
 * Draggable, grid-snapped desktop icon workspace with persistent coordinates,
 * touch-first long-press (500-700ms) with drag threshold cancellation,
 * right-click and touch context menus, keyboard shortcuts (Enter, F2, Delete, Ctrl+N, Ctrl+A),
 * drag-and-drop into folders/Recycle Bin, and seamless file/app execution.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager, WorkspaceId } from '../WindowManagerContext';
import { desktopWorkspaceService, DEFAULT_GRID_CONFIG } from '../../core/filesystem/DesktopWorkspaceService';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { DesktopShortcut, OrionFile, OrionFolder } from '../../core/filesystem/types';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { useOrionDeviceMode } from '../../lib/useOrionDeviceMode';
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
  Copy,
  FolderInput,
} from 'lucide-react';

/**
 * Robust Viewport Clamping Helper for Desktop Context Menus
 * Keeps popup menus strictly within visible bounds across 1280x800, 1440x900, 1920x1080+,
 * leaving a 48px top margin for the global system bar.
 */
function clampContextMenu(
  x: number,
  y: number,
  menuWidth = 220,
  menuHeight = 310,
  padding = 8,
  minTop = 48
): { x: number; y: number } {
  const vWidth = typeof window !== 'undefined' ? window.innerWidth : 1440;
  const vHeight = typeof window !== 'undefined' ? window.innerHeight : 900;

  let nextX = x;
  let nextY = y;

  if (nextX + menuWidth > vWidth - padding) {
    nextX = Math.max(padding, vWidth - menuWidth - padding);
  }
  if (nextX < padding) {
    nextX = padding;
  }

  if (nextY + menuHeight > vHeight - padding) {
    nextY = Math.max(minTop, vHeight - menuHeight - padding);
  }
  if (nextY < minTop) {
    nextY = minTop;
  }

  return { x: nextX, y: nextY };
}

export function DesktopWorkspace() {
  const { activeWorkspaceId, openApplication } = useWindowManager();
  const { showToast } = useToast();
  const { isTablet, isTouch } = useOrionDeviceMode();

  const [shortcuts, setShortcuts] = useState<DesktopShortcut[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [draggedItem, setDraggedItem] = useState<{ id: string; startX: number; startY: number; curX: number; curY: number } | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Modals / Dialogs / Context Menus
  const [desktopMenu, setDesktopMenu] = useState<{ x: number; y: number } | null>(null);
  const [itemMenu, setItemMenu] = useState<{ x: number; y: number; shortcut: DesktopShortcut } | null>(null);
  const [renameItem, setRenameItem] = useState<DesktopShortcut | null>(null);
  const [renameValue, setRenameValue] = useState<string>('');
  const [propertiesItem, setPropertiesItem] = useState<DesktopShortcut | null>(null);

  // Touch Long-Press Timer references
  const longPressTimerRef = useRef<any>(null);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);
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

  // Global Pointerdown / ESC Dismissal Listener for Context Menus
  useEffect(() => {
    if (!desktopMenu && !itemMenu) return;

    const handleGlobalPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (target?.closest('[data-orion-context-menu="true"]')) {
        return;
      }
      setDesktopMenu(null);
      setItemMenu(null);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDesktopMenu(null);
        setItemMenu(null);
      }
    };

    document.addEventListener('pointerdown', handleGlobalPointerDown, true);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('resize', handleGlobalPointerDown);

    return () => {
      document.removeEventListener('pointerdown', handleGlobalPointerDown, true);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('resize', handleGlobalPointerDown);
    };
  }, [desktopMenu, itemMenu]);

  // Keyboard Shortcuts: Enter, F2, Delete, Ctrl+N, Ctrl+A
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Avoid intercepting if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      const activeSelectedId = Array.from(selectedIds)[0];
      const selectedShortcut = shortcuts.find(s => s.id === activeSelectedId);

      // 1. Enter -> Open
      if (e.key === 'Enter' && selectedShortcut) {
        e.preventDefault();
        handleDoubleClick(selectedShortcut);
      }
      // 2. F2 -> Rename
      else if (e.key === 'F2' && selectedShortcut) {
        e.preventDefault();
        if (selectedShortcut.targetType === 'file' || selectedShortcut.targetType === 'folder') {
          setRenameItem(selectedShortcut);
          setRenameValue(selectedShortcut.name);
        }
      }
      // 3. Delete / Backspace -> Move to Recycle Bin
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedShortcut) {
        e.preventDefault();
        handleDeleteShortcut(selectedShortcut);
      }
      // 4. Ctrl/Cmd+N -> New Document
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleCreateDesktopFile();
      }
      // 5. Ctrl/Cmd+A -> Select All
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setSelectedIds(new Set(shortcuts.map(s => s.id)));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, shortcuts]);

  // Cancel Long-Press Timer Helper
  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    touchStartPosRef.current = null;
  };

  // Canvas Touch / Pointer Down (Desktop Context Menu on Long Press)
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Mouse left click or touch only

    if (e.target !== containerRef.current && (e.target as HTMLElement).dataset.desktopCanvas !== 'true') {
      return;
    }

    setSelectedIds(new Set());
    setDesktopMenu(null);
    setItemMenu(null);

    const clientX = e.clientX;
    const clientY = e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    // Start 600ms long press timer for touch
    cancelLongPress();
    longPressTimerRef.current = setTimeout(() => {
      setDesktopMenu({ x: clientX, y: clientY });
      cancelLongPress();
    }, 600);
  };

  // Item Pointer Down (Drag + Long Press on Icon)
  const handleItemPointerDown = (e: React.PointerEvent, shortcut: DesktopShortcut) => {
    e.stopPropagation();
    if (e.button !== 0 && e.pointerType === 'mouse') return; // Mouse left click or touch only

    // Multi-selection with Ctrl / Shift
    if (e.ctrlKey || e.metaKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(shortcut.id)) next.delete(shortcut.id);
        else next.add(shortcut.id);
        return next;
      });
    } else {
      setSelectedIds(new Set([shortcut.id]));
    }

    const clientX = e.clientX;
    const clientY = e.clientY;
    touchStartPosRef.current = { x: clientX, y: clientY };

    setDraggedItem({
      id: shortcut.id,
      startX: clientX - shortcut.x,
      startY: clientY - shortcut.y,
      curX: shortcut.x,
      curY: shortcut.y,
    });
    setIsDragging(false);

    // Start 600ms long press timer for item menu
    cancelLongPress();
    longPressTimerRef.current = setTimeout(() => {
      if (!isDragging) {
        setItemMenu({ x: clientX, y: clientY, shortcut });
        cancelLongPress();
      }
    }, 600);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (touchStartPosRef.current) {
      const dist = Math.hypot(e.clientX - touchStartPosRef.current.x, e.clientY - touchStartPosRef.current.y);
      // If moved beyond 8px threshold, cancel long-press
      if (dist > 8) {
        cancelLongPress();
      }
    }

    if (!draggedItem) return;
    const newX = e.clientX - draggedItem.startX;
    const newY = e.clientY - draggedItem.startY;

    if (Math.abs(newX - draggedItem.curX) > 6 || Math.abs(newY - draggedItem.curY) > 6) {
      setIsDragging(true);
      cancelLongPress();
    }

    setDraggedItem(prev => (prev ? { ...prev, curX: newX, curY: newY } : null));

    // Detect drop targets under pointer (e.g. folder or Recycle Bin)
    const targetElement = document.elementFromPoint(e.clientX, e.clientY);
    const targetShortcutEl = targetElement?.closest('[data-shortcut-id]');
    const targetShortcutId = targetShortcutEl?.getAttribute('data-shortcut-id');

    if (targetShortcutId && targetShortcutId !== draggedItem.id) {
      const targetShortcut = shortcuts.find(s => s.id === targetShortcutId);
      if (targetShortcut && (targetShortcut.targetType === 'folder' || targetShortcut.targetId === 'recycle-bin')) {
        setDropTargetId(targetShortcut.id);
      } else {
        setDropTargetId(null);
      }
    } else {
      setDropTargetId(null);
    }
  };

  const handlePointerUp = async (e: React.PointerEvent) => {
    cancelLongPress();

    if (!draggedItem) return;

    if (isDragging) {
      // 1. Check if dropped onto a folder or Recycle Bin
      if (dropTargetId) {
        const target = shortcuts.find(s => s.id === dropTargetId);
        const source = shortcuts.find(s => s.id === draggedItem.id);

        if (target && source) {
          if (target.targetId === 'recycle-bin') {
            await handleDeleteShortcut(source);
            showToast(`Moved ${source.name} to Recycle Bin`, 'info', 'Desktop');
          } else if (target.targetType === 'folder') {
            if (source.targetType === 'file') {
              await orionFileSystemService.moveFile(source.targetId, target.targetId);
              showToast(`Moved ${source.name} to ${target.name}`, 'success', 'Desktop');
            }
          }
        }
      } else {
        // 2. Normal drop: Snap to Grid with boundary clamping
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
    }

    setDraggedItem(null);
    setIsDragging(false);
    setDropTargetId(null);
  };

  // Launch item on double-click or tap
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
        name: 'New Text Document',
        extension: 'txt',
        content: '',
        folderId,
      });

      await desktopWorkspaceService.addShortcut({
        targetType: 'file',
        targetId: file.id,
        name: `${file.name}.${file.extension}`,
        iconId: 'notepad',
        isDirectory: false,
        path: `/Desktop/${file.name}.${file.extension}`,
        mimeType: 'text/plain',
        size: 0,
        workspaceId: activeWorkspaceId,
      });

      await loadShortcuts();
      setDesktopMenu(null);
      openApplication('notepad');
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orion:open-file', { detail: { fileId: file.id } }));
      }, 150);
      showToast('Created text document on Desktop', 'success', 'Desktop');
    } catch (e: any) {
      console.error('Failed to create file on Desktop', e);
      showToast(`Couldn't create document: ${e?.message || 'Error'}`, 'error', 'Desktop');
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
        iconId: 'folder',
        isDirectory: true,
        path: `/Desktop/${folder.name}`,
        mimeType: null,
        size: 0,
        workspaceId: activeWorkspaceId,
      });

      await loadShortcuts();
      setDesktopMenu(null);
      showToast('Created folder on Desktop', 'success', 'Desktop');
    } catch (e: any) {
      console.error('Failed to create folder on Desktop', e);
      showToast(`Couldn't create folder: ${e?.message || 'Error'}`, 'error', 'Desktop');
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
      } else {
        await desktopWorkspaceService.renameShortcut(renameItem.id, renameValue.trim());
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
    const iconSize = isTablet ? 54 : 48;
    const iconId = shortcut.iconId || shortcut.icon || shortcut.targetId;

    if (shortcut.targetType === 'folder' || shortcut.isDirectory || iconId === 'folder') {
      return <Folder size={iconSize} className="text-amber-400 drop-shadow" />;
    }
    if (shortcut.targetType === 'file') {
      return <FileText size={iconSize} className="text-cyan-400 drop-shadow" />;
    }
    if (shortcut.targetType === 'application' || shortcut.targetType === 'system') {
      return <OrionAppIcon app={shortcut.targetId} size={iconSize} active={isSelected} />;
    }
    return <HardDrive size={iconSize} className="text-os-accent drop-shadow" />;
  };

  // Clamped positions for portals
  const clampedDesktopPos = desktopMenu ? clampContextMenu(desktopMenu.x, desktopMenu.y, 220, 310) : { x: 0, y: 0 };
  const clampedItemPos = itemMenu ? clampContextMenu(itemMenu.x, itemMenu.y, 220, 250) : { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      data-desktop-canvas="true"
      className="absolute inset-0 z-0 pointer-events-auto overflow-hidden select-none touch-manipulation"
      onPointerDown={handleCanvasPointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={cancelLongPress}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        setItemMenu(null);
        setDesktopMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Desktop Shortcuts Canvas */}
      {shortcuts.map(shortcut => {
        const isBeingDragged = draggedItem?.id === shortcut.id && isDragging;
        const isSelected = selectedIds.has(shortcut.id);
        const isDropTarget = dropTargetId === shortcut.id;
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
            onPointerDown={e => handleItemPointerDown(e, shortcut)}
            onDoubleClick={e => {
              e.stopPropagation();
              handleDoubleClick(shortcut);
            }}
            onContextMenu={e => {
              e.preventDefault();
              e.stopPropagation();
              setSelectedIds(new Set([shortcut.id]));
              setDesktopMenu(null);
              setItemMenu({ x: e.clientX, y: e.clientY, shortcut });
            }}
            className={cn(
              "absolute top-0 left-0 flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer transition-shadow select-none group touch-none min-h-[44px] min-w-[44px]",
              isBeingDragged && "z-50 opacity-90 scale-105 shadow-2xl ring-2 ring-os-accent",
              isDropTarget && "bg-cyan-500/30 ring-2 ring-cyan-400 scale-110",
              isSelected && !isBeingDragged
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

      {/* Desktop Right-Click / Long-Press Context Menu (Portal to Body at z-[2147483500]) */}
      {desktopMenu && typeof document !== 'undefined' && createPortal(
        <div
          data-orion-context-menu="true"
          data-testid="desktop-context-menu"
          className="fixed z-[2147483500] bg-os-surface/98 backdrop-blur-2xl border border-os-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.05)] py-1.5 w-56 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 pointer-events-auto"
          style={{
            top: `${clampedDesktopPos.y}px`,
            left: `${clampedDesktopPos.x}px`,
            zIndex: 2147483500,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-os-text-muted uppercase tracking-wider flex items-center justify-between border-b border-os-border/40 mb-0.5">
            <span className="text-os-text-primary">Desktop Workspace</span>
            {isTablet && <span className="text-os-accent text-[9px] bg-os-accent/10 px-1.5 py-0.5 rounded">Touch</span>}
          </div>

          <button
            type="button"
            onClick={() => {
              window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
              setDesktopMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <RefreshCw size={14} className="text-os-accent" />
            <span>Refresh Desktop</span>
            <span className="ml-auto text-[10px] font-mono text-os-text-muted bg-white/[0.05] px-1.5 py-0.5 rounded border border-os-border/50">F5</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          {/* Sort Actions */}
          <button
            type="button"
            onClick={() => handleAutoArrange('name')}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <ArrowUpDown size={14} className="text-cyan-400" />
            <span>Sort by Name</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoArrange('type')}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Layers size={14} className="text-amber-400" />
            <span>Sort by Item Type</span>
          </button>

          <button
            type="button"
            onClick={() => handleAutoArrange('date')}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Sliders size={14} className="text-purple-400" />
            <span>Sort by Date Modified</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          {/* New Item */}
          <button
            type="button"
            onClick={handleCreateDesktopFile}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Plus size={14} className="text-cyan-400" />
            <span>New Text Document</span>
          </button>

          <button
            type="button"
            onClick={handleCreateDesktopFolder}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Plus size={14} className="text-amber-400" />
            <span>New Folder</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          <button
            type="button"
            onClick={() => {
              openApplication('settings');
              setDesktopMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Sparkles size={14} className="text-os-accent" />
            <span>Personalize Desktop...</span>
          </button>
        </div>,
        document.body
      )}

      {/* Item Right-Click / Long-Press Context Menu (Portal to Body at z-[2147483500]) */}
      {itemMenu && typeof document !== 'undefined' && createPortal(
        <div
          data-orion-context-menu="true"
          data-testid="desktop-item-context-menu"
          className="fixed z-[2147483500] bg-os-surface/98 backdrop-blur-2xl border border-os-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.05)] py-1.5 w-56 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 pointer-events-auto"
          style={{
            top: `${clampedItemPos.y}px`,
            left: `${clampedItemPos.x}px`,
            zIndex: 2147483500,
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-os-text-muted uppercase tracking-wider flex items-center justify-between border-b border-os-border/40 mb-0.5 truncate">
            <span className="truncate">{itemMenu.shortcut.name}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              handleDoubleClick(itemMenu.shortcut);
              setItemMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left font-medium min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <ExternalLink size={14} className="text-os-accent" />
            <span>Open</span>
          </button>

          {(itemMenu.shortcut.targetType === 'file' || itemMenu.shortcut.targetId === 'notepad') && (
            <button
              type="button"
              onClick={() => {
                openApplication('notepad');
                if (itemMenu.shortcut.targetType === 'file') {
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('orion:open-file', { detail: { fileId: itemMenu.shortcut.targetId } })
                    );
                  }, 150);
                }
                setItemMenu(null);
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
            >
              <FileText size={14} className="text-cyan-400" />
              <span>Edit in Notepad</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setRenameItem(itemMenu.shortcut);
              setRenameValue(itemMenu.shortcut.name);
              setItemMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Edit2 size={14} />
            <span>Rename</span>
            <span className="ml-auto text-[10px] font-mono text-os-text-muted bg-white/[0.05] px-1.5 py-0.5 rounded border border-os-border/50">F2</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setPropertiesItem(itemMenu.shortcut);
              setItemMenu(null);
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Info size={14} />
            <span>Properties</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          <button
            type="button"
            onClick={() => handleDeleteShortcut(itemMenu.shortcut)}
            className="flex items-center gap-2 px-3 py-2 hover:bg-rose-500/20 text-rose-400 text-left min-h-[36px] transition-colors rounded-lg mx-1"
          >
            <Trash2 size={14} />
            <span>Move to Recycle Bin</span>
            <span className="ml-auto text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">Del</span>
          </button>
        </div>,
        document.body
      )}

      {/* Rename Modal */}
      {renameItem && typeof document !== 'undefined' && createPortal(
        <div
          style={{ zIndex: 2147483600 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2147483600] flex items-center justify-center p-4 pointer-events-auto"
        >
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-3 animate-in fade-in zoom-in-95">
            <h3 className="text-sm font-semibold text-os-text-primary flex items-center gap-2">
              <Edit2 size={16} className="text-cyan-400" />
              Rename Desktop Shortcut
            </h3>
            <input
              type="text"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleExecuteRename();
                if (e.key === 'Escape') setRenameItem(null);
              }}
              className="bg-os-surface-tint border border-os-border/70 rounded-lg px-3 py-2 text-xs text-os-text-primary outline-none focus:border-os-accent min-h-[44px]"
              autoFocus
            />
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRenameItem(null)}
                className="px-4 py-2 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-secondary text-xs min-h-[44px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteRename}
                className="px-4 py-2 rounded-lg bg-os-accent text-black font-semibold text-xs min-h-[44px]"
              >
                Rename
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Properties Modal */}
      {propertiesItem && typeof document !== 'undefined' && createPortal(
        <div
          style={{ zIndex: 2147483600 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2147483600] flex items-center justify-center p-4 pointer-events-auto"
        >
          <div className="bg-os-surface border border-os-border rounded-xl shadow-2xl w-full max-w-sm p-5 flex flex-col gap-4 animate-in fade-in zoom-in-95">
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
                className="px-4 py-2 rounded-lg bg-os-surface hover:bg-os-surface-hover border border-os-border/50 text-os-text-primary text-xs min-h-[44px]"
              >
                Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
