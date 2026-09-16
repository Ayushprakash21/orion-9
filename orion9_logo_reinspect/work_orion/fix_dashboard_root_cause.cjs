const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("import { SupplierEngine } from '../services/SupplierEngine';", "import { SupplierEngine } from '../services/SupplierEngine';\nimport { RootCauseEngine } from '../services/RootCauseEngine';");

const oldChainLogic = `  const rootCauseChain = useMemo(() => {
    if (!primaryIssue) return null;
    const chain = [];
    
    if (primaryIssue.type.includes('Stock') || primaryIssue.type.includes('Inventory')) {
      const sku = primaryIssue.entityId;
      chain.push({ type: 'Inventory', id: sku });
      
      const relatedPO = purchaseOrders.find(p => p.lines.some(l => l.productId === sku) && !['Received', 'Cancelled'].includes(p.status));
      if (relatedPO) {
        chain.push({ type: 'PO', id: relatedPO.id });
        const relatedShipment = shipments.find(s => s.poId === relatedPO.id);
        if (relatedShipment) {
          chain.push({ type: 'Shipment', id: relatedShipment.id });
          if (relatedShipment.delayDays > 0) chain.push({ type: 'Exception', id: 'Carrier Delay' });
        }
        const supplier = suppliers.find(s => s.id === relatedPO.supplierId);
        if (supplier && supplier.score < 70) chain.push({ type: 'Supplier', id: supplier.name });
      }
    }
    return chain.length > 1 ? chain : null;
  }, [primaryIssue, purchaseOrders, shipments, suppliers]);`;

const newChainLogic = `  const rootCauseChain = useMemo(() => {
    if (!primaryIssue) return null;
    const chain = RootCauseEngine.determineRootCause(primaryIssue, inventory, purchaseOrders, shipments, suppliers, exceptions);
    return chain.length > 1 ? chain.map(c => ({ type: c.type, id: c.id })) : null;
  }, [primaryIssue, inventory, purchaseOrders, shipments, suppliers, exceptions]);`;

content = content.replace(oldChainLogic, newChainLogic);
fs.writeFileSync(file, content);
console.log("Dashboard root cause updated");
