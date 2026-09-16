const fs = require('fs');
let code = fs.readFileSync('src/services/DecisionEngine.ts', 'utf8');
code = code.replace(/const rootCause = \{/g, "console.log('DEBUG: got rootcause'); const rootCause = {");
code = code.replace(/const impact: DecisionImpact = \{\};/g, "console.log('DEBUG: calculated impact'); const impact: DecisionImpact = {};");
code = code.replace(/options\.forEach\(opt => \{/g, "console.log('DEBUG: calculated options'); options.forEach(opt => {");
code = code.replace(/return decision;/g, "console.log('DEBUG: generated decision'); return decision;");
code = code.replace(/if \(simAction\) \{/g, "console.log('DEBUG: runScenario', simAction?.type); if (simAction) {");
fs.writeFileSync('src/services/DecisionEngine.ts', code);
