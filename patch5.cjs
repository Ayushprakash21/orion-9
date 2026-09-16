const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');
code = code.replace(/setDecisions\(newDecisions\);/, "console.log('DEBUG: setDecisions'); setDecisions(newDecisions);");
code = code.replace(/setAuditEvents\(\[\]\);/, "console.log('DEBUG: setAuditEvents'); setAuditEvents([]);");
code = code.replace(/setImportHistory\(\[\]\);/, "console.log('DEBUG: setImportHistory'); setImportHistory([]);");
code = code.replace(/const switchToDemoData = async \(\) => {/, "console.log('DEBUG: loadDemoData finished completely!');\n  const switchToDemoData = async () => {");
fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
