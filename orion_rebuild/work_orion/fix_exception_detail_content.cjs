const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/drawers/ExceptionDetailContent.tsx');
let content = fs.readFileSync(file, 'utf8');

// I need to change how entity details are fetched
// currently it looks like:
// const relatedInventory = inventory.find(i => i.productId === exception.entityId);
// const relatedSupplier = suppliers.find(s => s.id === exception.entityId);
// const relatedPo = purchaseOrders.find(p => p.id === exception.entityId);
// const relatedShipment = shipments.find(s => s.id === exception.entityId);

// Let's replace the whole logic for "let entityType = ..." if it exists, or just find where it's used.

content = content.replace(/let entityType = 'Unknown';[\s\S]*?if \(relatedShipment\) \{[^}]+\}/, `
  let entityType = 'Unknown';
  let entityName = exception.entityId;

  if (['Stock-Out Risk', 'Low Stock', 'Excess Inventory'].includes(exception.type)) {
    entityType = 'Inventory';
    if (relatedInventory) {
      const prod = products.find(p => p.id === relatedInventory.productId);
      if (prod) entityName = prod.name;
    }
  } else if (['Supplier Delay', 'Supplier Quality'].includes(exception.type)) {
    entityType = 'Supplier';
    if (relatedSupplier) entityName = relatedSupplier.name;
  } else if (['Shipment Delay'].includes(exception.type)) {
    entityType = 'Shipment';
    if (relatedShipment) entityName = relatedShipment.id;
  } else if (['PO Overdue', 'Purchase Order Delay'].includes(exception.type)) {
    entityType = 'Purchase Order';
    if (relatedPo) entityName = relatedPo.id;
  }
`);

// Also need to use RiskEngine for the risk score
// And use RootCauseEngine for the chain

fs.writeFileSync(file, content);
console.log("ExceptionDetailContent fixed.");
