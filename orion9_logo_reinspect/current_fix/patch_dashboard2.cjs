const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(/risk\.category/g, "risk.type");
code = code.replace(/risk\.title/g, "risk.description");
code = code.replace(/risk\.recommendation/g, "risk.recommendedAction");
code = code.replace(/risk\.impact/g, "risk.estimatedImpact");
code = code.replace(/handleNodeClick\(\{ type: risk\.type, id: risk\.id \}\)/g, "handleNodeClick({ type: 'exception', id: risk.id })");

fs.writeFileSync('src/components/Dashboard.tsx', code);
