const fs = require('fs');
let code = fs.readFileSync('src/components/Dashboard.tsx', 'utf-8');

// Insert the branding hook after the useNavigate() line
code = code.replace(
  "const navigate = useNavigate();",
  `const navigate = useNavigate();
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

fs.writeFileSync('src/components/Dashboard.tsx', code);
