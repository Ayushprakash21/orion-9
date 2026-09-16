const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!code.includes("import { AccountMenu }")) {
  code = `import { AccountMenu } from './AccountMenu';\n` + code;
  fs.writeFileSync('src/components/layout/Header.tsx', code);
}
