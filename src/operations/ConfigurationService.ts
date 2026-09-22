/**
 * ORION-9 WAVE 10: ENTERPRISE PRODUCTION CONTROL PLANE
 * ConfigurationService: Immutable Versioned Configuration Governance
 */

import { SystemConfig, ConfigVersion, ConfigCategory, RuntimeEnvironment } from './types';
import { environmentService } from './EnvironmentService';

export interface ConfigDiff {
  category: ConfigCategory;
  fromVersionId: string;
  toVersionId: string;
  addedKeys: string[];
  removedKeys: string[];
  modifiedKeys: Array<{
    key: string;
    oldValue: any;
    newValue: any;
    requiresRestart: boolean;
  }>;
}

export class ConfigurationService {
  private static instance: ConfigurationService;
  private configs: Map<string, SystemConfig> = new Map();
  private versions: Map<string, ConfigVersion> = new Map();

  private constructor() {
    this.seedDefaultConfigurations();
  }

  public static getInstance(): ConfigurationService {
    if (!ConfigurationService.instance) {
      ConfigurationService.instance = new ConfigurationService();
    }
    return ConfigurationService.instance;
  }

  private seedDefaultConfigurations(): void {
    const defaults: SystemConfig[] = [
      {
        key: 'system.maxConcurrentWorkflows',
        category: 'WORKFLOW',
        value: 50,
        defaultValue: 50,
        description: 'Maximum concurrent active workflows across the enterprise',
        isSecret: false,
        requiresRestart: false,
        isHotReloadable: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
        version: 1,
      },
      {
        key: 'ai.decisionConfidenceThreshold',
        category: 'AI',
        value: 0.85,
        defaultValue: 0.85,
        description: 'Minimum confidence required before AI recommendations trigger automatic approval routing',
        isSecret: false,
        requiresRestart: false,
        isHotReloadable: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
        version: 1,
      },
      {
        key: 'security.sessionTimeoutMinutes',
        category: 'SECURITY',
        value: 60,
        defaultValue: 60,
        description: 'Inactivity timeout for enterprise user and admin sessions',
        isSecret: false,
        requiresRestart: true,
        isHotReloadable: false,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
        version: 1,
      },
      {
        key: 'observability.logLevel',
        category: 'OBSERVABILITY',
        value: 'INFO',
        defaultValue: 'INFO',
        description: 'System runtime logging verbosity',
        isSecret: false,
        requiresRestart: false,
        isHotReloadable: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
        version: 1,
      },
      {
        key: 'performance.circuitBreakerFailureThreshold',
        category: 'PERFORMANCE',
        value: 5,
        defaultValue: 5,
        description: 'Number of consecutive external connector failures before circuit opens',
        isSecret: false,
        requiresRestart: false,
        isHotReloadable: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
        version: 1,
      },
      {
        key: 'integration.erpSyncIntervalSeconds',
        category: 'INTEGRATION',
        value: 300,
        defaultValue: 300,
        description: 'Background polling interval for external ERP connector synchronization',
        isSecret: false,
        requiresRestart: false,
        isHotReloadable: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'SYSTEM_BOOT',
        version: 1,
      },
    ];

    for (const c of defaults) {
      this.configs.set(c.key, c);
    }

    // Seed initial baseline version v1.0.0
    const initialParams: Record<string, any> = {};
    this.configs.forEach((cfg, k) => {
      initialParams[k] = cfg.value;
    });

    const initialVersion: ConfigVersion = {
      versionId: 'cfg-v1.0.0',
      tenantId: 'GLOBAL',
      environment: environmentService.getEnvironment(),
      category: 'SYSTEM',
      parameters: initialParams,
      checksum: 'sha256-baseline-v100',
      createdBy: 'SYSTEM_BOOT',
      createdAt: new Date().toISOString(),
      reason: 'Initial production verified baseline configuration',
      isApproved: true,
      approvedBy: 'PLATFORM_ADMIN',
      approvedAt: new Date().toISOString(),
    };

    this.versions.set(initialVersion.versionId, initialVersion);
  }

  public getConfig<T = any>(key: string, defaultValue?: T): T {
    const config = this.configs.get(key);
    if (config) {
      return config.value as T;
    }
    return (defaultValue !== undefined ? defaultValue : null) as T;
  }

  public getAllConfigs(tenantId?: string): SystemConfig[] {
    return Array.from(this.configs.values()).filter(c => !tenantId || !c.tenantId || c.tenantId === tenantId);
  }

  public setConfig(
    key: string,
    value: any,
    updatedBy: string,
    reason: string
  ): { success: boolean; requiresRestart: boolean; newVersion: number } {
    const existing = this.configs.get(key);
    if (!existing) {
      return { success: false, requiresRestart: false, newVersion: 0 };
    }

    const newVersionNum = existing.version + 1;
    existing.value = value;
    existing.updatedAt = new Date().toISOString();
    existing.updatedBy = updatedBy;
    existing.version = newVersionNum;
    this.configs.set(key, existing);

    // Create a new version snapshot
    const currentParams: Record<string, any> = {};
    this.configs.forEach((cfg, k) => {
      currentParams[k] = cfg.value;
    });

    const versionId = `cfg-v1.${newVersionNum}.0`;
    const newVersionRecord: ConfigVersion = {
      versionId,
      tenantId: existing.tenantId || 'GLOBAL',
      environment: environmentService.getEnvironment(),
      category: existing.category,
      parameters: currentParams,
      checksum: `sha256-${Date.now()}-${key}`,
      createdBy: updatedBy,
      createdAt: new Date().toISOString(),
      reason: `${reason} (Updated ${key})`,
      isApproved: true,
      approvedBy: updatedBy,
      approvedAt: new Date().toISOString(),
    };

    this.versions.set(versionId, newVersionRecord);

    return {
      success: true,
      requiresRestart: existing.requiresRestart,
      newVersion: newVersionNum,
    };
  }

  public getAllVersions(): ConfigVersion[] {
    return Array.from(this.versions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public getVersion(versionId: string): ConfigVersion | undefined {
    return this.versions.get(versionId);
  }

  /**
   * Compares two configuration versions and returns the structured delta.
   */
  public diffVersions(fromVersionId: string, toVersionId: string): ConfigDiff | null {
    const from = this.versions.get(fromVersionId);
    const to = this.versions.get(toVersionId);

    if (!from || !to) {
      return null;
    }

    const fromKeys = Object.keys(from.parameters);
    const toKeys = Object.keys(to.parameters);

    const addedKeys = toKeys.filter(k => !fromKeys.includes(k));
    const removedKeys = fromKeys.filter(k => !toKeys.includes(k));
    const modifiedKeys: ConfigDiff['modifiedKeys'] = [];

    for (const key of toKeys) {
      if (fromKeys.includes(key)) {
        const oldVal = from.parameters[key];
        const newVal = to.parameters[key];
        if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          const cfg = this.configs.get(key);
          modifiedKeys.push({
            key,
            oldValue: oldVal,
            newValue: newVal,
            requiresRestart: cfg ? cfg.requiresRestart : false,
          });
        }
      }
    }

    return {
      category: to.category,
      fromVersionId,
      toVersionId,
      addedKeys,
      removedKeys,
      modifiedKeys,
    };
  }

  /**
   * Performs an instant 1-click rollback to a designated target version.
   */
  public rollbackToVersion(
    targetVersionId: string,
    rolledBackBy: string,
    reason: string
  ): { success: boolean; restoredKeysCount: number } {
    const target = this.versions.get(targetVersionId);
    if (!target) {
      return { success: false, restoredKeysCount: 0 };
    }

    let restoredCount = 0;
    for (const [key, val] of Object.entries(target.parameters)) {
      const cfg = this.configs.get(key);
      if (cfg) {
        cfg.value = val;
        cfg.updatedAt = new Date().toISOString();
        cfg.updatedBy = `${rolledBackBy} (ROLLBACK to ${targetVersionId})`;
        cfg.version += 1;
        this.configs.set(key, cfg);
        restoredCount++;
      }
    }

    // Register a new version record marking the rollback
    const rollbackVersionId = `cfg-rollback-${Date.now()}`;
    const rollbackRecord: ConfigVersion = {
      versionId: rollbackVersionId,
      tenantId: target.tenantId,
      environment: environmentService.getEnvironment(),
      category: target.category,
      parameters: { ...target.parameters },
      checksum: `sha256-rollback-to-${targetVersionId}`,
      createdBy: rolledBackBy,
      createdAt: new Date().toISOString(),
      reason: `Rollback to ${targetVersionId}: ${reason}`,
      parentVersionId: targetVersionId,
      isApproved: true,
      approvedBy: rolledBackBy,
      approvedAt: new Date().toISOString(),
    };

    this.versions.set(rollbackVersionId, rollbackRecord);

    return { success: true, restoredKeysCount: restoredCount };
  }
}

export const configurationService = ConfigurationService.getInstance();
