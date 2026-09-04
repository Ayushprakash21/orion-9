import { Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
import { InventoryEngine } from './InventoryEngine';

export class PredictionEngine {
  static generatePredictions(
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[]
  ) {
    const predictions: any[] = [];
    
    // 1. Stock-out & Shortage Predictions
    inventory.forEach(inv => {
      const metrics = InventoryEngine.calculateMetrics(inv, pos, shipments, suppliers);
      if (!metrics) return;
      
      const { available, dailyDemand, daysOfSupply, stockOutDate, safetyStock, projectedShortage } = metrics;
      
      if (stockOutDate) {
        // Find incoming that might have been delayed
        const incomingPos = pos.filter(po => po.lines.some(l => l.productId === inv.productId) && !['Received', 'Cancelled'].includes(po.status));
        
        predictions.push({
          id: `PRED-SO-${inv.productId}`,
          entity: inv.productId,
          predictionType: 'Projected Stock-Out',
          horizon: '30 Days',
          probability: daysOfSupply !== null && daysOfSupply < 14 ? 'High' : 'Medium',
          confidence: 'High', // High because deterministic
          evidence: `Available: ${available}, Demand: ${dailyDemand}/day, DOS: ${daysOfSupply ? daysOfSupply.toFixed(1) : 0}`,
          projectedDate: stockOutDate,
          impact: Math.round((projectedShortage > 0 ? projectedShortage : dailyDemand * 10) * inv.unitCost),
          recommendedAction: incomingPos.length > 0 ? 'Expedite incoming PO' : 'Create urgent PO'
        });
      } else if (metrics.daysBelowSafetyStock > 0) {
        predictions.push({
          id: `PRED-SS-${inv.productId}`,
          entity: inv.productId,
          predictionType: 'Service-Level Risk',
          horizon: '30 Days',
          probability: 'High',
          confidence: 'High',
          evidence: `Projected to fall below safety stock (${safetyStock}) for ${metrics.daysBelowSafetyStock} days.`,
          projectedDate: new Date().toISOString(),
          impact: Math.round(dailyDemand * 2 * inv.unitCost),
          recommendedAction: 'Monitor demand and consider reordering'
        });
      }
    });

    // 2. Supplier Delay Prediction
    suppliers.forEach(sup => {
      if (sup.otif < 85 || sup.leadTime > 30) {
        predictions.push({
          id: `PRED-SUP-${sup.id}`,
          entity: sup.id,
          predictionType: 'Supplier Delay',
          horizon: '90 Days',
          probability: sup.otif < 70 ? 'High' : 'Medium',
          confidence: 'Medium',
          evidence: `OTIF is ${sup.otif}%, Lead Time is ${sup.leadTime} days`,
          projectedDate: new Date().toISOString(),
          impact: 0, // Need contextual PO to calculate real impact, handled at exception level usually
          recommendedAction: 'Engage supplier for performance improvement'
        });
      }
    });
    
    return predictions;
  }
}
