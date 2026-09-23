/**
 * ORION-9 PART 4 — TRACK 10: RESILIENCE, DISASTER RECOVERY & BUSINESS CONTINUITY
 * Comprehensive Operations Test Suite: Resilience, DR, Quarantine, Runbooks & Governance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resilienceService } from '../../operations/ResilienceService';
import { fencingTokenManager } from '../../enterprise/failover/FencingTokenManager';
import { regionalFailoverOrchestrator } from '../../enterprise/failover/RegionalFailoverOrchestrator';

describe('Part 4 Track 10: Resilience, Disaster Recovery & Business Continuity Suite', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    fencingTokenManager.clear();
    regionalFailoverOrchestrator.clear();
  });

  // --------------------------------------------------------------------------
  // 1. Failure Classification Engine
  // --------------------------------------------------------------------------
  describe('Failure Classification Engine', () => {
    it('classifies security/permission errors as non-retryable FAIL_CLOSED security failures', () => {
      const err = new Error('PERMISSION_DENIED: User lacks tenant access boundary');
      const res = resilienceService.classifyFailure(err);

      expect(res.failureDomain).toBe('SECURITY');
      expect(res.failureClass).toBe('SECURITY_FAILURE');
      expect(res.isRetryable).toBe(false);
      expect(res.recommendedAction).toBe('FAIL_CLOSED');
    });

    it('classifies data corruption & negative inventory as QUARANTINE_AND_RECONCILE', () => {
      const err = new Error('Schema corruption: Negative inventory anomaly detected');
      const res = resilienceService.classifyFailure(err);

      expect(res.failureDomain).toBe('DATABASE');
      expect(res.failureClass).toBe('DATA_CORRUPTION');
      expect(res.isRetryable).toBe(false);
      expect(res.requiresQuarantine).toBe(true);
      expect(res.recommendedAction).toBe('QUARANTINE_AND_RECONCILE');
    });

    it('classifies SAP gateway 503 errors as DEPENDENCY_FAILURE with CIRCUIT_TRIP', () => {
      const err = new Error('SAP ERP Gateway 503 Service Unavailable');
      const res = resilienceService.classifyFailure(err);

      expect(res.failureDomain).toBe('EXTERNAL_SYSTEM');
      expect(res.failureClass).toBe('DEPENDENCY_FAILURE');
      expect(res.isRetryable).toBe(true);
      expect(res.recommendedAction).toBe('CIRCUIT_TRIP');
    });

    it('classifies transient socket timeouts as RETRY_WITH_BACKOFF', () => {
      const err = new Error('ETIMEDOUT: Connection reset by peer transient');
      const res = resilienceService.classifyFailure(err);

      expect(res.failureDomain).toBe('NETWORK');
      expect(res.failureClass).toBe('TRANSIENT');
      expect(res.isRetryable).toBe(true);
      expect(res.recommendedAction).toBe('RETRY_WITH_BACKOFF');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Health-Driven Governed Recovery Decision Engine
  // --------------------------------------------------------------------------
  describe('Health-Driven Governed Recovery Decision Engine', () => {
    it('evaluates recovery decisions and issues fencing tokens for regional cutover', () => {
      const decision = resilienceService.evaluateRecoveryDecision({
        tenantId,
        targetComponent: 'INVENTORY_WRITER',
        errorContext: new Error('Regional network partition fence_breach'),
        actor: 'sre_leader'
      });

      expect(decision.id).toBeDefined();
      expect(decision.action).toBe('REGIONAL_FAILOVER');
      expect(decision.fencingToken).toBeDefined();
      expect(decision.fencingToken!).toBeGreaterThan(0);
      expect(decision.dataResidencyVerified).toBe(true);
    });

    it('fails closed when tenant authority cannot be resolved', () => {
      const decision = resilienceService.evaluateRecoveryDecision({
        tenantId: 'UNRESOLVED',
        targetComponent: 'PAYMENT_GATEWAY',
        errorContext: new Error('Unknown caller context'),
        actor: 'anonymous'
      });

      expect(decision.action).toBe('FAIL_CLOSED');
      expect(decision.tenantId).toBe('UNRESOLVED');
      expect(decision.reason).toContain('Tenant authority unresolved');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Firestore Transaction & Outage Resilience
  // --------------------------------------------------------------------------
  describe('Firestore Outage & Outbox Buffer Resilience', () => {
    it('buffers mutations in durable outbox during Firestore outages without claiming false success', () => {
      const res = resilienceService.queueOutboxMutation('purchase_orders', {
        tenantId,
        poNumber: 'PO-99101',
        totalAmount: 45000
      });

      expect(res.queued).toBe(true);
      expect(res.outboxSize).toBeGreaterThan(0);
      expect(resilienceService.getOutboxSize()).toBeGreaterThan(0);

      // Flush outbox upon restoration
      const flush = resilienceService.flushOutboxBuffer();
      expect(flush.flushedCount).toBeGreaterThan(0);
      expect(resilienceService.getOutboxSize()).toBe(0);
    });
  });

  // --------------------------------------------------------------------------
  // 4. Data Corruption Quarantine & Reconciliation
  // --------------------------------------------------------------------------
  describe('Data Corruption Quarantine & Reconciliation', () => {
    it('quarantines corrupted entities and blocks non-admin release', () => {
      const qRec = resilienceService.quarantineEntity({
        tenantId,
        entityType: 'Shipment',
        entityId: 'SHIP-9901-CORRUPT',
        reason: 'Missing origin warehouse reference',
        payload: { shipId: 'SHIP-9901-CORRUPT' },
        actor: 'DataIntegrityService'
      });

      expect(qRec.id).toBeDefined();
      expect(qRec.status).toBe('QUARANTINED');

      // Attempt non-admin reconciliation fails
      expect(() => {
        resilienceService.reconcileQuarantineItem({
          recordId: qRec.id,
          notes: 'Attempted release',
          actor: 'unprivileged_user',
          userRole: 'standard_buyer'
        });
      }).toThrow('UNAUTHORIZED');

      // Admin reconciliation succeeds
      const reconciled = resilienceService.reconcileQuarantineItem({
        recordId: qRec.id,
        notes: 'Verified origin warehouse mapping and patched lineage',
        actor: 'platform_admin@orion.internal',
        userRole: 'platform_admin'
      });

      expect(reconciled).not.toBeNull();
      expect(reconciled?.status).toBe('RECONCILED');
      expect(reconciled?.reconciledBy).toBe('platform_admin@orion.internal');
    });
  });

  // --------------------------------------------------------------------------
  // 5. DR RPO / RTO SLA Engine
  // --------------------------------------------------------------------------
  describe('DR RPO / RTO SLA Engine', () => {
    it('computes factual measured RPO/RTO SLAs across tier levels', () => {
      const slaStatus = resilienceService.getMeasuredRpoRtoStatus();

      expect(slaStatus.length).toBeGreaterThan(0);
      const tier0 = slaStatus.find(s => s.tier === 0);
      expect(tier0).toBeDefined();
      expect(tier0?.rpoSlaMet).toBe(true);
      expect(tier0?.rtoSlaMet).toBe(true);
      expect(tier0?.verificationMode).toBe('EMULATOR_TEST');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Recovery Runbooks & AI Governance
  // --------------------------------------------------------------------------
  describe('Governed Recovery Runbooks & Red Team AI Rules', () => {
    it('executes a 9-step structured recovery runbook to completion', () => {
      const rb = resilienceService.startRunbook({
        tenantId,
        scenario: 'FIRESTORE_OUTAGE',
        actor: 'ops_lead'
      });

      expect(rb.id).toBeDefined();
      expect(rb.steps.length).toBe(9);
      expect(rb.status).toBe('IN_PROGRESS');

      // Complete all steps
      for (let i = 1; i <= 9; i++) {
        resilienceService.completeRunbookStep(rb.id, i, 'ops_lead');
      }

      const updated = resilienceService.getRunbook(rb.id);
      expect(updated?.status).toBe('COMPLETED');
      expect(updated?.completedAt).toBeDefined();
    });

    it('blocks AI agents from self-approving recovery recommendations', () => {
      const aiRec = resilienceService.generateAIRecoveryRecommendation({
        tenantId,
        telemetrySummary: 'Event Fabric Consumer Lag Spike'
      });

      expect(aiRec.observedPattern).toContain('[OBSERVED]');
      expect(aiRec.inferredRootCause).toContain('[INFERRED]');
      expect(aiRec.requiresHumanApproval).toBe(true);
      expect(aiRec.selfApprovalBlocked).toBe(true);

      // Attempt AI self-approval is blocked by Red Team Guard
      const blockedExecution = resilienceService.executeAIRecoveryAction(
        aiRec.id,
        'ai_agent_runner',
        'ai'
      );

      expect(blockedExecution.executed).toBe(false);
      expect(blockedExecution.reason).toContain('RED_TEAM_BREACH_PREVENTED');
    });
  });
});
