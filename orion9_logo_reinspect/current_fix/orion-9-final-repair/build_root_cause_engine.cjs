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
    suppliers: Supplier[]
  ) {
    const chain: { type: string; id: string; name?: string }[] = [];
    
    if (exception.type === 'Stock-Out Risk' || exception.type === 'Low Stock' || exception.type === 'Excess Inventory') {
      const inv = inventory.find(i => i.productId === exception.entityId);
      if (inv) {
        chain.push({ type: 'Inventory', id: inv.productId });
        // Find POs for this SKU
        const relatedPos = pos.filter(po => po.lines.some(l => l.productId === inv.productId) && !['Received', 'Cancelled'].includes(po.status));
        if (relatedPos.length > 0) {
          const po = relatedPos[0];
          chain.push({ type: 'PO', id: po.id });
          
          // Find Shipment for this PO
          const relatedShipments = shipments.filter(s => s.poId === po.id);
          if (relatedShipments.length > 0) {
            const shp = relatedShipments[0];
            chain.push({ type: 'Shipment', id: shp.id });
            
            if (shp.delayDays > 0 || shp.status === 'Exception') {
              chain.push({ type: 'Exception', id: 'Carrier Delay' });
            }
          }
          
          // Find supplier
          const sup = suppliers.find(s => s.id === po.supplierId);
          if (sup) {
            // we don't necessarily push supplier if shipment is pushed, but let's push it if no shipment
            if (relatedShipments.length === 0) {
               chain.push({ type: 'Supplier', id: sup.id, name: sup.name });
            }
          }
        }
      }
    } else if (exception.type === 'PO Overdue') {
      const po = pos.find(p => p.id === exception.entityId);
      if (po) {
        chain.push({ type: 'PO', id: po.id });
        const relatedShipments = shipments.filter(s => s.poId === po.id);
        if (relatedShipments.length > 0) {
          chain.push({ type: 'Shipment', id: relatedShipments[0].id });
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
      chain.push({ type: 'Entity', id: exception.entityId });
    }
    
    return chain;
  }
}
`;
fs.writeFileSync(path.join(servicesDir, 'RootCauseEngine.ts'), code);
console.log("RootCauseEngine created");
