const fs = require('fs');

let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(
  'onClick={() => navigate(k.path)} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors group/item"',
  'title={`Based on: ${k.data.total} records. Data updated: ${lastDataUpdate}.`}\n              onClick={() => navigate(k.path)} className="cursor-pointer hover:bg-white/5 p-2 rounded-sm border border-transparent hover:border-white/10 transition-colors group/item relative"'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
