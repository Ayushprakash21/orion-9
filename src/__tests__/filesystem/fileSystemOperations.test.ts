/**
 * ORION-9 VIRTUAL FILE SYSTEM TEST SUITE
 * Validates file and folder CRUD, DEMO synthetic seeding, Recycle Bin lifecycle,
 * virtual storage metrics, and multi-tenant environment isolation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';

describe('OrionFileSystemService Tests', () => {
  const testTenant = 'tenant_fs_test_01';

  beforeEach(() => {
    scmPersistenceService.clear();
    orionFileSystemService.clear();
  });

  it('initializes system folders correctly for a new tenant', async () => {
    await orionFileSystemService.ensureSystemStructure(testTenant, 'LIVE');
    const folders = await orionFileSystemService.listFolders(null, testTenant, 'LIVE');
    
    expect(folders.length).toBeGreaterThanOrEqual(8);
    const systemKeys = folders.map(f => f.systemKey).filter(Boolean);
    expect(systemKeys).toContain('documents');
    expect(systemKeys).toContain('desktop');
    expect(systemKeys).toContain('reports');
    expect(systemKeys).toContain('recycle_bin');
  });

  it('seeds synthetic files in DEMO mode but not in LIVE mode', async () => {
    // 1. LIVE tenant should start with 0 files
    const liveTenant = 'tenant_live_strict';
    await orionFileSystemService.ensureSystemStructure(liveTenant, 'LIVE');
    const liveFiles = await orionFileSystemService.listFiles(null, liveTenant, 'LIVE');
    expect(liveFiles.length).toBe(0);

    // 2. DEMO tenant should have seeded files
    const demoTenant = 'tenant_demo_sandbox';
    await orionFileSystemService.ensureSystemStructure(demoTenant, 'DEMO');
    const demoFiles = await orionFileSystemService.listFiles(null, demoTenant, 'DEMO');
    expect(demoFiles.length).toBeGreaterThanOrEqual(4);
    const names = demoFiles.map(f => f.name);
    expect(names.some(n => n.includes('Supplier') || n.includes('Inventory'))).toBe(true);
  });

  it('creates, reads, updates, and renames files correctly', async () => {
    const docsFolder = await orionFileSystemService.getSystemFolder('documents', testTenant, 'LIVE');
    expect(docsFolder).toBeDefined();

    // Create file
    const file = await orionFileSystemService.createFile({
      name: 'Q3_Operations_Memo.txt',
      content: 'Initial supply chain notes for Q3 audit.',
      folderId: docsFolder!.id,
      tenantId: testTenant,
      environment: 'LIVE',
      tags: ['SCM', 'Audit'],
    });

    expect(file.id).toBeDefined();
    expect(file.name).toBe('Q3_Operations_Memo');
    expect(file.extension).toBe('txt');
    expect(file.content).toBe('Initial supply chain notes for Q3 audit.');
    expect(file.tags).toContain('Audit');

    // Read file
    const fetched = await orionFileSystemService.getFile(file.id, testTenant, 'LIVE');
    expect(fetched).not.toBeNull();
    expect(fetched!.content).toBe('Initial supply chain notes for Q3 audit.');

    // Update content
    const updated = await orionFileSystemService.updateFile(
      file.id,
      { content: 'Updated content with revised SLA numbers.' },
      testTenant,
      'LIVE'
    );
    expect(updated.content).toBe('Updated content with revised SLA numbers.');
    expect(updated.version).toBe(2);

    // Rename file
    const renamed = await orionFileSystemService.renameFile(file.id, 'Q3_Operations_Final', testTenant, 'LIVE');
    expect(renamed.name).toBe('Q3_Operations_Final');
  });

  it('handles soft-delete to Recycle Bin and item restoration', async () => {
    const docsFolder = await orionFileSystemService.getSystemFolder('documents', testTenant, 'LIVE');
    
    const file = await orionFileSystemService.createFile({
      name: 'Obsolete_Report.txt',
      content: 'Draft content to delete',
      folderId: docsFolder!.id,
      tenantId: testTenant,
      environment: 'LIVE',
    });

    // 1. Soft Delete
    await orionFileSystemService.deleteFile(file.id, testTenant, 'LIVE');

    // Should not appear in regular folder file listing
    const regularFiles = await orionFileSystemService.listFiles(docsFolder!.id, testTenant, 'LIVE', false);
    expect(regularFiles.some(f => f.id === file.id)).toBe(false);

    // Should appear in Recycle Bin
    const recycleBin = await orionFileSystemService.getRecycleBinItems(testTenant, 'LIVE');
    expect(recycleBin.files.some(f => f.id === file.id)).toBe(true);

    // 2. Restore File
    await orionFileSystemService.restoreFile(file.id, testTenant, 'LIVE');

    const restoredFiles = await orionFileSystemService.listFiles(docsFolder!.id, testTenant, 'LIVE', false);
    expect(restoredFiles.some(f => f.id === file.id)).toBe(true);
  });

  it('searches files by name, tags, and content', async () => {
    const reportsFolder = await orionFileSystemService.getSystemFolder('reports', testTenant, 'LIVE');

    await orionFileSystemService.createFile({
      name: 'Apex_Supplier_SLA.csv',
      content: 'Vendor,Score,OTIF\nApex,99.4,98.9',
      folderId: reportsFolder!.id,
      tenantId: testTenant,
      environment: 'LIVE',
      tags: ['SupplierPerformance'],
    });

    // Search by name substring
    const nameResults = await orionFileSystemService.searchFiles('Apex', testTenant, 'LIVE');
    expect(nameResults.length).toBeGreaterThanOrEqual(1);

    // Search by tag
    const tagResults = await orionFileSystemService.searchFiles('SupplierPerformance', testTenant, 'LIVE');
    expect(tagResults.length).toBeGreaterThanOrEqual(1);

    // Search by content text
    const contentResults = await orionFileSystemService.searchFiles('Score,OTIF', testTenant, 'LIVE');
    expect(contentResults.length).toBeGreaterThanOrEqual(1);
  });

  it('calculates virtual storage metrics and category breakdowns', async () => {
    const docsFolder = await orionFileSystemService.getSystemFolder('documents', testTenant, 'LIVE');
    
    await orionFileSystemService.createFile({
      name: 'Doc1.txt',
      content: 'ABCDEF123456',
      folderId: docsFolder!.id,
      tenantId: testTenant,
      environment: 'LIVE',
    });

    const storage = await orionFileSystemService.getVirtualStorageInfo(testTenant, 'LIVE');
    expect(storage.totalCapacityBytes).toBe(50 * 1024 * 1024 * 1024);
    expect(storage.usedBytes).toBeGreaterThan(0);
    expect(storage.availableBytes).toBeLessThanOrEqual(storage.totalCapacityBytes);
    expect(storage.fileCount).toBeGreaterThanOrEqual(1);
    expect(storage.categories.documents).toBeGreaterThan(0);
  });
});
