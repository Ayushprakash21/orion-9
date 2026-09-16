const fs = require('fs');
let code = fs.readFileSync('src/components/AICopilot.tsx', 'utf8');

code = code.replace(
  'const { inventory, suppliers, purchaseOrders, shipments, exceptions } = useSupplyChain();',
  'const { inventory, suppliers, purchaseOrders, shipments, exceptions, settings } = useSupplyChain();'
);

code = code.replace(
  'const daysOfSupply = available / (i.averageDailyDemand || 1);',
  'const daysOfSupply = (i.averageDailyDemand && i.averageDailyDemand > 0) ? available / i.averageDailyDemand : null;'
);

code = code.replace(
  'return daysOfSupply <= 10;',
  'return daysOfSupply !== null && daysOfSupply <= settings.criticalStockOutDays;'
);

fs.writeFileSync('src/components/AICopilot.tsx', code);
