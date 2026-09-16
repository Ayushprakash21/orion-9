import { RoleCode, PermissionCode } from '../types/auth';

// TEMPORARY LOCAL AUTH MODE — replace with Supabase/enterprise IdP before production.
// admin / admin is development-only and must be replaced before production deployment.

const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  platform_admin: [
    'users.read',
    'users.create',
    'users.update',
    'users.disable',
    'users.delete',
    'organizations.read',
    'organizations.create',
    'organizations.update',
    'organizations.disable',
    'branding.read',
    'branding.update',
    'roles.read',
    'roles.manage',
    'audit.read',
    'settings.read',
    'settings.manage',
    'inventory.read',
    'inventory.manage',
    'procurement.read',
    'procurement.manage',
    'shipments.read',
    'shipments.manage',
    'suppliers.read',
    'suppliers.manage',
    'analytics.read',
    'ai.insights'
  ],
  organization_admin: [
    'users.read',
    'users.create',
    'users.update',
    'users.disable',
    'organizations.read',
    'organizations.update',
    'roles.read',
    'audit.read',
    'settings.read',
    'settings.manage',
    'inventory.read',
    'inventory.manage',
    'procurement.read',
    'procurement.manage',
    'shipments.read',
    'shipments.manage',
    'suppliers.read',
    'suppliers.manage',
    'analytics.read',
    'ai.insights'
  ],
  supply_chain_manager: [
    'users.read',
    'inventory.read',
    'inventory.manage',
    'procurement.read',
    'procurement.manage',
    'shipments.read',
    'shipments.manage',
    'suppliers.read',
    'suppliers.manage',
    'analytics.read',
    'ai.insights'
  ],
  planner: [
    'inventory.read',
    'inventory.manage',
    'procurement.read',
    'shipments.read',
    'analytics.read',
    'ai.insights'
  ],
  procurement_user: [
    'procurement.read',
    'procurement.manage',
    'suppliers.read',
    'suppliers.manage',
    'inventory.read',
    'shipments.read'
  ],
  inventory_user: [
    'inventory.read',
    'inventory.manage',
    'shipments.read'
  ],
  viewer: [
    'inventory.read',
    'procurement.read',
    'shipments.read',
    'suppliers.read',
    'analytics.read'
  ],
  manager: [
    'users.read',
    'inventory.read',
    'inventory.manage',
    'procurement.read',
    'procurement.manage',
    'shipments.read',
    'shipments.manage',
    'suppliers.read',
    'suppliers.manage',
    'analytics.read',
    'ai.insights'
  ],
  user: [
    'inventory.read',
    'procurement.read',
    'shipments.read',
    'suppliers.read',
    'analytics.read'
  ],
};

export const permissionService = {
  /**
   * Returns default system permissions for a given role.
   */
  getDefaultPermissionsForRole: (role: RoleCode | string): PermissionCode[] => {
    return DEFAULT_ROLE_PERMISSIONS[role as RoleCode] || DEFAULT_ROLE_PERMISSIONS.user;
  },

  /**
   * Fetches permissions for a specific role.
   */
  getPermissionsForRole: async (roleCodeOrId: string, roleName?: string): Promise<PermissionCode[]> => {
    const roleKey = (roleName || roleCodeOrId).toLowerCase() as RoleCode;
    return permissionService.getDefaultPermissionsForRole(roleKey);
  },

  /**
   * Checks whether a set of permissions includes a required permission.
   */
  hasPermission: (userPermissions: PermissionCode[], required: PermissionCode): boolean => {
    return userPermissions.includes(required);
  },

  /**
   * Checks whether user role matches any allowed role.
   */
  hasRole: (userRole: RoleCode | string | undefined, allowedRoles: (RoleCode | string)[]): boolean => {
    if (!userRole) return false;
    return allowedRoles.includes(userRole);
  }
};
