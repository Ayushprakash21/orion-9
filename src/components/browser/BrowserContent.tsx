import React from 'react';
import { 
  ShieldAlert, ExternalLink, RotateCw, AlertTriangle, 
  Search, ArrowLeft
} from 'lucide-react';
import { BrowserTab, BrowserHistoryEntry } from './BrowserTypes';
import { BrowserNewTab } from './BrowserNewTab';
import { BrowserWebRuntime } from './BrowserWebRuntime';

export interface BrowserContentProps {
  activeTab?: BrowserTab;
  tab?: BrowserTab;
  recentHistory?: BrowserHistoryEntry[];
  zoomLevel?: number;
  onNavigate?: (url: string) => void;
  onReload?: () => void;
  onBlocked?: () => void;
  onLoadComplete?: () => void;
  onError?: (err?: string) => void;
  onRemoveHistoryItem?: (id: string) => void;
  onOpenExternal?: () => void;
}

export const BrowserContent: React.FC<BrowserContentProps> = ({
  activeTab: propActiveTab,
  tab: propTab,
  recentHistory = [],
  zoomLevel = 1.0,
  onNavigate = () => {},
  onReload = () => {},
  onBlocked = () => {},
  onLoadComplete = () => {},
  onError = () => {},
  onRemoveHistoryItem,
  onOpenExternal,
}) => {
  const activeTab = propActiveTab || propTab;
  if (!activeTab) return null;

  const effectiveZoom = activeTab.zoomLevel || zoomLevel || 1.0;

  // If tab is empty or pointing to new tab
  if (activeTab.url === 'orion://newtab' || activeTab.url === 'about:blank' || activeTab.url === 'about:newtab' || activeTab.loadState === 'EMPTY_TAB' || activeTab.contentState === 'EMPTY_TAB') {
    return (
      <div 
        className="flex-1 w-full h-full relative overflow-hidden"
        style={{
          transform: effectiveZoom !== 1.0 ? `scale(${effectiveZoom})` : undefined,
          transformOrigin: 'top left',
          width: effectiveZoom !== 1.0 ? `${100 / effectiveZoom}%` : '100%',
          height: effectiveZoom !== 1.0 ? `${100 / effectiveZoom}%` : '100%',
        }}
      >
        <BrowserNewTab
          onNavigate={onNavigate}
          recentHistory={recentHistory}
          onRemoveHistoryItem={onRemoveHistoryItem}
        />
      </div>
    );
  }

  // If website refuses iframe embedding (e.g., Google, GitHub, etc.)
  if (activeTab.loadState === 'BLOCKED_EMBEDDING' || activeTab.contentState === 'BLOCKED_EMBEDDING') {
    return (
      <div 
        data-testid="browser-blocked-embedding"
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-os-bg text-center select-none"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-os-text-primary mb-2 max-w-md">
          Embedding Restricted
        </h2>

        <p className="text-xs text-os-text-muted mb-6 max-w-md leading-relaxed">
          This website cannot be embedded in Orion Browser because the website owner prevents embedded browsing for security reasons (<span className="font-mono">X-Frame-Options</span> or <span className="font-mono">Content-Security-Policy</span>).
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            data-testid="browser-open-external-btn"
            onClick={() => onOpenExternal ? onOpenExternal() : window.open(activeTab.url, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer shadow-md"
          >
            <ExternalLink className="w-4 h-4" />
            Open in External Window
          </button>

          <button
            type="button"
            onClick={() => onNavigate('orion://newtab')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-secondary text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to New Tab
          </button>
        </div>
      </div>
    );
  }

  // If URL is invalid
  if (activeTab.loadState === 'INVALID_URL') {
    return (
      <div 
        data-testid="browser-invalid-url"
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-os-bg text-center select-none"
      >
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-os-text-primary mb-2 max-w-md">
          Invalid Web Address
        </h2>

        <p className="text-xs text-os-text-muted mb-6 max-w-md leading-relaxed">
          The address <span className="font-mono text-os-text-secondary">{activeTab.url}</span> is not a valid URL or host.
        </p>

        <button
          type="button"
          onClick={() => onNavigate('orion://newtab')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer shadow-md"
        >
          <Search className="w-4 h-4" />
          Search Web Instead
        </button>
      </div>
    );
  }

  // If Network or Unknown error
  if (activeTab.loadState === 'NETWORK_ERROR' || activeTab.loadState === 'UNKNOWN_ERROR') {
    return (
      <div 
        data-testid="browser-network-error"
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-os-bg text-center select-none"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-6 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-os-text-primary mb-2 max-w-md">
          Page Could Not Be Reached
        </h2>

        <p className="text-xs text-os-text-muted mb-6 max-w-md leading-relaxed">
          {activeTab.errorDetails ? (
            activeTab.errorDetails
          ) : (
            <>Orion Browser could not connect to <span className="font-mono text-os-text-secondary">{activeTab.url}</span>. Verify your network connection or target host status.</>
          )}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer shadow-md"
          >
            <RotateCw className="w-4 h-4" />
            Try Again
          </button>

          <button
            type="button"
            onClick={() => onOpenExternal ? onOpenExternal() : window.open(activeTab.url, '_blank', 'noopener,noreferrer')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-secondary text-xs font-medium transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Open in External Window
          </button>
        </div>
      </div>
    );
  }

  // Active Embeddable Web Runtime with Zoom Scaling
  return (
    <div 
      className="flex-1 w-full h-full relative overflow-hidden bg-white"
      style={{
        transform: zoomLevel !== 1.0 ? `scale(${zoomLevel})` : undefined,
        transformOrigin: 'top left',
        width: zoomLevel !== 1.0 ? `${100 / zoomLevel}%` : '100%',
        height: zoomLevel !== 1.0 ? `${100 / zoomLevel}%` : '100%',
      }}
    >
      <BrowserWebRuntime
        url={activeTab.url}
        generation={activeTab.generation}
        onBlocked={onBlocked}
        onLoadComplete={onLoadComplete}
        onError={onError}
      />
    </div>
  );
};
