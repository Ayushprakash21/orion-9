import { RoleCode, PermissionCode, ALL_ORION_PERMISSIONS } from '../types/auth';

// DEMO / LOCAL AUTH MODE — Authoritative DEMO platform-admin permission resolver
// Guarantees platform_admin automatically receives all current and future permissions.

const DEFAULT_ROLE_PERMISSIONS: Record<RoleCode, PermissionCode[]> = {
  platform_admin: [...ALL_ORION_PERMISSIONS],
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
   * Authoritative platform admin permission resolver.
   * Dynamically yields every permission currently supported by the Orion-9 permission model.
   */
  getPlatformAdminPermissions: (): PermissionCode[] => {
    return [...ALL_ORION_PERMISSIONS];
  },

  getAllPermissions: (): PermissionCode[] => {
    return [...ALL_ORION_PERMISSIONS];
  },

  /**
   * Returns default system permissions for a given role.
   */
  getDefaultPermissionsForRole: (role: RoleCode | string): PermissionCode[] => {
    if (role === 'platform_admin') {
      return permissionService.getPlatformAdminPermissions();
    }
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
