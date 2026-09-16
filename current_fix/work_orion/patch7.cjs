const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');
code = code.replace(/setImportHistory\(\[\]\);/, "setImportHistory([]); console.log('DEBUG: loadDemoData FINISHED SYNCHRONOUSLY');");
fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
