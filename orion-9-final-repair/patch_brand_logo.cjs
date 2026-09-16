const fs = require('fs');
let code = fs.readFileSync('src/components/brand/BrandLogo.tsx', 'utf8');

if (!code.includes("useSupplyChain")) {
  code = code.replace("import { cn } from '../../lib/utils';", "import { cn } from '../../lib/utils';\nimport { useSupplyChain } from '../../store/SupplyChainContext';");
}

code = code.replace(
  "const appName = branding.applicationName || branding.appName || 'Orion SCM OS';",
  "const { settings } = useSupplyChain();\n  const appName = settings.applicationName || 'ORION SCM OS';\n  const appTagline = settings.applicationTagline || 'AI SUPPLY CHAIN OPERATING SYSTEM';"
);

code = code.replace(
  "AI SUPPLY CHAIN OPERATING SYSTEM",
  "{appTagline}"
);
code = code.replace(
  "AI SUPPLY CHAIN OPERATING SYSTEM",
  "{appTagline}"
);
code = code.replace(
  "AI SUPPLY CHAIN OPERATING SYSTEM",
  "{appTagline}"
);

fs.writeFileSync('src/components/brand/BrandLogo.tsx', code);
