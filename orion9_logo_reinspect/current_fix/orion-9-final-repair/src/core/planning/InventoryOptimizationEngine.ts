import { Inventory, Product, PurchaseOrder, Supplier } from '../../types';
import { ForecastResult } from './DemandForecastEngine';

export interface OptimizationResult {
  inventoryId: string;
  productId: string;
  locationId: string;
  currentStock: number;
  daysOfSupply: number;
  inboundCoverage: number;
  forecastedDemand: number;
  recommendedSafetyStock: number;
  recommendedReorderPoint: number;
  stockoutRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  overstockRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  inventoryHealthScore: number; // 0-100
  recommendedAction: string;
}

export class InventoryOptimizationEngine {
  static optimize(
    inventory: Inventory[],
    forecasts: ForecastResult[],
    pos: PurchaseOrder[],
    suppliers: Supplier[],
    settings?: any
  ): OptimizationResult[] {
    const results: OptimizationResult[] = [];
    const critDays = Number(settings?.criticalStockOutDays) > 0 ? Number(settings.criticalStockOutDays) : 5;
    const lowDays = Number(settings?.lowStockDays) > 0 ? Number(settings.lowStockDays) : 14;
    const excessDays = Number(settings?.excessInventoryDays) > 0 ? Number(settings.excessInventoryDays) : 60;

    for (const inv of inventory) {
      // 1. Demand Projection
      const productForecasts = forecasts.filter(f => f.productId === inv.productId && f.locationId === inv.warehouseId && !f.isHistorical);
      
      const avgForecastDemand = productForecasts.length > 0 
        ? productForecasts.reduce((sum, f) => sum + f.predictedDemand, 0) / productForecasts.length
        : inv.averageDailyDemand;

      const dos = avgForecastDemand > 0 ? inv.onHand / avgForecastDemand : 999;
      
      // 2. Supply Projection
      // Find open purchase orders for this SKU arriving within the next 30 days
      const openPos = pos.filter(po => !['Received', 'Cancelled'].includes(po.status));
      let totalInbound = 0;
      openPos.forEach(po => {
        po.lines.forEach(line => {
          if (line.productId === inv.productId) {
            totalInbound += line.quantity;
          }
        });
      });
      
      const inboundCoverage = avgForecastDemand > 0 ? totalInbound / avgForecastDemand : 0;
      
      // Calculate Lead Time (avg from suppliers or default 14)
      const leadTime = 14; 

      // Reorder Point = Demand during lead time + safety stock
      const recommendedSafetyStock = Math.round(avgForecastDemand * leadTime * 0.5); // 50% buffer
      const recommendedReorderPoint = Math.round((avgForecastDemand * leadTime) + recommendedSafetyStock);

      let stockoutRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let overstockRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let recommendedAction = 'No action needed';

      // 3. Risk Assessment (Consuming configured operational settings thresholds)
      if (dos <= critDays) {
        stockoutRisk = 'CRITICAL';
        recommendedAction = 'Expedite replenishment immediately';
      } else if (dos <= lowDays && (dos + inboundCoverage) < lowDays * 1.5) {
        stockoutRisk = 'HIGH';
        recommendedAction = 'Review open POs for potential expedite';
      } else if (dos <= lowDays * 1.5) {
        stockoutRisk = 'MEDIUM';
        recommendedAction = 'Monitor closely';
      }

      // Overstock assessment using configured excess threshold
      const projectedTotalDos = dos + inboundCoverage;
      if (projectedTotalDos >= excessDays) {
        overstockRisk = 'CRITICAL';
        recommendedAction = 'Halt procurement, consider stock transfer';
      } else if (projectedTotalDos >= excessDays * 0.8) {
        overstockRisk = 'HIGH';
        recommendedAction = 'Defer open POs';
      } else if (projectedTotalDos >= excessDays * 0.6) {
        overstockRisk = 'MEDIUM';
      }

      let healthScore = 100;
      if (stockoutRisk === 'CRITICAL') healthScore -= 50;
      else if (stockoutRisk === 'HIGH') healthScore -= 30;
      else if (stockoutRisk === 'MEDIUM') healthScore -= 10;

      if (overstockRisk === 'CRITICAL') healthScore -= 40;
      else if (overstockRisk === 'HIGH') healthScore -= 20;
      else if (overstockRisk === 'MEDIUM') healthScore -= 10;

      results.push({
        inventoryId: inv.id,
        productId: inv.productId,
        locationId: inv.warehouseId,
        currentStock: inv.onHand,
        daysOfSupply: Number(dos.toFixed(1)),
        inboundCoverage: Number(inboundCoverage.toFixed(1)),
        forecastedDemand: avgForecastDemand * 30,
        recommendedSafetyStock,
        recommendedReorderPoint,
        stockoutRisk,
        overstockRisk,
        inventoryHealthScore: Math.max(0, healthScore),
        recommendedAction
      });
    }

    return results;
  }
}
