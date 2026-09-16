const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Layout.tsx', 'utf-8');

// Add imports
code = code.replace(
  "import { useSupplyChain } from '../../store/SupplyChainContext';",
  "import { useSupplyChain } from '../../store/SupplyChainContext';\nimport { brandingRepository } from '../../repositories/BrandingRepository';\nimport { BrandingConfig } from '../../types/auth';"
);

// Add branding state
code = code.replace(
  "const { settings } = useSupplyChain();",
  `const { settings } = useSupplyChain();
  const [branding, setBranding] = React.useState<BrandingConfig>(() => brandingRepository.getBrandingSync());`
);

code = code.replace(
  "document.title = settings.applicationName || 'ORION SCM OS';",
  `const handleBrandingUpdate = () => {
      setBranding(brandingRepository.getBrandingSync());
    };
    window.addEventListener("orion-branding-updated", handleBrandingUpdate);
    window.addEventListener("storage", handleBrandingUpdate);
    
    document.title = branding.appName || branding.applicationName || 'ORION SCM OS';
    
    return () => {
      window.removeEventListener("orion-branding-updated", handleBrandingUpdate);
      window.removeEventListener("storage", handleBrandingUpdate);
    };`
);

// We need to fix the useEffect if it doesn't already have one, but let's check what it has first.
