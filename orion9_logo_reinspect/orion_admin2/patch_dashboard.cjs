const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Add imports
code = code.replace(
  "import { useSupplyChain } from '../store/SupplyChainContext';",
  "import { useSupplyChain } from '../store/SupplyChainContext';\nimport { brandingRepository } from '../repositories/BrandingRepository';\nimport { BrandingConfig } from '../types/auth';"
);

// Add state hook
code = code.replace(
  "const { userProfile, organization } = useSupplyChain();",
  `const { userProfile, organization } = useSupplyChain();
  const [branding, setBranding] = React.useState<BrandingConfig>(() => brandingRepository.getBrandingSync());

  React.useEffect(() => {
    const handleBrandingUpdate = () => {
      setBranding(brandingRepository.getBrandingSync());
    };
    window.addEventListener("orion-branding-updated", handleBrandingUpdate);
    window.addEventListener("storage", handleBrandingUpdate);
    return () => {
      window.removeEventListener("orion-branding-updated", handleBrandingUpdate);
      window.removeEventListener("storage", handleBrandingUpdate);
    };
  }, []);`
);

// Replace hardcoded descriptions
code = code.replace(
  'description="AI-Native Supply Chain Operating System"',
  'description={branding.description || "AI Supply Chain Operating System"}'
);

code = code.replace(
  'title="Orion Command Center"',
  'title={`${branding.appName || "ORION SCM OS"} Command Center`}'
);

fs.writeFileSync('src/components/Dashboard.tsx', code);
