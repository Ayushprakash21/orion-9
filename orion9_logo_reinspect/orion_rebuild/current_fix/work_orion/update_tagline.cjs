const fs = require('fs');
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebarStr = sidebarStr.replace(
  '<span className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold">ORION-9</span>',
  '<div><div className="text-[10px] uppercase tracking-[0.2em] text-cyan-500 font-bold leading-none">ORION-9</div><div className="text-[6px] uppercase tracking-[0.1em] text-slate-500 mt-1">AI OPERATING SYSTEM</div></div>'
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
