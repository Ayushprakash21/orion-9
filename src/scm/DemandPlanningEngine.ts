/**
 * ORION-9 PART 4 TRACK 2 — DEMAND PLANNING & S&OP ENGINE
 * Authoritatively persisted via Cloud Firestore (demand_plans, sop_scenarios) & ScmPersistenceService.
 */

import { scmTransactionEngine } from '../kernel/scm/ScmTransactionEngine';
import { AuthorizationActor } from '../kernel/authorization/AuthorizationEngine';
import { scmPersistenceService } from '../services/scm/ScmPersistenceService';
import { DemandPlanItem, DemandPlanRecord, SopScenarioRecord } from './types';

export class DemandPlanningEngine {
  private static instance: DemandPlanningEngine;
  private plans: Map<string, DemandPlanRecord> = new Map();
  private scenarios: Map<string, SopScenarioRecord> = new Map();

  private constructor() {}

  public static getInstance(): DemandPlanningEngine {
    if (!DemandPlanningEngine.instance) {
      DemandPlanningEngine.instance = new DemandPlanningEngine();
    }
    return DemandPlanningEngine.instance;
  }

  public async createDemandPlan(params: {
    tenantId: string;
    actor: AuthorizationActor;
    title: string;
    horizonStart: string;
    horizonEnd: string;
    items: DemandPlanItem[];
  }) {
    const planId = `DP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: DemandPlanRecord = {
      planId,
      tenantId: params.tenantId,
      title: params.title,
      horizonStart: params.horizonStart,
      horizonEnd: params.horizonEnd,
      items: params.items,
      status: 'DRAFT',
      createdBy: params.actor.id,
      createdAt: now,
      updatedAt: now,
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'DemandPlan:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'DemandPlan',
      entityId: planId,
      targetState: 'DRAFT',
      requiredPermission: 'demand_plan:create',
      payload: record,
    }, async (rec) => {
      this.plans.set(`${params.tenantId}:${planId}`, rec);
      await scmPersistenceService.saveRecord('demand_plans', planId, rec);
      return rec;
    });
  }

  public async approveDemandPlan(tenantId: string, planId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${planId}`;
    const plan = this.plans.get(key) || scmPersistenceService.getCachedRecord<DemandPlanRecord>('demand_plans', tenantId, planId);
    if (!plan) throw new Error(`Demand Plan ${planId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'DemandPlan:Approve',
      tenantId,
      actor,
      entityType: 'DemandPlan',
      entityId: planId,
      currentState: plan.status,
      targetState: 'APPROVED',
      requiredPermission: 'demand_plan:approve',
      payload: null,
    }, async () => {
      plan.status = 'APPROVED';
      plan.approvedBy = actor.id;
      plan.approvedAt = new Date().toISOString();
      plan.updatedAt = new Date().toISOString();
      this.plans.set(key, plan);
      await scmPersistenceService.saveRecord('demand_plans', planId, plan);
      return plan;
    });
  }

  public async publishDemandPlan(tenantId: string, planId: string, actor: AuthorizationActor) {
    const key = `${tenantId}:${planId}`;
    const plan = this.plans.get(key) || scmPersistenceService.getCachedRecord<DemandPlanRecord>('demand_plans', tenantId, planId);
    if (!plan) throw new Error(`Demand Plan ${planId} not found`);

    return scmTransactionEngine.executeCommand({
      commandName: 'DemandPlan:Publish',
      tenantId,
      actor,
      entityType: 'DemandPlan',
      entityId: planId,
      currentState: plan.status,
      targetState: 'PUBLISHED',
      requiredPermission: 'demand_plan:publish',
      payload: null,
    }, async () => {
      plan.status = 'PUBLISHED';
      plan.updatedAt = new Date().toISOString();
      this.plans.set(key, plan);
      await scmPersistenceService.saveRecord('demand_plans', planId, plan);
      return plan;
    });
  }

  public async createSopScenario(params: {
    tenantId: string;
    actor: AuthorizationActor;
    name: string;
    type: SopScenarioRecord['type'];
    planId: string;
    demandTotal: number;
    supplyCapacity: number;
    projectedRevenue: number;
    projectedCost: number;
    serviceLevelTarget: number;
    assumptions?: string[];
  }) {
    const scenarioId = `SOP-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const record: SopScenarioRecord = {
      scenarioId,
      tenantId: params.tenantId,
      name: params.name,
      type: params.type,
      planId: params.planId,
      demandTotal: params.demandTotal,
      supplyCapacity: params.supplyCapacity,
      projectedRevenue: params.projectedRevenue,
      projectedCost: params.projectedCost,
      serviceLevelTarget: params.serviceLevelTarget,
      status: 'DRAFT',
      assumptions: params.assumptions || [],
      createdBy: params.actor.id,
      createdAt: now,
      updatedAt: now,
    };

    return scmTransactionEngine.executeCommand({
      commandName: 'SopScenario:Create',
      tenantId: params.tenantId,
      actor: params.actor,
      entityType: 'SopScenario',
      entityId: scenarioId,
      targetState: 'DRAFT',
      requiredPermission: 'sop_scenario:create',
      payload: record,
    }, async (rec) => {
      this.scenarios.set(`${params.tenantId}:${scenarioId}`, rec);
      await scmPersistenceService.saveRecord('sop_scenarios', scenarioId, rec);
      return rec;
    });
  }

  public getPlan(tenantId: string, planId: string): DemandPlanRecord | undefined {
    return this.plans.get(`${tenantId}:${planId}`) || scmPersistenceService.getCachedRecord<DemandPlanRecord>('demand_plans', tenantId, planId);
  }

  public getScenario(tenantId: string, scenarioId: string): SopScenarioRecord | undefined {
    return this.scenarios.get(`${tenantId}:${scenarioId}`) || scmPersistenceService.getCachedRecord<SopScenarioRecord>('sop_scenarios', tenantId, scenarioId);
  }

  public clear(): void {
    this.plans.clear();
    this.scenarios.clear();
    scmPersistenceService.clear('demand_plans');
    scmPersistenceService.clear('sop_scenarios');
  }
}

export const demandPlanningEngine = DemandPlanningEngine.getInstance();
