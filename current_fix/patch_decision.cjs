const fs = require('fs');
let code = fs.readFileSync('src/components/DecisionCenter.tsx', 'utf8');

code = code.replace(/className="h-full flex flex-col bg-os-bg text-os-text-primary px-4 sm:px-6 md:px-8 py-6 w-full overflow-hidden box-border"/g, 
  'className="flex flex-col bg-os-bg text-os-text-primary px-4 sm:px-6 md:px-8 py-6 w-full box-border min-h-full"');
code = code.replace(/<div className="grid grid-cols-12 gap-6 min-h-0 flex-1">/g, 
  '<div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">');
code = code.replace(/<div className="col-span-4 flex flex-col bg-os-surface border border-os-border rounded-lg overflow-hidden">/g, 
  '<div className="lg:col-span-4 flex flex-col bg-os-surface border border-os-border rounded-lg overflow-hidden min-h-[400px]">');
code = code.replace(/<div className="col-span-8 flex flex-col bg-os-surface border border-os-border rounded-lg overflow-hidden">/g, 
  '<div className="lg:col-span-8 flex flex-col bg-os-surface border border-os-border rounded-lg overflow-hidden min-h-[500px]">');

fs.writeFileSync('src/components/DecisionCenter.tsx', code);
