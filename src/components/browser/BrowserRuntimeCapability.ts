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

/**
 * Explicit runtime detection lifecycle state:
 * - 'detecting': Bridge evaluation / IPC verification handshake in flight. Do NOT display permanent fallback.
 * - 'native': Authoritative IPC handshake succeeded. Native child WebViews active.
 * - 'web': Standard browser SPA or verified fallback. Safe web mode active.
 */
export type BrowserCapabilityState = 'detecting' | 'native' | 'web';

export interface BrowserRuntimeCapability {
  /** Explicit capability lifecycle state */
  state: BrowserCapabilityState;
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
      state: 'web',
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
      state: 'detecting',
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
      state: 'detecting',
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
      state: 'detecting',
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
    state: 'web',
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

export function getCachedAuthoritativeCapability(): BrowserRuntimeCapability | null {
  return cachedAuthoritativeCapability;
}

/**
 * Authoritatively verifies whether native desktop IPC handshake succeeds.
 * Distinguishes Case A (web browser), Case B (host present but handshake fails),
 * Case C (IPC command fails), Case E (IPC handshake succeeds).
 */
export async function verifyNativeRuntimeUsable(): Promise<{ ok: boolean; reason?: string }> {
  if (typeof window === 'undefined') {
    return { ok: false, reason: 'Environment is non-browser (SSR/Node)' };
  }
  const win = window as any;

  let invoke = win.__TAURI__?.core?.invoke || win.__TAURI__?.invoke || win.__TAURI_INTERNALS__?.invoke;

  if (typeof invoke !== 'function') {
    try {
      const core = await import('@tauri-apps/api/core');
      if (typeof core.invoke === 'function') {
        invoke = core.invoke;
      }
    } catch {
      // @tauri-apps/api/core not available in standard web runtime
    }
  }

  if (typeof invoke !== 'function') {
    // Check Electron IPC fallback
    if (win.electronAPI?.invoke && typeof win.electronAPI.invoke === 'function') {
      try {
        const caps = await win.electronAPI.invoke('browser_runtime_capabilities');
        const ok = Boolean(caps?.native_available || caps?.nativeAvailable);
        return { ok, reason: ok ? undefined : 'Electron IPC returned non-native capability' };
      } catch (err: any) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[BROWSER:DIAGNOSTIC] Case C: Electron detected but invoke failed:', err);
        }
        return { ok: false, reason: `Electron invoke failed: ${err?.message || err}` };
      }
    }

    if (process.env.NODE_ENV !== 'production') {
      console.log('[BROWSER:DIAGNOSTIC] Case A: Running in ordinary web browser. No desktop IPC bridge available.');
    }
    return { ok: false, reason: 'Case A: No desktop host IPC bridge (window.__TAURI__ or electronAPI)' };
  }

  // Attempt primary Tauri 2 command: browser_runtime_capabilities
  try {
    const caps = await invoke('browser_runtime_capabilities');
    const ok = Boolean(caps?.native_available || caps?.nativeAvailable);
    if (ok) {
      if (process.env.NODE_ENV !== 'production') {
        console.log('[BROWSER:DIAGNOSTIC] Case E: Primary Tauri 2 handshake succeeded via browser_runtime_capabilities.', caps);
      }
      return { ok: true };
    }
    return { ok: false, reason: 'Tauri command browser_runtime_capabilities returned nativeAvailable: false' };
  } catch (err: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[BROWSER:DIAGNOSTIC] Case C: Tauri invoke of browser_runtime_capabilities failed, testing fallback probe:', err);
    }

    // Fallback probe for binaries where browser_runtime_capabilities was not yet compiled into the invoke handler:
    // Probe browser_ensure_surface with an invalid URL scheme.
    // If Rust responds with "NATIVE_INVALID_URL", the native Rust command handler is demonstrably alive and callable.
    try {
      await invoke('browser_ensure_surface', {
        tabId: '__probe__',
        surfaceId: '__probe__',
        initialUrl: 'invalid://scheme',
        bounds: { x: 0, y: 0, width: 1, height: 1 },
      });
      return { ok: true };
    } catch (probeErr: any) {
      const probeMsg = String(probeErr?.message || probeErr);
      if (probeMsg.includes('NATIVE_') || probeMsg.includes('Protocol') || probeMsg.includes('scheme')) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('[BROWSER:DIAGNOSTIC] Case E: Secondary Tauri 2 probe confirmed Rust browser controller is active:', probeMsg);
        }
        return { ok: true };
      }
      return {
        ok: false,
        reason: `Case C: IPC command failed: primary error (${err?.message || err}), probe error (${probeMsg})`,
      };
    }
  }
}

/**
 * Resolves canonical authoritative capability after real IPC verification.
 * The adapter must NEVER be permanently created using a provisional WEB_EMBEDDED capability.
 */
export async function resolveAuthoritativeCapability(): Promise<BrowserRuntimeCapability> {
  if (cachedAuthoritativeCapability?.verifiedNative) {
    return cachedAuthoritativeCapability;
  }

  const syncCap = detectBrowserRuntimeCapability();

  try {
    const { ok: isUsable, reason } = await verifyNativeRuntimeUsable();
    if (isUsable) {
      cachedAuthoritativeCapability = {
        ...syncCap,
        state: 'native',
        mode: 'NATIVE_WEBVIEW',
        nativeAvailable: true,
        verifiedNative: true,
        runtimeType: syncCap.runtimeType === 'WEB_EMBEDDED' ? 'TAURI' : syncCap.runtimeType,
        hasMultiSurface: true,
        canBypassIframeSandbox: true,
      };
      if (process.env.NODE_ENV !== 'production') {
        console.log('[BROWSER:DIAGNOSTIC] Case E: Authoritative native capability resolved successfully.');
      }
      return cachedAuthoritativeCapability;
    } else {
      if (process.env.NODE_ENV !== 'production') {
        if (syncCap.runtimeType === 'WEB_EMBEDDED') {
          console.log('[BROWSER:DIAGNOSTIC] Case A: Ordinary web browser confirmed. Web fallback mode active.');
        } else {
          console.warn('[BROWSER:DIAGNOSTIC] Case B: Host runtime present but IPC handshake failed. Reason:', reason);
        }
      }
      cachedAuthoritativeCapability = {
        ...syncCap,
        state: 'web',
        mode: 'WEB_EMBEDDED',
        nativeAvailable: false,
        verifiedNative: false,
        lastVerificationError: reason || 'Native IPC handshake returned false',
        runtimeType: syncCap.runtimeType === 'TAURI' ? 'WEB_EMBEDDED' : syncCap.runtimeType,
        canBypassIframeSandbox: false,
      };
      return cachedAuthoritativeCapability;
    }
  } catch (err: any) {
    const errMsg = err?.message || 'Native IPC handshake threw unexpected exception';
    if (process.env.NODE_ENV !== 'production') {
      console.error('[BROWSER:DIAGNOSTIC] Case C: Handshake exception:', err);
    }
    cachedAuthoritativeCapability = {
      ...syncCap,
      state: 'web',
      mode: 'WEB_EMBEDDED',
      nativeAvailable: false,
      verifiedNative: false,
      lastVerificationError: errMsg,
      runtimeType: syncCap.runtimeType === 'TAURI' ? 'WEB_EMBEDDED' : syncCap.runtimeType,
      canBypassIframeSandbox: false,
    };
    return cachedAuthoritativeCapability;
  }
}

/**
 * Reset cached capability (useful for tests).
 */
export function resetAuthoritativeCapabilityCache(): void {
  cachedAuthoritativeCapability = null;
}
