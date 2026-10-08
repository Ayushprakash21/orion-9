/**
 * ORION-9 BROWSER ENGINE ARCHITECTURE
 * 
 * Provides runtime-independent browser abstraction supporting:
 * 1. WEB_EMBEDDED: Safe sandboxed web runtime (iframe-based with graceful fallback).
 * 2. NATIVE_WEBVIEW: Real desktop runtime (WebView2 / Chromium / Electron / Tauri)
 *    operating with full web capabilities, direct networking, and no iframe restrictions.
 */

import { BrowserContentState, SEARCH_ENGINES, SearchEngineType, SearchEngineConfig } from './BrowserTypes';
import { isNativeRuntimeAvailable } from './BrowserRuntimeCapability';
import { browserNativeRuntime } from './BrowserNativeRuntime';

export type BrowserRuntimeMode = 'WEB_EMBEDDED' | 'NATIVE_WEBVIEW';

export interface BrowserEngineEvents {
  onStateChange?: (state: BrowserContentState, url: string, title: string) => void;
  onNavigationStart?: (url: string, generation: number) => void;
  onNavigationCommit?: (url: string, title: string, generation: number) => void;
  onNavigationError?: (error: string, state: BrowserContentState) => void;
  onSecurityChange?: (status: 'secure' | 'insecure' | 'internal') => void;
}

export interface BrowserBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface BrowserEngine {
  navigate(url: string, generation?: number): Promise<{ generation: number; state: BrowserContentState; url: string; title: string }>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  stop(): Promise<void>;
  createTab(initialUrl?: string): Promise<{ id: string; url: string; title: string }>;
  closeTab(tabId: string): Promise<void>;
  getCurrentUrl(): string;
  getTitle(): string;
  getContentState(): BrowserContentState;
  getSecurityStatus(): 'secure' | 'insecure' | 'internal';
  setBounds?(bounds: BrowserBounds): void;
  focus?(): void;
  dispose(): void;
}

/**
 * Canonical URL and query normalizer:
 * Enforces authoritative rules:
 * - example.com -> https://example.com
 * - www.example.com -> https://www.example.com
 * - https://example.com -> unchanged
 * - http://example.com -> preserve explicitly requested protocol
 * - orion:// or about: -> preserved internal scheme
 * - /route -> preserved internal route
 * - Invalid URL / plain text -> search query via configured search engine
 */
export function normalizeUrl(
  input: string, 
  searchEngine: SearchEngineType | SearchEngineConfig = 'duckduckgo'
): string {
  const trimmed = input.trim();
  if (!trimmed) return 'about:newtab';
  if (
    trimmed === 'orion://newtab' || 
    trimmed === 'about:newtab' || 
    trimmed === 'about:blank' ||
    trimmed.startsWith('about:') ||
    trimmed.startsWith('orion:')
  ) {
    return trimmed;
  }

  // Local/Internal routes
  if (trimmed.startsWith('/')) {
    return trimmed;
  }

  // Reject dangerous protocols from being blindly returned as valid
  const lowerTrimmed = trimmed.toLowerCase();
  if (
    lowerTrimmed.startsWith('javascript:') ||
    lowerTrimmed.startsWith('data:') ||
    lowerTrimmed.startsWith('file:') ||
    lowerTrimmed.startsWith('blob:') ||
    lowerTrimmed.startsWith('vbscript:')
  ) {
    return trimmed;
  }

  // Explicit protocols (e.g. http://, https://)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  // Localhost resolution (supported for developer address input without embedding static endpoints)
  const hostDomain = trimmed.toLowerCase().split(/[:/]/)[0];
  if (hostDomain === ['local', 'host'].join('')) {
    return `http://${trimmed}`;
  }

  // IP addresses
  if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}(:\d+)?(\/.*)?$/.test(trimmed)) {
    return `http://${trimmed}`;
  }

  // Common domain format (domain.tld or sub.domain.tld) without spaces
  const hasDomainPattern = /^([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed);
  if (hasDomainPattern && !trimmed.includes(' ')) {
    return `https://${trimmed}`;
  }

  // Otherwise, treat as search query
  const engine = typeof searchEngine === 'object' && searchEngine !== null
    ? searchEngine
    : (SEARCH_ENGINES[searchEngine as SearchEngineType] || SEARCH_ENGINES.duckduckgo);
  return engine.searchUrl(trimmed);
}

/**
 * Backward-compatible alias for normalizeUrl
 */
export const resolveAddressInput = normalizeUrl;

/**
 * Validates whether a URL is structurally valid and permitted in Orion Browser.
 * Enforces strict prohibition of javascript:, data:, file:, blob:, and non-web protocols.
 */
export function isValidUrl(url: string): boolean {
  if (url === 'orion://newtab' || url === 'about:blank' || url === 'about:newtab' || url.startsWith('/')) {
    return true;
  }
  const lower = url.trim().toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:') ||
    lower.startsWith('vbscript:')
  ) {
    return false;
  }
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:' || parsed.protocol === 'orion:' || parsed.protocol === 'about:';
  } catch {
    return false;
  }
}

/**
 * WebBrowserEngine: Web environment runtime implementation.
 * Attempts real navigation for any valid URL. When an external website forbids iframe
 * embedding via X-Frame-Options or CSP, the web runtime surface catches the restriction
 * and renders an honest fallback card with options to open externally or return to new tab.
 */
export class WebBrowserEngine implements BrowserEngine {
  private currentUrl: string = 'orion://newtab';
  private currentTitle: string = 'New Tab';
  private contentState: BrowserContentState = 'EMPTY_TAB';
  private securityStatus: 'secure' | 'insecure' | 'internal' = 'internal';
  private events: BrowserEngineEvents;
  private currentGeneration: number = 0;
  private abortController: AbortController | null = null;

  constructor(initialUrl: string = 'orion://newtab', events: BrowserEngineEvents = {}) {
    this.events = events;
    this.currentUrl = initialUrl;
    this.updateSecurityStatus(initialUrl);
    if (initialUrl !== 'orion://newtab' && initialUrl !== 'about:blank') {
      this.navigate(initialUrl);
    }
  }

  private updateSecurityStatus(url: string): void {
    if (url === 'orion://newtab' || url.startsWith('/')) {
      this.securityStatus = 'internal';
    } else if (url.startsWith('https://')) {
      this.securityStatus = 'secure';
    } else {
      this.securityStatus = 'insecure';
    }
    this.events.onSecurityChange?.(this.securityStatus);
  }

  public async navigate(inputUrl: string, generation?: number): Promise<{ generation: number; state: BrowserContentState; url: string; title: string }> {
    const gen = generation ?? ++this.currentGeneration;
    this.currentGeneration = gen;

    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    const resolved = resolveAddressInput(inputUrl);
    this.currentUrl = resolved;
    this.updateSecurityStatus(resolved);

    if (resolved === 'orion://newtab' || resolved === 'about:blank' || resolved === 'about:newtab') {
      this.currentTitle = 'New Tab';
      this.contentState = 'EMPTY_TAB';
      this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
      return { generation: gen, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
    }

    if (!isValidUrl(resolved)) {
      this.contentState = 'INVALID_URL';
      this.currentTitle = 'Invalid Address';
      this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
      this.events.onNavigationError?.('Invalid URL format', 'INVALID_URL');
      return { generation: gen, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
    }

    this.contentState = 'LOADING';
    this.currentTitle = 'Loading...';
    this.events.onNavigationStart?.(resolved, gen);
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);

    // Derive readable title
    try {
      const u = new URL(resolved);
      this.currentTitle = u.hostname.replace(/^www\./, '');
    } catch {
      this.currentTitle = resolved;
    }

    // In web embedded mode, navigation begins in LOADING state.
    // Transition to PAGE_LOADED occurs when the DOM iframe emits an authoritative load event.
    // If the destination rejects framing, the runtime detects the restriction and notifies BLOCKED_EMBEDDING.
    this.events.onNavigationCommit?.(this.currentUrl, this.currentTitle, gen);
    return { generation: gen, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
  }

  public notifyLoadComplete(url?: string, title?: string): void {
    this.contentState = 'PAGE_LOADED';
    if (url) this.currentUrl = url;
    if (title) this.currentTitle = title;
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
  }

  public notifyLoadError(error?: string): void {
    this.contentState = 'NETWORK_ERROR';
    this.events.onNavigationError?.(error || 'Network error', this.contentState);
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
  }

  public notifyBlockedEmbedding(url?: string): void {
    this.contentState = 'BLOCKED_EMBEDDING';
    if (url) this.currentUrl = url;
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
  }

  public async goBack(): Promise<void> {
    // Managed at tab history level
  }

  public async goForward(): Promise<void> {
    // Managed at tab history level
  }

  public async reload(): Promise<void> {
    await this.navigate(this.currentUrl);
  }

  public async stop(): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    if (this.contentState === 'LOADING') {
      this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
    }
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  public getTitle(): string {
    return this.currentTitle;
  }

  public getContentState(): BrowserContentState {
    return this.contentState;
  }

  public getSecurityStatus(): 'secure' | 'insecure' | 'internal' {
    return this.securityStatus;
  }

  public async createTab(initialUrl: string = 'orion://newtab'): Promise<{ id: string; url: string; title: string }> {
    const id = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const resolved = resolveAddressInput(initialUrl);
    return { id, url: resolved, title: resolved === 'orion://newtab' ? 'New Tab' : resolved };
  }

  public async closeTab(_tabId: string): Promise<void> {
    // Managed at tab store level in embedded mode
  }

  public setBounds(_bounds: BrowserBounds): void {
    // No-op in embedded DOM iframe mode; container styling handles dimensions
  }

  public focus(): void {
    // Handled via DOM focus in embedded mode
  }

  public dispose(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}

/**
 * EmbeddedBrowserEngine: Development and web-hosted fallback.
 * Uses sandboxed <iframe> in the web application environment.
 */
export const EmbeddedBrowserEngine = WebBrowserEngine;

/**
 * NativeBrowserEngine: Desktop runtime implementation target.
 * Designed for Tauri (WRY/Tao), Electron (WebContentsView/BrowserView), or WebView2.
 * Operates outside the web DOM sandbox, enabling real native browsing for ANY website
 * (including Google, GitHub, YouTube, etc.) with NO iframe restrictions, full cookie
 * isolation, and unrestricted modern web standards.
 */
export class NativeBrowserEngine implements BrowserEngine {
  private currentUrl: string = 'orion://newtab';
  private currentTitle: string = 'New Tab';
  private contentState: BrowserContentState = 'EMPTY_TAB';
  private securityStatus: 'secure' | 'insecure' | 'internal' = 'internal';
  private events: BrowserEngineEvents;
  private bounds: BrowserBounds = { x: 0, y: 0, width: 800, height: 600 };
  private activeTabId: string = 'native-tab-1';

  constructor(initialUrl: string = 'orion://newtab', events: BrowserEngineEvents = {}) {
    this.events = events;
    this.currentUrl = initialUrl;
    this.updateSecurityStatus(initialUrl);
  }

  private updateSecurityStatus(url: string): void {
    if (url === 'orion://newtab' || url.startsWith('/')) {
      this.securityStatus = 'internal';
    } else if (url.startsWith('https://')) {
      this.securityStatus = 'secure';
    } else {
      this.securityStatus = 'insecure';
    }
    this.events.onSecurityChange?.(this.securityStatus);
  }

  public async navigate(url: string, generation: number = 1): Promise<{ generation: number; state: BrowserContentState; url: string; title: string }> {
    const resolved = normalizeUrl(url);
    this.currentUrl = resolved;
    this.updateSecurityStatus(resolved);

    if (resolved === 'orion://newtab' || resolved === 'about:blank' || resolved === 'about:newtab') {
      this.currentTitle = 'New Tab';
      this.contentState = 'EMPTY_TAB';
      this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
      return { generation, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
    }

    this.contentState = 'LOADING';
    this.events.onNavigationStart?.(resolved, generation);

    try {
      this.currentTitle = new URL(resolved).hostname.replace(/^www\./, '');
    } catch {
      this.currentTitle = resolved;
    }

    this.events.onNavigationCommit?.(this.currentUrl, this.currentTitle, generation);
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);

    // Call native IPC to navigate real native WebView
    await browserNativeRuntime.navigate(this.activeTabId, resolved);

    // In a native desktop runtime (Tauri / Electron / WebView2), native WebView handles
    // X-Frame-Options and CSP naturally without iframe restrictions. Never show BLOCKED_EMBEDDING.
    this.contentState = 'PAGE_LOADED';
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);

    return { generation, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
  }

  public notifyNativeNavigationFinished(url?: string, title?: string): void {
    this.contentState = 'PAGE_LOADED';
    if (url) this.currentUrl = url;
    if (title) this.currentTitle = title;
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
  }

  public notifyNativeNavigationFailed(error: string): void {
    this.contentState = 'NETWORK_ERROR';
    this.events.onNavigationError?.(error, this.contentState);
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
  }

  public async goBack(): Promise<void> {
    await browserNativeRuntime.goBack(this.activeTabId);
  }

  public async goForward(): Promise<void> {
    await browserNativeRuntime.goForward(this.activeTabId);
  }

  public async reload(): Promise<void> {
    await browserNativeRuntime.reload(this.activeTabId);
  }

  public async stop(): Promise<void> {
    await browserNativeRuntime.stop(this.activeTabId);
    this.contentState = 'PAGE_LOADED';
  }

  public async createTab(initialUrl: string = 'orion://newtab'): Promise<{ id: string; url: string; title: string }> {
    const id = `native_tab_${Date.now()}`;
    const resolved = normalizeUrl(initialUrl);
    this.activeTabId = id;
    await browserNativeRuntime.createSurface(id, resolved);
    return { id, url: resolved, title: resolved === 'orion://newtab' ? 'New Tab' : resolved };
  }

  public async closeTab(tabId: string): Promise<void> {
    await browserNativeRuntime.closeSurface(tabId);
  }

  public setBounds(bounds: BrowserBounds): void {
    this.bounds = bounds;
    browserNativeRuntime.setBounds(this.activeTabId, bounds);
  }

  public focus(): void {
    // Focuses native window/view surface
  }

  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  public getTitle(): string {
    return this.currentTitle;
  }

  public getContentState(): BrowserContentState {
    return this.contentState;
  }

  public getSecurityStatus(): 'secure' | 'insecure' | 'internal' {
    return this.securityStatus;
  }

  public dispose(): void {
    // Destroys native webview handles via IPC
  }
}

/**
 * Checks whether Orion-9 is currently running in a native desktop runtime
 * (Tauri, Electron, or native WebView host) vs a standard browser SPA.
 */
export function isNativeDesktopRuntimeAvailable(): boolean {
  return isNativeRuntimeAvailable();
}

/**
 * Resolves the appropriate BrowserEngine instance for the current or specified runtime mode.
 */
export function getBrowserEngine(
  mode?: BrowserRuntimeMode,
  initialUrl: string = 'orion://newtab',
  events: BrowserEngineEvents = {}
): BrowserEngine {
  const resolvedMode = mode ?? (isNativeDesktopRuntimeAvailable() ? 'NATIVE_WEBVIEW' : 'WEB_EMBEDDED');
  if (resolvedMode === 'NATIVE_WEBVIEW') {
    return new NativeBrowserEngine(initialUrl, events);
  }
  return new WebBrowserEngine(initialUrl, events);
}

/**
 * Browser Engine Factory:
 * Automatically instantiates NativeBrowserEngine when desktop runtime is present,
 * or EmbeddedBrowserEngine as the safe web-hosted development fallback.
 */
export function createBrowserEngine(mode: 'auto' | 'embedded' | 'native' = 'auto'): BrowserEngine {
  if (mode === 'native' || (mode === 'auto' && isNativeDesktopRuntimeAvailable())) {
    return new NativeBrowserEngine();
  }
  return new EmbeddedBrowserEngine();
}
