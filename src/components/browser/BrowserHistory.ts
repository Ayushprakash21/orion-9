/**
 * ORION-9 BROWSER HISTORY PERSISTENCE
 * 
 * Manages visited page history using existing Orion persistence mechanisms
 * with deduplication, size limits, and robust fallback.
 */

import { BrowserHistoryEntry } from './BrowserTypes';

const HISTORY_STORAGE_KEY = 'orion_browser_history';
const MAX_HISTORY_ITEMS = 250;

export class BrowserHistoryManager {
  private static instance: BrowserHistoryManager;
  private memoryHistory: BrowserHistoryEntry[] = [];

  private constructor() {
    this.restore();
  }

  public static getInstance(): BrowserHistoryManager {
    if (!BrowserHistoryManager.instance) {
      BrowserHistoryManager.instance = new BrowserHistoryManager();
    }
    return BrowserHistoryManager.instance;
  }

  public static clear(): void {
    BrowserHistoryManager.getInstance().clearHistory();
  }

  public static getHistory(): BrowserHistoryEntry[] {
    return BrowserHistoryManager.getInstance().getHistory();
  }

  public static addEntry(url: string, title?: string, favicon?: string): BrowserHistoryEntry {
    return BrowserHistoryManager.getInstance().addEntry({ url, title, favicon });
  }

  private restore(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = (typeof localStorage !== 'undefined' ? localStorage.getItem(HISTORY_STORAGE_KEY) : null) || 
                  (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem(HISTORY_STORAGE_KEY) : null);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.memoryHistory = parsed.filter(item => item && typeof item.url === 'string');
        }
      }
    } catch {
      this.memoryHistory = [];
    }
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      const serialized = JSON.stringify(this.memoryHistory.slice(0, MAX_HISTORY_ITEMS));
      localStorage.setItem(HISTORY_STORAGE_KEY, serialized);
    } catch {
      // Storage quota or private mode fallback
    }
  }

  public getHistory(): BrowserHistoryEntry[] {
    return [...this.memoryHistory];
  }

  public addEntry(entry: { url: string; title?: string; favicon?: string }): BrowserHistoryEntry {
    if (!entry.url || entry.url === 'orion://newtab' || entry.url === 'about:blank') {
      return {
        id: 'noop',
        url: entry.url,
        title: entry.title || 'New Tab',
        visitedAt: Date.now(),
      };
    }

    const cleanTitle = entry.title?.trim() || entry.url;
    const newEntry: BrowserHistoryEntry = {
      id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      url: entry.url,
      title: cleanTitle,
      favicon: entry.favicon,
      visitedAt: Date.now(),
    };

    // Filter out immediate consecutive duplicate for the same URL
    this.memoryHistory = [
      newEntry,
      ...this.memoryHistory.filter(h => h.url !== entry.url)
    ].slice(0, MAX_HISTORY_ITEMS);

    this.persist();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-browser-history-changed', {
        detail: { history: this.getHistory() }
      }));
    }

    return newEntry;
  }

  public removeEntry(id: string): void {
    this.memoryHistory = this.memoryHistory.filter(h => h.id !== id);
    this.persist();

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-browser-history-changed', {
        detail: { history: this.getHistory() }
      }));
    }
  }

  public clearHistory(): void {
    this.memoryHistory = [];
    if (typeof localStorage !== 'undefined') {
      try { localStorage.removeItem(HISTORY_STORAGE_KEY); } catch {}
    }
    if (typeof sessionStorage !== 'undefined') {
      try { sessionStorage.removeItem(HISTORY_STORAGE_KEY); } catch {}
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('orion-browser-history-changed', {
        detail: { history: [] }
      }));
    }
  }
}

export const browserHistory = BrowserHistoryManager.getInstance();
