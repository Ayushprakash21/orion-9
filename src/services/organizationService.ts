import { Organization } from '../types/auth';

// TEMPORARY LOCAL AUTH MODE — replace with Firebase/enterprise IdP before production.
// admin / admin is development-only and must be replaced before production deployment.

const DEFAULT_ORGANIZATIONS: Organization[] = [
  {
    id: 'ORION_PLATFORM',
    name: 'ORION_PLATFORM',
    industry: 'Supply Chain / Logistics',
    country: 'Global',
    currency: 'USD',
    timezone: 'UTC',
    units: 'metric',
    logoUrl: null,
    status: 'active',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

const getLocalOrgs = (): Organization[] => {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return DEFAULT_ORGANIZATIONS;
  const data = localStorage.getItem('orion_organizations');
  if (!data) {
    localStorage.setItem('orion_organizations', JSON.stringify(DEFAULT_ORGANIZATIONS));
    return DEFAULT_ORGANIZATIONS;
  }
  try {
    return JSON.parse(data);
  } catch (err) {
    localStorage.setItem('orion_organizations', JSON.stringify(DEFAULT_ORGANIZATIONS));
    return DEFAULT_ORGANIZATIONS;
  }
};

const saveLocalOrgs = (orgs: Organization[]): void => {
  if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    localStorage.setItem('orion_organizations', JSON.stringify(orgs));
  }
};

export const organizationService = {
  /**
   * Fetches organizations locally.
   */
  fetchOrganizationsAsync: async (): Promise<Organization[]> => {
    return getLocalOrgs();
  },

  /**
   * Synchronous getter returning local organizations.
   */
  getOrganizations: (): Organization[] => {
    return getLocalOrgs();
  },

  getOrganizationById: (id: string): Organization | undefined => {
    return getLocalOrgs().find(o => o.id === id);
  },

  getOrganizationByName: (name: string): Organization | undefined => {
    if (!name) return undefined;
    const clean = name.trim().toLowerCase();
    return getLocalOrgs().find(o => o.name.trim().toLowerCase() === clean);
  },

  getOrganization: (orgId?: string): Organization => {
    const orgs = getLocalOrgs();
    if (orgId) {
      const match = orgs.find(o => o.id === orgId);
      if (match) return match;
    }
    return orgs[0] || DEFAULT_ORGANIZATIONS[0];
  },

  createOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    const cleanName = data.name?.trim();
    if (!cleanName) {
      throw new Error('Organization name is required.');
    }

    const orgs = getLocalOrgs();
    const exists = orgs.some(o => o.name.trim().toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      throw new Error('Organization name already exists.');
    }

    const newOrg: Organization = {
      id: cleanName.toUpperCase().replace(/\s+/g, '_'),
      name: cleanName,
      industry: data.industry?.trim() || 'Supply Chain / Logistics',
      country: data.country?.trim() || 'Global',
      currency: data.currency?.trim() || 'USD',
      timezone: data.timezone?.trim() || 'UTC',
      units: data.units || 'metric',
      logoUrl: data.logoUrl || null,
      status: data.status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    orgs.push(newOrg);
    saveLocalOrgs(orgs);
    return newOrg;
  },

  updateOrganization: async (id: string, updates: Partial<Organization>): Promise<Organization | null> => {
    const orgs = getLocalOrgs();
    const idx = orgs.findIndex(o => o.id === id);
    if (idx === -1) {
      throw new Error('Organization not found.');
    }

    const current = orgs[idx];
    const updated: Organization = {
      ...current,
      name: updates.name !== undefined ? updates.name.trim() : current.name,
      industry: updates.industry !== undefined ? updates.industry : current.industry,
      country: updates.country !== undefined ? updates.country : current.country,
      currency: updates.currency !== undefined ? updates.currency : current.currency,
      timezone: updates.timezone !== undefined ? updates.timezone : current.timezone,
      units: updates.units !== undefined ? updates.units : current.units,
      logoUrl: updates.logoUrl !== undefined ? updates.logoUrl : current.logoUrl,
      status: updates.status !== undefined ? updates.status : current.status,
      updatedAt: new Date().toISOString(),
    };

    orgs[idx] = updated;
    saveLocalOrgs(orgs);
    return updated;
  },

  setOrganizationStatus: async (id: string, status: 'active' | 'inactive'): Promise<Organization | null> => {
    return organizationService.updateOrganization(id, { status });
  },

  deleteOrganization: async (id: string): Promise<boolean> => {
    const orgs = getLocalOrgs();
    const filtered = orgs.filter(o => o.id !== id);
    saveLocalOrgs(filtered);
    return true;
  },

  getOrganizationUserCount: (_orgId: string): number => {
    return 0;
  }
};

export const getOrganizations = organizationService.getOrganizations;
export const createOrganization = organizationService.createOrganization;
export const updateOrganization = organizationService.updateOrganization;
export const deleteOrganization = organizationService.deleteOrganization;
