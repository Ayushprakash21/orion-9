/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * Unit Tests: Incidents, Durable Jobs, Backups, Recovery & Safety Controls
 */

import { describe, it, expect } from 'vitest';
import {
  incidentManager,
  jobManager,
  backupRecoveryService,
  disasterRecoveryModel,
  dataIntegrityService,
  productionSafetyService,
  controlledBackpressureService,
} from '../../operations';

describe('Wave 10 Incidents, Resilience & Safety Controls Suite', () => {
  // --------------------------------------------------------------------------
  // 1. IncidentManager
  // --------------------------------------------------------------------------
  describe('IncidentManager', () => {
    it('declares incident with automated blast radius calculation and timeline ledger', () => {
      const inc = incidentManager.declareIncident({
        tenantId: 'TENANT_A',
        title: 'EDI Gateway Connection Reset',
        description: 'Supplier EDI orders dropping intermittently',
        severity: 'SEV2',
        declaredBy: 'incident_commander@orion.internal',
        impactedTenants: ['TENANT_A', 'TENANT_B'],
        impactedModules: ['orders', 'suppliers', 'edi'],
      });

      expect(inc.id).toBeDefined();
      expect(inc.status).toBe('DETECTED');
      expect(inc.blastRadiusScore).toBeGreaterThan(0);
      expect(inc.timeline.length).toBe(1);
      expect(inc.timeline[0].statusChange).toBe('DETECTED');
    });

    it('advances incident status through lifecycle with timeline auditing', () => {
      const all = incidentManager.getAllIncidents('TENANT_A');
      const inc = all[0];
      expect(inc).toBeDefined();

      const investigated = incidentManager.updateIncidentStatus(
        inc.id,
        'INVESTIGATING',
        'sre_lead@orion.internal',
        'Isolated root cause to carrier reverse proxy failure'
      );
      expect(investigated?.status).toBe('INVESTIGATING');
      expect(investigated?.timeline.length).toBeGreaterThan(1);

      const mitigated = incidentManager.updateIncidentStatus(
        inc.id,
        'MITIGATED',
        'sre_lead@orion.internal',
        'Flipped upstream route to secondary carrier endpoint'
      );
      expect(mitigated?.status).toBe('MITIGATED');
      expect(mitigated?.mitigatedAt).toBeDefined();

      const resolved = incidentManager.updateIncidentStatus(
        inc.id,
        'RESOLVED',
        'sre_lead@orion.internal',
        'Telemetry verified normal for 30 minutes'
      );
      expect(resolved?.status).toBe('RESOLVED');
      expect(resolved?.resolvedAt).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // 2. JobManager
  // --------------------------------------------------------------------------
  describe('JobManager', () => {
    it('deduplicates jobs using idempotency keys', () => {
      const idempKey = `idemp-test-${Date.now()}`;
      const res1 = jobManager.submitJob({
        jobType: 'INVENTORY_REBALANCE',
        idempotencyKey: idempKey,
        tenantId: 'TENANT_A',
        payload: { sku: 'SKU-001', qty: 100 },
      });

      expect(res1.isDuplicate).toBe(false);
      expect(res1.job.state).toBe('CREATED');

      const res2 = jobManager.submitJob({
        jobType: 'INVENTORY_REBALANCE',
        idempotencyKey: idempKey,
        tenantId: 'TENANT_A',
        payload: { sku: 'SKU-001', qty: 100 },
      });

      expect(res2.isDuplicate).toBe(true);
      expect(res2.job.id).toBe(res1.job.id);
    });

    it('handles worker lease acquisition and completion', () => {
      const res = jobManager.submitJob({
        jobType: 'SHIPMENT_DISPATCH_SYNC',
        idempotencyKey: `idemp-lease-${Date.now()}`,
        tenantId: 'TENANT_A',
        payload: { batchId: 'BATCH-99' },
      });

      const lease = jobManager.acquireLease(res.job.id, 'worker-node-01');
      expect(lease.acquired).toBe(true);
      expect(lease.leaseToken).toBeDefined();

      const heartbeat = jobManager.renewHeartbeat(res.job.id, lease.leaseToken!);
      expect(heartbeat).toBe(true);

      const completed = jobManager.completeJob(res.job.id, lease.leaseToken!, { status: 'DISPATCHED' });
      expect(completed).toBe(true);

      const job = jobManager.getJob(res.job.id);
      expect(job?.state).toBe('SUCCEEDED');
      expect(job?.completedAt).toBeDefined();
    });

    it('transitions to DEAD_LETTERED on max retries and supports manual replay', () => {
      const res = jobManager.submitJob({
        jobType: 'CUSTOMS_FILING',
        idempotencyKey: `idemp-dlq-${Date.now()}`,
        tenantId: 'TENANT_A',
        payload: { filingId: 'FILING-101' },
        maxRetries: 2,
      });

      const lease1 = jobManager.acquireLease(res.job.id, 'worker-1');
      jobManager.failJob(res.job.id, lease1.leaseToken!, 'Customs API 500 error');
      expect(jobManager.getJob(res.job.id)?.state).toBe('RETRYING');

      const lease2 = jobManager.acquireLease(res.job.id, 'worker-2');
      jobManager.failJob(res.job.id, lease2.leaseToken!, 'Customs API 500 error persistent');
      expect(jobManager.getJob(res.job.id)?.state).toBe('DEAD_LETTERED');

      // Replay from DLQ
      const replay = jobManager.replayDeadLetterJob(res.job.id, 'ops_admin');
      expect(replay.replayed).toBe(true);
      expect(replay.newJob?.state).toBe('CREATED');
    });
  });

  // --------------------------------------------------------------------------
  // 3. BackupRecoveryService & DisasterRecoveryModel
  // --------------------------------------------------------------------------
  describe('BackupRecoveryService & DisasterRecoveryModel', () => {
    it('creates logical snapshots with cryptographic SHA-256 checksums', () => {
      const snap = backupRecoveryService.createSnapshot({
        tenantId: 'TENANT_A',
        createdBy: 'test_runner',
      });

      expect(snap.id).toBeDefined();
      expect(snap.checksumSha256).toBeDefined();
      expect(snap.verifiedIntegrity).toBe(true);
      expect(snap.totalRecordCount).toBeGreaterThan(0);
    });

    it('runs non-destructive restore simulation before live apply', () => {
      const snaps = backupRecoveryService.getAllSnapshots('GLOBAL');
      expect(snaps.length).toBeGreaterThan(0);

      const sim = backupRecoveryService.verifyRestoreSimulation(snaps[0].id, 'TENANT_A');
      expect(sim.dryRunSimulationPassed).toBe(true);
      expect(sim.checksumMatches).toBe(true);
      expect(sim.discrepancies.length).toBe(0);

      const restore = backupRecoveryService.executeRestore(snaps[0].id, 'TENANT_A', 'platform_admin');
      expect(restore.success).toBe(true);
      expect(restore.auditToken).toBeDefined();
    });

    it('models service dependency tiers with RPO/RTO SLAs and honest cloud failover disclosure', () => {
      const tiers = disasterRecoveryModel.getTiers();
      expect(tiers.length).toBe(4); // Tier 0 to 3

      const tier0 = disasterRecoveryModel.getTier(0);
      expect(tier0?.name).toContain('Foundation');
      expect(tier0?.targetRpoMinutes).toBe(1);
      expect(tier0?.targetRtoMinutes).toBe(5);

      const failover = disasterRecoveryModel.getCloudFailoverStatus();
      expect(failover.multiRegionAutomatedFailover).toBe('UNVERIFIED_WITHOUT_CLOUD_PROVISIONING');
      expect(failover.localEmulatorResilience).toBe('VERIFIED_PASSING');
    });
  });

  // --------------------------------------------------------------------------
  // 4. DataIntegrityService
  // --------------------------------------------------------------------------
  describe('DataIntegrityService', () => {
    it('scans and reports broken foreign keys and negative inventory anomalies', () => {
      const scan = dataIntegrityService.scanIntegrity({
        tenantId: 'TENANT_A',
        purchaseOrders: [
          { id: 'PO-TEST-VALID', supplierId: 'SUPP-001' },
          { id: 'PO-TEST-ORPHAN', supplierId: 'NON_EXISTENT_SUPP' },
        ],
        suppliers: [{ id: 'SUPP-001' }],
        inventory: [
          { id: 'SKU-OK', quantity: 150 },
          { id: 'SKU-DEFICIT', quantity: -5 },
        ],
      });

      expect(scan.findingsCount).toBe(2);
      expect(scan.newFindings.some(f => f.checkType === 'BROKEN_FOREIGN_KEYS')).toBe(true);
      expect(scan.newFindings.some(f => f.checkType === 'NEGATIVE_INVENTORY')).toBe(true);
    });
  });

  // --------------------------------------------------------------------------
  // 5. ProductionSafetyService
  // --------------------------------------------------------------------------
  describe('ProductionSafetyService', () => {
    it('enforces safety locks and emergency kill switches against mutations', () => {
      // Initially normal
      const check1 = productionSafetyService.assertMutationAllowed({
        tenantId: 'TENANT_A',
        isAiAgent: false,
        isWorkflowEngine: false,
        actionType: 'WRITE',
      });
      expect(check1.allowed).toBe(true);

      // Engage AI kill switch
      productionSafetyService.updateControls('TENANT_A', { aiActionKillSwitch: true }, 'sec_lead');
      const checkAi = productionSafetyService.assertMutationAllowed({
        tenantId: 'TENANT_A',
        isAiAgent: true,
        isWorkflowEngine: false,
        actionType: 'WRITE',
      });
      expect(checkAi.allowed).toBe(false);
      expect(checkAi.reason).toContain('AI Action Kill Switch');

      // Reset AI kill switch
      productionSafetyService.updateControls('TENANT_A', { aiActionKillSwitch: false }, 'sec_lead');

      // Engage Production Write Lock
      productionSafetyService.updateControls('TENANT_A', { productionWriteLock: true }, 'sec_lead');
      const checkWrite = productionSafetyService.assertMutationAllowed({
        tenantId: 'TENANT_A',
        isAiAgent: false,
        isWorkflowEngine: false,
        actionType: 'WRITE',
        userRole: 'standard_buyer',
      });
      expect(checkWrite.allowed).toBe(false);
      expect(checkWrite.reason).toContain('Production Write Lock');

      // Reset Production Write Lock
      productionSafetyService.updateControls('TENANT_A', { productionWriteLock: false }, 'sec_lead');
    });
  });

  // --------------------------------------------------------------------------
  // 6. ControlledBackpressureService
  // --------------------------------------------------------------------------
  describe('ControlledBackpressureService', () => {
    it('manages circuit breaker lifecycle: CLOSED -> trips to OPEN -> manual reset', () => {
      const serviceName = 'ERP_SAP_CONNECTOR';
      expect(controlledBackpressureService.canExecute(serviceName)).toBe(true);

      // Record failures up to threshold (5)
      for (let i = 0; i < 5; i++) {
        controlledBackpressureService.recordFailure(serviceName);
      }

      const status = controlledBackpressureService.getStatus(serviceName);
      expect(status.state).toBe('OPEN');
      expect(controlledBackpressureService.canExecute(serviceName)).toBe(false);

      // Manually reset
      controlledBackpressureService.manuallyReset(serviceName);
      expect(controlledBackpressureService.canExecute(serviceName)).toBe(true);
      expect(controlledBackpressureService.getStatus(serviceName).state).toBe('CLOSED');
    });
  });
});
