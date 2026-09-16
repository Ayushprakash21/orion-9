const fs = require('fs');

const patchFile = (path) => {
  if (!fs.existsSync(path)) return;
  let code = fs.readFileSync(path, 'utf8');

  // Backgrounds
  code = code.replace(/bg-black\/40/g, 'bg-os-surface-secondary');
  code = code.replace(/bg-black\/60/g, 'bg-os-surface-secondary');
  code = code.replace(/bg-black\/80/g, 'bg-black/80'); // Modals backdrop usually fine
  
  // Borders
  code = code.replace(/border-white\/10/g, 'border-os-border');
  code = code.replace(/border-white\/5/g, 'border-os-border');
  code = code.replace(/border-white\/20/g, 'border-os-border-strong');
  
  // Text colors
  code = code.replace(/text-slate-500/g, 'text-os-text-muted');
  code = code.replace(/text-slate-400/g, 'text-os-text-secondary');
  code = code.replace(/text-slate-200/g, 'text-os-text-primary');
  
  // Hover
  code = code.replace(/hover:border-white\/20/g, 'hover:border-os-border-strong');
  code = code.replace(/hover:bg-white\/5/g, 'hover:bg-os-surface-hover');
  
  fs.writeFileSync(path, code);
};

patchFile('src/components/Integrations.tsx');
patchFile('src/components/DataCenter.tsx');
patchFile('src/components/Observability.tsx');
