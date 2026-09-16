const fs = require('fs');
let code = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');

code = code.replace(
  'supplierQualityThreshold: 90,',
  'supplierQualityThreshold: 90,\n    supplierWeightOtif: 40,\n    supplierWeightQuality: 30,\n    supplierWeightLeadTime: 15,\n    supplierWeightRisk: 15,'
);

fs.writeFileSync('src/store/SupplyChainContext.tsx', code);
