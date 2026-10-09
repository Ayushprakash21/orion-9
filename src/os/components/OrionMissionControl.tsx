import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit2, 
  Layers, 
  Maximize2, 
  Check, 
  ArrowRight,
  Monitor
} from 'lucide-react';
import { useWindowManager, WorkspaceConfig, WorkspaceId } from '../WindowManagerContext';
import { ORION_REGISTRY } from '../OrionApplicationRegistry';
import OrionAppIcon from '../../components/brand/OrionAppIcon';
import { cn } from '../../lib/utils';
import { useToast } from '../../store/ToastContext';

export function OrionMissionControl() {
  const {
    missionControlOpen,
    setMissionControlOpen,
    workspaces,
    activeWorkspaceId,
    setWorkspace,
    createWorkspace,
    renameWorkspace,
    deleteWorkspace,
    windows,
    focusApplication,
    closeApplication,
    moveWindowToWorkspace
  } = useWindowManager();

  const { showToast } = useToast();
  const [editingSpaceId, setEditingSpaceId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [isAddingSpace, setIsAddingSpace] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState('');

  // Keyboard shortcut listener (F3, Escape, Ctrl+Up)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setMissionControlOpen(!missionControlOpen);
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'ArrowUp') {
        e.preventDefault();
        setMissionControlOpen(!missionControlOpen);
        return;
      }
      if (e.key === 'Escape' && missionControlOpen) {
        e.preventDefault();
        setMissionControlOpen(false);
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [missionControlOpen, setMissionControlOpen]);

  const handleCreateSpace = useCallback(() => {
    const name = newSpaceName.trim() || `SPACE ${workspaces.length + 1}`;
    const id = createWorkspace(name);
    setNewSpaceName('');
    setIsAddingSpace(false);
    setWorkspace(id);
    showToast(`Created new space "${name.toUpperCase()}"`, 'success', 'Mission Control');
  }, [newSpaceName, workspaces.length, createWorkspace, setWorkspace, showToast]);

  const handleSaveRename = useCallback((id: WorkspaceId) => {
    const trimmed = editingName.trim();
    if (trimmed) {
      renameWorkspace(id, trimmed);
      showToast(`Renamed space to "${trimmed.toUpperCase()}"`, 'info', 'Mission Control');
    }
    setEditingSpaceId(null);
    setEditingName('');
  }, [editingName, renameWorkspace, showToast]);

  const handleDeleteSpace = useCallback((id: WorkspaceId, name: string) => {
    deleteWorkspace(id);
    showToast(`Removed space "${name}" — windows moved to Operations`, 'info', 'Mission Control');
  }, [deleteWorkspace, showToast]);

  const handleSelectWindow = useCallback((appId: string) => {
    focusApplication(appId);
    setMissionControlOpen(false);
  }, [focusApplication, setMissionControlOpen]);

  if (!missionControlOpen) return null;

  // Windows in active space
  const activeSpaceWindows = Object.values(windows).filter(
    w => w.workspace === activeWorkspaceId && w.state !== 'closed'
  );

  const overlayContent = (
    <AnimatePresence>
      <motion.div
        data-testid="orion-mission-control-overlay"
        initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        animate={{ opacity: 1, backdropFilter: 'blur(28px)' }}
        exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="fixed inset-0 z-[10020] bg-black/75 flex flex-col select-none overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setMissionControlOpen(false);
          }
        }}
      >
        {/* Top Spaces Bar (macOS Style) */}
        <header className="w-full bg-white/[0.04] border-b border-white/10 px-6 py-4 flex items-center justify-between gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10 border border-white/15 text-white shadow-sm">
              <Layers className="w-4 h-4 text-white/90" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white tracking-wide">Spaces & Desktops</h2>
              <p className="text-[11px] text-white/60">Press F3 or Esc to exit Mission Control</p>
            </div>
          </div>

          {/* Spaces Thumbnails / Switcher Row */}
          <div className="flex items-center gap-3 overflow-x-auto py-1 px-2 max-w-3xl custom-scrollbar">
            {workspaces.map((ws: WorkspaceConfig) => {
              const count = Object.values(windows).filter(w => w.workspace === ws.id && w.state !== 'closed').length;
              const isActive = ws.id === activeWorkspaceId;
              const isEditing = editingSpaceId === ws.id;

              return (
                <div
                  key={ws.id}
                  data-testid={`mission-control-space-${ws.id}`}
                  onClick={() => setWorkspace(ws.id)}
                  className={cn(
                    "group relative flex flex-col items-center justify-between px-3.5 py-2 rounded-xl min-w-[130px] h-[68px] cursor-pointer transition-all duration-150 border",
                    isActive
                      ? "bg-white/20 border-white/40 shadow-lg shadow-black/30 ring-2 ring-white/30"
                      : "bg-white/[0.06] border-white/10 hover:bg-white/12 hover:border-white/20"
                  )}
                >
                  {/* Space Card Header */}
                  <div className="w-full flex items-center justify-between gap-1 text-[11px]">
                    {isEditing ? (
                      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="text"
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(ws.id);
                            if (e.key === 'Escape') setEditingSpaceId(null);
                          }}
                          className="w-full px-1.5 py-0.5 bg-black/50 border border-white/30 rounded text-xs text-white outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(ws.id)}
                          className="p-1 rounded bg-white/20 hover:bg-white/30 text-white"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="font-semibold text-white truncate uppercase tracking-wider text-[11px]">
                          {ws.name}
                        </span>
                        {ws.isCustom && (
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              title="Rename Space"
                              onClick={() => {
                                setEditingSpaceId(ws.id);
                                setEditingName(ws.name);
                              }}
                              className="p-0.5 rounded text-white/70 hover:text-white hover:bg-white/15"
                            >
                              <Edit2 className="w-2.5 h-2.5" />
                            </button>
                            <button
                              type="button"
                              title="Delete Space"
                              onClick={() => handleDeleteSpace(ws.id, ws.name)}
                              className="p-0.5 rounded text-red-300 hover:text-red-100 hover:bg-red-500/25"
                            >
                              <Trash2 className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Window Counter badge */}
                  <div className="w-full flex items-center justify-between text-[10px] text-white/70 pt-1 border-t border-white/10">
                    <span className="flex items-center gap-1">
                      <Monitor className="w-2.5 h-2.5 text-white/60" />
                      {count} {count === 1 ? 'window' : 'windows'}
                    </span>
                    {isActive && (
                      <span className="px-1.5 py-0.2 bg-white/30 rounded-full font-mono text-[9px] text-white font-medium">
                        ACTIVE
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Add New Space Button / Inline Input */}
            {isAddingSpace ? (
              <div 
                className="flex items-center gap-1 px-3 py-2 bg-white/[0.08] border border-white/25 rounded-xl min-w-[150px] h-[68px]"
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  autoFocus
                  placeholder="Space Name"
                  value={newSpaceName}
                  onChange={(e) => setNewSpaceName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateSpace();
                    if (e.key === 'Escape') setIsAddingSpace(false);
                  }}
                  className="w-full px-2 py-1 bg-black/50 border border-white/20 rounded text-xs text-white outline-none"
                />
                <button
                  type="button"
                  onClick={handleCreateSpace}
                  className="p-1 rounded bg-white/20 hover:bg-white/30 text-white"
                >
                  <Check className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddingSpace(false)}
                  className="p-1 rounded text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                data-testid="mission-control-add-space-btn"
                onClick={() => setIsAddingSpace(true)}
                className="flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl border border-dashed border-white/25 hover:border-white/50 bg-white/[0.04] hover:bg-white/[0.08] min-w-[80px] h-[68px] text-white/70 hover:text-white transition-all"
                title="Add New Space"
              >
                <Plus className="w-4 h-4" />
                <span className="text-[10px] font-medium uppercase tracking-wider">Add Space</span>
              </button>
            )}
          </div>

          {/* Close Mission Control button */}
          <button
            type="button"
            data-testid="mission-control-close-btn"
            onClick={() => setMissionControlOpen(false)}
            className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            title="Close Mission Control (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Main Exposé Stage: Open Windows in Current Space */}
        <main className="flex-1 p-8 overflow-auto flex flex-col items-center justify-center">
          {activeSpaceWindows.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center max-w-sm p-8 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                <Monitor className="w-6 h-6 text-white/60" />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">No Open Windows</h3>
              <p className="text-xs text-white/60 mb-4">
                This space has no active applications. Launch apps from the Dock or select another space above.
              </p>
              <button
                type="button"
                onClick={() => setMissionControlOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-medium transition-colors"
              >
                Return to Desktop
              </button>
            </div>
          ) : (
            <div className="w-full max-w-6xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
              {activeSpaceWindows.map(win => {
                const reg = ORION_REGISTRY[win.id];
                const appName = reg?.name || win.id;
                const isMaximized = win.state === 'maximized';

                return (
                  <motion.div
                    key={win.id}
                    layoutId={`mission-win-${win.id}`}
                    whileHover={{ scale: 1.02, y: -4 }}
                    transition={{ duration: 0.15 }}
                    data-testid={`mission-control-window-${win.id}`}
                    onClick={() => handleSelectWindow(win.id)}
                    className="group relative flex flex-col rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] border border-white/15 hover:border-white/35 backdrop-blur-xl shadow-xl shadow-black/40 overflow-hidden cursor-pointer transition-colors"
                  >
                    {/* Window Card Titlebar */}
                    <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 bg-white/[0.05]">
                      <div className="flex items-center gap-2.5 truncate">
                        <OrionAppIcon app={win.id} size={18} showContainer={false} />
                        <span className="text-xs font-semibold text-white truncate">{appName}</span>
                        <span className="text-[10px] text-white/50 font-mono uppercase">
                          {isMaximized ? 'MAX' : `${win.size.width}×${win.size.height}`}
                        </span>
                      </div>

                      {/* Close button on card */}
                      <button
                        type="button"
                        title="Close Application"
                        onClick={(e) => {
                          e.stopPropagation();
                          closeApplication(win.id);
                        }}
                        className="p-1 rounded-full text-white/50 hover:text-white hover:bg-red-500/30 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Window Card Body / Visual Thumbnail */}
                    <div className="h-44 p-4 flex flex-col items-center justify-center relative bg-gradient-to-b from-white/[0.02] to-transparent">
                      <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center mb-3 shadow-inner">
                        <OrionAppIcon app={win.id} size={32} showContainer={false} />
                      </div>
                      <span className="text-xs text-white/80 font-medium">{appName}</span>
                      <span className="text-[10px] text-white/50 capitalize mt-0.5">
                        {reg?.category || 'Operation'}
                      </span>

                      {/* Subtle hover prompt */}
                      <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="px-3 py-1 rounded-full bg-white/20 text-[10px] font-medium text-white flex items-center gap-1 shadow-md">
                          Click to Focus <Maximize2 className="w-2.5 h-2.5" />
                        </span>
                      </div>
                    </div>

                    {/* Move to Space Footer Selector */}
                    <div 
                      className="px-3 py-2 bg-white/[0.04] border-t border-white/10 flex items-center justify-between gap-2 text-[10px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span className="text-white/60 font-medium flex items-center gap-1">
                        Move to:
                      </span>
                      <div className="flex items-center gap-1 overflow-x-auto">
                        {workspaces.map(w => (
                          <button
                            key={w.id}
                            type="button"
                            disabled={w.id === win.workspace}
                            onClick={() => {
                              moveWindowToWorkspace(win.id, w.id);
                              showToast(`Moved ${appName} to ${w.name}`, 'info', 'Mission Control');
                            }}
                            className={cn(
                              "px-2 py-0.5 rounded text-[10px] font-medium transition-colors uppercase",
                              w.id === win.workspace
                                ? "bg-white/20 text-white cursor-default"
                                : "bg-white/[0.06] text-white/70 hover:bg-white/15 hover:text-white"
                            )}
                          >
                            {w.name.slice(0, 4)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </motion.div>
    </AnimatePresence>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(overlayContent, document.body);
  }
  return overlayContent;
}
