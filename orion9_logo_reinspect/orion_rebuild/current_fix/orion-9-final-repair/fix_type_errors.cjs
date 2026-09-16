const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'src/components/Dashboard.tsx');
let content1 = fs.readFileSync(file1, 'utf8');

// 379: act is undefined. It's in: onClick={() => openEntity('action', act.id)}
// Ah, it's the "View All" button! It shouldn't be openEntity('action', act.id) for View All. 
content1 = content1.replace(/onClick=\{\(\) => openEntity\('action', act\.id\)\} className="text-xs text-\[\#B3B3B3\] hover:text-\[\#F5F5F5\] uppercase tracking-wider font-medium transition-colors">View All<\/button>/g, 
  "onClick={() => navigate('/exceptions')} className=\"text-xs text-[#B3B3B3] hover:text-[#F5F5F5] uppercase tracking-wider font-medium transition-colors\">View All</button>");

fs.writeFileSync(file1, content1);

const file3 = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content3 = fs.readFileSync(file3, 'utf8');

// Remove duplicate `actions`, `executeAction`, `cancelAction`
content3 = content3.replace(/actions: Action\[\];\n  actions: Action\[\];/, 'actions: Action[];');
content3 = content3.replace(/executeAction: \(actionId: string\) => void;\n  cancelAction: \(actionId: string\) => void;\n  executeAction: \(actionId: string\) => void;\n  cancelAction: \(actionId: string\) => void;/, 'executeAction: (actionId: string) => void;\n  cancelAction: (actionId: string) => void;');

// Add actions, executeAction, cancelAction to Context provider value
const providerReplaceStr = `      <SupplyChainContext.Provider value={{
        ...contextValue,
        actions,
        executeAction,
        cancelAction
      }}>`;
content3 = content3.replace(/<SupplyChainContext\.Provider value=\{contextValue\}>/, providerReplaceStr);

fs.writeFileSync(file3, content3);
console.log("Fixed dashboard act error and context duplicates");
