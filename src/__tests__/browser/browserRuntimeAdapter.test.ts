/**
 * ORION-9 BROWSER RUNTIME ADAPTER & CAPABILITY TEST SUITE
 * 
 * Verifies:
 * 1. Runtime capability detection (NATIVE vs WEB_EMBEDDED)
 * 2. BrowserRuntimeAdapter contract & lifecycle operations
 * 3. Bidirectional navigation and event synchronization
 * 4. Surface geometry bounds updates
 * 5. Multi-surface tab switching & cleanup
 * 6. Honest load state progression without fake PAGE_LOADED assertions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  detectBrowserRuntimeCapability,
  isNativeRuntimeAvailable,
} from '../../components/browser/BrowserRuntimeCapability';
import {
  getBrowserRuntimeAdapter,
  NativeBrowserAdapter,
  WebEmbeddedBrowserAdapter,
  BrowserBounds,
  NavigationEventType,
  NavigationEventDetail,
} from '../../components/browser/BrowserRuntimeAdapter';
import { browserNativeRuntime } from '../../components/browser/BrowserNativeRuntime';

// Ensure globalThis.window exists for Node testing environment
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
}

describe('Browser Runtime Adapter & Architecture Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (typeof (globalThis as any).window !== 'undefined') {
      delete (globalThis as any).window.__TAURI__;
      delete (globalThis as any).window.__TAURI_INTERNALS__;
      delete (globalThis as any).window.electronAPI;
      delete (globalThis as any).window.chrome;
    }
  });

  // 1. Runtime Capability Detection
  describe('BrowserRuntimeCapability Detection', () => {
    it('detects WEB_EMBEDDED runtime in standard browser environment', () => {
      const cap = detectBrowserRuntimeCapability();
      expect(cap.nativeAvailable).toBe(false);
      expect(cap.embeddedAvailable).toBe(true);
      expect(cap.runtimeType).toBe('WEB_EMBEDDED');
      expect(cap.canBypassIframeSandbox).toBe(false);
      expect(isNativeRuntimeAvailable()).toBe(false);
    });

    it('detects TAURI runtime when __TAURI__ bridge is present', () => {
      (globalThis as any).window.__TAURI__ = {
        core: { invoke: vi.fn() },
      };
      const cap = detectBrowserRuntimeCapability();
      expect(cap.nativeAvailable).toBe(true);
      expect(cap.runtimeType).toBe('TAURI');
      expect(cap.canBypassIframeSandbox).toBe(true);
      expect(isNativeRuntimeAvailable()).toBe(true);
    });

    it('detects ELECTRON runtime when electronAPI is present', () => {
      (globalThis as any).window.electronAPI = {
        invoke: vi.fn(),
      };
      const cap = detectBrowserRuntimeCapability();
      expect(cap.nativeAvailable).toBe(true);
      expect(cap.runtimeType).toBe('ELECTRON');
      expect(cap.canBypassIframeSandbox).toBe(true);
    });

    it('detects WEBVIEW2 runtime when chrome.webview is present', () => {
      (globalThis as any).window.chrome = {
        webview: { postMessage: vi.fn() },
      };
      const cap = detectBrowserRuntimeCapability();
      expect(cap.nativeAvailable).toBe(true);
      expect(cap.runtimeType).toBe('WEBVIEW2');
      expect(cap.canBypassIframeSandbox).toBe(true);
    });
  });

  // 2. WebEmbeddedBrowserAdapter Contract & Honest States
  describe('WebEmbeddedBrowserAdapter Lifecycle', () => {
    it('instantiates WebEmbeddedBrowserAdapter in web mode', () => {
      const adapter = getBrowserRuntimeAdapter('tab-web-1', 'orion://newtab', 'embedded');
      expect(adapter).toBeInstanceOf(WebEmbeddedBrowserAdapter);
      expect(adapter.getCurrentUrl()).toBe('orion://newtab');
      expect(adapter.getTitle()).toBe('New Tab');
      expect(adapter.getCapability().runtimeType).toBe('WEB_EMBEDDED');
    });

    it('honestly initiates navigation in LOADING state and transitions only on real load for embeddable sites', async () => {
      const adapter = new WebEmbeddedBrowserAdapter('tab-1', 'orion://newtab');
      const events: { type: NavigationEventType; detail: NavigationEventDetail }[] = [];

      adapter.addEventListener((type, detail) => {
        events.push({ type, detail });
      });

      await adapter.navigate('https://example.com');

      expect(adapter.getCurrentUrl()).toBe('https://example.com');
      expect(adapter.getTitle()).toBe('example.com');

      // Check navigation-started event was emitted with loading: true
      const started = events.find(e => e.type === 'navigation-started');
      expect(started).toBeDefined();
      expect(started?.detail.loading).toBe(true);
      expect(started?.detail.url).toBe('https://example.com');

      // Authoritative DOM load notification
      adapter.notifyIframeLoaded('https://example.com/', 'Example Domain');
      const finished = events.find(e => e.type === 'navigation-finished');
      expect(finished).toBeDefined();
      expect(finished?.detail.loading).toBe(false);
      expect(finished?.detail.title).toBe('Example Domain');
      expect(adapter.getCurrentUrl()).toBe('https://example.com/');
    });

    it('emits EXTERNAL_REQUIRED for non-embeddable public websites in Web Mode', async () => {
      const adapter = new WebEmbeddedBrowserAdapter('tab-ext', 'orion://newtab');
      const events: { type: NavigationEventType; detail: NavigationEventDetail }[] = [];

      adapter.addEventListener((type, detail) => {
        events.push({ type, detail });
      });

      await adapter.navigate('https://google.com');

      const failed = events.find(e => e.type === 'navigation-failed');
      expect(failed).toBeDefined();
      expect(failed?.detail.error).toBe('EXTERNAL_REQUIRED');
      expect(failed?.detail.loading).toBe(false);
    });

    it('notifies BLOCKED_EMBEDDING when site forbids iframe framing', async () => {
      const adapter = new WebEmbeddedBrowserAdapter('tab-blocked', 'orion://newtab');
      const events: { type: NavigationEventType; detail: NavigationEventDetail }[] = [];

      adapter.addEventListener((type, detail) => {
        events.push({ type, detail });
      });

      await adapter.navigate('https://example.com');
      adapter.notifyIframeBlocked('https://example.com');

      const failed = events.find(e => e.type === 'navigation-failed');
      expect(failed).toBeDefined();
      expect(failed?.detail.error).toBe('BLOCKED_EMBEDDING');
    });
  });

  // 3. NativeBrowserAdapter Contract & Multi-Surface Management
  describe('NativeBrowserAdapter Lifecycle', () => {
    it('instantiates NativeBrowserAdapter and synchronizes bounds without iframe restrictions', async () => {
      const adapter = new NativeBrowserAdapter('tab-nat-1', 'https://google.com');
      const events: { type: NavigationEventType; detail: NavigationEventDetail }[] = [];

      adapter.addEventListener((type, detail) => {
        events.push({ type, detail });
      });

      expect(adapter.getCapability().nativeAvailable).toBe(true);
      expect(adapter.getCapability().canBypassIframeSandbox).toBe(true);

      const bounds: BrowserBounds = { x: 50, y: 100, width: 1200, height: 800 };
      adapter.setBounds(bounds);

      // Verify bounds are tracked in native surface registry
      const surface = browserNativeRuntime.getSurface('tab-nat-1');
      expect(surface?.bounds).toEqual(bounds);
    });

    it('switches between tab surfaces hiding inactive and revealing active', async () => {
      const adapter = new NativeBrowserAdapter('tab-1', 'https://google.com');

      await adapter.createTab('tab-1', 'https://google.com');
      await adapter.createTab('tab-2', 'https://github.com');

      await adapter.switchTab('tab-2');
      expect(browserNativeRuntime.getSurface('tab-2')?.visible).toBe(true);
      expect(browserNativeRuntime.getSurface('tab-1')?.visible).toBe(false);

      await adapter.switchTab('tab-1');
      expect(browserNativeRuntime.getSurface('tab-1')?.visible).toBe(true);
      expect(browserNativeRuntime.getSurface('tab-2')?.visible).toBe(false);

      await adapter.closeTab('tab-2');
      expect(browserNativeRuntime.getSurface('tab-2')).toBeUndefined();
    });

    it('executes zoom and find-in-page commands via native bridge', async () => {
      const adapter = new NativeBrowserAdapter('tab-features', 'https://wikipedia.org');

      adapter.setZoom(1.2);
      expect(browserNativeRuntime.getSurface('tab-features')?.zoom).toBe(1.2);

      const findRes = await adapter.findInPage('Orion', true);
      expect(findRes).toBeDefined();

      adapter.stopFind('clear');
      adapter.destroy();
    });
  });
});
