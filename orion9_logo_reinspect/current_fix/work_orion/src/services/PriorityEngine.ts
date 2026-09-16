import { Exception, Inventory, PurchaseOrder, Shipment, Supplier, Action } from '../types';

export class PriorityEngine {
  static getDailyPriorities(
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[],
    exceptions: Exception[],
    actions: Action[]
  ) {
    // 1. Calculate Metrics
    let totalInventoryValue = 0;
    inventory.forEach(inv => totalInventoryValue += inv.onHand * inv.unitCost);

    let financialExposure = 0;
    exceptions.forEach(e => {
       if (e.status !== 'Resolved' && e.status !== 'Dismissed') {
         financialExposure += e.estimatedImpact || 0;
       }
    });

    // Supplier OTIF (On-Time In-Full)
    let completedPOs = pos.filter(p => p.status === 'Received');
    let onTimePOs = completedPOs.filter(p => !p.actualDelivery || new Date(p.actualDelivery).getTime() <= new Date(p.expectedDelivery).getTime());
    let supplierOtif = completedPOs.length ? Math.round((onTimePOs.length / completedPOs.length) * 100) : 100;

    // Logistics OTIF
    let completedShipments = shipments.filter(s => s.status === 'Delivered');
    let onTimeShipments = completedShipments.filter(s => s.delayDays === 0);
    let logisticsOtif = completedShipments.length ? Math.round((onTimeShipments.length / completedShipments.length) * 100) : 100;

    // Service Level (Simulated)
    let stockouts = inventory.filter(i => i.onHand === 0).length;
    let serviceLevel = inventory.length ? Math.round(100 - ((stockouts / inventory.length) * 100)) : 100;

    // Top Risks (from Exceptions)
    const topRisks = exceptions
      .filter(e => e.status !== 'Resolved' && e.status !== 'Dismissed')
      .sort((a, b) => b.estimatedImpact - a.estimatedImpact)
      .slice(0, 20);

    // Top Opportunities (from Actions)
    const topOpportunities = actions
      .filter(a => a.status === 'PROPOSED' || a.status === 'AWAITING_APPROVAL')
      .map(a => ({
        id: a.id,
        title: a.issue,
        description: a.recommendation,
        value: parseFloat(a.impact.replace(/[^0-9.-]+/g, "")) || 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 20);

    // Actions Requiring Approval
    const pendingActions = actions
      .filter(a => a.status === 'PROPOSED' || a.status === 'AWAITING_APPROVAL')
      .sort((a, b) => (parseFloat(b.impact.replace(/[^0-9.-]+/g, "")) || 0) - (parseFloat(a.impact.replace(/[^0-9.-]+/g, "")) || 0))
      .slice(0, 20);

    return {
       metrics: {
         inventoryValue: totalInventoryValue,
         financialExposure,
         supplierOtif,
         logisticsOtif,
         serviceLevel
       },
       topRisks,
       topOpportunities,
       pendingActions
    };
  }
}
