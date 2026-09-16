const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

code = code.replace(/className="flex items-center gap-2\.5 group transition-opacity hover:opacity-90 min-w-0"/g, 'className="flex items-center gap-3 group transition-opacity hover:opacity-90 shrink-0"');
code = code.replace(/px-4 border-b border-os-border shrink-0 box-border bg-os-surface-secondary"/g, 'px-4 sm:px-5 border-b border-os-border shrink-0 box-border bg-os-surface-secondary overflow-hidden"');
code = code.replace(/w-64 bg-os-surface-secondary/g, 'w-[280px] bg-os-surface-secondary');

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
