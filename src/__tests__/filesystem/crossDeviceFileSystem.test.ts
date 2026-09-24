/**
 * ORION-9 CROSS-DEVICE FILE SYSTEM & DEVICE MODE ENGINE UNIT TESTS
 * Validates device breakpoint computation, touch interaction models,
 * folder tree mutation validation (cycle detection), and multi-tenant isolation.
 */

import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { getOrionDeviceSnapshot } from '../../lib/useOrionDeviceMode';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('Orion Cross-Device Mode & File System Unit Tests', () => {
  const tenantA = 'tenant_cross_device_a';
  const tenantB = 'tenant_cross_device_b';

  const originalWindow = (globalThis as any).window;

  beforeEach(() => {
    scmPersistenceService.clear();
    orionFileSystemService.clear();
  });

  afterAll(() => {
    (globalThis as any).window = originalWindow;
  });

  describe('Device Mode Snapshot Engine', () => {
    it('accurately classifies mobile viewport (<768px)', () => {
      (globalThis as any).window = {
        innerWidth: 390,
        innerHeight: 844,
        matchMedia: () => ({ matches: false }),
      };
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });

      const snapshot = getOrionDeviceSnapshot();
      expect(snapshot.mode).toBe('mobile');
      expect(snapshot.isMobile).toBe(true);
      expect(snapshot.isTablet).toBe(false);
      expect(snapshot.isDesktop).toBe(false);
      expect(snapshot.interactionModel).toBe('mobile_shell');
      expect(snapshot.width).toBe(390);
      expect(snapshot.height).toBe(844);
      expect(snapshot.isPortrait).toBe(true);
    });

    it('accurately classifies tablet viewport (768px - 1023px)', () => {
      (globalThis as any).window = {
        innerWidth: 820,
        innerHeight: 1180,
        matchMedia: () => ({ matches: false }),
      };
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 5, configurable: true });

      const snapshot = getOrionDeviceSnapshot();
      expect(snapshot.mode).toBe('tablet');
      expect(snapshot.isTablet).toBe(true);
      expect(snapshot.isMobile).toBe(false);
      expect(snapshot.isDesktop).toBe(false);
      expect(snapshot.interactionModel).toBe('touch_tablet');
      expect(snapshot.width).toBe(820);
      expect(snapshot.height).toBe(1180);
    });

    it('accurately classifies desktop viewport (>= 1024px)', () => {
      (globalThis as any).window = {
        innerWidth: 1440,
        innerHeight: 900,
        matchMedia: () => ({ matches: true }),
      };
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 0, configurable: true });

      const snapshot = getOrionDeviceSnapshot();
      expect(snapshot.mode).toBe('desktop');
      expect(snapshot.isDesktop).toBe(true);
      expect(snapshot.isTablet).toBe(false);
      expect(snapshot.isMobile).toBe(false);
      expect(snapshot.interactionModel).toBe('mouse_desktop');
      expect(snapshot.width).toBe(1440);
      expect(snapshot.height).toBe(900);
      expect(snapshot.isLandscape).toBe(true);
    });
  });

  describe('File System Hierarchy & Cycle Prevention', () => {
    it('creates subfolders and moves them legitimately under other folders', async () => {
      await orionFileSystemService.ensureSystemStructure(tenantA, 'LIVE');
      const docs = await orionFileSystemService.getSystemFolder('documents', tenantA, 'LIVE');
      expect(docs).toBeDefined();

      const folderA = await orionFileSystemService.createFolder({
        name: 'Inbound_Shipments',
        parentId: docs!.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      const folderB = await orionFileSystemService.createFolder({
        name: 'Europe_Region',
        parentId: docs!.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      // Move Folder A into Folder B
      const moved = await orionFileSystemService.moveFolder(folderA.id, folderB.id, tenantA, 'LIVE');
      expect(moved.parentId).toBe(folderB.id);

      const listUnderB = await orionFileSystemService.listFolders(folderB.id, tenantA, 'LIVE');
      expect(listUnderB.some(f => f.id === folderA.id)).toBe(true);
    });

    it('prevents moving a folder into itself', async () => {
      await orionFileSystemService.ensureSystemStructure(tenantA, 'LIVE');
      const docs = await orionFileSystemService.getSystemFolder('documents', tenantA, 'LIVE');

      const folderA = await orionFileSystemService.createFolder({
        name: 'Critical_Path',
        parentId: docs!.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      await expect(
        orionFileSystemService.moveFolder(folderA.id, folderA.id, tenantA, 'LIVE')
      ).rejects.toThrow('Cannot move a folder into itself');
    });

    it('prevents moving a folder into its own descendant', async () => {
      await orionFileSystemService.ensureSystemStructure(tenantA, 'LIVE');
      const docs = await orionFileSystemService.getSystemFolder('documents', tenantA, 'LIVE');

      // Create hierarchy: Parent -> Child -> GrandChild
      const parentFolder = await orionFileSystemService.createFolder({
        name: 'Parent_Folder',
        parentId: docs!.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      const childFolder = await orionFileSystemService.createFolder({
        name: 'Child_Folder',
        parentId: parentFolder.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      const grandChildFolder = await orionFileSystemService.createFolder({
        name: 'GrandChild_Folder',
        parentId: childFolder.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      // Attempt to move parentFolder into grandChildFolder -> MUST throw error
      await expect(
        orionFileSystemService.moveFolder(parentFolder.id, grandChildFolder.id, tenantA, 'LIVE')
      ).rejects.toThrow('Cannot move a folder into its own descendant');
    });

    it('prevents moving a system root folder', async () => {
      await orionFileSystemService.ensureSystemStructure(tenantA, 'LIVE');
      const docs = await orionFileSystemService.getSystemFolder('documents', tenantA, 'LIVE');
      const reports = await orionFileSystemService.getSystemFolder('reports', tenantA, 'LIVE');

      await expect(
        orionFileSystemService.moveFolder(docs!.id, reports!.id, tenantA, 'LIVE')
      ).rejects.toThrow('Cannot move a system root folder');
    });
  });

  describe('Multi-Tenant & Environment Isolation', () => {
    it('strictly isolates files across different tenants', async () => {
      await orionFileSystemService.ensureSystemStructure(tenantA, 'LIVE');
      await orionFileSystemService.ensureSystemStructure(tenantB, 'LIVE');

      const docsA = await orionFileSystemService.getSystemFolder('documents', tenantA, 'LIVE');
      const docsB = await orionFileSystemService.getSystemFolder('documents', tenantB, 'LIVE');

      // Create confidential file in Tenant A
      const fileA = await orionFileSystemService.createFile({
        name: 'Confidential_Tenant_A_Strategy.txt',
        content: 'Strictly proprietary to Tenant A',
        folderId: docsA!.id,
        tenantId: tenantA,
        environment: 'LIVE',
      });

      // Attempt to fetch file from Tenant B -> MUST return null
      const fetchFromB = await orionFileSystemService.getFile(fileA.id, tenantB, 'LIVE');
      expect(fetchFromB).toBeNull();

      // List files in Tenant B documents -> MUST NOT contain fileA
      const filesB = await orionFileSystemService.listFiles(docsB!.id, tenantB, 'LIVE');
      expect(filesB.some(f => f.id === fileA.id)).toBe(false);
    });

    it('strictly isolates DEMO synthetic files from LIVE environment', async () => {
      // Initialize DEMO
      await orionFileSystemService.ensureSystemStructure(tenantA, 'DEMO');
      const demoFiles = await orionFileSystemService.listFiles(null, tenantA, 'DEMO');
      expect(demoFiles.length).toBeGreaterThanOrEqual(4);

      // Initialize LIVE
      await orionFileSystemService.ensureSystemStructure(tenantA, 'LIVE');
      const liveFiles = await orionFileSystemService.listFiles(null, tenantA, 'LIVE');
      expect(liveFiles.length).toBe(0);
    });
  });
});
