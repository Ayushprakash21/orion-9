const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'src/components/Dashboard.tsx');
let content1 = fs.readFileSync(file1, 'utf8');

content1 = content1.replace(/onClick=\{\(\) => openEntity\(\{ type: "action", id: act\.id \}\)\}/g, "onClick={() => openEntity('action', act.id)}");
content1 = content1.replace(/onClick=\{\(\) => openEntity\(\{ type: 'action', id: act\.id \}\)\}/g, "onClick={() => openEntity('action', act.id)}");

fs.writeFileSync(file1, content1);


const file2 = path.join(__dirname, 'src/components/drawers/ActionDetailContent.tsx');
let content2 = fs.readFileSync(file2, 'utf8');

// I also need to make sure executeAction and cancelAction are passed from SupplyChainContext
content2 = content2.replace("const { actions, executeAction, cancelAction } = useSupplyChain();", "const { actions, executeAction, cancelAction } = useSupplyChain() as any;");

fs.writeFileSync(file2, content2);


const file3 = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content3 = fs.readFileSync(file3, 'utf8');

// Fix SupplyChainState
content3 = content3.replace(/exceptions: Exception\[\];/, "exceptions: Exception[];\n  actions: Action[];");
content3 = content3.replace(/updateSettings: \(newSettings: any\) => Promise<void>;/, "updateSettings: (newSettings: any) => Promise<void>;\n  executeAction: (actionId: string) => void;\n  cancelAction: (actionId: string) => void;");

// fix SupplyChainProvider export
if (!content3.includes('executeAction,')) {
    content3 = content3.replace(/updateSettings,\n\s*\}\}>/, "updateSettings,\n        executeAction,\n        cancelAction,\n      }}>");
    content3 = content3.replace(/exceptions,[\s\n]*actions,/, "exceptions,\n        actions,");
}


fs.writeFileSync(file3, content3);
console.log("Fixes applied");
