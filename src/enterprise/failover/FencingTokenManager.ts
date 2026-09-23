/**
 * ORION-9 WAVE 11: DISTRIBUTED FENCING TOKEN & GENERATION AUTHORITY
 * Prevents split-brain state mutations during regional failover.
 * Generates monotonically increasing fencing tokens and generation IDs.
 * Storage boundaries and adapters reject any mutation from an older generation token.
 */

export interface FencingLease {
  resourceId: string; // e.g. "REGION_LEADER:reg-us-east", "ERP_MASTER_WRITE:SAP_PRD"
  generationId: number;
  fencingToken: number;
  holderRegionId: string;
  holderNodeId: string;
  acquiredAt: string;
  expiresAt: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}

export interface FencingValidationResult {
  allowed: boolean;
  resourceId: string;
  incomingToken: number;
  currentToken: number;
  generationId: number;
  rejectionReason?: string;
}

export class FencingTokenManager {
  private static instance: FencingTokenManager;
  // Key: resourceId
  private leases: Map<string, FencingLease> = new Map();
  private tokenCounter: number = 1000;

  private constructor() {
    this.seedDefaultLeases();
  }

  public static getInstance(): FencingTokenManager {
    if (!FencingTokenManager.instance) {
      FencingTokenManager.instance = new FencingTokenManager();
    }
    return FencingTokenManager.instance;
  }

  private seedDefaultLeases(): void {
    const now = Date.now();
    this.leases.set('GLOBAL_PRIMARY_LEADER', {
      resourceId: 'GLOBAL_PRIMARY_LEADER',
      generationId: 1,
      fencingToken: 1001,
      holderRegionId: 'reg-us-east',
      holderNodeId: 'node-us-east-alpha-01',
      acquiredAt: new Date(now - 86400000).toISOString(),
      expiresAt: new Date(now + 86400000).toISOString(),
      status: 'ACTIVE'
    });
  }

  /**
   * Acquire or promote leadership for a resource, advancing generation and fencing token
   */
  public acquireLeadership(params: {
    resourceId: string;
    targetRegionId: string;
    targetNodeId: string;
    leaseDurationMs?: number;
  }): FencingLease {
    const existing = this.leases.get(params.resourceId);
    const generationId = existing ? existing.generationId + 1 : 1;
    this.tokenCounter += 1;
    const fencingToken = this.tokenCounter;

    const now = Date.now();
    const leaseDuration = params.leaseDurationMs || 300000; // 5 min default

    // Revoke old lease if active
    if (existing && existing.status === 'ACTIVE') {
      existing.status = 'REVOKED';
    }

    const newLease: FencingLease = {
      resourceId: params.resourceId,
      generationId,
      fencingToken,
      holderRegionId: params.targetRegionId,
      holderNodeId: params.targetNodeId,
      acquiredAt: new Date(now).toISOString(),
      expiresAt: new Date(now + leaseDuration).toISOString(),
      status: 'ACTIVE'
    };

    this.leases.set(params.resourceId, newLease);
    return newLease;
  }

  /**
   * Validate that a mutation command possesses the active, highest fencing token
   */
  public validateFencingToken(resourceId: string, incomingToken: number): FencingValidationResult {
    const activeLease = this.leases.get(resourceId);

    if (!activeLease) {
      return {
        allowed: false,
        resourceId,
        incomingToken,
        currentToken: 0,
        generationId: 0,
        rejectionReason: `No active fencing lease exists for resource ${resourceId}`
      };
    }

    if (activeLease.status !== 'ACTIVE') {
      return {
        allowed: false,
        resourceId,
        incomingToken,
        currentToken: activeLease.fencingToken,
        generationId: activeLease.generationId,
        rejectionReason: `Fencing lease for ${resourceId} is ${activeLease.status}`
      };
    }

    if (incomingToken < activeLease.fencingToken) {
      return {
        allowed: false,
        resourceId,
        incomingToken,
        currentToken: activeLease.fencingToken,
        generationId: activeLease.generationId,
        rejectionReason: `SPLIT_BRAIN_FENCE_BREACH: Incoming fencing token ${incomingToken} is superseded by active leader token ${activeLease.fencingToken} (Generation ${activeLease.generationId}). Mutation aborted to prevent split-brain corruption.`
      };
    }

    return {
      allowed: true,
      resourceId,
      incomingToken,
      currentToken: activeLease.fencingToken,
      generationId: activeLease.generationId
    };
  }

  public getLease(resourceId: string): FencingLease | undefined {
    return this.leases.get(resourceId);
  }

  public listLeases(): FencingLease[] {
    return Array.from(this.leases.values());
  }

  public clear(): void {
    this.leases.clear();
    this.seedDefaultLeases();
  }
}

export const fencingTokenManager = FencingTokenManager.getInstance();
