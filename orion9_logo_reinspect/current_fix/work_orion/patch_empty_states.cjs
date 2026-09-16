const fs = require('fs');
let code = fs.readFileSync('src/components/ContractIntelligence.tsx', 'utf8');

code = code.replace(
  /<div className="text-center py-12 text-os-text-muted text-sm">/g,
  '<div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center text-os-text-muted text-sm">'
);

fs.writeFileSync('src/components/ContractIntelligence.tsx', code);
