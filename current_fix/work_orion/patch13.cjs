const fs = require('fs');
let code = fs.readFileSync('src/services/InventoryEngine.ts', 'utf8');
code = code.replace(/static calculateMetrics/g, "static calculateMetrics");
code = code.replace(/const totalIncoming = /g, "console.log('DEBUG: InventoryEngine calculateMetrics start'); const totalIncoming = ");
code = code.replace(/return \{/g, "console.log('DEBUG: InventoryEngine calculateMetrics return'); return {");
fs.writeFileSync('src/services/InventoryEngine.ts', code);
