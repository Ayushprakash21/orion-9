/**
 * ORION-9 BROWSER BOOKMARKS PERSISTENCE
 * 
 * Manages user bookmarks with default OS system shortcuts,
 * persistence, and reactive synchronization.
 */

import { BrowserBookmarkEntry, DEFAULT_BOOKMARKS } from './BrowserTypes';

const BOOKMARKS_STORAGE_KEY = 'orion_browser_bookmarks';

export class BrowserBookmarksManager {
  private static instance: BrowserBookmarksManager;
  private memoryBookmarks: BrowserBookmarkEntry[] = [];

  private constructor() {
    this.restore();
  }

  public static getInstance(): BrowserBookmarksManager {
    if (!BrowserBookmarksManager.instance) {
      BrowserBookmarksManager.instance = new BrowserBookmarksManager();
    }
    return BrowserBookmarksManager.instance;
  }

  public static resetToDefaults(): void {
    const inst = BrowserBookmarksManager.getInstance();
    inst.memoryBookmarks = [...DEFAULT_BOOKMARKS];
    inst.persist();
  }

  public static getBookmarks(): BrowserBookmarkEntry[] {
    return BrowserBookmarksManager.getInstance().getBookmarks();
  }

  public static isBookmarked(url: string): boolean {
    return BrowserBookmarksManager.getInstance().isBookmarked(url);
  }

  public static addBookmark(url: string, title?: string, description?: string): boolean {
    BrowserBookmarksManager.getInstance().addBookmark({ url, title });
    return true;
  }

  public static removeBookmark(urlOrId: string): boolean {
    BrowserBookmarksManager.getInstance().removeBookmark(urlOrId);
    return true;
  }

  private restore(): void {
    if (typeof window === 'undefined') {
      this.memoryBookmarks = [...DEFAULT_BOOKMARKS];
      return;
    }

    try {
      const raw = localStorage.getItem(BOOKMARKS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.memoryBookmarks = parsed;
          return;
        }
      }
    } catch {}

    this.memoryBookmarks = [...DEFAULT_BOOKMARKS];
    this.persist();
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(BOOKMARKS_STORAGE_KEY, JSON.stringify(this.memoryBookmarks));
    } catch {}
  }

  public getBookmarks(): BrowserBookmarkEntry[] {
    return [...this.memoryBookmarks];
  }

  public isBookmarked(url: string): boolean {
    if (!url || url === 'orion://newtab' || url === 'about:blank') return false;
    const norm = url.trim().toLowerCase().replace(/\/$/, '');
    return this.memoryBookmarks.some(b => b.url.trim().toLowerCase().replace(/\/$/, '') === norm);
  }

  public addBookmark(entry: { url: string; title?: string; favicon?: string }): BrowserBookmarkEntry {
    const existing = this.memoryBookmarks.find(b => b.url === entry.url);
    if (existing) return existing;

    const newBookmark: BrowserBookmarkEntry = {
      id: `bm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: entry.url,
      title: entry.title?.trim() || entry.url,
      favicon: entry.favicon,
      createdAt: Date.now(),
    };

    this.memoryBookmarks.push(newBookmark);
    this.persist();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-browser-bookmarks-changed', {
        detail: { bookmarks: this.getBookmarks() }
      }));
    }

    return newBookmark;
  }

  public removeBookmark(urlOrId: string): void {
    const norm = urlOrId.trim().toLowerCase().replace(/\/$/, '');
    this.memoryBookmarks = this.memoryBookmarks.filter(b => 
      b.id !== urlOrId && b.url.trim().toLowerCase().replace(/\/$/, '') !== norm
    );
    this.persist();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-browser-bookmarks-changed', {
        detail: { bookmarks: this.getBookmarks() }
      }));
    }
  }

  public toggleBookmark(entry: { url: string; title?: string; favicon?: string }): boolean {
    if (this.isBookmarked(entry.url)) {
      this.removeBookmark(entry.url);
      return false;
    } else {
      this.addBookmark(entry);
      return true;
    }
  }
}

export const browserBookmarks = BrowserBookmarksManager.getInstance();
