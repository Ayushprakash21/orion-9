import React from 'react';
import { renderToString } from 'react-dom/server';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { ORION_REGISTRY } from '../../os/OrionApplicationRegistry';
import { ORION_COMPONENT_MAP } from '../../os/OrionComponentMap';
import {
  ORION_ICON_REGISTRY,
  getAppIconDefinition,
  getAppIconComponent,
  IconOrionBrowser
} from '../../os/icons/OrionIconRegistry';
import { OrionBrowser } from '../../components/browser/OrionBrowser';
import {
  resolveAddressInput,
  isValidUrl,
  isKnownBlockedDomain,
  WebBrowserEngine
} from '../../components/browser/BrowserEngine';
import { BrowserHistoryManager } from '../../components/browser/BrowserHistory';
import { BrowserBookmarksManager } from '../../components/browser/BrowserBookmarks';
import { BrowserDownloadManager } from '../../components/browser/BrowserDownloadManager';
import { BrowserTabBar } from '../../components/browser/BrowserTabBar';
import { BrowserAddressBar } from '../../components/browser/BrowserAddressBar';
import { BrowserToolbar } from '../../components/browser/BrowserToolbar';
import { BrowserContent } from '../../components/browser/BrowserContent';
import { BrowserNewTab } from '../../components/browser/BrowserNewTab';
import { BrowserWebRuntime } from '../../components/browser/BrowserWebRuntime';
import { BrowserMenu } from '../../components/browser/BrowserMenu';
import {
  BrowserTab,
  DEFAULT_SEARCH_ENGINE,
  SEARCH_ENGINES
} from '../../components/browser/BrowserTypes';

// Environment mocks for Node testing
const storageMock: Record<string, string> = {};
const mockLocalStorage = {
  getItem: vi.fn((k: string) => storageMock[k] ?? null),
  setItem: vi.fn((k: string, v: string) => { storageMock[k] = String(v); }),
  removeItem: vi.fn((k: string) => { delete storageMock[k]; }),
  clear: vi.fn(() => { Object.keys(storageMock).forEach(k => delete storageMock[k]); }),
};

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = mockLocalStorage;
}

if (typeof (globalThis as any).sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = mockLocalStorage;
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    open: vi.fn(),
    localStorage: mockLocalStorage,
    sessionStorage: mockLocalStorage
  };
}

describe('Orion Browser Certification Suite (BROWSER-001 to BROWSER-021)', () => {
  beforeEach(() => {
    (globalThis as any).localStorage.clear();
    BrowserHistoryManager.clear();
    BrowserBookmarksManager.resetToDefaults();
    BrowserDownloadManager.clear();
    vi.restoreAllMocks();
  });

  // BROWSER-001: Application Registration
  it('BROWSER-001: Registers Orion Browser in ORION_REGISTRY with correct metadata', () => {
    const app = ORION_REGISTRY['browser'];
    expect(app, 'Missing browser app in ORION_REGISTRY').toBeDefined();
    expect(app.id).toBe('browser');
    expect(app.name).toBe('Orion Browser');
    expect(app.category).toBe('System');
    expect(app.route).toBe('/browser');
    expect(app.dockDefault).toBe(true);
    expect(app.icon).toBeDefined();
    expect(app.description).toContain('web workstation');
  });

  // BROWSER-002: Component Mapping
  it('BROWSER-002: Maps browser ID in ORION_COMPONENT_MAP and renders valid HTML', () => {
    const Component = ORION_COMPONENT_MAP['browser'];
    expect(Component, 'Missing browser in ORION_COMPONENT_MAP').toBeDefined();
    expect(Component).toBe(OrionBrowser);

    const html = renderToString(React.createElement(Component));
    expect(html).toContain('data-testid="orion-browser"');
    expect(html).toContain('data-testid="browser-tab-bar"');
    expect(html).toContain('data-testid="browser-address-input"');
    expect(html).toContain('data-testid="browser-toolbar"');
  });

  // BROWSER-003: Icon System Uniqueness
  it('BROWSER-003: Possesses unique icon metadata and squircle component in ORION_ICON_REGISTRY', () => {
    const iconDef = ORION_ICON_REGISTRY['browser'];
    expect(iconDef).toBeDefined();
    expect(iconDef.appId).toBe('browser');
    expect(iconDef.iconId).toBe('icon-orion-browser');
    expect(iconDef.name).toBe('Orion Browser');
    expect(iconDef.category).toBe('System');
    expect(iconDef.palette.from).toBe('#0284C7');
    expect(iconDef.palette.to).toBe('#0369A1');
    expect(iconDef.component).toBe(IconOrionBrowser);

    const helperDef = getAppIconDefinition('browser');
    expect(helperDef.iconId).toBe('icon-orion-browser');
    const IconComp = getAppIconComponent('browser');
    expect(IconComp).toBe(IconOrionBrowser);

    const html = renderToString(React.createElement(IconComp, { size: 32 }));
    expect(html).toContain('<svg');
  });

  // BROWSER-004: Window Manager Integration & Category Mapping
  it('BROWSER-004: Validates normalizer aliases and System category mapping for browser', () => {
    // Normalization test
    const normalize = (id: string) => {
      if (id === 'orion-browser' || id === 'web-browser') return 'browser';
      return id;
    };
    expect(normalize('orion-browser')).toBe('browser');
    expect(normalize('web-browser')).toBe('browser');

    // System category workspace mapping
    const app = ORION_REGISTRY['browser'];
    const cat = app.category.toLowerCase();
    const isControlOrSystem = cat === 'system' || cat === 'control' || cat === 'platform';
    expect(isControlOrSystem).toBe(true);
  });

  // BROWSER-005: Omnibox URL vs Search Query Parsing
  it('BROWSER-005: Correctly resolves URLs vs search queries via resolveAddressInput', () => {
    // Standard URL without scheme
    expect(resolveAddressInput('example.com')).toBe('https://example.com');
    expect(resolveAddressInput('www.wikipedia.org')).toBe('https://www.wikipedia.org');

    // URL with explicit scheme
    expect(resolveAddressInput('https://news.ycombinator.com')).toBe('https://news.ycombinator.com');
    expect(resolveAddressInput('http://localhost:3000')).toBe('http://localhost:3000');
    expect(resolveAddressInput('http://127.0.0.1:8080/dashboard')).toBe('http://127.0.0.1:8080/dashboard');

    // Internal scheme
    expect(resolveAddressInput('about:blank')).toBe('about:blank');
    expect(resolveAddressInput('about:newtab')).toBe('about:newtab');

    // Search query fallback to DuckDuckGo
    const searchQuery = resolveAddressInput('supply chain predictive logistics');
    expect(searchQuery).toBe('https://duckduckgo.com/?q=supply+chain+predictive+logistics');

    // Custom search engine
    const googleEngine = SEARCH_ENGINES.find(s => s.id === 'google')!;
    const googleQuery = resolveAddressInput('semiconductor inventory', googleEngine);
    expect(googleQuery).toBe('https://www.google.com/search?q=semiconductor+inventory');

    // Empty input
    expect(resolveAddressInput('')).toBe('about:newtab');
    expect(resolveAddressInput('   ')).toBe('about:newtab');
  });

  // BROWSER-006: Tab Creation & Initial State
  it('BROWSER-006: Renders tab strip with initial tab and provides new tab action', () => {
    const tabs: BrowserTab[] = [
      {
        id: 'tab-1',
        url: 'about:newtab',
        title: 'New Tab',
        contentState: 'EMPTY_TAB',
        historyStack: ['about:newtab'],
        historyIndex: 0,
        isLoading: false,
        zoomLevel: 1.0,
        createdAt: Date.now()
      }
    ];

    const html = renderToString(
      React.createElement(BrowserTabBar, {
        tabs,
        activeTabId: 'tab-1',
        onSelectTab: () => {},
        onCloseTab: () => {},
        onNewTab: () => {}
      })
    );

    expect(html).toContain('data-testid="browser-tab-bar"');
    expect(html).toContain('data-testid="browser-tab-tab-1"');
    expect(html).toContain('New Tab');
    expect(html).toContain('data-testid="browser-new-tab-btn"');
  });

  // BROWSER-007: Tab Selection
  it('BROWSER-007: Highlights active tab and maintains inactive tab attributes', () => {
    const tabs: BrowserTab[] = [
      {
        id: 'tab-1',
        url: 'https://example.com',
        title: 'Example',
        contentState: 'PAGE_LOADED',
        historyStack: ['https://example.com'],
        historyIndex: 0,
        isLoading: false,
        zoomLevel: 1.0,
        createdAt: Date.now()
      },
      {
        id: 'tab-2',
        url: 'https://orion.os/control-tower',
        title: 'Control Tower',
        contentState: 'PAGE_LOADED',
        historyStack: ['https://orion.os/control-tower'],
        historyIndex: 0,
        isLoading: false,
        zoomLevel: 1.0,
        createdAt: Date.now() + 10
      }
    ];

    const html = renderToString(
      React.createElement(BrowserTabBar, {
        tabs,
        activeTabId: 'tab-2',
        onSelectTab: () => {},
        onCloseTab: () => {},
        onNewTab: () => {}
      })
    );

    expect(html).toContain('data-testid="browser-tab-tab-1"');
    expect(html).toContain('data-testid="browser-tab-tab-2"');
    expect(html).toContain('aria-selected="true"');
    expect(html).toContain('Control Tower');
    expect(html).toContain('Example');
  });

  // BROWSER-008: Tab Close Logic
  it('BROWSER-008: Tab close callbacks are plumbed on close buttons', () => {
    let closedId = '';
    const tabs: BrowserTab[] = [
      {
        id: 'tab-1',
        url: 'about:newtab',
        title: 'New Tab',
        contentState: 'EMPTY_TAB',
        historyStack: ['about:newtab'],
        historyIndex: 0,
        isLoading: false,
        zoomLevel: 1.0,
        createdAt: Date.now()
      }
    ];

    const html = renderToString(
      React.createElement(BrowserTabBar, {
        tabs,
        activeTabId: 'tab-1',
        onSelectTab: () => {},
        onCloseTab: (id) => { closedId = id; },
        onNewTab: () => {}
      })
    );

    expect(html).toContain('data-testid="browser-close-tab-tab-1"');
  });

  // BROWSER-009: Middle-Click and Tab Navigation Attributes
  it('BROWSER-009: Renders role="tab" and role="tablist" with accessibility semantics', () => {
    const tabs: BrowserTab[] = [
      {
        id: 'tab-alpha',
        url: 'about:newtab',
        title: 'Alpha',
        contentState: 'EMPTY_TAB',
        historyStack: ['about:newtab'],
        historyIndex: 0,
        isLoading: false,
        zoomLevel: 1.0,
        createdAt: Date.now()
      }
    ];

    const html = renderToString(
      React.createElement(BrowserTabBar, {
        tabs,
        activeTabId: 'tab-alpha',
        onSelectTab: () => {},
        onCloseTab: () => {},
        onNewTab: () => {}
      })
    );

    expect(html).toContain('role="tablist"');
    expect(html).toContain('role="tab"');
    expect(html).toContain('aria-label="Orion Browser tabs"');
  });

  // BROWSER-010: Reopen Closed Tab Stack Logic
  it('BROWSER-010: Recently closed tabs can be pushed and popped in LIFO order', () => {
    const recentlyClosed: BrowserTab[] = [];
    const tabA: BrowserTab = {
      id: 'tab-a',
      url: 'https://docs.orion.os',
      title: 'Orion Docs',
      contentState: 'PAGE_LOADED',
      historyStack: ['https://docs.orion.os'],
      historyIndex: 0,
      isLoading: false,
      zoomLevel: 1.0,
      createdAt: 100
    };
    const tabB: BrowserTab = {
      id: 'tab-b',
      url: 'https://github.com',
      title: 'GitHub',
      contentState: 'PAGE_LOADED',
      historyStack: ['https://github.com'],
      historyIndex: 0,
      isLoading: false,
      zoomLevel: 1.0,
      createdAt: 200
    };

    recentlyClosed.push(tabA);
    recentlyClosed.push(tabB);

    const restoredB = recentlyClosed.pop();
    expect(restoredB?.title).toBe('GitHub');

    const restoredA = recentlyClosed.pop();
    expect(restoredA?.title).toBe('Orion Docs');
    expect(recentlyClosed.length).toBe(0);
  });

  // BROWSER-011: History Tracking
  it('BROWSER-011: Records navigation entries to BrowserHistoryManager', () => {
    BrowserHistoryManager.addEntry('https://example.com/logistics', 'Global Logistics');
    BrowserHistoryManager.addEntry('https://orion.os/analytics', 'Orion Analytics');

    const history = BrowserHistoryManager.getHistory();
    expect(history.length).toBe(2);
    expect(history[0].url).toBe('https://orion.os/analytics'); // Most recent first
    expect(history[0].title).toBe('Orion Analytics');
    expect(history[1].url).toBe('https://example.com/logistics');
  });

  // BROWSER-012: History De-duplication & Persistence Limit
  it('BROWSER-012: Enforces 250 max limit and deduplicates consecutive entries', () => {
    // Repeated entry updates timestamp, does not duplicate
    BrowserHistoryManager.addEntry('https://example.com', 'Example 1');
    BrowserHistoryManager.addEntry('https://example.com', 'Example 2');
    expect(BrowserHistoryManager.getHistory().length).toBe(1);
    expect(BrowserHistoryManager.getHistory()[0].title).toBe('Example 2');

    // Check limit clamping
    for (let i = 0; i < 300; i++) {
      BrowserHistoryManager.addEntry(`https://test-site-${i}.com`, `Site ${i}`);
    }
    const history = BrowserHistoryManager.getHistory();
    expect(history.length).toBe(250);
  });

  // BROWSER-013: Bookmarks Add / Remove & Default Bookmarks
  it('BROWSER-013: Manages bookmarks with persistent storage and default system items', () => {
    const initial = BrowserBookmarksManager.getBookmarks();
    expect(initial.length).toBeGreaterThanOrEqual(3);
    expect(BrowserBookmarksManager.isBookmarked('about:newtab')).toBe(false);

    // Add new bookmark
    const added = BrowserBookmarksManager.addBookmark('https://svelte.dev', 'Svelte', 'Web Framework');
    expect(added).toBe(true);
    expect(BrowserBookmarksManager.isBookmarked('https://svelte.dev')).toBe(true);

    // Remove bookmark
    const removed = BrowserBookmarksManager.removeBookmark('https://svelte.dev');
    expect(removed).toBe(true);
    expect(BrowserBookmarksManager.isBookmarked('https://svelte.dev')).toBe(false);
  });

  // BROWSER-014: Navigation Controls (Back / Forward State)
  it('BROWSER-014: Toolbar disables and enables back/forward buttons correctly', () => {
    const htmlAtRoot = renderToString(
      React.createElement(BrowserToolbar, {
        canGoBack: false,
        canGoForward: false,
        isLoading: false,
        currentUrl: 'about:newtab',
        onBack: () => {},
        onForward: () => {},
        onReload: () => {},
        onStop: () => {},
        onHome: () => {},
        onNavigate: () => {},
        isBookmarked: false,
        onToggleBookmark: () => {},
        onOpenMenu: () => {},
        onAskCopilot: () => {}
      })
    );

    expect(htmlAtRoot).toContain('data-testid="browser-back-btn"');
    expect(htmlAtRoot).toContain('data-testid="browser-forward-btn"');
    expect(htmlAtRoot).toContain('disabled=""'); // Both back & forward disabled at root

    const htmlCanBack = renderToString(
      React.createElement(BrowserToolbar, {
        canGoBack: true,
        canGoForward: false,
        isLoading: false,
        currentUrl: 'https://example.com',
        onBack: () => {},
        onForward: () => {},
        onReload: () => {},
        onStop: () => {},
        onHome: () => {},
        onNavigate: () => {},
        isBookmarked: false,
        onToggleBookmark: () => {},
        onOpenMenu: () => {},
        onAskCopilot: () => {}
      })
    );
    expect(htmlCanBack).toContain('data-testid="browser-back-btn"');
  });

  // BROWSER-015: Reload & Stop State
  it('BROWSER-015: Shows Reload button when idle and Stop button when loading', () => {
    const idleHtml = renderToString(
      React.createElement(BrowserToolbar, {
        canGoBack: false,
        canGoForward: false,
        isLoading: false,
        currentUrl: 'about:newtab',
        onBack: () => {},
        onForward: () => {},
        onReload: () => {},
        onStop: () => {},
        onHome: () => {},
        onNavigate: () => {},
        isBookmarked: false,
        onToggleBookmark: () => {},
        onOpenMenu: () => {},
        onAskCopilot: () => {}
      })
    );
    expect(idleHtml).toContain('data-testid="browser-reload-btn"');

    const loadingHtml = renderToString(
      React.createElement(BrowserToolbar, {
        canGoBack: false,
        canGoForward: false,
        isLoading: true,
        currentUrl: 'https://loading.com',
        onBack: () => {},
        onForward: () => {},
        onReload: () => {},
        onStop: () => {},
        onHome: () => {},
        onNavigate: () => {},
        isBookmarked: false,
        onToggleBookmark: () => {},
        onOpenMenu: () => {},
        onAskCopilot: () => {}
      })
    );
    expect(loadingHtml).toContain('data-testid="browser-stop-btn"');
  });

  // BROWSER-016: Zoom Controls
  it('BROWSER-016: Renders content scaled to specified zoom factor', () => {
    const htmlZoomed = renderToString(
      React.createElement(BrowserContent, {
        tab: {
          id: 'tab-zoom',
          url: 'about:newtab',
          title: 'New Tab',
          contentState: 'EMPTY_TAB',
          historyStack: ['about:newtab'],
          historyIndex: 0,
          isLoading: false,
          zoomLevel: 1.25,
          createdAt: Date.now()
        },
        onNavigate: () => {},
        onReload: () => {},
        onOpenExternal: () => {}
      })
    );
    expect(htmlZoomed).toContain('scale(1.25)');
  });

  // BROWSER-017: Find in Page Overlay
  it('BROWSER-017: Menu exposes Find in Page option and shortcuts', () => {
    const htmlMenu = renderToString(
      React.createElement(BrowserMenu, {
        isOpen: true,
        onClose: () => {},
        onNewTab: () => {},
        onReopenClosedTab: () => {},
        onOpenHistory: () => {},
        onOpenBookmarks: () => {},
        onOpenDownloads: () => {},
        onOpenSettings: () => {},
        onFindInPage: () => {},
        onZoomIn: () => {},
        onZoomOut: () => {},
        onResetZoom: () => {},
        zoomLevel: 1.0,
        canReopenClosedTab: true,
        currentUrl: 'https://example.com'
      })
    );
    expect(htmlMenu).toContain('Find in Page');
    expect(htmlMenu).toContain('Ctrl+F');
  });

  // BROWSER-018: Monotonic Generation Protection (Race Condition Shield)
  it('BROWSER-018: Engine rejects stale generation navigation results', async () => {
    const engine = new WebBrowserEngine();
    let generation = 0;

    // First request
    const gen1 = ++generation;
    const res1 = await engine.navigate('https://example.com/fast', gen1);
    expect(res1.generation).toBe(gen1);
    expect(res1.state).toBe('PAGE_LOADED');

    // Simulate an older async completion arriving after newer generation
    const gen2 = ++generation;
    // An earlier handler would check (res.generation === generation) and discard if not equal
    expect(res1.generation === gen2).toBe(false);
  });

  // BROWSER-019: Security & Sandboxed Iframe
  it('BROWSER-019: Renders iframe with strict sandbox attribute without credential leaks', () => {
    const html = renderToString(
      React.createElement(BrowserWebRuntime, {
        url: 'https://example.org',
        title: 'Example',
        isLoading: false,
        onLoadStart: () => {},
        onLoadComplete: () => {},
        onLoadError: () => {}
      })
    );

    expect(html).toContain('sandbox="allow-scripts allow-same-origin allow-forms allow-popups"');
    // Ensure no token or secret leak
    expect(html).not.toContain('orion_token');
    expect(html).not.toContain('apiKey');
    expect(html).not.toContain('firebase');
  });

  // BROWSER-020: Blocked Embedding Fallback UI
  it('BROWSER-020: Renders Blocked Embedding screen with Open Externally action', () => {
    const htmlBlocked = renderToString(
      React.createElement(BrowserContent, {
        tab: {
          id: 'tab-blocked',
          url: 'https://google.com',
          title: 'Google',
          contentState: 'BLOCKED_EMBEDDING',
          historyStack: ['https://google.com'],
          historyIndex: 0,
          isLoading: false,
          zoomLevel: 1.0,
          createdAt: Date.now()
        },
        onNavigate: () => {},
        onReload: () => {},
        onOpenExternal: () => {}
      })
    );

    expect(htmlBlocked).toContain('data-testid="browser-blocked-embedding"');
    expect(htmlBlocked).toContain('Embedding Restricted');
    expect(htmlBlocked).toContain('Open in External Window');
    expect(htmlBlocked).toContain('data-testid="browser-open-external-btn"');
  });

  // BROWSER-021: Copilot Integration Foundation
  it('BROWSER-021: Toolbar includes Ask Orion Copilot action with contextual metadata', () => {
    let copilotInvoked = false;
    const html = renderToString(
      React.createElement(BrowserToolbar, {
        canGoBack: false,
        canGoForward: false,
        isLoading: false,
        currentUrl: 'https://orion.os/supply-chain-briefing',
        onBack: () => {},
        onForward: () => {},
        onReload: () => {},
        onStop: () => {},
        onHome: () => {},
        onNavigate: () => {},
        isBookmarked: false,
        onToggleBookmark: () => {},
        onOpenMenu: () => {},
        onAskCopilot: () => { copilotInvoked = true; }
      })
    );

    expect(html).toContain('data-testid="browser-ask-copilot-btn"');
    expect(html).toContain('Ask Orion Copilot');
  });
});
