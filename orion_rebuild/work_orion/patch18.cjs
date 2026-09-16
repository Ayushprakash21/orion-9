const fs = require('fs');
['src/services/DecisionEngine.ts', 'src/services/RootCauseEngine.ts', 'src/store/SupplyChainContext.tsx', 'src/App.tsx', 'src/store/AuthContext.tsx'].forEach(file => {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(/console\.log\('DEBUG:.*?'\);?\s*/g, '');
  // Also fix map finished! patch
  if (file === 'src/store/SupplyChainContext.tsx') {
      code = code.replace(/const newDecisions = \[\];/, "");
  }
  fs.writeFileSync(file, code);
});
