const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content = fs.readFileSync(file, 'utf8');

const functions = `
  const executeAction = (actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'EXECUTED' } : a
    ));
    // showToast('Action executed successfully.', 'success', 'Action Center');
  };

  const cancelAction = (actionId: string) => {
    setActions(prev => prev.map(a => 
      a.id === actionId ? { ...a, status: 'CANCELLED' } : a
    ));
    // showToast('Action cancelled.', 'info', 'Action Center');
  };
`;

// Remove them from the bottom
content = content.replace(functions, "");
content = content.replace("  const executeAction = (actionId: string) => {\n    setActions(prev => prev.map(a => \n      a.id === actionId ? { ...a, status: 'EXECUTED' } : a\n    ));\n    // showToast('Action executed successfully.', 'success', 'Action Center');\n  };\n\n  const cancelAction = (actionId: string) => {\n    setActions(prev => prev.map(a => \n      a.id === actionId ? { ...a, status: 'CANCELLED' } : a\n    ));\n    // showToast('Action cancelled.', 'info', 'Action Center');\n  };", "");
content = content.replace(/  const executeAction = [\s\S]*?Action Center'\);\n  };\n/g, "");

// Add them above `const value = useMemo`
content = content.replace("  const value = useMemo(() => ({", functions + "\n  const value = useMemo(() => ({");

fs.writeFileSync(file, content);
console.log("Moved executeAction and cancelAction above useMemo");
