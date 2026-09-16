const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/PriorityEngine.ts');

const newContent = `import { Exception, Inventory, PurchaseOrder, Shipment, Supplier, Action } from '../types';

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
    let onTimePOs = completedPOs.filter(p => p.delayDays === 0);
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
      .slice(0, 3);

    // Top Opportunities (from Actions or specific conditions)
    const topOpportunities = [
      { id: 'OPP-1', title: 'Route Optimization', description: 'Consolidate 3 shipments from Shanghai port to save freight costs.', value: 12500 },
      { id: 'OPP-2', title: 'Inventory Rebalancing', description: 'Move excess stock from WH-02 to WH-01 to prevent stockouts.', value: 8400 }
    ];

    // Actions Requiring Approval
    const pendingActions = actions
      .filter(a => a.status === 'PROPOSED' || a.status === 'AWAITING_APPROVAL')
      .sort((a, b) => Number(b.impact) - Number(a.impact))
      .slice(0, 3);

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
`;
fs.writeFileSync(file, newContent);
console.log("PriorityEngine created");
