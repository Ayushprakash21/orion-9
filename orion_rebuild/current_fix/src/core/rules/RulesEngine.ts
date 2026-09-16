import { Rule } from '../types';
import { eventEngine } from '../events/EventEngine';
import { exceptionEngine } from '../exceptions/ExceptionEngine';
import { dataEngine } from '../data/DataEngine';
import { InventoryOptimizationEngine } from '../planning/InventoryOptimizationEngine';
import { DemandForecastEngine } from '../planning/DemandForecastEngine';

export class RulesEngine {
  private static instance: RulesEngine;
  private rules: Rule[] = [];
  private settings: any = null;

  private constructor() {
    this.initializeDefaultRules();
  }

  public static getInstance(): RulesEngine {
    if (!RulesEngine.instance) {
      RulesEngine.instance = new RulesEngine();
    }
    return RulesEngine.instance;
  }

  public setSettings(settings: any) {
    this.settings = settings;
  }

  public getSettings(): any {
    return this.settings;
  }

  private initializeDefaultRules() {
    this.rules = [
      {
        id: 'RULE_INV_001',
        name: 'Inventory Safety Stock Warning',
        description: 'Trigger event when available inventory falls below safety stock',
        category: 'Inventory',
        enabled: true,
        priority: 1,
        conditions: [
          { field: 'available', operator: '<', value: 'safetyStock' }
        ],
        actions: [
          { type: 'CREATE_EVENT', eventType: 'INVENTORY_STOCKOUT_RISK' },
          { type: 'CREATE_EXCEPTION', exceptionType: 'Low Stock' }
        ]
      },
      {
        id: 'RULE_SUP_001',
        name: 'Supplier On-Time Delivery Drop',
        description: 'Trigger when supplier OTD drops below 80%',
        category: 'Supplier',
        enabled: true,
        priority: 2,
        conditions: [
          { field: 'performanceMetrics.onTimeDelivery', operator: '<', value: 0.80 }
        ],
        actions: [
          { type: 'CREATE_EVENT', eventType: 'SUPPLIER_RISK_CHANGED' },
          { type: 'CREATE_EXCEPTION', exceptionType: 'Supplier Delay' }
        ]
      },
      {
        id: 'RULE_PLAN_001',
        name: 'Forecast-Driven Overstock Warning',
        description: 'Trigger when projected days of supply exceeds threshold',
        category: 'Planning',
        enabled: true,
        priority: 3,
        conditions: [
          { field: 'overstockRisk', operator: '===', value: 'CRITICAL' }
        ],
        actions: [
          { type: 'CREATE_EVENT', eventType: 'OVERSTOCK_RISK' },
          { type: 'CREATE_EXCEPTION', exceptionType: 'Excess Inventory' }
        ]
      }
    ];
  }

  public evaluateInventoryRules() {
    const critDays = Number(this.settings?.criticalStockOutDays) || 5;
    const lowDays = Number(this.settings?.lowStockDays) || 14;
    const excessDays = Number(this.settings?.excessInventoryDays) || 60;

    const inventory = dataEngine.getInventory();
    inventory.forEach(item => {
      const available = item.onHand - item.reserved;
      const dos = (item.averageDailyDemand && item.averageDailyDemand > 0) ? available / item.averageDailyDemand : null;

      if (dos !== null && dos <= critDays) {
        eventEngine.publish({
          id: `EVT_INV_CRIT_${item.id}_${crypto.randomUUID()}`,
          type: 'INVENTORY_STOCKOUT_RISK',
          eventType: 'INVENTORY_STOCKOUT_RISK',
          companyId: 'ORG-001',
          source: 'RulesEngine',
          processed: false,
          processingStatus: 'PENDING',
          timestamp: new Date().toISOString(),
          entityType: 'Inventory',
          entityId: item.id,
          severity: 'Critical',
          payload: { available, safetyStock: item.safetyStock, daysOfSupply: dos, threshold: critDays }
        });

        exceptionEngine.createException({
          type: 'Stock-Out Risk',
          title: `Critical Stock-Out: ${item.id}`,
          description: `Available days of supply (${dos.toFixed(1)}d) is at or below critical threshold (${critDays}d).`,
          severity: 'Critical',
          entityType: 'Inventory',
          entityId: item.id
        });
      } else if (available < item.safetyStock || (dos !== null && dos <= lowDays)) {
        eventEngine.publish({
          id: `EVT_INV_${item.id}_${crypto.randomUUID()}`,
          type: 'INVENTORY_STOCKOUT_RISK',
          eventType: 'INVENTORY_STOCKOUT_RISK',
          companyId: 'ORG-001',
          source: 'RulesEngine',
          processed: false,
          processingStatus: 'PENDING',
          timestamp: new Date().toISOString(),
          entityType: 'Inventory',
          entityId: item.id,
          severity: 'High',
          payload: { available, safetyStock: item.safetyStock, daysOfSupply: dos, threshold: lowDays }
        });
        
        exceptionEngine.createException({
          type: 'Low Stock',
          title: `Low Stock: ${item.id}`,
          description: `Available inventory (${available}) is below safety stock or low threshold (${lowDays}d).`,
          severity: 'High',
          entityType: 'Inventory',
          entityId: item.id
        });
      } else if (dos !== null && dos >= excessDays) {
        eventEngine.publish({
          id: `EVT_INV_EXC_${item.id}_${crypto.randomUUID()}`,
          type: 'OVERSTOCK_RISK',
          eventType: 'OVERSTOCK_RISK',
          companyId: 'ORG-001',
          source: 'RulesEngine',
          processed: false,
          processingStatus: 'PENDING',
          timestamp: new Date().toISOString(),
          entityType: 'Inventory',
          entityId: item.id,
          severity: 'Medium',
          payload: { available, daysOfSupply: dos, threshold: excessDays }
        });

        exceptionEngine.createException({
          type: 'Excess Inventory',
          title: `Excess Inventory: ${item.id}`,
          description: `Days of supply (${dos.toFixed(1)}d) exceeds configured excess threshold (${excessDays}d).`,
          severity: 'Medium',
          entityType: 'Inventory',
          entityId: item.id
        });
      }
    });
  }

  public evaluateSupplierRules() {
    const minOtifRate = ((Number(this.settings?.supplierHighRiskThreshold ?? this.settings?.supplierHighRiskOtif) || 70) / 100);
    const suppliers = dataEngine.getSuppliers();
    suppliers.forEach(supplier => {
      if (supplier.performanceMetrics && supplier.performanceMetrics.onTimeDelivery < minOtifRate) {
        eventEngine.publish({
          id: `EVT_SUP_${supplier.id}_${crypto.randomUUID()}`,
          type: 'SUPPLIER_RISK_CHANGED',
          eventType: 'SUPPLIER_RISK_CHANGED',
          companyId: 'ORG-001',
          source: 'RulesEngine',
          processed: false,
          processingStatus: 'PENDING',
          timestamp: new Date().toISOString(),
          entityType: 'Supplier',
          entityId: supplier.id,
          severity: 'High',
          payload: { onTimeDelivery: supplier.performanceMetrics.onTimeDelivery, threshold: minOtifRate }
        });

        exceptionEngine.createException({
          type: 'Supplier Delay',
          title: `Supplier Risk: ${supplier.name}`,
          description: `On-time delivery has dropped to ${(supplier.performanceMetrics.onTimeDelivery * 100).toFixed(1)}% (threshold: ${(minOtifRate * 100).toFixed(0)}%).`,
          severity: 'High',
          entityType: 'Supplier',
          entityId: supplier.id
        });
      }
    });
  }

  public evaluatePlanningRules() {
    const inventory = dataEngine.getInventory();
    const products = dataEngine.getProducts();
    const pos = dataEngine.getPurchaseOrders();
    const suppliers = dataEngine.getSuppliers();

    const forecasts = DemandForecastEngine.generateForecast(inventory, products, 30, 0);
    const optimization = InventoryOptimizationEngine.optimize(inventory, forecasts, pos, suppliers, this.settings);

    optimization.forEach(opt => {
      if (opt.overstockRisk === 'CRITICAL' || opt.overstockRisk === 'HIGH') {
        eventEngine.publish({
          id: `EVT_PLAN_OVS_${opt.inventoryId}_${crypto.randomUUID()}`,
          type: 'OVERSTOCK_RISK',
          eventType: 'OVERSTOCK_RISK',
          companyId: 'ORG-001',
          source: 'RulesEngine',
          processed: false,
          processingStatus: 'PENDING',
          timestamp: new Date().toISOString(),
          entityType: 'Inventory',
          entityId: opt.inventoryId,
          severity: opt.overstockRisk === 'CRITICAL' ? 'High' : 'Medium',
          payload: { daysOfSupply: opt.daysOfSupply, risk: opt.overstockRisk }
        });

        exceptionEngine.createException({
          type: 'Excess Inventory',
          title: `Overstock Risk: ${opt.productId}`,
          description: `Projected days of supply (${opt.daysOfSupply}) indicates severe overstock. ${opt.recommendedAction}.`,
          severity: opt.overstockRisk === 'CRITICAL' ? 'High' : 'Medium',
          entityType: 'Inventory',
          entityId: opt.inventoryId
        });
      }

      if (opt.stockoutRisk === 'CRITICAL' || opt.stockoutRisk === 'HIGH') {
        eventEngine.publish({
          id: `EVT_PLAN_STK_${opt.inventoryId}_${crypto.randomUUID()}`,
          type: 'REPLENISHMENT_RISK',
          eventType: 'REPLENISHMENT_RISK',
          companyId: 'ORG-001',
          source: 'RulesEngine',
          processed: false,
          processingStatus: 'PENDING',
          timestamp: new Date().toISOString(),
          entityType: 'Inventory',
          entityId: opt.inventoryId,
          severity: opt.stockoutRisk === 'CRITICAL' ? 'Critical' : 'High',
          payload: { daysOfSupply: opt.daysOfSupply, recommendedROP: opt.recommendedReorderPoint }
        });

        exceptionEngine.createException({
          type: 'Stock-Out Risk',
          title: `Projected Shortage: ${opt.productId}`,
          description: `Forecasted demand exceeds coverage. Current DOS is ${opt.daysOfSupply}. ${opt.recommendedAction}.`,
          severity: opt.stockoutRisk === 'CRITICAL' ? 'Critical' : 'High',
          entityType: 'Inventory',
          entityId: opt.inventoryId
        });
      }
    });
  }

  public evaluateAllRules() {
    this.evaluateInventoryRules();
    this.evaluateSupplierRules();
    this.evaluatePlanningRules();
  }

  public getRules(): Rule[] {
    return this.rules;
  }
}

export const rulesEngine = RulesEngine.getInstance();
