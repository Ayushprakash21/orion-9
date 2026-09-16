const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');

code = code.replace(
  "importData: (entityType: string, newRecords: any[], filename: string) => Promise<void>;",
  "importData: (entityType: string, newRecords: any[], filename: string, warningsCount?: number) => Promise<void>;"
);

fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
