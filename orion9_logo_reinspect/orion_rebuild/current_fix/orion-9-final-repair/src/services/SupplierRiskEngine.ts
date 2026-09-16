import { Supplier, PurchaseOrder, Shipment, Exception, Inventory } from '../types';

export class SupplierRiskEngine {
  static calculateSupplierRisk(sup: Supplier, pos: PurchaseOrder[], shipments: Shipment[], exceptions: Exception[], inventory: Inventory[]) {
    // Collect stats
    const openPos = pos.filter(p => p.supplierId === sup.id && ['Submitted', 'Approved', 'Delayed', 'Overdue', 'In Transit'].includes(p.status));
    const activeShipments = shipments.filter(s => s.supplierId === sup.id && !['Delivered', 'Cancelled'].includes(s.status));
    const delayedShipments = activeShipments.filter(s => s.delayDays > 0);
    const supExceptions = exceptions.filter(e => e.entityId === sup.id && !['Resolved', 'Dismissed'].includes(e.status));
    
    // Evaluate risk
    let score = sup.score || 100;
    
    // Penalty for OTIF
    if (sup.otif < 95) score -= (95 - sup.otif) * 0.5;
    if (sup.qualityRate < 98) score -= (98 - sup.qualityRate) * 1.5;
    
    score -= delayedShipments.length * 2;
    score -= supExceptions.length * 3;
    
    score = Math.max(0, Math.min(100, Math.round(score)));
    
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
    if (score < 60) riskLevel = 'CRITICAL';
    else if (score < 75) riskLevel = 'HIGH';
    else if (score < 90) riskLevel = 'MEDIUM';
    
    const drivers = [];
    if (delayedShipments.length > 0) drivers.push(`${delayedShipments.length} delayed shipments`);
    if (sup.otif < 90) drivers.push(`OTIF deteriorated to ${sup.otif}%`);
    if (sup.qualityRate < 95) drivers.push(`Quality rate below threshold (${sup.qualityRate}%)`);
    if (supExceptions.length > 0) drivers.push(`${supExceptions.length} active exceptions`);
    
    // Find affected SKUs
    const affectedSkus = new Set<string>();
    openPos.forEach(po => po.lines.forEach(l => affectedSkus.add(l.productId)));
    
    // Financial exposure
    const spendExposure = openPos.reduce((sum, po) => sum + (po.totalValue || 0), 0);
    
    let recommendedAction = 'Continue monitoring.';
    if (riskLevel === 'CRITICAL') recommendedAction = 'Evaluate alternate supplier immediately.';
    else if (riskLevel === 'HIGH') recommendedAction = 'Engage supplier for corrective action plan.';
    else if (riskLevel === 'MEDIUM') recommendedAction = 'Review upcoming orders and monitor OTIF closely.';
    
    return {
      supplierId: sup.id,
      score,
      riskLevel,
      drivers,
      affectedSkus: Array.from(affectedSkus),
      openPos: openPos.length,
      spendExposure,
      recommendedAction,
      confidence: 'HIGH'
    };
  }
}
