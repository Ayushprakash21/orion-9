const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf8');

code = code.replace(/import { Factory, /g, "import { ");
code = code.replace(/import { Factory,/g, "import { ");

fs.writeFileSync('src/components/Dashboard.tsx', code);
