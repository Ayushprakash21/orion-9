import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception } from '../types';

export class AnalyticsEngine {
  
  static calculateSupplierScore(supplier: Supplier, settings: any): number {
    const otifWeight = settings.supplierWeightOtif || 40;
    const qualityWeight = settings.supplierWeightQuality || 30;
    const leadTimeWeight = settings.supplierWeightLeadTime || 15;
    const riskWeight = settings.supplierWeightRisk || 15;

    const otifScore = (supplier.otif / 100) * otifWeight;
    const qualityScore = (supplier.qualityRate / 100) * qualityWeight;
    
    // Normalize lead time (shorter is better). Assuming 30 days is 0%, 1 day is 100%
    const leadTimeScore = Math.max(0, (1 - (supplier.leadTime / 30))) * leadTimeWeight;
    
    // Risk score based on defect rate (lower is better). Assuming 5% defect is 0%, 0% defect is 100%
    const riskScore = Math.max(0, (1 - (supplier.defectRate / 5))) * riskWeight;
    
    const totalScore = Math.round(otifScore + qualityScore + leadTimeScore + riskScore);
    return Math.min(100, Math.max(0, totalScore));
  }

  static determineSupplierStatus(score: number): string {
    if (score >= 90) return 'Preferred';
    if (score >= 75) return 'Approved';
    if (score >= 60) return 'Watchlist';
    return 'High Risk';
  }

  static calculateInventoryHealth(inventory: Inventory, settings: any) {
    const available = inventory.onHand - inventory.reserved;
    const daysOfSupply = (inventory.averageDailyDemand && inventory.averageDailyDemand > 0) ? available / inventory.averageDailyDemand : null;
    
    let status = 'Healthy';
    let risk = 'Low';

    if (daysOfSupply !== null) {
      if (daysOfSupply !== null && daysOfSupply <= settings.criticalStockOutDays) {
        status = 'Critical';
        risk = 'High';
      } else if (daysOfSupply <= (inventory.reorderPoint / inventory.averageDailyDemand)) {
        status = 'Low Stock';
        risk = 'Medium';
      } else if (daysOfSupply !== null && daysOfSupply >= settings.excessInventoryDays) {
        status = 'Excess';
        risk = 'Medium';
      }
    }

    return { available, daysOfSupply, status, risk };
  }

  static calculateOverallHealth(inventory: Inventory[], suppliers: Supplier[], pos: PurchaseOrder[], shipments: Shipment[], settings: any): any {
    // Inventory Health (0-100)
    let invHealth = 100;
    const criticalCount = inventory.filter(i => {
      const { status } = this.calculateInventoryHealth(i, settings);
      return status === 'Critical';
    }).length;
    if (inventory.length > 0) {
      invHealth = Math.max(0, 100 - (criticalCount / inventory.length) * 100 * 2); // Penalize critical stock
    }

    // Supplier Health (0-100)
    let supHealth = 100;
    if (suppliers.length > 0) {
      const avgScore = suppliers.reduce((sum, s) => sum + (s.score || this.calculateSupplierScore(s, settings)), 0) / suppliers.length;
      supHealth = Math.round(avgScore);
    }

    // Procurement Health (0-100)
    let procHealth = 100;
    const overduePos = pos.filter(po => po.status === 'Overdue').length;
    if (pos.length > 0) {
      procHealth = Math.max(0, 100 - (overduePos / pos.length) * 100 * 1.5);
    }

    // Logistics Health (0-100)
    let logHealth = 100;
    const activeShipments = shipments.filter(s => ['Booked', 'Planned', 'Picked Up', 'In Transit'].includes(s.status));
    const delayedShipments = activeShipments.filter(s => s.delayDays > 0).length;
    if (activeShipments.length > 0) {
      logHealth = Math.max(0, 100 - (delayedShipments / activeShipments.length) * 100 * 2);
    }

    const overall = Math.round(
      invHealth * (settings.inventoryHealthWeight / 100) +
      supHealth * (settings.supplierHealthWeight / 100) +
      procHealth * (settings.procurementHealthWeight / 100) +
      logHealth * (settings.logisticsHealthWeight / 100)
    );

    return {
      overall,
      inventory: Math.round(invHealth),
      suppliers: Math.round(supHealth),
      procurement: Math.round(procHealth),
      logistics: Math.round(logHealth)
    };
  }
}
