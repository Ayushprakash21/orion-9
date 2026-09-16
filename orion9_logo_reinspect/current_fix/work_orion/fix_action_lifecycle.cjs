const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add approveAction to interface
content = content.replace(
  "executeAction: (actionId: string) => void;",
  "approveAction: (actionId: string) => void;\n  executeAction: (actionId: string) => void;"
);

// Add approveAction implementation
const approveImpl = `
  const approveAction = (actionId: string) => {
    setActions(prev => {
      const next = prev.map(a => 
       a.id === actionId ? { ...a, status: 'APPROVED' as const } : a
      );
      saveData(db.actions, next);
      return next;
    });
  };

  const executeAction = (actionId: string) => {`;

content = content.replace(
  "const executeAction = (actionId: string) => {",
  approveImpl
);

content = content.replace(
  "executeAction,\n    cancelAction",
  "approveAction,\n    executeAction,\n    cancelAction"
);

fs.writeFileSync(file, content);
console.log("Action lifecycle updated");
