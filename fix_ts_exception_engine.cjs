const fs = require('fs');
let code = fs.readFileSync('src/services/ExceptionEngine.ts', 'utf8');

code = code.replace(`    const exceptions: Exception[] = [];\n    const today = new Date();\n    // RULE 1 & 2 & 3: Inventory`, `    // RULE 1 & 2 & 3: Inventory`);

fs.writeFileSync('src/services/ExceptionEngine.ts', code);
