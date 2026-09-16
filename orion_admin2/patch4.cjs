const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');
code = code.replace(/evaluatedExceptions\.map\(ex => DecisionEngine\.generateDecisionFromException/g, "evaluatedExceptions.map(ex => { console.log('DEBUG: mapping exception', ex.id); return DecisionEngine.generateDecisionFromException");
code = code.replace(/clonedSuppliers\)\)\.filter/g, "clonedSuppliers); }).filter");
fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
