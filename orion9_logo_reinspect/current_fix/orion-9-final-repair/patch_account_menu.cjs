const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => handleAction\('\/login'\)\}/,
  "onClick={() => { signOut(); navigate('/login'); setIsOpen(false); }}"
);

fs.writeFileSync('src/components/layout/AccountMenu.tsx', code);
