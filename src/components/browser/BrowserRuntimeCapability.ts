/**
 * ORION-9 BROWSER RUNTIME CAPABILITY
 * 
 * Provides honest runtime environment detection to distinguish between:
 * 1. NATIVE_BROWSER / NATIVE_WEBVIEW: Packaged desktop application (Tauri 2.x, Electron, or WebView2)
 *    which hosts real native child webviews with direct OS networking and zero iframe embedding restrictions.
 * 2. WEB_EMBEDDED: Standard web browser SPA (Chrome / Brave / Firefox / Safari)
 *    operating in a sandboxed iframe context as an honest compatibility viewer.
 * 
 * ABSOLUTE RULE: Never determine native mode merely because a stale __TAURI__ object exists.
 * Native capability detection must verify that the native command bridge is actually callable.
 * If native verification fails, fall back to WEB_EMBEDDED and expose the failure internally for diagnostics.
 */

export type BrowserRuntimeMode =
  | 'WEB_EMBEDDED'
  | 'NATIVE_WEBVIEW';

export type BrowserRuntimeEnvironmentType = 'TAURI' | 'ELECTRON' | 'WEBVIEW2' | 'WEB_EMBEDDED';

export interface BrowserRuntimeCapability {
  /** Canonical runtime mode: WEB_EMBEDDED for browser environments, NATIVE_WEBVIEW for desktop */
  mode: BrowserRuntimeMode;
  /** Whether a real native WebView host runtime is active and usable */
  nativeAvailable: boolean;
  /** Whether the embedded iframe compatibility viewer is available */
  iframeAvailable: boolean;
  /** Backward-compatible alias for iframeAvailable */
  embeddedAvailable: boolean;
  /** Specific host runtime identifier */
  runtimeType: BrowserRuntimeEnvironmentType;
  /** Platform identifier */
  platform: 'windows' | 'macos' | 'linux' | 'web';
  /** Supports multiple persistent native webview surfaces per tab */
  hasMultiSurface: boolean;
  /** Unrestricted web navigation without X-Frame-Options or CSP iframe limits */
  canBypassIframeSandbox: boolean;
  /** Whether the native command bridge has been authoritatively verified via IPC handshake */
  verifiedNative: boolean;
  /** Internal diagnostic details if verification failed */
  lastVerificationError?: string;
}

let cachedAuthoritativeCapability: BrowserRuntimeCapability | null = null;

/**
 * Synchronously evaluates the execution environment for native desktop WebView bridges.
 */
export function detectBrowserRuntimeCapability(): BrowserRuntimeCapability {
  if (cachedAuthoritativeCapability) {
    return cachedAuthoritativeCapability;
  }

  if (typeof window === 'undefined') {
    return {
      mode: 'WEB_EMBEDDED',
      nativeAvailable: false,
      iframeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'WEB_EMBEDDED',
      platform: 'web',
      hasMultiSurface: false,
      canBypassIframeSandbox: false,
      verifiedNative: false,
    };
  }

  const win = window as any;

  // 1. Tauri 2.x detection requiring callable invoke function
  const hasCallableTauriInvoke = Boolean(
    (win.__TAURI__?.core?.invoke && typeof win.__TAURI__.core.invoke === 'function') ||
    (win.__TAURI__?.invoke && typeof win.__TAURI__.invoke === 'function') ||
    (win.__TAURI_INTERNALS__?.invoke && typeof win.__TAURI_INTERNALS__.invoke === 'function')
  );

  const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
  const isLinux = typeof navigator !== 'undefined' && navigator.userAgent.includes('Linux');
  const platform = isMac ? 'macos' : isLinux ? 'linux' : 'windows';

  if (hasCallableTauriInvoke) {
    return {
      mode: 'NATIVE_WEBVIEW',
      nativeAvailable: true,
      iframeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'TAURI',
      platform,
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
      verifiedNative: false, // Pending authoritative IPC verification
    };
  }

  // 2. Electron detection
  const isElectron = Boolean(
    win.electronAPI ||
    win.electron ||
    (typeof process !== 'undefined' && (process as any).versions?.electron)
  );
  if (isElectron) {
    return {
      mode: 'NATIVE_WEBVIEW',
      nativeAvailable: true,
      iframeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'ELECTRON',
      platform,
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
      verifiedNative: false,
    };
  }

  // 3. Microsoft WebView2 host detection
  const isWebView2 = Boolean(win.chrome?.webview && typeof win.chrome.webview.postMessage === 'function');
  if (isWebView2) {
    return {
      mode: 'NATIVE_WEBVIEW',
      nativeAvailable: true,
      iframeAvailable: true,
      embeddedAvailable: true,
      runtimeType: 'WEBVIEW2',
      platform: 'windows',
      hasMultiSurface: true,
      canBypassIframeSandbox: true,
      verifiedNative: false,
    };
  }

  // 4. Default web environment (Chrome / Brave / Firefox / Safari)
  return {
    mode: 'WEB_EMBEDDED',
    nativeAvailable: false,
    iframeAvailable: true,
    embeddedAvailable: true,
    runtimeType: 'WEB_EMBEDDED',
    platform: 'web',
    hasMultiSurface: false,
    canBypassIframeSandbox: false,
    verifiedNative: false,
  };
}

export const browserRuntimeCapability: BrowserRuntimeCapability = detectBrowserRuntimeCapability();

export function isNativeRuntimeAvailable(): boolean {
  return detectBrowserRuntimeCapability().nativeAvailable;
}

/**
 * Authoritatively verifies whether native Tauri desktop IPC handshake succeeds.
 * If verification fails, safely falls back to WEB_EMBEDDED and captures diagnostic error.
 */
export async function verifyNativeRuntimeUsable(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  const win = window as any;
  const invoke = win.__TAURI__?.core?.invoke || win.__TAURI__?.invoke || win.__TAURI_INTERNALS__?.invoke;
  if (typeof invoke !== 'function') return false;
  try {
    const caps = await invoke('browser_runtime_capabilities');
    return Boolean(caps?.native_available);
  } catch (err: any) {
    return false;
  }
}

/**
 * Resolves canonical authoritative capability after real IPC verification.
 */
export async function resolveAuthoritativeCapability(): Promise<BrowserRuntimeCapability> {
  const syncCap = detectBrowserRuntimeCapability();
  if (!syncCap.nativeAvailable) {
    cachedAuthoritativeCapability = {
      ...syncCap,
      mode: 'WEB_EMBEDDED',
      nativeAvailable: false,
      verifiedNative: false,
    };
    return cachedAuthoritativeCapability;
  }

  try {
    const isUsable = await verifyNativeRuntimeUsable();
    if (isUsable) {
      cachedAuthoritativeCapability = {
        ...syncCap,
        mode: 'NATIVE_WEBVIEW',
        nativeAvailable: true,
        verifiedNative: true,
      };
    } else {
      cachedAuthoritativeCapability = {
        ...syncCap,
        mode: 'WEB_EMBEDDED',
        nativeAvailable: false,
        verifiedNative: false,
        lastVerificationError: 'Native IPC handshake returned invalid or unavailable capability',
      };
    }
  } catch (err: any) {
    cachedAuthoritativeCapability = {
      ...syncCap,
      mode: 'WEB_EMBEDDED',
      nativeAvailable: false,
      verifiedNative: false,
      lastVerificationError: err?.message || 'Native IPC handshake threw exception',
    };
  }

  return cachedAuthoritativeCapability;
}

/**
 * Reset cached capability (useful for tests).
 */
export function resetAuthoritativeCapabilityCache(): void {
  cachedAuthoritativeCapability = null;
}
