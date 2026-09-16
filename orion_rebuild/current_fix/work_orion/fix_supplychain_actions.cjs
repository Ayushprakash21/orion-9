const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// import ActionEngine
if (!content.includes('ActionEngine')) {
  content = content.replace("import { ExceptionEngine } from '../services/ExceptionEngine';", "import { ExceptionEngine } from '../services/ExceptionEngine';\nimport { ActionEngine } from '../services/ActionEngine';");
}

// Add actions generation when exceptions are updated
// First, inside resetData
content = content.replace(
  /const initExceptions = ExceptionEngine\.generateExceptions\([\s\S]*?\);[\s\n]*setExceptions\(initExceptions\);/,
  "const initExceptions = ExceptionEngine.generateExceptions(demoInventory, demoSuppliers, demoPurchaseOrders, demoShipments, initialSettings, []);\n      setExceptions(initExceptions);\n      setActions(ActionEngine.generateActions(initExceptions));"
);

content = content.replace(
  /const newExceptions = ExceptionEngine\.generateExceptions\([\s\S]*?exceptions[\s\n]*\);[\s\n]*setExceptions\(newExceptions\);/g,
  (match) => {
    return match + "\n    setActions(ActionEngine.generateActions(newExceptions));"
  }
);

// Define executeAction and cancelAction
const executeLogic = `
  const executeAction = (actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'EXECUTED' } : a
    ));
    showToast('Action executed successfully.', 'success', 'Action Center');
  };

  const cancelAction = (actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'CANCELLED' } : a
    ));
    showToast('Action cancelled.', 'info', 'Action Center');
  };
`;
// insert before `return (`
content = content.replace(/return \(/, executeLogic + "\n  return (");

fs.writeFileSync(file, content);
console.log("SupplyChainContext action engine logic added");
