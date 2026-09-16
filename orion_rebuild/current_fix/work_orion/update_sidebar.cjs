const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

code = code.replace(/AI Copilot/g, 'ORION AI');
code = code.replace(/label: 'Copilot'/g, "label: 'ORION AI'");

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
