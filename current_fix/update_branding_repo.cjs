const fs = require('fs');
let code = fs.readFileSync('src/repositories/BrandingRepository.ts', 'utf8');

code = code.replace(/if \(data\.logo && data\.logo\.length > 2\.5 \* 1024 \* 1024\)/, 'if (data.logo && typeof data.logo === "string" && data.logo.length > 4 * 1024 * 1024)');
code = code.replace(/await brandingStore\.setItem\(BRANDING_STORAGE_KEY, JSON\.stringify\(updated\)\);/, 'await brandingStore.setItem(BRANDING_STORAGE_KEY, JSON.stringify(updated));');

fs.writeFileSync('src/repositories/BrandingRepository.ts', code);
