const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');
code = code.replace(/const newDecisions = \[\]; console\.log\('DEBUG: map finished!'\);/, "const newDecisions = evaluatedExceptions.map(ex => DecisionEngine.generateDecisionFromException(ex, clonedInventory, clonedPurchaseOrders, clonedShipments, clonedSuppliers)).filter(Boolean) as Decision[];");
fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
