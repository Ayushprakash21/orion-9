const fs = require('fs');

function patchFile(filepath) {
  let code = fs.readFileSync(filepath, 'utf8');

  // Import useBranding if not present
  if (!code.includes('useBranding')) {
    code = code.replace(
      /import \{ useAuth \} from ['"]\.\.\/\.\.\/store\/AuthContext['"];/,
      "import { useAuth } from '../../store/AuthContext';\nimport { useBranding } from '../../store/BrandingContext';"
    );
  }

  // Add hook call
  code = code.replace(
    /const \{ login, isAuthenticated, isPostLoginInitializing \} = useAuth\(\);/,
    "const { login, isAuthenticated, isPostLoginInitializing } = useAuth();\n  const { branding } = useBranding();"
  );
  
  // Also for AdminLogin:
  code = code.replace(
    /const \{ adminLogin, login, isAuthenticated \} = useAuth\(\);/,
    "const { adminLogin, login, isAuthenticated } = useAuth();\n  const { branding } = useBranding();"
  );

  // Replace hardcoded "ORION SCM OS" with branding.appName
  code = code.replace(
    /<h1 className="text-2xl font-semibold tracking-tight text-os-text-primary mt-6 mb-2">[\s]*ORION SCM OS[\s]*<\/h1>/g,
    '<h1 className="text-2xl font-semibold tracking-tight text-os-text-primary mt-6 mb-2">{branding.appName}</h1>'
  );

  code = code.replace(
    /<h1 className="text-2xl font-semibold tracking-tight text-os-text-primary mb-2">[\s]*ORION SCM OS[\s]*<\/h1>/g,
    '<h1 className="text-2xl font-semibold tracking-tight text-os-text-primary mb-2">{branding.appName}</h1>'
  );

  // Replace hardcoded tagline with branding.description
  code = code.replace(
    /<p className="text-sm text-os-text-muted mb-8 tracking-wide font-mono uppercase">[\s]*AI-Native Supply Chain Operating System[\s]*<\/p>/g,
    '<p className="text-sm text-os-text-muted mb-8 tracking-wide font-mono uppercase">{branding.description}</p>'
  );

  code = code.replace(
    /<p className="text-sm text-os-text-muted mb-8 tracking-wide font-mono uppercase">[\s]*Platform Control Plane[\s]*<\/p>/g,
    '<p className="text-sm text-os-text-muted mb-8 tracking-wide font-mono uppercase">Platform Control Plane</p>'
  );

  // Ensure BrandLogo uses branding if it doesn't already
  code = code.replace(
    /<BrandLogo size="lg" \/>/g,
    '<BrandLogo size="lg" url={branding.logoUrl} appName={branding.appName} includesName={branding.logoIncludesName} />'
  );

  fs.writeFileSync(filepath, code);
}

patchFile('src/components/auth/Login.tsx');
patchFile('src/components/auth/AdminLogin.tsx');
