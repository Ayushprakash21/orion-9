import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AppWindow, useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { getAppComponent } from '../OrionComponentMap';
import { useOrionContextMenu, ContextMenuItem } from '../contextMenu/OrionContextMenuContext';
import { useToast } from '../../store/ToastContext';
import { Minus, Square, X, RotateCcw, AlertTriangle, Move, Maximize2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion } from 'motion/react';

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

export const OrionWindow = React.forwardRef<HTMLDivElement, OrionWindowProps>(({ window: win, isActive }, ref) => {
  const {
    focusApplication,
    closeApplication,
    minimizeApplication,
    maximizeApplication,
    restoreApplication,
    moveApplication,
    resizeApplication
  } = useWindowManager();

  const { openContextMenu } = useOrionContextMenu();
  const { showToast } = useToast();

  const app = ORION_REGISTRY[win.id];
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

  // Check if mobile screen (< 768px)
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 768 : false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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
    moveApplication(win.id, {
      x: dragStartRef.current.posX + dx,
      y: dragStartRef.current.posY + dy
    });
  };

  const handleTitlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  // Corner / Edge Resizing
  const handleResizePointerDown = (e: React.PointerEvent, direction: string) => {
    if (win.state === 'maximized' || isMobile) return;
    e.stopPropagation();
    focusApplication(win.id);
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

    let newW = width;
    let newH = height;
    let newX = posX;
    let newY = posY;

    if (direction.includes('e')) newW = width + dx;
    if (direction.includes('s')) newH = height + dy;
    if (direction.includes('w')) {
      newW = width - dx;
      newX = posX + dx;
    }
    if (direction.includes('n')) {
      newH = height - dy;
      newY = posY + dy;
    }

    resizeApplication(win.id, { width: newW, height: newH }, { x: newX, y: newY });
  };

  const handleResizePointerUp = (e: React.PointerEvent) => {
    if (isResizing) {
      setIsResizing(false);
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
  };

  if (!app) return null;

  const isMaximized = win.state === 'maximized' || isMobile;
  const isMinimized = win.state === 'minimized';

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
      }
    : {
        position: 'absolute',
        top: `${win.position.y}px`,
        left: `${win.position.x}px`,
        width: `${win.size.width}px`,
        height: `${win.size.height}px`,
        zIndex: win.zIndex,
      };

  const Icon = app.icon;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ 
        opacity: isMinimized ? 0 : 1, 
        scale: isMinimized ? 0.75 : 1, 
        y: isMinimized ? 80 : 0,
      }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "linear" }}
      data-window-id={win.id}
      onPointerDown={() => focusApplication(win.id)}
      style={windowStyles}
      className={cn(
        "flex flex-col bg-os-surface/95 text-os-text-primary overflow-hidden select-text pointer-events-auto",
        isMinimized && "pointer-events-none",
        isMaximized ? "rounded-none border-none shadow-none" : "rounded-xl border shadow-2xl",
        isActive
          ? "border-white/[0.14] ring-1 ring-[#00F2FE]/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)]"
          : "border-os-border shadow-[0_15px_35px_-10px_rgba(0,0,0,0.7)]"
      )}
    >
      {/* Title Bar / Chrome */}
      <div
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
        onPointerUp={handleTitlePointerUp}
        onPointerCancel={handleTitlePointerUp}
        onContextMenu={handleTitleContextMenu}
        onDoubleClick={() => {
          if (win.state === 'maximized') {
            restoreApplication(win.id);
          } else {
            maximizeApplication(win.id);
          }
        }}
        className={cn(
          "flex items-center justify-between h-9 min-h-9 px-3 shrink-0 select-none relative z-[100]",
          "border-b border-white/[0.05] transition-colors cursor-default",
          isActive
            ? "bg-gradient-to-b from-black/5 via-black/[0.02] dark:from-white/[0.06] dark:via-white/[0.02] to-transparent"
            : "bg-os-surface-active text-os-text-muted"
        )}
      >
        {/* Left: App Identity */}
        <div className="flex items-center gap-2 min-w-0 pointer-events-none">
          <div
            className="w-4 h-4 rounded flex items-center justify-center shrink-0"
            style={{ color: app.color }}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
          <span className={cn(
            "text-[12px] font-medium tracking-wide truncate",
            isActive ? "text-os-text-primary" : "text-os-text-muted"
          )}>
            {app.name}
          </span>
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest hidden sm:inline-block ml-1">
            • {app.category}
          </span>
        </div>

        {/* Right: Window Controls */}
        <div 
          data-window-controls="true"
          className="absolute right-1 top-0 h-9 flex items-center gap-1 shrink-0 z-[120] pointer-events-auto bg-os-surface/95 pl-1"
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onContextMenu={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            aria-label={`Minimize ${app.name}`}
            title="Minimize"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              minimizeApplication(win.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-os-surface-active active:bg-os-surface-active text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer select-none group"
          >
            <Minus className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
          </button>

          {!isMobile && (
            <button
              type="button"
              aria-label={win.state === 'maximized' ? `Restore ${app.name}` : `Maximize ${app.name}`}
              title={win.state === 'maximized' ? "Restore" : "Maximize"}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                if (win.state === 'maximized') {
                  restoreApplication(win.id);
                } else {
                  maximizeApplication(win.id);
                }
              }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-os-surface-active active:bg-os-surface-active text-os-text-muted hover:text-os-text-primary transition-colors cursor-pointer select-none group"
            >
              {win.state === 'maximized' ? (
                <Square className="w-3 h-3 text-os-text-muted group-hover:text-os-text-primary transition-colors" />
              ) : (
                <Square className="w-3.5 h-3.5 text-os-text-muted group-hover:text-os-text-primary transition-colors" />
              )}
            </button>
          )}

          <button
            type="button"
            aria-label={`Close ${app.name}`}
            title="Close"
            onPointerDown={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              closeApplication(win.id);
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-500/20 active:bg-red-500/30 text-os-text-muted hover:text-red-400 transition-colors cursor-pointer select-none group"
          >
            <X className="w-4 h-4 transition-transform group-hover:scale-110" />
          </button>
        </div>
      </div>

      {/* Window Body & Application Content */}
      <div 
        ref={contentContainerRef}
        data-window-body="true"
        className="flex-1 overflow-auto relative bg-os-bg min-h-0 custom-scrollbar"
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
        <div className="absolute top-11 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 bg-os-accent/15 border border-[#00F2FE]/40 text-os-accent text-[11px] font-mono rounded-full shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-in fade-in pointer-events-none select-none">
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
            <div className="w-2 h-2 border-r-2 border-b-2 border-os-border group-hover:border-[#00F2FE] transition-colors" />
          </div>
        </>
      )}
    </motion.div>
  );
});
