/**
 * ORION-9 WAVE 11: GLOBAL ENTERPRISE SCALE & ORGANIZATIONAL HIERARCHY
 * Canonical 7-level hierarchy:
 * Enterprise -> Organization -> Region -> Country -> Business Unit -> Site -> Facility
 * 
 * Strict Invariant: All levels are strictly subordinate to the primary tenantId security boundary.
 * Cross-tenant hierarchy traversal is strictly prohibited and structurally impossible.
 */

export type HierarchyLevel = 
  | 'ENTERPRISE'
  | 'ORGANIZATION'
  | 'REGION'
  | 'COUNTRY'
  | 'BUSINESS_UNIT'
  | 'SITE'
  | 'FACILITY';

export interface HierarchyNode {
  id: string;
  tenantId: string;
  level: HierarchyLevel;
  name: string;
  code: string;
  parentId?: string; // Root (ENTERPRISE) has no parentId
  path: string; // e.g. "/ENT-01/ORG-01/REG-EMEA/CTRY-DE/BU-AUTO/SITE-MUC/FAC-01"
  metadata: {
    countryCode?: string; // ISO 3166-1 alpha-2
    timezone?: string;
    currency?: string; // ISO 4217
    sovereignJurisdiction?: string;
    latitude?: number;
    longitude?: number;
    activeStatus: 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE';
    tags?: string[];
    [key: string]: any;
  };
  createdAt: string;
  updatedAt: string;
}

export interface EnterpriseHierarchySummary {
  tenantId: string;
  totalNodes: number;
  enterprisesCount: number;
  organizationsCount: number;
  regionsCount: number;
  countriesCount: number;
  businessUnitsCount: number;
  sitesCount: number;
  facilitiesCount: number;
  rootNode?: HierarchyNode;
}

export class EnterpriseHierarchyService {
  private static instance: EnterpriseHierarchyService;
  // Key: `${tenantId}:${nodeId}`
  private nodes: Map<string, HierarchyNode> = new Map();

  private constructor() {
    this.seedDefaultNodes();
  }

  public static getInstance(): EnterpriseHierarchyService {
    if (!EnterpriseHierarchyService.instance) {
      EnterpriseHierarchyService.instance = new EnterpriseHierarchyService();
    }
    return EnterpriseHierarchyService.instance;
  }

  /**
   * Seed a baseline enterprise structure for default demo tenant
   */
  private seedDefaultNodes(): void {
    const tenantId = 'demo-tenant';
    const now = new Date().toISOString();

    const defaultNodes: HierarchyNode[] = [
      {
        id: 'ent-global',
        tenantId,
        level: 'ENTERPRISE',
        name: 'Orion Global Supply Networks Ltd',
        code: 'ENT-OGSN',
        path: '/ent-global',
        metadata: {
          currency: 'USD',
          activeStatus: 'ACTIVE',
          tags: ['global-headquarters', 'tier-1']
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'org-na',
        tenantId,
        level: 'ORGANIZATION',
        name: 'Orion North America Operations Inc',
        code: 'ORG-NA',
        parentId: 'ent-global',
        path: '/ent-global/org-na',
        metadata: {
          currency: 'USD',
          countryCode: 'US',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'org-emea',
        tenantId,
        level: 'ORGANIZATION',
        name: 'Orion EMEA Logistics SE',
        code: 'ORG-EMEA',
        parentId: 'ent-global',
        path: '/ent-global/org-emea',
        metadata: {
          currency: 'EUR',
          sovereignJurisdiction: 'EU_GDPR',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'reg-na-east',
        tenantId,
        level: 'REGION',
        name: 'US East Coast Logistics Region',
        code: 'REG-US-EAST',
        parentId: 'org-na',
        path: '/ent-global/org-na/reg-na-east',
        metadata: {
          timezone: 'America/New_York',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'reg-eu-central',
        tenantId,
        level: 'REGION',
        name: 'Central Europe Distribution Region',
        code: 'REG-EU-CENTRAL',
        parentId: 'org-emea',
        path: '/ent-global/org-emea/reg-eu-central',
        metadata: {
          timezone: 'Europe/Berlin',
          sovereignJurisdiction: 'EU_GDPR',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ctry-us',
        tenantId,
        level: 'COUNTRY',
        name: 'United States of America',
        code: 'CTRY-US',
        parentId: 'reg-na-east',
        path: '/ent-global/org-na/reg-na-east/ctry-us',
        metadata: {
          countryCode: 'US',
          currency: 'USD',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ctry-de',
        tenantId,
        level: 'COUNTRY',
        name: 'Federal Republic of Germany',
        code: 'CTRY-DE',
        parentId: 'reg-eu-central',
        path: '/ent-global/org-emea/reg-eu-central/ctry-de',
        metadata: {
          countryCode: 'DE',
          currency: 'EUR',
          sovereignJurisdiction: 'EU_GDPR',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bu-automotive',
        tenantId,
        level: 'BUSINESS_UNIT',
        name: 'Automotive & Mobility Solutions BU',
        code: 'BU-AUTO',
        parentId: 'ctry-de',
        path: '/ent-global/org-emea/reg-eu-central/ctry-de/bu-automotive',
        metadata: {
          activeStatus: 'ACTIVE',
          tags: ['automotive', 'tier-1-oem']
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'bu-aerospace',
        tenantId,
        level: 'BUSINESS_UNIT',
        name: 'Aerospace & Defense Assemblies BU',
        code: 'BU-AERO',
        parentId: 'ctry-us',
        path: '/ent-global/org-na/reg-na-east/ctry-us/bu-aerospace',
        metadata: {
          activeStatus: 'ACTIVE',
          tags: ['ITAR_COMPLIANT', 'aerospace']
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'site-frankfurt',
        tenantId,
        level: 'SITE',
        name: 'Frankfurt European Gateway Hub',
        code: 'SITE-FRA-01',
        parentId: 'bu-automotive',
        path: '/ent-global/org-emea/reg-eu-central/ctry-de/bu-automotive/site-frankfurt',
        metadata: {
          latitude: 50.1109,
          longitude: 8.6821,
          timezone: 'Europe/Berlin',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'site-savannah',
        tenantId,
        level: 'SITE',
        name: 'Savannah Marine Terminal Facility',
        code: 'SITE-SAV-01',
        parentId: 'bu-aerospace',
        path: '/ent-global/org-na/reg-na-east/ctry-us/bu-aerospace/site-savannah',
        metadata: {
          latitude: 32.0809,
          longitude: -81.0912,
          timezone: 'America/New_York',
          activeStatus: 'ACTIVE'
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'fac-fra-wh1',
        tenantId,
        level: 'FACILITY',
        name: 'Automated High-Bay Warehouse A1',
        code: 'FAC-FRA-WH1',
        parentId: 'site-frankfurt',
        path: '/ent-global/org-emea/reg-eu-central/ctry-de/bu-automotive/site-frankfurt/fac-fra-wh1',
        metadata: {
          activeStatus: 'ACTIVE',
          tags: ['automated', 'cold-storage-capable']
        },
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'fac-sav-wh1',
        tenantId,
        level: 'FACILITY',
        name: 'Bonded Aerospace Staging Depot B2',
        code: 'FAC-SAV-WH1',
        parentId: 'site-savannah',
        path: '/ent-global/org-na/reg-na-east/ctry-us/bu-aerospace/site-savannah/fac-sav-wh1',
        metadata: {
          activeStatus: 'ACTIVE',
          tags: ['bonded', 'secure-facility']
        },
        createdAt: now,
        updatedAt: now,
      }
    ];

    const seedTenants = ['demo-tenant', 'ORION_PLATFORM'];
    for (const t of seedTenants) {
      for (const node of defaultNodes) {
        this.nodes.set(`${t}:${node.id}`, { ...node, tenantId: t });
      }
    }
  }

  /**
   * Register or update a hierarchy node within a tenant
   */
  public registerNode(node: Omit<HierarchyNode, 'path' | 'createdAt' | 'updatedAt'> & { path?: string }): HierarchyNode {
    if (!node.tenantId || !node.id) {
      throw new Error('HierarchyNode requires valid tenantId and id');
    }

    // Validate parent exists if provided, and belongs to same tenant
    let computedPath = `/${node.id}`;
    if (node.parentId) {
      const parent = this.getNode(node.tenantId, node.parentId);
      if (!parent) {
        throw new Error(`Parent node ${node.parentId} not found in tenant ${node.tenantId}`);
      }
      this.validateHierarchyLevel(parent.level, node.level);
      computedPath = `${parent.path}/${node.id}`;
    } else if (node.level !== 'ENTERPRISE') {
      throw new Error(`Non-ENTERPRISE node (${node.level}) must have a valid parentId`);
    }

    const now = new Date().toISOString();
    const existing = this.getNode(node.tenantId, node.id);

    const fullNode: HierarchyNode = {
      ...node,
      path: node.path || computedPath,
      metadata: { ...node.metadata },
      createdAt: existing ? existing.createdAt : now,
      updatedAt: now,
    };

    this.nodes.set(`${node.tenantId}:${node.id}`, fullNode);
    return fullNode;
  }

  /**
   * Retrieve a specific node by tenant and ID
   */
  public getNode(tenantId: string, nodeId: string): HierarchyNode | undefined {
    return this.nodes.get(`${tenantId}:${nodeId}`);
  }

  /**
   * List all hierarchy nodes for a tenant
   */
  public listNodes(tenantId: string): HierarchyNode[] {
    const results: HierarchyNode[] = [];
    for (const [key, node] of this.nodes.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        results.push({ ...node });
      }
    }
    return results;
  }

  /**
   * Get direct children of a node
   */
  public getChildren(tenantId: string, parentId: string): HierarchyNode[] {
    return this.listNodes(tenantId).filter(n => n.parentId === parentId);
  }

  /**
   * Get all descendants of a node using path prefix match
   */
  public getDescendants(tenantId: string, nodeId: string): HierarchyNode[] {
    const parent = this.getNode(tenantId, nodeId);
    if (!parent) return [];
    const prefix = `${parent.path}/`;
    return this.listNodes(tenantId).filter(n => n.path.startsWith(prefix));
  }

  /**
   * Get ancestor chain from root down to node
   */
  public getAncestors(tenantId: string, nodeId: string): HierarchyNode[] {
    const ancestors: HierarchyNode[] = [];
    let current = this.getNode(tenantId, nodeId);
    while (current && current.parentId) {
      const parent = this.getNode(tenantId, current.parentId);
      if (parent) {
        ancestors.unshift(parent);
        current = parent;
      } else {
        break;
      }
    }
    return ancestors;
  }

  /**
   * Get summary metrics for tenant's hierarchy
   */
  public getHierarchySummary(tenantId: string): EnterpriseHierarchySummary {
    const nodes = this.listNodes(tenantId);
    const root = nodes.find(n => n.level === 'ENTERPRISE');

    return {
      tenantId,
      totalNodes: nodes.length,
      enterprisesCount: nodes.filter(n => n.level === 'ENTERPRISE').length,
      organizationsCount: nodes.filter(n => n.level === 'ORGANIZATION').length,
      regionsCount: nodes.filter(n => n.level === 'REGION').length,
      countriesCount: nodes.filter(n => n.level === 'COUNTRY').length,
      businessUnitsCount: nodes.filter(n => n.level === 'BUSINESS_UNIT').length,
      sitesCount: nodes.filter(n => n.level === 'SITE').length,
      facilitiesCount: nodes.filter(n => n.level === 'FACILITY').length,
      rootNode: root,
    };
  }

  /**
   * Validate allowable parent -> child hierarchy transitions
   */
  private validateHierarchyLevel(parentLevel: HierarchyLevel, childLevel: HierarchyLevel): void {
    const hierarchyOrder: HierarchyLevel[] = [
      'ENTERPRISE',
      'ORGANIZATION',
      'REGION',
      'COUNTRY',
      'BUSINESS_UNIT',
      'SITE',
      'FACILITY'
    ];

    const parentIdx = hierarchyOrder.indexOf(parentLevel);
    const childIdx = hierarchyOrder.indexOf(childLevel);

    if (childIdx <= parentIdx) {
      throw new Error(`Invalid hierarchy relationship: ${childLevel} cannot be child of ${parentLevel}`);
    }
  }

  /**
   * Reset store (test use only)
   */
  public clear(): void {
    this.nodes.clear();
  }
}

export const enterpriseHierarchyService = EnterpriseHierarchyService.getInstance();
