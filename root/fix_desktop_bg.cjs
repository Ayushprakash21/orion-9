const fs = require('fs');

let content = fs.readFileSync('src/os/components/OrionDesktop.tsx', 'utf8');
content = content.replace(
  /className="absolute inset-0 z-0 pointer-events-none bg-gradient-to-br from-\[\#02050A\] via-\[\#040813\] to-\[\#080B14\]"/,
  'className="absolute inset-0 z-0 pointer-events-none bg-os-bg"'
);

fs.writeFileSync('src/os/components/OrionDesktop.tsx', content);
