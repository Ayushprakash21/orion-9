const fs = require('fs');

let code = fs.readFileSync('src/components/Exceptions.tsx', 'utf8');

code = code.replace(
  '<button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-sm text-xs border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">',
  '<button className="flex items-center gap-2 px-3 py-1 bg-indigo-500/10 text-indigo-400 rounded-sm text-[10px] uppercase font-mono tracking-widest border border-indigo-500/20 hover:bg-indigo-500/20 transition-colors">ROOT CAUSE</button>\n<button className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-400 rounded-sm text-xs border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors">'
);

fs.writeFileSync('src/components/Exceptions.tsx', code);
