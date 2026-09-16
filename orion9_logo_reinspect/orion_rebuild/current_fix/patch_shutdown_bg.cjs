const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionShutdownScreen.tsx', 'utf8');

code = code.replace(
  /<div className="fixed inset-0 bg-transparent z-\[100000\]/g,
  '<div className="fixed inset-0 bg-[#03060E] z-[100000]'
);

fs.writeFileSync('src/os/components/OrionShutdownScreen.tsx', code);
