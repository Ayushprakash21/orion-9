const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(/className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-border shadow-sm"/g, 
  'className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors"');

code = code.replace(/className="w-full bg-os-input-bg border border-os-border rounded-sm px-3 py-2 text-sm text-os-text-primary focus:outline-none focus:border-os-surface-hover"/g,
  'className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors"');

fs.writeFileSync('src/components/Settings.tsx', code);
