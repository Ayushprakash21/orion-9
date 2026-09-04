import { Exception, Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
import { InventoryEngine } from './InventoryEngine';
import { ForecastEngine } from './ForecastEngine';

export class RootCauseEngine {
  static determineRootCause(
    exception: Exception,
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[],
    allExceptions: Exception[]
  ) {
    const chain: { type: string; id: string; label: string; status: string; evidence: string; causality?: string }[] = [];

    const addNode = (type: string, id: string, label: string, status: string, evidence: string, causality?: string) => {
      if (!chain.find(c => c.id === id && c.type === type)) {
        chain.push({ type, id, label, status, evidence, causality });
      }
    };

    if (['Stock-Out Risk', 'Low Stock', 'Excess Inventory', 'Inventory Shortage'].includes(exception.type)) {
      const inv = inventory.find(i => i.productId === exception.entityId || i.id === exception.entityId);
      if (inv) {
        const metrics = InventoryEngine.calculateMetrics(inv, pos, shipments, suppliers);
        const forecast = ForecastEngine.generateForecast(inv);
        
        let invStatus = 'Warning';
        if (metrics && metrics.available < metrics.safetyStock) invStatus = 'Critical';
        
        let rootCauseFound = false;

        // Check Demand Increase
        if (forecast.trend === 'INCREASING' && forecast.trendPercentage > 15) {
          addNode('demand', `DMD-${inv.productId}`, 'Demand Spike', 'Critical', `Demand trending upwards by ${forecast.trendPercentage}%`, 'ROOT CAUSE');
          addNode('inventory', inv.productId, `Inventory ${inv.productId}`, invStatus, `Inventory consumed faster than historical average`, 'DOWNSTREAM IMPACT');
          rootCauseFound = true;
        } else {
          addNode('inventory', inv.productId, `Inventory ${inv.productId}`, invStatus, `Avail: ${metrics?.available}, DOS: ${metrics?.daysOfSupply?.toFixed(1) || 0}`, rootCauseFound ? 'DOWNSTREAM IMPACT' : 'ROOT CAUSE');
        }

        // Trace POs
        const relatedPos = pos.filter(po => po.lines.some(l => l.productId === inv.productId) && !['Received', 'Cancelled', 'Draft'].includes(po.status));
        if (relatedPos.length > 0) {
          let delayedPo = relatedPos.find(po => po.status === 'Overdue' || po.status === 'Delayed');
          let selectedPo = delayedPo || relatedPos[0];
          
          addNode('po', selectedPo.id, `PO ${selectedPo.id}`, selectedPo.status, `Expected: ${new Date(selectedPo.expectedDelivery).toLocaleDateString()}`, delayedPo ? 'CONTRIBUTING FACTOR' : 'MITIGATION');
          
          // Trace Shipments
          const relatedShipments = shipments.filter(s => s.poId === selectedPo.id);
          if (relatedShipments.length > 0) {
            let delayedShp = relatedShipments.find(s => s.delayDays > 0 || s.status === 'Exception' || s.status === 'Delayed');
            let selectedShp = delayedShp || relatedShipments[0];
            
            addNode('shipment', selectedShp.id, `Shipment ${selectedShp.id}`, selectedShp.status, selectedShp.delayDays > 0 ? `Delayed by ${selectedShp.delayDays} days` : 'On schedule', delayedShp ? 'ROOT CAUSE' : 'DOWNSTREAM IMPACT');
            
            if (delayedShp) {
               const sup = suppliers.find(s => s.id === selectedShp.supplierId || s.id === selectedPo.supplierId);
               if (sup && sup.otif < 90) {
                 addNode('supplier', sup.id, sup.name, sup.status || 'Active', `Supplier missed ETA (OTIF: ${sup.otif}%)`, 'ROOT CAUSE');
               }
            }
          } else {
             const sup = suppliers.find(s => s.id === selectedPo.supplierId);
             if (sup && selectedPo.status === 'Overdue') {
               addNode('supplier', sup.id, sup.name, sup.status || 'Active', `Supplier failed to ship (OTIF: ${sup.otif}%)`, 'ROOT CAUSE');
             }
          }
        }
      }
    } else if (exception.type === 'PO Overdue' || exception.type === 'Purchase Order Delay') {
      const po = pos.find(p => p.id === exception.entityId);
      if (po) {
        const sup = suppliers.find(s => s.id === po.supplierId);
        if (sup) {
           addNode('supplier', sup.id, sup.name, 'Warning', `Supplier OTIF is ${sup.otif}%`, 'ROOT CAUSE');
        }
        addNode('po', po.id, `PO ${po.id}`, po.status, `Expected: ${new Date(po.expectedDelivery).toLocaleDateString()}`, 'DOWNSTREAM IMPACT');
        
        const relatedShipments = shipments.filter(s => s.poId === po.id);
        if (relatedShipments.length > 0) {
          const shp = relatedShipments[0];
          addNode('shipment', shp.id, `Shipment ${shp.id}`, shp.status, `Delay: ${shp.delayDays} days`, 'DOWNSTREAM IMPACT');
        }
      }
    } else if (exception.type === 'Shipment Delay') {
      const shp = shipments.find(s => s.id === exception.entityId);
      if (shp) {
        addNode('shipment', shp.id, `Shipment ${shp.id}`, shp.status, `Delayed by ${shp.delayDays} days`, 'ROOT CAUSE');
        const po = pos.find(p => p.id === shp.poId);
        if (po) {
          addNode('po', po.id, `PO ${po.id}`, po.status, `Linked to delayed shipment`, 'DOWNSTREAM IMPACT');
          const sup = suppliers.find(s => s.id === po.supplierId);
          if (sup && sup.otif < 95) {
             addNode('supplier', sup.id, sup.name, 'Warning', `Supplier historical OTIF: ${sup.otif}%`, 'CONTRIBUTING FACTOR');
          }
        }
      }
    }

    if (chain.length === 0) {
      chain.push({
        type: 'exception',
        id: exception.id,
        label: exception.type,
        status: exception.status,
        evidence: exception.description,
        causality: 'ROOT CAUSE'
      });
    }

    // Reorder chain logical flow: Supplier -> Demand -> PO -> Shipment -> Inventory
    const orderMap: any = { 'demand': 1, 'supplier': 2, 'po': 3, 'shipment': 4, 'inventory': 5, 'exception': 6 };
    chain.sort((a, b) => (orderMap[a.type] || 99) - (orderMap[b.type] || 99));

    return chain;
  }
}
