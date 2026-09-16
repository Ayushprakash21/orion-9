const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(/\{isAdmin && \(\s*<\/div>\s*\)\}/g, "");

fs.writeFileSync('src/components/Settings.tsx', code);
