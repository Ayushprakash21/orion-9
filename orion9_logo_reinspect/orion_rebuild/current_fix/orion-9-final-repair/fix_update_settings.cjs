const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');

code = code.replace(
  'const newExceptions = ExceptionEngine.generateExceptions(inventory, suppliers, purchaseOrders, shipments, newSettings);',
  'const newExceptions = ExceptionEngine.generateExceptions(inventory, suppliers, purchaseOrders, shipments, newSettings, exceptions);'
);

fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
