const fs = require('fs');

let code = fs.readFileSync('src/components/AICopilot.tsx', 'utf8');

code = code.replace(
  '<h2 className="text-2xl font-light text-slate-100 tracking-wide">AI COPILOT</h2>',
  '<h2 className="text-2xl font-light text-slate-100 tracking-wide">ORION AI</h2>'
);

code = code.replace(
  '<p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">DIAGNOSTICS & RECOMMENDATIONS</p>',
  '<p className="text-[10px] text-cyan-500 uppercase tracking-[0.3em] font-bold mt-2">AI REASONING & ACTION CENTER</p>'
);

fs.writeFileSync('src/components/AICopilot.tsx', code);
