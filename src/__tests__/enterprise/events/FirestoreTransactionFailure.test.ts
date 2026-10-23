import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('firebase/firestore', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    doc: vi.fn().mockImplementation((_fs: any, col: string, id: string) => ({ path: `${col}/${id}`, id })),
    runTransaction: vi.fn().mockRejectedValue(new Error('Firestore transaction contention limit exceeded'))
  };
});

import { scmPersistenceService } from '../../../services/scm/ScmPersistenceService';
import { DatabaseConnectionManager } from '../../../core/database/DatabaseConnectionManager';

describe('ORION-9 Firestore Transaction Failure & Atomicity Guard', () => {
  beforeEach(() => {
    scmPersistenceService.clear();
    vi.restoreAllMocks();
  });

  it('rejects with explicit error when Firestore transaction fails, preventing false success', async () => {
    const tenantId = 'tenant_live_failure';
    const dbMgr = DatabaseConnectionManager.getInstance();

    vi.spyOn(dbMgr, 'getEnvironment').mockReturnValue('LIVE');
    vi.spyOn(dbMgr, 'getFirestore').mockReturnValue({ type: 'mock-live-firestore' } as any);

    await expect(
      scmPersistenceService.saveRecord('inventory', 'INV-FAIL-TX-1', {
        tenantId,
        productId: 'PROD-TX-FAIL',
        onHand: 50
      }, {
        emitEvent: true,
        idempotencyKey: 'idemp-tx-fail-exact'
      })
    ).rejects.toThrow('Firestore persistence failed for inventory/INV-FAIL-TX-1: Firestore transaction contention limit exceeded');

    // Confirm neither business record nor outbox record was written to memory cache on transaction failure
    const cachedRecord = scmPersistenceService.getCachedRecord('inventory', tenantId, 'INV-FAIL-TX-1');
    expect(cachedRecord).toBeUndefined();

    const pending = await scmPersistenceService.getPendingOutboxEvents(tenantId);
    expect(pending.find(p => p.idempotencyKey === 'idemp-tx-fail-exact')).toBeUndefined();
  });

  it('rejects unpersisted writes in LIVE mode when Firestore instance is completely unavailable', async () => {
    const tenantId = 'tenant_unavailable_db';
    const dbMgr = DatabaseConnectionManager.getInstance();

    vi.spyOn(dbMgr, 'getEnvironment').mockReturnValue('LIVE');
    vi.spyOn(dbMgr, 'getFirestore').mockReturnValue(null);
    (scmPersistenceService as any).firestore = null;

    await expect(
      scmPersistenceService.saveRecord('inventory', 'INV-NO-DB-1', {
        tenantId,
        productId: 'PROD-NO-DB',
        onHand: 10
      }, {
        emitEvent: true
      })
    ).rejects.toThrow('[SCM-AUTHORITATIVE-ERROR] LIVE environment requested but Firestore instance is unavailable');

    const cached = scmPersistenceService.getCachedRecord('inventory', tenantId, 'INV-NO-DB-1');
    expect(cached).toBeUndefined();
  });
});
