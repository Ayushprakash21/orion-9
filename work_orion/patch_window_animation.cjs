const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionWindow.tsx', 'utf8');

code = code.replace(
  /exit=\{\{ opacity: 0, scale: 0\.95, y: 20 \}\}/g,
  'exit={{ opacity: 0 }}'
);

code = code.replace(
  /transition=\{\{ duration: 0\.2, ease: "easeOut" \}\}/g,
  'transition={{ duration: 0.15, ease: "linear" }}'
);

fs.writeFileSync('src/os/components/OrionWindow.tsx', code);
