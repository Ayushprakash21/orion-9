const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf-8');

// Add imports
code = code.replace(
  "import { useSupplyChain } from '../../store/SupplyChainContext';",
  "import { useSupplyChain } from '../../store/SupplyChainContext';\nimport { brandingRepository } from '../../repositories/BrandingRepository';\nimport { BrandingConfig } from '../../types/auth';"
);

// Add state and effect
code = code.replace(
  "const { settings } = useSupplyChain();\n\n  React.useEffect(() => {\n    document.title = settings.applicationName || 'ORION SCM OS';\n  }, [settings.applicationName]);",
  `const { settings } = useSupplyChain();
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
  }, []);

  React.useEffect(() => {
    document.title = branding.appName || branding.applicationName || 'ORION SCM OS';
  }, [branding.appName, branding.applicationName]);`
);

fs.writeFileSync('src/components/layout/Layout.tsx', code);
