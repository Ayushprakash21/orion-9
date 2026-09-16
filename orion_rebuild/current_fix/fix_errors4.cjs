const fs = require('fs');
const path = require('path');

const file3 = path.join(__dirname, 'src/store/SupplyChainContext.tsx');
let content3 = fs.readFileSync(file3, 'utf8');

// I see `value=value` in `<SupplyChainContext.Provider value={value}>`. Where is `value` defined?
// Ah! `const value = useMemo(() => ({ ... }), [...])`
content3 = content3.replace(/updateSettings[\s\n]*\}\), \[/, "updateSettings,\n    actions,\n    executeAction,\n    cancelAction\n  }), [");
content3 = content3.replace(/isInitializing, settings\]\);/, "isInitializing, settings, actions]);");

fs.writeFileSync(file3, content3);
console.log("Fixed context value");
