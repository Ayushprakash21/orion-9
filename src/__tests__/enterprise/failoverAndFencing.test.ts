import { describe, it, expect, beforeEach } from 'vitest';
import { fencingTokenManager } from '../../enterprise/failover/FencingTokenManager';
import { regionalFailoverOrchestrator } from '../../enterprise/failover/RegionalFailoverOrchestrator';
import { regionRegistry } from '../../enterprise/region/RegionRegistry';

describe('Wave 11: Regional Failover & Distributed Fencing Tokens', () => {
  const tenantId = 'demo-tenant';

  beforeEach(() => {
    fencingTokenManager.clear();
    regionalFailoverOrchestrator.clear();
  });

  it('1. FencingTokenManager issues monotonically increasing tokens and advances generation', () => {
    const lease1 = fencingTokenManager.acquireLeadership({
      resourceId: 'STORAGE_WRITER_LOCK',
      targetRegionId: 'reg-us-east',
      targetNodeId: 'node-01'
    });

    const lease2 = fencingTokenManager.acquireLeadership({
      resourceId: 'STORAGE_WRITER_LOCK',
      targetRegionId: 'reg-us-west-dr',
      targetNodeId: 'node-02'
    });

    expect(lease2.fencingToken).toBeGreaterThan(lease1.fencingToken);
    expect(lease2.generationId).toBe(lease1.generationId + 1);
    expect(lease2.holderRegionId).toBe('reg-us-west-dr');
    expect(lease1.status).toBe('REVOKED');
  });

  it('2. Rejects stale split-brain mutations with SPLIT_BRAIN_FENCE_BREACH error', () => {
    // Acquire leadership for node 1
    const leaseNode1 = fencingTokenManager.acquireLeadership({
      resourceId: 'ERP_OUTBOUND_WRITER',
      targetRegionId: 'reg-us-east',
      targetNodeId: 'node-us-east-1'
    });

    // Failover occurs; node 2 promoted with higher token
    const leaseNode2 = fencingTokenManager.acquireLeadership({
      resourceId: 'ERP_OUTBOUND_WRITER',
      targetRegionId: 'reg-us-west-dr',
      targetNodeId: 'node-us-west-2'
    });

    // Valid mutation with new token succeeds
    const validCheck = fencingTokenManager.validateFencingToken('ERP_OUTBOUND_WRITER', leaseNode2.fencingToken);
    expect(validCheck.allowed).toBe(true);

    // Stale zombie write from node 1 using old token is blocked!
    const staleCheck = fencingTokenManager.validateFencingToken('ERP_OUTBOUND_WRITER', leaseNode1.fencingToken);
    expect(staleCheck.allowed).toBe(false);
    expect(staleCheck.rejectionReason).toContain('SPLIT_BRAIN_FENCE_BREACH');
  });

  it('3. RegionalFailoverOrchestrator executes the complete 6-phase failover protocol', async () => {
    // Ensure regions are ready
    regionRegistry.updateRegionStatus('reg-us-east', 'ACTIVE');
    regionRegistry.updateRegionStatus('reg-us-west-dr', 'ACTIVE');

    const op = await regionalFailoverOrchestrator.executeFailover({
      tenantId,
      sourceRegionId: 'reg-us-east',
      targetRegionId: 'reg-us-west-dr',
      triggerType: 'DISASTER_RECOVERY_DRILL',
      isDrill: true,
      initiatedBy: 'test-runner'
    });

    expect(op.status).toBe('COMPLETED');
    expect(op.steps.length).toBe(6);
    expect(op.simulationMode).toBe('SIMULATED'); // Truthful claims

    const phases = op.steps.map(s => s.phase);
    expect(phases).toEqual([
      'PREFLIGHT_VALIDATION',
      'TRAFFIC_DRAIN',
      'REPLICATION_FREEZE',
      'TARGET_PROMOTION',
      'ROUTING_DIVERSION',
      'POSTFLIGHT_VERIFICATION'
    ]);

    // Target region is now primary and source is offline
    const target = regionRegistry.getRegion('reg-us-west-dr');
    const source = regionRegistry.getRegion('reg-us-east');
    expect(target?.role).toBe('PRIMARY');
    expect(source?.status).toBe('OFFLINE');

    // Verify fencing token was issued during failover
    expect(op.fencingLease).toBeDefined();
    expect(op.fencingLease?.holderRegionId).toBe('reg-us-west-dr');
  });
});
