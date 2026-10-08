import React from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, X, Home, 
  Sparkles, MoreVertical, Bookmark as BookmarkIcon
} from 'lucide-react';
import { BrowserAddressBar } from './BrowserAddressBar';
import { BrowserBookmarkEntry } from './BrowserTypes';
import { cn } from '../../lib/utils';

export interface BrowserToolbarProps {
  currentUrl: string;
  canGoBack: boolean;
  canGoForward: boolean;
  isLoading: boolean;
  securityStatus?: 'secure' | 'insecure' | 'internal';
  isBookmarked: boolean;
  showBookmarksBar?: boolean;
  bookmarks?: BrowserBookmarkEntry[];
  addressInputRef?: React.RefObject<HTMLInputElement | null>;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onStop: () => void;
  onHome: () => void;
  onNavigate: (url: string) => void;
  onToggleBookmark: () => void;
  onOpenMenu: () => void;
  onAskCopilot: () => void;
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
  currentUrl,
  canGoBack,
  canGoForward,
  isLoading,
  securityStatus = 'secure',
  isBookmarked,
  showBookmarksBar = true,
  bookmarks = [],
  addressInputRef,
  onBack,
  onForward,
  onReload,
  onStop,
  onHome,
  onNavigate,
  onToggleBookmark,
  onOpenMenu,
  onAskCopilot,
}) => {
  return (
    <div data-testid="browser-toolbar" className="flex flex-col bg-os-surface border-b border-os-border select-none">
      {/* Primary Toolbar Row */}
      <div className="flex items-center gap-1.5 px-3 py-1.5">
        {/* Back Button */}
        <button
          type="button"
          data-testid="browser-back-btn"
          aria-label="Back (Alt+Left)"
          disabled={!canGoBack}
          onClick={onBack}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover focus:outline-none",
            !canGoBack && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-os-text-secondary"
          )}
          title="Back (Alt+Left)"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Forward Button */}
        <button
          type="button"
          data-testid="browser-forward-btn"
          aria-label="Forward (Alt+Right)"
          disabled={!canGoForward}
          onClick={onForward}
          className={cn(
            "p-1.5 rounded-lg transition-colors cursor-pointer text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover focus:outline-none",
            !canGoForward && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-os-text-secondary"
          )}
          title="Forward (Alt+Right)"
        >
          <ArrowRight className="w-4 h-4" />
        </button>

        {/* Reload / Stop Button */}
        <button
          type="button"
          data-testid={isLoading ? "browser-stop-btn" : "browser-reload-btn"}
          aria-label={isLoading ? "Stop loading (Esc)" : "Reload page (Ctrl+R)"}
          onClick={isLoading ? onStop : onReload}
          className="p-1.5 rounded-lg transition-colors cursor-pointer text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover focus:outline-none"
          title={isLoading ? "Stop loading" : "Reload page (Ctrl+R)"}
        >
          {isLoading ? (
            <X className="w-4 h-4 text-amber-400" />
          ) : (
            <RotateCw className="w-4 h-4" />
          )}
        </button>

        {/* Home Button */}
        <button
          type="button"
          data-testid="browser-home-btn"
          aria-label="Home page"
          onClick={onHome}
          className="p-1.5 rounded-lg transition-colors cursor-pointer text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover focus:outline-none"
          title="Open New Tab / Home"
        >
          <Home className="w-4 h-4" />
        </button>

        {/* Omnibox / Address Bar */}
        <BrowserAddressBar
          currentUrl={currentUrl}
          isLoading={isLoading}
          securityStatus={securityStatus}
          isBookmarked={isBookmarked}
          onNavigate={onNavigate}
          onToggleBookmark={onToggleBookmark}
          inputRef={addressInputRef}
        />

        {/* Ask Orion Copilot Action */}
        <button
          type="button"
          data-testid="browser-ask-copilot-btn"
          aria-label="Ask Orion Copilot about this page"
          onClick={onAskCopilot}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-os-accent/10 hover:bg-os-accent/20 border border-os-accent/30 text-os-accent hover:text-os-accent text-xs font-medium transition-colors cursor-pointer shrink-0 focus:outline-none"
          title="Ask Orion Copilot"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Ask Orion Copilot</span>
        </button>

        {/* Browser Menu Button */}
        <button
          type="button"
          aria-label="Browser menu"
          onClick={onOpenMenu}
          className="p-1.5 rounded-lg transition-colors cursor-pointer text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover focus:outline-none"
          title="Customize and control Orion Browser"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>

      {/* Bookmarks Quick Bar (Optional Sub-row) */}
      {showBookmarksBar && bookmarks.length > 0 && (
        <div className="flex items-center gap-1 px-3 py-1 bg-os-bg/50 border-t border-os-border/40 overflow-x-auto custom-scrollbar">
          {bookmarks.slice(0, 8).map((bm) => (
            <button
              key={bm.id}
              type="button"
              onClick={() => onNavigate(bm.url)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md hover:bg-os-surface-hover text-[11px] text-os-text-muted hover:text-os-text-primary truncate max-w-[150px] transition-colors cursor-pointer"
              title={`${bm.title} (${bm.url})`}
            >
              <BookmarkIcon className="w-3 h-3 text-os-accent/70 shrink-0" />
              <span className="truncate">{bm.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
