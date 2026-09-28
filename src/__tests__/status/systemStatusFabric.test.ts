/**
 * ORION-9 UNIFIED SYSTEM STATUS FABRIC SPECIFICATION
 * 
 * Exhaustive 30-Point Test Suite covering:
 * 1.  Runtime healthy
 * 2.  Runtime unknown
 * 3.  Scheduler healthy
 * 4.  Scheduler failure
 * 5.  Scheduler stale
 * 6.  Firestore connected
 * 7.  Firestore permission denied
 * 8.  Firestore offline
 * 9.  Listener connected
 * 10. Listener empty
 * 11. Listener stale
 * 12. Listener error
 * 13. Listener offline
 * 14. Freshness calculation
 * 15. Fresh -> aging -> stale transitions
 * 16. Graph ready
 * 17. Graph empty
 * 18. Graph error
 * 19. Automation healthy
 * 20. Automation failure
 * 21. Overall HEALTHY
 * 22. Overall DEGRADED
 * 23. Overall ERROR
 * 24. Overall OFFLINE
 * 25. Overall UNKNOWN
 * 26. DEMO/LIVE isolation
 * 27. Tenant isolation
 * 28. Environment switching
 * 29. Cleanup/unsubscribe
 * 30. Duplicate listener prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  systemStatusEngine,
  systemStatusRegistry,
  sanitizeErrorMessage,
  FRESHNESS_THRESHOLDS,
  SystemStatusSnapshot,
} from '../../core/systemStatus';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import { realtimeSubscriptionManager } from '../../core/visualization/RealtimeSubscriptionManager';
import { DemoPersistentSchedulerService } from '../../services/demo/DemoPersistentSchedulerService';
import { workflowObservability } from '../../workflows/WorkflowObservability';
import { WorkflowApprovalEngine } from '../../workflows/WorkflowApprovalEngine';

describe('ORION-9 — Unified System Status & Runtime Health Fabric', () => {
  const TENANT_A = 'tenant-alpha-001';
  const TENANT_B = 'tenant-beta-002';

  beforeEach(() => {
    vi.clearAllMocks();
    systemStatusRegistry.reset();
  });

  afterEach(() => {
    systemStatusRegistry.reset();
  });

  // =========================================================================
  // 1 & 2: RUNTIME HEALTH
  // =========================================================================
  describe('Runtime Health', () => {
    it('1. reports runtime healthy when application, kernel, and network are operational', () => {
      systemStatusRegistry.setRuntimeProvider(() => ({
        status: 'HEALTHY',
        isOnline: true,
        applicationInitialized: true,
        kernelInitialized: true,
        message: 'Runtime operational — application, kernel, and network online',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.runtime.status).toBe('HEALTHY');
      expect(snapshot.runtime.isOnline).toBe(true);
      expect(snapshot.runtime.message).toContain('Runtime operational');
    });

    it('2. reports runtime UNKNOWN when telemetry is unavailable and never fakes HEALTHY', () => {
      systemStatusRegistry.setRuntimeProvider(() => ({
        status: 'UNKNOWN',
        applicationInitialized: false,
        kernelInitialized: false,
        message: 'Runtime status unavailable — runtime telemetry has not been established',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.runtime.status).toBe('UNKNOWN');
      expect(snapshot.runtime.message).toContain('runtime telemetry has not been established');
      expect(snapshot.overallStatus).toBe('UNKNOWN');
    });
  });

  // =========================================================================
  // 3, 4, 5: SCHEDULER HEALTH
  // =========================================================================
  describe('Scheduler Health', () => {
    it('3. reports scheduler healthy when DEMO scheduler is RUNNING at 25 pkgs/hr', () => {
      systemStatusRegistry.setSchedulerProvider(() => ({
        status: 'HEALTHY',
        configured: true,
        enabled: true,
        schedulerMode: 'CLOUDFLARE_CRON',
        totalPackagesGenerated: 150,
        message: 'Demo scheduler running — hourly batch rate: 25 pkgs/hr',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'DEMO');
      expect(snapshot.scheduler.status).toBe('HEALTHY');
      expect(snapshot.scheduler.enabled).toBe(true);
      expect(snapshot.scheduler.message).toContain('hourly batch rate: 25 pkgs/hr');
    });

    it('4. reports scheduler ERROR with sanitized error message when scheduler fails', () => {
      systemStatusRegistry.setSchedulerProvider(() => ({
        status: 'ERROR',
        lastFailedExecution: 'Lease expired for batch DEMO-20260928T1200Z',
        consecutiveFailures: 2,
        message: 'Demo scheduler generation lease error occurred',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'DEMO');
      expect(snapshot.scheduler.status).toBe('ERROR');
      expect(snapshot.scheduler.consecutiveFailures).toBe(2);
      expect(snapshot.overallStatus).toBe('ERROR');
    });

    it('5. transitions scheduler to DEGRADED and isStale=true when last run exceeds 2 hours', () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
      systemStatusRegistry.setSchedulerProvider(() => ({
        status: 'DEGRADED',
        isStale: true,
        lastSuccessfulRun: threeHoursAgo,
        message: 'Demo scheduler stale — no successful generation run in > 2 hours',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'DEMO');
      expect(snapshot.scheduler.status).toBe('DEGRADED');
      expect(snapshot.scheduler.isStale).toBe(true);
      expect(snapshot.scheduler.message).toContain('stale');
    });
  });

  // =========================================================================
  // 6, 7, 8: FIRESTORE HEALTH
  // =========================================================================
  describe('Firestore Health', () => {
    it('6. reports Firestore connected with latency measurement', () => {
      systemStatusRegistry.setFirestoreProvider(() => ({
        status: 'HEALTHY',
        configured: true,
        initialized: true,
        connectionStatus: 'CONNECTED',
        latencyMs: 34,
        message: 'Firestore connected — active environment: LIVE',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.firestore.status).toBe('HEALTHY');
      expect(snapshot.firestore.latencyMs).toBe(34);
      expect(snapshot.firestore.connectionStatus).toBe('CONNECTED');
    });

    it('7. reports Firestore permission denied safely without leaking internal paths', () => {
      const sanitized = sanitizeErrorMessage({
        code: 'permission-denied',
        message: 'Missing or insufficient permissions on /databases/(default)/documents/tenants/tenant-1/orders',
      });
      expect(sanitized.errorCode).toBe('PERMISSION_DENIED');
      expect(sanitized.errorMessage).toBe('Firestore permission denied');

      systemStatusRegistry.setFirestoreProvider(() => ({
        status: 'ERROR',
        errorCode: sanitized.errorCode,
        errorMessage: sanitized.errorMessage,
        message: 'Firestore access denied by security rules',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.firestore.status).toBe('ERROR');
      expect(snapshot.firestore.errorCode).toBe('PERMISSION_DENIED');
      expect(snapshot.firestore.errorMessage).toBe('Firestore permission denied');
      expect(snapshot.overallStatus).toBe('ERROR');
    });

    it('8. reports Firestore offline without crashing or reporting fake connected state', () => {
      systemStatusRegistry.setFirestoreProvider(() => ({
        status: 'OFFLINE',
        connectionStatus: 'DISCONNECTED',
        message: 'Firestore disconnected — offline storage active',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.firestore.status).toBe('OFFLINE');
      expect(snapshot.overallStatus).toBe('OFFLINE');
    });
  });

  // =========================================================================
  // 9 - 13: LISTENER HEALTH
  // =========================================================================
  describe('Listener Health Across Canonical Domains', () => {
    it('9. reports listener CONNECTED with record count for active collections', () => {
      systemStatusRegistry.setListenerProvider(() => ({
        inventory: {
          status: 'CONNECTED',
          recordCount: 42,
          lastSnapshotAt: Date.now() - 4000,
          message: 'Connected — 42 records, listening on inventory',
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.listeners.inventory.status).toBe('CONNECTED');
      expect(snapshot.listeners.inventory.recordCount).toBe(42);
      expect(snapshot.listeners.inventory.message).toContain('42 records');
    });

    it('10. treats listener CONNECTED + EMPTY as valid and NOT an error', () => {
      systemStatusRegistry.setListenerProvider(() => ({
        purchaseOrders: {
          status: 'EMPTY',
          recordCount: 0,
          lastSnapshotAt: Date.now() - 1000,
          message: 'Connected — 0 records in purchase_orders',
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.listeners.purchaseOrders.status).toBe('EMPTY');
      expect(snapshot.listeners.purchaseOrders.recordCount).toBe(0);
      // Valid empty state must NOT trigger ERROR or DEGRADED in overall status
      expect(snapshot.overallStatus).not.toBe('ERROR');
    });

    it('11. reports listener STALE when last snapshot timestamp exceeds threshold', () => {
      systemStatusRegistry.setListenerProvider(() => ({
        shipments: {
          status: 'STALE',
          isStale: true,
          recordCount: 15,
          lastSnapshotAt: Date.now() - 45 * 60 * 1000, // 45 mins ago
          message: 'Listener stale for shipments',
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.listeners.shipments.status).toBe('STALE');
      expect(snapshot.listeners.shipments.isStale).toBe(true);
      expect(snapshot.overallStatus).toBe('DEGRADED');
    });

    it('12. reports listener ERROR with safe sanitized message on snapshot failure', () => {
      systemStatusRegistry.setListenerProvider(() => ({
        exceptions: {
          status: 'ERROR',
          errorCode: 'LISTENER_ERROR',
          errorMessage: 'Snapshot listener error occurred',
          message: 'Listener failed for exceptions',
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.listeners.exceptions.status).toBe('ERROR');
      expect(snapshot.listeners.exceptions.errorCode).toBe('LISTENER_ERROR');
      expect(snapshot.overallStatus).toBe('ERROR');
    });

    it('13. reports listener OFFLINE when network connection is severed', () => {
      systemStatusRegistry.setListenerProvider(() => ({
        controlTower: {
          status: 'OFFLINE',
          message: 'Listener offline for control_tower',
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.listeners.controlTower.status).toBe('OFFLINE');
    });
  });

  // =========================================================================
  // 14 & 15: DATA FRESHNESS & TRANSITIONS
  // =========================================================================
  describe('Data Freshness', () => {
    it('14. calculates exact freshness age in milliseconds from last successful update', () => {
      const now = Date.now();
      const updated50sAgo = now - 50_000;

      systemStatusRegistry.setListenerProvider(() => ({
        inventory: {
          lastSuccessfulUpdateAt: updated50sAgo,
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.freshness.inventory.status).toBe('FRESH');
      expect(snapshot.freshness.inventory.ageMs).toBeGreaterThanOrEqual(49_000);
      expect(snapshot.freshness.inventory.message).toContain('Data is fresh');
    });

    it('15. verifies fresh -> aging -> stale transitions deterministically', () => {
      const now = Date.now();

      // Fresh: <= 2 mins
      systemStatusRegistry.setFreshnessProvider(() => ({
        inventory: {
          status: 'FRESH',
          ageMs: 45_000,
          thresholdFreshMs: FRESHNESS_THRESHOLDS.FRESH_MAX_MS,
          thresholdAgingMs: FRESHNESS_THRESHOLDS.AGING_MAX_MS,
          message: 'Data is fresh (updated 45s ago)',
        },
        purchaseOrders: {
          status: 'AGING',
          ageMs: 300_000, // 5 mins
          thresholdFreshMs: FRESHNESS_THRESHOLDS.FRESH_MAX_MS,
          thresholdAgingMs: FRESHNESS_THRESHOLDS.AGING_MAX_MS,
          message: 'Data is aging (updated 5m ago)',
        },
        shipments: {
          status: 'STALE',
          ageMs: 900_000, // 15 mins
          thresholdFreshMs: FRESHNESS_THRESHOLDS.FRESH_MAX_MS,
          thresholdAgingMs: FRESHNESS_THRESHOLDS.AGING_MAX_MS,
          message: 'Data is stale (last update 15m ago)',
        },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.freshness.inventory.status).toBe('FRESH');
      expect(snapshot.freshness.purchaseOrders.status).toBe('AGING');
      expect(snapshot.freshness.shipments.status).toBe('STALE');
      expect(snapshot.overallStatus).toBe('DEGRADED');
    });
  });

  // =========================================================================
  // 16, 17, 18: GRAPH HEALTH
  // =========================================================================
  describe('Graph Health', () => {
    it('16. reports graphs READY when source state is streaming', () => {
      systemStatusRegistry.setGraphProvider(() => ({
        status: 'READY',
        graphsInitialized: true,
        sourceStateAvailable: true,
        seriesCount: 6,
        message: 'Graphs ready — live time series streaming',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.graphs.status).toBe('READY');
      expect(snapshot.graphs.seriesCount).toBe(6);
      expect(snapshot.graphs.sourceStateAvailable).toBe(true);
    });

    it('17. reports graphs EMPTY when 0 records exist without treating it as an error', () => {
      systemStatusRegistry.setGraphProvider(() => ({
        status: 'EMPTY',
        graphsInitialized: true,
        sourceStateAvailable: true,
        seriesCount: 0,
        message: 'Graphs ready — 0 source records available',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.graphs.status).toBe('EMPTY');
      expect(snapshot.graphs.seriesCount).toBe(0);
      expect(snapshot.overallStatus).not.toBe('ERROR');
    });

    it('18. reports graphs ERROR when underlying data feed fails without generating fake series', () => {
      systemStatusRegistry.setGraphProvider(() => ({
        status: 'ERROR',
        sourceStateAvailable: false,
        message: 'Graph rendering degraded — underlying listener error',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.graphs.status).toBe('ERROR');
      expect(snapshot.graphs.sourceStateAvailable).toBe(false);
      expect(snapshot.overallStatus).toBe('ERROR');
    });
  });

  // =========================================================================
  // 19 & 20: AUTOMATION HEALTH
  // =========================================================================
  describe('Automation Health', () => {
    it('19. reports automation healthy with workflow execution metrics', () => {
      systemStatusRegistry.setAutomationProvider(() => ({
        status: 'HEALTHY',
        mode: 'COPILOT',
        initialized: true,
        enabled: true,
        totalTriggered: 12,
        totalCompleted: 12,
        totalFailed: 0,
        pendingApprovalsCount: 0,
        message: 'Automation operational — 12 workflows completed',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.automation.status).toBe('HEALTHY');
      expect(snapshot.automation.totalCompleted).toBe(12);
      expect(snapshot.automation.pendingApprovalsCount).toBe(0);
    });

    it('20. detects workflow failures and pending approvals transitioning to DEGRADED', () => {
      systemStatusRegistry.setAutomationProvider(() => ({
        status: 'DEGRADED',
        mode: 'AUTOPILOT',
        totalTriggered: 10,
        totalCompleted: 7,
        totalFailed: 1,
        pendingApprovalsCount: 2,
        message: '2 workflows pending operator approval',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.automation.status).toBe('DEGRADED');
      expect(snapshot.automation.pendingApprovalsCount).toBe(2);
      expect(snapshot.automation.totalFailed).toBe(1);
      expect(snapshot.overallStatus).toBe('DEGRADED');
    });
  });

  // =========================================================================
  // 21 - 25: OVERALL STATUS DETERMINISTIC AGGREGATION
  // =========================================================================
  describe('Overall Status Aggregation', () => {
    it('21. computes overall HEALTHY when all critical subsystems are operational', () => {
      systemStatusRegistry.setRuntimeProvider(() => ({ status: 'HEALTHY' }));
      systemStatusRegistry.setFirestoreProvider(() => ({ status: 'HEALTHY' }));
      systemStatusRegistry.setSchedulerProvider(() => ({ status: 'HEALTHY' }));
      systemStatusRegistry.setGraphProvider(() => ({ status: 'READY' }));
      systemStatusRegistry.setAutomationProvider(() => ({ status: 'HEALTHY' }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.overallStatus).toBe('HEALTHY');
    });

    it('22. computes overall DEGRADED when a non-critical subsystem is stale or aging', () => {
      systemStatusRegistry.setFreshnessProvider(() => ({
        inventory: { status: 'AGING', ageMs: 300_000, domain: 'inventory', lastUpdatedAt: Date.now() - 300_000, thresholdFreshMs: 120_000, thresholdAgingMs: 600_000, message: 'aging' },
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.overallStatus).toBe('DEGRADED');
    });

    it('23. computes overall ERROR when any critical subsystem experiences a real failure', () => {
      systemStatusRegistry.setFirestoreProvider(() => ({
        status: 'ERROR',
        errorCode: 'PERMISSION_DENIED',
        errorMessage: 'Firestore permission denied',
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.overallStatus).toBe('ERROR');
    });

    it('24. computes overall OFFLINE when network or runtime connectivity is disconnected', () => {
      systemStatusRegistry.setRuntimeProvider(() => ({
        status: 'OFFLINE',
        isOnline: false,
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.overallStatus).toBe('OFFLINE');
    });

    it('25. computes overall UNKNOWN when critical telemetry is uninitialized', () => {
      systemStatusRegistry.setRuntimeProvider(() => ({
        status: 'UNKNOWN',
        applicationInitialized: false,
      }));

      const snapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snapshot.overallStatus).toBe('UNKNOWN');
    });
  });

  // =========================================================================
  // 26 - 30: ISOLATION, ENVIRONMENT & SUBSCRIPTION INTEGRITY
  // =========================================================================
  describe('Isolation & Subscription Integrity', () => {
    it('26. enforces DEMO vs LIVE isolation without cross-environment leakage', () => {
      const demoSnapshot = systemStatusEngine.getSnapshot(TENANT_A, 'DEMO');
      const liveSnapshot = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');

      expect(demoSnapshot.environment).toBe('DEMO');
      expect(liveSnapshot.environment).toBe('LIVE');
      expect(demoSnapshot.scheduler.source).toBe('demo_persistent_scheduler');
      expect(liveSnapshot.scheduler.source).toBe('cloudflare_cron_trigger');
    });

    it('27. enforces tenant isolation ensuring Tenant A telemetry is scoped to Tenant A', () => {
      systemStatusRegistry.setListenerProvider((tenantId) => {
        if (tenantId === TENANT_A) {
          return { inventory: { recordCount: 100, tenantId: TENANT_A } };
        }
        return { inventory: { recordCount: 5, tenantId: TENANT_B } };
      });

      const snapshotA = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      const snapshotB = systemStatusEngine.getSnapshot(TENANT_B, 'LIVE');

      expect(snapshotA.tenantId).toBe(TENANT_A);
      expect(snapshotA.listeners.inventory.recordCount).toBe(100);
      expect(snapshotB.tenantId).toBe(TENANT_B);
      expect(snapshotB.listeners.inventory.recordCount).toBe(5);
    });

    it('28. handles environment switching by recomputing status for the target environment', () => {
      const snap1 = systemStatusEngine.getSnapshot(TENANT_A, 'DEMO');
      expect(snap1.environment).toBe('DEMO');

      const snap2 = systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      expect(snap2.environment).toBe('LIVE');
    });

    it('29. verifies registry subscribe and cleanup teardown works reliably', () => {
      let callCount = 0;
      const unsubscribe = systemStatusRegistry.subscribe(() => {
        callCount++;
      });

      systemStatusRegistry.notify();
      expect(callCount).toBe(1);

      unsubscribe();
      systemStatusRegistry.notify();
      expect(callCount).toBe(1); // No further calls after unsubscribe
    });

    it('30. prevents duplicate Firestore listener creation across multiple status queries', () => {
      const initialListeners = dbManager.getState().activeListenersCount;

      // Call getSnapshot multiple times
      systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');
      systemStatusEngine.getSnapshot(TENANT_A, 'LIVE');

      const postListeners = dbManager.getState().activeListenersCount;
      expect(postListeners).toBe(initialListeners); // Exactly 0 new listeners created!
    });
  });
});
