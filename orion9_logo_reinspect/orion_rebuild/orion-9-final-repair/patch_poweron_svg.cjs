const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionPowerOnScreen.tsx', 'utf8');

code = code.replace(/<svg\s[\s\S]*?<\/svg>/g, '');

fs.writeFileSync('src/os/components/OrionPowerOnScreen.tsx', code);
