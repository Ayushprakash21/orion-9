export type RoleCode = 
  | 'platform_admin'
  | 'organization_admin'
  | 'supply_chain_manager'
  | 'planner'
  | 'procurement_user'
  | 'inventory_user'
  | 'viewer'
  | 'manager'
  | 'user';

export type PermissionCode = 
  | 'users.read' | 'users.create' | 'users.update' | 'users.disable' | 'users.delete'
  | 'organizations.read' | 'organizations.create' | 'organizations.update' | 'organizations.disable'
  | 'branding.read' | 'branding.update'
  | 'roles.read' | 'roles.manage'
  | 'audit.read'
  | 'settings.read' | 'settings.manage'
  | 'inventory.read' | 'inventory.manage'
  | 'procurement.read' | 'procurement.manage'
  | 'shipments.read' | 'shipments.manage'
  | 'suppliers.read' | 'suppliers.manage'
  | 'analytics.read' | 'ai.insights';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  displayName?: string;
  jobTitle?: string;
  department?: string;
  phone?: string;
  timezone?: string;
  role: RoleCode;
  organizationId?: string;
  organizationName?: string;
  avatarUrl?: string | null;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  onboardingCompleted?: boolean;
  lastLoginAt?: string | null;
  lastActiveAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrganizationMembership {
  id: string;
  userId: string;
  organizationId: string;
  roleId?: string;
  roleCode?: RoleCode;
  status: 'active' | 'inactive';
  organization?: Organization;
}

export interface Organization {
  id: string;
  name: string;
  industry?: string;
  country?: string;
  currency: string;
  timezone: string;
  units?: 'metric' | 'imperial';
  logoUrl?: string | null;
  logo?: string | null;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface SessionState {
  user: AuthUser | null;
  profile: UserProfile | null;
  organization: Organization | null;
  permissions: PermissionCode[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface BrandingConfig {
  appName: string;
  applicationName?: string;
  osName?: string;
  productName?: string;
  tagline?: string;
  version?: string;
  organizationName: string;
  description: string;
  logoUrl?: string | null;
  logo?: string | null;
  faviconUrl?: string | null;
  logoIncludesName?: boolean;
  logoIncludesWordmark?: boolean;
  creatorName?: string;
  creatorTitle?: string;
  creatorQuote?: string;
  creatorPhotoUrl?: string | null;
  founderNote?: string;
}

export interface AuditEvent {
  id: string;
  organizationId?: string;
  actorUserId: string;
  actorName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  timestamp: string;
  status: 'success' | 'failure';
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

export interface PrivilegedAdminSession {
  token: string;
  userId: string;
  organizationId: string;
  role: RoleCode;
  createdAt: string;
  expiresAt: string;
  authenticationMethod: 'step_up_password' | 'mfa_totp' | 'enterprise_sso';
  correlationId: string;
}
