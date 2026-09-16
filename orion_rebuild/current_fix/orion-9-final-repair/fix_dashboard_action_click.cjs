const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'src/components/Dashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /<tr key=\{act\.id\} className="hover:bg-\[\#202020\] transition-colors">/g, 
  '<tr key={act.id} onClick={() => openEntity({ type: "action", id: act.id })} className="hover:bg-[#202020] transition-colors cursor-pointer">'
);

content = content.replace(
  /onClick=\{.*?navigate\('\/exceptions'\).*?\}/,
  "onClick={() => openEntity({ type: 'action', id: act.id })}"
);

fs.writeFileSync(file, content);
console.log("Dashboard Action Center click fixed");
