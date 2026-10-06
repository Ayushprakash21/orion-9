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
import { DesktopShortcut, OrionFile, OrionFolder, DesktopWidgetRecord, WidgetSize } from '../../core/filesystem/types';
import { DesktopWidgetSystem } from './DesktopWidgetSystem';
import { DesktopWidgetGalleryModal, WidgetGalleryItem } from './DesktopWidgetGalleryModal';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import {
  IconDesktopFolder,
  IconDocumentsFolder,
  IconDownloadsFolder,
  IconProjectsFolder,
  IconReportsFolder,
  IconDesktopFileTxt
} from '../icons/OrionSystemIcons';
import { useOrionDeviceMode } from '../../lib/useOrionDeviceMode';
import { useToast } from '../../store/ToastContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
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
  LayoutGrid,
  Check,
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
  const [activeDraggingId, setActiveDraggingId] = useState<string | null>(null);
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
  const dragRef = useRef<{
    pointerId: number;
    shortcutId: string;
    startPointerX: number;
    startPointerY: number;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    moved: boolean;
    element: HTMLElement | null;
  } | null>(null);
  const hasDraggedRef = useRef<boolean>(false);
  const lastClickRef = useRef<{ id: string; time: number } | null>(null);
  const windowListenersRef = useRef<{
    move: (e: PointerEvent) => void;
    up: (e: PointerEvent) => void;
    cancel: (e: PointerEvent) => void;
  } | null>(null);
  const dropTargetIdRef = useRef<string | null>(null);

  // Dedicated DOM node refs for context menus (ensures 100% accurate hit-testing)
  const desktopMenuRef = useRef<HTMLDivElement>(null);
  const itemMenuRef = useRef<HTMLDivElement>(null);
  // Unified action dispatcher ensuring clean execution and menu dismissal
  const handleMenuAction = useCallback((actionFn: () => void | Promise<void>) => {
    try {
      actionFn();
    } finally {
      setDesktopMenu(null);
      setItemMenu(null);
    }
  }, []);

  // Desktop Widgets & Edit Mode State
  const [widgets, setWidgets] = useState<DesktopWidgetRecord[]>([]);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isWidgetGalleryOpen, setIsWidgetGalleryOpen] = useState<boolean>(false);

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

  // Keep shortcutsRef synchronized for asynchronous window pointer callbacks
  const shortcutsRef = useRef<DesktopShortcut[]>(shortcuts);
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  // Delete Desktop Item
  const handleDeleteShortcut = useCallback(async (shortcut: DesktopShortcut) => {
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
  }, [loadShortcuts, showToast]);

  // Load widgets for active workspace
  const loadWidgets = useCallback(async () => {
    try {
      const list = await desktopWorkspaceService.ensureDefaultWidgets(activeWorkspaceId);
      setWidgets(list);
    } catch (e) {
      console.error('Failed to load desktop widgets', e);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    loadShortcuts();
    loadWidgets();
  }, [loadShortcuts, loadWidgets]);

  const handleWidgetMoveStart = (e: React.PointerEvent, widget: DesktopWidgetRecord) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const initX = widget.x;
    const initY = widget.y;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      const dx = moveEvt.clientX - startX;
      const dy = moveEvt.clientY - startY;

      const newX = Math.max(16, Math.min(window.innerWidth - widget.width - 16, initX + dx));
      const newY = Math.max(52, Math.min(window.innerHeight - widget.height - 84, initY + dy));

      setWidgets((prev) =>
        prev.map((w) => (w.id === widget.id ? { ...w, x: newX, y: newY } : w))
      );
    };

    const handlePointerUp = async (upEvt: PointerEvent) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);

      const dx = upEvt.clientX - startX;
      const dy = upEvt.clientY - startY;
      const finalX = Math.max(16, Math.min(window.innerWidth - widget.width - 16, initX + dx));
      const finalY = Math.max(52, Math.min(window.innerHeight - widget.height - 84, initY + dy));

      const updated = { ...widget, x: finalX, y: finalY };
      setWidgets((prev) => prev.map((w) => (w.id === widget.id ? updated : w)));
      await desktopWorkspaceService.saveWidget(updated);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const handleRemoveWidget = async (widgetId: string) => {
    await desktopWorkspaceService.removeWidget(widgetId);
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
    showToast('Widget removed from desktop', 'info');
  };

  const handleResizeWidget = async (widgetId: string, newSize: WidgetSize) => {
    const target = widgets.find(w => w.id === widgetId);
    if (!target) return;
    const width = newSize === 'SMALL' ? 240 : newSize === 'MEDIUM' ? 340 : 440;
    const height = newSize === 'SMALL' ? 150 : newSize === 'MEDIUM' ? 180 : 250;
    const updated = { ...target, size: newSize, width, height };
    await desktopWorkspaceService.saveWidget(updated);
    setWidgets(prev => prev.map(w => w.id === widgetId ? updated : w));
  };

  const handleAddWidgetFromGallery = async (item: WidgetGalleryItem) => {
    const now = new Date().toISOString();
    const activeEnv = dbManager.getEnvironment();
    const id = `widget_${activeWorkspaceId}_${item.type}_${Date.now()}`;

    const x = Math.min(1200, window.innerWidth - item.dimensions.width - 40);
    const y = 52 + (widgets.length * 40) % (window.innerHeight - 300);

    const newWidget: DesktopWidgetRecord = {
      id,
      widgetType: item.type,
      title: item.title,
      size: item.defaultSize,
      x,
      y,
      width: item.dimensions.width,
      height: item.dimensions.height,
      zIndex: 10,
      visible: true,
      workspaceId: activeWorkspaceId,
      ownerId: 'user_current',
      tenantId: 'tenant_default',
      organizationId: 'ORION_PLATFORM',
      environment: activeEnv,
      createdAt: now,
      updatedAt: now,
    };

    await desktopWorkspaceService.saveWidget(newWidget);
    setWidgets((prev) => [...prev, newWidget]);
    showToast(`Added ${item.title} to desktop`, 'success');
  };

  // Listen for refresh event
  useEffect(() => {
    const handleRefresh = () => {
      loadShortcuts();
      loadWidgets();
    };
    window.addEventListener('orion:desktop-refresh', handleRefresh);
    window.addEventListener('orion:filesystem-change', handleRefresh);
    return () => {
      window.removeEventListener('orion:desktop-refresh', handleRefresh);
      window.removeEventListener('orion:filesystem-change', handleRefresh);
    };
  }, [loadShortcuts, loadWidgets]);

  // Global Pointerdown / ESC Dismissal Listener for Context Menus
  useEffect(() => {
    if (!desktopMenu && !itemMenu) return;

    const handleGlobalPointerDown = (e: Event) => {
      // 1. Direct Node containment check against active menu refs
      const rawTarget = e.target as Node | null;
      if (rawTarget) {
        if (desktopMenuRef.current && (desktopMenuRef.current === rawTarget || desktopMenuRef.current.contains(rawTarget))) {
          return;
        }
        if (itemMenuRef.current && (itemMenuRef.current === rawTarget || itemMenuRef.current.contains(rawTarget))) {
          return;
        }
      }

      // 2. Check composedPath (handles SVG child nodes, Shadow DOM, and detached elements)
      if (typeof (e as any).composedPath === 'function') {
        const path = (e as any).composedPath();
        if (
          (desktopMenuRef.current && path.includes(desktopMenuRef.current)) ||
          (itemMenuRef.current && path.includes(itemMenuRef.current))
        ) {
          return;
        }
        const clickedInsideMenu = path.some((el: any) => {
          if (!el || !(el instanceof Element)) return false;
          return (
            el.hasAttribute('data-orion-context-menu') ||
            el.getAttribute('data-orion-context-menu') === 'true' ||
            el.closest?.('[data-orion-context-menu="true"]') != null
          );
        });
        if (clickedInsideMenu) {
          return;
        }
      }

      // 3. Fallback check using target / parentElement
      const targetEl = rawTarget instanceof Element ? rawTarget : rawTarget?.parentElement;
      if (targetEl?.closest?.('[data-orion-context-menu="true"]')) {
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

    cancelLongPress();
    // Long press context menu is strictly for touch devices
    if (e.pointerType === 'touch') {
      const clientX = e.clientX;
      const clientY = e.clientY;
      touchStartPosRef.current = { x: clientX, y: clientY };
      longPressTimerRef.current = setTimeout(() => {
        setDesktopMenu({ x: clientX, y: clientY });
        cancelLongPress();
      }, 600);
    }
  };

  // Cleanup Window Drag Listeners
  const cleanupDragListeners = useCallback(() => {
    if (windowListenersRef.current) {
      window.removeEventListener('pointermove', windowListenersRef.current.move, true);
      window.removeEventListener('pointerup', windowListenersRef.current.up, true);
      window.removeEventListener('pointercancel', windowListenersRef.current.cancel, true);
      document.removeEventListener('pointermove', windowListenersRef.current.move, true);
      document.removeEventListener('pointerup', windowListenersRef.current.up, true);
      document.removeEventListener('pointercancel', windowListenersRef.current.cancel, true);
      windowListenersRef.current = null;
    }
  }, []);

  // Ensure window drag listeners are cleaned up if component unmounts during drag
  useEffect(() => {
    return () => {
      cleanupDragListeners();
    };
  }, [cleanupDragListeners]);

  // Window-level Pointer Move: Continuously tracks icon position anywhere on screen
  const handleWindowPointerMove = useCallback((e: PointerEvent) => {
    const session = dragRef.current;
    if (!session || session.pointerId !== e.pointerId) return;

    const dx = e.clientX - session.startPointerX;
    const dy = e.clientY - session.startPointerY;

    // Movement threshold: 5px
    if (!session.moved) {
      if (Math.hypot(dx, dy) >= 5) {
        session.moved = true;
        cancelLongPress();
        if (session.element) {
          session.element.classList.add('cursor-grabbing', 'opacity-90', 'scale-105', 'shadow-2xl', 'ring-1', 'ring-sky-500/50');
          session.element.classList.remove('cursor-grab');
        }
        setActiveDraggingId(session.shortcutId);
      } else {
        return;
      }
    }

    const vWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
    const vHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
    const clampedX = Math.max(
      DEFAULT_GRID_CONFIG.paddingX,
      Math.min(vWidth - DEFAULT_GRID_CONFIG.cellWidth - DEFAULT_GRID_CONFIG.paddingX, session.startX + dx)
    );
    const clampedY = Math.max(
      DEFAULT_GRID_CONFIG.paddingY,
      Math.min(vHeight - DEFAULT_GRID_CONFIG.cellHeight - DEFAULT_GRID_CONFIG.bottomPadding, session.startY + dy)
    );

    session.currentX = clampedX;
    session.currentY = clampedY;

    // Active drag: prevent native gesture scrolling and text selection during drag
    e.preventDefault();

    // Direct synchronous DOM update for zero-latency 60/120fps tracking without React re-render lag
    if (session.element) {
      session.element.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
      session.element.style.zIndex = '1000';
    }

    // Detect drop targets under pointer (e.g. folder or Recycle Bin) using elementsFromPoint
    const elements = document.elementsFromPoint(e.clientX, e.clientY);
    const targetShortcutEl = elements.find(el => {
      const scEl = el.closest('[data-shortcut-id]');
      return scEl && scEl.getAttribute('data-shortcut-id') !== session.shortcutId;
    })?.closest('[data-shortcut-id]');

    const targetShortcutId = targetShortcutEl?.getAttribute('data-shortcut-id') || null;
    let validDropTargetId: string | null = null;

    if (targetShortcutId) {
      const targetShortcut = shortcutsRef.current.find(s => s.id === targetShortcutId);
      if (targetShortcut && (targetShortcut.targetType === 'folder' || targetShortcut.targetId === 'recycle-bin')) {
        validDropTargetId = targetShortcut.id;
      }
    }

    if (dropTargetIdRef.current !== validDropTargetId) {
      dropTargetIdRef.current = validDropTargetId;
      setDropTargetId(validDropTargetId);
    }
  }, []);

  // Launch item on double-click or tap
  const handleDoubleClick = useCallback((shortcut: DesktopShortcut) => {
    if (hasDraggedRef.current || (dragRef.current && dragRef.current.moved)) {
      return;
    }
    if (shortcut.targetType === 'application' || shortcut.targetType === 'system') {
      openApplication(shortcut.targetId, activeWorkspaceId);
    } else if (shortcut.targetType === 'file') {
      openApplication('notepad', activeWorkspaceId);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orion:open-file', { detail: { fileId: shortcut.targetId } }));
      }, 150);
    } else if (shortcut.targetType === 'folder') {
      openApplication('file-manager', activeWorkspaceId);
    }
  }, [openApplication, activeWorkspaceId]);

  // Window-level Pointer Up: Finishes drag, snaps to grid and persists
  const handleWindowPointerUp = useCallback(async (e: PointerEvent) => {
    // 1. Remove window listeners FIRST
    cleanupDragListeners();
    cancelLongPress();
    const session = dragRef.current;

    if (session && session.pointerId === e.pointerId) {
      if (session.element) {
        try {
          if (session.element.hasPointerCapture(session.pointerId)) {
            session.element.releasePointerCapture(session.pointerId);
          }
        } catch (err) {}
        session.element.classList.remove('cursor-grabbing', 'opacity-90', 'scale-105', 'shadow-2xl', 'ring-1', 'ring-sky-500/50', 'ring-2', 'ring-cyan-400');
        session.element.classList.add('cursor-grab');
      }

      if (session.moved) {
        hasDraggedRef.current = true;
        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 300);

        const vWidth = typeof window !== 'undefined' ? window.innerWidth : 1920;
        const vHeight = typeof window !== 'undefined' ? window.innerHeight : 1080;
        const finalX = session.currentX;
        const finalY = session.currentY;

        const currentDropTargetId = dropTargetIdRef.current;
        if (currentDropTargetId) {
          if (session.element) {
            session.element.style.transform = `translate3d(${session.startX}px, ${session.startY}px, 0)`;
            session.element.style.zIndex = '';
          }
          const target = shortcutsRef.current.find(s => s.id === currentDropTargetId);
          const source = shortcutsRef.current.find(s => s.id === session.shortcutId);

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
          // Normal drop: Snap to Grid with boundary clamping & persist
          try {
            const updated = await desktopWorkspaceService.updateShortcutPosition(
              session.shortcutId,
              finalX,
              finalY,
              vWidth,
              vHeight
            );
            if (session.element) {
              session.element.style.transform = `translate3d(${updated.x}px, ${updated.y}px, 0)`;
              session.element.style.zIndex = '';
            }
            setShortcuts(prev => prev.map(s => (s.id === updated.id ? updated : s)));
          } catch (err) {
            console.error('Failed to save icon position', err);
            if (session.element) {
              session.element.style.transform = `translate3d(${session.startX}px, ${session.startY}px, 0)`;
              session.element.style.zIndex = '';
            }
          }
        }
      } else {
        // If not moved (pure click), do not wipe out transform which positions the shortcut!
        if (session.element) {
          session.element.style.zIndex = '';
        }

        // Fast double click detection across touch and mouse
        const now = Date.now();
        if (lastClickRef.current && lastClickRef.current.id === session.shortcutId && now - lastClickRef.current.time < 400) {
          lastClickRef.current = null;
          const targetSc = shortcutsRef.current.find(s => s.id === session.shortcutId);
          if (targetSc) {
            handleDoubleClick(targetSc);
          }
        } else {
          lastClickRef.current = { id: session.shortcutId, time: now };
        }
      }

      dragRef.current = null;
    }

    setActiveDraggingId(null);
    setDropTargetId(null);
    dropTargetIdRef.current = null;
  }, [cleanupDragListeners, handleDoubleClick, handleDeleteShortcut, showToast]);

  // Window-level Pointer Cancel: Safely aborts drag session
  const handleWindowPointerCancel = useCallback((e: PointerEvent) => {
    cleanupDragListeners();
    cancelLongPress();
    const session = dragRef.current;
    if (session && session.pointerId === e.pointerId) {
      if (session.element) {
        try {
          if (session.element.hasPointerCapture(session.pointerId)) {
            session.element.releasePointerCapture(session.pointerId);
          }
        } catch (err) {}
        session.element.style.transform = '';
        session.element.style.zIndex = '';
        session.element.classList.remove('cursor-grabbing', 'opacity-90', 'scale-105', 'shadow-2xl', 'ring-1', 'ring-sky-500/50', 'ring-2', 'ring-cyan-400');
        session.element.classList.add('cursor-grab');
      }
      dragRef.current = null;
    }
    setActiveDraggingId(null);
    setDropTargetId(null);
    dropTargetIdRef.current = null;
  }, [cleanupDragListeners]);

  // Shortcut Pointer Down: establishes drag session and registers window/document listeners
  const handleShortcutPointerDown = (e: React.PointerEvent<HTMLElement>, shortcut: DesktopShortcut) => {
    // If pointer is mouse, only button 0 (left-click) starts drag. Button 2 (right-click) MUST NEVER start drag.
    if (e.pointerType === 'mouse' && e.button !== 0) {
      return;
    }

    // Stop propagation to prevent desktop canvas from deselecting
    e.stopPropagation();

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
    const targetElement = e.currentTarget;

    dragRef.current = {
      pointerId: e.pointerId,
      shortcutId: shortcut.id,
      startPointerX: clientX,
      startPointerY: clientY,
      startX: shortcut.x,
      startY: shortcut.y,
      currentX: shortcut.x,
      currentY: shortcut.y,
      moved: false,
      element: targetElement,
    };

    // Register capture-phase window and document pointermove, pointerup, pointercancel
    cleanupDragListeners();
    const onMove = (evt: PointerEvent) => handleWindowPointerMove(evt);
    const onUp = (evt: PointerEvent) => handleWindowPointerUp(evt);
    const onCancel = (evt: PointerEvent) => handleWindowPointerCancel(evt);

    windowListenersRef.current = { move: onMove, up: onUp, cancel: onCancel };
    window.addEventListener('pointermove', onMove, { passive: false, capture: true });
    window.addEventListener('pointerup', onUp, { passive: false, capture: true });
    window.addEventListener('pointercancel', onCancel, { passive: false, capture: true });
    document.addEventListener('pointermove', onMove, { passive: false, capture: true });
    document.addEventListener('pointerup', onUp, { passive: false, capture: true });
    document.addEventListener('pointercancel', onCancel, { passive: false, capture: true });

    // For touch devices: preserve touch long-press context menu if not moved
    if (e.pointerType === 'touch') {
      touchStartPosRef.current = { x: clientX, y: clientY };
      cancelLongPress();
      longPressTimerRef.current = setTimeout(() => {
        if (dragRef.current && !dragRef.current.moved) {
          setItemMenu({ x: clientX, y: clientY, shortcut });
          cancelLongPress();
        }
      }, 600);
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
  const handleCreateDesktopFile = async (ext: 'txt' | 'docx' | 'xlsx' | 'pptx' = 'txt') => {
    try {
      const desktopFolder = await orionFileSystemService.getSystemFolder('desktop');
      const folderId = desktopFolder ? desktopFolder.id : 'folder_sys_desktop_tenant_default';
      
      let defaultName = 'New Text Document';
      let iconId = 'notepad';
      let targetApp = 'notepad';
      let mimeType = 'text/plain';

      if (ext === 'docx') {
        defaultName = 'New Document';
        iconId = 'orion-documents';
        targetApp = 'orion-documents';
        mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      } else if (ext === 'xlsx') {
        defaultName = 'New Spreadsheet';
        iconId = 'orion-sheets';
        targetApp = 'orion-sheets';
        mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      } else if (ext === 'pptx') {
        defaultName = 'New Presentation';
        iconId = 'orion-slides';
        targetApp = 'orion-slides';
        mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      }

      const file = await orionFileSystemService.createFile({
        name: defaultName,
        extension: ext,
        content: '',
        mimeType,
        folderId,
      });

      await desktopWorkspaceService.addShortcut({
        targetType: 'file',
        targetId: file.id,
        name: `${file.name}.${file.extension}`,
        iconId,
        isDirectory: false,
        path: `/Desktop/${file.name}.${file.extension}`,
        mimeType,
        size: 0,
        workspaceId: activeWorkspaceId,
      });

      await loadShortcuts();
      setDesktopMenu(null);
      openApplication(targetApp);
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('orion:open-file', { detail: { fileId: file.id } }));
      }, 150);
      showToast(`Created ${defaultName} on Desktop`, 'success', 'Desktop');
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

  // Create Application Shortcut on Desktop
  const handleCreateDesktopShortcut = async () => {
    try {
      await desktopWorkspaceService.addShortcut({
        targetType: 'application',
        targetId: 'control-tower',
        name: 'Control Tower',
        iconId: 'control-tower',
        isDirectory: false,
        path: '/Apps/ControlTower',
        workspaceId: activeWorkspaceId,
      });
      await loadShortcuts();
      showToast('Added Control Tower Shortcut to Desktop', 'success', 'Desktop');
    } catch (e: any) {
      console.error('Failed to create shortcut on Desktop', e);
      showToast(`Couldn't create shortcut: ${e?.message || 'Error'}`, 'error', 'Desktop');
    }
  };

  // Duplicate / Create Shortcut for Item
  const handleDuplicateShortcut = async (shortcut: DesktopShortcut) => {
    try {
      await desktopWorkspaceService.addShortcut({
        targetType: shortcut.targetType,
        targetId: shortcut.targetId,
        name: `${shortcut.name} - Shortcut`,
        iconId: shortcut.iconId || shortcut.targetId,
        isDirectory: shortcut.isDirectory,
        path: shortcut.path,
        mimeType: shortcut.mimeType,
        size: shortcut.size,
        workspaceId: activeWorkspaceId,
      });
      await loadShortcuts();
      setItemMenu(null);
      showToast(`Created shortcut for ${shortcut.name}`, 'success', 'Desktop');
    } catch (e: any) {
      console.error('Failed to duplicate shortcut', e);
      showToast(`Couldn't create shortcut: ${e?.message || 'Error'}`, 'error', 'Desktop');
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

    if (shortcut.targetId === 'documents-folder') {
      return <IconDocumentsFolder size={iconSize} active={isSelected} />;
    }
    if (shortcut.targetId === 'downloads-folder') {
      return <IconDownloadsFolder size={iconSize} active={isSelected} />;
    }
    if (shortcut.targetId === 'projects-folder') {
      return <IconProjectsFolder size={iconSize} active={isSelected} />;
    }
    if (shortcut.targetId === 'reports-folder') {
      return <IconReportsFolder size={iconSize} active={isSelected} />;
    }
    if (shortcut.targetType === 'folder' || shortcut.isDirectory || iconId === 'folder') {
      return <IconDesktopFolder size={iconSize} active={isSelected} />;
    }
    if (shortcut.targetType === 'file') {
      const name = shortcut.name.toLowerCase();
      if (name.endsWith('.docx') || shortcut.mimeType?.includes('wordprocessingml')) {
        return <OrionAppIcon app="orion-documents" size={iconSize} active={isSelected} />;
      }
      if (name.endsWith('.xlsx') || shortcut.mimeType?.includes('spreadsheetml')) {
        return <OrionAppIcon app="orion-sheets" size={iconSize} active={isSelected} />;
      }
      if (name.endsWith('.pptx') || shortcut.mimeType?.includes('presentationml')) {
        return <OrionAppIcon app="orion-slides" size={iconSize} active={isSelected} />;
      }
      if (name.endsWith('.pdf') || shortcut.mimeType?.includes('pdf')) {
        return <OrionAppIcon app="orion-pdf" size={iconSize} active={isSelected} />;
      }
      return <IconDesktopFileTxt size={iconSize} active={isSelected} />;
    }
    if (shortcut.targetType === 'application' || shortcut.targetType === 'system') {
      return <OrionAppIcon app={shortcut.targetId} size={iconSize} active={isSelected} />;
    }
    return <HardDrive size={iconSize} className="text-os-accent drop-shadow" />;
  };

  // Clamped positions for portals
  const clampedDesktopPos = desktopMenu ? clampContextMenu(desktopMenu.x, desktopMenu.y, 240, 420) : { x: 0, y: 0 };
  const clampedItemPos = itemMenu ? clampContextMenu(itemMenu.x, itemMenu.y, 220, 290) : { x: 0, y: 0 };

  return (
    <div
      ref={containerRef}
      data-desktop-canvas="true"
      className="absolute inset-0 z-0 pointer-events-auto overflow-hidden select-none touch-manipulation"
      onPointerDown={handleCanvasPointerDown}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={e => {
        e.preventDefault();
        e.stopPropagation();
        setItemMenu(null);
        setDesktopMenu({ x: e.clientX, y: e.clientY });
      }}
    >
      {/* Edit Mode Top Governance Banner */}
      {isEditMode && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-[2147483600] bg-[#12151a]/95 border border-white/[0.12] shadow-2xl rounded-2xl px-5 py-2 flex items-center gap-4 backdrop-blur-xl animate-in fade-in slide-in-from-top-4 select-none pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-sky-400" />
            <span className="text-xs font-semibold text-os-text-primary tracking-wide">Spatial Edit Mode</span>
          </div>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsWidgetGalleryOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Widget</span>
            </button>
            <button
              type="button"
              onClick={handleCreateDesktopShortcut}
              className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.14] text-os-text-primary font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-os-text-secondary" />
              <span>Add Shortcut</span>
            </button>
            <button
              type="button"
              onClick={handleCreateDesktopFolder}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>New Folder</span>
            </button>
            <button
              type="button"
              onClick={() => handleCreateDesktopFile()}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-400" />
              <span>New Document</span>
            </button>
          </div>
          <div className="h-4 w-px bg-white/20" />
          <button
            type="button"
            onClick={() => setIsEditMode(false)}
            className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      )}

      {/* Spatial Widgets Canvas */}
      {widgets.map((widget) => {
        const maxX = typeof window !== 'undefined' ? Math.max(16, window.innerWidth - widget.width - 16) : widget.x;
        const clampedWidget = {
          ...widget,
          x: Math.min(widget.x, maxX),
        };
        return (
          <DesktopWidgetSystem
            key={widget.id}
            widget={clampedWidget}
            isEditMode={isEditMode}
            onRemove={handleRemoveWidget}
            onResize={handleResizeWidget}
            onMoveStart={handleWidgetMoveStart}
          />
        );
      })}

      {/* Desktop Shortcuts Canvas */}
      {shortcuts.map(shortcut => {
        const isSelected = selectedIds.has(shortcut.id);
        const isDropTarget = dropTargetId === shortcut.id;
        const isBeingDragged = activeDraggingId === shortcut.id;

        return (
          <React.Fragment key={shortcut.id}>
            {/* Ghost Slot Placeholder when item is actively dragged */}
            {isBeingDragged && (
              <div
                data-testid={`desktop-shortcut-ghost-${shortcut.targetId}`}
                style={{
                  transform: `translate3d(${shortcut.x}px, ${shortcut.y}px, 0)`,
                  width: `${DEFAULT_GRID_CONFIG.cellWidth}px`,
                  minHeight: `${DEFAULT_GRID_CONFIG.cellHeight}px`,
                }}
                className="absolute top-0 left-0 flex flex-col items-center justify-start p-2 rounded-xl border-2 border-dashed border-white/20 bg-white/[0.04] opacity-50 pointer-events-none z-10"
              >
                <div className="opacity-30 grayscale">
                  {renderShortcutIcon(shortcut, false)}
                </div>
                <div className="mt-1.5 w-full max-w-[140px] px-1 text-center text-[10px] font-mono text-os-text-muted truncate">
                  {shortcut.name}
                </div>
              </div>
            )}

            <div
              data-shortcut-id={shortcut.id}
              data-target-id={shortcut.targetId}
              data-testid={`desktop-shortcut-${shortcut.targetId}`}
              style={{
                transform: `translate3d(${shortcut.x}px, ${shortcut.y}px, 0)`,
                width: `${DEFAULT_GRID_CONFIG.cellWidth}px`,
                minHeight: `${DEFAULT_GRID_CONFIG.cellHeight}px`,
                zIndex: isBeingDragged ? 1000 : (isSelected ? 25 : 20),
              }}
              onPointerDown={e => handleShortcutPointerDown(e, shortcut)}
              onDragStart={e => e.preventDefault()}
              onDoubleClick={e => {
                e.stopPropagation();
                handleDoubleClick(shortcut);
              }}
              onContextMenu={e => {
                e.preventDefault();
                e.stopPropagation();
                cancelLongPress();
                cleanupDragListeners();
                if (dragRef.current?.element) {
                  try {
                    if (dragRef.current.element.hasPointerCapture(dragRef.current.pointerId)) {
                      dragRef.current.element.releasePointerCapture(dragRef.current.pointerId);
                    }
                  } catch {}
                  dragRef.current.element.style.transform = '';
                  dragRef.current.element.style.zIndex = '';
                  dragRef.current.element.classList.remove('cursor-grabbing', 'opacity-90', 'scale-105', 'shadow-2xl', 'ring-1', 'ring-sky-500/50', 'ring-2', 'ring-cyan-400');
                  dragRef.current.element.classList.add('cursor-grab');
                }
                dragRef.current = null;
                setActiveDraggingId(null);
                setDropTargetId(null);
                dropTargetIdRef.current = null;
                setSelectedIds(new Set([shortcut.id]));
                setDesktopMenu(null);
                setItemMenu({ x: e.clientX, y: e.clientY, shortcut });
              }}
              className={cn(
                "absolute top-0 left-0 flex flex-col items-center justify-start p-2 rounded-xl transition-all duration-150 select-none group touch-none min-h-[44px] min-w-[44px] cursor-grab focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-os-accent",
                isBeingDragged && "cursor-grabbing z-[1000] opacity-90 scale-105 shadow-2xl ring-1 ring-sky-500/50 backdrop-blur-md",
                isDropTarget && "bg-sky-500/20 ring-2 ring-sky-500/40 scale-105 shadow-lg z-30",
                isSelected && !isBeingDragged
                  ? "bg-os-accent/20 border border-os-accent/50 shadow-md backdrop-blur-xs z-25"
                  : "hover:bg-os-surface-hover/30 hover:scale-[1.04] active:scale-[0.96] border border-transparent"
              )}
            >
              <div className="group-hover:scale-105 transition-transform pointer-events-none">
                {renderShortcutIcon(shortcut, isSelected)}
              </div>
              <div
                className={cn(
                  "mt-1.5 w-full max-w-[140px] px-1 text-center text-[11px] font-medium leading-[15px] whitespace-normal break-words overflow-visible transition-colors drop-shadow-md pointer-events-none",
                  isSelected
                    ? "text-os-accent font-semibold bg-black/40 rounded"
                    : "text-os-text-primary group-hover:text-os-text-primary"
                )}
                title={shortcut.name}
              >
                {shortcut.name}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Desktop Right-Click / Long-Press Context Menu (Portal to Body at z-[2147483500]) */}
      {desktopMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={desktopMenuRef}
          data-orion-context-menu="true"
          data-testid="desktop-context-menu"
          className="fixed z-[2147483500] bg-os-surface/98 backdrop-blur-2xl border border-os-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.05)] py-1.5 w-60 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 pointer-events-auto select-none"
          style={{
            top: `${clampedDesktopPos.y}px`,
            left: `${clampedDesktopPos.x}px`,
            zIndex: 2147483500,
          }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-os-text-muted uppercase tracking-wider flex items-center justify-between border-b border-os-border/40 mb-0.5">
            <span className="text-os-text-primary">Orion Desktop</span>
            {isTablet && <span className="text-os-accent text-[9px] bg-os-accent/10 px-1.5 py-0.5 rounded">Touch</span>}
          </div>

          <button
            type="button"
            data-action="refresh"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => {
                window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));
              });
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <RefreshCw size={14} className="text-os-accent pointer-events-none shrink-0" />
            <span className="pointer-events-none">Refresh Desktop</span>
            <span className="ml-auto text-[10px] font-mono text-os-text-muted bg-white/[0.05] px-1.5 py-0.5 rounded border border-os-border/50 pointer-events-none">F5</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          {/* Sort Actions */}
          <button
            type="button"
            data-action="sort-name"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleAutoArrange('name'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <ArrowUpDown size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">Sort by Name</span>
          </button>

          <button
            type="button"
            data-action="sort-type"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleAutoArrange('type'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Layers size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">Sort by Item Type</span>
          </button>

          <button
            type="button"
            data-action="sort-date"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleAutoArrange('date'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Sliders size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">Sort by Date Modified</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          {/* New Folder & Documents */}
          <button
            type="button"
            data-action="new-folder"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleCreateDesktopFolder());
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Plus size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">New Folder</span>
          </button>

          <button
            type="button"
            data-action="new-doc-docx"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleCreateDesktopFile('docx'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Plus size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">New Document (.docx)</span>
          </button>

          <button
            type="button"
            data-action="new-doc-xlsx"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleCreateDesktopFile('xlsx'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Plus size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">New Spreadsheet (.xlsx)</span>
          </button>

          <button
            type="button"
            data-action="new-doc-pptx"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleCreateDesktopFile('pptx'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Plus size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">New Presentation (.pptx)</span>
          </button>

          <button
            type="button"
            data-action="new-doc-txt"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleCreateDesktopFile('txt'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Plus size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">New Text Document (.txt)</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          {/* Widgets & Customization */}
          <button
            type="button"
            data-action="widgets"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => setIsWidgetGalleryOpen(true));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <LayoutGrid size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none font-medium">Widgets</span>
          </button>

          <button
            type="button"
            data-action="customize-desktop"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => setIsEditMode(true));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Sliders size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none font-medium">Customize Desktop</span>
          </button>

          <button
            type="button"
            data-action="personalize"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => openApplication('settings'));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Sparkles size={14} className="text-os-accent pointer-events-none shrink-0" />
            <span className="pointer-events-none">Personalize Desktop...</span>
          </button>
        </div>,
        document.body
      )}

      {/* Item Right-Click / Long-Press Context Menu (Portal to Body at z-[2147483500]) */}
      {itemMenu && typeof document !== 'undefined' && createPortal(
        <div
          ref={itemMenuRef}
          data-orion-context-menu="true"
          data-testid="desktop-item-context-menu"
          className="fixed z-[2147483500] bg-os-surface/98 backdrop-blur-2xl border border-os-border rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.85),0_0_0_1px_rgba(255,255,255,0.05)] py-1.5 w-56 text-xs flex flex-col gap-0.5 animate-in fade-in zoom-in-95 pointer-events-auto select-none"
          style={{
            top: `${clampedItemPos.y}px`,
            left: `${clampedItemPos.x}px`,
            zIndex: 2147483500,
          }}
          onPointerDown={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
          onPointerUp={e => e.stopPropagation()}
          onMouseUp={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div className="px-3 py-1.5 text-[10px] font-bold text-os-text-muted uppercase tracking-wider flex items-center justify-between border-b border-os-border/40 mb-0.5 truncate">
            <span className="truncate">{itemMenu.shortcut.name}</span>
          </div>

          <button
            type="button"
            data-action="open"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleDoubleClick(itemMenu.shortcut));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left font-medium min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <ExternalLink size={14} className="text-os-accent pointer-events-none shrink-0" />
            <span className="pointer-events-none">Open</span>
          </button>

          {itemMenu.shortcut.targetType === 'file' && (
            <button
              type="button"
              data-action="edit-file"
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction(() => {
                  const name = itemMenu.shortcut.name.toLowerCase();
                  let app = 'notepad';
                  if (name.endsWith('.docx')) app = 'orion-documents';
                  else if (name.endsWith('.xlsx')) app = 'orion-sheets';
                  else if (name.endsWith('.pptx')) app = 'orion-slides';
                  else if (name.endsWith('.pdf')) app = 'orion-pdf';

                  openApplication(app);
                  setTimeout(() => {
                    window.dispatchEvent(
                      new CustomEvent('orion:open-file', { detail: { fileId: itemMenu.shortcut.targetId } })
                    );
                  }, 150);
                });
              }}
              className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
            >
              <FileText size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
              <span className="pointer-events-none">Edit / View Content</span>
            </button>
          )}

          <button
            type="button"
            data-action="rename"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => {
                setRenameItem(itemMenu.shortcut);
                setRenameValue(itemMenu.shortcut.name);
              });
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Edit2 size={14} className="pointer-events-none shrink-0" />
            <span className="pointer-events-none">Rename</span>
            <span className="ml-auto text-[10px] font-mono text-os-text-muted bg-white/[0.05] px-1.5 py-0.5 rounded border border-os-border/50 pointer-events-none">F2</span>
          </button>

          <button
            type="button"
            data-action="create-shortcut"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleDuplicateShortcut(itemMenu.shortcut));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Copy size={14} className="text-os-text-secondary pointer-events-none shrink-0" />
            <span className="pointer-events-none">Create Shortcut</span>
          </button>

          <button
            type="button"
            data-action="properties"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => setPropertiesItem(itemMenu.shortcut));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-os-surface-hover text-os-text-primary text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Info size={14} className="pointer-events-none shrink-0" />
            <span className="pointer-events-none">Properties</span>
          </button>

          <div className="h-px bg-os-border/50 my-1 mx-2" />

          <button
            type="button"
            data-action="delete"
            onClick={(e) => {
              e.stopPropagation();
              handleMenuAction(() => handleDeleteShortcut(itemMenu.shortcut));
            }}
            className="flex items-center gap-2 px-3 py-2 hover:bg-rose-500/20 text-rose-400 text-left min-h-[36px] transition-colors rounded-lg mx-1 cursor-pointer"
          >
            <Trash2 size={14} className="pointer-events-none shrink-0" />
            <span className="pointer-events-none">Move to Recycle Bin</span>
            <span className="ml-auto text-[10px] font-mono text-rose-400/80 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 pointer-events-none">Del</span>
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
              <Edit2 size={16} className="text-os-accent" />
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
                className="px-4 py-2 rounded-lg bg-os-accent text-white font-semibold text-xs min-h-[44px]"
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
                <Info size={16} className="text-os-accent" />
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

      {/* Widget Gallery Modal */}
      <DesktopWidgetGalleryModal
        isOpen={isWidgetGalleryOpen}
        onClose={() => setIsWidgetGalleryOpen(false)}
        onAddWidget={handleAddWidgetFromGallery}
      />
    </div>
  );
}
