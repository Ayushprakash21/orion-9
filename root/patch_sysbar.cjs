const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionSystemBar.tsx', 'utf8');

code = code.replace(
  /\{branding\.osName \|\| branding\.applicationName \|\| branding\.appName \|\| 'ORION SCM OS'\}/g,
  "{(branding.osName || branding.applicationName || branding.appName || 'ORION SCM OS').replace(/\\n/g, ' ')}"
);

fs.writeFileSync('src/os/components/OrionSystemBar.tsx', code);
