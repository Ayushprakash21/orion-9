const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');
code = code.replace(/evaluatedExceptions\.map\(ex => \{ console\.log\('DEBUG: mapping exception', ex\.id\); return DecisionEngine\.generateDecisionFromException\(ex, clonedInventory, clonedPurchaseOrders, clonedShipments, clonedSuppliers\); \}\)\.filter\(Boolean\) as Decision\[\];/g, "[]; console.log('DEBUG: map finished!');");
fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
