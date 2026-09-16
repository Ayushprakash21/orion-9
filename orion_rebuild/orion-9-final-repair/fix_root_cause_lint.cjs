const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/services/RootCauseEngine.ts');
let content = fs.readFileSync(file, 'utf8');

// Replace:
// const sup = suppliers.find(s => s.id === inv.supplierId);
// With:
// const relatedPoForInv = pos.find(p => p.lines.some(l => l.productId === inv.productId));
// const sup = relatedPoForInv ? suppliers.find(s => s.id === relatedPoForInv.supplierId) : undefined;
content = content.replace(
  "const sup = suppliers.find(s => s.id === inv.supplierId);",
  "const relatedPoForInv = pos.find(p => p.lines.some(l => l.productId === inv.productId));\n          const sup = relatedPoForInv ? suppliers.find(s => s.id === relatedPoForInv.supplierId) : undefined;"
);
fs.writeFileSync(file, content);
console.log("RootCauseEngine fixed");
