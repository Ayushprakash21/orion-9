import { supabase } from '../lib/supabaseClient';
import { Organization } from '../types/auth';

let cachedOrganizations: Organization[] = [];
let hasFetchedOrgs = false;

export const organizationService = {
  /**
   * Fetches organizations from Supabase public.organizations.
   */
  fetchOrganizationsAsync: async (): Promise<Organization[]> => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        console.warn('Unable to fetch organizations from Supabase:', error);
        return cachedOrganizations;
      }

      if (data && data.length > 0) {
        cachedOrganizations = data.map((o: any) => ({
          id: o.id,
          name: o.name,
          industry: o.industry,
          country: o.country,
          currency: o.currency || 'USD',
          timezone: o.timezone || 'UTC',
          units: o.units || 'metric',
          logoUrl: o.logo_url || o.logo || null,
          logo: o.logo || o.logo_url || null,
          status: o.status || 'active',
          createdAt: o.created_at || new Date().toISOString(),
          updatedAt: o.updated_at || new Date().toISOString(),
        }));
        hasFetchedOrgs = true;
      }
    } catch (err) {
      console.warn('Error querying Supabase organizations:', err);
    }
    return cachedOrganizations;
  },

  /**
   * Synchronous getter returning cached organizations.
   * Dispatches background fetch if not yet loaded.
   */
  getOrganizations: (): Organization[] => {
    if (!hasFetchedOrgs) {
      organizationService.fetchOrganizationsAsync().catch(err => {
        console.warn('Background organization fetch warning:', err);
      });
    }
    return cachedOrganizations;
  },

  getOrganizationById: (id: string): Organization | undefined => {
    return cachedOrganizations.find(o => o.id === id);
  },

  getOrganizationByName: (name: string): Organization | undefined => {
    if (!name) return undefined;
    const clean = name.trim().toLowerCase();
    return cachedOrganizations.find(o => o.name.trim().toLowerCase() === clean);
  },

  getOrganization: (orgId?: string): Organization => {
    const orgs = organizationService.getOrganizations();
    if (orgId) {
      const match = orgs.find(o => o.id === orgId);
      if (match) return match;
    }
    return orgs[0] || {
      id: 'default-org',
      name: 'Orion SCM OS',
      currency: 'USD',
      timezone: 'UTC',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  createOrganization: async (data: Partial<Organization>): Promise<Organization> => {
    const cleanName = data.name?.trim();
    if (!cleanName) {
      throw new Error('Organization name is required.');
    }

    const { data: inserted, error } = await supabase
      .from('organizations')
      .insert({
        name: cleanName,
        industry: data.industry?.trim() || 'Supply Chain / Logistics',
        country: data.country?.trim() || 'Global',
        currency: data.currency?.trim() || 'USD',
        timezone: data.timezone?.trim() || 'UTC',
        units: data.units || 'metric',
        logo_url: data.logoUrl || data.logo || null,
        status: data.status || 'active',
      })
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to create organization in Supabase.');
    }

    await organizationService.fetchOrganizationsAsync();
    return {
      id: inserted.id,
      name: inserted.name,
      industry: inserted.industry,
      country: inserted.country,
      currency: inserted.currency,
      timezone: inserted.timezone,
      units: inserted.units,
      logoUrl: inserted.logo_url,
      status: inserted.status,
      createdAt: inserted.created_at,
      updatedAt: inserted.updated_at,
    };
  },

  updateOrganization: async (id: string, updates: Partial<Organization>): Promise<Organization | null> => {
    const { data: updated, error } = await supabase
      .from('organizations')
      .update({
        ...(updates.name ? { name: updates.name.trim() } : {}),
        ...(updates.industry !== undefined ? { industry: updates.industry } : {}),
        ...(updates.country !== undefined ? { country: updates.country } : {}),
        ...(updates.currency !== undefined ? { currency: updates.currency } : {}),
        ...(updates.timezone !== undefined ? { timezone: updates.timezone } : {}),
        ...(updates.units !== undefined ? { units: updates.units } : {}),
        ...(updates.logoUrl !== undefined ? { logo_url: updates.logoUrl } : {}),
        ...(updates.status !== undefined ? { status: updates.status } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message || 'Failed to update organization in Supabase.');
    }

    await organizationService.fetchOrganizationsAsync();
    return {
      id: updated.id,
      name: updated.name,
      industry: updated.industry,
      country: updated.country,
      currency: updated.currency,
      timezone: updated.timezone,
      units: updated.units,
      logoUrl: updated.logo_url,
      status: updated.status,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  },

  setOrganizationStatus: (id: string, status: 'active' | 'inactive'): Promise<Organization | null> => {
    return organizationService.updateOrganization(id, { status });
  },

  deleteOrganization: async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('organizations')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message || 'Failed to delete organization from Supabase.');
    }

    await organizationService.fetchOrganizationsAsync();
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
