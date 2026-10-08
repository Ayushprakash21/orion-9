/**
 * ORION-9 BROWSER DATA TYPES & RUNTIME INTERFACES
 * 
 * First-class OS application types for tabs, navigation history, bookmarks,
 * download foundation, search engines, and security boundaries.
 */

export type BrowserContentState = 
  | 'LOADING'
  | 'PAGE_LOADED'
  | 'BLOCKED_EMBEDDING'
  | 'INVALID_URL'
  | 'NETWORK_ERROR'
  | 'UNSUPPORTED_URL'
  | 'EMPTY_TAB'
  | 'AUTHENTICATION_REQUIRED'
  | 'NATIVE_RUNTIME_ERROR'
  | 'UNKNOWN_ERROR';

/** Explicit Web Mode navigation lifecycle states */
export type WebNavigationState =
  | 'IDLE'
  | 'NAVIGATING'
  | 'LOADED'
  | 'BLOCKED'
  | 'ERROR';

/** Explicit Native Mode WebView surface lifecycle states */
export type NativeSurfaceLifecycleState =
  | 'CREATING'
  | 'READY'
  | 'VISIBLE'
  | 'HIDDEN'
  | 'CLOSING'
  | 'CLOSED'
  | 'ERROR';

export interface BrowserTab {
  id: string;
  title: string;
  url: string;
  favicon?: string;
  loading?: boolean;
  canGoBack?: boolean;
  canGoForward?: boolean;
  historyIndex: number;
  historyStack: string[];
  createdAt: number;
  lastActiveAt?: number;
  loadState?: BrowserContentState;
  contentState?: BrowserContentState;
  webNavigationState?: WebNavigationState;
  nativeLifecycleState?: NativeSurfaceLifecycleState;
  zoomLevel?: number;
  isLoading?: boolean;
  errorDetails?: string;
  generation?: number;
  securityStatus?: 'secure' | 'insecure' | 'internal';
  nativeSurfaceId?: string;
}

export interface BrowserHistoryEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  visitedAt: number;
}

export interface BrowserBookmarkEntry {
  id: string;
  url: string;
  title: string;
  favicon?: string;
  createdAt: number;
}

export type SearchEngineType = 'duckduckgo' | 'google' | 'bing' | 'ecosia';

export interface SearchEngineConfig {
  id: SearchEngineType;
  name: string;
  searchUrl: (query: string) => string;
  suggestUrl?: (query: string) => string;
}

export interface BrowserPreferences {
  version: 1;
  homeUrl: string;
  defaultSearchEngine: SearchEngineType;
  customSearchUrl?: string;
  zoomLevel: number; // 0.8, 0.9, 1.0, 1.1, 1.25, 1.5
  blockPopups: boolean;
  showBookmarksBar: boolean;
  enableExternalOpenForBlocked: boolean;
}

export interface BrowserDownloadItem {
  id: string;
  filename: string;
  url: string;
  totalBytes: number;
  receivedBytes: number;
  state: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'paused' | 'failed';
  mimeType?: string;
  startTime: number;
  endTime?: number;
  error?: string;
}

export interface BrowserCopilotContext {
  url: string;
  title: string;
  selectedText?: string;
  pageMetadata?: Record<string, string>;
  source: 'orion-browser';
}

const searchEngineList: SearchEngineConfig[] = [
  {
    id: 'duckduckgo',
    name: 'DuckDuckGo',
    searchUrl: (q: string) => `https://duckduckgo.com/?q=${encodeURIComponent(q).replace(/%20/g, '+')}`,
  },
  {
    id: 'google',
    name: 'Google',
    searchUrl: (q: string) => `https://www.google.com/search?q=${encodeURIComponent(q).replace(/%20/g, '+')}`,
  },
  {
    id: 'bing',
    name: 'Bing',
    searchUrl: (q: string) => `https://www.bing.com/search?q=${encodeURIComponent(q).replace(/%20/g, '+')}`,
  },
  {
    id: 'ecosia',
    name: 'Ecosia',
    searchUrl: (q: string) => `https://www.ecosia.org/search?q=${encodeURIComponent(q).replace(/%20/g, '+')}`,
  },
];

export const SEARCH_ENGINES: SearchEngineConfig[] & Record<SearchEngineType, SearchEngineConfig> = Object.assign(
  [...searchEngineList],
  {
    duckduckgo: searchEngineList[0],
    google: searchEngineList[1],
    bing: searchEngineList[2],
    ecosia: searchEngineList[3],
  }
);

export const DEFAULT_SEARCH_ENGINE: SearchEngineType = 'duckduckgo';

export const DEFAULT_BROWSER_PREFERENCES: BrowserPreferences = {
  version: 1,
  homeUrl: 'orion://newtab',
  defaultSearchEngine: DEFAULT_SEARCH_ENGINE,
  zoomLevel: 1.0,
  blockPopups: true,
  showBookmarksBar: true,
  enableExternalOpenForBlocked: true,
};

export const DEFAULT_BOOKMARKS: BrowserBookmarkEntry[] = [
  {
    id: 'bm-mission-control',
    title: 'Mission Control',
    url: '/executive',
    createdAt: 1700000000000,
  },
  {
    id: 'bm-control-tower',
    title: 'Control Tower',
    url: '/',
    createdAt: 1700000000000,
  },
  {
    id: 'bm-file-explorer',
    title: 'Files & Storage',
    url: '/files',
    createdAt: 1700000000000,
  },
  {
    id: 'bm-copilot',
    title: 'Orion AI Copilot',
    url: '/ai-copilot',
    createdAt: 1700000000000,
  },
  {
    id: 'bm-duckduckgo',
    title: 'DuckDuckGo Search',
    url: 'https://duckduckgo.com',
    createdAt: 1700000000000,
  },
  {
    id: 'bm-wikipedia',
    title: 'Wikipedia (Encyclopedia)',
    url: 'https://en.wikipedia.org',
    createdAt: 1700000000000,
  },
];
