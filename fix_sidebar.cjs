const fs = require('fs');

let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

if (!sidebarStr.includes('Network,')) {
    sidebarStr = sidebarStr.replace(
      'import {\n  LayoutDashboard,',
      'import {\n  LayoutDashboard,\n  Network,'
    );
}
fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
