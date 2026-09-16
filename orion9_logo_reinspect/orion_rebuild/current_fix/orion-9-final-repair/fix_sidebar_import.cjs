const fs = require('fs');
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebarStr = sidebarStr.replace(
  'import {',
  'import { Network, '
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
