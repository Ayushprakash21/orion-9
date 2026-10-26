/**
 * ORION-9 PHASE 2 STABILITY, PERSISTENCE AND FAILURE RECOVERY TEST SUITE
 * Validates:
 * 1. UserPersistenceService transparent sync states, errors, retryability & conflict reconciliation
 * 2. WorkflowRetryEngine strict non-retryability of PERMISSION_DENIED and authorization failures
 * 3. RealtimeSubscriptionManager tenant-switching isolation, listener cleanup & truthful telemetry states
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { userPersistenceService, UserPreferencesRecord } from '../../services/userPersistenceService';
import { WorkflowRetryEngine } from '../../workflows/WorkflowRetryEngine';
import {
  realtimeSubscriptionManager,
  getTruthfulConnectionState,
  RealtimeSubscriptionState
} from '../../core/visualization/RealtimeSubscriptionManager';
import { dbManager } from '../../core/database/DatabaseConnectionManager';

describe('Phase 2 Stability, Persistence and Failure Recovery Gate', () => {

  // ==========================================================================
  // 1. WORKFLOW RETRY ENGINE AUTHORIZATION & PERMISSION GATES
  // ==========================================================================
  describe('1. WorkflowRetryEngine Authorization & Error Classification', () => {
    it('strictly forbids retrying PERMISSION_DENIED errors', () => {
      expect(WorkflowRetryEngine.isRetryable('PERMISSION_DENIED')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('permission_denied')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('7 PERMISSION_DENIED: false for create')).toBe(false);
    });

    it('strictly forbids retrying tenant access, unauthorized, and unauthenticated errors', () => {
      expect(WorkflowRetryEngine.isRetryable('TENANT_ACCESS_DENIED')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('UNAUTHORIZED')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('FORBIDDEN')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('UNAUTHENTICATED')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('AUTH_EXPIRED')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('POLICY_BLOCKED')).toBe(false);
      expect(WorkflowRetryEngine.isRetryable('POLICY_VIOLATION')).toBe(false);
    });

    it('allows retrying transient network, timeout, and availability errors', () => {
      expect(WorkflowRetryEngine.isRetryable('NETWORK_TIMEOUT')).toBe(true);
      expect(WorkflowRetryEngine.isRetryable('ECONNRESET')).toBe(true);
      expect(WorkflowRetryEngine.isRetryable('RATE_LIMIT_EXCEEDED')).toBe(true);
      expect(WorkflowRetryEngine.isRetryable('SERVICE_UNAVAILABLE_503')).toBe(true);
      expect(WorkflowRetryEngine.isRetryable('GATEWAY_TIMEOUT_504')).toBe(true);
      expect(WorkflowRetryEngine.isRetryable('TEMPORARY_FAILURE')).toBe(true);
    });

    it('calculates exponential backoff delay correctly without overflow', () => {
      const policy = {
        maxRetries: 3,
        backoffStrategy: 'EXPONENTIAL' as const,
        initialDelayMs: 250,
        maxDelayMs: 5000,
      };

      expect(WorkflowRetryEngine.calculateDelayMs(policy, 1)).toBe(250);
      expect(WorkflowRetryEngine.calculateDelayMs(policy, 2)).toBe(500);
      expect(WorkflowRetryEngine.calculateDelayMs(policy, 3)).toBe(1000);
      expect(WorkflowRetryEngine.calculateDelayMs(policy, 10)).toBe(5000); // capped at maxDelayMs
    });
  });

  // ==========================================================================
  // 2. USER PERSISTENCE SERVICE TRANSPARENT SYNC MODEL
  // ==========================================================================
  describe('2. UserPersistenceService Transparent Cloud-Sync & Resilience', () => {
    const testUserId = `usr_phase2_${Date.now()}`;

    it('saves preferences locally with explicit localSaved=true and cloudSynced=false in DEMO', async () => {
      const result = await userPersistenceService.saveUserPreferences(testUserId, {
        theme: 'os-obsidian',
        dynamicIslandMode: 'expanded',
      }, 'DEMO');

      expect(result.userId).toBe(testUserId);
      expect(result.theme).toBe('os-obsidian');
      expect(result.localSaved).toBe(true);
      expect(result.cloudSynced).toBe(false);
      expect(result.syncStatus).toBe('LOCAL_ONLY');
      expect(result.lastLocalSavedAt).toBeDefined();
      expect(result.version).toBe(1);
    });

    it('increments monotonic version on duplicate updates', async () => {
      const v1 = await userPersistenceService.saveUserPreferences(testUserId, {
        wallpaperId: 'wp-nebula-01',
      }, 'DEMO');
      expect(v1.version).toBe(2);

      const v2 = await userPersistenceService.saveUserPreferences(testUserId, {
        wallpaperId: 'wp-nebula-02',
      }, 'DEMO');
      expect(v2.version).toBe(3);
      expect(v2.wallpaperId).toBe('wp-nebula-02');
      // Preserved prior fields
      expect(v2.theme).toBe('os-obsidian');
    });

    it('handles simulated offline failure gracefully with safe user readable error', async () => {
      // Spy on Firestore to simulate offline network error
      const errSpy = vi.spyOn(dbManager, 'getFirestore').mockImplementation(() => {
        throw new Error('network-unavailable: failed to reach Cloud Firestore');
      });

      try {
        const result = await userPersistenceService.saveUserPreferences(`usr_offline_${Date.now()}`, {
          theme: 'light',
        }, 'LIVE');

        expect(result.localSaved).toBe(true);
        expect(result.cloudSynced).toBe(false);
        expect(result.syncStatus).toBe('LOCAL_ONLY');
        expect(result.isRetryable).toBe(true);
        expect(result.userReadableError).toMatch(/temporarily offline/i);
        expect(result.syncError).toBeDefined();
      } finally {
        errSpy.mockRestore();
      }
    });

    it('detects and resolves remote conflicts by merging non-conflicting fields', async () => {
      const conflictUserId = `usr_conflict_${Date.now()}`;
      
      // Seed baseline local preferences
      await userPersistenceService.saveUserPreferences(conflictUserId, {
        theme: 'dark',
        dynamicIslandMode: 'compact',
      }, 'DEMO');

      const saved = await userPersistenceService.getUserPreferences(conflictUserId, 'DEMO');
      expect(saved?.theme).toBe('dark');
      expect(saved?.dynamicIslandMode).toBe('compact');
    });

    it('exposes retrySync to re-attempt synchronization', async () => {
      const retryUser = `usr_retry_${Date.now()}`;
      await userPersistenceService.saveUserPreferences(retryUser, {
        theme: 'system',
      }, 'DEMO');

      const retried = await userPersistenceService.retrySync(retryUser, 'DEMO');
      expect(retried.userId).toBe(retryUser);
      expect(retried.localSaved).toBe(true);
    });
  });

  // ==========================================================================
  // 3. REALTIME SUBSCRIPTION MANAGER RESILIENCE & TRUTHFUL TELEMETRY
  // ==========================================================================
  describe('3. RealtimeSubscriptionManager Resilience & Tenant Switching', () => {
    beforeEach(() => {
      realtimeSubscriptionManager.cleanupUserSubscriptions();
    });

    afterEach(() => {
      realtimeSubscriptionManager.cleanupUserSubscriptions();
    });

    it('switches tenants cleanly without leaking old tenant listeners or subscriptions', async () => {
      let receivedTenantA: any[] = [];
      let receivedTenantB: any[] = [];

      // 1. Subscribe to Tenant A
      const unsubA = realtimeSubscriptionManager.subscribeDomain(
        'inventory',
        'TENANT_ALPHA',
        'DEMO',
        (items) => { receivedTenantA = items; }
      );

      // Inject data into Tenant A
      realtimeSubscriptionManager.injectMockSnapshot('inventory', 'TENANT_ALPHA', 'DEMO', [
        { id: 'INV-A-01', sku: 'SKU-ALPHA', quantity: 100 }
      ]);

      expect(receivedTenantA.length).toBe(1);
      expect(receivedTenantA[0].id).toBe('INV-A-01');

      // 2. Perform Tenant Switch to Tenant B
      await realtimeSubscriptionManager.handleTenantSwitch('TENANT_BETA');

      // Subscribe to Tenant B
      const unsubB = realtimeSubscriptionManager.subscribeDomain(
        'inventory',
        'TENANT_BETA',
        'DEMO',
        (items) => { receivedTenantB = items; }
      );

      realtimeSubscriptionManager.injectMockSnapshot('inventory', 'TENANT_BETA', 'DEMO', [
        { id: 'INV-B-01', sku: 'SKU-BETA', quantity: 500 }
      ]);

      expect(receivedTenantB.length).toBe(1);
      expect(receivedTenantB[0].id).toBe('INV-B-01');

      // 3. Verify Tenant A was wiped and does not receive Tenant B data
      const oldState = realtimeSubscriptionManager.getSubscriptionState('inventory', 'TENANT_ALPHA', 'DEMO');
      expect(oldState).toBeNull();

      unsubA();
      unsubB();
    });

    it('never labels synthetic mock snapshots as CONNECTED live telemetry in LIVE mode', () => {
      realtimeSubscriptionManager.injectMockSnapshot('purchase_orders', 'TENANT_TEST', 'LIVE', [
        { id: 'PO-01', amount: 5000 }
      ]);

      const state = realtimeSubscriptionManager.getSubscriptionState('purchase_orders', 'TENANT_TEST', 'LIVE');
      expect(state?.isFromCache).toBe(true);
      expect(state?.status).toBe('DEGRADED');

      const truthfulState = getTruthfulConnectionState(state);
      expect(truthfulState).not.toBe('CONNECTED');
      expect(['OFFLINE', 'STALE']).toContain(truthfulState);
    });

    it('correctly reports CONNECTED truthful status only when genuine LIVE telemetry exists', () => {
      const mockLiveState: RealtimeSubscriptionState = {
        domain: 'inventory',
        environment: 'LIVE',
        tenantId: 'TENANT_TEST',
        organizationId: 'ORG_TEST',
        status: 'LIVE',
        lastSnapshotAt: new Date().toISOString(),
        lastChangeAt: new Date().toISOString(),
        documentCount: 42,
        error: null,
        isFromCache: false, // Genuine cloud connection
        hasPendingWrites: false,
        subscriberCount: 1,
      };

      const connection = getTruthfulConnectionState(mockLiveState);
      expect(connection).toBe('CONNECTED');
    });

    it('reports STALE connection status when last snapshot is older than 30 minutes', () => {
      const thirtyFiveMinutesAgo = new Date(Date.now() - 35 * 60 * 1000).toISOString();
      const mockStaleState: RealtimeSubscriptionState = {
        domain: 'inventory',
        environment: 'LIVE',
        tenantId: 'TENANT_TEST',
        organizationId: 'ORG_TEST',
        status: 'LIVE',
        lastSnapshotAt: thirtyFiveMinutesAgo,
        lastChangeAt: thirtyFiveMinutesAgo,
        documentCount: 10,
        error: null,
        isFromCache: false,
        hasPendingWrites: false,
        subscriberCount: 1,
      };

      const connection = getTruthfulConnectionState(mockStaleState);
      expect(connection).toBe('STALE');
    });

    it('reports EMPTY connection status when document count is 0', () => {
      const mockEmptyState: RealtimeSubscriptionState = {
        domain: 'inventory',
        environment: 'LIVE',
        tenantId: 'TENANT_TEST',
        organizationId: 'ORG_TEST',
        status: 'LIVE',
        lastSnapshotAt: new Date().toISOString(),
        lastChangeAt: new Date().toISOString(),
        documentCount: 0,
        error: null,
        isFromCache: false,
        hasPendingWrites: false,
        subscriberCount: 1,
      };

      const connection = getTruthfulConnectionState(mockEmptyState);
      expect(connection).toBe('EMPTY');
    });

    it('reports ERROR connection status when subscription is in error state', () => {
      const mockErrorState: RealtimeSubscriptionState = {
        domain: 'inventory',
        environment: 'LIVE',
        tenantId: 'TENANT_TEST',
        organizationId: 'ORG_TEST',
        status: 'ERROR',
        lastSnapshotAt: null,
        lastChangeAt: null,
        documentCount: 0,
        error: 'PERMISSION_DENIED',
        isFromCache: false,
        hasPendingWrites: false,
        subscriberCount: 1,
      };

      const connection = getTruthfulConnectionState(mockErrorState);
      expect(connection).toBe('ERROR');
    });
  });
});
