import { describe, it, expect, beforeEach } from 'vitest';
import { 
  EnterpriseHierarchyService, 
  HierarchyNode 
} from '../../enterprise/hierarchy/EnterpriseHierarchyService';

describe('Wave 11: Enterprise Organizational Hierarchy Service', () => {
  let service: EnterpriseHierarchyService;
  const tenantA = 'tenant-corp-alpha';
  const tenantB = 'tenant-corp-beta';

  beforeEach(() => {
    service = EnterpriseHierarchyService.getInstance();
    service.clear();
  });

  it('1. Constructs a valid 7-level hierarchy and generates canonical path', () => {
    // 1. Enterprise
    const ent = service.registerNode({
      id: 'ent-01',
      tenantId: tenantA,
      level: 'ENTERPRISE',
      name: 'Global Enterprise 1',
      code: 'ENT-01',
      metadata: { activeStatus: 'ACTIVE' }
    });
    expect(ent.path).toBe('/ent-01');

    // 2. Organization
    const org = service.registerNode({
      id: 'org-01',
      tenantId: tenantA,
      level: 'ORGANIZATION',
      name: 'Americas Corp',
      code: 'ORG-01',
      parentId: 'ent-01',
      metadata: { activeStatus: 'ACTIVE' }
    });
    expect(org.path).toBe('/ent-01/org-01');

    // 3. Region
    const reg = service.registerNode({
      id: 'reg-01',
      tenantId: tenantA,
      level: 'REGION',
      name: 'North America Region',
      code: 'REG-01',
      parentId: 'org-01',
      metadata: { activeStatus: 'ACTIVE' }
    });
    expect(reg.path).toBe('/ent-01/org-01/reg-01');

    // 4. Country
    const ctry = service.registerNode({
      id: 'ctry-01',
      tenantId: tenantA,
      level: 'COUNTRY',
      name: 'United States',
      code: 'CTRY-US',
      parentId: 'reg-01',
      metadata: { activeStatus: 'ACTIVE', countryCode: 'US' }
    });
    expect(ctry.path).toBe('/ent-01/org-01/reg-01/ctry-01');

    // 5. Business Unit
    const bu = service.registerNode({
      id: 'bu-01',
      tenantId: tenantA,
      level: 'BUSINESS_UNIT',
      name: 'Electronics Division',
      code: 'BU-ELEC',
      parentId: 'ctry-01',
      metadata: { activeStatus: 'ACTIVE' }
    });
    expect(bu.path).toBe('/ent-01/org-01/reg-01/ctry-01/bu-01');

    // 6. Site
    const site = service.registerNode({
      id: 'site-01',
      tenantId: tenantA,
      level: 'SITE',
      name: 'Austin Mega Hub',
      code: 'SITE-AUS',
      parentId: 'bu-01',
      metadata: { activeStatus: 'ACTIVE' }
    });
    expect(site.path).toBe('/ent-01/org-01/reg-01/ctry-01/bu-01/site-01');

    // 7. Facility
    const fac = service.registerNode({
      id: 'fac-01',
      tenantId: tenantA,
      level: 'FACILITY',
      name: 'Cleanroom Fab 4',
      code: 'FAC-FAB4',
      parentId: 'site-01',
      metadata: { activeStatus: 'ACTIVE' }
    });
    expect(fac.path).toBe('/ent-01/org-01/reg-01/ctry-01/bu-01/site-01/fac-01');

    // Verify summary counts
    const summary = service.getHierarchySummary(tenantA);
    expect(summary.totalNodes).toBe(7);
    expect(summary.enterprisesCount).toBe(1);
    expect(summary.facilitiesCount).toBe(1);
    expect(summary.rootNode?.id).toBe('ent-01');
  });

  it('2. Prevents invalid inverted hierarchy relationships', () => {
    service.registerNode({
      id: 'ent-root',
      tenantId: tenantA,
      level: 'ENTERPRISE',
      name: 'Root Ent',
      code: 'ENT-ROOT',
      metadata: { activeStatus: 'ACTIVE' }
    });

    service.registerNode({
      id: 'fac-child',
      tenantId: tenantA,
      level: 'FACILITY',
      name: 'Facility 1',
      code: 'FAC-1',
      parentId: 'ent-root',
      metadata: { activeStatus: 'ACTIVE' }
    });

    // Inverted attempt: Facility cannot be parent of Enterprise
    expect(() => {
      service.registerNode({
        id: 'ent-invalid',
        tenantId: tenantA,
        level: 'ENTERPRISE',
        name: 'Invalid Parent',
        code: 'ENT-INV',
        parentId: 'fac-child',
        metadata: { activeStatus: 'ACTIVE' }
      });
    }).toThrow(/Invalid hierarchy relationship/);
  });

  it('3. Strictly enforces cross-tenant boundary isolation', () => {
    service.registerNode({
      id: 'ent-alpha',
      tenantId: tenantA,
      level: 'ENTERPRISE',
      name: 'Alpha Corp',
      code: 'ENT-ALPHA',
      metadata: { activeStatus: 'ACTIVE' }
    });

    // Tenant B attempts to link to Tenant A parent
    expect(() => {
      service.registerNode({
        id: 'org-beta',
        tenantId: tenantB,
        level: 'ORGANIZATION',
        name: 'Beta Corp',
        code: 'ORG-BETA',
        parentId: 'ent-alpha', // Cross-tenant reference
        metadata: { activeStatus: 'ACTIVE' }
      });
    }).toThrow(/Parent node ent-alpha not found in tenant tenant-corp-beta/);

    // Tenant B sees zero nodes of Tenant A
    const betaNodes = service.listNodes(tenantB);
    expect(betaNodes.length).toBe(0);
  });

  it('4. Resolves ancestors and descendants correctly', () => {
    service.registerNode({
      id: 'ent-chain',
      tenantId: tenantA,
      level: 'ENTERPRISE',
      name: 'Chain Ent',
      code: 'ENT-CH',
      metadata: { activeStatus: 'ACTIVE' }
    });
    service.registerNode({
      id: 'org-chain',
      tenantId: tenantA,
      level: 'ORGANIZATION',
      name: 'Chain Org',
      code: 'ORG-CH',
      parentId: 'ent-chain',
      metadata: { activeStatus: 'ACTIVE' }
    });
    service.registerNode({
      id: 'site-chain',
      tenantId: tenantA,
      level: 'SITE',
      name: 'Chain Site',
      code: 'SITE-CH',
      parentId: 'org-chain',
      metadata: { activeStatus: 'ACTIVE' }
    });

    const ancestors = service.getAncestors(tenantA, 'site-chain');
    expect(ancestors.map(a => a.id)).toEqual(['ent-chain', 'org-chain']);

    const descendants = service.getDescendants(tenantA, 'ent-chain');
    expect(descendants.map(d => d.id)).toEqual(['org-chain', 'site-chain']);
  });
});
