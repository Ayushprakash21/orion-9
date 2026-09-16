const fs = require('fs');
let code = fs.readFileSync('src/services/InventoryEngine.ts', 'utf8');
code = code.replace(/console\.log\('DEBUG: InventoryEngine calculateMetrics start'\); /g, "");
code = code.replace(/console\.log\('DEBUG: InventoryEngine calculateMetrics return'\); /g, "");
fs.writeFileSync('src/services/InventoryEngine.ts', code);
