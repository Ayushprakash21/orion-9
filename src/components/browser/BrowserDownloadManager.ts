/**
 * ORION-9 BROWSER DOWNLOAD MANAGER
 * 
 * Manages download items, integrates with native browser downloads safely,
 * and provides foundation for Orion Filesystem (Downloads) integration.
 */

import { BrowserDownloadItem } from './BrowserTypes';

const DOWNLOADS_STORAGE_KEY = 'orion_browser_downloads';

export class BrowserDownloadManager {
  private static instance: BrowserDownloadManager;
  private items: BrowserDownloadItem[] = [];

  private constructor() {
    this.restore();
  }

  public static getInstance(): BrowserDownloadManager {
    if (!BrowserDownloadManager.instance) {
      BrowserDownloadManager.instance = new BrowserDownloadManager();
    }
    return BrowserDownloadManager.instance;
  }

  public static clear(): void {
    BrowserDownloadManager.getInstance().clearDownloads();
  }

  public static getDownloads(): BrowserDownloadItem[] {
    return BrowserDownloadManager.getInstance().getDownloads();
  }

  private restore(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(DOWNLOADS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          this.items = parsed;
        }
      }
    } catch {}
  }

  private persist(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(DOWNLOADS_STORAGE_KEY, JSON.stringify(this.items.slice(0, 100)));
    } catch {}
  }

  public getDownloads(): BrowserDownloadItem[] {
    return [...this.items];
  }

  /**
   * Initiates a safe browser download.
   */
  public triggerDownload(url: string, filename?: string): BrowserDownloadItem {
    const derivedName = filename || url.split('/').pop()?.split('?')[0] || `download_${Date.now()}`;
    const item: BrowserDownloadItem = {
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      filename: derivedName,
      url,
      totalBytes: 0,
      receivedBytes: 0,
      state: 'in_progress',
      startTime: Date.now(),
    };

    this.items.unshift(item);
    this.persist();

    if (typeof window !== 'undefined') {
      try {
        const a = document.createElement('a');
        a.href = url;
        a.download = derivedName;
        a.rel = 'noopener noreferrer';
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Mark completed after triggering
        item.state = 'completed';
        item.endTime = Date.now();
        this.persist();
      } catch (err: any) {
        item.state = 'failed';
        item.error = err.message || 'Download failed';
        this.persist();
      }

      window.dispatchEvent(new CustomEvent('orion-browser-downloads-changed', {
        detail: { downloads: this.getDownloads() }
      }));
    }

    return item;
  }

  public clearDownloads(): void {
    this.items = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DOWNLOADS_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('orion-browser-downloads-changed', {
        detail: { downloads: [] }
      }));
    }
  }
}

export const browserDownloadManager = BrowserDownloadManager.getInstance();
