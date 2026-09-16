const fs = require('fs');
let code = fs.readFileSync('src/services/RootCauseEngine.ts', 'utf8');
code = code.replace(/static determineRootCause/g, "static determineRootCause");
code = code.replace(/const chain:/g, "console.log('DEBUG: RootCauseEngine start'); const chain:");
code = code.replace(/return chain;/g, "console.log('DEBUG: RootCauseEngine end'); return chain;");
fs.writeFileSync('src/services/RootCauseEngine.ts', code);
