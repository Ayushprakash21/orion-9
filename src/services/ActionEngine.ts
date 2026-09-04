import { Action, Exception, Inventory, PurchaseOrder, Shipment, Supplier } from '../types';

export class ActionEngine {
  static generateActions(
    exceptions: Exception[], 
    existingActions: Action[] = [],
    inventory: Inventory[] = [],
    pos: PurchaseOrder[] = [],
    shipments: Shipment[] = [],
    suppliers: Supplier[] = []
  ): Action[] {
    const formatCurrency = (val: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);

    return exceptions.filter(e => e.status !== 'Resolved' && e.status !== 'Dismissed').map((e, i) => {
      const existing = existingActions.find(a => a.id === `ACT-${e.id}`);
      if (existing) {
        return existing;
      }

      let priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
      if (e.severity === 'Critical') priority = 'CRITICAL';
      else if (e.severity === 'High') priority = 'HIGH';
      else if (e.severity === 'Low') priority = 'LOW';

      let reason = 'System detected anomalous behavior.';
      let evidence = 'Data shows deviation from expected thresholds.';
      let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

      // Smart reasoning based on type
      if (e.type === 'Stock-Out Risk' || e.type === 'Low Stock') {
        const inv = inventory.find(i => i.productId === e.entityId);
        if (inv) {
          reason = `Available inventory is below projected demand coverage.`;
          const dos = (inv.dailyDemand && inv.dailyDemand > 0) ? (inv.onHand / inv.dailyDemand).toFixed(1) : 0;
          evidence = `Available stock: ${inv.onHand}, Daily demand: ${inv.dailyDemand || inv.averageDailyDemand || 0}, DOS: ${dos} days.`;
          confidence = inv.dailyDemand ? 'HIGH' : 'MEDIUM';
        }
      } else if (e.type === 'Supplier Delay') {
        const sup = suppliers.find(s => s.id === e.entityId);
        if (sup) {
          reason = `Supplier has consistently missed delivery windows.`;
          evidence = `Supplier OTIF is ${sup.otif}%, Lead time is ${sup.leadTime} days.`;
          confidence = sup.otif < 80 ? 'HIGH' : 'MEDIUM';
        }
      } else if (e.type === 'Shipment Delay') {
        const shp = shipments.find(s => s.id === e.entityId);
        if (shp) {
          reason = `Shipment is delayed in transit.`;
          evidence = `Current delay is ${shp.delayDays} days. Status is ${shp.status}.`;
          confidence = 'HIGH';
        }
      } else if (e.type === 'PO Overdue') {
        const po = pos.find(p => p.id === e.entityId);
        if (po) {
          reason = `Purchase order has not been received by expected delivery date.`;
          evidence = `PO status is ${po.status}. Expected delivery was ${new Date(po.expectedDelivery).toLocaleDateString()}.`;
          confidence = 'HIGH';
        }
      }

      return {
        id: `ACT-${e.id}`,
        entity: e.entityId,
        issue: e.type,
        reason,
        evidence,
        priority,
        recommendation: e.recommendedAction || 'Investigate root cause and take corrective action.',
        impact: formatCurrency(e.estimatedImpact),
        confidence,
        status: i === 0 ? 'PROPOSED' : 'AWAITING_APPROVAL',
        approvalRequired: true,
        createdAt: new Date().toISOString()
      };
    });
  }

  static executeAction(action: Action, inventory: Inventory[], pos: PurchaseOrder[], shipments: Shipment[]) {
    // Simulated execution logic based on recommendation
    return { success: true, message: 'Action executed successfully.', timestamp: new Date().toISOString() };
  }
}
