import { Inventory, PurchaseOrder, Shipment, Supplier, Exception } from '../types';

export type AutonomyMode = 'MANUAL' | 'COPILOT' | 'AUTOPILOT';
export type WorkItemStatus = 'PROPOSED' | 'APPROVED' | 'REJECTED' | 'EXECUTED';

export interface OrionEvent {
  id: string;
  type: string;
  source: string;
  entity: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
  description: string;
  processed: boolean;
}

export interface OrionDecision {
  id: string;
  title: string;
  reason: string;
  impact: string;
  confidence: number;
  valueAtRisk: number;
  recommendedAction: string;
  mode: AutonomyMode;
  status: WorkItemStatus;
  policy: string;
  createdAt: string;
}

export interface OrionScenario {
  id: string;
  name: string;
  demandDelta: number;
  leadTimeDelta: number;
  freightDelta: number;
  serviceLevel: number;
  inventoryImpact: number;
  financialImpact: number;
  riskScore: number;
  createdAt: string;
}

export interface OrionAgent {
  id: string;
  name: string;
  domain: string;
  status: 'READY' | 'RUNNING' | 'WAITING_APPROVAL';
  actionsToday: number;
  successRate: number;
  autonomy: AutonomyMode;
}

export interface OrionIntegration {
  id: string;
  name: string;
  category: string;
  status: 'CONNECTED' | 'DEGRADED' | 'NOT_CONNECTED';
  recordsToday: number;
  lastSync: string;
}

export interface OrionMasterDataIssue {
  id: string;
  type: string;
  entity: string;
  count: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface OrionSnapshot {
  health: number;
  valueAtRisk: number;
  inventoryValue: number;
  openExceptions: number;
  criticalExceptions: number;
  delayedShipments: number;
  supplierOtif: number;
  events: OrionEvent[];
  decisions: OrionDecision[];
  agents: OrionAgent[];
  integrations: OrionIntegration[];
  masterDataIssues: OrionMasterDataIssue[];
  scenarios: OrionScenario[];
  learning: {
    predictions: number;
    verified: number;
    accuracy: number;
    avoidedCost: number;
  };
}

const money = (value: number) => Math.max(0, Math.round(value));
const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export class AutonomousOperationsEngine {
  static buildSnapshot(input: {
    inventory: Inventory[];
    purchaseOrders: PurchaseOrder[];
    shipments: Shipment[];
    suppliers: Supplier[];
    exceptions: Exception[];
  }): OrionSnapshot {
    const { inventory, purchaseOrders, shipments, suppliers, exceptions } = input;
    const inventoryValue = inventory.reduce((sum, i) => sum + i.onHand * i.unitCost, 0);
    const openExceptions = exceptions.filter(e => e.status !== 'Resolved' && e.status !== 'Dismissed');
    const criticalExceptions = openExceptions.filter(e => e.severity === 'Critical');
    const delayedShipments = shipments.filter(s => s.delayDays > 0 && s.status !== 'Delivered' && s.status !== 'Cancelled');
    const supplierOtif = suppliers.length ? suppliers.reduce((sum, s) => sum + (s.otif || 0), 0) / suppliers.length : 100;
    const valueAtRisk = openExceptions.reduce((sum, e) => sum + (e.estimatedImpact || 0), 0);
    const health = Math.max(0, Math.min(100, Math.round(100 - criticalExceptions.length * 10 - delayedShipments.length * 2 - Math.max(0, 92 - supplierOtif) * 0.4)));

    const events: OrionEvent[] = [
      ...criticalExceptions.slice(0, 4).map(e => ({ id: id('EVT'), type: e.type, source: 'Exception Engine', entity: e.entityId, severity: e.severity.toUpperCase() as OrionEvent['severity'], timestamp: e.date, description: e.description, processed: false })),
      ...delayedShipments.slice(0, 3).map(s => ({ id: id('EVT'), type: 'SHIPMENT_DELAY', source: 'Logistics Telemetry', entity: s.id, severity: s.delayDays >= 5 ? 'HIGH' as const : 'MEDIUM' as const, timestamp: new Date().toISOString(), description: `${s.carrier} is ${s.delayDays} day(s) late from ${s.origin} to ${s.destination}.`, processed: false })),
    ];

    const decisions: OrionDecision[] = openExceptions.slice(0, 6).map((e, index) => {
      const action = e.recommendedAction || (e.type.includes('Stock') ? 'Replenish / rebalance inventory' : 'Investigate and mitigate exception');
      const confidence = Math.max(68, Math.min(97, 94 - index * 3));
      const mode: AutonomyMode = e.severity === 'Critical' ? 'COPILOT' : 'AUTOPILOT';
      return {
        id: `DEC-${e.id}`,
        title: `Resolve ${e.type} — ${e.entityId}`,
        reason: e.description,
        impact: `${money(e.estimatedImpact).toLocaleString()} value exposed if unresolved.`,
        confidence,
        valueAtRisk: money(e.estimatedImpact),
        recommendedAction: action,
        mode,
        status: mode === 'AUTOPILOT' && e.severity !== 'Critical' ? 'PROPOSED' : 'PROPOSED',
        policy: e.severity === 'Critical' ? 'Critical changes require human approval' : 'Standard operating policy',
        createdAt: new Date().toISOString(),
      };
    });

    const agents: OrionAgent[] = [
      { id: 'AGT-PROC', name: 'Procurement Agent', domain: 'Procurement', status: 'READY', actionsToday: Math.max(4, purchaseOrders.length), successRate: 96, autonomy: 'COPILOT' },
      { id: 'AGT-INV', name: 'Inventory Agent', domain: 'Inventory', status: 'RUNNING', actionsToday: inventory.length, successRate: 98, autonomy: 'AUTOPILOT' },
      { id: 'AGT-LOG', name: 'Logistics Agent', domain: 'Transportation', status: delayedShipments.length ? 'WAITING_APPROVAL' : 'READY', actionsToday: shipments.length, successRate: 94, autonomy: 'COPILOT' },
      { id: 'AGT-RISK', name: 'Risk Agent', domain: 'Risk & Resilience', status: 'RUNNING', actionsToday: openExceptions.length, successRate: 97, autonomy: 'AUTOPILOT' },
      { id: 'AGT-FIN', name: 'Finance Agent', domain: 'Working Capital', status: 'READY', actionsToday: Math.max(3, Math.round(inventoryValue / 1000000)), successRate: 95, autonomy: 'COPILOT' },
      { id: 'AGT-CUST', name: 'Customer Agent', domain: 'Order Fulfillment', status: 'READY', actionsToday: Math.max(2, shipments.length), successRate: 93, autonomy: 'COPILOT' },
    ];

    const integrations: OrionIntegration[] = [
      { id: 'INT-ERP', name: 'ERP / Finance', category: 'ERP', status: 'CONNECTED', recordsToday: purchaseOrders.length * 7, lastSync: '2 min ago' },
      { id: 'INT-WMS', name: 'Warehouse Management', category: 'WMS', status: 'CONNECTED', recordsToday: inventory.length * 5, lastSync: '1 min ago' },
      { id: 'INT-TMS', name: 'Transportation', category: 'TMS', status: delayedShipments.length > 3 ? 'DEGRADED' : 'CONNECTED', recordsToday: shipments.length * 4, lastSync: '3 min ago' },
      { id: 'INT-MES', name: 'Manufacturing', category: 'MES', status: 'NOT_CONNECTED', recordsToday: 0, lastSync: 'Not connected' },
      { id: 'INT-CRM', name: 'Customer / CRM', category: 'CRM', status: 'NOT_CONNECTED', recordsToday: 0, lastSync: 'Not connected' },
      { id: 'INT-EXT', name: 'External Signals', category: 'Risk', status: 'CONNECTED', recordsToday: 38, lastSync: '5 min ago' },
    ];

    const masterDataIssues: OrionMasterDataIssue[] = [
      { id: 'MD-1', type: 'Duplicate Supplier', entity: 'Supplier master', count: Math.max(1, Math.round(suppliers.length * 0.03)), severity: 'MEDIUM', recommendation: 'Cluster similar names, tax IDs and addresses before merge.' },
      { id: 'MD-2', type: 'Missing Lead Time', entity: 'Product master', count: Math.max(1, Math.round(inventory.length * 0.05)), severity: 'HIGH', recommendation: 'Infer from PO and shipment history, then request approval.' },
      { id: 'MD-3', type: 'Unit / Cost Anomaly', entity: 'Inventory', count: Math.max(1, Math.round(inventory.length * 0.02)), severity: 'LOW', recommendation: 'Validate unit of measure and recent purchase price.' },
    ];

    const scenarios: OrionScenario[] = [
      this.simulateScenario('Port disruption +5 days', 0, 5, 8, inventoryValue, valueAtRisk),
      this.simulateScenario('Demand surge +20%', 20, 0, 4, inventoryValue, valueAtRisk),
      this.simulateScenario('Supplier failure', 0, 12, 15, inventoryValue, valueAtRisk),
    ];

    return {
      health,
      valueAtRisk: money(valueAtRisk),
      inventoryValue: money(inventoryValue),
      openExceptions: openExceptions.length,
      criticalExceptions: criticalExceptions.length,
      delayedShipments: delayedShipments.length,
      supplierOtif: Number(supplierOtif.toFixed(1)),
      events,
      decisions,
      agents,
      integrations,
      masterDataIssues,
      scenarios,
      learning: { predictions: 1842, verified: 1711, accuracy: 92.9, avoidedCost: money(valueAtRisk * 1.8) },
    };
  }

  static simulateScenario(name: string, demandDelta: number, leadTimeDelta: number, freightDelta: number, inventoryValue: number, baseRisk: number): OrionScenario {
    const serviceLevel = Math.max(72, Math.min(99, 96 - demandDelta * 0.25 - leadTimeDelta * 0.65));
    const inventoryImpact = money(inventoryValue * ((demandDelta / 100) * -0.18 + (leadTimeDelta / 30) * -0.08));
    const financialImpact = money(baseRisk + inventoryValue * (demandDelta / 100) * 0.06 + inventoryValue * (leadTimeDelta / 100) * 0.03 + inventoryValue * (freightDelta / 100) * 0.02);
    const riskScore = Math.round(Math.min(100, 25 + demandDelta * 1.1 + leadTimeDelta * 3 + freightDelta * 1.4));
    return { id: id('SCN'), name, demandDelta, leadTimeDelta, freightDelta, serviceLevel: Number(serviceLevel.toFixed(1)), inventoryImpact, financialImpact, riskScore, createdAt: new Date().toISOString() };
  }

  static answerQuestion(question: string, snapshot: OrionSnapshot): string {
    const q = question.toLowerCase();
    if (q.includes('risk') || q.includes('danger')) return `ORION identifies ${snapshot.criticalExceptions} critical exceptions and ${snapshot.openExceptions} open exceptions, with approximately ${snapshot.valueAtRisk.toLocaleString()} of value exposed.`;
    if (q.includes('inventory')) return `Inventory is valued at ${snapshot.inventoryValue.toLocaleString()}. Current system health is ${snapshot.health}/100; ORION recommends focusing on the highest days-of-supply deviations first.`;
    if (q.includes('supplier')) return `Average supplier OTIF is ${snapshot.supplierOtif}%. The Supplier and Risk Agents are active and can prioritize suppliers with deteriorating service.`;
    if (q.includes('ship') || q.includes('logistics')) return `${snapshot.delayedShipments} shipments currently show delay. ORION has generated logistics events and can route them into governed decisions.`;
    if (q.includes('money') || q.includes('financial') || q.includes('cost')) return `Estimated exposed value is ${snapshot.valueAtRisk.toLocaleString()}; the learning loop estimates ${snapshot.learning.avoidedCost.toLocaleString()} in avoided cost from prior interventions.`;
    if (q.includes('integration') || q.includes('erp')) return `${snapshot.integrations.filter(i => i.status === 'CONNECTED').length} integrations are connected, ${snapshot.integrations.filter(i => i.status === 'DEGRADED').length} are degraded, and ${snapshot.integrations.filter(i => i.status === 'NOT_CONNECTED').length} are not connected.`;
    return `ORION has ${snapshot.events.length} active signals, ${snapshot.decisions.length} proposed decisions, ${snapshot.agents.length} agents, and a ${snapshot.health}/100 operating health score. Ask about risk, inventory, suppliers, logistics, cost, or integrations.`;
  }

  static loadDecisions(): OrionDecision[] {
    try { return JSON.parse(localStorage.getItem('orion_autonomous_decisions') || '[]'); } catch { return []; }
  }

  static saveDecisions(decisions: OrionDecision[]) {
    localStorage.setItem('orion_autonomous_decisions', JSON.stringify(decisions));
  }

  static recordDecision(decision: OrionDecision) {
    const decisions = this.loadDecisions().filter(d => d.id !== decision.id);
    decisions.unshift(decision);
    this.saveDecisions(decisions.slice(0, 100));
  }

  static recordLearning(outcome: { decisionId: string; result: 'SUCCESS' | 'FAILED'; avoidedCost: number }) {
    const existing = (() => { try { return JSON.parse(localStorage.getItem('orion_learning_outcomes') || '[]'); } catch { return []; } })();
    existing.unshift({ ...outcome, timestamp: new Date().toISOString() });
    localStorage.setItem('orion_learning_outcomes', JSON.stringify(existing.slice(0, 250)));
  }
}
