import { Organization } from '../types/auth';
import { organizationService } from '../services/organizationService';

export class OrganizationRepository {
  async getOrganization(orgId?: string): Promise<Organization | null> {
    if (orgId) {
      return organizationService.getOrganizationById(orgId) || null;
    }
    return organizationService.getOrganization();
  }

  async updateOrganization(orgId: string, data: Partial<Organization>): Promise<Organization> {
    const updated = organizationService.updateOrganization(orgId, data);
    if (!updated) throw new Error('Organization not found');
    return updated;
  }

  async getOrganizations(): Promise<Organization[]> {
    return organizationService.getOrganizations();
  }
}

export const organizationRepository = new OrganizationRepository();

