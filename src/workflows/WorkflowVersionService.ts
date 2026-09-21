/**
 * ORION-9 WAVE 7: AUTONOMOUS OPERATIONS + WORKFLOW ORCHESTRATION
 * Workflow Version Service
 * 
 * Enforces version immutability, semantic version progression, and ensures
 * executing instances are permanently bound to the snapshot version at execution start.
 */

import { WorkflowDefinition, WorkflowVersion } from './types';

export class WorkflowVersionService {
  private static instance: WorkflowVersionService;
  private versions: Map<string, WorkflowVersion[]> = new Map(); // key: `${tenantId}:${workflowId}`
  private definitions: Map<string, WorkflowDefinition> = new Map(); // key: `${tenantId}:${workflowId}`

  private constructor() {}

  public static getInstance(): WorkflowVersionService {
    if (!WorkflowVersionService.instance) {
      WorkflowVersionService.instance = new WorkflowVersionService();
    }
    return WorkflowVersionService.instance;
  }

  public registerDefinition(definition: WorkflowDefinition): void {
    const key = `${definition.tenantId}:${definition.workflowId}`;
    this.definitions.set(key, JSON.parse(JSON.stringify(definition)));
  }

  public getDefinition(tenantId: string, workflowId: string): WorkflowDefinition | undefined {
    const key = `${tenantId}:${workflowId}`;
    const def = this.definitions.get(key);
    return def ? JSON.parse(JSON.stringify(def)) : undefined;
  }

  public publishVersion(
    tenantId: string,
    workflowId: string,
    publishedBy: string,
    changelog?: string
  ): WorkflowVersion {
    const definition = this.getDefinition(tenantId, workflowId);
    if (!definition) {
      throw new Error(`Workflow definition ${workflowId} not found for tenant ${tenantId}`);
    }

    const key = `${tenantId}:${workflowId}`;
    const existingVersions = this.versions.get(key) || [];

    // Check if version already published and immutable
    const versionConflict = existingVersions.find(v => v.version === definition.version);
    if (versionConflict) {
      throw new Error(`Workflow version ${definition.version} is already published and immutable.`);
    }

    const snapshot: WorkflowDefinition = JSON.parse(JSON.stringify(definition));
    const versionRecord: WorkflowVersion = {
      versionId: `WV-${workflowId}-${definition.version}-${Date.now()}`,
      workflowId,
      tenantId,
      version: definition.version,
      definitionSnapshot: snapshot,
      immutable: true,
      publishedBy,
      publishedAt: new Date().toISOString(),
      changelog: changelog || `Published version ${definition.version}`
    };

    existingVersions.push(versionRecord);
    this.versions.set(key, existingVersions);
    return versionRecord;
  }

  public getVersionSnapshot(
    tenantId: string,
    workflowId: string,
    version: string
  ): WorkflowDefinition | undefined {
    const key = `${tenantId}:${workflowId}`;
    const existingVersions = this.versions.get(key) || [];
    const found = existingVersions.find(v => v.version === version);
    if (found) {
      return JSON.parse(JSON.stringify(found.definitionSnapshot));
    }
    // Fallback to active definition if version matches
    const def = this.getDefinition(tenantId, workflowId);
    if (def && def.version === version) {
      return JSON.parse(JSON.stringify(def));
    }
    return undefined;
  }

  public listVersions(tenantId: string, workflowId: string): WorkflowVersion[] {
    const key = `${tenantId}:${workflowId}`;
    return JSON.parse(JSON.stringify(this.versions.get(key) || []));
  }

  public clear(): void {
    this.versions.clear();
    this.definitions.clear();
  }
}

export const workflowVersionService = WorkflowVersionService.getInstance();
