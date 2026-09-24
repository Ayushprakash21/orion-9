/**
 * ORION-9 STRATEGY & S&OP CONSENSUS PLANNING ENGINE
 *
 * Implements:
 * 1. Strategic supply chain objectives (service levels, turnover, cost, sustainability).
 * 2. Multi-scenario S&OP Consensus Planning with demand-supply alignment, inventory buffers, and executive approvals.
 */

import { StrategicObjectiveRecord, SopConsensusPlanRecord } from './types';
import { eventBus } from '../kernel/events/eventBus';

export class StrategyPlanningEngine {
  private static instance: StrategyPlanningEngine;
  private strategies: Map<string, StrategicObjectiveRecord[]> = new Map();
  private sopPlans: Map<string, SopConsensusPlanRecord[]> = new Map();

  public static getInstance(): StrategyPlanningEngine {
    if (!StrategyPlanningEngine.instance) {
      StrategyPlanningEngine.instance = new StrategyPlanningEngine();
    }
    return StrategyPlanningEngine.instance;
  }

  public setStrategy(strategy: StrategicObjectiveRecord): StrategicObjectiveRecord {
    const list = this.strategies.get(strategy.tenantId) || [];
    const idx = list.findIndex(s => s.strategyId === strategy.strategyId);
    if (idx >= 0) {
      list[idx] = strategy;
    } else {
      list.push(strategy);
    }
    this.strategies.set(strategy.tenantId, list);

    eventBus.emit({
      eventId: `EVT-STRAT-${Date.now()}`,
      eventType: 'STRATEGY_UPDATED',
      tenantId: strategy.tenantId,
      timestamp: new Date().toISOString(),
      payload: strategy,
      actor: { userId: 'SYSTEM', role: 'admin' }
    });

    return strategy;
  }

  public getActiveStrategy(tenantId: string): StrategicObjectiveRecord | undefined {
    const list = this.strategies.get(tenantId) || [];
    return list.find(s => s.status === 'ACTIVE') || list[0];
  }

  public createSopPlan(plan: Omit<SopConsensusPlanRecord, 'sopPlanId' | 'createdAt' | 'updatedAt'>): SopConsensusPlanRecord {
    const record: SopConsensusPlanRecord = {
      ...plan,
      sopPlanId: `SOP-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const list = this.sopPlans.get(record.tenantId) || [];
    list.push(record);
    this.sopPlans.set(record.tenantId, list);

    eventBus.emit({
      eventId: `EVT-SOP-${Date.now()}`,
      eventType: 'SOP_PLAN_CREATED',
      tenantId: record.tenantId,
      timestamp: new Date().toISOString(),
      payload: record,
      actor: { userId: 'PLANNER', role: 'planner' }
    });

    return record;
  }

  public approveSopPlan(tenantId: string, sopPlanId: string, approvedBy: string): SopConsensusPlanRecord {
    const list = this.sopPlans.get(tenantId) || [];
    const plan = list.find(p => p.sopPlanId === sopPlanId);
    if (!plan) throw new Error(`S&OP Plan ${sopPlanId} not found`);

    plan.approvalStatus = 'EXECUTIVE_APPROVED';
    plan.approvedBy = approvedBy;
    plan.updatedAt = new Date().toISOString();

    eventBus.emit({
      eventId: `EVT-SOP-APP-${Date.now()}`,
      eventType: 'SOP_PLAN_APPROVED',
      tenantId,
      timestamp: new Date().toISOString(),
      payload: { sopPlanId, approvedBy },
      actor: { userId: approvedBy, role: 'admin' }
    });

    return plan;
  }

  public getSopPlans(tenantId: string): SopConsensusPlanRecord[] {
    return this.sopPlans.get(tenantId) || [];
  }
}

export const strategyPlanningEngine = StrategyPlanningEngine.getInstance();
