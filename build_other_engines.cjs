const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');
const servicesDir = path.join(srcDir, 'services');

const procurementEngine = `import { PurchaseOrder } from '../types';

export class ProcurementEngine {
  static calculateMetrics(pos: PurchaseOrder[]) {
    const totalPos = pos.length;
    const openPos = pos.filter(po => !['Received', 'Cancelled', 'Closed'].includes(po.status));
    const overduePos = pos.filter(po => po.status === 'Overdue');
    const openValue = openPos.reduce((sum, po) => sum + po.totalValue, 0);
    
    return {
      totalPos,
      openPos: openPos.length,
      overduePos: overduePos.length,
      openValue
    };
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'ProcurementEngine.ts'), procurementEngine);

const logisticsEngine = `import { Shipment } from '../types';

export class LogisticsEngine {
  static calculateMetrics(shipments: Shipment[]) {
    const totalShipments = shipments.length;
    const activeShipments = shipments.filter(s => ['Booked', 'Planned', 'Picked Up', 'In Transit'].includes(s.status));
    const delayedShipments = shipments.filter(s => s.delayDays > 0);
    
    return {
      totalShipments,
      activeShipments: activeShipments.length,
      delayedShipments: delayedShipments.length
    };
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'LogisticsEngine.ts'), logisticsEngine);

const predictionEngine = `import { Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
import { InventoryEngine } from './InventoryEngine';

export class PredictionEngine {
  static generatePredictions(
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[]
  ) {
    const predictions = [];
    
    inventory.forEach(inv => {
      const metrics = InventoryEngine.calculateMetrics(inv);
      if (!metrics) return;
      
      const { available, dailyDemand, daysOfSupply, stockOutDate, safetyStock } = metrics;
      
      // Calculate incoming supply
      const incomingPos = pos.filter(po => po.lines.some(l => l.productId === inv.productId) && !['Received', 'Cancelled'].includes(po.status));
      let incomingQty = 0;
      let nextArrivalDate = null;
      
      incomingPos.forEach(po => {
        po.lines.forEach(l => {
          if (l.productId === inv.productId) {
            incomingQty += (l.quantity - l.receivedQuantity);
          }
        });
        const expected = new Date(po.expectedDelivery);
        if (!nextArrivalDate || expected < nextArrivalDate) {
          nextArrivalDate = expected;
        }
      });
      
      // Prediction logic
      if (dailyDemand > 0) {
        if (daysOfSupply < 30) {
          let predictedShortage = 0;
          let probability = 'Low';
          
          if (!nextArrivalDate || (stockOutDate && nextArrivalDate > new Date(stockOutDate))) {
            // We will run out before next arrival
            const daysUntilArrival = nextArrivalDate ? (nextArrivalDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24) : 30;
            const demandUntilArrival = daysUntilArrival * dailyDemand;
            
            if (available < demandUntilArrival) {
              predictedShortage = demandUntilArrival - available;
              probability = daysOfSupply < 14 ? 'High' : 'Medium';
            }
          }
          
          if (predictedShortage > 0) {
            predictions.push({
              id: \`PRED-\${inv.productId}\`,
              type: 'Projected Stock-Out',
              entityId: inv.productId,
              description: \`Projected stock-out for \${inv.productId} before next delivery.\`,
              predictedDate: stockOutDate,
              shortageQuantity: Math.round(predictedShortage),
              probability,
              confidence: 'High',
              financialExposure: Math.round(predictedShortage * inv.unitCost),
              drivers: ['High demand velocity', 'Delayed inbound supply', 'Low safety stock buffer']
            });
          }
        }
      }
    });
    
    return predictions;
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'PredictionEngine.ts'), predictionEngine);

const scenarioEngine = `import { Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
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
    let affectedSkus = 0;
    let projectedStockouts = 0;
    let financialExposure = 0;
    
    if (type === 'Supplier Delay') {
      const supplierId = params.supplierId;
      const delayDays = params.delayDays || 14;
      
      // Find POs from this supplier
      const affectedPos = pos.filter(po => po.supplierId === supplierId && !['Received', 'Cancelled'].includes(po.status));
      
      affectedPos.forEach(po => {
        po.lines.forEach(line => {
          affectedSkus++;
          const inv = inventory.find(i => i.productId === line.productId);
          if (inv) {
            const metrics = InventoryEngine.calculateMetrics(inv);
            if (metrics && metrics.daysOfSupply !== null && metrics.daysOfSupply < delayDays) {
              projectedStockouts++;
              const shortage = (delayDays - metrics.daysOfSupply) * metrics.dailyDemand;
              financialExposure += shortage * inv.unitCost;
            }
          }
        });
      });
    } else if (type === 'Demand Spike') {
      const multiplier = params.multiplier || 1.2;
      
      inventory.forEach(inv => {
        const metrics = InventoryEngine.calculateMetrics(inv);
        if (metrics && metrics.dailyDemand > 0) {
          const newDemand = metrics.dailyDemand * multiplier;
          const newDaysOfSupply = metrics.available / newDemand;
          if (newDaysOfSupply < 14) {
             affectedSkus++;
             projectedStockouts++;
             const shortage = (14 - newDaysOfSupply) * newDemand;
             financialExposure += shortage * inv.unitCost;
          }
        }
      });
    } else if (type === 'Port Congestion') {
       const delayDays = params.delayDays || 10;
       const activeShipments = shipments.filter(s => ['In Transit', 'Planned', 'Booked'].includes(s.status));
       
       activeShipments.forEach(shp => {
         const po = pos.find(p => p.id === shp.poId);
         if (po) {
           po.lines.forEach(line => {
             affectedSkus++;
             const inv = inventory.find(i => i.productId === line.productId);
             if (inv) {
               const metrics = InventoryEngine.calculateMetrics(inv);
               if (metrics && metrics.daysOfSupply !== null && metrics.daysOfSupply < delayDays) {
                 projectedStockouts++;
                 const shortage = (delayDays - metrics.daysOfSupply) * metrics.dailyDemand;
                 financialExposure += shortage * inv.unitCost;
               }
             }
           });
         }
       });
    }
    
    return {
      affectedSkus,
      projectedStockouts,
      financialExposure: Math.round(financialExposure),
      serviceImpact: projectedStockouts > 0 ? 'High' : 'Low',
      riskChange: 'Increased'
    };
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'ScenarioEngine.ts'), scenarioEngine);

console.log("Other engines created");
