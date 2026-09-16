const fs = require('fs');
let code = fs.readFileSync('src/repositories/BrandingRepository.ts', 'utf8');
code = code.replace(/appName: 'ORION 9 OS',/g, "appName: 'ORION SCM OS',");
code = code.replace(/applicationName: 'ORION 9 OS',/g, "applicationName: 'ORION SCM OS',");
code = code.replace(/description: 'AI-Native Supply Chain Operating System',/g, "description: 'AI Supply Chain Operating System',");
fs.writeFileSync('src/repositories/BrandingRepository.ts', code);
