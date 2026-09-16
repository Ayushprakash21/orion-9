const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

code = code.replace(/if \(settings\?\.reducedMotion\) \{/g, 'if (supplyChain?.settings?.reducedMotion) {');

fs.writeFileSync('src/App.tsx', code);
