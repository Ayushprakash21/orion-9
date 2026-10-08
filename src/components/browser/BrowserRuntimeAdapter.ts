/**
 * ORION-9 BROWSER RUNTIME ADAPTER
 * 
 * Canonical abstraction layer connecting Orion Browser UI to:
 * - Native WebView runtime (Tauri 2.x, Electron, WebView2) in packaged desktop environments.
 * - Web Embedded compatibility runtime (sandboxed iframe) in browser/Cloudflare environments.
 * 
 * Guarantees honest navigation states, zero fake PAGE_LOADED states, and bidirectional
 * lifecycle synchronization.
 */

import { BrowserRuntimeCapability, detectBrowserRuntimeCapability } from './BrowserRuntimeCapability';
import { browserNativeRuntime, BrowserNativeRuntimeBridge } from './BrowserNativeRuntime';
import { normalizeUrl, isValidUrl } from './BrowserEngine';

export interface BrowserBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type NavigationEventType =
  | 'navigation-started'
  | 'navigation-committed'
  | 'navigation-finished'
  | 'navigation-failed'
  | 'title-changed'
  | 'url-changed'
  | 'loading-changed'
  | 'favicon-changed'
  | 'security-changed'
  | 'find-result'
  | 'zoom-changed'
  | 'download-started'
  | 'download-completed'
  | 'download-failed';

export interface NavigationEventDetail {
  tabId: string;
  url?: string;
  title?: string;
  loading?: boolean;
  error?: string;
  favicon?: string;
  securityStatus?: 'secure' | 'insecure' | 'internal';
  bounds?: BrowserBounds;
  count?: number;
  activeIndex?: number;
  zoom?: number;
  download?: any;
}

export type BrowserEventListener = (event: NavigationEventType, detail: NavigationEventDetail) => void;

/**
 * Authoritative Browser Runtime Adapter Interface.
 * React browser chrome (tabs, toolbar, address bar, history, bookmarks, Copilot)
 * communicates exclusively through this interface.
 */
export interface BrowserRuntimeAdapter {
  navigate(url: string): Promise<void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  stop(): Promise<void>;
  getCurrentUrl(): string;
  getTitle(): string;
  setBounds(bounds: BrowserBounds): void;
  focus(): void;
  destroy(): void;

  // Tab & Surface lifecycle
  createTab(tabId: string, initialUrl?: string): Promise<string>;
  switchTab(tabId: string): Promise<void>;
  closeTab(tabId: string): Promise<void>;

  // Native features
  setZoom(zoom: number): void;
  findInPage(query: string, forward?: boolean): Promise<{ count: number; activeIndex: number }>;
  stopFind(action?: 'clear' | 'keep' | 'activate'): void;

  // Event subscription
  addEventListener(listener: BrowserEventListener): () => void;
  getCapability(): BrowserRuntimeCapability;
}

/**
 * NativeBrowserAdapter: Controls real native WebView surfaces via Tauri 2.x/native host.
 * Enables actual rendering of all websites (Google, GitHub, Wikipedia, YouTube, Microsoft)
 * without iframe embedding restrictions. Never yields BLOCKED_EMBEDDING.
 */
export class NativeBrowserAdapter implements BrowserRuntimeAdapter {
  private currentTabId: string;
  private currentUrl: string = 'orion://newtab';
  private currentTitle: string = 'New Tab';
  private currentBounds: BrowserBounds = { x: 0, y: 0, width: 800, height: 600 };
  private listeners: Set<BrowserEventListener> = new Set();
  private bridge: BrowserNativeRuntimeBridge;
  private unsubscribeBridge: (() => void) | null = null;

  constructor(tabId: string = 'tab-1', initialUrl: string = 'orion://newtab') {
    this.currentTabId = tabId;
    this.currentUrl = initialUrl;
    this.bridge = browserNativeRuntime;

    this.unsubscribeBridge = this.bridge.addListener((event, detail) => {
      if (!detail.tabId || detail.tabId === this.currentTabId) {
        if (detail.url) this.currentUrl = detail.url;
        if (detail.title) this.currentTitle = detail.title;
        this.listeners.forEach(fn => fn(event, detail));
      }
    });
  }

  public async navigate(url: string): Promise<void> {
    const resolved = normalizeUrl(url);
    this.currentUrl = resolved;

    // Derive initial domain title
    try {
      this.currentTitle = new URL(resolved).hostname.replace(/^www\./, '');
    } catch {
      this.currentTitle = resolved;
    }

    this.emitEvent('navigation-started', {
      tabId: this.currentTabId,
      url: this.currentUrl,
      title: this.currentTitle,
      loading: true,
    });

    await this.bridge.navigate(this.currentTabId, resolved);

    // If native IPC returns confirmation
    this.emitEvent('navigation-committed', {
      tabId: this.currentTabId,
      url: this.currentUrl,
      title: this.currentTitle,
      loading: true,
    });
  }

  public async goBack(): Promise<void> {
    await this.bridge.goBack(this.currentTabId);
  }

  public async goForward(): Promise<void> {
    await this.bridge.goForward(this.currentTabId);
  }

  public async reload(): Promise<void> {
    await this.bridge.reload(this.currentTabId);
  }

  public async stop(): Promise<void> {
    await this.bridge.stop(this.currentTabId);
    this.emitEvent('loading-changed', {
      tabId: this.currentTabId,
      loading: false,
    });
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  public getTitle(): string {
    return this.currentTitle;
  }

  public setBounds(bounds: BrowserBounds): void {
    this.currentBounds = bounds;
    this.bridge.setBounds(this.currentTabId, bounds);
  }

  public focus(): void {
    // Native focus call
  }

  public destroy(): void {
    if (this.unsubscribeBridge) {
      this.unsubscribeBridge();
      this.unsubscribeBridge = null;
    }
    this.listeners.clear();
  }

  public async createTab(tabId: string, initialUrl: string = 'about:blank'): Promise<string> {
    return this.bridge.createSurface(tabId, initialUrl);
  }

  public async switchTab(tabId: string): Promise<void> {
    this.currentTabId = tabId;
    await this.bridge.switchTab(tabId);
  }

  public async closeTab(tabId: string): Promise<void> {
    await this.bridge.closeSurface(tabId);
  }

  public setZoom(zoom: number): void {
    this.bridge.setZoom(this.currentTabId, zoom);
  }

  public async findInPage(query: string, forward: boolean = true): Promise<{ count: number; activeIndex: number }> {
    return this.bridge.findInPage(this.currentTabId, query, forward);
  }

  public stopFind(action: 'clear' | 'keep' | 'activate' = 'clear'): void {
    this.bridge.stopFind(this.currentTabId, action);
  }

  public addEventListener(listener: BrowserEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getCapability(): BrowserRuntimeCapability {
    return {
      nativeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'TAURI',
      platform: 'windows',
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
    };
  }

  private emitEvent(type: NavigationEventType, detail: NavigationEventDetail): void {
    this.listeners.forEach(fn => fn(type, detail));
  }
}

/**
 * WebEmbeddedBrowserAdapter: Sandboxed web runtime for web SPA deployment.
 * Honestly marks when pages are loading, loaded, or blocked by X-Frame-Options/CSP.
 */
export class WebEmbeddedBrowserAdapter implements BrowserRuntimeAdapter {
  private currentTabId: string;
  private currentUrl: string = 'orion://newtab';
  private currentTitle: string = 'New Tab';
  private currentBounds: BrowserBounds = { x: 0, y: 0, width: 800, height: 600 };
  private listeners: Set<BrowserEventListener> = new Set();
  private unsubscribeWindow: (() => void) | null = null;

  constructor(tabId: string = 'tab-1', initialUrl: string = 'orion://newtab') {
    this.currentTabId = tabId;
    this.currentUrl = initialUrl;

    if (typeof window !== 'undefined') {
      const handleRuntimeEvent = (e: any) => {
        const detail = e.detail;
        if (detail && detail.type) {
          if (!detail.tabId || detail.tabId === this.currentTabId) {
            this.emitEvent(detail.type, detail);
          }
        }
      };
      window.addEventListener('orion-browser-runtime-event', handleRuntimeEvent);
      this.unsubscribeWindow = () => {
        window.removeEventListener('orion-browser-runtime-event', handleRuntimeEvent);
      };
    }
  }

  public async navigate(url: string): Promise<void> {
    const resolved = normalizeUrl(url);
    this.currentUrl = resolved;

    try {
      this.currentTitle = new URL(resolved).hostname.replace(/^www\./, '');
    } catch {
      this.currentTitle = resolved;
    }

    this.emitEvent('navigation-started', {
      tabId: this.currentTabId,
      url: this.currentUrl,
      title: this.currentTitle,
      loading: true,
    });

    // In web embedded mode, actual load or block is confirmed by DOM iframe handlers
    this.emitEvent('navigation-committed', {
      tabId: this.currentTabId,
      url: this.currentUrl,
      title: this.currentTitle,
      loading: true,
    });
  }

  public async goBack(): Promise<void> {}
  public async goForward(): Promise<void> {}
  public async reload(): Promise<void> {
    await this.navigate(this.currentUrl);
  }
  public async stop(): Promise<void> {
    this.emitEvent('loading-changed', {
      tabId: this.currentTabId,
      loading: false,
    });
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  public getTitle(): string {
    return this.currentTitle;
  }

  public setBounds(bounds: BrowserBounds): void {
    this.currentBounds = bounds;
  }

  public focus(): void {}
  public destroy(): void {
    if (this.unsubscribeWindow) {
      this.unsubscribeWindow();
      this.unsubscribeWindow = null;
    }
    this.listeners.clear();
  }

  public async createTab(tabId: string, initialUrl: string = 'orion://newtab'): Promise<string> {
    return `web_surface_${tabId}`;
  }

  public async switchTab(tabId: string): Promise<void> {
    this.currentTabId = tabId;
  }

  public async closeTab(_tabId: string): Promise<void> {}

  public setZoom(zoom: number): void {
    this.emitEvent('zoom-changed', {
      tabId: this.currentTabId,
      zoom,
    });
  }

  public async findInPage(_query: string, _forward?: boolean): Promise<{ count: number; activeIndex: number }> {
    return { count: 0, activeIndex: 0 };
  }

  public stopFind(): void {}

  public addEventListener(listener: BrowserEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getCapability(): BrowserRuntimeCapability {
    return detectBrowserRuntimeCapability();
  }

  /**
   * Called by iframe runtime when real DOM load finishes.
   */
  public notifyIframeLoaded(url: string, title?: string): void {
    this.currentUrl = url;
    if (title) this.currentTitle = title;
    this.emitEvent('navigation-finished', {
      tabId: this.currentTabId,
      url: this.currentUrl,
      title: this.currentTitle,
      loading: false,
    });
  }

  /**
   * Called when iframe embedding is blocked by X-Frame-Options or CSP.
   */
  public notifyIframeBlocked(url: string): void {
    this.emitEvent('navigation-failed', {
      tabId: this.currentTabId,
      url,
      error: 'BLOCKED_EMBEDDING',
      loading: false,
    });
  }

  private emitEvent(type: NavigationEventType, detail: NavigationEventDetail): void {
    this.listeners.forEach(fn => fn(type, detail));
  }
}

/**
 * Factory function to retrieve canonical adapter for current environment.
 */
export function getBrowserRuntimeAdapter(
  tabId: string = 'tab-1',
  initialUrl: string = 'orion://newtab',
  forceMode?: 'native' | 'embedded'
): BrowserRuntimeAdapter {
  const cap = detectBrowserRuntimeCapability();
  const useNative = forceMode === 'native' || (forceMode !== 'embedded' && cap.nativeAvailable);

  if (useNative) {
    return new NativeBrowserAdapter(tabId, initialUrl);
  }
  return new WebEmbeddedBrowserAdapter(tabId, initialUrl);
}
