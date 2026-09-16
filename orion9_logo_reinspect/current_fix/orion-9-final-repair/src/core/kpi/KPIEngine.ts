import { KPI } from '../types';
import { dataEngine } from '../data/DataEngine';
import { AnalyticsEngine } from '../../services/AnalyticsEngine';
import { SupplierEngine } from '../../services/SupplierEngine';

export class KPIEngine {
  private static instance: KPIEngine;
  private kpis: Map<string, KPI> = new Map();
  private settings: any = null;

  private constructor() {}

  public static getInstance(): KPIEngine {
    if (!KPIEngine.instance) {
      KPIEngine.instance = new KPIEngine();
    }
    return KPIEngine.instance;
  }

  public setSettings(settings: any) {
    this.settings = settings;
  }

  public getSettings(): any {
    return this.settings;
  }

  public calculateKPIs(): KPI[] {
    const inventory = dataEngine.getInventory();
    const pos = dataEngine.getPurchaseOrders();
    const shipments = dataEngine.getShipments();
    const suppliers = dataEngine.getSuppliers();
    const curr = this.settings?.currency || 'USD';
    const critDays = Number(this.settings?.criticalStockOutDays) || 5;
    const excessDays = Number(this.settings?.excessInventoryDays) || 60;
    
    // Inventory Value
    const inventoryValue = inventory.reduce((sum, item) => sum + (item.onHand * item.unitCost), 0);
    this.recordKPI('INV_VAL', 'Inventory Value', inventoryValue, curr);

    // Exception Count
    const exceptions = dataEngine.getExceptions();
    this.recordKPI('EXC_CNT', 'Exception Count', exceptions.length, 'count');

    // Supplier On-Time Delivery (avg)
    let totalScore = 0;
    let supplierCount = 0;
    suppliers.forEach(s => {
      if ((s as any).performanceMetrics?.onTimeDelivery) {
         totalScore += (s as any).performanceMetrics.onTimeDelivery;
         supplierCount++;
      }
    });
    const avgOTD = supplierCount > 0 ? (totalScore / supplierCount) * 100 : 0;
    this.recordKPI('SUP_OTD', 'Supplier On-Time Delivery', avgOTD, '%');

    // Stockout Risk (Items below safety stock or at/below critical stockout days)
    const stockoutCount = inventory.filter(i => {
      const available = i.onHand - i.reserved;
      const dos = (i.averageDailyDemand && i.averageDailyDemand > 0) ? available / i.averageDailyDemand : null;
      return available < i.safetyStock || (dos !== null && dos <= critDays);
    }).length;
    this.recordKPI('STK_RSK', 'Items at Stockout Risk', stockoutCount, 'count');
    
    // --- Planning KPIs ---
    
    // Projected Demand (estimated from average daily demand across all items for 30 days)
    const projectedDemand30d = inventory.reduce((sum, item) => sum + ((item.averageDailyDemand || 0) * 30), 0);
    this.recordKPI('PLAN_PROJ_DEMAND', 'Projected Demand (30d)', projectedDemand30d, 'units');
    
    // Days of Supply (Average across inventory)
    const dosValues = inventory.filter(i => i.averageDailyDemand && i.averageDailyDemand > 0).map(i => i.onHand / i.averageDailyDemand);
    const avgDos = dosValues.length > 0 ? dosValues.reduce((a, b) => a + b, 0) / dosValues.length : 0;
    this.recordKPI('PLAN_AVG_DOS', 'Average Days of Supply', avgDos, 'days');
    
    // Excess Inventory (Items with DOS >= configured excess threshold)
    const excessCount = dosValues.filter(dos => dos >= excessDays).length;
    this.recordKPI('PLAN_EXCESS_INV', 'Excess Inventory Risk', excessCount, 'count');
    
    // Inventory Health (Simple 0-100 score based on stockouts and excess)
    const totalItems = inventory.length;
    const healthScore = totalItems > 0 ? Math.max(0, 100 - ((stockoutCount + excessCount) / totalItems * 100)) : 100;
    this.recordKPI('PLAN_INV_HEALTH', 'Inventory Health Score', healthScore, '/100');
    
    // Forecast Accuracy (Mocked baseline for Demo)
    this.recordKPI('PLAN_FCST_ACC', 'Forecast Accuracy', 85, '%');
    
    // Service Level (Mocked baseline for Demo)
    this.recordKPI('PLAN_SVC_LEVEL', 'Service Level', 94, '%');

    return Array.from(this.kpis.values());
  }

  public getKPI(id: string): KPI | undefined {
    return this.kpis.get(id);
  }

  public calculateKPIBySupplier(supplierId: string): KPI[] {
    const kpis: KPI[] = [];
    const supplier = dataEngine.getSupplier(supplierId);
    if (supplier && supplier.performanceMetrics) {
      kpis.push({
        id: `SUP_${supplierId}_OTD`,
        name: 'On-Time Delivery',
        value: supplier.performanceMetrics.onTimeDelivery * 100,
        unit: '%'
      });
      kpis.push({
        id: `SUP_${supplierId}_QUAL`,
        name: 'Quality Score',
        value: supplier.performanceMetrics.qualityScore * 100,
        unit: '%'
      });
    }
    return kpis;
  }

  public calculateKPIByProduct(productId: string): KPI[] {
    const kpis: KPI[] = [];
    const inventory = dataEngine.getInventoryByProduct(productId);
    const totalOnHand = inventory.reduce((sum, item) => sum + item.onHand, 0);
    const totalValue = inventory.reduce((sum, item) => sum + (item.onHand * item.unitCost), 0);
    
    kpis.push({
      id: `PROD_${productId}_QTY`,
      name: 'Total Quantity',
      value: totalOnHand,
      unit: 'units'
    });
    const curr = this.settings?.currency || 'USD';
    kpis.push({
      id: `PROD_${productId}_VAL`,
      name: 'Inventory Value',
      value: totalValue,
      unit: curr
    });
    return kpis;
  }

  private recordKPI(id: string, name: string, value: number, unit: string) {
    this.kpis.set(id, {
      id,
      name,
      value,
      unit,
      timestamp: new Date().toISOString()
    });
  }
}

export const kpiEngine = KPIEngine.getInstance();
