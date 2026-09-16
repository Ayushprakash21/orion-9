const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace("setActions(newActions as Action[]);", "const newActions = ActionEngine.generateActions(newExceptions, actions);\n    setActions(newActions as Action[]);");
fs.writeFileSync(file, content);
console.log("SupplyChainContext updated");
