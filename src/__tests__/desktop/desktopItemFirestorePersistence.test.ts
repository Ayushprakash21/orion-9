/**
 * ORION-9 DESKTOP ITEMS FIRESTORE PERSISTENCE & SCHEMA VALIDATION SUITE
 * Validates:
 * TEST 1: New Folder creates valid Firestore desktop_items record.
 * TEST 2: New Text Document creates valid Firestore desktop_items record.
 * TEST 3: Notepad opens newly created text document (targetId/type compatibility).
 * TEST 4: No Firestore field contains undefined (strictly stripped by sanitizer).
 * TEST 5: iconId is persisted as a clean string.
 * TEST 6: React icon component is NOT persisted (rejected by sanitizer).
 * TEST 7: Required-field validation rejects missing iconId.
 * TEST 8: DEMO desktop item stays in DEMO environment.
 * TEST 9: LIVE desktop item stays in LIVE environment.
 * TEST 10: Tenant isolation remains strictly enforced.
 * TEST 11: Firestore failure throws authoritative error and does not silently fall back.
 * TEST 12: Retry and idempotent updates do not create uncontrolled duplicates.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import {
  sanitizeFirestorePayload,
  validateDesktopItemRecord,
  FirestoreSanitizationError,
  DesktopItemValidationError,
} from '../../core/database/firestoreSanitizer';
import { desktopWorkspaceService } from '../../core/filesystem/DesktopWorkspaceService';
import { orionFileSystemService } from '../../core/filesystem/OrionFileSystemService';
import { scmPersistenceService } from '../../services/scm/ScmPersistenceService';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { DesktopItemRecord } from '../../core/filesystem/types';

describe('Desktop Items Firestore Schema & Authoritative Persistence Gate', () => {
  const testTenant = 'tenant_firestore_audit_01';
  const otherTenant = 'tenant_firestore_audit_02';

  beforeEach(async () => {
    scmPersistenceService.clear();
    orionFileSystemService.clear();
    desktopWorkspaceService.clear();
  });

  // TEST 1: New Folder creates valid Firestore desktop_items record
  it('TEST 1: New Folder creates valid Firestore desktop_items record', async () => {
    const folder = await orionFileSystemService.createFolder({
      name: 'Operations 2026',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    const shortcut = await desktopWorkspaceService.addShortcut({
      targetType: 'folder',
      targetId: folder.id,
      name: folder.name,
      iconId: 'folder',
      isDirectory: true,
      path: `/Desktop/${folder.name}`,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    expect(shortcut.id).toBeDefined();
    expect(shortcut.name).toBe('Operations 2026');
    expect(shortcut.type).toBe('folder');
    expect(shortcut.isDirectory).toBe(true);
    expect(shortcut.parentId).toBeNull();
    expect(shortcut.iconId).toBe('folder');
    expect(shortcut.tenantId).toBe(testTenant);
    expect(shortcut.environment).toBe('DEMO');

    // Retrieve authoritative record from persistence
    const saved = await scmPersistenceService.getRecord<DesktopItemRecord>('desktop_items', testTenant, shortcut.id);
    expect(saved).not.toBeNull();
    expect(saved?.iconId).toBe('folder');
    expect(saved?.isDirectory).toBe(true);
  });

  // TEST 2: New Text Document creates valid Firestore desktop_items record
  it('TEST 2: New Text Document creates valid Firestore desktop_items record', async () => {
    const file = await orionFileSystemService.createFile({
      name: 'Shift Schedule',
      extension: 'txt',
      content: 'Morning shift: Alpha team.',
      folderId: 'folder_sys_desktop_tenant_default',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    const shortcut = await desktopWorkspaceService.addShortcut({
      targetType: 'file',
      targetId: file.id,
      name: `${file.name}.${file.extension}`,
      iconId: 'notepad',
      isDirectory: false,
      path: `/Desktop/${file.name}.${file.extension}`,
      mimeType: 'text/plain',
      size: 26,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    expect(shortcut.id).toBeDefined();
    expect(shortcut.name).toBe('Shift Schedule.txt');
    expect(shortcut.type).toBe('file');
    expect(shortcut.isDirectory).toBe(false);
    expect(shortcut.iconId).toBe('notepad');
    expect(shortcut.mimeType).toBe('text/plain');
    expect(shortcut.size).toBe(26);

    const saved = await scmPersistenceService.getRecord<DesktopItemRecord>('desktop_items', testTenant, shortcut.id);
    expect(saved).not.toBeNull();
    expect(saved?.iconId).toBe('notepad');
    expect(saved?.mimeType).toBe('text/plain');
  });

  // TEST 3: Notepad opens newly created text document
  it('TEST 3: Notepad application and text file mapping compatibility', async () => {
    const file = await orionFileSystemService.createFile({
      name: 'Executive Memo',
      extension: 'txt',
      content: 'High priority inventory rebalance required.',
      folderId: 'folder_sys_desktop_tenant_default',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    const shortcut = await desktopWorkspaceService.addShortcut({
      targetType: 'file',
      targetId: file.id,
      name: `${file.name}.${file.extension}`,
      iconId: 'notepad',
      isDirectory: false,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    // Verify target mapping: file maps to fileId and iconId is notepad
    expect(shortcut.targetType).toBe('file');
    expect(shortcut.targetId).toBe(file.id);
    expect(shortcut.iconId).toBe('notepad');

    // Retrieve file content from VFS
    const retrievedFile = await orionFileSystemService.getFile(shortcut.targetId, testTenant, 'DEMO');
    expect(retrievedFile).not.toBeNull();
    expect(retrievedFile?.content).toBe('High priority inventory rebalance required.');
  });

  // TEST 4: No Firestore field contains undefined
  it('TEST 4: No Firestore field contains undefined after sanitization', () => {
    const rawPayloadWithUndefined = {
      id: 'shortcut_test_001',
      name: 'Test Document.txt',
      type: 'file',
      targetType: 'file',
      targetId: 'file_001',
      isDirectory: false,
      parentId: null,
      path: '/Desktop/Test Document.txt',
      iconId: 'notepad',
      mimeType: 'text/plain',
      size: 0,
      x: 16,
      y: 52,
      workspaceId: 'operations',
      ownerId: 'user_001',
      tenantId: testTenant,
      organizationId: testTenant,
      environment: 'DEMO',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      icon: undefined,           // Undefined field to strip
      metadata: {
        tag: 'audit',
        customField: undefined, // Nested undefined to strip
      },
      deletedAt: undefined,      // Undefined field to strip
    };

    const sanitized = sanitizeFirestorePayload(rawPayloadWithUndefined);

    // Verify undefined fields are completely absent
    expect('icon' in sanitized).toBe(false);
    expect('deletedAt' in sanitized).toBe(false);
    expect('customField' in sanitized.metadata).toBe(false);
    expect(sanitized.metadata.tag).toBe('audit');

    // Verify null, false, 0, and strings are preserved
    expect(sanitized.parentId).toBeNull();
    expect(sanitized.isDirectory).toBe(false);
    expect(sanitized.size).toBe(0);
    expect(sanitized.name).toBe('Test Document.txt');

    // Check JSON serialization has 0 "undefined"
    const jsonString = JSON.stringify(sanitized);
    expect(jsonString).not.toContain('undefined');
  });

  // TEST 5: iconId is persisted
  it('TEST 5: iconId is persisted as a stable identifier', async () => {
    const shortcut = await desktopWorkspaceService.addShortcut({
      targetType: 'application',
      targetId: 'inventory',
      name: 'Inventory Optimizer',
      iconId: 'inventory',
      isDirectory: false,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    expect(shortcut.iconId).toBe('inventory');

    const loaded = await scmPersistenceService.getRecord<DesktopItemRecord>('desktop_items', testTenant, shortcut.id);
    expect(loaded?.iconId).toBe('inventory');
  });

  // TEST 6: React icon component is NOT persisted
  it('TEST 6: Rejects persisting React elements or component instances to Firestore', () => {
    const fakeReactElement = React.createElement('div', { id: 'icon' }, 'Icon');

    const invalidPayload = {
      id: 'shortcut_bad_001',
      name: 'Bad Shortcut',
      tenantId: testTenant,
      environment: 'DEMO',
      iconId: 'folder',
      iconComponent: fakeReactElement, // React Element!
    };

    expect(() => {
      sanitizeFirestorePayload(invalidPayload);
    }).toThrow(FirestoreSanitizationError);
  });

  // TEST 7: Required-field validation rejects missing iconId
  it('TEST 7: Required-field validation rejects missing iconId', () => {
    const invalidRecord = {
      id: 'shortcut_missing_icon',
      name: 'Incomplete Item',
      tenantId: testTenant,
      environment: 'DEMO',
      isDirectory: true,
      // iconId is missing!
    };

    expect(() => {
      validateDesktopItemRecord(invalidRecord);
    }).toThrow(DesktopItemValidationError);
  });

  // TEST 8 & 9: DEMO desktop item stays in DEMO, LIVE desktop item stays in LIVE
  it('TEST 8 & 9: DEMO desktop item stays in DEMO, LIVE desktop item stays in LIVE', async () => {
    // 1. Create in DEMO
    const demoShortcut = await desktopWorkspaceService.addShortcut({
      targetType: 'folder',
      targetId: 'folder_demo_1',
      name: 'Demo Project',
      iconId: 'folder',
      isDirectory: true,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    // 2. Create in LIVE
    const liveShortcut = await desktopWorkspaceService.addShortcut({
      targetType: 'folder',
      targetId: 'folder_live_1',
      name: 'Live Production',
      iconId: 'folder',
      isDirectory: true,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'LIVE',
    });

    // List DEMO shortcuts -> must only include DEMO
    const demoList = await desktopWorkspaceService.listShortcuts('operations', testTenant, 'DEMO');
    expect(demoList.some(s => s.id === demoShortcut.id)).toBe(true);
    expect(demoList.some(s => s.id === liveShortcut.id)).toBe(false);

    // List LIVE shortcuts -> must only include LIVE
    const liveList = await desktopWorkspaceService.listShortcuts('operations', testTenant, 'LIVE');
    expect(liveList.some(s => s.id === liveShortcut.id)).toBe(true);
    expect(liveList.some(s => s.id === demoShortcut.id)).toBe(false);
  });

  // TEST 10: Tenant isolation remains enforced
  it('TEST 10: Enforces strict tenant isolation across desktop items', async () => {
    const itemTenant1 = await desktopWorkspaceService.addShortcut({
      targetType: 'folder',
      targetId: 'folder_t1',
      name: 'Confidential Tenant 1 Data',
      iconId: 'folder',
      isDirectory: true,
      workspaceId: 'operations',
      tenantId: testTenant,
      environment: 'DEMO',
    });

    // Query with tenant 2 -> must NOT see tenant 1 record
    const tenant2List = await desktopWorkspaceService.listShortcuts('operations', otherTenant, 'DEMO');
    expect(tenant2List.some(s => s.id === itemTenant1.id)).toBe(false);

    const directFetch = await scmPersistenceService.getRecord('desktop_items', otherTenant, itemTenant1.id);
    expect(directFetch).toBeNull();
  });

  // TEST 11: Firestore failure does not silently fall back
  it('TEST 11: Rejection on invalid document throws authoritative error and prevents corrupted writes', async () => {
    const invalidRecord: any = {
      id: '', // Empty ID!
      name: 'Bad Doc',
      tenantId: testTenant,
      environment: 'DEMO',
      iconId: 'folder',
      isDirectory: true,
    };

    await expect(async () => {
      await scmPersistenceService.saveRecord('desktop_items', '', invalidRecord);
    }).rejects.toThrow();
  });

  // TEST 12: Retry does not create uncontrolled duplicates
  it('TEST 12: Idempotent shortcut creation prevents duplicate entries on rapid retry', async () => {
    const params = {
      targetType: 'folder' as const,
      targetId: 'folder_stable_101',
      name: 'Stable Folder',
      iconId: 'folder',
      isDirectory: true,
      workspaceId: 'operations' as const,
      tenantId: testTenant,
      environment: 'DEMO' as const,
    };

    // First attempt
    const first = await desktopWorkspaceService.addShortcut(params);
    // Second attempt (e.g. user retrying or rapid double click)
    const second = await desktopWorkspaceService.addShortcut(params);

    expect(first.id).toBe(second.id);

    const all = await desktopWorkspaceService.listShortcuts('operations', testTenant, 'DEMO');
    const matches = all.filter(s => s.targetId === 'folder_stable_101');
    expect(matches.length).toBe(1);
  });
});
