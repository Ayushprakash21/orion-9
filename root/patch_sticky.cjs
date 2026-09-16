const fs = require('fs');
let code = fs.readFileSync('src/components/ContractIntelligence.tsx', 'utf8');

code = code.replace(
  /className="bg-os-surface border border-os-border rounded-xl p-5 sm:p-6 sticky top-20 shadow-sm"/g,
  'className="bg-os-surface border border-os-border rounded-xl p-5 sm:p-6 sticky top-24 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto"'
);

code = code.replace(
  /className="bg-os-surface border border-os-border rounded-lg p-5 h-fit sticky top-4"/g,
  'className="bg-os-surface border border-os-border rounded-lg p-5 sticky top-24 shadow-sm max-h-[calc(100vh-8rem)] overflow-y-auto"'
);

fs.writeFileSync('src/components/ContractIntelligence.tsx', code);
