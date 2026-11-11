import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppWindow, useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { getAppComponent } from '../OrionComponentMap';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { useToast } from '../../store/ToastContext';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { useResponsiveLayout } from '../../lib/useResponsiveLayout';
import { RotateCcw, AlertTriangle, Move, Maximize2, Minus, Square, X } from 'lucide-react';
import { OrionWindowControls } from './OrionWindowControls';
import { useOSGeometry } from '../dock/DockGeometry';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { dockGeometryRegistry } from '../dock/DockGeometryRegistry';
import { ORION_SPRING_WINDOW, ORION_SPRING_SMOOTH, isReducedMotionPreferred } from '../motion/OrionMotion';
import { useSupplyChain } from '../../store/SupplyChainContext';

interface OrionWindowProps {
  window: AppWindow;
  isActive: boolean;
}

interface WindowErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  retryKey: number;
}

class WindowErrorBoundary extends React.Component<
  { children: React.ReactNode; appId: string; onClose: () => void },
  WindowErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode; appId: string; onClose: () => void }) {
    super(props);
    this.state = { hasError: false, error: null, retryKey: 0 };
  }

  static getDerivedStateFromError(error: Error): Partial<WindowErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`[ORION Window Error] ${this.props.appId}:`, error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prev => ({ hasError: false, error: null, retryKey: prev.retryKey + 1 }));
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env?.DEV ?? (process.env.NODE_ENV !== 'production');
      return (
        <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-os-surface select-text">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h3 className="text-os-text-primary text-base font-medium mb-1">Application failed to load</h3>
          <p className="text-os-text-muted text-xs max-w-sm mb-4">
            An unexpected error occurred in this module. The rest of ORION OS remains active.
          </p>
          {isDev && this.state.error && (
            <div className="mb-5 p-3 rounded-lg bg-red-950/40 border border-red-500/20 text-left max-w-lg w-full overflow-auto max-h-36 font-mono text-[11px] text-red-300">
              <div className="font-semibold text-red-200">{this.state.error.name}: {this.state.error.message}</div>
              {this.state.error.stack && (
                <div className="text-[10px] text-red-400/80 mt-1 whitespace-pre-wrap">
                  {this.state.error.stack.split('\n').slice(0, 4).join('\n')}
                </div>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="px-4 py-2 rounded-lg bg-os-surface-active hover:bg-os-surface-active text-os-text-primary text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry
            </button>
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                this.props.onClose();
              }}
              className="px-4 py-2 rounded-lg border border-os-border hover:bg-os-surface-hover text-os-text-secondary hover:text-os-text-primary text-xs font-medium transition-colors cursor-pointer"
            >
              Close Window
            </button>
          </div>
        </div>
      );
    }
    return <React.Fragment key={this.state.retryKey}>{this.props.children}</React.Fragment>;
  }
}

export const OrionWindow = React.memo(React.forwardRef<HTMLDivElement, OrionWindowProps>(({ window: win, isActive }, ref) => {
  const {
    focusApplication,
    closeApplication,
    minimizeApplication,
    maximizeApplication,
    restoreApplication,
    moveApplication,
    resizeApplication,
    snapApplication
  } = useWindowManager();

  const [snapCandidate, setSnapCandidate] = useState<'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'maximize' | null>(null);

  const { openContextMenu } = useOrionContextMenu();
  const { showToast } = useToast();
  const { settings: osSettings } = useOSGeometry();
  const windowControlPosition = osSettings.windowControlPosition || 'left';

  const rawApp = ORION_REGISTRY[win.id];
  const app = rawApp || {
    id: win.id,
    name: win.id.charAt(0).toUpperCase() + win.id.slice(1),
    route: `/${win.id}`,
    category: 'Operations',
    icon: null,
    color: '#7BA3C9',
    description: '',
  };
  const Component = getAppComponent(win.id);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);

  // Keyboard Move & Size Interactive Modes (Requirements 7-10)
  const [isMoveModeActive, setIsMoveModeActive] = useState(false);
  const [isSizeModeActive, setIsSizeModeActive] = useState(false);
  const initialGeomRef = useRef<{ position: { x: number; y: number }; size: { width: number; height: number } }>({
    position: { x: 0, y: 0 },
    size: { width: 0, height: 0 }
  });

  useEffect(() => {
    if (isMoveModeActive || isSizeModeActive) {
      initialGeomRef.current = {
        position: { ...win.position },
        size: { ...win.size }
      };
    }
  }, [isMoveModeActive, isSizeModeActive]);

  useEffect(() => {
    if (!isMoveModeActive && !isSizeModeActive) return;

    const handleModeKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        // Cancel: restore initial geometry
        if (isMoveModeActive) {
          moveApplication(win.id, initialGeomRef.current.position);
          showToast(`Move cancelled for ${app.name}`, 'info', 'Window Manager');
        }
        if (isSizeModeActive) {
          resizeApplication(win.id, initialGeomRef.current.size);
          showToast(`Resize cancelled for ${app.name}`, 'info', 'Window Manager');
        }
        setIsMoveModeActive(false);
        setIsSizeModeActive(false);
        return;
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        setIsMoveModeActive(false);
        setIsSizeModeActive(false);
        showToast(`Window geometry applied`, 'success', 'Window Manager');
        return;
      }

      const step = e.shiftKey ? 60 : 25;

      if (isMoveModeActive) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          moveApplication(win.id, { x: win.position.x, y: Math.max(36, win.position.y - step) });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          moveApplication(win.id, { x: win.position.x, y: win.position.y + step });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          moveApplication(win.id, { x: Math.max(0, win.position.x - step), y: win.position.y });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          moveApplication(win.id, { x: win.position.x + step, y: win.position.y });
        }
      } else if (isSizeModeActive) {
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          resizeApplication(win.id, { width: win.size.width, height: Math.max(250, win.size.height - step) });
        } else if (e.key === 'ArrowDown') {
          e.preventDefault();
          resizeApplication(win.id, { width: win.size.width, height: win.size.height + step });
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          resizeApplication(win.id, { width: Math.max(350, win.size.width - step), height: win.size.height });
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          resizeApplication(win.id, { width: win.size.width + step, height: win.size.height });
        }
      }
    };

    const handlePointerDismiss = () => {
      setIsMoveModeActive(false);
      setIsSizeModeActive(false);
    };

    window.addEventListener('keydown', handleModeKeyDown);
    window.addEventListener('pointerdown', handlePointerDismiss);

    return () => {
      window.removeEventListener('keydown', handleModeKeyDown);
      window.removeEventListener('pointerdown', handlePointerDismiss);
    };
  }, [isMoveModeActive, isSizeModeActive, win.id, win.position, win.size, app.name, moveApplication, resizeApplication, showToast]);

  // Window Titlebar Context Menu items generator (Requirements 7-10)
  const getTitleContextMenuItems = useCallback((): ContextMenuItem[] => {
    const isMaximized = win.state === 'maximized';
    const isMinimized = win.state === 'minimized';

    return [
      {
        id: 'win-restore',
        label: 'Restore',
        icon: RotateCcw,
        disabled: !isMaximized && !isMinimized,
        action: () => restoreApplication(win.id),
      },
      {
        id: 'win-move',
        label: 'Move',
        icon: Move,
        disabled: isMaximized,
        action: () => {
          focusApplication(win.id);
          setIsMoveModeActive(true);
          setIsSizeModeActive(false);
          showToast(`Move mode active for ${app.name} — Use Arrow Keys to move, Enter to place, Esc to cancel`, 'info', 'Window Manager');
        },
      },
      {
        id: 'win-size',
        label: 'Size',
        icon: Maximize2,
        disabled: isMaximized,
        action: () => {
          focusApplication(win.id);
          setIsSizeModeActive(true);
          setIsMoveModeActive(false);
          showToast(`Size mode active for ${app.name} — Use Arrow Keys to resize, Enter to finish, Esc to cancel`, 'info', 'Window Manager');
        },
      },
      {
        id: 'win-minimize',
        label: 'Minimize',
        icon: Minus,
        action: () => minimizeApplication(win.id),
      },
      {
        id: 'win-maximize',
        label: 'Maximize',
        icon: Square,
        disabled: isMaximized,
        action: () => maximizeApplication(win.id),
      },
      {
        id: 'win-sep',
        label: '',
        separator: true,
      },
      {
        id: 'win-close',
        label: 'Close',
        icon: X,
        shortcut: 'Alt+F4',
        danger: true,
        action: () => closeApplication(win.id),
      },
    ];
  }, [win.state, win.id, app.name, restoreApplication, minimizeApplication, maximizeApplication, closeApplication, focusApplication, showToast]);

  const handleTitleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    focusApplication(win.id);
    const items = getTitleContextMenuItems();
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'window',
      targetId: win.id,
      title: app.name,
      subtitle: `${app.category} • ${win.state}`,
      items,
    });
  };

  // Requirement 10 & 20: Reset scroll position to top when window is opened
  useEffect(() => {
    if (contentContainerRef.current) {
      contentContainerRef.current.scrollTop = 0;
    }
  }, [win.id]);

  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const windowElRef = useRef<HTMLDivElement | null>(null);
  const setMergedWindowRef = useCallback((node: HTMLDivElement | null) => {
    windowElRef.current = node;
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  }, [ref]);

  const snapCandidateRef = useRef<typeof snapCandidate>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragPosRef = useRef<{ x: number; y: number } | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const pendingResizeRef = useRef<{ width: number; height: number; x: number; y: number } | null>(null);

  useEffect(() => {
    return () => {
      if (dragRafRef.current !== null) window.cancelAnimationFrame(dragRafRef.current);
      if (resizeRafRef.current !== null) window.cancelAnimationFrame(resizeRafRef.current);
    };
  }, []);

  const dragStartRef = useRef<{ startX: number; startY: number; posX: number; posY: number }>({
    startX: 0,
    startY: 0,
    posX: 0,
    posY: 0
  });
  const resizeStartRef = useRef<{ startX: number; startY: number; width: number; height: number; posX: number; posY: number; direction: string }>({
    startX: 0,
    startY: 0,
    width: 0,
    height: 0,
    posX: 0,
    posY: 0,
    direction: 'se'
  });

  const { isMobile } = useResponsiveLayout();

  // Titlebar dragging
  const handleTitlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isMobile) return;
    // Strict event isolation: never drag when interacting with window controls or buttons
    if ((e.target as HTMLElement).closest('[data-window-controls]') || (e.target as HTMLElement).closest('button')) {
      return;
    }

    focusApplication(win.id);

    let startXPos = win.position.x;
    let startYPos = win.position.y;

    if (win.state === 'maximized') {
      restoreApplication(win.id);
      const restoredWidth = win.prevGeometry?.size.width || 1050;
      const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
      startXPos = Math.max(20, Math.min(screenW - restoredWidth - 20, e.clientX - restoredWidth / 2));
      startYPos = 16;
      moveApplication(win.id, { x: startXPos, y: startYPos });
    }

    setIsDragging(true);
    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      posX: startXPos,
      posY: startYPos
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleTitlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;
    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight : 900;
    const nextX = Math.max(-win.size.width + 120, Math.min(screenW - 120, dragStartRef.current.posX + dx));
    const nextY = Math.max(4, Math.min(Math.max(4, screenH - 80), dragStartRef.current.posY + dy));

    pendingDragPosRef.current = { x: nextX, y: nextY };
    if (dragRafRef.current === null) {
      dragRafRef.current = window.requestAnimationFrame(() => {
        dragRafRef.current = null;
        const el = windowElRef.current;
        const pending = pendingDragPosRef.current;
        if (el && pending) {
          const tx = pending.x - dragStartRef.current.posX;
          const ty = pending.y - dragStartRef.current.posY;
          el.style.transform = `translate3d(${tx}px, ${ty}px, 0)`;
        }
      });
    }

    let nextSnap: typeof snapCandidate = null;
    if (e.clientY <= 14) {
      nextSnap = 'maximize';
    } else if (e.clientX <= 20) {
      if (e.clientY < screenH * 0.3) {
        nextSnap = 'top-left';
      } else if (e.clientY > screenH * 0.7) {
        nextSnap = 'bottom-left';
      } else {
        nextSnap = 'left';
      }
    } else if (e.clientX >= screenW - 20) {
      if (e.clientY < screenH * 0.3) {
        nextSnap = 'top-right';
      } else if (e.clientY > screenH * 0.7) {
        nextSnap = 'bottom-right';
      } else {
        nextSnap = 'right';
      }
    }

    if (nextSnap !== snapCandidateRef.current) {
      snapCandidateRef.current = nextSnap;
      setSnapCandidate(nextSnap);
    }
  };

  const handleTitlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      if (dragRafRef.current !== null) {
        window.cancelAnimationFrame(dragRafRef.current);
        dragRafRef.current = null;
      }
      if (windowElRef.current) {
        windowElRef.current.style.transform = '';
      }
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}

      const activeSnap = snapCandidateRef.current;
      snapCandidateRef.current = null;
      if (activeSnap) {
        if (activeSnap === 'maximize') {
          maximizeApplication(win.id);
        } else {
          snapApplication(win.id, activeSnap);
        }
        setSnapCandidate(null);
      } else if (pendingDragPosRef.current) {
        moveApplication(win.id, pendingDragPosRef.current);
      }
      pendingDragPosRef.current = null;
    }
  };

  // Corner / Edge Resizing
  const handleResizePointerDown = (e: React.PointerEvent, direction: string) => {
    if (win.state === 'maximized' || isMobile) return;
    e.stopPropagation();
    focusApplication(win.id);
    pendingResizeRef.current = {
      width: win.size.width,
      height: win.size.height,
      x: win.position.x,
      y: win.position.y,
    };
    setIsResizing(true);
    resizeStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      width: win.size.width,
      height: win.size.height,
      posX: win.position.x,
      posY: win.position.y,
      direction
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handleResizePointerMove = (e: React.PointerEvent) => {
    if (!isResizing) return;
    const dx = e.clientX - resizeStartRef.current.startX;
    const dy = e.clientY - resizeStartRef.current.startY;
    const { width, height, posX, posY, direction } = resizeStartRef.current;

    const screenW = typeof window !== 'undefined' ? window.innerWidth : 1440;
    const screenH = typeof window !== 'undefined' ? window.innerHeight - 48 : 852;
    const minW = Math.min(480, Math.max(320, Math.round(screenW * 0.55)));
    const minH = Math.min(340, Math.max(240, Math.round(screenH * 0.45)));

    let newW = width;
    let newH = height;
    let newX = posX;
    let newY = posY;

    if (direction.includes('e')) newW = Math.max(minW, Math.min(screenW - 8, width + dx));
    if (direction.includes('s')) newH = Math.max(minH, Math.min(screenH - 8, height + dy));
    if (direction.includes('w')) {
      newW = Math.max(minW, Math.min(screenW - 8, width - dx));
      newX = posX + (width - newW);
    }
    if (direction.includes('n')) {
      newH = Math.max(minH, Math.min(screenH - 8, height - dy));
      newY = Math.max(4, posY + (height - newH));
    }

    pendingResizeRef.current = { width: newW, height: newH, x: newX, y: newY };
    if (resizeRafRef.current === null) {
      resizeRafRef.current = window.requestAnimationFrame(() => {
        resizeRafRef.current = null;
        const el = windowElRef.current;
        const pending = pendingResizeRef.current;
        if (el && pending) {
          el.style.width = `${pending.width}px`;
          el.style.height = `${pending.height}px`;
          el.style.transform = `translate3d(${pending.x - posX}px, ${pending.y - posY}px, 0)`;
        }
      });
    }
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (isResizing) {
      if (resizeRafRef.current !== null) {
        window.cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      if (windowElRef.current) {
        windowElRef.current.style.transform = '';
      }
      setIsResizing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      if (pendingResizeRef.current) {
        const { width, height, x, y } = pendingResizeRef.current;
        resizeApplication(win.id, { width, height }, { x, y });
        pendingResizeRef.current = null;
      }
    }
  };

  if (!app) return null;

  const isMaximized = win.state === 'maximized' || isMobile;
  const isMinimized = win.state === 'minimized';

  const supplyChain = useSupplyChain();
  const prefersReduced = isReducedMotionPreferred(supplyChain?.settings?.reducedMotion);
  const animationStyle = supplyChain?.settings?.animationStyle || 'premium';
  const genieEnabled = !prefersReduced && (supplyChain?.settings?.genieEffectEnabled ?? true);

  // Compute source/target Dock icon geometry for macOS Genie minimize & restore
  const dockGeom = dockGeometryRegistry.getIconGeometry(win.id) || dockGeometryRegistry.getFallbackGeometry();

  // Floating or maximized geometry styles inside the desktop workspace stage
  const windowStyles: React.CSSProperties = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: win.zIndex,
        transformOrigin: dockGeom ? `${dockGeom.center.x}px ${dockGeom.center.y}px` : 'center bottom',
      }
    : {
        position: 'absolute',
        top: `${win.position.y}px`,
        left: `${win.position.x}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.zIndex,
        transformOrigin: dockGeom ? `${dockGeom.center.x - win.position.x}px ${dockGeom.center.y - win.position.y}px` : 'center bottom',
      };

  const Icon = app.icon;

  return (
    <motion.div
      ref={setMergedWindowRef}
      initial={prefersReduced ? { opacity: 0 } : { 
        opacity: 0, 
        scale: 0.94, 
        y: 14,
      }}
      animate={
        prefersReduced
          ? { opacity: isMinimized ? 0 : 1 }
          : isMinimized
          ? {
              opacity: 0,
              scale: genieEnabled ? 0.08 : 0.85,
              y: genieEnabled ? (dockGeom ? dockGeom.center.y - (isMaximized ? 400 : win.position.y) : 100) : 24,
              x: genieEnabled && dockGeom ? (dockGeom.center.x - (isMaximized ? (typeof window !== 'undefined' ? window.innerWidth / 2 : 600) : win.position.x + win.size.width / 2)) * 0.4 : 0,
              borderRadius: '24px',
            }
          : {
              opacity: 1,
              scale: 1,
              x: 0,
              y: 0,
              borderRadius: isMaximized ? '0px' : '18px',
            }
      }
      exit={prefersReduced ? { opacity: 0 } : { 
        opacity: 0, 
        scale: 0.94, 
        y: 10,
      }}
      transition={(isDragging || isResizing) ? { duration: 0 } : (prefersReduced ? { duration: 0.1 } : ORION_SPRING_WINDOW)}
      data-window-id={win.id} data-orion-window
      onPointerDown={() => focusApplication(win.id)}
      style={{
        ...windowStyles,
        contain: 'layout style paint',
        willChange: (isDragging || isResizing) ? 'transform, width, height' : undefined,
      }}
      className={cn(
        "orion-window-surface flex flex-col text-os-text-primary overflow-hidden select-text pointer-events-auto",
        !(isDragging || isResizing) && "transition-opacity duration-150",
        isMinimized && "pointer-events-none",
        isMaximized 
          ? "rounded-none border-none shadow-none bg-[rgba(14,17,23,0.96)]" 
          : "rounded-[18px] border border-white/[0.14] bg-[rgba(16,19,26,0.94)] shadow-[0_28px_80px_rgba(0,0,0,0.60),0_4px_20px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.20)]",
        isActive && !isMaximized && "border-white/[0.22] shadow-[0_32px_90px_rgba(0,0,0,0.70),0_6px_24px_rgba(0,0,0,0.40),inset_0_1px_0_rgba(255,255,255,0.28)] opacity-100",
        !isActive && !isMaximized && "opacity-95"
      )}
    >
      {/* Title Bar / Chrome */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onPointerCancel={handleTitlePointerUp}
        onContextMenu={handleTitleContextMenu}
        data-window-titlebar="true" 
        data-orion-window-titlebar="true" 
        data-orion-app-topbar="true"
        onDoubleClick={() => {
          if (win.state === 'maximized') {
            restoreApplication(win.id);
          } else {
            maximizeApplication(win.id);
          }
        }}
        style={{
          backgroundColor: 'var(--orion-surface-elevated, rgba(20, 24, 30, 0.72))',
          backdropFilter: 'blur(20px) saturate(145%)',
          WebkitBackdropFilter: 'blur(20px) saturate(145%)',
          mixBlendMode: 'normal',
          isolation: 'isolate',
        }}
        className={cn(
          "orion-window-titlebar h-[38px] border-b border-white/[0.08] px-3.5 flex items-center justify-between select-none relative z-20 cursor-default",
          isActive ? "text-[var(--orion-text-primary)]" : "text-[var(--orion-text-muted)] opacity-80"
        )}
      >
        {/* Left Section: Either Traffic-Light Controls + App Identity OR Just App Identity */}
        <div className="flex items-center gap-3.5 min-w-0 pointer-events-auto select-none">
          {windowControlPosition === 'left' && (
            <OrionWindowControls
              appName={app.name}
              isMaximized={win.state === 'maximized'}
              position="left"
              onClose={() => closeApplication(win.id)}
              onMinimize={() => minimizeApplication(win.id)}
              onMaximize={() => {
                if (win.state === 'maximized') {
                  restoreApplication(win.id);
                } else {
                  maximizeApplication(win.id);
                }
              }}
            />
          )}

          {/* App Identity */}
          <div className="flex items-center gap-2 min-w-0 pointer-events-none select-none pl-1">
            <OrionAppIcon app={win.id} size={16} showContainer={false} />
            <span className={cn(
              "text-[13px] font-medium tracking-normal truncate leading-none",
              isActive ? "text-[var(--orion-text-primary)]" : "text-[var(--orion-text-muted)]"
            )}>
              {app.name}
            </span>
            <span className="text-[var(--orion-border-strong)] text-xs font-mono select-none">·</span>
            <span className="text-[10px] text-[var(--orion-text-muted)] font-mono font-medium uppercase tracking-[0.08em] hidden sm:inline-block truncate leading-none">
              {app.category}
            </span>
          </div>
        </div>

        {/* Right Section: Windows-Style Traffic Lights (if position === 'right') or clean spacer */}
        <div className="flex items-center gap-2 ml-auto z-20 pointer-events-auto pr-1 select-none">
          {windowControlPosition === 'right' && (
            <OrionWindowControls
              appName={app.name}
              isMaximized={win.state === 'maximized'}
              position="right"
              onClose={() => closeApplication(win.id)}
              onMinimize={() => minimizeApplication(win.id)}
              onMaximize={() => {
                if (win.state === 'maximized') {
                  restoreApplication(win.id);
                } else {
                  maximizeApplication(win.id);
                }
              }}
            />
          )}
        </div>
      </div>

      {/* Window Body & Application Content */}
      <div 
        ref={contentContainerRef}
        data-window-body="true"
        className={cn(
          "flex-1 overflow-auto relative bg-transparent min-h-0 custom-scrollbar",
          isMobile ? "pb-16" : ""
        )}
      >
        <WindowErrorBoundary appId={win.id} onClose={() => closeApplication(win.id)}>
          {Component ? (
            <Component />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-os-surface">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-os-text-primary text-base font-medium mb-1">Application unavailable</h3>
              <p className="text-os-text-muted text-xs max-w-sm mb-6">
                The requested module "{app.name}" could not be loaded into this workspace.
              </p>
              <button
                type="button"
                onPointerDown={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  closeApplication(win.id);
                }}
                className="px-4 py-2 rounded-lg border border-os-border hover:bg-os-surface-hover text-os-text-secondary hover:text-os-text-primary text-xs font-medium transition-colors cursor-pointer"
              >
                Close Window
              </button>
            </div>
          )}
        </WindowErrorBoundary>
      </div>

      {/* Move / Size Interactive Keyboard Mode Banner */}
      {(isMoveModeActive || isSizeModeActive) && (
        <div className="absolute top-[38px] left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-os-accent/15 border border-os-accent/40 text-os-accent text-[11px] font-mono rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in pointer-events-none select-none">
          {isMoveModeActive ? <Move className="w-3.5 h-3.5 animate-pulse" /> : <Maximize2 className="w-3.5 h-3.5 animate-pulse" />}
          <span>
            {isMoveModeActive ? 'MOVE MODE' : 'RESIZE MODE'}: Arrow keys to adjust • Enter to apply • Esc to cancel
          </span>
        </div>
      )}

      {/* Window Resize Handles (Only when floating on desktop) */}
      {!isMaximized && (
        <>
          {/* Bottom border resize */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 's')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            className="absolute bottom-0 left-2 right-2 h-2 cursor-s-resize z-20"
          />
          {/* Right border resize */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'e')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            className="absolute top-10 bottom-2 right-0 w-2 cursor-e-resize z-20"
          />
          {/* Corner resize handle */}
          <div
            onPointerDown={(e) => handleResizePointerDown(e, 'se')}
            onPointerMove={handleResizePointerMove}
            onPointerUp={handleResizePointerUp}
            onPointerCancel={handleResizePointerUp}
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize flex items-end justify-end p-1 z-30 group"
            title="Resize"
          >
            <div className="w-2 h-2 border-r-2 border-b-2 border-os-border group-hover:border-os-accent transition-colors" />
          </div>
        </>
      )}

      {/* Window Snap Ghost Preview Overlay */}
      {isDragging && snapCandidate && typeof document !== 'undefined' && createPortal(
        <div
          data-testid="window-snap-ghost"
          className="fixed pointer-events-none z-[55] transition-all duration-150 ease-out border-2 border-white/40 bg-white/10 dark:bg-white/5 backdrop-blur-md rounded-2xl shadow-2xl"
          style={{
            top: snapCandidate === 'bottom-left' || snapCandidate === 'bottom-right' ? 'calc(50vh + 24px)' : 48,
            left: snapCandidate === 'right' || snapCandidate === 'top-right' || snapCandidate === 'bottom-right' ? '50vw' : 0,
            width: snapCandidate === 'maximize' ? '100vw' : '50vw',
            height: snapCandidate === 'maximize' || snapCandidate === 'left' || snapCandidate === 'right'
              ? 'calc(100vh - 48px)'
              : 'calc(50vh - 24px)'
          }}
        />,
        document.body
      )}
    </motion.div>
  );
}));
