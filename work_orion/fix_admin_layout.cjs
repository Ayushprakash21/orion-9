const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

code = code.replace(
  /onClick=\{\(\) => \{\s*signOut\(\);\s*navigate\('\/login'\);\s*\}\}/,
  'onClick={async () => { await signOut(); navigate(\'/login\'); }}'
);

fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);
