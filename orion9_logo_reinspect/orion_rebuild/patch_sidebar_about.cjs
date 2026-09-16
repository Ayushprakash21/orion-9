const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Sidebar.tsx', 'utf8');

if (!code.includes("const appName = settings?.applicationName || 'ORION SCM OS';")) {
  code = code.replace(
    "export const Sidebar = ({ isOpen, closeSidebar }: { isOpen: boolean, closeSidebar: () => void }) => {",
    "export const Sidebar = ({ isOpen, closeSidebar }: { isOpen: boolean, closeSidebar: () => void }) => {\n  const { settings } = useSupplyChain();\n  const appName = settings?.applicationName || 'ORION SCM OS';"
  );
  
  code = code.replace(
    /\{item\.name === 'About OS' \? `About \$\{appName\}` : item\.name\}/g,
    ""
  );

  code = code.replace(
    "{item.name}",
    "{item.name === 'About OS' ? `About ${appName}` : item.name}"
  );
  
  fs.writeFileSync('src/components/layout/Sidebar.tsx', code);
}
