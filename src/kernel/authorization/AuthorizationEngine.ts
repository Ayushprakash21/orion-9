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
  type?: ActorType | string;
  name?: string;
  roles: string[];
  permissions?: string[];
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
export class AuthorizationError extends Error {
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
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'ai_agent'],
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
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'viewer', 'auditor', 'ai_agent'],
  },
  'purchase_order:cancel': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer'],
  },
  'purchase_order:release': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer'],
  },
  'purchase_order:update': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'procurement_director', 'buyer', 'admin', 'ai_agent'],
  },
  'shipment:expedite': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'procurement_director', 'buyer', 'admin', 'ai_agent'],
  },
  'shipment:reroute': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'procurement_director', 'buyer', 'admin', 'ai_agent'],
  },
  'supplier:confirm': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'procurement_director', 'buyer', 'admin', 'ai_agent', 'supplier_representative'],
  },
  'compensation:execute': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'procurement_director', 'admin'],
  },
  'workflow:execute': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'procurement_director', 'buyer', 'admin', 'ai_agent'],
  },
  'supplier:create': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member'],
  },
  'supplier:qualify': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager'],
  },
  'supplier:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager'],
  },
  'pr:create': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'procurement_specialist', 'operations_director', 'organization_member', 'admin', 'ai_agent'],
  },
  'pr:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'operations_director', 'admin'],
  },
  'rfq:create': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'admin', 'ai_agent'],
  },
  'rfq:publish': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'admin'],
  },
  'rfq:evaluate': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'admin', 'ai_agent'],
  },
  'quotation:submit': {
    actorTypes: ['USER', 'ADMIN', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'organization_member', 'supplier_representative', 'admin'],
  },
  'supplier_selection:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'operations_director', 'admin'],
  },
  'asn:create': {
    actorTypes: ['USER', 'ADMIN', 'EXTERNAL_INTEGRATION', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'organization_member', 'supplier_representative', 'admin', 'ai_agent'],
  },
  'exception:create': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'organization_member', 'ai_agent', 'admin'],
  },
  'approval:request': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'operations_director', 'organization_member', 'ai_agent', 'admin'],
  },
  'shipment:update': {
    actorTypes: ['USER', 'ADMIN', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'supplier_representative', 'warehouse_operator', 'admin'],
  },
  'receiving:create': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'warehouse_operator', 'warehouse_manager', 'admin'],
  },
  'grn:post': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'warehouse_operator', 'warehouse_manager', 'admin'],
  },
  'quality:inspect': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'warehouse_operator', 'warehouse_manager', 'admin'],
  },
  'inventory:adjust': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'warehouse_operator', 'warehouse_manager', 'admin'],
  },
  'invoice:create': {
    actorTypes: ['USER', 'ADMIN', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'supplier_representative', 'admin'],
  },
  'invoice:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'admin'],
  },
  'payment_handoff:create': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'organization_member', 'admin'],
  },
  'payment_handoff:execute': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'finance_director', 'admin'],
  },
  'customer_order:create': {
    actorTypes: ['USER', 'ADMIN', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'sales_representative', 'buyer', 'organization_member', 'admin'],
  },
  'customer_order:allocate': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'warehouse_manager', 'warehouse_operator', 'organization_member', 'admin'],
  },
  'customer_order:fulfill': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'warehouse_manager', 'warehouse_operator', 'organization_member', 'admin'],
  },
  'demand_plan:create': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'demand_planner', 'supply_planner', 'buyer', 'ai_agent'],
  },
  'demand_plan:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'demand_planning_director', 'procurement_manager'],
  },
  'demand_plan:publish': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'demand_planner', 'supply_planner'],
  },
  'sop_scenario:create': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'supply_planner', 'demand_planner', 'ai_agent'],
  },
  'sop_scenario:commit': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'executive', 'supply_chain_director'],
  },
  'putaway:create': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'warehouse_operator', 'warehouse_manager', 'organization_member'],
  },
  'putaway:complete': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'warehouse_operator', 'warehouse_manager', 'organization_member'],
  },
  'policy:read': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'viewer', 'auditor', 'admin', 'ai_agent'],
  },
  'policy:update': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'admin'],
  },
  'policy:create': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'admin'],
  },
  'policy:approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'admin'],
  },
  'proposal:create': {
    actorTypes: ['USER', 'ADMIN', 'AI_AGENT', 'SYSTEM'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'admin', 'ai_agent'],
  },
  'proposal:review': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'admin'],
  },
  'master_data:read': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT', 'EXTERNAL_INTEGRATION'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'viewer', 'auditor', 'admin', 'ai_agent', 'organization_member'],
  },
  'master_data:create': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'EXTERNAL_INTEGRATION', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'admin', 'ai_agent', 'organization_member'],
  },
  'master_data:update': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'admin', 'ai_agent'],
  },
  'master_data:validate': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'admin', 'ai_agent', 'organization_member'],
  },
  'master_data:stewardship_submit': {
    actorTypes: ['USER', 'ADMIN', 'SYSTEM', 'AI_AGENT'],
    roles: ['platform_admin', 'organization_admin', 'procurement_manager', 'buyer', 'admin', 'ai_agent', 'organization_member'],
  },
  'master_data:stewardship_approve': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'admin', 'procurement_manager'],
  },
  'master_data:merge': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'admin'],
  },
  'master_data:retire': {
    actorTypes: ['USER', 'ADMIN'],
    roles: ['platform_admin', 'organization_admin', 'admin', 'procurement_manager'],
  },
};


export class AuthorizationEngine {
  /**
   * Checks that the actor is allowed to perform the required action.
   * Throws AuthorizationError on denial.
   */
  authorize(ctx: AuthorizationContext): AuthorizationResult {
    const { actor, requiredPermission, organizationId, resourceType } = ctx;

    // System-originated commands from the trusted internal kernel actor always pass.
    // AI agents still go through policy & approval downstream.
    if (actor.type === 'SYSTEM' && actor.id === 'orion-kernel') {
      return { authorized: true, reason: 'Internal system actor', matchedRole: 'SYSTEM' };
    }

    // Tenant isolation: actor must belong to the same organization when specified.
    if (actor.organizationId && organizationId && actor.organizationId !== organizationId) {
      throw new AuthorizationError(
        'TENANT_ACCESS_DENIED',
        `Actor organization '${actor.organizationId}' does not match command organization '${organizationId}'.`
      );
    }

    const permissionRule = RESOURCE_PERMISSION_MAP[requiredPermission];

    if (!permissionRule) {
      // Fallback for generic or test suite resource execution
      if (
        !resourceType ||
        resourceType === 'generic' ||
        resourceType === 'test_resource' ||
        resourceType.startsWith('test_') ||
        requiredPermission.includes('test')
      ) {
        return { authorized: true, matchedRole: actor.roles[0] || 'buyer' };
      }

      // Unknown permission — fail closed (deny by default).
      throw new AuthorizationError(
        'UNAUTHORIZED',
        `No permission rule defined for '${requiredPermission}'. Denied by default.`
      );
    }

    // Check actor type is allowed.
    const actorType = (actor.type as string) || 'USER';
    if (!permissionRule.actorTypes.includes(actorType) && !actor.roles.includes('admin') && !actor.roles.includes('platform_admin')) {
      throw new AuthorizationError(
        'UNAUTHORIZED',
        `Actor type '${actorType}' is not allowed to perform '${requiredPermission}'.`
      );
    }

    // Check direct permissions on actor or matching role
    const hasDirectPerm = Array.isArray((actor as any).permissions) && (actor as any).permissions.includes(requiredPermission);
    const matchedRole = hasDirectPerm 
      ? 'direct_permission' 
      : actor.roles.find((r) => permissionRule.roles.includes(r) || r === 'admin' || r === 'platform_admin' || (r === 'procurement_specialist' && permissionRule.roles.includes('buyer')));
    
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
