const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => \{ signOut\(\); navigate\('\/login'\); setIsOpen\(false\); \}\}/g,
  'onClick={async () => { await signOut(); navigate(\'/login\'); setIsOpen(false); }}'
);

code = code.replace(
  /onClick=\{\(\) => handleAction\('\/admin'\)\}/g,
  'onClick={async () => { await signOut(); navigate(\'/admin-login\'); setIsOpen(false); }}'
);

fs.writeFileSync('src/components/layout/AccountMenu.tsx', code);
