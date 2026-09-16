const fs = require('fs');
let code = fs.readFileSync('src/components/Exceptions.tsx', 'utf8');

// 1. Fix grid
code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/,
  '<div className="grid grid-cols-1 lg:grid-cols-[minmax(300px,1fr)_minmax(500px,2.1fr)] gap-6 items-stretch">'
);

// 2. Fix Management Attention Card
code = code.replace(
  /<div className="bg-os-surface border border-red-500\/30 rounded-xl p-5 shadow-sm lg:col-span-1">/,
  '<div className="bg-os-surface border border-red-500/30 rounded-xl p-5 shadow-sm flex flex-col min-w-0">'
);

// 3. Fix inner div
code = code.replace(
  /<div className="mt-2 flex flex-col h-full">/,
  '<div className="mt-2 flex flex-col flex-1">'
);

// 4. Fix Risk Matrix Card
code = code.replace(
  /<div className="lg:col-span-2 bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col">/,
  '<div className="bg-os-surface border border-os-border rounded-xl p-5 hover:border-os-border-strong transition-colors flex flex-col min-w-0">'
);

fs.writeFileSync('src/components/Exceptions.tsx', code);
