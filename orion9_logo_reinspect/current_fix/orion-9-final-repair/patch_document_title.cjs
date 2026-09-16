const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

// Insert document title sync effect
if (!code.includes('document.title =')) {
  code = code.replace(
    /const \{ bootState \} = useAuth\(\);/,
    `const { bootState } = useAuth();
  const { branding } = useBranding();

  React.useEffect(() => {
    document.title = branding.appName || 'ORION SCM OS';
  }, [branding.appName]);`
  );
  
  // Need to import useBranding if not already
  if (!code.includes('useBranding')) {
    code = code.replace(
      /import \{ useAuth \} from '\.\/store\/AuthContext';/,
      "import { useAuth } from './store/AuthContext';\nimport { useBranding } from './store/BrandingContext';"
    );
  }
}

fs.writeFileSync('src/App.tsx', code);
