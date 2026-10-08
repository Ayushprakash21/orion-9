import React from 'react';
import { 
  Plus, RotateCcw, Clock, Bookmark, Download, 
  Search, ZoomIn, ZoomOut, Settings, ExternalLink
} from 'lucide-react';

export interface BrowserMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onNewTab: () => void;
  onReopenClosedTab: () => void;
  canReopenTab?: boolean;
  canReopenClosedTab?: boolean;
  onOpenHistory: () => void;
  onOpenBookmarks: () => void;
  onOpenDownloads: () => void;
  onFindInPage: () => void;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onOpenSettings: () => void;
  onOpenExternal?: () => void;
  currentUrl?: string;
}

export const BrowserMenu: React.FC<BrowserMenuProps> = ({
  isOpen,
  onClose,
  onNewTab,
  onReopenClosedTab,
  canReopenTab,
  canReopenClosedTab,
  onOpenHistory,
  onOpenBookmarks,
  onOpenDownloads,
  onFindInPage,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onOpenSettings,
  onOpenExternal,
}) => {
  if (!isOpen) return null;

  return (
    <>
      {/* Invisible backdrop to dismiss menu */}
      <div 
        className="fixed inset-0 z-40" 
        onClick={onClose} 
      />

      <div 
        data-testid="browser-menu-dropdown"
        className="absolute top-10 right-3 z-50 w-64 rounded-2xl bg-os-surface border border-os-border shadow-2xl p-1.5 flex flex-col gap-0.5 select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* New Tab */}
        <button
          type="button"
          onClick={() => { onNewTab(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Plus className="w-4 h-4 text-os-text-muted" />
            <span>New Tab</span>
          </div>
          <span className="text-[10px] text-os-text-muted font-mono">Ctrl+T</span>
        </button>

        {/* Reopen Closed Tab */}
        <button
          type="button"
          disabled={!(canReopenClosedTab ?? canReopenTab)}
          onClick={() => { onReopenClosedTab(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover disabled:opacity-40 disabled:hover:bg-transparent text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <RotateCcw className="w-4 h-4 text-os-text-muted" />
            <span>Reopen Closed Tab</span>
          </div>
          <span className="text-[10px] text-os-text-muted font-mono">Ctrl+Shift+T</span>
        </button>

        <div className="h-px bg-os-border/50 my-1 mx-2" />

        {/* History */}
        <button
          type="button"
          onClick={() => { onOpenHistory(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-os-text-muted" />
            <span>History</span>
          </div>
          <span className="text-[10px] text-os-text-muted font-mono">Ctrl+H</span>
        </button>

        {/* Bookmarks */}
        <button
          type="button"
          onClick={() => { onOpenBookmarks(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Bookmark className="w-4 h-4 text-os-text-muted" />
            <span>Bookmarks</span>
          </div>
          <span className="text-[10px] text-os-text-muted font-mono">Ctrl+Shift+O</span>
        </button>

        {/* Downloads */}
        <button
          type="button"
          onClick={() => { onOpenDownloads(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Download className="w-4 h-4 text-os-text-muted" />
            <span>Downloads</span>
          </div>
          <span className="text-[10px] text-os-text-muted font-mono">Ctrl+J</span>
        </button>

        {/* Find in Page */}
        <button
          type="button"
          onClick={() => { onFindInPage(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Search className="w-4 h-4 text-os-text-muted" />
            <span>Find in Page</span>
          </div>
          <span className="text-[10px] text-os-text-muted font-mono">Ctrl+F</span>
        </button>

        <div className="h-px bg-os-border/50 my-1 mx-2" />

        {/* Zoom Controls */}
        <div className="flex items-center justify-between px-3 py-1.5">
          <span className="text-xs text-os-text-muted">Zoom</span>
          <div className="flex items-center gap-1 bg-os-bg border border-os-border rounded-lg p-0.5">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={onZoomOut}
              className="p-1 rounded hover:bg-os-surface text-os-text-secondary hover:text-os-text-primary cursor-pointer"
              title="Zoom out (Ctrl+-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={onResetZoom}
              className="px-2 py-0.5 text-[11px] font-mono text-os-text-primary hover:bg-os-surface rounded cursor-pointer"
              title="Reset zoom (Ctrl+0)"
            >
              {Math.round(zoomLevel * 100)}%
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={onZoomIn}
              className="p-1 rounded hover:bg-os-surface text-os-text-secondary hover:text-os-text-primary cursor-pointer"
              title="Zoom in (Ctrl++)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="h-px bg-os-border/50 my-1 mx-2" />

        {/* Open in External Browser */}
        <button
          type="button"
          onClick={() => { onOpenExternal(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <ExternalLink className="w-4 h-4 text-os-text-muted" />
            <span>Open Externally</span>
          </div>
        </button>

        {/* Browser Settings */}
        <button
          type="button"
          onClick={() => { onOpenSettings(); onClose(); }}
          className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-os-surface-hover text-xs text-os-text-primary transition-colors cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5">
            <Settings className="w-4 h-4 text-os-text-muted" />
            <span>Browser Settings</span>
          </div>
        </button>
      </div>
    </>
  );
};
