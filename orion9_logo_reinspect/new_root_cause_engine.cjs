const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/RootCauseEngine.ts');

const newContent = `import { Exception, Inventory, PurchaseOrder, Shipment, Supplier } from '../types';
import { InventoryEngine } from './InventoryEngine';

export class RootCauseEngine {
  static determineRootCause(
    exception: Exception,
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[],
    allExceptions: Exception[]
  ) {
    const chain: { type: string; id: string; label: string; status: string; evidence: string }[] = [];
    
    const addInv = (inv: Inventory) => {
      const metrics = InventoryEngine.calculateMetrics(inv, pos, shipments, suppliers);
      const dos = metrics ? (metrics.daysOfSupply ? metrics.daysOfSupply.toFixed(1) : '0') : '0';
      chain.push({
        type: 'inventory',
        id: inv.productId,
        label: \`Inventory \${inv.productId}\`,
        status: metrics && metrics.available < metrics.safetyStock ? 'Critical' : 'Warning',
        evidence: \`Avail: \${metrics?.available}, DOS: \${dos}\`
      });
    };

    const addPo = (po: PurchaseOrder) => {
      chain.push({
        type: 'po',
        id: po.id,
        label: \`PO \${po.id}\`,
        status: po.status,
        evidence: \`Expected: \${new Date(po.expectedDelivery).toLocaleDateString()}\`
      });
    };

    const addShipment = (shp: Shipment) => {
      chain.push({
        type: 'shipment',
        id: shp.id,
        label: \`Shipment \${shp.id}\`,
        status: shp.status,
        evidence: shp.delayDays > 0 ? \`Delayed by \${shp.delayDays} days\` : 'On schedule'
      });
    };

    const addSupplier = (sup: Supplier) => {
      chain.push({
        type: 'supplier',
        id: sup.id,
        label: sup.name,
        status: sup.status || 'Unknown',
        evidence: \`OTIF: \${sup.otif}%\`
      });
    };

    const addException = (exc: Exception) => {
      chain.push({
        type: 'exception',
        id: exc.id,
        label: exc.type,
        status: exc.status,
        evidence: exc.description
      });
    };

    if (['Stock-Out Risk', 'Low Stock', 'Excess Inventory', 'Inventory Shortage'].includes(exception.type)) {
      const inv = inventory.find(i => i.productId === exception.entityId || i.id === exception.entityId);
      if (inv) {
        addInv(inv);
        
        // Find open POs for this SKU
        const relatedPos = pos.filter(po => po.lines.some(l => l.productId === inv.productId) && !['Received', 'Cancelled', 'Draft'].includes(po.status));
        if (relatedPos.length > 0) {
          let selectedPo = relatedPos.find(po => po.status === 'Overdue' || po.status === 'Delayed') || relatedPos[0];
          addPo(selectedPo);
          
          const relatedShipments = shipments.filter(s => s.poId === selectedPo.id);
          if (relatedShipments.length > 0) {
            let selectedShp = relatedShipments.find(s => s.delayDays > 0 || s.status === 'Exception' || s.status === 'Delayed') || relatedShipments[0];
            addShipment(selectedShp);
            
            const shpException = allExceptions.find(e => e.entityId === selectedShp.id);
            if (shpException && shpException.id !== exception.id) addException(shpException);
          } else {
             const sup = suppliers.find(s => s.id === selectedPo.supplierId);
             if (sup) {
               addSupplier(sup);
               const supException = allExceptions.find(e => e.entityId === sup.id);
               if (supException && supException.id !== exception.id) addException(supException);
             }
          }
        } else {
          // No active POs
          const sup = suppliers.find(s => s.id === inv.supplierId);
          if (sup) addSupplier(sup);
        }
      }
    } else if (exception.type === 'PO Overdue' || exception.type === 'Purchase Order Delay') {
      const po = pos.find(p => p.id === exception.entityId);
      if (po) {
        addPo(po);
        const relatedShipments = shipments.filter(s => s.poId === po.id);
        if (relatedShipments.length > 0) {
          addShipment(relatedShipments[0]);
          const shpException = allExceptions.find(e => e.entityId === relatedShipments[0].id);
          if (shpException && shpException.id !== exception.id) addException(shpException);
        } else {
          const sup = suppliers.find(s => s.id === po.supplierId);
          if (sup) addSupplier(sup);
        }
      }
    } else if (exception.type === 'Shipment Delay') {
      const shp = shipments.find(s => s.id === exception.entityId);
      if (shp) {
        addShipment(shp);
        const po = pos.find(p => p.id === shp.poId);
        if (po) addPo(po);
      }
    } else if (['Supplier Delay', 'Supplier Quality', 'Quality Issue'].includes(exception.type)) {
       const sup = suppliers.find(s => s.id === exception.entityId);
       if (sup) addSupplier(sup);
    }
    
    // Fallback if empty
    if (chain.length === 0) {
      addException(exception);
    }
    
    return chain;
  }
}
`;
fs.writeFileSync(file, newContent);
console.log("Root cause engine updated");
