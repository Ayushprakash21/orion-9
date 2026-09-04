import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class ExceptionEngine {
  static generateExceptions(
    inventory: Inventory[],
    suppliers: Supplier[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    settings: any,
    existingExceptions: Exception[] = []
  ): Exception[] {
    const existingMap = new Map(existingExceptions.map(e => [e.id, e]));
    const newExceptions: Exception[] = [];
    const addOrUpdate = (baseData: Omit<Exception, 'id'>, idKey: string) => {
      const id = idKey; // deterministic id
      const existing = existingMap.get(id);
      if (existing) {
        // preserve status if not open?
        // Let's just update the dynamic properties but keep status and owner if it exists
        newExceptions.push({
          ...baseData,
          id,
          status: existing.status,
          owner: existing.owner
        });
      } else {
        newExceptions.push({ ...baseData, id });
      }
    };
    const exceptions: Exception[] = [];
    const today = new Date();

    // RULE 1 & 2 & 3: Inventory
    inventory.forEach(inv => {
      const available = inv.onHand - inv.reserved;
      const daysOfSupply = (inv.averageDailyDemand && inv.averageDailyDemand > 0) ? available / inv.averageDailyDemand : null;
      
      if (daysOfSupply !== null && daysOfSupply <= settings.criticalStockOutDays) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'Stock-Out Risk',
          severity: 'Critical',
          entityId: inv.productId,
          description: `Inventory for ${inv.productId} is critically low (${Math.round(daysOfSupply)} days of supply).`,
          estimatedImpact: Math.max(0, (inv.safetyStock - available)) * inv.unitCost,
          status: 'Open',
          owner: 'Inventory Team',
          recommendedAction: 'Expedite open purchase orders.'
        
      }, `Stock-Out Risk-${inv.productId}`);
      } else if (daysOfSupply !== null && daysOfSupply <= (inv.reorderPoint / inv.averageDailyDemand)) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'Low Stock',
          severity: 'High',
          entityId: inv.productId,
          description: `Inventory for ${inv.productId} is below reorder point.`,
          estimatedImpact: 0,
          status: 'Investigating',
          owner: 'Inventory Team',
          recommendedAction: 'Review open POs or place new order.'
        
      }, `Low Stock-${inv.productId}`);
      } else if (daysOfSupply !== null && daysOfSupply >= settings.excessInventoryDays) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'Excess Inventory',
          severity: 'Medium',
          entityId: inv.productId,
          description: `Inventory for ${inv.productId} exceeds threshold (${Math.round(daysOfSupply)} days of supply).`,
          estimatedImpact: (available - (inv.averageDailyDemand * settings.excessInventoryDays)) * inv.unitCost * 0.1, // 10% holding cost estimate
          status: 'Action Required',
          owner: 'Inventory Team',
          recommendedAction: 'Consider promotions or delaying upcoming POs.'
        
      }, `Excess Inventory-${inv.productId}`);
      }
    });

    // RULE 4 & 7: Supplier
    suppliers.forEach(sup => {
      if (sup.otif < settings.supplierHighRiskOtif) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'Supplier Delay',
          severity: 'High',
          entityId: sup.id,
          description: `Supplier ${sup.name} OTIF (${sup.otif}%) is below the ${settings.supplierHighRiskOtif}% threshold.`,
          estimatedImpact: sup.spend * 0.05, // 5% risk exposure
          status: 'Open',
          owner: 'Procurement Team',
          recommendedAction: 'Schedule performance review.'
        
      }, `Supplier Delay-${sup.id}`);
      }
      if (sup.qualityRate < settings.supplierQualityThreshold) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'Supplier Quality',
          severity: 'High',
          entityId: sup.id,
          description: `Supplier ${sup.name} quality rate (${sup.qualityRate}%) is below acceptable threshold.`,
          estimatedImpact: sup.spend * 0.05,
          status: 'Action Required',
          owner: 'Quality Team',
          recommendedAction: 'Initiate quality audit.'
        
      }, `Supplier Quality-${sup.id}`);
      }
    });

    // RULE 5: Shipment Delay
    shipments.forEach(shp => {
      if (shp.delayDays >= settings.shipmentDelayAlertDays && !['Delivered', 'Cancelled'].includes(shp.status)) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'Shipment Delay',
          severity: 'High',
          entityId: shp.id,
          description: `Shipment ${shp.id} is delayed by ${shp.delayDays} days.`,
          estimatedImpact: shp.freightCost * 0.2, // Arbitrary impact estimate
          status: 'Action Required',
          owner: 'Logistics Team',
          recommendedAction: 'Follow up with carrier.'
        
      }, `Shipment Delay-${shp.id}`);
      }
    });

    // RULE 6: PO Overdue
    pos.forEach(po => {
      const expectedDate = new Date(po.expectedDelivery);
      if (today > expectedDate && !['Received', 'Cancelled', 'Closed'].includes(po.status)) {
        addOrUpdate({
        date: today.toISOString(),
          type: 'PO Overdue',
          severity: 'High',
          entityId: po.id,
          description: `PO ${po.id} is overdue. Expected on ${expectedDate.toLocaleDateString()}.`,
          estimatedImpact: po.totalValue * 0.1,
          status: 'Open',
          owner: po.buyer || 'Procurement',
          recommendedAction: 'Contact supplier for expedited delivery.'
        
      }, `PO Overdue-${po.id}`);
      }
    });

    return newExceptions;
  }
}
