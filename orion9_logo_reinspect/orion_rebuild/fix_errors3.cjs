const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'src/components/Dashboard.tsx');
let content1 = fs.readFileSync(file1, 'utf8');

// For openEntity('action', act.id): the type might be expected as an object `{ type: 'action', id: act.id }` because of how MobileRecordCard expects onClick ?
// Wait, the error is `src/components/Dashboard.tsx(398,60): error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'.`
// Let's look at MobileRecordCard definition or usage in Dashboard.tsx
// wait, 398 is MobileRecordCard... ah! `onClick={() => openEntity('action', act.id)}` is passed to MobileRecordCard onClick.
// MobileRecordCard might not take arguments in onClick, or maybe it expects a different signature?
// Let's check `src/components/MobileRecordCard.tsx` or just change onClick to a simple thunk.
content1 = content1.replace(/onClick=\{\(\) => openEntity\('action', act\.id\)\}/g, "onClick={() => openEntity({ type: 'action', id: act.id })}");

fs.writeFileSync(file1, content1);

const file2 = path.join(__dirname, 'src/components/drawers/ActionDetailContent.tsx');
let content2 = fs.readFileSync(file2, 'utf8');
content2 = content2.replace(/const \{ closeDrawer \} = useEntityDrawer\(\);/, "const { closeEntity } = useEntityDrawer();");
content2 = content2.replace(/closeDrawer\(\)/g, "closeEntity()");
fs.writeFileSync(file2, content2);

const file3 = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content3 = fs.readFileSync(file3, 'utf8');
// Fix the context value!
// The previous script probably messed up `contextValue` vs `Provider value=`
content3 = content3.replace(/return \([\s\n]*<SupplyChainContext\.Provider value=\{\{[\s\n]*\.\.\.contextValue,[\s\n]*actions,[\s\n]*executeAction,[\s\n]*cancelAction[\s\n]*\}\}>/, "return (\n    <SupplyChainContext.Provider value={contextValue}>");
content3 = content3.replace(/settings,[\s\n]*updateSettings[\s\n]*\}\), \[/, "settings,\n    updateSettings,\n    actions,\n    executeAction,\n    cancelAction\n  }), [");
content3 = content3.replace(/isInitializing, settings\]\);/, "isInitializing, settings, actions]);");

fs.writeFileSync(file3, content3);
console.log("Fixed dashboard, action detail and context");
