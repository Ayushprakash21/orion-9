const fs = require('fs');
let sidebarStr = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

if (!sidebarStr.includes('Network')) {
   // Already checked, but just to be sure
}

sidebarStr = sidebarStr.replace(
  'import { \n  LayoutDashboard,',
  'import { \n  Network,\n  LayoutDashboard,'
);

sidebarStr = sidebarStr.replace(
  'import { \n  LayoutDashboard,',
  'import { Network, LayoutDashboard,'
);

// Actually, just append it if not present in the lucide-react import
const lucideIndex = sidebarStr.indexOf('} from \'lucide-react\'');
if (lucideIndex > -1 && !sidebarStr.includes('Network,')) {
    sidebarStr = sidebarStr.replace('} from \'lucide-react\';', '  Network,\n} from \'lucide-react\';');
}

fs.writeFileSync('src/components/layout/Sidebar.tsx', sidebarStr);
