const fs = require('fs');
let code = fs.readFileSync('src/components/brand/BrandLogo.tsx', 'utf8');

code = code.replace(
  /title="\{appTagline\}"/g,
  'title={appTagline}'
);

fs.writeFileSync('src/components/brand/BrandLogo.tsx', code);
