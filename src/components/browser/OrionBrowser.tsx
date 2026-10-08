/**
 * ORION-9 ORION BROWSER APPLICATION
 * 
 * First-class OS application implementing tabbed web browsing, omnibox address resolution,
 * navigation race safety, history, bookmarks, Copilot integration, and theme compliance.
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { BrowserTab, BrowserHistoryEntry, BrowserBookmarkEntry, BrowserPreferences, DEFAULT_BROWSER_PREFERENCES } from './BrowserTypes';
import { BrowserTabBar } from './BrowserTabBar';
import { BrowserToolbar } from './BrowserToolbar';
import { BrowserContent } from './BrowserContent';
import { BrowserMenu } from './BrowserMenu';
import { browserHistory } from './BrowserHistory';
import { browserBookmarks } from './BrowserBookmarks';
import { browserDownloadManager } from './BrowserDownloadManager';
import { normalizeUrl, resolveAddressInput, isValidUrl } from './BrowserEngine';
import { BrowserCopilotPermissionLayer, validateBrowserUrl, openExternally } from './BrowserSecurity';
import { resolveWebModePolicy } from './WebModePolicy';
import { BrowserRuntimeAdapter, getBrowserRuntimeAdapter, BrowserBounds } from './BrowserRuntimeAdapter';
import { detectBrowserRuntimeCapability, resolveAuthoritativeCapability, getCachedAuthoritativeCapability, BrowserRuntimeCapability } from './BrowserRuntimeCapability';
import { BrowserDiagnosticsOverlay } from './BrowserDiagnosticsOverlay';
import { useWindowManager } from '../../os/WindowManagerContext';
import { useToast } from '../../store/ToastContext';
import { Search, X, ChevronUp, ChevronDown, Clock, Bookmark as BookmarkIcon, Trash2, Settings, ExternalLink, Activity } from 'lucide-react';
import { cn } from '../../lib/utils';

export function OrionBrowser() {
  let openApplication: ((id: string) => void) | undefined;
  try {
    const wm = useWindowManager();
    openApplication = wm?.openApplication;
  } catch {
    openApplication = undefined;
  }

  let showToast: ((msg: string, type?: any, title?: string) => void) | undefined;
  try {
    const toast = useToast();
    showToast = toast?.showToast;
  } catch {
    showToast = undefined;
  }

  const addressInputRef = useRef<HTMLInputElement>(null);
  const browserContainerRef = useRef<HTMLDivElement>(null);

  // Tab State
  const [tabs, setTabs] = useState<BrowserTab[]>(() => [
    {
      id: 'tab-1',
      title: 'New Tab',
      url: 'orion://newtab',
      loading: false,
      canGoBack: false,
      canGoForward: false,
      historyIndex: 0,
      historyStack: ['orion://newtab'],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      loadState: 'EMPTY_TAB',
      generation: 1,
      securityStatus: 'internal',
    }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [closedTabsStack, setClosedTabsStack] = useState<BrowserTab[]>([]);

  // Preferences & Zoom
  const [preferences, setPreferences] = useState<BrowserPreferences>(DEFAULT_BROWSER_PREFERENCES);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);

  // UI Overlays State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHistoryDrawerOpen, setIsHistoryDrawerOpen] = useState(false);
  const [isBookmarksDrawerOpen, setIsBookmarksDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isFindInPageOpen, setIsFindInPageOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [findMatches, setFindMatches] = useState({ count: 0, activeIndex: 0 });
  const [capability, setCapability] = useState<BrowserRuntimeCapability>(() => {
    return getCachedAuthoritativeCapability() || detectBrowserRuntimeCapability();
  });
  const [isCapabilityResolved, setIsCapabilityResolved] = useState<boolean>(() => {
    return Boolean(getCachedAuthoritativeCapability()?.verifiedNative);
  });
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);
  const [lastEvent, setLastEvent] = useState<{ type: string; timestamp: number; detail?: any } | undefined>();
  const [lastError, setLastError] = useState<string | undefined>();

  const recordBrowserError = useCallback((tabId: string, error: any, context?: string) => {
    const errorMsg = error?.message || String(error) || 'Unknown browser error';
    if (process.env.NODE_ENV !== 'production') {
      console.error(`[BROWSER:ERROR] (${tabId}${context ? ` in ${context}` : ''}):`, error);
    }
    setLastError(`[${tabId}] ${context ? `${context}: ` : ''}${errorMsg}`);
    setTabs(prev => prev.map(t => t.id === tabId ? {
      ...t,
      errorDetails: errorMsg,
    } : t));
  }, []);

  const adapterRef = useRef<BrowserRuntimeAdapter | null>(null);
  const unsubscribeAdapterRef = useRef<(() => void) | null>(null);

  const attachAdapterListeners = useCallback((adapter: BrowserRuntimeAdapter) => {
    if (unsubscribeAdapterRef.current) {
      unsubscribeAdapterRef.current();
      unsubscribeAdapterRef.current = null;
    }

    unsubscribeAdapterRef.current = adapter.addEventListener((eventType, detail) => {
      setLastEvent({ type: eventType, timestamp: Date.now(), detail });

      if (eventType === 'navigation-started') {
        setTabs(prev => prev.map(t => t.id === detail.tabId ? { 
          ...t, 
          loading: true, 
          loadState: 'LOADING',
          webNavigationState: 'NAVIGATING',
        } : t));
      } else if (eventType === 'navigation-committed') {
        setTabs(prev => prev.map(t => t.id === detail.tabId ? {
          ...t,
          url: detail.url || t.url,
          title: detail.title || t.title,
        } : t));
      } else if (eventType === 'navigation-finished') {
        setTabs(prev => prev.map(t => t.id === detail.tabId ? {
          ...t,
          loading: false,
          loadState: 'PAGE_LOADED',
          webNavigationState: 'LOADED',
          url: detail.url || t.url,
          title: detail.title || t.title,
        } : t));
      } else if (eventType === 'navigation-failed') {
        recordBrowserError(detail.tabId, detail.error || 'Navigation failed', 'navigation-failed');
        const isNativeErr = detail.error?.startsWith('NATIVE_') || adapter.getCapability().mode === 'NATIVE_WEBVIEW';
        const loadState = isNativeErr
          ? 'NATIVE_RUNTIME_ERROR'
          : (detail.error === 'EXTERNAL_REQUIRED' || detail.error === 'BLOCKED_EMBEDDING' ? 'EXTERNAL_REQUIRED' : 'NETWORK_ERROR');
        setTabs(prev => prev.map(t => t.id === detail.tabId ? {
          ...t,
          loading: false,
          loadState,
          contentState: loadState,
          webNavigationState: isNativeErr ? 'ERROR' : (loadState === 'EXTERNAL_REQUIRED' ? 'EXTERNAL_REQUIRED' : 'ERROR'),
          errorDetails: detail.error,
        } : t));
      } else if (eventType === 'title-changed' && detail.title) {
        setTabs(prev => prev.map(t => t.id === detail.tabId ? { ...t, title: detail.title! } : t));
      } else if (eventType === 'url-changed' && detail.url) {
        setTabs(prev => prev.map(t => t.id === detail.tabId ? { ...t, url: detail.url! } : t));
      } else if (eventType === 'loading-changed' && detail.loading !== undefined) {
        setTabs(prev => prev.map(t => t.id === detail.tabId ? { ...t, loading: detail.loading } : t));
      } else if (eventType === 'find-result') {
        setFindMatches({ count: detail.count ?? 0, activeIndex: detail.activeIndex ?? 0 });
      }
    });
  }, [recordBrowserError]);

  // Initial adapter creation (creates synchronous default or authoritative adapter)
  if (!adapterRef.current) {
    const initialAdapter = getBrowserRuntimeAdapter('tab-1', 'orion://newtab', capability.mode);
    adapterRef.current = initialAdapter;
    attachAdapterListeners(initialAdapter);
  }

  // Authoritative runtime capability verification on mount
  useEffect(() => {
    let mounted = true;
    resolveAuthoritativeCapability().then(cap => {
      if (!mounted) return;
      setCapability(cap);
      setIsCapabilityResolved(true);
      if (process.env.NODE_ENV !== 'production') {
        console.log('[BROWSER:RUNTIME]', `Authoritative capability: mode=${cap.mode}, nativeAvailable=${cap.nativeAvailable}, verified=${cap.verifiedNative}`);
      }

      // Re-create adapter using FINAL authoritative capability if mode differs
      if (adapterRef.current && adapterRef.current.getCapability().mode !== cap.mode) {
        adapterRef.current.destroy();
        const authoritativeAdapter = getBrowserRuntimeAdapter(activeTabId, 'orion://newtab', cap.mode);
        adapterRef.current = authoritativeAdapter;
        attachAdapterListeners(authoritativeAdapter);
      }
    });
    return () => { 
      mounted = false;
      if (unsubscribeAdapterRef.current) {
        unsubscribeAdapterRef.current();
        unsubscribeAdapterRef.current = null;
      }
    };
  }, [activeTabId, attachAdapterListeners]);

  // Alt+D keyboard shortcut to toggle development diagnostics overlay
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'd' || e.key === 'D')) {
        e.preventDefault();
        setIsDiagnosticsOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Synchronize active tab surface with runtime adapter
  useEffect(() => {
    adapterRef.current?.switchTab(activeTabId).catch(err => {
      recordBrowserError(activeTabId, err, 'switchTabActive');
    });
  }, [activeTabId, recordBrowserError]);

  // Persistent Collections State
  const [historyList, setHistoryList] = useState<BrowserHistoryEntry[]>(() => browserHistory.getHistory());
  const [bookmarksList, setBookmarksList] = useState<BrowserBookmarkEntry[]>(() => browserBookmarks.getBookmarks());

  // Subscribe to History & Bookmarks reactive events
  useEffect(() => {
    const handleHistoryChange = (e: any) => {
      if (e.detail?.history) setHistoryList(e.detail.history);
    };
    const handleBookmarksChange = (e: any) => {
      if (e.detail?.bookmarks) setBookmarksList(e.detail.bookmarks);
    };

    window.addEventListener('orion-browser-history-changed', handleHistoryChange);
    window.addEventListener('orion-browser-bookmarks-changed', handleBookmarksChange);

    return () => {
      window.removeEventListener('orion-browser-history-changed', handleHistoryChange);
      window.removeEventListener('orion-browser-bookmarks-changed', handleBookmarksChange);
    };
  }, []);

  const activeTab = useMemo(() => {
    return tabs.find(t => t.id === activeTabId) || tabs[0];
  }, [tabs, activeTabId]);

  // Tab Completion Callbacks
  const handleLoadComplete = useCallback((tabId: string) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;
      return {
        ...tab,
        loading: false,
        loadState: tab.loadState === 'BLOCKED_EMBEDDING' ? 'BLOCKED_EMBEDDING' : 'PAGE_LOADED',
      };
    }));
  }, []);

  const handleLoadError = useCallback((tabId: string, err?: string) => {
    setTabs(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;
      return {
        ...tab,
        loading: false,
        loadState: 'NETWORK_ERROR',
        errorDetails: err || 'Failed to load page content',
      };
    }));
  }, []);

  // Tab Navigation with Generation / Race Protection
  const navigateTab = useCallback(async (tabId: string, targetUrl: string) => {
    let currentCap = capability;
    if (!isCapabilityResolved) {
      currentCap = await resolveAuthoritativeCapability();
      setCapability(currentCap);
      setIsCapabilityResolved(true);
      if (!adapterRef.current || adapterRef.current.getCapability().mode !== currentCap.mode) {
        if (adapterRef.current) adapterRef.current.destroy();
        const authoritativeAdapter = getBrowserRuntimeAdapter(tabId, targetUrl, currentCap.mode);
        adapterRef.current = authoritativeAdapter;
        attachAdapterListeners(authoritativeAdapter);
      }
    }

    const validation = validateBrowserUrl(targetUrl, preferences.defaultSearchEngine);
    const resolvedUrl = validation.normalizedUrl;
    const isInternalUrl = validation.scheme === 'internal' || resolvedUrl === 'orion://newtab' || resolvedUrl.startsWith('/');
    const isNative = (currentCap.mode === 'NATIVE_WEBVIEW' && currentCap.nativeAvailable) || currentCap.verifiedNative;
    const webPolicy = !isNative ? resolveWebModePolicy(resolvedUrl) : null;

    setTabs(prev => prev.map(tab => {
      if (tab.id !== tabId) return tab;

      const newGen = (tab.generation || 0) + 1;
      const isInternal = isInternalUrl || webPolicy?.decision === 'INTERNAL_ORION';
      const isSecure = resolvedUrl.startsWith('https://');
      const securityStatus = isInternal ? 'internal' : (isSecure ? 'secure' : 'insecure');

      // Update history stack
      const newStack = [...tab.historyStack.slice(0, tab.historyIndex + 1), resolvedUrl];
      const newIndex = newStack.length - 1;

      if (resolvedUrl === 'orion://newtab' || isInternal) {
        return {
          ...tab,
          url: resolvedUrl,
          title: 'New Tab',
          loading: false,
          loadState: 'EMPTY_TAB',
          contentState: 'EMPTY_TAB',
          webNavigationState: 'IDLE',
          historyStack: newStack,
          historyIndex: newIndex,
          canGoBack: newIndex > 0,
          canGoForward: false,
          generation: newGen,
          securityStatus: 'internal',
          errorDetails: undefined,
        };
      }

      if (!validation.valid || !isValidUrl(resolvedUrl) || webPolicy?.decision === 'INVALID') {
        const errorReason = validation.error || webPolicy?.reason || 'The entered address is not a supported protocol or valid URL.';
        return {
          ...tab,
          url: targetUrl,
          title: 'Invalid Web Address',
          loading: false,
          loadState: 'INVALID_URL',
          contentState: 'INVALID_URL',
          webNavigationState: 'ERROR',
          errorDetails: errorReason,
          historyStack: newStack,
          historyIndex: newIndex,
          canGoBack: newIndex > 0,
          canGoForward: false,
          generation: newGen,
          securityStatus: 'insecure',
        };
      }

      // Web Mode: External website requiring external window (Google, GitHub, Wikipedia, etc.)
      if (!isNative && webPolicy?.decision === 'EXTERNAL_REQUIRED') {
        let domainTitle = resolvedUrl;
        try { domainTitle = new URL(resolvedUrl).hostname.replace(/^www\./, ''); } catch {}
        browserHistory.addEntry({ url: resolvedUrl, title: domainTitle });

        return {
          ...tab,
          url: resolvedUrl,
          title: domainTitle,
          loading: false,
          loadState: 'EXTERNAL_REQUIRED',
          contentState: 'EXTERNAL_REQUIRED',
          webNavigationState: 'EXTERNAL_REQUIRED',
          errorDetails: webPolicy.reason,
          historyStack: newStack,
          historyIndex: newIndex,
          canGoBack: newIndex > 0,
          canGoForward: false,
          generation: newGen,
          securityStatus: isSecure ? 'secure' : 'insecure',
        };
      }

      // Normal navigation (Native Mode for all sites OR Web Mode for approved EMBED_ALLOWED origins)
      let domainTitle = resolvedUrl;
      try {
        domainTitle = new URL(resolvedUrl).hostname.replace(/^www\./, '');
      } catch {}

      browserHistory.addEntry({ url: resolvedUrl, title: domainTitle });

      return {
        ...tab,
        url: resolvedUrl,
        title: domainTitle,
        loading: true,
        loadState: 'LOADING',
        contentState: 'LOADING',
        webNavigationState: 'NAVIGATING',
        historyStack: newStack,
        historyIndex: newIndex,
        canGoBack: newIndex > 0,
        canGoForward: false,
        generation: newGen,
        securityStatus,
        errorDetails: undefined,
      };
    }));

    // Dispatch navigation to runtime adapter if valid and not external-required
    if (!isInternalUrl && validation.valid && isValidUrl(resolvedUrl)) {
      if (isNative || webPolicy?.decision === 'EMBED_ALLOWED') {
        adapterRef.current?.navigate(resolvedUrl).catch(err => {
          recordBrowserError(tabId, err, 'navigate');
        });
      }
    }
  }, [preferences.defaultSearchEngine, capability, isCapabilityResolved, attachAdapterListeners, recordBrowserError]);

  const handleSelectTab = useCallback((tabId: string) => {
    setActiveTabId(tabId);
    adapterRef.current?.switchTab(tabId).catch(err => {
      recordBrowserError(tabId, err, 'switchTab');
    });
  }, [recordBrowserError]);

  // Tab Operations
  const handleNewTab = useCallback((initialUrl: string = 'orion://newtab') => {
    const newId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newTab: BrowserTab = {
      id: newId,
      title: initialUrl === 'orion://newtab' ? 'New Tab' : initialUrl,
      url: initialUrl,
      loading: false,
      canGoBack: false,
      canGoForward: false,
      historyIndex: 0,
      historyStack: [initialUrl],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      loadState: initialUrl === 'orion://newtab' ? 'EMPTY_TAB' : 'PAGE_LOADED',
      contentState: initialUrl === 'orion://newtab' ? 'EMPTY_TAB' : 'PAGE_LOADED',
      webNavigationState: 'IDLE',
      generation: 1,
      securityStatus: initialUrl.startsWith('https://') ? 'secure' : 'internal',
    };

    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
    adapterRef.current?.createTab(newId, initialUrl).catch(err => {
      recordBrowserError(newId, err, 'createTab');
    });

    if (initialUrl !== 'orion://newtab') {
      navigateTab(newId, initialUrl);
    }
  }, [navigateTab, recordBrowserError]);

  const handleCloseTab = useCallback((tabId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }

    adapterRef.current?.closeTab(tabId).catch(err => {
      recordBrowserError(tabId, err, 'closeTab');
    });

    setTabs(prev => {
      const tabToClose = prev.find(t => t.id === tabId);
      if (tabToClose) {
        setClosedTabsStack(c => [tabToClose, ...c].slice(0, 20));
      }

      if (prev.length <= 1) {
        // If closing the last tab, reset to an empty new tab
        const freshTab: BrowserTab = {
          id: `tab_${Date.now()}`,
          title: 'New Tab',
          url: 'orion://newtab',
          loading: false,
          canGoBack: false,
          canGoForward: false,
          historyIndex: 0,
          historyStack: ['orion://newtab'],
          createdAt: Date.now(),
          lastActiveAt: Date.now(),
          loadState: 'EMPTY_TAB',
          contentState: 'EMPTY_TAB',
          webNavigationState: 'IDLE',
          generation: 1,
          securityStatus: 'internal',
        };
        setActiveTabId(freshTab.id);
        return [freshTab];
      }

      const filtered = prev.filter(t => t.id !== tabId);
      if (activeTabId === tabId) {
        const closedIndex = prev.findIndex(t => t.id === tabId);
        const nextIndex = Math.max(0, closedIndex - 1);
        setActiveTabId(filtered[nextIndex].id);
      }
      return filtered;
    });
  }, [activeTabId, recordBrowserError]);

  const handleReopenClosedTab = useCallback(() => {
    if (closedTabsStack.length === 0) return;
    const [lastClosed, ...remaining] = closedTabsStack;
    setClosedTabsStack(remaining);
    setTabs(prev => [...prev, lastClosed]);
    setActiveTabId(lastClosed.id);
    adapterRef.current?.createTab(lastClosed.id, lastClosed.url).catch(err => {
      recordBrowserError(lastClosed.id, err, 'reopenTab');
    });
    showToast?.(`Reopened tab: ${lastClosed.title}`, 'info', 'Orion Browser');
  }, [closedTabsStack, showToast, recordBrowserError]);

  // Back / Forward / Reload / Stop / Home Navigation
  const handleBack = useCallback(() => {
    if (!activeTab || activeTab.historyIndex <= 0) return;
    const prevIndex = activeTab.historyIndex - 1;
    const prevUrl = activeTab.historyStack[prevIndex];
    const isInternal = prevUrl === 'orion://newtab' || prevUrl.startsWith('/');
    const isSecure = prevUrl.startsWith('https://');

    adapterRef.current?.goBack().catch(err => {
      recordBrowserError(activeTab.id, err, 'goBack');
    });

    setTabs(prev => prev.map(t => {
      if (t.id !== activeTab.id) return t;
      return {
        ...t,
        url: prevUrl,
        title: prevUrl === 'orion://newtab' ? 'New Tab' : prevUrl,
        historyIndex: prevIndex,
        canGoBack: prevIndex > 0,
        canGoForward: true,
        loading: !isInternal,
        loadState: isInternal ? 'EMPTY_TAB' : 'PAGE_LOADED',
        contentState: isInternal ? 'EMPTY_TAB' : 'PAGE_LOADED',
        generation: (t.generation || 0) + 1,
        securityStatus: isInternal ? 'internal' : (isSecure ? 'secure' : 'insecure'),
      };
    }));
  }, [activeTab, recordBrowserError]);

  const handleForward = useCallback(() => {
    if (!activeTab || activeTab.historyIndex >= activeTab.historyStack.length - 1) return;
    const nextIndex = activeTab.historyIndex + 1;
    const nextUrl = activeTab.historyStack[nextIndex];
    const isInternal = nextUrl === 'orion://newtab' || nextUrl.startsWith('/');
    const isSecure = nextUrl.startsWith('https://');

    adapterRef.current?.goForward().catch(err => {
      recordBrowserError(activeTab.id, err, 'goForward');
    });

    setTabs(prev => prev.map(t => {
      if (t.id !== activeTab.id) return t;
      return {
        ...t,
        url: nextUrl,
        title: nextUrl === 'orion://newtab' ? 'New Tab' : nextUrl,
        historyIndex: nextIndex,
        canGoBack: true,
        canGoForward: nextIndex < t.historyStack.length - 1,
        loading: !isInternal,
        loadState: nextUrl === 'orion://newtab' ? 'EMPTY_TAB' : 'PAGE_LOADED',
        contentState: nextUrl === 'orion://newtab' ? 'EMPTY_TAB' : 'PAGE_LOADED',
        generation: (t.generation || 0) + 1,
        securityStatus: isInternal ? 'internal' : (isSecure ? 'secure' : 'insecure'),
      };
    }));
  }, [activeTab, recordBrowserError]);

  const handleReload = useCallback(() => {
    if (!activeTab) return;
    if (activeTab.url === 'orion://newtab') return;

    adapterRef.current?.reload().catch(err => {
      recordBrowserError(activeTab.id, err, 'reload');
    });

    setTabs(prev => prev.map(t => {
      if (t.id !== activeTab.id) return t;
      return {
        ...t,
        loading: true,
        loadState: 'LOADING',
        generation: (t.generation || 0) + 1,
      };
    }));
  }, [activeTab, recordBrowserError]);

  const handleStop = useCallback(() => {
    adapterRef.current?.stop().catch(err => {
      recordBrowserError(activeTabId, err, 'stop');
    });
    setTabs(prev => prev.map(t => {
      if (t.id !== activeTabId) return t;
      return { ...t, loading: false, loadState: 'PAGE_LOADED' };
    }));
  }, [activeTabId, recordBrowserError]);

  const handleHome = useCallback(() => {
    navigateTab(activeTabId, 'orion://newtab');
  }, [activeTabId, navigateTab]);

  // Bookmark Toggle
  const handleToggleBookmark = useCallback(() => {
    if (!activeTab || activeTab.url === 'orion://newtab') return;
    const isNowBookmarked = browserBookmarks.toggleBookmark({
      url: activeTab.url,
      title: activeTab.title,
      favicon: activeTab.favicon,
    });
    if (isNowBookmarked) {
      showToast('Page added to bookmarks', 'success', 'Orion Browser');
    } else {
      showToast('Bookmark removed', 'info', 'Orion Browser');
    }
  }, [activeTab, showToast]);

  // Copilot Integration: Ask Orion Copilot with Controlled Context
  const handleAskCopilot = useCallback(() => {
    if (!activeTab) return;

    // Strict security boundary: permission layer extracts only safe, sanitized context
    const selectedText = typeof window !== 'undefined' ? window.getSelection()?.toString() : undefined;
    const safeContext = BrowserCopilotPermissionLayer.extractSafeContext(activeTab, selectedText);

    // Open Orion Copilot window
    if (openApplication) {
      openApplication('orion-ai');
    }
    if (showToast) {
      showToast(`Context shared with Orion Copilot: "${safeContext.title}"`, 'info', 'Orion Copilot');
    }
  }, [activeTab, openApplication, showToast]);

  // Zoom Controls
  const handleZoomIn = () => {
    const next = Math.min(1.5, Math.round((zoomLevel + 0.1) * 10) / 10);
    setZoomLevel(next);
    adapterRef.current?.setZoom(next);
  };

  const handleZoomOut = () => {
    const next = Math.max(0.7, Math.round((zoomLevel - 0.1) * 10) / 10);
    setZoomLevel(next);
    adapterRef.current?.setZoom(next);
  };

  const handleResetZoom = () => {
    setZoomLevel(1.0);
    adapterRef.current?.setZoom(1.0);
  };

  // Find in page effect
  useEffect(() => {
    if (!isFindInPageOpen || !findQuery) {
      setFindMatches({ count: 0, activeIndex: 0 });
      adapterRef.current?.stopFind('clear');
      return;
    }
    adapterRef.current?.findInPage(findQuery, true).then(res => {
      if (res) setFindMatches(res);
    }).catch(err => {
      recordBrowserError(activeTab.id, err, 'findInPage');
    });
  }, [findQuery, isFindInPageOpen, activeTab.id, recordBrowserError]);

  const handleFindNext = () => {
    if (!findQuery) return;
    adapterRef.current?.findInPage(findQuery, true).then(res => {
      if (res) setFindMatches(res);
    }).catch(err => {
      recordBrowserError(activeTab.id, err, 'findNext');
    });
  };

  const handleFindPrev = () => {
    if (!findQuery) return;
    adapterRef.current?.findInPage(findQuery, false).then(res => {
      if (res) setFindMatches(res);
    }).catch(err => {
      recordBrowserError(activeTab.id, err, 'findPrev');
    });
  };

  // Keyboard Shortcuts Handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;

      // Ctrl/Cmd + T: New Tab
      if (isCmdOrCtrl && e.key.toLowerCase() === 't' && !e.shiftKey) {
        e.preventDefault();
        handleNewTab();
        return;
      }

      // Ctrl/Cmd + Shift + T: Reopen Closed Tab
      if (isCmdOrCtrl && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        handleReopenClosedTab();
        return;
      }

      // Ctrl/Cmd + W: Close Active Tab
      if (isCmdOrCtrl && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        handleCloseTab(activeTabId);
        return;
      }

      // Ctrl/Cmd + L: Focus Address Bar
      if (isCmdOrCtrl && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        addressInputRef.current?.focus();
        addressInputRef.current?.select();
        return;
      }

      // Ctrl/Cmd + R: Reload
      if (isCmdOrCtrl && e.key.toLowerCase() === 'r') {
        e.preventDefault();
        handleReload();
        return;
      }

      // Alt + Left: Back
      if (e.altKey && e.key === 'ArrowLeft') {
        e.preventDefault();
        handleBack();
        return;
      }

      // Alt + Right: Forward
      if (e.altKey && e.key === 'ArrowRight') {
        e.preventDefault();
        handleForward();
        return;
      }

      // Ctrl/Cmd + D: Bookmark
      if (isCmdOrCtrl && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleToggleBookmark();
        return;
      }

      // Ctrl/Cmd + F: Find in Page
      if (isCmdOrCtrl && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setIsFindInPageOpen(prev => !prev);
        return;
      }

      // Ctrl/Cmd + Plus / =: Zoom In
      if (isCmdOrCtrl && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        handleZoomIn();
        return;
      }

      // Ctrl/Cmd + Minus: Zoom Out
      if (isCmdOrCtrl && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        handleZoomOut();
        return;
      }

      // Ctrl/Cmd + 0: Reset Zoom
      if (isCmdOrCtrl && e.key === '0') {
        e.preventDefault();
        handleResetZoom();
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    activeTabId, handleNewTab, handleCloseTab, handleReopenClosedTab, 
    handleReload, handleBack, handleForward, handleToggleBookmark
  ]);

  const isCurrentBookmarked = useMemo(() => {
    return Boolean(activeTab && browserBookmarks.isBookmarked(activeTab.url));
  }, [activeTab, bookmarksList]);

  return (
    <div 
      ref={browserContainerRef}
      data-testid="orion-browser"
      className="flex flex-col w-full h-full bg-os-bg text-os-text-primary select-none overflow-hidden relative"
      tabIndex={-1}
    >
      {/* 1. Tab Bar */}
      <BrowserTabBar
        tabs={tabs}
        activeTabId={activeTabId}
        onSelectTab={handleSelectTab}
        onCloseTab={handleCloseTab}
        onNewTab={() => handleNewTab('orion://newtab')}
      />

      {/* 2. Primary Navigation Toolbar & Address Bar */}
      <BrowserToolbar
        currentUrl={activeTab.url}
        canGoBack={activeTab.canGoBack}
        canGoForward={activeTab.canGoForward}
        isLoading={activeTab.loading}
        securityStatus={activeTab.securityStatus}
        isBookmarked={isCurrentBookmarked}
        showBookmarksBar={preferences.showBookmarksBar}
        bookmarks={bookmarksList}
        addressInputRef={addressInputRef}
        onBack={handleBack}
        onForward={handleForward}
        onReload={handleReload}
        onStop={handleStop}
        onHome={handleHome}
        onNavigate={(url) => navigateTab(activeTabId, url)}
        onToggleBookmark={handleToggleBookmark}
        onOpenMenu={() => setIsMenuOpen(prev => !prev)}
        onAskCopilot={handleAskCopilot}
      />

      {/* 3. Browser Dropdown Menu */}
      <BrowserMenu
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        onNewTab={() => handleNewTab('orion://newtab')}
        onReopenClosedTab={handleReopenClosedTab}
        canReopenTab={closedTabsStack.length > 0}
        onOpenHistory={() => setIsHistoryDrawerOpen(true)}
        onOpenBookmarks={() => setIsBookmarksDrawerOpen(true)}
        onOpenDownloads={() => {
          showToast?.('No active downloads in progress', 'info', 'Downloads');
        }}
        onFindInPage={() => setIsFindInPageOpen(true)}
        zoomLevel={zoomLevel}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDiagnostics={() => setIsDiagnosticsOpen(true)}
        onOpenExternal={() => {
          if (activeTab && activeTab.url !== 'orion://newtab') {
            window.open(activeTab.url, '_blank', 'noopener,noreferrer');
          }
        }}
      />

      {/* 4. Find in Page Overlay Bar (Ctrl+F) */}
      {isFindInPageOpen && (
        <div 
          data-testid="browser-find-in-page"
          className="absolute top-24 right-6 z-30 flex items-center gap-2 p-1.5 px-3 rounded-xl bg-os-surface border border-os-border shadow-xl backdrop-blur-md animate-in fade-in"
        >
          <Search className="w-3.5 h-3.5 text-os-text-muted shrink-0" />
          <input
            type="text"
            data-testid="browser-find-input"
            value={findQuery}
            placeholder="Find in page..."
            onChange={(e) => setFindQuery(e.target.value)}
            className="w-36 bg-transparent text-xs text-os-text-primary focus:outline-none placeholder:text-os-text-muted"
            autoFocus
          />
          <span className="text-[10px] text-os-text-muted font-mono px-1">
            {findQuery ? (findMatches.count > 0 ? `${findMatches.activeIndex + 1}/${findMatches.count}` : '0/0') : ''}
          </span>
          <button 
            type="button" 
            onClick={handleFindPrev}
            className="p-1 rounded hover:bg-os-surface-hover text-os-text-muted"
          >
            <ChevronUp className="w-3 h-3" />
          </button>
          <button 
            type="button" 
            onClick={handleFindNext}
            className="p-1 rounded hover:bg-os-surface-hover text-os-text-muted"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
          <button 
            type="button" 
            onClick={() => {
              adapterRef.current?.stopFind('clear');
              setIsFindInPageOpen(false);
            }}
            className="p-1 rounded hover:bg-os-surface-hover text-os-text-muted hover:text-os-text-primary"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 5. Web Content Viewport */}
      <BrowserContent
        activeTab={activeTab}
        recentHistory={historyList}
        zoomLevel={zoomLevel}
        runtimeMode={(capability.mode === 'NATIVE_WEBVIEW' && capability.nativeAvailable) || capability.verifiedNative ? 'NATIVE_WEBVIEW' : 'WEB_EMBEDDED'}
        onNavigate={(url) => navigateTab(activeTabId, url)}
        onReload={handleReload}
        onBlocked={() => {
          setTabs(prev => prev.map(t => {
            if (t.id === activeTabId) {
              return { ...t, loadState: 'BLOCKED_EMBEDDING', loading: false };
            }
            return t;
          }));
        }}
        onLoadComplete={() => handleLoadComplete(activeTabId)}
        onError={(err) => handleLoadError(activeTabId, err)}
        onOpenExternal={() => {
          if (activeTab && activeTab.url !== 'orion://newtab') {
            window.open(activeTab.url, '_blank', 'noopener,noreferrer');
          }
        }}
        onInstallDesktop={() => {
          showToast?.('ORION Desktop is required for full web browsing.', 'info', 'Orion Desktop');
        }}
        onBoundsChange={(bounds) => {
          adapterRef.current?.setBounds(bounds);
        }}
        onRemoveHistoryItem={(id) => browserHistory.removeEntry(id)}
      />

      {/* 6. History Drawer Modal */}
      {isHistoryDrawerOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-80 h-full bg-os-surface border-l border-os-border p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-os-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-os-text-primary">Browsing History</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsHistoryDrawerOpen(false)}
                className="p-1 rounded-md text-os-text-muted hover:text-os-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-1.5 custom-scrollbar">
              {historyList.length === 0 ? (
                <div className="p-6 text-center text-xs text-os-text-muted">No history found.</div>
              ) : (
                historyList.map(item => (
                  <div key={item.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-os-surface-hover transition-colors">
                    <button
                      type="button"
                      onClick={() => {
                        navigateTab(activeTabId, item.url);
                        setIsHistoryDrawerOpen(false);
                      }}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="text-xs text-os-text-primary font-medium truncate">{item.title}</div>
                      <div className="text-[10px] text-os-text-muted truncate">{item.url}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => browserHistory.removeEntry(item.id)}
                      className="p-1 rounded text-os-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {historyList.length > 0 && (
              <div className="pt-3 border-t border-os-border flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => browserHistory.clearHistory()}
                  className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                >
                  Clear All History
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 7. Bookmarks Drawer Modal */}
      {isBookmarksDrawerOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex justify-end">
          <div className="w-80 h-full bg-os-surface border-l border-os-border p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-os-border">
              <div className="flex items-center gap-2">
                <BookmarkIcon className="w-4 h-4 text-amber-400" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-os-text-primary">Bookmarks</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsBookmarksDrawerOpen(false)}
                className="p-1 rounded-md text-os-text-muted hover:text-os-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 flex flex-col gap-1.5 custom-scrollbar">
              {bookmarksList.length === 0 ? (
                <div className="p-6 text-center text-xs text-os-text-muted">No bookmarks saved yet.</div>
              ) : (
                bookmarksList.map(bm => (
                  <div key={bm.id} className="group flex items-center justify-between p-2 rounded-lg hover:bg-os-surface-hover transition-colors">
                    <button
                      type="button"
                      onClick={() => {
                        navigateTab(activeTabId, bm.url);
                        setIsBookmarksDrawerOpen(false);
                      }}
                      className="flex-1 min-w-0 text-left cursor-pointer"
                    >
                      <div className="text-xs text-os-text-primary font-medium truncate">{bm.title}</div>
                      <div className="text-[10px] text-os-text-muted truncate">{bm.url}</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => browserBookmarks.removeBookmark(bm.id)}
                      className="p-1 rounded text-os-text-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 8. Settings Dialog Modal */}
      {isSettingsOpen && (
        <div className="absolute inset-0 z-40 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-os-surface border border-os-border rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-os-border mb-4">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-os-accent" />
                <h3 className="text-sm font-semibold text-os-text-primary">Browser Preferences</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsSettingsOpen(false)}
                className="p-1 rounded-md text-os-text-muted hover:text-os-text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-medium text-os-text-secondary block mb-1.5">
                  Default Search Engine
                </label>
                <select
                  value={preferences.defaultSearchEngine}
                  onChange={(e) => setPreferences(p => ({ ...p, defaultSearchEngine: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-xl bg-os-bg border border-os-border text-xs text-os-text-primary focus:outline-none focus:border-os-accent"
                >
                  <option value="duckduckgo">DuckDuckGo (Privacy Focused)</option>
                  <option value="google">Google</option>
                  <option value="bing">Bing</option>
                  <option value="ecosia">Ecosia (Eco Friendly)</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-os-text-primary">Show Bookmarks Bar</div>
                  <div className="text-[11px] text-os-text-muted">Display quick bookmarks below toolbar</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.showBookmarksBar}
                  onChange={(e) => setPreferences(p => ({ ...p, showBookmarksBar: e.target.checked }))}
                  className="rounded border-os-border text-os-accent focus:ring-0"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-os-text-primary">Block Unsolicited Popups</div>
                  <div className="text-[11px] text-os-text-muted">Enforce sandboxed popup restrictions</div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.blockPopups}
                  onChange={(e) => setPreferences(p => ({ ...p, blockPopups: e.target.checked }))}
                  className="rounded border-os-border text-os-accent focus:ring-0"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 py-2 rounded-xl bg-os-accent hover:opacity-90 text-os-bg text-xs font-medium transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. Runtime Diagnostics HUD (Alt+D) */}
      <BrowserDiagnosticsOverlay
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
        capability={capability}
        activeTab={activeTab}
        tabsCount={tabs.length}
        lastEvent={lastEvent}
        lastError={lastError}
      />
    </div>
  );
}

export default OrionBrowser;
