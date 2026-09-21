/**
 * ORION-9 WAVE 8: ENTERPRISE DIGITAL TWIN + SCENARIO INTELLIGENCE + SIMULATION
 * Scenario Engine
 * 
 * Manages scenario definitions, parameter validation, explicit assumptions,
 * and lifecycle transitions across all 12 core supply chain scenario archetypes.
 */

import {
  Scenario,
  ScenarioType,
  ScenarioStatus,
  ScenarioAssumption,
  ScenarioParameters,
  SimulationResult,
} from './types';

export class ScenarioEngine {
  private static instance: ScenarioEngine;
  private scenarios: Map<string, Scenario> = new Map(); // key: `${tenantId}:${scenarioId}`

  private constructor() {}

  public static getInstance(): ScenarioEngine {
    if (!ScenarioEngine.instance) {
      ScenarioEngine.instance = new ScenarioEngine();
    }
    return ScenarioEngine.instance;
  }

  public createScenario(
    arg1: any,
    name?: string,
    description?: string,
    scenarioType?: ScenarioType,
    parameters?: ScenarioParameters,
    assumptions?: ScenarioAssumption[],
    createdBy?: string
  ): Scenario {
    let params: {
      tenantId: string;
      name: string;
      description: string;
      scenarioType: ScenarioType;
      baseSnapshotId?: string;
      createdBy?: string;
      parameters: ScenarioParameters;
      assumptions?: ScenarioAssumption[];
      correlationId?: string;
    };

    if (typeof arg1 === 'string') {
      params = {
        tenantId: arg1,
        name: name!,
        description: description || '',
        scenarioType: scenarioType || 'CUSTOM',
        baseSnapshotId: 'BASE-SNAPSHOT',
        createdBy: createdBy || 'system',
        parameters: parameters || ({} as any),
        assumptions: assumptions || []
      };
    } else {
      params = arg1;
    }

    // Validation checks
    if (!params.tenantId) {
      throw new Error('Tenant ID is required for scenario creation');
    }

    if (params.parameters) {
      const p = params.parameters as any;
      if (typeof p.severity === 'number' && (p.severity < 0 || p.severity > 1.0)) {
        throw new Error(`Invalid severity: ${p.severity}. Severity must be between 0.0 and 1.0`);
      }
      if (typeof p.durationDays === 'number' && p.durationDays < 0) {
        throw new Error(`Invalid durationDays: ${p.durationDays}. Must be non-negative`);
      }
    }

    if (params.assumptions && Array.isArray(params.assumptions)) {
      for (const a of params.assumptions) {
        if (typeof a.confidence === 'number' && (a.confidence < 0 || a.confidence > 1.0)) {
          throw new Error(`Invalid assumption confidence: ${a.confidence}. Must be between 0.0 and 1.0`);
        }
      }
    }

    const scenarioId = `SCEN-${params.tenantId}-${Date.now()}-${Math.floor(Date.now() % 10000)}`;
    const now = new Date().toISOString();

    const scenario: Scenario = {
      scenarioId,
      id: scenarioId,
      tenantId: params.tenantId,
      name: params.name,
      description: params.description,
      scenarioType: params.scenarioType,
      type: params.scenarioType,
      baseSnapshotId: params.baseSnapshotId || 'BASE-SNAPSHOT',
      createdBy: params.createdBy || 'system',
      createdAt: now,
      updatedAt: now,
      status: 'READY',
      assumptions: params.assumptions || [],
      parameters: params.parameters,
      correlationId: params.correlationId || `CORR-SCEN-${scenarioId}`,
    } as any;

    this.scenarios.set(`${params.tenantId}:${scenarioId}`, scenario);
    return JSON.parse(JSON.stringify(scenario));
  }

  public getScenario(tenantId: string, scenarioId: string): Scenario | undefined {
    // Cross tenant check
    for (const [, scn] of this.scenarios.entries()) {
      if (scn.scenarioId === scenarioId || (scn as any).id === scenarioId) {
        if (scn.tenantId !== tenantId) {
          throw new Error(`Cross-tenant access denied: scenario ${scenarioId} belongs to ${scn.tenantId}, requested by ${tenantId}`);
        }
        return JSON.parse(JSON.stringify(scn));
      }
    }
    return undefined;
  }

  public listScenarios(tenantId: string, status?: ScenarioStatus): Scenario[] {
    const res: Scenario[] = [];
    for (const [key, scn] of this.scenarios.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        if (!status || scn.status === status) {
          res.push(JSON.parse(JSON.stringify(scn)));
        }
      }
    }
    return res.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public updateStatus(tenantId: string, scenarioId: string, newStatus: ScenarioStatus): Scenario {
    const key = `${tenantId}:${scenarioId}`;
    const scn = this.scenarios.get(key);
    if (!scn) {
      throw new Error(`Scenario ${scenarioId} not found for tenant ${tenantId}`);
    }

    scn.status = newStatus;
    scn.updatedAt = new Date().toISOString();
    return JSON.parse(JSON.stringify(scn));
  }

  public addAssumption(tenantId: string, scenarioId: string, assumption: Omit<ScenarioAssumption, 'assumptionId' | 'createdAt'>): ScenarioAssumption {
    const key = `${tenantId}:${scenarioId}`;
    const scn = this.scenarios.get(key);
    if (!scn) {
      throw new Error(`Scenario ${scenarioId} not found for tenant ${tenantId}`);
    }

    const fullAssumption: ScenarioAssumption = {
      assumptionId: `ASSUMP-${scenarioId}-${Date.now()}-${Math.floor(Date.now() % 1000)}`,
      createdAt: new Date().toISOString(),
      ...assumption,
    };

    scn.assumptions.push(fullAssumption);
    scn.updatedAt = new Date().toISOString();
    return fullAssumption;
  }

  public attachResult(tenantId: string, scenarioId: string, result: SimulationResult): void {
    const key = `${tenantId}:${scenarioId}`;
    const scn = this.scenarios.get(key);
    if (scn) {
      scn.results = JSON.parse(JSON.stringify(result));
      scn.status = 'COMPLETED';
      scn.updatedAt = new Date().toISOString();
    }
  }

  public clear(): void {
    this.scenarios.clear();
  }
}

export const scenarioEngine = ScenarioEngine.getInstance();
