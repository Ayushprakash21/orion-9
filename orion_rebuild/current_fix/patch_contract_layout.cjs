const fs = require('fs');
let code = fs.readFileSync('src/components/ContractIntelligence.tsx', 'utf8');

// Replace the grid container for both tabs.
// Current: <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
// New: <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">

code = code.replace(
  /<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">/g,
  '<div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">'
);

// We should also replace the lg:col-span-2 with nothing, because now it's just the first element in the 2-col grid.
// Wait, actually, let's keep it or remove it? If it's grid-cols-[2fr_1fr], the children don't need col-span-2.
code = code.replace(/<div className="lg:col-span-2 space-y-4">/g, '<div className="space-y-4">');

// For the right panel, it might have lg:col-span-1.
code = code.replace(/<div className="lg:col-span-1">/g, '<div>');
code = code.replace(/<div className="bg-os-surface border border-os-border rounded-xl p-5 sticky top-20">/g, '<div className="bg-os-surface border border-os-border rounded-xl p-5 sm:p-6 sticky top-20 shadow-sm">');


fs.writeFileSync('src/components/ContractIntelligence.tsx', code);
