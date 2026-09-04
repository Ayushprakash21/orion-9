const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/ScenarioEngine.ts');

const newContent = `import { Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
import { InventoryEngine } from './InventoryEngine';

export class ScenarioEngine {
  static runScenario(
    type: string,
    params: any,
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[]
  ) {
    // Clone data to avoid mutating live state
    let simPos = JSON.parse(JSON.stringify(pos)) as PurchaseOrder[];
    let simShipments = JSON.parse(JSON.stringify(shipments)) as Shipment[];
    let simInventory = JSON.parse(JSON.stringify(inventory)) as Inventory[];
    
    let affectedPosList: string[] = [];
    let affectedShipmentsList: string[] = [];

    if (type === 'Supplier Delay') {
      const supplierId = params.supplierId;
      const delayDays = Number(params.delayDays) || 14;
      
      simPos.forEach(po => {
        if (po.supplierId === supplierId && !['Received', 'Cancelled'].includes(po.status)) {
          affectedPosList.push(po.id);
          const expected = new Date(po.expectedDelivery);
          expected.setDate(expected.getDate() + delayDays);
          po.expectedDelivery = expected.toISOString();
        }
      });
      
      simShipments.forEach(shp => {
        if (affectedPosList.includes(shp.poId)) {
          affectedShipmentsList.push(shp.id);
          const arrival = new Date(shp.expectedArrival);
          arrival.setDate(arrival.getDate() + delayDays);
          shp.expectedArrival = arrival.toISOString();
          shp.delayDays += delayDays;
        }
      });
      
    } else if (type === 'Demand Spike') {
      const percentIncrease = Number(params.multiplier) || 20; // passed as percentage like 20
      const multiplier = 1 + (percentIncrease / 100);
      
      simInventory.forEach(inv => {
        inv.averageDailyDemand = (inv.averageDailyDemand || 0) * multiplier;
      });
      
    } else if (type === 'Port Congestion') {
       const delayDays = Number(params.delayDays) || 10;
       const portName = params.port || '';
       
       simShipments.forEach(shp => {
         if (['In Transit', 'Planned', 'Booked'].includes(shp.status)) {
           // Match origin or destination
           if (!portName || shp.origin.includes(portName) || shp.destination.includes(portName)) {
             affectedShipmentsList.push(shp.id);
             const arrival = new Date(shp.expectedArrival);
             arrival.setDate(arrival.getDate() + delayDays);
             shp.expectedArrival = arrival.toISOString();
             shp.delayDays += delayDays;
             affectedPosList.push(shp.poId);
           }
         }
       });
       
       simPos.forEach(po => {
         if (affectedPosList.includes(po.id)) {
            const expected = new Date(po.expectedDelivery);
            expected.setDate(expected.getDate() + delayDays);
            po.expectedDelivery = expected.toISOString();
         }
       });
    }

    // Baseline calculation
    let baseStockouts = 0;
    let baseExposure = 0;
    
    inventory.forEach(inv => {
      const metrics = InventoryEngine.calculateMetrics(inv, pos, shipments, suppliers);
      if (metrics && metrics.projectedShortage > 0) {
         baseStockouts++;
         baseExposure += metrics.projectedShortage * inv.unitCost;
      }
    });

    // Scenario calculation
    let affectedSkus = 0;
    let projectedStockouts = 0;
    let financialExposure = 0;

    simInventory.forEach(inv => {
      const baseMetrics = InventoryEngine.calculateMetrics(inv, pos, shipments, suppliers);
      const simMetrics = InventoryEngine.calculateMetrics(inv, simPos, simShipments, suppliers);
      
      if (!simMetrics || !baseMetrics) return;

      // Check if this SKU was affected
      let wasAffected = false;
      if (type === 'Demand Spike') wasAffected = true;
      else {
        // Did any incoming supply change?
        if (baseMetrics.projectedShortage !== simMetrics.projectedShortage || baseMetrics.stockOutDate !== simMetrics.stockOutDate) {
          wasAffected = true;
        }
      }

      if (wasAffected) affectedSkus++;
      
      if (simMetrics.projectedShortage > 0) {
        projectedStockouts++;
        financialExposure += simMetrics.projectedShortage * inv.unitCost;
      }
    });

    return {
      affectedSkus,
      affectedPos: new Set(affectedPosList).size,
      affectedShipments: new Set(affectedShipmentsList).size,
      baseStockouts,
      baseExposure: Math.round(baseExposure),
      projectedStockouts,
      financialExposure: Math.round(financialExposure),
      exposureDelta: Math.round(financialExposure - baseExposure),
      serviceImpact: projectedStockouts > baseStockouts ? 'High' : (projectedStockouts > 0 ? 'Medium' : 'Low'),
      riskChange: financialExposure > baseExposure ? 'Increased' : 'Unchanged'
    };
  }
}
`;
fs.writeFileSync(file, newContent);
console.log("Scenario engine updated");
