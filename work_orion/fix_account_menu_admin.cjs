const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');

// Remove the isAdmin && ( <> ... </> ) gate around the buttons
code = code.replace(
  /\{isAdmin && \(\s*<>\s*(<div className="h-px bg-os-border my-1\.5 mx-2" \/>\s*\{location\.pathname\.startsWith\('\/admin'\) \? \([\s\S]*?\) : \([\s\S]*?\)\})\s*<\/>\s*\)\}/,
  '$1'
);

fs.writeFileSync('src/components/layout/AccountMenu.tsx', code);
