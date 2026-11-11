import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import {
  normalizeUserPreferenceRecord,
  reconcileUserPreferences,
  resolveEffectivePreferences,
  reconcileSystemSettingsSnapshots,
  OrganizationSettingsPolicy,
} from '../../services/preferences/PreferenceResolutionEngine';
import {
  applyResolvedPreferencesToDOMAndRuntime,
  clearActiveRuntimeSessionCaches,
} from '../../services/preferences/PreferenceRuntimeApplier';
import { userPersistenceService } from '../../services/userPersistenceService';
import { DatabaseConnectionManager } from '../../core/database/DatabaseConnectionManager';
import { DisplayPreferencesControls } from '../../os/DisplayPreferences';

const storageMap: Record<string, string> = {};
const styleStore: Record<string, string> = {};
const attrStore: Record<string, string> = {};
const datasetStore: Record<string, string> = {};
const classSet = new Set<string>();
const dispatchedEvents: Array<{ type: string; detail: any }> = [];

if (typeof (globalThis as any).localStorage === 'undefined') {
  (globalThis as any).localStorage = {
    getItem: (k: string) => storageMap[k] ?? null,
    setItem: (k: string, v: string) => { storageMap[k] = String(v); },
    removeItem: (k: string) => { delete storageMap[k]; },
    clear: () => { Object.keys(storageMap).forEach(k => delete storageMap[k]); },
    key: (i: number) => Object.keys(storageMap)[i] ?? null,
    get length() { return Object.keys(storageMap).length; },
  };
}

if (typeof (globalThis as any).sessionStorage === 'undefined') {
  (globalThis as any).sessionStorage = {
    clear: vi.fn(),
    getItem: vi.fn().mockReturnValue(null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
  };
}

if (typeof (globalThis as any).CustomEvent === 'undefined') {
  (globalThis as any).CustomEvent = class CustomEvent {
    type: string;
    detail: any;
    constructor(type: string, opts?: { detail?: any }) {
      this.type = type;
      this.detail = opts?.detail;
    }
  };
}

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    matchMedia: vi.fn().mockReturnValue({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn((evt: any) => {
      dispatchedEvents.push({ type: evt?.type, detail: evt?.detail });
      return true;
    }),
  };
}

if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      style: {
        colorScheme: '',
        setProperty: vi.fn((k: string, v: string) => { styleStore[k] = v; }),
        getPropertyValue: vi.fn((k: string) => styleStore[k] || ''),
        removeProperty: vi.fn((k: string) => { delete styleStore[k]; }),
      },
      classList: {
        add: vi.fn((...cs: string[]) => cs.forEach(c => classSet.add(c))),
        remove: vi.fn((...cs: string[]) => cs.forEach(c => classSet.delete(c))),
        contains: vi.fn((c: string) => classSet.has(c)),
      },
      dataset: datasetStore,
      setAttribute: vi.fn((k: string, v: string) => { attrStore[k] = v; }),
      getAttribute: vi.fn((k: string) => attrStore[k] || null),
    },
    head: { appendChild: vi.fn() },
    getElementById: vi.fn().mockReturnValue(null),
    createElement: vi.fn().mockReturnValue({ id: '', textContent: '' }),
    body: { style: {} },
  };
}

const firestoreMockStore = new Map<string, any>();
let forceFirestoreError: Error | null = null;

vi.mock('firebase/firestore', async () => {
  const actual = await vi.importActual<typeof import('firebase/firestore')>('firebase/firestore');
  return {
    ...actual,
    doc: vi.fn((_db: any, col: string, id: string) => ({ path: `${col}/${id}` })),
    getDoc: vi.fn(async (ref: { path: string }) => {
      if (forceFirestoreError) throw forceFirestoreError;
      const data = firestoreMockStore.get(ref.path);
      return {
        exists: () => data !== undefined,
        data: () => data,
      };
    }),
    setDoc: vi.fn(async (ref: { path: string }, payload: any, opts?: { merge?: boolean }) => {
      if (forceFirestoreError) throw forceFirestoreError;
      const prev = firestoreMockStore.get(ref.path) || {};
      firestoreMockStore.set(ref.path, opts?.merge ? { ...prev, ...payload } : payload);
    }),
  };
});

vi.mock('../../lib/firebaseClient', () => ({
  getFirebaseFirestore: vi.fn(() => ({ mockFirestore: true })),
  getFirebaseAuth: vi.fn(() => null),
  getFirebaseStorage: vi.fn(() => null),
}));

describe('Orion-9 Preference Resolution, Persistence & Startup Hydration Suite', () => {
  beforeEach(() => {
    localStorage.clear();
    firestoreMockStore.clear();
    forceFirestoreError = null;
    dispatchedEvents.length = 0;
    classSet.clear();
    Object.keys(styleStore).forEach(k => delete styleStore[k]);
    Object.keys(datasetStore).forEach(k => delete datasetStore[k]);
    Object.keys(attrStore).forEach(k => delete attrStore[k]);
    (userPersistenceService as any).preferencesCache?.clear();
    (userPersistenceService as any).orgPolicyCache?.clear();
    DatabaseConnectionManager.getInstance().setEnvironment('DEMO');
  });

  afterEach(() => {
    DatabaseConnectionManager.getInstance().setEnvironment('DEMO');
    forceFirestoreError = null;
    vi.restoreAllMocks();
  });

  it('enforces strict 4-tier Admin Policy Precedence: Enforced Policy > Explicit User Pref > Org Default > System Default', () => {
    const orgPolicy: OrganizationSettingsPolicy = {
      organizationId: 'org-acme',
      tenantId: 'org-acme',
      schemaVersion: 3,
      revision: 2,
      updatedAt: '2026-11-11T10:00:00.000Z',
      defaultTheme: 'light',
      defaultThemeId: 'silver',
      defaultAppearanceMode: 'light',
      defaultFontFamily: 'LATO',
      defaultDisplayScale: 125,
      defaultTextSize: 110,
      defaultDockPosition: 'left',
      defaultLanguage: 'fr',
      enforceTheme: true,
      enforceFont: false,
      enforceScale: false,
      enforceDock: true,
      enforceLanguage: false,
    };

    const userPrefs = normalizeUserPreferenceRecord('user-1', {
      theme: 'dark',
      themeId: 'graphite',
      appearanceMode: 'dark',
      fontFamily: 'ARIAL',
      dockPosition: 'right',
      preferredLanguage: 'es',
      explicitFields: ['theme', 'fontFamily', 'dockPosition', 'preferredLanguage'],
    });

    const result = resolveEffectivePreferences('user-1', userPrefs, orgPolicy);

    // Tier 1: Enforced admin policies override explicit user preferences
    expect(result.effective.theme).toBe('light');
    expect(result.effective.themeId).toBe('silver');
    expect(result.effective.dockPosition).toBe('left');
    expect(result.lockedFields.has('theme')).toBe(true);
    expect(result.lockedFields.has('dockPosition')).toBe(true);

    // Tier 2: Unenforced explicit user preferences override org defaults
    expect(result.effective.fontFamily).toBe('ARIAL');
    expect(result.effective.preferredLanguage).toBe('es');
    expect(result.lockedFields.has('fontFamily')).toBe(false);

    // Tier 3: Unedited user keys inherit Organization Defaults
    expect(result.effective.displayScale).toBe(125);
    expect(result.effective.textSize).toBe(110);
  });

  it('reconciles cloud vs local user preferences using revision, timestamps, and pending offline overrides', () => {
    const olderLocal = normalizeUserPreferenceRecord('user-42', {
      theme: 'dark',
      revision: 2,
      updatedAt: '2026-11-10T08:00:00.000Z',
      cloudSynced: true,
    });
    const newerRemote = normalizeUserPreferenceRecord('user-42', {
      theme: 'light',
      fontFamily: 'LATO',
      revision: 5,
      updatedAt: '2026-11-11T12:00:00.000Z',
      cloudSynced: true,
    });

    const winner = reconcileUserPreferences('user-42', olderLocal, newerRemote);
    expect(winner?.theme).toBe('light');
    expect(winner?.fontFamily).toBe('LATO');
    expect(winner?.syncStatus).toBe('SYNCED');

    const pendingOfflineLocal = normalizeUserPreferenceRecord('user-42', {
      theme: 'dark',
      displayScale: 150,
      fontFamily: 'ARIAL',
      revision: 4,
      updatedAt: '2026-11-11T09:00:00.000Z',
      pendingSync: true,
      syncStatus: 'PENDING',
      explicitFields: ['theme', 'displayScale', 'fontFamily'],
    });

    const mergedOffline = reconcileUserPreferences('user-42', pendingOfflineLocal, newerRemote);
    expect(mergedOffline?.displayScale).toBe(150);
    expect(mergedOffline?.fontFamily).toBe('ARIAL');
    expect(mergedOffline?.pendingSync).toBe(true);
  });

  it('rejects cross-user and cross-tenant SystemSettings snapshots during IndexedDB/localStorage reconciliation', () => {
    const foreignUserSnapshot = {
      theme: 'light' as const,
      _ownerUserId: 'other-user',
      _ownerTenantId: 'org-1',
      _updatedAt: '2026-11-12T00:00:00.000Z',
      _revision: 99,
    };
    const validUserIdb = {
      theme: 'dark' as const,
      _ownerUserId: 'user-target',
      _ownerTenantId: 'org-1',
      _updatedAt: '2026-11-11T00:00:00.000Z',
      _revision: 3,
    };

    const reconciled = reconcileSystemSettingsSnapshots(
      foreignUserSnapshot,
      validUserIdb,
      'user-target',
      'org-1'
    );
    expect(reconciled?.theme).toBe('dark');
    expect((reconciled as any)?._ownerUserId).toBe('user-target');
  });

  it('persists preferences to Firestore /user_preferences/{userId}, handles offline failures honestly, and retries cleanly', async () => {
    DatabaseConnectionManager.getInstance().setEnvironment('LIVE');

    const saved = await userPersistenceService.saveUserPreferences(
      'live-user-1',
      {
        theme: 'light',
        themeId: 'silver',
        appearanceMode: 'light',
        fontFamily: 'LATO',
        displayScale: 125,
        textSize: 110,
        dockPosition: 'left',
        dynamicIslandMode: 'minimal',
      },
      'LIVE'
    );

    expect(saved.cloudSynced).toBe(true);
    expect(saved.syncStatus).toBe('SYNCED');
    expect(firestoreMockStore.get('user_preferences/live-user-1')).toMatchObject({
      userId: 'live-user-1',
      theme: 'light',
      fontFamily: 'LATO',
      displayScale: 125,
      dockPosition: 'left',
      dynamicIslandMode: 'minimal',
    });

    // Simulate transient network failure -> truthful PENDING offline queue state
    forceFirestoreError = new Error('Simulated Firestore network unavailable');
    const queuedSave = await userPersistenceService.saveUserPreferences(
      'live-user-1',
      { fontFamily: 'ARIAL', displayScale: 150 },
      'LIVE'
    );
    expect(queuedSave.cloudSynced).toBe(false);
    expect(queuedSave.pendingSync).toBe(true);
    expect(queuedSave.syncStatus).toBe('PENDING');
    expect(queuedSave.fontFamily).toBe('ARIAL');

    // Simulate non-network cloud error -> truthful FAILED retryable state
    forceFirestoreError = new Error('Permission denied on Firestore rules');
    const failedSave = await userPersistenceService.saveUserPreferences(
      'live-user-1',
      { fontFamily: 'ARIAL', displayScale: 150 },
      'LIVE'
    );
    expect(failedSave.cloudSynced).toBe(false);
    expect(failedSave.pendingSync).toBe(true);
    expect(failedSave.syncStatus).toBe('FAILED');

    // Recover connectivity and verify retrySync flushes queued override to Firestore
    forceFirestoreError = null;
    const retried = await userPersistenceService.retrySync('live-user-1', 'LIVE');
    expect(retried?.cloudSynced).toBe(true);
    expect(retried?.syncStatus).toBe('SYNCED');
    expect(firestoreMockStore.get('user_preferences/live-user-1')?.fontFamily).toBe('ARIAL');
    expect(firestoreMockStore.get('user_preferences/live-user-1')?.displayScale).toBe(150);
  });

  it('persists Organization Settings Policy to /policies/org_os_policy_{orgId} in Firestore', async () => {
    DatabaseConnectionManager.getInstance().setEnvironment('LIVE');
    const savedPolicy = await userPersistenceService.saveOrganizationPolicy(
      'org-enterprise-7',
      {
        defaultTheme: 'light',
        defaultFontFamily: 'ARIAL',
        enforceFont: true,
        enforceTheme: true,
        updatedBy: 'admin-1',
      },
      'LIVE'
    );

    expect(savedPolicy.organizationId).toBe('org-enterprise-7');
    expect(savedPolicy.enforceTheme).toBe(true);
    expect(firestoreMockStore.get('policies/org_os_policy_org-enterprise-7')).toMatchObject({
      tenantId: 'org-enterprise-7',
      defaultTheme: 'light',
      defaultFontFamily: 'ARIAL',
      enforceTheme: true,
    });
  });

  it('applies resolved preferences to DOM CSS vars/classes and clears outgoing session caches on sign-out', () => {
    const resolved = resolveEffectivePreferences(
      'user-alpha',
      normalizeUserPreferenceRecord('user-alpha', {
        theme: 'light',
        themeId: 'silver',
        appearanceMode: 'light',
        displayScale: 150,
        textSize: 120,
        fontFamily: 'LATO',
        dockPosition: 'right',
        showDesktopIcons: false,
        dynamicIslandMode: 'disabled',
      }),
      null
    );

    const sysSettings = applyResolvedPreferencesToDOMAndRuntime(resolved, {
      tenantId: 'ORION_PLATFORM',
      env: 'LIVE',
    });

    expect(classSet.has('light')).toBe(true);
    expect(styleStore['--orion-display-scale']).toBe('1.5');
    expect(styleStore['--orion-text-scale']).toBe('1.2');
    expect(datasetStore.orionFont).toBe('lato');
    expect(localStorage.getItem('orion_dynamic_island_mode')).toBe('disabled');
    expect(sysSettings.theme).toBe('light');
    expect(sysSettings.displayScale).toBe(150);

    // Sign out must wipe un-scoped session caches cleanly so next user never inherits stale state
    clearActiveRuntimeSessionCaches();
    expect(localStorage.getItem('orion_settings')).toBeNull();
    expect(localStorage.getItem('orion_dynamic_island_mode')).toBeNull();
    expect(localStorage.getItem('orion_theme')).toBeNull();
  });

  it('renders DisplayPreferencesControls with org lock badges for enforced fields', async () => {
    await userPersistenceService.saveOrganizationPolicy(
      'ORION_PLATFORM',
      {
        defaultTheme: 'light',
        enforceTheme: true,
        defaultFontFamily: 'LATO',
        enforceFont: false,
        updatedBy: 'local-admin',
      },
      'DEMO'
    );

    const html = renderToString(React.createElement(DisplayPreferencesControls, { userId: 'local-admin' }));
    expect(html).toContain('Enforced by Organization Policy');
    expect(html).toContain('data-testid="display-font-ARIAL"');
    expect(html).toContain('data-testid="display-theme-light" disabled=""');
    expect(html).toContain('data-testid="preferences-sync-status-banner"');
  });
});
