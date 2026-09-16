const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

code = code.replace(/<span className="text-\[9px\] font-mono text-os-text-muted uppercase tracking-widest whitespace-nowrap mt-0\.5">\s*AI SCM OS\s*<\/span>/, `<span className="text-[9px] font-mono text-os-text-muted uppercase tracking-widest whitespace-nowrap mt-0.5 truncate max-w-[150px]">
                {branding.description || "AI Supply Chain Operating System"}
              </span>`);

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
