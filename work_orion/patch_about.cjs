const fs = require('fs');
let code = fs.readFileSync('src/components/About.tsx', 'utf-8');

// Replace imports
code = code.replace(
  "import React from 'react';",
  "import React, { useState, useEffect } from 'react';\nimport { brandingRepository } from '../repositories/BrandingRepository';\nimport { BrandingConfig } from '../types/auth';"
);

// Add state for branding
code = code.replace(
  "const { settings } = useSupplyChain();",
  `const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());
  
  useEffect(() => {
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

  const appTagline = branding.description || 'AI-Native Supply Chain Operating System';`
);

fs.writeFileSync('src/components/About.tsx', code);
