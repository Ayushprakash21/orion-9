const fs = require('fs');
let code = fs.readFileSync('src/components/DataCenter.tsx', 'utf8');

code = code.replace(
  '<h2 className="text-2xl font-light text-slate-100 tracking-wide">DATA CENTER</h2>',
  '<h2 className="text-2xl font-light text-slate-100 tracking-wide">DATA & INTEGRATION CENTER</h2>'
);

code = code.replace(
  '<p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">SYSTEM SYNCHRONIZATION</p>',
  '<p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">DATA CORE</p>'
);

fs.writeFileSync('src/components/DataCenter.tsx', code);
