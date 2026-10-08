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

export interface BrowserEngine {
  navigate(url: string, generation?: number): Promise<{ generation: number; state: BrowserContentState; url: string; title: string } | void>;
  goBack(): Promise<void>;
  goForward(): Promise<void>;
  reload(): Promise<void>;
  stop(): Promise<void>;
  getCurrentUrl(): string;
  getTitle(): string;
  getContentState(): BrowserContentState;
  getSecurityStatus(): 'secure' | 'insecure' | 'internal';
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

  public dispose(): void {
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
