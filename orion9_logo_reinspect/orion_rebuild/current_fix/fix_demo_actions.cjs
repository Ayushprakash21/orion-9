const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("setExceptions(demoData.demoExceptions as Exception[]);", "setExceptions(demoData.demoExceptions as Exception[]);\n    setActions(ActionEngine.generateActions(demoData.demoExceptions as Exception[]));");

fs.writeFileSync(file, content);
console.log("Demo actions fixed");
