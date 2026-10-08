/**
 * ORION-9 NATIVE BROWSER RUNTIME BRIDGE
 * 
 * Manages native WebView window/surface lifecycle through Tauri 2.x (or Electron/WebView2) IPC.
 * Responsible for creating, positioning, showing/hiding, navigating, and destroying
 * real operating system WebView surfaces underneath the React browser chrome.
 * 
 * Guarantees:
 * - Deterministic native surface lifecycle: CREATING -> READY -> VISIBLE / HIDDEN -> CLOSING -> CLOSED / ERROR.
 * - Idempotent ensureSurface prevents navigation race conditions.
 * - Structured development logging: [BROWSER:NATIVE], [BROWSER:NAV], [BROWSER:ERROR].
 * - Classified error handling.
 */

import { BrowserBounds, NavigationEventType, NavigationEventDetail } from './BrowserRuntimeAdapter';
import { NativeSurfaceLifecycleState } from './BrowserTypes';

export interface NativeSurfaceRecord {
  surfaceId: string;
  tabId: string;
  url: string;
  title: string;
  visible: boolean;
  bounds: BrowserBounds;
  zoom: number;
  lifecycleState: NativeSurfaceLifecycleState;
  errorMessage?: string;
}

const LOG_PREFIX = '[BROWSER:NATIVE]';

export class BrowserNativeRuntimeBridge {
  private static instance: BrowserNativeRuntimeBridge;
  private surfaces: Map<string, NativeSurfaceRecord> = new Map();
  private pendingCreations: Map<string, Promise<string>> = new Map();
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

  private log(tag: string, ...args: any[]): void {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`${tag}`, ...args);
    }
  }

  private logError(tag: string, ...args: any[]): void {
    console.error(`${tag}`, ...args);
  }

  private async invokeNative(command: string, args: Record<string, any> = {}): Promise<any> {
    if (typeof window === 'undefined') return null;
    const win = window as any;

    try {
      // Tauri 2.x / 1.x IPC
      if (win.__TAURI__?.core?.invoke) {
        return await win.__TAURI__.core.invoke(command, args);
      }
      if (win.__TAURI__?.invoke) {
        return await win.__TAURI__.invoke(command, args);
      }
      if (win.__TAURI_INTERNALS__?.invoke) {
        return await win.__TAURI_INTERNALS__.invoke(command, args);
      }

      // Electron IPC
      if (win.electronAPI?.invoke) {
        return await win.electronAPI.invoke(command, args);
      }

      // WebView2 Host Object
      if (win.chrome?.webview?.postMessage) {
        win.chrome.webview.postMessage({ command, ...args });
        return null;
      }
    } catch (err: any) {
      this.logError('[BROWSER:ERROR]', `Native invoke failed for ${command}:`, err);
      throw err;
    }

    return null;
  }

  private setupEventListener(): void {
    if (typeof window === 'undefined' || this.isSubscribedToTauriEvents) return;
    const win = window as any;

    const dispatch = (type: NavigationEventType, detail: NavigationEventDetail) => {
      // Map canonical event types to adapter listeners
      let normalizedType = type;
      if (type === 'browser-navigation-started' as any) normalizedType = 'navigation-started';
      if (type === 'browser-navigation-committed' as any) normalizedType = 'navigation-committed';
      if (type === 'browser-page-loaded' as any) normalizedType = 'navigation-finished';
      if (type === 'browser-title-changed' as any) normalizedType = 'title-changed';

      // Update internal surface record lifecycle on lifecycle events
      if (detail.tabId) {
        const record = this.surfaces.get(detail.tabId);
        if (record) {
          if (type === 'browser-surface-lifecycle' as any && (detail as any).state) {
            record.lifecycleState = (detail as any).state;
          } else if (normalizedType === 'navigation-started') {
            record.lifecycleState = 'VISIBLE';
          } else if (normalizedType === 'navigation-finished') {
            record.lifecycleState = 'VISIBLE';
          }
        }
      }

      this.listeners.forEach(fn => fn(normalizedType, detail));

      // Broadcast system-wide event for telemetry & diagnostics
      window.dispatchEvent(
        new CustomEvent('orion-browser-runtime-event', {
          detail: { type: normalizedType, canonicalType: type, ...detail },
        })
      );
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
   * Idempotently ensures that a dedicated native WebView surface exists for the given tab.
   * If surface already exists, returns existing surfaceId.
   * If surface is currently being created, awaits the in-flight promise.
   * Prevents race condition where navigate() is called before createSurface completes.
   */
  public async ensureSurface(
    tabId: string,
    initialUrl: string = 'about:blank',
    bounds?: BrowserBounds
  ): Promise<string> {
    const existing = this.surfaces.get(tabId);
    if (existing && existing.lifecycleState !== 'ERROR' && existing.lifecycleState !== 'CLOSED') {
      return existing.surfaceId;
    }

    const inFlight = this.pendingCreations.get(tabId);
    if (inFlight) {
      return inFlight;
    }

    const surfaceId = `native_surface_${tabId}`;
    const defaultBounds: BrowserBounds = bounds || { x: 0, y: 0, width: 800, height: 600 };

    const record: NativeSurfaceRecord = {
      surfaceId,
      tabId,
      url: initialUrl,
      title: 'New Tab',
      visible: this.activeTabId === tabId,
      bounds: defaultBounds,
      zoom: 1.0,
      lifecycleState: 'CREATING',
    };
    this.surfaces.set(tabId, record);

    const creationPromise = (async () => {
      try {
        this.log(LOG_PREFIX, `[BROWSER:TAB] Creating native surface for ${tabId} (${initialUrl})`);
        // Try idempotent browser_ensure_surface first, fallback to browser_create_surface
        try {
          await this.invokeNative('browser_ensure_surface', {
            tabId,
            surfaceId,
            initialUrl,
            bounds: defaultBounds,
          });
        } catch {
          await this.invokeNative('browser_create_surface', {
            tabId,
            surfaceId,
            initialUrl,
            bounds: defaultBounds,
          });
        }
        record.lifecycleState = 'READY';
        return surfaceId;
      } catch (err: any) {
        record.lifecycleState = 'ERROR';
        const formattedErr = `NATIVE_RUNTIME_ERROR: ${err?.message || 'Failed to create native surface'}`;
        record.errorMessage = formattedErr;
        this.logError(LOG_PREFIX, `[BROWSER:ERROR] Surface creation failed for ${tabId}:`, err);
        this.emitEvent('navigation-failed', {
          tabId,
          url: initialUrl,
          error: formattedErr,
          loading: false,
        });
        throw new Error(formattedErr);
      } finally {
        this.pendingCreations.delete(tabId);
      }
    })();

    this.pendingCreations.set(tabId, creationPromise);
    return creationPromise;
  }

  /**
   * Creates a dedicated native WebView surface for a tab (delegates to ensureSurface).
   */
  public async createSurface(tabId: string, initialUrl: string = 'about:blank'): Promise<string> {
    return this.ensureSurface(tabId, initialUrl);
  }

  /**
   * Synchronizes geometry bounds with native WebView surface.
   */
  public async setBounds(tabId: string, bounds: BrowserBounds): Promise<void> {
    if (bounds.width <= 0 || bounds.height <= 0 || isNaN(bounds.width) || isNaN(bounds.height)) {
      return; // Ignore invalid bounds
    }

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
        lifecycleState: 'READY',
      };
      this.surfaces.set(tabId, record);
    }

    try {
      await this.invokeNative('browser_set_bounds', {
        tabId,
        bounds,
      });
    } catch (err: any) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] setBounds failed for ${tabId}:`, err);
      throw err;
    }
  }

  /**
   * Switches active tab surface: hides inactive surface, shows active surface.
   * Guarantees no multiple native surfaces visible simultaneously.
   * If active tab is internal orion://newtab, all native surfaces remain hidden.
   */
  public async switchTab(activeTabId: string): Promise<void> {
    this.activeTabId = activeTabId;
    this.log(LOG_PREFIX, `[BROWSER:TAB] Switching active surface to ${activeTabId}`);

    for (const [id, record] of this.surfaces.entries()) {
      if (id === activeTabId) {
        // Only show if the active tab has navigated to an external URL
        const isExternal = record.url && record.url.startsWith('http');
        if (isExternal) {
          record.visible = true;
          record.lifecycleState = 'VISIBLE';
          try {
            await this.invokeNative('browser_show_surface', { tabId: id });
          } catch (err: any) {
            record.lifecycleState = 'ERROR';
            const formattedErr = `NATIVE_RUNTIME_ERROR: ${err?.message || 'Failed to show native surface'}`;
            record.errorMessage = formattedErr;
            this.logError(LOG_PREFIX, `[BROWSER:ERROR] show_surface failed for ${id}:`, err);
            this.emitEvent('navigation-failed', {
              tabId: id,
              error: formattedErr,
              loading: false,
            });
            throw new Error(formattedErr);
          }
        } else {
          record.visible = false;
          record.lifecycleState = 'HIDDEN';
          try {
            await this.invokeNative('browser_hide_surface', { tabId: id });
          } catch (err: any) {
            this.logError(LOG_PREFIX, `[BROWSER:ERROR] hide_surface failed for ${id}:`, err);
            throw err;
          }
        }
      } else if (record.visible) {
        record.visible = false;
        record.lifecycleState = 'HIDDEN';
        try {
          await this.invokeNative('browser_hide_surface', { tabId: id });
        } catch (err: any) {
          this.logError(LOG_PREFIX, `[BROWSER:ERROR] hide_surface failed for ${id}:`, err);
          throw err;
        }
      }
    }
  }

  /**
   * Explicitly hides the native surface for a tab (e.g. when displaying internal UI).
   */
  public async hideSurface(tabId: string): Promise<void> {
    const record = this.surfaces.get(tabId);
    if (record) {
      record.visible = false;
      record.lifecycleState = 'HIDDEN';
    }
    try {
      await this.invokeNative('browser_hide_surface', { tabId });
    } catch (err: any) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] hideSurface failed for ${tabId}:`, err);
      throw err;
    }
  }

  /**
   * Destroys a tab's native WebView surface when the tab is closed.
   */
  public async closeSurface(tabId: string): Promise<void> {
    const record = this.surfaces.get(tabId);
    if (record) {
      record.lifecycleState = 'CLOSING';
    }
    this.surfaces.delete(tabId);
    this.pendingCreations.delete(tabId);

    try {
      await this.invokeNative('browser_close_surface', { tabId });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] closeSurface failed for ${tabId}:`, err);
    }
  }

  /**
   * Navigates the native WebView surface.
   * Guarantees surface exists before issuing native navigation.
   */
  public async navigate(tabId: string, url: string): Promise<void> {
    this.log(LOG_PREFIX, `[BROWSER:NAV] Navigating tab ${tabId} to ${url}`);
    
    // Step 1: Idempotently ensure native surface is created and ready
    await this.ensureSurface(tabId, url);

    const record = this.surfaces.get(tabId);
    if (record) {
      record.url = url;
      record.lifecycleState = 'VISIBLE';
    }

    // Step 2: Issue native navigation
    try {
      await this.invokeNative('browser_navigate', { tabId, url });
    } catch (err: any) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] Native navigation failed for ${tabId}:`, err);
      if (record) {
        record.lifecycleState = 'ERROR';
        record.errorMessage = err?.message || 'Navigation failed';
      }
      throw err;
    }
  }

  public async goBack(tabId: string): Promise<void> {
    try {
      await this.invokeNative('browser_go_back', { tabId });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] goBack failed for ${tabId}:`, err);
    }
  }

  public async goForward(tabId: string): Promise<void> {
    try {
      await this.invokeNative('browser_go_forward', { tabId });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] goForward failed for ${tabId}:`, err);
    }
  }

  public async reload(tabId: string): Promise<void> {
    try {
      await this.invokeNative('browser_reload', { tabId });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] reload failed for ${tabId}:`, err);
    }
  }

  public async stop(tabId: string): Promise<void> {
    try {
      await this.invokeNative('browser_stop', { tabId });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] stop failed for ${tabId}:`, err);
    }
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
        lifecycleState: 'READY',
      };
      this.surfaces.set(tabId, record);
    }
    try {
      await this.invokeNative('browser_set_zoom', { tabId, zoom });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] setZoom failed for ${tabId}:`, err);
    }
  }

  public async findInPage(tabId: string, query: string, forward: boolean = true): Promise<{ count: number; activeIndex: number }> {
    try {
      const res = await this.invokeNative('browser_find_in_page', { tabId, query, forward });
      return res || { count: 0, activeIndex: 0 };
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] findInPage failed for ${tabId}:`, err);
      return { count: 0, activeIndex: 0 };
    }
  }

  public async stopFind(tabId: string, action: 'clear' | 'keep' | 'activate' = 'clear'): Promise<void> {
    try {
      await this.invokeNative('browser_stop_find', { tabId, action });
    } catch (err) {
      this.logError(LOG_PREFIX, `[BROWSER:ERROR] stopFind failed for ${tabId}:`, err);
    }
  }

  public emitEvent(type: NavigationEventType, detail: NavigationEventDetail): void {
    this.listeners.forEach(fn => fn(type, detail));
  }

  public getSurface(tabId: string): NativeSurfaceRecord | undefined {
    return this.surfaces.get(tabId);
  }

  public getAllSurfaces(): Map<string, NativeSurfaceRecord> {
    return new Map(this.surfaces);
  }
}

export const browserNativeRuntime = BrowserNativeRuntimeBridge.getInstance();
