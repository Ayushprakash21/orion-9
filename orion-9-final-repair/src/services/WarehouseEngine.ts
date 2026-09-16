import { Warehouse, WarehouseDetail, Inventory } from '../types';

export interface WarehouseCapacityAnalysis {
  warehouseId: string;
  name: string;
  location: string;
  totalCapacityPallets: number;
  usedCapacityPallets: number;
  utilizationRate: number;
  status: 'OPTIMAL' | 'NEAR_CAPACITY' | 'CRITICAL_CONGESTION' | 'UNDERUTILIZED';
  inboundCongestionScore: number;
  outboundCongestionScore: number;
  activeDockDoors: number;
  totalDockDoors: number;
  dockUtilizationPercent: number;
  bottleneck?: string;
  recommendations: string[];
}

export class WarehouseEngine {
  public static analyzeWarehouses(
    warehouses: Warehouse[],
    warehouseDetails: WarehouseDetail[],
    inventory: Inventory[]
  ): WarehouseCapacityAnalysis[] {
    return warehouseDetails.map(detail => {
      const wh = warehouses.find(w => w.id === detail.id);
      const whInventory = inventory.filter(i => i.warehouseId === detail.id);
      const totalUnits = whInventory.reduce((sum, item) => sum + (item.onHand || 0), 0);

      // Status classification
      let status: 'OPTIMAL' | 'NEAR_CAPACITY' | 'CRITICAL_CONGESTION' | 'UNDERUTILIZED' = 'OPTIMAL';
      if (detail.utilizationRate >= 90 || detail.inboundCongestionScore >= 80) {
        status = 'CRITICAL_CONGESTION';
      } else if (detail.utilizationRate >= 80 || detail.inboundCongestionScore >= 65) {
        status = 'NEAR_CAPACITY';
      } else if (detail.utilizationRate < 45) {
        status = 'UNDERUTILIZED';
      }

      const dockUtilizationPercent = Math.round((detail.activeDockDoors / Math.max(detail.totalDockDoors, 1)) * 100);

      const recommendations: string[] = [];
      if (detail.utilizationRate > 85) {
        recommendations.push(`Initiate inter-warehouse inventory rebalancing to redistribute excess pallets.`);
      }
      if (detail.inboundCongestionScore > 75) {
        recommendations.push(`Stagger inbound delivery appointments across morning and evening windows to alleviate dock queue.`);
      }
      if (dockUtilizationPercent > 85) {
        recommendations.push(`Open auxiliary dock doors or reassign flex labor to receiving bays.`);
      }
      if (detail.pickingEfficiencyScore < 85) {
        recommendations.push(`Perform slotting optimization for fast-moving Class A items to reduce pick travel distance.`);
      }
      if (recommendations.length === 0) {
        recommendations.push(`Facility operating within balanced capacity and flow parameters.`);
      }

      return {
        warehouseId: detail.id,
        name: detail.name || wh?.name || detail.id,
        location: detail.location || wh?.location || 'Unknown',
        totalCapacityPallets: detail.totalCapacityPallets,
        usedCapacityPallets: detail.usedCapacityPallets,
        utilizationRate: detail.utilizationRate,
        status,
        inboundCongestionScore: detail.inboundCongestionScore,
        outboundCongestionScore: detail.outboundCongestionScore,
        activeDockDoors: detail.activeDockDoors,
        totalDockDoors: detail.totalDockDoors,
        dockUtilizationPercent,
        bottleneck: detail.bottleneckSummary,
        recommendations
      };
    });
  }

  public static getAggregateMetrics(analyses: WarehouseCapacityAnalysis[]) {
    if (analyses.length === 0) {
      return {
        averageUtilization: 0,
        highCongestionFacilities: 0,
        totalUsedPallets: 0,
        totalCapacityPallets: 0
      };
    }

    const totalUsed = analyses.reduce((acc, a) => acc + a.usedCapacityPallets, 0);
    const totalCap = analyses.reduce((acc, a) => acc + a.totalCapacityPallets, 0);
    const avgUtil = totalCap > 0 ? (totalUsed / totalCap) * 100 : 0;
    const congested = analyses.filter(a => a.status === 'CRITICAL_CONGESTION').length;

    return {
      averageUtilization: Math.round(avgUtil * 10) / 10,
      highCongestionFacilities: congested,
      totalUsedPallets: totalUsed,
      totalCapacityPallets: totalCap
    };
  }
}
