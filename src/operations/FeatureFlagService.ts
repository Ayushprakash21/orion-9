/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * FeatureFlagService: Dynamic Feature Flags & Emergency Kill-Switches
 */

import { FeatureFlag, RuntimeEnvironment } from './types';
import { environmentService } from './EnvironmentService';

export class FeatureFlagService {
  private static instance: FeatureFlagService;
  private flags: Map<string, FeatureFlag> = new Map();

  private constructor() {
    this.seedDefaultFlags();
  }

  public static getInstance(): FeatureFlagService {
    if (!FeatureFlagService.instance) {
      FeatureFlagService.instance = new FeatureFlagService();
    }
    return FeatureFlagService.instance;
  }

  private seedDefaultFlags(): void {
    const defaults: FeatureFlag[] = [
      {
        key: 'enable_closed_loop_learning',
        description: 'Enable automated Wave 9 outcome learning signal aggregation',
        enabled: true,
        rolloutPercentage: 100,
        targetedTenants: ['*'],
        targetedEnvironments: ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'],
        emergencyKillSwitch: false,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
      },
      {
        key: 'enable_ai_agent_autonomous_dispatch',
        description: 'Allow Tier-1 low-risk actions to be dispatched autonomously by AI agents',
        enabled: true,
        rolloutPercentage: 100,
        targetedTenants: ['*'],
        targetedEnvironments: ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'],
        emergencyKillSwitch: false,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
      },
      {
        key: 'enable_digital_twin_reconciliation',
        description: 'Enable real-time Digital Twin node state reconciliation with ERP feed',
        enabled: true,
        rolloutPercentage: 100,
        targetedTenants: ['*'],
        targetedEnvironments: ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'],
        emergencyKillSwitch: false,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
      },
      {
        key: 'enable_deep_circuit_breakers',
        description: 'Enable automatic circuit breaking on external supplier EDI and ERP connectors',
        enabled: true,
        rolloutPercentage: 100,
        targetedTenants: ['*'],
        targetedEnvironments: ['DEVELOPMENT', 'TEST', 'STAGING', 'PRODUCTION'],
        emergencyKillSwitch: false,
        lastUpdated: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
      },
    ];

    for (const f of defaults) {
      this.flags.set(f.key, f);
    }
  }

  /**
   * Evaluates whether a feature flag is active for a given tenant, user, and environment.
   * Deterministic hashing ensures sticky rollouts across sessions.
   */
  public isEnabled(
    flagKey: string,
    context?: {
      tenantId?: string;
      userId?: string;
      role?: string;
      environment?: RuntimeEnvironment;
    }
  ): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) return false;

    // Emergency kill switch immediately disables the flag everywhere
    if (flag.emergencyKillSwitch || !flag.enabled) {
      return false;
    }

    const currentEnv = context?.environment || environmentService.getEnvironment();
    if (!flag.targetedEnvironments.includes(currentEnv)) {
      return false;
    }

    const tenantId = context?.tenantId || 'DEFAULT_TENANT';
    if (!flag.targetedTenants.includes('*') && !flag.targetedTenants.includes(tenantId)) {
      return false;
    }

    if (flag.targetedRoles && flag.targetedRoles.length > 0 && context?.role) {
      if (!flag.targetedRoles.includes(context.role)) {
        return false;
      }
    }

    if (flag.rolloutPercentage >= 100) {
      return true;
    }
    if (flag.rolloutPercentage <= 0) {
      return false;
    }

    // Deterministic hash based on flagKey and entity identifier
    const entityId = context?.userId || tenantId;
    const bucket = this.hashToBucket(`${flagKey}:${entityId}`);
    return bucket < flag.rolloutPercentage;
  }

  private hashToBucket(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  public getAllFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  public setFlag(flag: FeatureFlag): void {
    this.flags.set(flag.key, flag);
  }

  public tripEmergencyKillSwitch(flagKey: string, triggeredBy: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) return false;
    flag.emergencyKillSwitch = true;
    flag.lastUpdated = new Date().toISOString();
    flag.updatedBy = `${triggeredBy} (KILL_SWITCH)`;
    this.flags.set(flagKey, flag);
    return true;
  }

  public resetEmergencyKillSwitch(flagKey: string, resetBy: string): boolean {
    const flag = this.flags.get(flagKey);
    if (!flag) return false;
    flag.emergencyKillSwitch = false;
    flag.lastUpdated = new Date().toISOString();
    flag.updatedBy = `${resetBy} (KILL_SWITCH_RESET)`;
    this.flags.set(flagKey, flag);
    return true;
  }
}

export const featureFlagService = FeatureFlagService.getInstance();
