/**
 * ORION-9 NATIVE BROWSER RUNTIME BRIDGE
 * 
 * Manages native WebView window/surface lifecycle through Tauri 2.x (or Electron/WebView2) IPC.
 * Responsible for creating, positioning, showing/hiding, navigating, and destroying
 * real operating system WebView surfaces underneath the React browser chrome.
 */

import { BrowserBounds, NavigationEventType, NavigationEventDetail } from './BrowserRuntimeAdapter';
import { BrowserDownloadManager } from './BrowserDownloadManager';

export interface NativeSurfaceRecord {
  surfaceId: string;
  tabId: string;
  url: string;
  title: string;
  visible: boolean;
  bounds: BrowserBounds;
  zoom: number;
}

export class BrowserNativeRuntimeBridge {
  private static instance: BrowserNativeRuntimeBridge;
  private surfaces: Map<string, NativeSurfaceRecord> = new Map();
  private activeTabId: string | null = null;
  private listeners: Set<(event: NavigationEventType, detail: NavigationEventDetail) => void> = new Set();
  private isSubscribedToTauriEvents: boolean = false;

  private constructor() {
    this.setupEventListener();
  }

  public static getInstance(): BrowserNativeRuntimeBridge {
    if (!BrowserNativeRuntimeBridge.instance) {
      BrowserNativeRuntimeBridge.instance = new BrowserNativeRuntimeBridge();
    }
    return BrowserNativeRuntimeBridge.instance;
  }

  private async invokeNative(command: string, args: Record<string, any> = {}): Promise<any> {
    if (typeof window === 'undefined') return null;
    const win = window as any;

    // Tauri 2.x / 1.x IPC
    if (win.__TAURI__?.core?.invoke) {
      return win.__TAURI__.core.invoke(command, args);
    }
    if (win.__TAURI__?.invoke) {
      return win.__TAURI__.invoke(command, args);
    }
    if (win.__TAURI_INTERNALS__?.invoke) {
      return win.__TAURI_INTERNALS__.invoke(command, args);
    }

    // Electron IPC
    if (win.electronAPI?.invoke) {
      return win.electronAPI.invoke(command, args);
    }

    // WebView2 Host Object
    if (win.chrome?.webview?.postMessage) {
      win.chrome.webview.postMessage({ command, ...args });
      return null;
    }

    return null;
  }

  private setupEventListener(): void {
    if (typeof window === 'undefined' || this.isSubscribedToTauriEvents) return;
    const win = window as any;

    const dispatch = (type: NavigationEventType, detail: NavigationEventDetail) => {
      this.listeners.forEach(fn => fn(type, detail));
      // Also broadcast as CustomEvent for system-wide observability
      window.dispatchEvent(new CustomEvent('orion-browser-runtime-event', {
        detail: { type, ...detail }
      }));
    };

    // Listen to Tauri events if available
    if (win.__TAURI__?.event?.listen) {
      win.__TAURI__.event.listen('orion://browser-event', (event: any) => {
        const payload = event?.payload || {};
        if (payload.type) {
          dispatch(payload.type, payload.detail || {});
        }
      });
      this.isSubscribedToTauriEvents = true;
    }

    // DOM event listener for cross-frame or test mocks
    window.addEventListener('orion-native-browser-incoming', ((e: CustomEvent) => {
      if (e.detail?.type) {
        dispatch(e.detail.type, e.detail.detail || {});
      }
    }) as EventListener);
  }

  public addListener(fn: (event: NavigationEventType, detail: NavigationEventDetail) => void): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }

  /**
   * Creates a dedicated native WebView surface for a tab.
   */
  public async createSurface(tabId: string, initialUrl: string = 'about:blank'): Promise<string> {
    const surfaceId = `native_surface_${tabId}`;
    const defaultBounds: BrowserBounds = { x: 0, y: 0, width: 800, height: 600 };

    const record: NativeSurfaceRecord = {
      surfaceId,
      tabId,
      url: initialUrl,
      title: 'New Tab',
      visible: this.activeTabId === tabId,
      bounds: defaultBounds,
      zoom: 1.0,
    };
    this.surfaces.set(tabId, record);

    await this.invokeNative('browser_create_surface', {
      tabId,
      surfaceId,
      initialUrl,
      bounds: defaultBounds,
    });

    return surfaceId;
  }

  /**
   * Synchronizes geometry bounds with native WebView surface.
   */
  public async setBounds(tabId: string, bounds: BrowserBounds): Promise<void> {
    let record = this.surfaces.get(tabId);
    if (record) {
      record.bounds = bounds;
    } else {
      record = {
        surfaceId: `native_surface_${tabId}`,
        tabId,
        url: 'about:blank',
        title: 'New Tab',
        visible: true,
        bounds,
        zoom: 1.0,
      };
      this.surfaces.set(tabId, record);
    }

    await this.invokeNative('browser_set_bounds', {
      tabId,
      bounds,
    });
  }

  /**
   * Switches active tab surface: hides inactive surface, shows active surface.
   */
  public async switchTab(activeTabId: string): Promise<void> {
    this.activeTabId = activeTabId;

    for (const [id, record] of this.surfaces.entries()) {
      if (id === activeTabId) {
        record.visible = true;
        await this.invokeNative('browser_show_surface', { tabId: id });
      } else if (record.visible) {
        record.visible = false;
        await this.invokeNative('browser_hide_surface', { tabId: id });
      }
    }
  }

  /**
   * Destroys a tab's native WebView surface when the tab is closed.
   */
  public async closeSurface(tabId: string): Promise<void> {
    this.surfaces.delete(tabId);
    await this.invokeNative('browser_close_surface', { tabId });
  }

  /**
   * Navigates the native WebView surface.
   */
  public async navigate(tabId: string, url: string): Promise<void> {
    const record = this.surfaces.get(tabId);
    if (record) {
      record.url = url;
    }

    this.emitEvent('navigation-started', { tabId, url, loading: true });

    await this.invokeNative('browser_navigate', { tabId, url });
  }

  public async goBack(tabId: string): Promise<void> {
    await this.invokeNative('browser_go_back', { tabId });
  }

  public async goForward(tabId: string): Promise<void> {
    await this.invokeNative('browser_go_forward', { tabId });
  }

  public async reload(tabId: string): Promise<void> {
    await this.invokeNative('browser_reload', { tabId });
  }

  public async stop(tabId: string): Promise<void> {
    await this.invokeNative('browser_stop', { tabId });
    this.emitEvent('loading-changed', { tabId, loading: false });
  }

  public async setZoom(tabId: string, zoom: number): Promise<void> {
    let record = this.surfaces.get(tabId);
    if (record) {
      record.zoom = zoom;
    } else {
      record = {
        surfaceId: `native_surface_${tabId}`,
        tabId,
        url: 'about:blank',
        title: 'New Tab',
        visible: true,
        bounds: { x: 0, y: 0, width: 800, height: 600 },
        zoom,
      };
      this.surfaces.set(tabId, record);
    }
    await this.invokeNative('browser_set_zoom', { tabId, zoom });
  }

  public async findInPage(tabId: string, query: string, forward: boolean = true): Promise<{ count: number; activeIndex: number }> {
    const res = await this.invokeNative('browser_find_in_page', { tabId, query, forward });
    return res || { count: 0, activeIndex: 0 };
  }

  public async stopFind(tabId: string, action: 'clear' | 'keep' | 'activate' = 'clear'): Promise<void> {
    await this.invokeNative('browser_stop_find', { tabId, action });
  }

  public emitEvent(type: NavigationEventType, detail: NavigationEventDetail): void {
    this.listeners.forEach(fn => fn(type, detail));
  }

  public getSurface(tabId: string): NativeSurfaceRecord | undefined {
    return this.surfaces.get(tabId);
  }
}

export const browserNativeRuntime = BrowserNativeRuntimeBridge.getInstance();
