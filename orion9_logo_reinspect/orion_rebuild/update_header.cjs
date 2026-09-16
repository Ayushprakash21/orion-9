const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

code = code.replace(/AI Copilot/g, 'ORION AI');
code = code.replace(/>Copilot</g, '>ORION AI<');

fs.writeFileSync('src/components/layout/Header.tsx', code);
