import { describe, it, expect } from 'vitest';
import { masterDataService } from '../../data/MasterDataService';

describe('MasterDataTenantIsolation', () => {
  it('guarantees tenant isolation: Tenant A records are invisible to Tenant B', () => {
    const tenantARecord = masterDataService.proposeRecord({
      entityType: 'SUPPLIER',
      tenantId: 'TENANT-ACME-CORP',
      data: { id: 'SUP-ACME-01', name: 'Acme Secret Supplier' },
      sourceSystemType: 'SAP',
      actor: 'Acme Admin',
    });

    const tenantBRecord = masterDataService.proposeRecord({
      entityType: 'SUPPLIER',
      tenantId: 'TENANT-BETA-CORP',
      data: { id: 'SUP-BETA-01', name: 'Beta Secret Supplier' },
      sourceSystemType: 'ORACLE',
      actor: 'Beta Admin',
    });

    // Query for Tenant A only
    const tenantAResults = masterDataService.getAllRecords({ tenantId: 'TENANT-ACME-CORP' });
    expect(tenantAResults.some(r => r.id === tenantARecord.id)).toBe(true);
    expect(tenantAResults.some(r => r.id === tenantBRecord.id)).toBe(false);

    // Query for Tenant B only
    const tenantBResults = masterDataService.getAllRecords({ tenantId: 'TENANT-BETA-CORP' });
    expect(tenantBResults.some(r => r.id === tenantBRecord.id)).toBe(true);
    expect(tenantBResults.some(r => r.id === tenantARecord.id)).toBe(false);
  });

  it('isolates Golden Records strictly by tenant ID', () => {
    const recA = masterDataService.proposeRecord({
      entityType: 'PRODUCT',
      tenantId: 'TENANT-ACME-CORP',
      data: { id: 'SKU-ACME-ISO', name: 'Acme Golden Widget', unitCost: 10, uom: 'EA' },
      sourceSystemType: 'SAP',
      actor: 'Acme Admin',
    });
    masterDataService.validateRecord(recA.id, 'System');
    masterDataService.checkDuplicates(recA.id, [], 'System');
    masterDataService.submitForApproval(recA.id, 'Admin');
    masterDataService.activateRecord(recA.id, 'Lead Steward');

    const acmeGoldens = masterDataService.getAllGoldenRecords('TENANT-ACME-CORP');
    const betaGoldens = masterDataService.getAllGoldenRecords('TENANT-BETA-CORP');

    expect(acmeGoldens.some(g => g.id === recA.id)).toBe(true);
    expect(betaGoldens.some(g => g.id === recA.id)).toBe(false);
  });
});
