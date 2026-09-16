const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionSystemBar.tsx', 'utf8');

code = code.replace(
  /<div className="absolute top-8 left-2 z-\[150\]">/g,
  '<div className="absolute top-[48px] left-2 z-[150]">'
);

fs.writeFileSync('src/os/components/OrionSystemBar.tsx', code);
