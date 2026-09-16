const fs = require('fs');
const path = require('path');
const srcDir = path.join(__dirname, 'src');
const servicesDir = path.join(srcDir, 'services');

const code = `import { Exception, Inventory, PurchaseOrder, Shipment, Supplier } from '../types';

export class RootCauseEngine {
  static determineRootCause(
    exception: Exception,
    inventory: Inventory[],
    pos: PurchaseOrder[],
    shipments: Shipment[],
    suppliers: Supplier[],
    allExceptions: Exception[]
  ) {
    const chain: { type: string; id: string; name?: string }[] = [];
    
    if (exception.type === 'Stock-Out Risk' || exception.type === 'Low Stock' || exception.type === 'Excess Inventory') {
      const inv = inventory.find(i => i.productId === exception.entityId || i.id === exception.entityId);
      if (inv) {
        chain.push({ type: 'Inventory', id: inv.productId });
        
        // Find open POs for this SKU
        const relatedPos = pos.filter(po => po.lines.some(l => l.productId === inv.productId) && !['Received', 'Cancelled', 'Draft'].includes(po.status));
        if (relatedPos.length > 0) {
          // Find the most problematic PO
          let selectedPo = relatedPos[0];
          const overduePo = relatedPos.find(po => po.status === 'Overdue');
          if (overduePo) selectedPo = overduePo;
          
          chain.push({ type: 'PO', id: selectedPo.id });
          
          // Find Shipment for this PO
          const relatedShipments = shipments.filter(s => s.poId === selectedPo.id);
          if (relatedShipments.length > 0) {
            // Find delayed shipment
            let selectedShp = relatedShipments[0];
            const delayedShp = relatedShipments.find(s => s.delayDays > 0 || s.status === 'Exception' || s.status === 'Delayed');
            if (delayedShp) selectedShp = delayedShp;
            
            chain.push({ type: 'Shipment', id: selectedShp.id });
            
            // Find exception related to this shipment
            const shpException = allExceptions.find(e => e.entityId === selectedShp.id);
            if (shpException && shpException.id !== exception.id) {
              chain.push({ type: 'Exception', id: shpException.id });
            }
          } else {
             // Find supplier if no shipment
             const sup = suppliers.find(s => s.id === selectedPo.supplierId);
             if (sup) {
               chain.push({ type: 'Supplier', id: sup.id, name: sup.name });
               // Find exception related to supplier
               const supException = allExceptions.find(e => e.entityId === sup.id);
               if (supException && supException.id !== exception.id) {
                 chain.push({ type: 'Exception', id: supException.id });
               }
             }
          }
        } else {
          // If no PO, check supplier of the product if mapped in inventory
        }
      }
    } else if (exception.type === 'PO Overdue') {
      const po = pos.find(p => p.id === exception.entityId);
      if (po) {
        chain.push({ type: 'PO', id: po.id });
        const relatedShipments = shipments.filter(s => s.poId === po.id);
        if (relatedShipments.length > 0) {
          chain.push({ type: 'Shipment', id: relatedShipments[0].id });
          const shpException = allExceptions.find(e => e.entityId === relatedShipments[0].id);
          if (shpException && shpException.id !== exception.id) {
            chain.push({ type: 'Exception', id: shpException.id });
          }
        } else {
          const sup = suppliers.find(s => s.id === po.supplierId);
          if (sup) {
            chain.push({ type: 'Supplier', id: sup.id, name: sup.name });
          }
        }
      }
    } else if (exception.type === 'Shipment Delay') {
      const shp = shipments.find(s => s.id === exception.entityId);
      if (shp) {
        chain.push({ type: 'Shipment', id: shp.id });
        const po = pos.find(p => p.id === shp.poId);
        if (po) {
          chain.push({ type: 'PO', id: po.id });
        }
      }
    } else if (exception.type === 'Supplier Delay' || exception.type === 'Supplier Quality') {
       const sup = suppliers.find(s => s.id === exception.entityId);
       if (sup) {
         chain.push({ type: 'Supplier', id: sup.id, name: sup.name });
       }
    }
    
    // Fallback if empty
    if (chain.length === 0) {
      chain.push({ type: 'Exception', id: exception.id });
    }
    
    return chain;
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'RootCauseEngine.ts'), code);
console.log("RootCauseEngine fixed");
