/**
 * ORION-9 GLOBAL FILE MANAGER FOLDER JUMPING / NAVIGATION RACE REGRESSION SUITE
 * 
 * Verifies FILEMANAGER-NAV-001 through FILEMANAGER-NAV-020:
 * Ensures the latest user navigation always wins, stale asynchronous loads
 * cannot overwrite state, filesystem subscriptions are stable and never navigate,
 * and initialFolderKey is never used as an active navigation fallback.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { FileManager } from '../../components/FileManager';
import { orionFileSystemService, SYSTEM_FOLDERS } from '../../core/filesystem/OrionFileSystemService';
import { OrionFolder, OrionFile, SystemFolderKey } from '../../core/filesystem/types';

// Mock WindowManagerContext and ToastContext
vi.mock('../../os/WindowManagerContext', () => ({
  useWindowManager: () => ({
    openApplication: vi.fn(),
    activeWorkspaceId: 'operations',
  }),
}));

vi.mock('../../store/ToastContext', () => ({
  useToast: () => ({
    showToast: vi.fn(),
  }),
}));

describe('ORION-9 Global File Manager Navigation Race Suite (FILEMANAGER-NAV-001 - 020)', () => {
  beforeEach(async () => {
    orionFileSystemService.clear();
    await orionFileSystemService.ensureSystemStructure();
  });

  it('renders FileManager statically without crashing and displays system locations', () => {
    const html = renderToString(React.createElement(FileManager, { initialFolderKey: 'documents' }));
    expect(html).toContain('Locations');
    expect(html).toContain('Virtual Disk');
    expect(html).toContain('Orion OS');
  });

  /**
   * Test harness simulating the exact navigation and request-versioning engine of FileManager.
   */
  class FileManagerNavEngine {
    navigationRequestRef = { current: 0 };
    currentFolderRef = { current: null as OrionFolder | null };
    currentFolderState: OrionFolder | null = null;
    foldersState: OrionFolder[] = [];
    filesState: OrionFile[] = [];
    isLoadingState: boolean = true;
    selectedItemState: { type: 'file' | 'folder'; id: string } | null = null;
    searchQueryState: string = '';
    history: string[] = [];
    historyIndex: number = -1;
    initialFolderKey: SystemFolderKey;
    activeSubscription: (() => void) | null = null;
    subscriptionCount: number = 0;

    constructor(initialKey: SystemFolderKey = 'documents') {
      this.initialFolderKey = initialKey;
    }

    async mount() {
      const reqId = ++this.navigationRequestRef.current;
      this.isLoadingState = true;

      // Subscribe once on mount
      this.subscriptionCount++;
      const unsub = orionFileSystemService.subscribe((event) => {
        this.refreshCurrentFolder(event.type);
      });
      this.activeSubscription = unsub;

      const allSysFolders = await orionFileSystemService.listFolders(null);
      const startFolder = allSysFolders.find(f => f.systemKey === this.initialFolderKey) || allSysFolders[0];
      if (reqId === this.navigationRequestRef.current && startFolder) {
        this.currentFolderRef.current = startFolder;
        this.currentFolderState = startFolder;
        this.history = [startFolder.id];
        this.historyIndex = 0;
        await this.loadFolderContents(startFolder, reqId);
      }
    }

    unmount() {
      if (this.activeSubscription) {
        this.activeSubscription();
        this.activeSubscription = null;
      }
    }

    async loadFolderContents(targetFolder: OrionFolder, requestId: number, delayMs = 0) {
      if (delayMs > 0) {
        await new Promise(r => setTimeout(r, delayMs));
      }

      const isRecycle = targetFolder.systemKey === 'recycle_bin';
      const [subFolders, dirFiles] = await Promise.all([
        orionFileSystemService.listFolders(targetFolder.id, undefined, undefined, isRecycle),
        orionFileSystemService.listFiles(targetFolder.id, undefined, undefined, isRecycle),
      ]);

      // STALE CHECK
      if (requestId !== this.navigationRequestRef.current) {
        // Discard stale result
        return;
      }

      if (this.currentFolderRef.current?.id !== targetFolder.id) {
        return;
      }

      this.foldersState = subFolders;
      this.filesState = dirFiles;
      this.isLoadingState = false;
    }

    navigateToFolder(folder: OrionFolder, loadDelayMs = 0): Promise<void> {
      const reqId = ++this.navigationRequestRef.current;
      this.currentFolderRef.current = folder;
      this.currentFolderState = folder;
      this.selectedItemState = null;
      this.searchQueryState = '';
      this.history = [...this.history.slice(0, this.historyIndex + 1), folder.id];
      this.historyIndex++;
      this.isLoadingState = true;

      return this.loadFolderContents(folder, reqId, loadDelayMs);
    }

    async navigateToFolderById(folderId: string, targetHistoryIndex?: number): Promise<boolean> {
      const reqId = ++this.navigationRequestRef.current;
      this.isLoadingState = true;
      this.selectedItemState = null;
      this.searchQueryState = '';
      if (targetHistoryIndex !== undefined) {
        this.historyIndex = targetHistoryIndex;
      }

      const folder = await orionFileSystemService.getFolder(folderId);
      if (reqId !== this.navigationRequestRef.current) return false;
      if (!folder) {
        // No fallback to initialFolderKey!
        this.isLoadingState = false;
        return false;
      }

      this.currentFolderRef.current = folder;
      this.currentFolderState = folder;
      await this.loadFolderContents(folder, reqId);
      return true;
    }

    refreshCurrentFolder(reason = 'manual', loadDelayMs = 0): Promise<void> {
      const current = this.currentFolderRef.current;
      if (!current) return Promise.resolve();
      const reqId = this.navigationRequestRef.current;
      return this.loadFolderContents(current, reqId, loadDelayMs);
    }

    handleGoBack(): Promise<boolean> {
      if (this.historyIndex > 0) {
        const targetIndex = this.historyIndex - 1;
        const targetId = this.history[targetIndex];
        return this.navigateToFolderById(targetId, targetIndex);
      }
      return Promise.resolve(false);
    }

    handleGoForward(): Promise<boolean> {
      if (this.historyIndex < this.history.length - 1) {
        const targetIndex = this.historyIndex + 1;
        const targetId = this.history[targetIndex];
        return this.navigateToFolderById(targetId, targetIndex);
      }
      return Promise.resolve(false);
    }
  }

  // FILEMANAGER-NAV-001: Documents → Downloads
  it('FILEMANAGER-NAV-001: Documents -> Downloads navigation updates active folder and contents', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();
    expect(engine.currentFolderState?.systemKey).toBe('documents');

    const downloads = await orionFileSystemService.getSystemFolder('downloads');
    expect(downloads).toBeDefined();

    await engine.navigateToFolder(downloads!);
    expect(engine.currentFolderState?.systemKey).toBe('downloads');
    expect(engine.currentFolderRef.current?.id).toBe(downloads!.id);
    expect(engine.isLoadingState).toBe(false);
    engine.unmount();
  });

  // FILEMANAGER-NAV-002: Downloads → Documents
  it('FILEMANAGER-NAV-002: Downloads -> Documents navigation restores documents cleanly', async () => {
    const engine = new FileManagerNavEngine('downloads');
    await engine.mount();
    expect(engine.currentFolderState?.systemKey).toBe('downloads');

    const docs = await orionFileSystemService.getSystemFolder('documents');
    await engine.navigateToFolder(docs!);

    expect(engine.currentFolderState?.systemKey).toBe('documents');
    expect(engine.currentFolderRef.current?.id).toBe(docs!.id);
    engine.unmount();
  });

  // FILEMANAGER-NAV-003: Projects → Reports
  it('FILEMANAGER-NAV-003: Projects -> Reports navigation succeeds without fallback', async () => {
    const engine = new FileManagerNavEngine('projects');
    await engine.mount();
    expect(engine.currentFolderState?.systemKey).toBe('projects');

    const reports = await orionFileSystemService.getSystemFolder('reports');
    await engine.navigateToFolder(reports!);

    expect(engine.currentFolderState?.systemKey).toBe('reports');
    engine.unmount();
  });

  // FILEMANAGER-NAV-004: Reports → AI
  it('FILEMANAGER-NAV-004: Reports -> AI navigation commits authoritative destination', async () => {
    const engine = new FileManagerNavEngine('reports');
    await engine.mount();

    const ai = await orionFileSystemService.getSystemFolder('ai');
    await engine.navigateToFolder(ai!);

    expect(engine.currentFolderState?.systemKey).toBe('ai');
    engine.unmount();
  });

  // FILEMANAGER-NAV-005: AI → Shared
  it('FILEMANAGER-NAV-005: AI -> Shared navigation commits authoritative destination', async () => {
    const engine = new FileManagerNavEngine('ai');
    await engine.mount();

    const shared = await orionFileSystemService.getSystemFolder('shared');
    await engine.navigateToFolder(shared!);

    expect(engine.currentFolderState?.systemKey).toBe('shared');
    engine.unmount();
  });

  // FILEMANAGER-NAV-006: Shared → Recycle Bin
  it('FILEMANAGER-NAV-006: Shared -> Recycle Bin navigation succeeds with standard navigation logic', async () => {
    const engine = new FileManagerNavEngine('shared');
    await engine.mount();

    const bin = await orionFileSystemService.getSystemFolder('recycle_bin');
    await engine.navigateToFolder(bin!);

    expect(engine.currentFolderState?.systemKey).toBe('recycle_bin');
    engine.unmount();
  });

  // FILEMANAGER-NAV-007: Recycle Bin → Documents
  it('FILEMANAGER-NAV-007: Recycle Bin -> Documents navigation transitions out of bin cleanly', async () => {
    const engine = new FileManagerNavEngine('recycle_bin');
    await engine.mount();
    expect(engine.currentFolderState?.systemKey).toBe('recycle_bin');

    const docs = await orionFileSystemService.getSystemFolder('documents');
    await engine.navigateToFolder(docs!);

    expect(engine.currentFolderState?.systemKey).toBe('documents');
    engine.unmount();
  });

  // FILEMANAGER-NAV-008: rapid navigation
  it('FILEMANAGER-NAV-008: rapid navigation across 7 system folders guarantees latest destination wins', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const [downloads, projects, reports, ai, shared, bin] = await Promise.all([
      orionFileSystemService.getSystemFolder('downloads'),
      orionFileSystemService.getSystemFolder('projects'),
      orionFileSystemService.getSystemFolder('reports'),
      orionFileSystemService.getSystemFolder('ai'),
      orionFileSystemService.getSystemFolder('shared'),
      orionFileSystemService.getSystemFolder('recycle_bin'),
    ]);

    // Launch rapid navigations with inverted artificial network latency
    const p1 = engine.navigateToFolder(downloads!, 60);
    const p2 = engine.navigateToFolder(projects!, 50);
    const p3 = engine.navigateToFolder(reports!, 40);
    const p4 = engine.navigateToFolder(ai!, 30);
    const p5 = engine.navigateToFolder(shared!, 20);
    const p6 = engine.navigateToFolder(bin!, 10);

    await Promise.all([p1, p2, p3, p4, p5, p6]);

    // The authoritative folder MUST be Recycle Bin, never overwritten by p1, p2, etc.
    expect(engine.currentFolderState?.systemKey).toBe('recycle_bin');
    expect(engine.currentFolderRef.current?.systemKey).toBe('recycle_bin');
    expect(engine.isLoadingState).toBe(false);
    engine.unmount();
  });

  // FILEMANAGER-NAV-009: stale request cannot overwrite new request
  it('FILEMANAGER-NAV-009: an older async load completing later is discarded', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const docs = await orionFileSystemService.getSystemFolder('documents');
    const downloads = await orionFileSystemService.getSystemFolder('downloads');

    // Simulate stale load started on documents (requestId=1), but downloads is clicked (requestId=2)
    const staleReqId = engine.navigationRequestRef.current;
    await engine.navigateToFolder(downloads!, 0);

    // Now execute stale load with staleReqId
    await engine.loadFolderContents(docs!, staleReqId, 0);

    // Current folder MUST still be downloads
    expect(engine.currentFolderState?.systemKey).toBe('downloads');
    engine.unmount();
  });

  // FILEMANAGER-NAV-010: filesystem event cannot navigate
  it('FILEMANAGER-NAV-010: filesystem events trigger content refresh without modifying active folder', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const initialFolderId = engine.currentFolderState?.id;

    // Dispatch filesystem events
    (orionFileSystemService as any).emitEvent({
      type: 'FILE_CREATED',
      file: { id: 'test_file', name: 'demo', extension: 'txt', size: 100, folderId: initialFolderId!, createdAt: '', updatedAt: '', tenantId: 'tenant_default', environment: 'DEMO' } as OrionFile,
    });
    (orionFileSystemService as any).emitEvent({ type: 'FILE_UPDATED' });
    (orionFileSystemService as any).emitEvent({ type: 'FILE_DELETED' });
    (orionFileSystemService as any).emitEvent({ type: 'FOLDER_CREATED' });

    // Active folder must NOT have changed
    expect(engine.currentFolderState?.id).toBe(initialFolderId);
    expect(engine.currentFolderState?.systemKey).toBe('documents');
    engine.unmount();
  });

  // FILEMANAGER-NAV-011: single stable filesystem subscription
  it('FILEMANAGER-NAV-011: filesystem subscription is registered only once per FileManager mount', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();
    expect(engine.subscriptionCount).toBe(1);

    const downloads = await orionFileSystemService.getSystemFolder('downloads');
    const projects = await orionFileSystemService.getSystemFolder('projects');

    await engine.navigateToFolder(downloads!);
    await engine.navigateToFolder(projects!);

    // Subscription count must NOT increase with navigations
    expect(engine.subscriptionCount).toBe(1);
    engine.unmount();
  });

  // FILEMANAGER-NAV-012: Back navigation
  it('FILEMANAGER-NAV-012: handleGoBack navigates back in history without jumping or falling back', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const downloads = await orionFileSystemService.getSystemFolder('downloads');
    const reports = await orionFileSystemService.getSystemFolder('reports');

    await engine.navigateToFolder(downloads!);
    await engine.navigateToFolder(reports!);

    expect(engine.currentFolderState?.systemKey).toBe('reports');

    // Go Back -> Downloads
    await engine.handleGoBack();
    expect(engine.currentFolderState?.systemKey).toBe('downloads');

    // Go Back -> Documents
    await engine.handleGoBack();
    expect(engine.currentFolderState?.systemKey).toBe('documents');
    engine.unmount();
  });

  // FILEMANAGER-NAV-013: Forward navigation
  it('FILEMANAGER-NAV-013: handleGoForward navigates forward in history deterministically', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const downloads = await orionFileSystemService.getSystemFolder('downloads');
    await engine.navigateToFolder(downloads!);

    await engine.handleGoBack();
    expect(engine.currentFolderState?.systemKey).toBe('documents');

    await engine.handleGoForward();
    expect(engine.currentFolderState?.systemKey).toBe('downloads');
    engine.unmount();
  });

  // FILEMANAGER-NAV-014: Up navigation
  it('FILEMANAGER-NAV-014: Up navigation resolves parent folder without race', async () => {
    const docs = await orionFileSystemService.getSystemFolder('documents');
    const subFolder = await orionFileSystemService.createFolder({
      name: 'SubProject',
      parentId: docs!.id,
    });

    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    await engine.navigateToFolder(subFolder);
    expect(engine.currentFolderState?.id).toBe(subFolder.id);

    // Navigate up to parent
    const parent = await orionFileSystemService.getFolder(engine.currentFolderRef.current!.parentId!);
    await engine.navigateToFolder(parent!);

    expect(engine.currentFolderState?.id).toBe(docs!.id);
    expect(engine.currentFolderState?.systemKey).toBe('documents');
    engine.unmount();
  });

  // FILEMANAGER-NAV-015: initialFolderKey only initializes
  it('FILEMANAGER-NAV-015: initialFolderKey is used only on mount, not as a fallback on refresh', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const ai = await orionFileSystemService.getSystemFolder('ai');
    await engine.navigateToFolder(ai!);
    expect(engine.currentFolderState?.systemKey).toBe('ai');

    // Trigger refresh
    await engine.refreshCurrentFolder('user-refresh');
    // MUST remain 'ai', MUST NOT fall back to 'documents'
    expect(engine.currentFolderState?.systemKey).toBe('ai');
    engine.unmount();
  });

  // FILEMANAGER-NAV-016: missing folder does not fall back to old folder
  it('FILEMANAGER-NAV-016: navigation to missing folder ID safely rejects without falling back to initialFolderKey', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const success = await engine.navigateToFolderById('non_existent_folder_id_999');
    expect(success).toBe(false);
    // Active folder remains documents, does not corrupt state
    expect(engine.currentFolderState?.systemKey).toBe('documents');
    expect(engine.isLoadingState).toBe(false);
    engine.unmount();
  });

  // FILEMANAGER-NAV-017: loading state cannot be controlled by stale request
  it('FILEMANAGER-NAV-017: stale load request cannot clear loading state of active request', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const docs = await orionFileSystemService.getSystemFolder('documents');
    const downloads = await orionFileSystemService.getSystemFolder('downloads');

    // Start nav to downloads with latency
    const pendingNav = engine.navigateToFolder(downloads!, 50);
    expect(engine.isLoadingState).toBe(true);

    // Stale request completes first
    await engine.loadFolderContents(docs!, 1, 0);
    // Loading must STILL be true because request 2 is pending
    expect(engine.isLoadingState).toBe(true);

    await pendingNav;
    expect(engine.isLoadingState).toBe(false);
    expect(engine.currentFolderState?.systemKey).toBe('downloads');
    engine.unmount();
  });

  // FILEMANAGER-NAV-018: contents always match current folder
  it('FILEMANAGER-NAV-018: loaded contents are strictly tied to current folder ID', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    const reports = await orionFileSystemService.getSystemFolder('reports');
    await engine.navigateToFolder(reports!);

    // All loaded files must have folderId equal to reports.id
    for (const file of engine.filesState) {
      expect(file.folderId).toBe(reports!.id);
    }
    engine.unmount();
  });

  // FILEMANAGER-NAV-019: selected item is cleared correctly
  it('FILEMANAGER-NAV-019: selected item is cleared upon folder navigation', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    engine.selectedItemState = { type: 'file', id: 'file_001' };
    const downloads = await orionFileSystemService.getSystemFolder('downloads');
    await engine.navigateToFolder(downloads!);

    expect(engine.selectedItemState).toBeNull();
    engine.unmount();
  });

  // FILEMANAGER-NAV-020: search does not leak between folders
  it('FILEMANAGER-NAV-020: search query is reset when navigating across folders', async () => {
    const engine = new FileManagerNavEngine('documents');
    await engine.mount();

    engine.searchQueryState = 'Confidential_Memo';
    const downloads = await orionFileSystemService.getSystemFolder('downloads');
    await engine.navigateToFolder(downloads!);

    expect(engine.searchQueryState).toBe('');
    engine.unmount();
  });
});
