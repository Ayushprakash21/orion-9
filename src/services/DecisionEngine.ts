import { 
  Decision, DecisionStatus, DecisionEvidence, DecisionRootCause, 
  DecisionImpact, DecisionOption, DecisionSimulation, DecisionRecommendation,
  Exception, Inventory, PurchaseOrder, Shipment, Supplier
} from '../types';
import { InventoryEngine } from './InventoryEngine';
import { RootCauseEngine } from './RootCauseEngine';
import { ScenarioEngine } from './ScenarioEngine';

export class DecisionEngine {
  
  static generateDecisionFromException(
    exception: Exception, 
    inventory: Inventory[], 
    pos: PurchaseOrder[], 
    shipments: Shipment[], 
    suppliers: Supplier[]
  ): Decision | null {
    // Collect evidence
    const evidence: DecisionEvidence[] = [];
    
    // Find entity
    let impactedInv: Inventory | undefined;
    let impactedPo: PurchaseOrder | undefined;
    let impactedShipment: Shipment | undefined;
    let impactedSupplier: Supplier | undefined;

    if (exception.entityId.startsWith('PO-')) {
      impactedPo = pos.find(p => p.id === exception.entityId);
      if (impactedPo) {
         // find related inventory items
         impactedInv = inventory.find(i => impactedPo?.lines.some(l => l.productId === i.productId));
      }
    } else if (exception.entityId.startsWith('SUP-')) {
      impactedSupplier = suppliers.find(s => s.id === exception.entityId);
    } else if (exception.entityId.startsWith('SHP-')) {
      impactedShipment = shipments.find(s => s.id === exception.entityId);
      if (impactedShipment) {
        impactedPo = pos.find(p => p.id === impactedShipment?.poId);
        impactedInv = inventory.find(i => impactedPo?.lines.some(l => l.productId === i.productId));
      }
    } else {
      impactedInv = inventory.find(i => i.productId === exception.entityId);
    }

    if (impactedInv) {
      const metrics = InventoryEngine.calculateMetrics(impactedInv, pos, shipments, suppliers);
      evidence.push({
        id: `EVD-${Date.now()}-1`,
        sourceType: 'INVENTORY',
        sourceId: impactedInv.id,
        field: 'On Hand',
        value: impactedInv.onHand,
        timestamp: new Date().toISOString(),
        description: `Current on-hand inventory is ${impactedInv.onHand}.`,
        confidence: 'HIGH'
      });
      if (metrics) {
        evidence.push({
          id: `EVD-${Date.now()}-2`,
          sourceType: 'INVENTORY',
          sourceId: impactedInv.id,
          field: 'Days of Supply',
          value: metrics.daysOfSupply,
          timestamp: new Date().toISOString(),
          description: `Calculated days of supply is ${metrics.daysOfSupply.toFixed(1)} days.`,
          confidence: 'HIGH'
        });
      }
    }

    if (impactedPo) {
      evidence.push({
        id: `EVD-${Date.now()}-3`,
        sourceType: 'PURCHASE_ORDER',
        sourceId: impactedPo.id,
        field: 'Status',
        value: impactedPo.status,
        timestamp: new Date().toISOString(),
        description: `PO ${impactedPo.id} is currently ${impactedPo.status}. Expected delivery: ${impactedPo.expectedDelivery}.`,
        confidence: 'HIGH'
      });
    }

    // Root Cause
    const chain = RootCauseEngine.determineRootCause(exception, inventory, pos, shipments, suppliers, []);
    const rootCauses = chain.filter(c => c.causality === 'ROOT CAUSE');
    const primaryCauseStr = rootCauses.length > 0 ? rootCauses[0].label + ': ' + rootCauses[0].evidence : "Root cause cannot be determined from available data.";
    const contributingFactors = chain.filter(c => c.causality === 'CONTRIBUTING FACTOR').map(c => c.label + ': ' + c.evidence);
    
    const rootCause: DecisionRootCause = {
      primaryCause: primaryCauseStr,
      contributingFactors,
      evidence: chain.map(c => c.evidence),
      confidence: rootCauses.length > 0 ? 'HIGH' : 'LOW'
    };

    // Impact
    const impact: DecisionImpact = {};
    if (impactedInv) {
      const metrics = InventoryEngine.calculateMetrics(impactedInv, pos, shipments, suppliers);
      if (metrics && metrics.projectedShortage > 0) {
        impact.quantityAtRisk = metrics.projectedShortage;
        impact.projectedStockoutDate = metrics.stockOutDate;
        impact.estimatedRevenueExposure = metrics.projectedShortage * impactedInv.unitCost * 1.5;
      }
      impact.daysOfSupply = metrics?.daysOfSupply;
    }

    // Generate Options
    const options: DecisionOption[] = [];
    
    // Add "DO NOTHING" as baseline
    options.push(this.createOption('OPT-1', 'DO NOTHING', 'Accept current situation and monitor.', 0, 'None', 'Baseline risk', exception, inventory, pos, shipments, suppliers));

    if (exception.type === 'Stock-Out Risk' || exception.type === 'Shipment Delay' || exception.type === 'PO Overdue') {
      if (impactedPo) {
        options.push(this.createOption('OPT-2', 'EXPEDITE PO', `Expedite delivery for ${impactedPo.id}`, impactedPo.totalValue * 0.1, 'Prevent stockout', 'Additional logistics cost', exception, inventory, pos, shipments, suppliers, { type: 'Expedite PO', params: { poId: impactedPo.id, days: 5 } }));
      }
      if (impactedInv) {
        options.push(this.createOption('OPT-3', 'TRANSFER INVENTORY', `Transfer stock from another warehouse`, 500, 'Immediate availability', 'Logistics cost', exception, inventory, pos, shipments, suppliers));
      }
    }

    // Calculate score
    options.forEach(opt => {
      let score = 50; // base score
      if (opt.name === 'DO NOTHING') {
        if (impact.quantityAtRisk && impact.quantityAtRisk > 0) score = 10;
        else score = 60;
      } else {
        // Evaluate simulation result
        if (opt.simulationResult.delta.exposureDelta < 0) {
           score += 30; // Reduced exposure
        }
        if (opt.cost > 0) {
           score -= (opt.cost / 100); // slight penalty for cost
        }
      }
      opt.score = Math.max(0, Math.min(100, Math.round(score)));
    });

    options.sort((a, b) => b.score - a.score);
    const recommendedOption = options[0];

    let overallConfidence: 'HIGH'|'MEDIUM'|'LOW' = 'MEDIUM';
    if (evidence.length > 2 && rootCause.confidence === 'HIGH') {
      overallConfidence = 'HIGH';
    } else if (evidence.length === 0) {
      overallConfidence = 'LOW';
    }

    const decision: Decision = {
      id: `DEC-${exception.id}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      sourceModule: 'ExceptionEngine',
      entityType: exception.entityId.startsWith('PO-') ? 'PurchaseOrder' : (exception.entityId.startsWith('SHP-') ? 'Shipment' : (exception.entityId.startsWith('SUP-') ? 'Supplier' : 'Inventory')),
      entityId: exception.entityId,
      title: `Resolve ${exception.severity} ${exception.type} on ${exception.entityId}`,
      issue: exception.description,
      severity: exception.severity.toUpperCase() as any,
      status: 'READY_FOR_REVIEW',
      confidence: overallConfidence,
      evidence,
      rootCause,
      impact,
      options,
      recommendedOptionId: recommendedOption.id,
      recommendation: {
        recommendedOptionId: recommendedOption.id,
        reason: `Option '${recommendedOption.name}' provides the best balance of risk reduction and cost.`,
        evidence: [`Simulation shows exposure delta of ${recommendedOption.simulationResult.delta.exposureDelta}`],
        impact: `Mitigates issue with score ${recommendedOption.score}`,
        alternatives: options.filter(o => o.id !== recommendedOption.id).map(o => o.name),
        tradeoffs: [`Cost is ${recommendedOption.cost}`],
        confidence: overallConfidence,
        assumptions: recommendedOption.assumptions
      },
      approval: null,
      auditTrail: []
    };

    return decision;
  }

  private static createOption(
    id: string, name: string, description: string, cost: number, benefit: string, risk: string, 
    exception: Exception, inventory: Inventory[], pos: PurchaseOrder[], shipments: Shipment[], suppliers: Supplier[],
    simAction?: any
  ): DecisionOption {
    
    let simResult = {
       before: { financialExposure: 0, projectedStockouts: 0 },
       after: { financialExposure: 0, projectedStockouts: 0 },
       delta: { exposureDelta: 0, stockoutsDelta: 0 }
    };

    if (simAction) {
       const res = ScenarioEngine.runScenario(simAction.type, simAction.params, inventory, pos, shipments, suppliers);
       simResult.before.financialExposure = res.baseExposure;
       simResult.before.projectedStockouts = res.baseStockouts;
       simResult.after.financialExposure = res.financialExposure;
       simResult.after.projectedStockouts = res.projectedStockouts;
       simResult.delta.exposureDelta = res.exposureDelta;
       simResult.delta.stockoutsDelta = res.projectedStockouts - res.baseStockouts;
    } else {
       // do nothing scenario
       const res = ScenarioEngine.runScenario('DO NOTHING', {}, inventory, pos, shipments, suppliers);
       simResult.before.financialExposure = res.baseExposure;
       simResult.before.projectedStockouts = res.baseStockouts;
       simResult.after.financialExposure = res.baseExposure;
       simResult.after.projectedStockouts = res.baseStockouts;
    }

    return {
      id,
      name,
      description,
      cost,
      benefit,
      risk,
      executionTime: 'Immediate',
      affectedEntities: [exception.entityId],
      assumptions: ['Current demand forecast remains stable'],
      simulationResult: simResult,
      score: 0
    };
  }
}
