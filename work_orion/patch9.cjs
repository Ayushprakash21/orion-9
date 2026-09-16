const fs = require('fs');
let code = fs.readFileSync('src/services/DecisionEngine.ts', 'utf8');
code = code.replace(/static generateDecisionFromException\([^\{]+\{/, (match) => match + " console.log('DEBUG: inside generateDecisionFromException', exception.id);");
fs.writeFileSync('src/services/DecisionEngine.ts', code);
