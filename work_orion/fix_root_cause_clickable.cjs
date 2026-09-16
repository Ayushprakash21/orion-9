const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  'className="px-2 py-1 bg-black/40 border border-white/10 rounded-sm text-[10px] font-mono text-slate-300 whitespace-nowrap"',
  'className="px-2 py-1 bg-black/40 border border-white/10 hover:border-cyan-500/50 hover:text-cyan-400 cursor-pointer rounded-sm text-[10px] font-mono text-slate-300 whitespace-nowrap transition-colors"'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
