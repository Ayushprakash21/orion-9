const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf8');

if (!code.includes("document.title =")) {
  code = code.replace(
    "export const Layout = () => {",
    "import { useSupplyChain } from '../../store/SupplyChainContext';\n\nexport const Layout = () => {\n  const { settings } = useSupplyChain();\n\n  React.useEffect(() => {\n    document.title = settings.applicationName || 'ORION SCM OS';\n  }, [settings.applicationName]);\n"
  );
  fs.writeFileSync('src/components/layout/Layout.tsx', code);
}
