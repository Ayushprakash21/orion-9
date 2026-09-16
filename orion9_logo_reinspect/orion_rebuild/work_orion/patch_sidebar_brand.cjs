const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

if (!code.includes("useSupplyChain")) {
  code = code.replace("import { NavLink } from 'react-router-dom';", "import { NavLink } from 'react-router-dom';\nimport { useSupplyChain } from '../../store/SupplyChainContext';");
}

code = code.replace(
  "export const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {",
  "export const Sidebar = ({ isOpen, closeSidebar }: SidebarProps) => {\n  const { settings } = useSupplyChain();"
);

code = code.replace(
  "{ name: 'About Orion SCM OS', path: '/about', icon: 'about' }",
  "{ name: `About ${settings.applicationName || 'ORION SCM OS'}`, path: '/about', icon: 'about' }"
);

fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
