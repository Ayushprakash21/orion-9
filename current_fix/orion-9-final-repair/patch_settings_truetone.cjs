const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(/className=\{`flex-1 py-1\.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors \$\{localSettings\.reducedMotion \? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'\}`\}\n\s*>\n\s*ON/g, `className={\`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors \${localSettings.trueTone ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}\`}\n                >\n                  ON`);

fs.writeFileSync('src/components/Settings.tsx', code);
