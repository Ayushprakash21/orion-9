import React, { useRef, useEffect, useState } from 'react';
import {
  ShieldAlert, ExternalLink, RotateCw, AlertTriangle,
  Search, ArrowLeft, Download, Monitor, Copy, Check, Globe
} from 'lucide-react';
import { BrowserTab, BrowserHistoryEntry, SearchEngineType } from './BrowserTypes';
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
  runtimeMode?: 'WEB_EMBEDDED' | 'NATIVE_WEBVIEW' | 'detecting';
  defaultSearchEngine?: SearchEngineType;
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
  defaultSearchEngine,
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
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const isDetecting = runtimeMode === 'detecting';
  const isNative = runtimeMode === 'NATIVE_WEBVIEW' || (!isDetecting && runtimeMode === undefined && isNativeRuntimeAvailable());

  useEffect(() => {
    setPopupBlocked(false);
    setIsCopied(false);
  }, [activeTab?.url]);

  const handleOpenExternal = () => {
    if (!activeTab?.url) return;
    const res = openExternally(activeTab.url);
    if (res.popupBlocked) {
      setPopupBlocked(true);
    } else {
      setPopupBlocked(false);
    }
    if (onOpenExternal) {
      onOpenExternal();
    }
  };

  const handleCopyUrl = async () => {
    if (!activeTab?.url) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(activeTab.url);
      } else if (typeof document !== 'undefined') {
        const textArea = document.createElement('textarea');
        textArea.value = activeTab.url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {}
  };

  // Bounds synchronization for native child WebView surface
  useEffect(() => {
    if (!isNative || !nativeContainerRef.current || !onBoundsChange) return;

    const el = nativeContainerRef.current;
    const reportBounds = () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        if (rect.width <= 0 || rect.height <= 0) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[BROWSER:DIAGNOSTIC] Case D: Native viewport element has 0 dimensions:', {
              width: rect.width,
              height: rect.height,
              top: rect.top,
              left: rect.left,
            });
          }
          return;
        }

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
          if (process.env.NODE_ENV !== 'production' && !prev) {
            console.log('[BROWSER:DIAGNOSTIC] Case E: Initial native viewport bounds applied:', clamped);
          }
          lastBoundsRef.current = clamped;
          onBoundsChange(clamped);
        }
      });
    };

    reportBounds();
    const ro = new ResizeObserver(() => reportBounds());
    ro.observe(el);
    window.addEventListener('resize', reportBounds);
    window.addEventListener('scroll', reportBounds, true);
    // Periodic check to capture window drag movements across OS desktop
    const timer = setInterval(reportBounds, 200);

    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      ro.disconnect();
      window.removeEventListener('resize', reportBounds);
      window.removeEventListener('scroll', reportBounds, true);
      clearInterval(timer);
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

  // 1. STATE: RUNTIME DETECTION IN PROGRESS
  // Do NOT display a permanent web-mode fallback while native capability detection is in progress.
  if (isDetecting) {
    return (
      <div
        data-testid="browser-detecting-runtime"
        className="flex-1 h-full flex flex-col items-center justify-center p-8 bg-os-bg text-center select-none animate-in fade-in duration-150"
      >
        <div className="w-12 h-12 rounded-2xl bg-os-accent/10 border border-os-accent/20 flex items-center justify-center text-os-accent mb-4 shadow-lg">
          <RotateCw className="w-6 h-6 animate-spin" />
        </div>
        <h3 className="text-sm font-semibold text-os-text-primary mb-1">
          Detecting Desktop Runtime...
        </h3>
        <p className="text-xs text-os-text-muted max-w-sm">
          Checking native child WebView capabilities for direct in-window browsing.
        </p>
      </div>
    );
  }

  // 2. STATE: INTERNAL_ORION_CONTENT (Empty or New Tab)
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
          defaultSearchEngine={defaultSearchEngine}
        />
      </div>
    );
  }

  // 3. STATE: BLOCKED EMBEDDING OR EXTERNAL REQUIRED (Only in Web Embedded mode, NEVER in native mode or while detecting)
  const isWebBlockedOrExternal =
    !isNative && !isDetecting && (
      activeTab.loadState === 'EXTERNAL_REQUIRED' ||
      activeTab.contentState === 'EXTERNAL_REQUIRED' ||
      activeTab.webNavigationState === 'EXTERNAL_REQUIRED' ||
      activeTab.loadState === 'BLOCKED_EMBEDDING' ||
      activeTab.contentState === 'BLOCKED_EMBEDDING' ||
      resolveWebModePolicy(activeTab.url).decision === 'EXTERNAL_REQUIRED'
    );

  if (isWebBlockedOrExternal) {
    if (process.env.NODE_ENV !== 'production') {
      console.log('[BROWSER:DIAGNOSTIC] Case A/Web: Rendering web-mode fallback card for:', activeTab.url);
    }
    let siteName = 'This website';
    let searchQuery: string | null = null;
    try {
      const parsedUrl = new URL(activeTab.url);
      siteName = parsedUrl.hostname.replace(/^www\./, '');
      siteName = siteName.charAt(0).toUpperCase() + siteName.slice(1);
      if (parsedUrl.searchParams.has('q')) {
        searchQuery = parsedUrl.searchParams.get('q');
      }
    } catch {}

    const isSearchQuery = Boolean(searchQuery);

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
          ORION Desktop is required for full web browsing.
        </div>

        <h2 className="text-xl font-semibold text-os-text-primary mb-2 max-w-md">
          Desktop Browser Runtime Required
        </h2>

        <p className="text-xs text-os-text-muted mb-2 max-w-md leading-relaxed">
          Website Cannot Be Embedded. Web Mode cannot host arbitrary websites because modern browsers enforce website embedding security policies.
        </p>

        <p className="text-[11px] text-os-text-muted/80 mb-3 max-w-md leading-relaxed">
          Full browser runtime unavailable in web mode. {siteName} cannot be embedded safely inside an iframe.
        </p>

        <div className="text-[11px] text-os-text-muted/90 mb-4 max-w-md leading-relaxed bg-white/[0.03] p-2.5 rounded-lg border border-white/[0.06] text-left">
          <span className="font-semibold text-os-text-secondary">Current Environment:</span> Running in Web Browser Mode (<code className="text-[10px] text-os-accent">WEB_EMBEDDED</code>). External search engines and websites forbid iframe embedding via <code className="text-[10px] text-os-text-secondary">X-Frame-Options: SAMEORIGIN</code>. Use <strong>Open Externally</strong> or launch the native Tauri desktop app (<code className="text-[10px] text-os-accent">orion-desktop.exe</code>) for direct in-window browsing.
        </div>

        {/* Preserved Destination URL & Search Query display */}
        <div className="w-full max-w-md p-3 mb-4 rounded-xl bg-os-surface border border-os-border text-left">
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span className="text-[11px] uppercase tracking-wider text-os-text-muted font-medium flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-os-accent shrink-0" />
              {isSearchQuery ? `Search Query: "${searchQuery}"` : 'Preserved Destination'}
            </span>
            <button
              type="button"
              data-testid="browser-copy-url-btn"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1 text-[11px] text-os-accent hover:underline cursor-pointer"
              title="Copy destination URL"
            >
              {isCopied ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400 font-medium">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Address</span>
                </>
              )}
            </button>
          </div>
          <div
            data-testid="browser-target-url"
            className="font-mono text-xs text-os-text-secondary truncate bg-os-bg/70 px-2.5 py-1.5 rounded-lg border border-os-border/50 select-all"
            title={activeTab.url}
          >
            {activeTab.url}
          </div>
        </div>

        {/* Actionable Popup Blocked Alert with direct anchor link */}
        {popupBlocked && (
          <div
            data-testid="browser-popup-blocked-alert"
            className="w-full max-w-md p-3 mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex flex-col items-center gap-2 animate-in fade-in"
          >
            <div className="flex items-center gap-1.5 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Popup window blocked by host browser.</span>
            </div>
            <p className="text-[11px] text-amber-200/80 text-center leading-relaxed">
              Modern browsers restrict automatic window opening. Click below to launch directly without popup restrictions:
            </p>
            <a
              href={activeTab.url}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="browser-direct-external-link"
              className="px-3.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 text-xs font-medium inline-flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Link Directly
            </a>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            data-testid="browser-open-external-btn"
            title="Open in system browser"
            onClick={handleOpenExternal}
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
            title="Desktop app required"
            onClick={() => {
              if (onInstallDesktop) {
                onInstallDesktop();
              } else {
                const link = document.createElement('a');
                link.href = '/api/download/desktop';
                link.download = 'Orion-9-Setup.exe';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            }}
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