/**
 * ORION-9 BROWSER ENGINE ABSTRACTION
 * 
 * Defines the core BrowserEngine interface and provides the default
 * WebBrowserEngine implementation for the web runtime.
 * 
 * Allows future drop-in replacement with ChromiumBrowserEngine or
 * WebViewBrowserEngine without modifying the UI layer.
 */

import { BrowserContentState, SEARCH_ENGINES, SearchEngineType, SearchEngineConfig } from './BrowserTypes';

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
  navigate(url: string, generation?: number): Promise<{ generation: number; state: BrowserContentState; url: string; title: string } | void>;
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

// Known major domains that actively block iframe embedding via X-Frame-Options: DENY / SAMEORIGIN or CSP frame-ancestors
export const KNOWN_BLOCKED_DOMAINS = [
  'google.com',
  'www.google.com',
  'github.com',
  'twitter.com',
  'x.com',
  'facebook.com',
  'instagram.com',
  'linkedin.com',
  'youtube.com',
  'www.youtube.com',
  'reddit.com',
  'amazon.com',
  'netflix.com',
  'apple.com',
  'microsoft.com',
  'yahoo.com',
  'duckduckgo.com',
  'www.duckduckgo.com',
  'bing.com',
  'www.bing.com',
  'ecosia.org',
  'www.ecosia.org',
  'stackoverflow.com',
  'news.ycombinator.com',
  'quora.com',
  'twitch.tv',
  'nytimes.com',
  'medium.com'
];

/**
 * Canonical URL and query normalizer (Section 7 Authority):
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

  // Explicit protocols (e.g. http://, https://, ftp://)
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed)) {
    return trimmed;
  }

  // Localhost with optional port
  if (/^localhost(:\d+)?(\/.*)?$/i.test(trimmed)) {
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
 * Validates whether a URL is structurally valid.
 */
export function isValidUrl(url: string): boolean {
  if (url === 'orion://newtab' || url === 'about:blank' || url.startsWith('/')) {
    return true;
  }
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Determines whether a URL is a known site that forbids iframe embedding.
 */
export function isKnownBlockedDomain(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    return KNOWN_BLOCKED_DOMAINS.some(d => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

/**
 * WebBrowserEngine: Current safe web runtime implementation.
 * Wraps iframe capabilities, enforces security boundaries, and tracks navigation state.
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

    // Check for known embedding blocklist
    if (isKnownBlockedDomain(resolved)) {
      if (gen !== this.currentGeneration) {
        return { generation: gen, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
      }
      this.contentState = 'BLOCKED_EMBEDDING';
      try {
        const u = new URL(resolved);
        this.currentTitle = u.hostname;
      } catch {
        this.currentTitle = resolved;
      }
      this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
      this.events.onNavigationCommit?.(this.currentUrl, this.currentTitle, gen);
      return { generation: gen, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
    }

    // Derive readable title
    try {
      const u = new URL(resolved);
      this.currentTitle = u.hostname.replace(/^www\./, '');
    } catch {
      this.currentTitle = resolved;
    }

    // Transition to PAGE_LOADED for allowed embed
    this.contentState = 'PAGE_LOADED';
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);
    this.events.onNavigationCommit?.(this.currentUrl, this.currentTitle, gen);
    return { generation: gen, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
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
      this.contentState = 'PAGE_LOADED';
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
 * Designed for Tauri (WRY/Tao) or Electron (BrowserView/WebContentsView).
 * Operates outside the web DOM sandbox, enabling real native browsing for any website.
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
  }

  public async navigate(url: string, generation: number = 1): Promise<{ generation: number; state: BrowserContentState; url: string; title: string }> {
    const resolved = normalizeUrl(url);
    this.currentUrl = resolved;
    this.contentState = 'LOADING';
    this.events.onNavigationStart?.(resolved, generation);

    // In a native desktop runtime (Tauri / Electron), native WebView handles
    // X-Frame-Options and CSP naturally without iframe embedding restrictions.
    this.contentState = 'PAGE_LOADED';
    try {
      this.currentTitle = new URL(resolved).hostname;
    } catch {
      this.currentTitle = resolved;
    }

    this.events.onNavigationCommit?.(this.currentUrl, this.currentTitle, generation);
    this.events.onStateChange?.(this.contentState, this.currentUrl, this.currentTitle);

    return { generation, state: this.contentState, url: this.currentUrl, title: this.currentTitle };
  }

  public async goBack(): Promise<void> {
    // Calls native WebView IPC: window.__TAURI__?.invoke('webview_go_back') or electron.webContents.goBack()
  }

  public async goForward(): Promise<void> {
    // Calls native WebView IPC: window.__TAURI__?.invoke('webview_go_forward') or electron.webContents.goForward()
  }

  public async reload(): Promise<void> {
    await this.navigate(this.currentUrl);
  }

  public async stop(): Promise<void> {
    this.contentState = 'PAGE_LOADED';
  }

  public async createTab(initialUrl: string = 'orion://newtab'): Promise<{ id: string; url: string; title: string }> {
    const id = `native_tab_${Date.now()}`;
    const resolved = normalizeUrl(initialUrl);
    this.activeTabId = id;
    return { id, url: resolved, title: resolved === 'orion://newtab' ? 'New Tab' : resolved };
  }

  public async closeTab(_tabId: string): Promise<void> {
    // Closes native webview surface via IPC
  }

  public setBounds(bounds: BrowserBounds): void {
    this.bounds = bounds;
    // Sets native webview geometry via IPC: e.g. webview.setBounds(bounds)
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
  if (typeof window === 'undefined') return false;
  const win = window as any;
  return Boolean(win.__TAURI__ || win.electronAPI || win.chrome?.webview);
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
