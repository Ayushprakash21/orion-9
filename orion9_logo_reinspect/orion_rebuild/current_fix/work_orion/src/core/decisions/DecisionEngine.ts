import { Decision } from '../types';
import { DecisionEngine as LegacyDecisionEngine } from '../../services/DecisionEngine';
import { eventEngine } from '../events/EventEngine';

export class CoreDecisionEngine {
  private static instance: CoreDecisionEngine;
  private decisions: Decision[] = [];

  private constructor() {
    this.subscribeToEvents();
  }

  public static getInstance(): CoreDecisionEngine {
    if (!CoreDecisionEngine.instance) {
      CoreDecisionEngine.instance = new CoreDecisionEngine();
    }
    return CoreDecisionEngine.instance;
  }

  private subscribeToEvents() {
    eventEngine.subscribe('SUPPLIER_RISK_CHANGED', (event) => {
      this.generateDecision({
        id: `DEC_${crypto.randomUUID()}`,
        type: 'SUPPLIER_RISK_MITIGATION',
        priority: event.severity === 'Critical' ? 'High' : 'Medium',
        confidence: 0.85,
        impact: 'High',
        affectedEntity: event.entityId,
        reason: 'Supplier risk event detected',
        recommendedAction: 'Identify alternative suppliers and evaluate inbound shipment impact',
        status: 'DETECTED',
        createdAt: new Date().toISOString()
      });
    });

    eventEngine.subscribe('INVENTORY_STOCKOUT_RISK', (event) => {
      this.generateDecision({
        id: `DEC_${crypto.randomUUID()}`,
        type: 'INVENTORY_REPLENISHMENT',
        priority: 'High',
        confidence: 0.9,
        impact: 'Critical',
        affectedEntity: event.entityId,
        reason: 'Inventory stockout risk detected',
        recommendedAction: 'Expedite open purchase orders or create a new emergency PO',
        status: 'DETECTED',
        createdAt: new Date().toISOString()
      });
    });
  }

  public generateDecision(decision: any) {
    const isDuplicate = this.decisions.some(d => (d as any).affectedEntity === decision.affectedEntity && (d as any).type === decision.type && d.status !== 'CLOSED' && d.status !== 'FAILED');
    if (!isDuplicate) {
      this.decisions.push(decision);
    }
  }

  public getDecisions(): Decision[] {
    return this.decisions;
  }
}

export const decisionEngine = CoreDecisionEngine.getInstance();
