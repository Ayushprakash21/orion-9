export const config = {
  DEMO_MODE: true,
  demoUser: {
    id: 'demo-user-id',
    email: 'demo@orion9.local',
    fullName: 'Ayush Prakash',
    displayName: 'Ayush',
    jobTitle: 'Platform Admin',
    department: 'Supply Chain / Operations',
    phone: '+1 555-0100',
    timezone: 'UTC',
    role: 'platform_admin' as const,
    organizationId: 'demo-org-id',
    avatarUrl: null,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  demoOrganization: {
    id: 'demo-org-id',
    name: 'Enterprise Supply Chain',
    industry: 'Logistics',
    country: 'Global',
    currency: 'USD',
    timezone: 'UTC',
    units: 'metric' as const,
    logoUrl: null,
    status: 'active' as const,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
};
