const fs = require('fs');
const files = [
  'src/components/WarehouseOptimization.tsx',
  'src/components/AICopilot.tsx',
  'src/components/Observability.tsx',
  'src/components/SupplierCommunication.tsx',
  'src/components/LogisticsIntelligence.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(
      /<div className="space-y-6 pb-12">/g,
      '<div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-6 box-border">'
    );
    // AICopilot uses something else?
    code = code.replace(
      /<div className="flex flex-col h-full bg-os-bg relative">/g,
      '<div className="px-4 sm:px-6 md:px-8 py-6 flex flex-col h-full bg-os-bg relative box-border">'
    );
    fs.writeFileSync(file, code);
  }
}
