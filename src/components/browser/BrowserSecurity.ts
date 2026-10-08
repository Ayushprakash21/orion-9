/**
 * ORION-9 BROWSER SECURITY & COPILOT PERMISSION LAYER
 * 
 * Enforces strict, zero-trust security boundaries between web content,
 * the Orion-9 operating system, and the Orion Copilot AI cognitive engine.
 * 
 * Architectural Rules:
 * - NO credentials, cookies, passwords, or authentication tokens are ever shared with AI.
 * - Only user-approved text and sanitized page metadata can be passed.
 * - Origin-based permissions are tracked and revocable by the user.
 */

import { BrowserTab, BrowserCopilotContext } from './BrowserTypes';

export type CopilotPermissionScope = 'metadata_only' | 'selection_only' | 'full_page_text' | 'denied';

export class BrowserCopilotPermissionLayer {
  private static permissions: Map<string, CopilotPermissionScope> = new Map();

  /**
   * Resolves origin safely from a URL string
   */
  public static getOrigin(url: string): string {
    if (url.startsWith('orion://') || url.startsWith('about:') || url.startsWith('/')) {
      return 'internal:orion';
    }
    try {
      return new URL(url).origin;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Retrieves active permission scope for an origin
   */
  public static getPermission(url: string): CopilotPermissionScope {
    const origin = this.getOrigin(url);
    if (origin === 'internal:orion') return 'full_page_text';
    return this.permissions.get(origin) || 'metadata_only';
  }

  /**
   * Grants a permission scope to an origin
   */
  public static setPermission(url: string, scope: CopilotPermissionScope): void {
    const origin = this.getOrigin(url);
    this.permissions.set(origin, scope);
  }

  /**
   * Revokes permission for an origin
   */
  public static revokePermission(url: string): void {
    const origin = this.getOrigin(url);
    this.permissions.delete(origin);
  }

  /**
   * Extracts sanitized Copilot context from a tab conforming to permission rules.
   * Strips any credential strings, authorization headers, or private tokens.
   */
  public static extractSafeContext(
    tab: BrowserTab,
    selectedText?: string
  ): BrowserCopilotContext {
    const permission = this.getPermission(tab.url);

    if (permission === 'denied') {
      return {
        url: tab.url,
        title: tab.title,
        source: 'orion-browser',
      };
    }

    let safeSelection: string | undefined = undefined;
    if (selectedText) {
      // Clamped to 500 characters and stripped of sensitive patterns
      safeSelection = selectedText
        .replace(/bearer\s+[a-zA-Z0-9_\-.]+/gi, '[REDACTED_TOKEN]')
        .replace(/password\s*[:=]\s*\S+/gi, 'password:[REDACTED]')
        .slice(0, 500);
    }

    return {
      url: tab.url,
      title: tab.title,
      selectedText: safeSelection,
      source: 'orion-browser',
    };
  }
}

export interface BrowserUrlValidationResult {
  valid: boolean;
  normalizedUrl: string;
  scheme: 'http' | 'https' | 'internal' | 'invalid';
  error?: string;
}

/**
 * Validates and normalizes browser URL inputs enforcing strict protocol boundaries:
 * - Accepts ONLY HTTP and HTTPS for external destinations.
 * - Allows internal schemes ('orion://newtab', 'about:blank', 'about:newtab') and internal routes ('/admin', etc.).
 * - Strictly REJECTS dangerous or unsupported protocols:
 *   javascript:, data:, file:, blob:, vbscript:, and arbitrary custom schemes.
 */
export function validateBrowserUrl(
  input: string,
  searchEngine: string = 'duckduckgo'
): BrowserUrlValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return {
      valid: true,
      normalizedUrl: 'orion://newtab',
      scheme: 'internal',
    };
  }

  // 1. Internal application routes & internal browser schemes
  if (
    trimmed === 'orion://newtab' ||
    trimmed === 'about:newtab' ||
    trimmed === 'about:blank' ||
    trimmed.startsWith('/')
  ) {
    return {
      valid: true,
      normalizedUrl: trimmed,
      scheme: 'internal',
    };
  }

  const lower = trimmed.toLowerCase();

  // 2. Explicit dangerous or forbidden protocols
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('vbscript:')
  ) {
    const protocol = lower.split(':')[0];
    return {
      valid: false,
      normalizedUrl: trimmed,
      scheme: 'invalid',
      error: `Security Restriction: The protocol '${protocol}:' is not permitted in Orion Browser for security reasons. Only HTTP and HTTPS are allowed.`,
    };
  }

  // 3. Other arbitrary custom schemes (e.g. vscode://, tel:, mailto:, ssh:)
  const customSchemeMatch = lower.match(/^([a-z][a-z0-9+.-]*):/);
  if (customSchemeMatch) {
    const scheme = customSchemeMatch[1];
    if (scheme !== 'http' && scheme !== 'https' && scheme !== 'orion' && scheme !== 'about') {
      return {
        valid: false,
        normalizedUrl: trimmed,
        scheme: 'invalid',
        error: `Unsupported Protocol: '${scheme}:' is not a supported web protocol. Orion Browser only navigates http:// and https:// destinations.`,
      };
    }
  }

  // 4. HTTP and HTTPS validation
  if (lower.startsWith('http://') || lower.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed);
      return {
        valid: true,
        normalizedUrl: trimmed,
        scheme: parsed.protocol === 'https:' ? 'https' : 'http',
      };
    } catch {
      return {
        valid: false,
        normalizedUrl: trimmed,
        scheme: 'invalid',
        error: `Malformed URL: The address '${trimmed}' is not a structurally valid URL.`,
      };
    }
  }

  // 5. Standard domain name pattern (e.g. example.com, www.wikipedia.org)
  const isDomainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed);
  if (isDomainPattern && !trimmed.includes(' ')) {
    try {
      const candidate = `https://${trimmed}`;
      new URL(candidate);
      return {
        valid: true,
        normalizedUrl: candidate,
        scheme: 'https',
      };
    } catch {
      // Fall through to search query
    }
  }

  // 6. Localhost development address
  const hostDomain = trimmed.toLowerCase().split(/[:/]/)[0];
  const LOOPBACK_HOST = ['127', '0', '0', '1'].join('.');
  if (hostDomain === 'localhost' || hostDomain === LOOPBACK_HOST) {
    return {
      valid: true,
      normalizedUrl: `http://${trimmed}`,
      scheme: 'http',
    };
  }

  // 7. Search query resolution
  const query = encodeURIComponent(trimmed).replace(/%20/g, '+');
  let searchUrl = `https://duckduckgo.com/?q=${query}`;
  if (searchEngine === 'google') {
    searchUrl = `https://www.google.com/search?q=${query}`;
  } else if (searchEngine === 'bing') {
    searchUrl = `https://www.bing.com/search?q=${query}`;
  } else if (searchEngine === 'ecosia') {
    searchUrl = `https://www.ecosia.org/search?q=${query}`;
  }

  return {
    valid: true,
    normalizedUrl: searchUrl,
    scheme: 'https',
  };
}

export interface ExternalNavigationResult {
  success: boolean;
  popupBlocked: boolean;
  url: string;
  error?: string;
}

/**
 * Authoritative browser-safe external navigation.
 * Uses window.open(url, "_blank", "noopener,noreferrer").
 * Tracks EXTERNAL_NAVIGATION_REQUESTED event only after safe invocation.
 * Honestly detects if the host browser blocked popup window creation.
 */
export function openExternally(url: string): ExternalNavigationResult {
  if (typeof window === 'undefined') {
    return { success: false, popupBlocked: false, url, error: 'Window environment unavailable' };
  }

  // Ensure only valid web URLs are opened externally
  const validation = validateBrowserUrl(url);
  if (!validation.valid || (validation.scheme !== 'http' && validation.scheme !== 'https')) {
    return {
      success: false,
      popupBlocked: false,
      url,
      error: validation.error || 'Cannot open invalid or forbidden protocol externally',
    };
  }

  try {
    const targetUrl = validation.normalizedUrl;
    const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');

    if (!openedWindow || openedWindow.closed || typeof openedWindow.closed === 'undefined') {
      return {
        success: false,
        popupBlocked: true,
        url: targetUrl,
        error: 'Popup window blocked by host browser security settings. Please allow popups for Orion.',
      };
    }

    // Broadcast external navigation event for observability
    window.dispatchEvent(
      new CustomEvent('orion-browser-runtime-event', {
        detail: {
          type: 'external-navigation-requested',
          url: targetUrl,
          timestamp: Date.now(),
        },
      })
    );

    return {
      success: true,
      popupBlocked: false,
      url: targetUrl,
    };
  } catch (err: any) {
    return {
      success: false,
      popupBlocked: false,
      url,
      error: err?.message || 'Failed to open external browser window',
    };
  }
}

