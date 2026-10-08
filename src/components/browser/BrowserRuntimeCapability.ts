/**
 * ORION-9 BROWSER RUNTIME CAPABILITY
 * 
 * Provides honest runtime environment detection to distinguish between:
 * 1. NATIVE_BROWSER: Packaged desktop application (Tauri 2.x, Electron, or WebView2)
 *    which hosts real native webviews with direct networking and zero iframe embedding restrictions.
 * 2. WEB_EMBEDDED: Standard web browser SPA (e.g. deployed to Cloudflare Workers or Node)
 *    operating in a sandboxed iframe context as a compatibility viewer.
 */

export type BrowserRuntimeEnvironmentType = 'TAURI' | 'ELECTRON' | 'WEBVIEW2' | 'WEB_EMBEDDED';

export interface BrowserRuntimeCapability {
  /** Whether a real native WebView host runtime is active */
  nativeAvailable: boolean;
  /** Whether the embedded iframe compatibility viewer is available */
  embeddedAvailable: boolean;
  /** Specific host runtime identifier */
  runtimeType: BrowserRuntimeEnvironmentType;
  /** Platform identifier */
  platform: 'windows' | 'macos' | 'linux' | 'web';
  /** Supports multiple persistent native webview surfaces per tab */
  hasMultiSurface: boolean;
  /** Unrestricted web navigation without X-Frame-Options or CSP iframe limits */
  canBypassIframeSandbox: boolean;
}

/**
 * Evaluates the current execution environment for native desktop WebView bridges.
 */
export function detectBrowserRuntimeCapability(): BrowserRuntimeCapability {
  if (typeof window === 'undefined') {
    return {
      nativeAvailable: false,
      embeddedAvailable: true,
      runtimeType: 'WEB_EMBEDDED',
      platform: 'web',
      hasMultiSurface: false,
      canBypassIframeSandbox: false,
    };
  }

  const win = window as any;

  // 1. Tauri 2.x / 1.x detection
  const isTauri = Boolean(win.__TAURI__ || win.__TAURI_INTERNALS__);
  if (isTauri) {
    const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
    const isLinux = typeof navigator !== 'undefined' && navigator.userAgent.includes('Linux');
    return {
      nativeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'TAURI',
      platform: isMac ? 'macos' : isLinux ? 'linux' : 'windows',
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
    };
  }

  // 2. Electron detection
  const isElectron = Boolean(
    win.electronAPI ||
    win.electron ||
    (typeof process !== 'undefined' && (process as any).versions?.electron)
  );
  if (isElectron) {
    const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
    const isLinux = typeof navigator !== 'undefined' && navigator.userAgent.includes('Linux');
    return {
      nativeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'ELECTRON',
      platform: isMac ? 'macos' : isLinux ? 'linux' : 'windows',
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
    };
  }

  // 3. Microsoft WebView2 host detection
  const isWebView2 = Boolean(win.chrome?.webview);
  if (isWebView2) {
    return {
      nativeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'WEBVIEW2',
      platform: 'windows',
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
    };
  }

  // 4. Default web environment (Cloudflare Workers / Vite SPA)
  return {
    nativeAvailable: false,
    embeddedAvailable: true,
    runtimeType: 'WEB_EMBEDDED',
    platform: 'web',
    hasMultiSurface: false,
    canBypassIframeSandbox: false,
  };
}

export const browserRuntimeCapability: BrowserRuntimeCapability = detectBrowserRuntimeCapability();

export function isNativeRuntimeAvailable(): boolean {
  return detectBrowserRuntimeCapability().nativeAvailable;
}
