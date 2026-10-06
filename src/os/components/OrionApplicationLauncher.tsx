import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useWindowManager } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import { Search, X, Play, Square, Grid2X2, List, Settings, Power } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useOrionContextMenu } from '../contextMenu/OrionContextMenuContext';
import { useAuth } from '../../store/AuthContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useToast } from '../../store/ToastContext';
import { desktopWorkspaceService } from '../../core/filesystem/DesktopWorkspaceService';
import OrionAppIcon from '../../components/brand/OrionAppIcon';

interface ActiveDragSession {
  app: any;
  pointerId: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isDragging: boolean;
  isOverDesktop: boolean;
}

export function OrionApplicationLauncher() {
  const { 
    launcherOpen, 
    setLauncherOpen, 
    openApplication, 
    focusApplication, 
    windows, 
    dockPinnedApps, 
    pinToDock, 
    unpinFromDock,
    activeWorkspaceId 
  } = useWindowManager();
  
  const { isAdmin, currentUser } = useAuth();
  const { settings, updateSettings } = useSupplyChain();
  const { showToast } = useToast();
  
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>(() => {
    try { return (localStorage.getItem('orion.launcher.viewMode') as 'list' | 'grid') || 'list'; } catch { return 'list'; }
  });

  const [activeDrag, setActiveDrag] = useState<ActiveDragSession | null>(null);
  const dragSessionRef = useRef<ActiveDragSession | null>(null);
  const hasDraggedRef = useRef<boolean>(false);

  useEffect(() => {
    try { localStorage.setItem('orion.launcher.viewMode', viewMode); } catch {}
  }, [viewMode]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (launcherOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else if (!launcherOpen) {
      setSearch('');
      setActiveDrag(null);
      dragSessionRef.current = null;
      hasDraggedRef.current = false;
    }
  }, [launcherOpen]);

  // Clean cancellation on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (launcherOpen && e.key === 'Escape') {
        if (dragSessionRef.current?.isDragging) {
          dragSessionRef.current = null;
          setActiveDrag(null);
          hasDraggedRef.current = false;
          return;
        }
        setLauncherOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [launcherOpen, setLauncherOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      dragSessionRef.current = null;
    };
  }, []);

  // Primary pointer drag handler for launching drag sessions from cards
  const handleAppPointerDown = useCallback((e: React.PointerEvent, app: any) => {
    // Only primary mouse button or touch/pen contact
    if (e.button !== 0) return;

    const startX = e.clientX;
    const startY = e.clientY;
    const pointerId = e.pointerId;

    const session: ActiveDragSession = {
      app,
      pointerId,
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      isDragging: false,
      isOverDesktop: false,
    };
    dragSessionRef.current = session;

    const handlePointerMove = (moveEvt: PointerEvent) => {
      if (!dragSessionRef.current || dragSessionRef.current.pointerId !== moveEvt.pointerId) return;

      const dx = moveEvt.clientX - dragSessionRef.current.startX;
      const dy = moveEvt.clientY - dragSessionRef.current.startY;
      const dist = Math.hypot(dx, dy);

      if (!dragSessionRef.current.isDragging) {
        if (dist >= 8) {
          dragSessionRef.current.isDragging = true;
          hasDraggedRef.current = true;
        } else {
          return;
        }
      }

      dragSessionRef.current.currentX = moveEvt.clientX;
      dragSessionRef.current.currentY = moveEvt.clientY;

      // Hit-test desktop canvas:
      // Must be within [data-desktop-canvas="true"] bounding rect
      // and outside the launcher dialog container
      const canvasEl = document.querySelector('[data-desktop-canvas="true"]') as HTMLElement | null;
      let overDesktop = false;
      if (canvasEl) {
        const rect = canvasEl.getBoundingClientRect();
        const inCanvas = (
          moveEvt.clientX >= rect.left &&
          moveEvt.clientX <= rect.right &&
          moveEvt.clientY >= rect.top &&
          moveEvt.clientY <= rect.bottom
        );
        let insideLauncher = false;
        if (containerRef.current) {
          const lRect = containerRef.current.getBoundingClientRect();
          insideLauncher = (
            moveEvt.clientX >= lRect.left &&
            moveEvt.clientX <= lRect.right &&
            moveEvt.clientY >= lRect.top &&
            moveEvt.clientY <= lRect.bottom
          );
        }
        overDesktop = inCanvas && !insideLauncher;
      }

      dragSessionRef.current.isOverDesktop = overDesktop;
      setActiveDrag({ ...dragSessionRef.current });
    };

    const cleanup = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
    };

    const handlePointerUp = async (upEvt: PointerEvent) => {
      if (!dragSessionRef.current || dragSessionRef.current.pointerId !== upEvt.pointerId) return;
      cleanup();

      const active = dragSessionRef.current;
      dragSessionRef.current = null;
      setActiveDrag(null);

      if (active.isDragging) {
        const canvasEl = document.querySelector('[data-desktop-canvas="true"]') as HTMLElement | null;
        if (canvasEl) {
          const rect = canvasEl.getBoundingClientRect();
          const inCanvas = (
            upEvt.clientX >= rect.left &&
            upEvt.clientX <= rect.right &&
            upEvt.clientY >= rect.top &&
            upEvt.clientY <= rect.bottom
          );
          let insideLauncher = false;
          if (containerRef.current) {
            const lRect = containerRef.current.getBoundingClientRect();
            insideLauncher = (
              upEvt.clientX >= lRect.left &&
              upEvt.clientX <= lRect.right &&
              upEvt.clientY >= lRect.top &&
              upEvt.clientY <= lRect.bottom
            );
          }
          const validDrop = inCanvas && !insideLauncher;

          if (validDrop) {
            const dropX = upEvt.clientX - rect.left;
            const dropY = upEvt.clientY - rect.top;

            try {
              await desktopWorkspaceService.addShortcut({
                targetType: 'application',
                targetId: active.app.id,
                name: active.app.name,
                iconId: active.app.id,
                workspaceId: activeWorkspaceId,
                x: dropX,
                y: dropY,
                viewportWidth: window.innerWidth,
                viewportHeight: window.innerHeight,
              });

              // Dispatch desktop refresh
              window.dispatchEvent(new CustomEvent('orion:desktop-refresh', { detail: { timestamp: Date.now() } }));

              showToast(`Created shortcut for ${active.app.name} on Desktop`, 'success', 'Desktop');
              setLauncherOpen(false);
            } catch (err: any) {
              console.error('Failed to create shortcut from Start Menu:', err);
              showToast(`Could not create shortcut: ${err?.message || 'Error'}`, 'error', 'Desktop');
            }
          }
        }

        setTimeout(() => {
          hasDraggedRef.current = false;
        }, 150);
      }
    };

    const handlePointerCancel = () => {
      cleanup();
      dragSessionRef.current = null;
      setActiveDrag(null);
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 150);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
  }, [activeWorkspaceId, currentUser, setLauncherOpen, showToast]);

  if (!launcherOpen) return null;

  // User launcher exposes the User Manual only to standard users. Admins use the dedicated Admin Manual in the Admin Console.
  const apps = Object.values(ORION_REGISTRY).filter(app => !(app.id === 'user-manual' && isAdmin));
  const filteredApps = apps.filter(app => 
    app.name.toLowerCase().includes(search.toLowerCase()) ||
    app.description.toLowerCase().includes(search.toLowerCase()) ||
    app.category.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['Operations', 'Intelligence', 'Control', 'AI', 'Platform', 'Administration'];

  const handleOpen = (id: string) => {
    if (hasDraggedRef.current) return;
    if (windows[id] && windows[id].state !== 'closed') {
      focusApplication(id);
    } else {
      openApplication(id);
    }
    setLauncherOpen(false);
  };

  return (
    <div 
      className={cn(
        "fixed inset-0 z-[2147483620] flex items-end justify-center",
        activeDrag?.isDragging ? "pointer-events-none" : "pointer-events-auto"
      )}
      onClick={() => {
        if (!hasDraggedRef.current && !activeDrag?.isDragging) {
          setLauncherOpen(false);
        }
      }}
    >
      <div 
        className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in",
          activeDrag?.isDragging ? "pointer-events-none opacity-20" : "pointer-events-auto"
        )} 
      />
      
      <div 
        ref={containerRef}
        className="relative w-[calc(100%-16px)] sm:w-full max-w-3xl max-h-[82vh] mb-16 md:mb-20 flex flex-col bg-[#12151a]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.1] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.85)] animate-in fade-in slide-in-from-bottom-6 duration-200 pointer-events-auto"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-label="Application Launcher"
      >
        <div className="flex items-center gap-3 p-4 border-b border-white/[0.08] shrink-0">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search applications, modules, intelligence..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl py-2.5 pl-10 pr-4 text-[13px] text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 focus:bg-white/[0.08] transition-all"
              onKeyDown={e => {
                if (e.key === 'Enter' && filteredApps.length > 0) {
                  handleOpen(filteredApps[0].id);
                }
              }}
            />
          </div>
          <div className="flex items-center rounded-xl border border-white/[0.08] bg-white/[0.04] p-0.5 shrink-0" role="group" aria-label="Application view">
            <button
              type="button"
              aria-label="List view"
              aria-pressed={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-colors cursor-pointer", viewMode === 'list' ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white")}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              aria-label="Grid view"
              aria-pressed={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              className={cn("p-2 rounded-lg transition-colors cursor-pointer", viewMode === 'grid' ? "bg-white/[0.12] text-white" : "text-slate-400 hover:text-white")}
              title="Grid view"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
          </div>
          <button 
            onClick={() => setLauncherOpen(false)}
            className="p-2 rounded-xl hover:bg-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar p-5 scroll-smooth">
          {search ? (
            viewMode === 'grid' ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                {filteredApps.map(app => (
                  <AppGridCard 
                    key={app.id} 
                    app={app} 
                    onClick={() => handleOpen(app.id)} 
                    onPointerDown={(e) => handleAppPointerDown(e, app)}
                    isPinned={dockPinnedApps.includes(app.id)} 
                    pinToDock={() => pinToDock(app.id)} 
                    unpinFromDock={() => unpinFromDock(app.id)} 
                    isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} 
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {filteredApps.map(app => (
                  <AppRow 
                    key={app.id} 
                    app={app} 
                    onClick={() => handleOpen(app.id)} 
                    onPointerDown={(e) => handleAppPointerDown(e, app)}
                    isPinned={dockPinnedApps.includes(app.id)} 
                    pinToDock={() => pinToDock(app.id)} 
                    unpinFromDock={() => unpinFromDock(app.id)} 
                    isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} 
                  />
                ))}
              </div>
            )
          ) : settings.userExperienceMode !== 'ADVANCED' ? (
            /* Simple Mode: Action-Oriented Primary Apps */
            <div className="flex flex-col gap-5 pb-6">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    <span>Simple Mode Navigation</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">8 primary business tasks • Technical SCM complexity managed by Orion</p>
                </div>

                <button
                  type="button"
                  onClick={() => updateSettings({ userExperienceMode: 'ADVANCED' })}
                  className="text-[11px] font-mono text-purple-400 hover:text-purple-300 underline cursor-pointer"
                >
                  Switch to Advanced SCM Mode
                </button>
              </div>

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    ORION_REGISTRY['command-center'],
                    ORION_REGISTRY['buy-workflow'],
                    ORION_REGISTRY['procurement'],
                    ORION_REGISTRY['inventory'],
                    ORION_REGISTRY['shipments'],
                    ORION_REGISTRY['exceptions'],
                    ORION_REGISTRY['reports'],
                    ORION_REGISTRY['orion-ai'],
                  ].filter(Boolean).map(app => (
                    <AppGridCard
                      key={app.id}
                      app={app}
                      onClick={() => handleOpen(app.id)}
                      onPointerDown={(e) => handleAppPointerDown(e, app)}
                      isPinned={dockPinnedApps.includes(app.id)}
                      pinToDock={() => pinToDock(app.id)}
                      unpinFromDock={() => unpinFromDock(app.id)}
                      isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {[
                    ORION_REGISTRY['command-center'],
                    ORION_REGISTRY['buy-workflow'],
                    ORION_REGISTRY['procurement'],
                    ORION_REGISTRY['inventory'],
                    ORION_REGISTRY['shipments'],
                    ORION_REGISTRY['exceptions'],
                    ORION_REGISTRY['reports'],
                    ORION_REGISTRY['orion-ai'],
                  ].filter(Boolean).map(app => (
                    <AppRow
                      key={app.id}
                      app={app}
                      onClick={() => handleOpen(app.id)}
                      onPointerDown={(e) => handleAppPointerDown(e, app)}
                      isPinned={dockPinnedApps.includes(app.id)}
                      pinToDock={() => pinToDock(app.id)}
                      unpinFromDock={() => unpinFromDock(app.id)}
                      isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* Advanced Mode: Full Technical SCM Taxonomy */
            <div className="flex flex-col gap-6 pb-6">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h3 className="text-xs font-semibold tracking-wide text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-400" />
                    <span>Advanced SCM Operating Model</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Full enterprise command towers, intelligence models, and orchestration centers</p>
                </div>

                <button
                  type="button"
                  onClick={() => updateSettings({ userExperienceMode: 'SIMPLE' })}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                >
                  Switch to Simple Mode
                </button>
              </div>

              {categories.map(category => {
                const categoryApps = apps.filter(a => a.category === category);
                if (categoryApps.length === 0) return null;
                return (
                  <div key={category} className="flex flex-col gap-2">
                    <h3 className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase px-1">{category}</h3>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                        {categoryApps.map(app => (
                          <AppGridCard 
                            key={app.id} 
                            app={app} 
                            onClick={() => handleOpen(app.id)} 
                            onPointerDown={(e) => handleAppPointerDown(e, app)}
                            isPinned={dockPinnedApps.includes(app.id)} 
                            pinToDock={() => pinToDock(app.id)} 
                            unpinFromDock={() => unpinFromDock(app.id)} 
                            isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} 
                          />
                        ))}
                      </div>
                    ) : categoryApps.map(app => (
                      <AppRow 
                        key={app.id} 
                        app={app} 
                        onClick={() => handleOpen(app.id)} 
                        onPointerDown={(e) => handleAppPointerDown(e, app)}
                        isPinned={dockPinnedApps.includes(app.id)} 
                        pinToDock={() => pinToDock(app.id)} 
                        unpinFromDock={() => unpinFromDock(app.id)} 
                        isOpen={!!windows[app.id] && windows[app.id].state !== 'closed'} 
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* WINDOWS START MENU FOOTER BAR: USER PROFILE, SETTINGS & POWER */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-white/[0.08] bg-white/[0.02] rounded-b-2xl shrink-0">
          {/* User Profile */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400 font-semibold text-[13px] shrink-0">
              {currentUser?.fullName?.charAt(0) || 'U'}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[12px] font-semibold text-white truncate">
                {currentUser?.fullName || 'Enterprise User'}
              </span>
              <span className="text-[10px] text-slate-400 truncate capitalize">
                {currentUser?.role?.replace(/_/g, ' ') || 'User'}
              </span>
            </div>
          </div>

          {/* Quick Action Controls: Settings & Power */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                handleOpen('settings');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-medium text-slate-300 hover:text-white bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] rounded-xl transition-all cursor-pointer"
              title="Orion Settings"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              onClick={() => {
                setLauncherOpen(false);
                window.dispatchEvent(new CustomEvent('orion:trigger-power-menu'));
              }}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/15 border border-transparent hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
              title="Power / Sign Out"
              aria-label="Power / Sign Out"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Visual Drag Preview Portal */}
      {activeDrag?.isDragging && typeof document !== 'undefined' && createPortal(
        <div
          data-testid="start-menu-drag-preview"
          data-is-over-desktop={activeDrag.isOverDesktop ? "true" : "false"}
          className={cn(
            "fixed pointer-events-none z-[2147483647] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-1.5 p-3 rounded-2xl border shadow-2xl backdrop-blur-xl transition-transform duration-75 select-none",
            activeDrag.isOverDesktop
              ? "bg-[#141820]/95 border-white/40 shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_20px_rgba(255,255,255,0.12)] scale-110 ring-1 ring-white/20"
              : "bg-[#12151a]/95 border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.9)] scale-100 opacity-80"
          )}
          style={{
            left: `${activeDrag.currentX}px`,
            top: `${activeDrag.currentY}px`,
          }}
        >
          <OrionAppIcon app={activeDrag.app.id} size={48} />
          <span className="text-xs font-semibold text-white drop-shadow whitespace-nowrap px-2 py-0.5 rounded bg-black/60 border border-white/10">
            {activeDrag.app.name}
          </span>
          {activeDrag.isOverDesktop && (
            <span className="text-[10px] font-medium text-white/90 uppercase tracking-wider bg-white/[0.12] px-2.5 py-0.5 rounded-full border border-white/20 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Drop on Desktop
            </span>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}

interface AppRowProps {
  app: any;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  isPinned: boolean;
  pinToDock: () => void;
  unpinFromDock: () => void;
  isOpen: boolean;
}

function AppGridCard({ app, onClick, onPointerDown, isPinned, pinToDock, unpinFromDock, isOpen }: AppRowProps) {
  const { openContextMenu } = useOrionContextMenu();
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    openContextMenu({ x: e.clientX, y: e.clientY, targetType: 'dock', targetId: app.id, items: [
      { id: 'open', label: 'Open Application', icon: Play, action: onClick },
      { id: 'pin', label: isPinned ? 'Remove from Dock' : 'Pin to Dock', icon: Square, action: isPinned ? unpinFromDock : pinToDock }
    ]});
  };
  return (
    <button 
      type="button" 
      data-testid={`launcher-app-${app.id}`}
      data-app-id={app.id}
      onClick={onClick} 
      onContextMenu={handleContextMenu}
      onPointerDown={onPointerDown}
      onDragStart={e => e.preventDefault()}
      className="min-h-[114px] rounded-xl border border-white/[0.08] bg-white/[0.03] p-3.5 text-left hover:bg-white/[0.07] hover:border-white/[0.15] transition-all outline-none group cursor-grab active:cursor-grabbing select-none"
    >
      <div className="flex items-start justify-between gap-2 pointer-events-none">
        <OrionAppIcon app={app.id} size={38} className="transition-transform duration-200 group-hover:scale-105 pointer-events-none" />
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md pointer-events-none", isOpen ? "bg-sky-500/20 text-sky-300" : "text-slate-400 bg-white/[0.04]")}>{isOpen ? 'Running' : 'Open'}</span>
      </div>
      <div className="mt-2.5 min-w-0 pointer-events-none">
        <div className="text-[13px] font-semibold text-white truncate pointer-events-none">{app.name}</div>
        <div className="text-[11px] leading-relaxed text-slate-400 line-clamp-2 mt-0.5 pointer-events-none">{app.description}</div>
      </div>
    </button>
  );
}

function AppRow({ app, onClick, onPointerDown, isPinned, pinToDock, unpinFromDock, isOpen }: AppRowProps) {
  const { openContextMenu } = useOrionContextMenu();

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    openContextMenu({
      x: e.clientX,
      y: e.clientY,
      targetType: 'dock',
      targetId: app.id,
      items: [
      {
        id: 'open',
        label: 'Open Application',
        icon: Play,
        action: onClick,
      },
      {
        id: 'pin',
        label: isPinned ? 'Remove from Dock' : 'Pin to Dock',
        icon: Square,
        action: isPinned ? unpinFromDock : pinToDock,
      }
    ]});
  };

  return (
    <button 
      type="button"
      data-testid={`launcher-app-${app.id}`}
      data-app-id={app.id}
      onClick={onClick}
      onContextMenu={handleContextMenu}
      onPointerDown={onPointerDown}
      onDragStart={e => e.preventDefault()}
      className="flex items-center gap-3.5 group outline-none w-full px-3 py-2.5 hover:bg-white/[0.06] focus:bg-white/[0.08] rounded-xl transition-all duration-150 cursor-grab active:cursor-grabbing text-left select-none"
    >
      <OrionAppIcon app={app.id} size={36} className="transition-transform duration-200 group-hover:scale-105 shrink-0 pointer-events-none" />
      
      <div className="flex flex-col items-start min-w-0 flex-1 text-left pointer-events-none">
        <span className="text-[13px] font-semibold text-white group-hover:text-white transition-colors truncate w-full pointer-events-none">
          {app.name}
        </span>
        <span className="text-[11px] text-slate-400 group-hover:text-slate-300 transition-colors truncate w-full pointer-events-none">
          {app.description}
        </span>
      </div>

      <div className="shrink-0 flex items-center pr-1 pointer-events-none">
        <span className={cn(
          "text-[10px] font-medium tracking-wide px-2.5 py-1 rounded-md transition-colors pointer-events-none",
          isOpen ? "text-sky-300 bg-sky-500/20" : "text-slate-400 group-hover:text-slate-200"
        )}>
          {isOpen ? 'Running' : 'Open'}
        </span>
      </div>
    </button>
  );
}
