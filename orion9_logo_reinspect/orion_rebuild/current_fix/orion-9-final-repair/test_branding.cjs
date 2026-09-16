const fs = require('fs');
console.log(fs.readFileSync('src/repositories/BrandingRepository.ts', 'utf8').includes('updateBranding'));
