const fs = require('fs');
let code = fs.readFileSync('src/components/ContractIntelligence.tsx', 'utf8');

// Replace top level return wrapper
code = code.replace(
  '<div className="space-y-6 pb-12">',
  '<div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-6 box-border">'
);

// We need to implement a true two-column layout for the contract list + detail panel.
// Currently it might be a flex or something. Let's see the structure.
fs.writeFileSync('src/components/ContractIntelligence.tsx', code);
