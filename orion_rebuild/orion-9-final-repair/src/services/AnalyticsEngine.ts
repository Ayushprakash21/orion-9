import { Product, Warehouse, Inventory, Supplier, PurchaseOrder, Shipment, Exception } from '../types';
import { SupplierEngine } from './SupplierEngine';

export class AnalyticsEngine {
  

  static calculateInventoryHealth(inventory: Inventory, settings: any) {
    const available = inventory.onHand - inventory.reserved;
    const daysOfSupply = (inventory.averageDailyDemand && inventory.averageDailyDemand > 0) ? available / inventory.averageDailyDemand : null;
    
    let status = 'Healthy';
    let risk = 'Low';
    const critDays = Number(settings?.criticalStockOutDays) || 5;
    const lowDays = Number(settings?.lowStockDays) || (inventory.averageDailyDemand ? inventory.reorderPoint / inventory.averageDailyDemand : 14);
    const excessDays = Number(settings?.excessInventoryDays) || 60;

    if (daysOfSupply !== null) {
      if (daysOfSupply <= critDays) {
        status = 'Critical';
        risk = 'High';
      } else if (daysOfSupply <= lowDays) {
        status = 'Low Stock';
        risk = 'Medium';
      } else if (daysOfSupply >= excessDays) {
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
      const avgScore = suppliers.reduce((sum, s) => sum + (s.score || SupplierEngine.calculateScore(s, settings).score), 0) / suppliers.length;
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

    const wInv = Number(settings?.healthWeightInventory ?? settings?.inventoryHealthWeight) || 30;
    const wSup = Number(settings?.healthWeightSuppliers ?? settings?.supplierHealthWeight) || 25;
    const wShip = Number(settings?.healthWeightShipments ?? settings?.logisticsHealthWeight) || 25;
    const wProc = Number(settings?.procurementHealthWeight) || 20;

    const overall = Math.round(
      invHealth * (wInv / 100) +
      supHealth * (wSup / 100) +
      procHealth * (wProc / 100) +
      logHealth * (wShip / 100)
    );


    const primaryDrivers: string[] = [];
    if (criticalCount > 0) primaryDrivers.push(`${criticalCount} critical inventory risks`);
    if (delayedShipments > 0) primaryDrivers.push(`${delayedShipments} delayed shipments`);
    if (overduePos > 0) primaryDrivers.push(`${overduePos} overdue purchase orders`);
    if (supHealth < 80) primaryDrivers.push(`Supplier reliability deteriorating`);
    
    const positiveDrivers: string[] = [];
    if (criticalCount === 0 && inventory.length > 0) positiveDrivers.push('No critical stock-outs');
    if (delayedShipments === 0 && activeShipments.length > 0) positiveDrivers.push('All active shipments on time');
    if (supHealth > 90) positiveDrivers.push('High supplier reliability');

    return {
      overall,
      inventory: Math.round(invHealth),
      suppliers: Math.round(supHealth),
      procurement: Math.round(procHealth),
      logistics: Math.round(logHealth),
      primaryDrivers,
      positiveDrivers
    };
  }
}

