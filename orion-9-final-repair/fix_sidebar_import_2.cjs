const fs = require('fs');
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

sidebarStr = sidebarStr.replace(
  'import { Network,  NavLink } from \'react-router-dom\';',
  'import { NavLink } from \'react-router-dom\';'
);

sidebarStr = sidebarStr.replace(
  'import {\n  LayoutDashboard,',
  'import {\n  Network,\n  LayoutDashboard,'
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
