const fs = require('fs');
let code = fs.readFileSync('src/components/ContractIntelligence.tsx', 'utf8');

code = code.replace(
  /className={`pb-3 text-sm font-semibold transition-colors border-b-2 \${/g,
  'className={`px-4 sm:px-5 h-12 flex items-center text-sm font-semibold transition-colors border-b-2 ${'
);

fs.writeFileSync('src/components/ContractIntelligence.tsx', code);
