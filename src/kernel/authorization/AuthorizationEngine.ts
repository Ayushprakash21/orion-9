/**
 * AuthorizationEngine
 *
 * Evaluates whether an actor has the required permissions to execute a command
 * on a given resource type. Designed to be extended with database-backed
 * permission rules; currently relies on the actor's role list.
 */

// Actor types (mirrors CommandEnvelope actor.type in types.ts, extended for kernel).
export enum ActorType {
  USER = 'USER',
  ADMIN = 'ADMIN',
  SYSTEM = 'SYSTEM',
  SERVICE = 'SERVICE',
  AI_AGENT = 'AI_AGENT',
  INTEGRATION = 'EXTERNAL_INTEGRATION',
  SCHEDULER = 'SCHEDULER',
}

export interface AuthorizationActor {
  id: string;
  type: ActorType | string;
  name?: string;
  roles: string[];
  organizationId: string;
}

export interface AuthorizationContext {
  actor: AuthorizationActor;
  resourceType: string;
  resourceId?: string;
  requiredPermission: string;
  organizationId: string;
}

export interface AuthorizationResult {
  authorized: boolean;
  reason?: string;
  matchedRole?: string;
}

// Inline error class — avoids dependency on non-existent KernelError module.
class AuthorizationError extends Error {
  code: 'UNAUTHORIZED' | 'TENANT_ACCESS_DENIED';
  constructor(code: 'UNAUTHORIZED' | 'TENANT_ACCESS_DENIED', message: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = code;
  }
}

/**
 * Minimal permission map.
 * Key: "<resourceType>:<action>" → allowed ActorTypes and role codes.
 * Extend this map as modules are added.
 */
const RESOURCE_PERMISSION_MAP: Record<
  string,
  { actorTypes: string[]; roles: string[] }
> = {
  'purchase_order:create': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer'],
  },
  'purchase_order:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager'],
  },
  'purchase_order:reject': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager'],
  },
  'purchase_order:read': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'viewer', 'auditor'],
  },
  'purchase_order:cancel': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer'],
  },
};

export class AuthorizationEngine {
  /**
   * Checks that the actor is allowed to perform the required action.
   * Throws AuthorizationError on denial.
   */
  authorize(ctx: AuthorizationContext): AuthorizationResult {
    const { actor, requiredPermission, organizationId } = ctx;

    // System-originated commands from the trusted internal kernel actor always pass.
    // AI agents still go through policy & approval downstream.
    if (actor.type === 'SYSTEM' && actor.id === 'orion-kernel') {
      return { authorized: true, reason: 'Internal system actor', matchedRole: 'SYSTEM' };
    }

    // Tenant isolation: actor must belong to the same organization.
    if (actor.organizationId !== organizationId) {
      throw new AuthorizationError(
        'TENANT_ACCESS_DENIED',
        `Actor organization '${actor.organizationId}' does not match command organization '${organizationId}'.`
      );
    }

    const permissionRule = RESOURCE_PERMISSION_MAP[requiredPermission];

    if (!permissionRule) {
      // Unknown permission — fail closed (deny by default).
      throw new AuthorizationError(
        'UNAUTHORIZED',
        `No permission rule defined for '${requiredPermission}'. Denied by default.`
      );
    }

    // Check actor type is allowed.
    if (!permissionRule.actorTypes.includes(actor.type as string)) {
      throw new AuthorizationError(
        'UNAUTHORIZED',
        `Actor type '${actor.type}' is not allowed to perform '${requiredPermission}'.`
      );
    }

    // Check that at least one actor role satisfies the permission.
    const matchedRole = actor.roles.find((r) => permissionRule.roles.includes(r));
    if (!matchedRole) {
      throw new AuthorizationError(
        'UNAUTHORIZED',
        `Actor '${actor.id}' has roles [${actor.roles.join(', ')}] but requires one of [${permissionRule.roles.join(', ')}] for '${requiredPermission}'.`
      );
    }

    return { authorized: true, matchedRole };
  }
}

export const authorizationEngine = new AuthorizationEngine();
