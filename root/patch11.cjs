const fs = require('fs');
let code = fs.readFileSync('src/services/DecisionEngine.ts', 'utf8');
code = code.replace(/const chain = RootCauseEngine\.determineRootCause/g, "console.log('DEBUG: before determineRootCause'); const chain = RootCauseEngine.determineRootCause");
code = code.replace(/const options: DecisionOption\[\] = \[\];/g, "console.log('DEBUG: generated impact'); const options: DecisionOption[] = [];");
fs.writeFileSync('src/services/DecisionEngine.ts', code);
