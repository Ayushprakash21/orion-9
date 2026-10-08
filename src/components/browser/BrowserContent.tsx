import React, { useRef, useEffect } from 'react';
import { 
  ShieldAlert, ExternalLink, RotateCw, AlertTriangle, 
  Search, ArrowLeft, Download, Monitor
} from 'lucide-react';
import { BrowserTab, BrowserHistoryEntry } from './BrowserTypes';
import { BrowserNewTab } from './BrowserNewTab';
import { BrowserWebRuntime } from './BrowserWebRuntime';
import { BrowserBounds } from './BrowserRuntimeAdapter';
import { isNativeRuntimeAvailable } from './BrowserRuntimeCapability';
import { openExternally } from './BrowserSecurity';
import { browserNativeRuntime } from './BrowserNativeRuntime';
import { resolveWebModePolicy } from './WebModePolicy';

export interface BrowserContentProps {
  activeTab?: BrowserTab;
  tab?: BrowserTab;
  recentHistory?: BrowserHistoryEntry[];
  zoomLevel?: number;
  runtimeMode?: 'WEB_EMBEDDED' | 'NATIVE_WEBVIEW';
  onNavigate?: (url: string) => void;
  onBack?: () => void;
  onReload?: () => void;
  onBlocked?: () => void;
  onLoadComplete?: () => void;
  onError?: (err?: string) => void;
  onRemoveHistoryItem?: (id: string) => void;
  onOpenExternal?: () => void;
  onInstallDesktop?: () => void;
  onBoundsChange?: (bounds: BrowserBounds) => void;
}

export const BrowserContent: React.FC<BrowserContentProps> = ({
  activeTab: propActiveTab,
  tab: propTab,
  recentHistory = [],
  zoomLevel = 1.0,
  runtimeMode,
  onNavigate = () => {},
  onBack = () => {},
  onReload = () => {},
  onBlocked = () => {},
  onLoadComplete = () => {},
  onError = () => {},
  onRemoveHistoryItem,
  onOpenExternal,
  onInstallDesktop,
  onBoundsChange,
}) => {
  const activeTab = propActiveTab || propTab;
  const nativeContainerRef = useRef<HTMLDivElement>(null);
  const lastBoundsRef = useRef<BrowserBounds | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const isNative = runtimeMode === 'NATIVE_WEBVIEW' || (runtimeMode === undefined && isNativeRuntimeAvailable());

  // Bounds synchronization for native child WebView surface
  useEffect(() => {
    if (!isNative || !nativeContainerRef.current || !onBoundsChange) return;

    const el = nativeContainerRef.current;
    const reportBounds = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) return;

        const clamped: BrowserBounds = {
          x: Math.round(rect.left),
          y: Math.round(rect.top),
          width: Math.max(1, Math.round(rect.width)),
          height: Math.max(1, Math.round(rect.height)),
        };

        const prev = lastBoundsRef.current;
        if (
          !prev ||
          prev.x !== clamped.x ||
          prev.y !== clamped.y ||
          prev.width !== clamped.width ||
          prev.height !== clamped.height
        ) {
          lastBoundsRef.current = clamped;
          onBoundsChange(clamped);
        }
      });
    };

    reportBounds();
    const ro = new ResizeObserver(() => reportBounds());
    ro.observe(el);
    window.addEventListener('resize', reportBounds);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      ro.disconnect();
      window.removeEventListener('resize', reportBounds);
    };
  }, [isNative, onBoundsChange]);

  // When active tab is internal orion://newtab, ensure any native surfaces are hidden
  useEffect(() => {
    if (isNative && activeTab && (activeTab.url === 'orion://newtab' || activeTab.loadState === 'EMPTY_TAB')) {
      browserNativeRuntime.hideSurface(activeTab.id).catch(() => {});
    }
  }, [isNative, activeTab]);

  if (!activeTab) return null;

  const effectiveZoom = activeTab.zoomLevel || zoomLevel || 1.0;

  // 1. STATE: INTERNAL_ORION_CONTENT (Empty or New Tab)
  if (
    activeTab.url === 'orion://newtab' || 
    activeTab.url === 'about:blank' || 
    activeTab.url === 'about:newtab' || 
    activeTab.loadState === 'EMPTY_TAB' || 
    activeTab.contentState === 'EMPTY_TAB'
  ) {
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

  // 2. STATE: BLOCKED EMBEDDING OR EXTERNAL REQUIRED (Only in Web Embedded mode, NEVER in native mode)
  const isWebBlockedOrExternal = 
    !isNative && (
      activeTab.loadState === 'EXTERNAL_REQUIRED' || 
      activeTab.contentState === 'EXTERNAL_REQUIRED' ||
      activeTab.webNavigationState === 'EXTERNAL_REQUIRED' ||
      activeTab.loadState === 'BLOCKED_EMBEDDING' || 
      activeTab.contentState === 'BLOCKED_EMBEDDING' ||
      resolveWebModePolicy(activeTab.url).decision === 'EXTERNAL_REQUIRED'
    );

  if (isWebBlockedOrExternal) {
    let siteName = 'This website';
    try {
      siteName = new URL(activeTab.url).hostname.replace(/^www\./, '');
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
    } catch {}

    return (
      <div 
        data-testid="browser-blocked-embedding"
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-os-bg text-center select-none animate-in fade-in duration-150"
      >
        <div className="w-16 h-16 rounded-3xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4 shadow-xl">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-os-surface border border-os-border text-[11px] text-os-text-muted mb-3 font-medium">
          <Monitor className="w-3.5 h-3.5 text-os-accent" />
          Full browser runtime unavailable in web mode.
        </div>

        <h2 className="text-xl font-semibold text-os-text-primary mb-2 max-w-md">
          Website Cannot Be Embedded
        </h2>

        <p className="text-xs text-os-text-muted mb-6 max-w-md leading-relaxed">
          {siteName} cannot be embedded safely inside ORION-9 Web Mode. This website controls its own iframe embedding security policy. Web Mode cannot override that policy.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            data-testid="browser-open-external-btn"
            title="Open in system browser"
            onClick={() => onOpenExternal ? onOpenExternal() : openExternally(activeTab.url)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer shadow-md"
          >
            <ExternalLink className="w-4 h-4" />
            Open Externally
          </button>

          <button
            type="button"
            data-testid="browser-back-to-newtab-btn"
            onClick={() => onBack ? onBack() : onNavigate('orion://newtab')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-secondary text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <button
            type="button"
            data-testid="browser-install-desktop-btn"
            onClick={() => onInstallDesktop ? onInstallDesktop() : openExternally('https://orion9.tech/download')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-primary text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-os-accent" />
            Install Orion Desktop
          </button>
        </div>
      </div>
    );
  }

  // 3. STATE: INVALID URL
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
          {activeTab.errorDetails || `The address ${activeTab.url} is not a supported protocol or valid host.`}
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

  // 4. STATE: NETWORK ERROR OR REACHABILITY FAILURE
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
            onClick={() => onOpenExternal ? onOpenExternal() : openExternally(activeTab.url)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-secondary text-xs font-medium transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Open in External Window
          </button>
        </div>
      </div>
    );
  }

  // 5. STATE: NATIVE RUNTIME ERROR
  if (isNative && (activeTab.loadState === 'NATIVE_RUNTIME_ERROR' || activeTab.contentState === 'NATIVE_RUNTIME_ERROR')) {
    return (
      <div 
        data-testid="browser-native-error"
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-os-bg text-center select-none"
      >
        <div className="w-16 h-16 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-6 shadow-xl">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-semibold text-os-text-primary mb-2 max-w-md">
          Native Browser Surface Error
        </h2>

        <p className="text-xs text-os-text-muted mb-6 max-w-md leading-relaxed">
          {activeTab.errorDetails || 'Orion Desktop could not create the native browser surface.'}
        </p>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onReload}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer shadow-md"
          >
            <RotateCw className="w-4 h-4" />
            Retry
          </button>

          <button
            type="button"
            onClick={() => onOpenExternal ? onOpenExternal() : openExternally(activeTab.url)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-os-surface hover:bg-os-surface-hover border border-os-border text-os-text-secondary text-xs font-medium transition-colors cursor-pointer"
          >
            <ExternalLink className="w-4 h-4" />
            Open in System Browser
          </button>
        </div>
      </div>
    );
  }

  // 6. STATE: NATIVE_WEBVIEW_CONTENT (Native Desktop WebView Viewport Mount)
  if (isNative) {
    return (
      <div 
        ref={nativeContainerRef}
        data-testid="browser-native-viewport"
        className="flex-1 w-full h-full relative overflow-hidden bg-transparent"
        style={{
          transform: effectiveZoom !== 1.0 ? `scale(${effectiveZoom})` : undefined,
          transformOrigin: 'top left',
          width: effectiveZoom !== 1.0 ? `${100 / effectiveZoom}%` : '100%',
          height: effectiveZoom !== 1.0 ? `${100 / effectiveZoom}%` : '100%',
        }}
      >
        {/* Transparent surface placeholder for native OS child webview positioning */}
        <div className="absolute inset-0 bg-transparent pointer-events-none" />
      </div>
    );
  }

  // 7. STATE: WEB_EMBEDDED_CONTENT (Sandboxed iframe Compatibility Viewer)
  return (
    <div 
      className="flex-1 w-full h-full relative overflow-hidden bg-white"
      style={{
        transform: effectiveZoom !== 1.0 ? `scale(${effectiveZoom})` : undefined,
        transformOrigin: 'top left',
        width: effectiveZoom !== 1.0 ? `${100 / effectiveZoom}%` : '100%',
        height: effectiveZoom !== 1.0 ? `${100 / effectiveZoom}%` : '100%',
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
