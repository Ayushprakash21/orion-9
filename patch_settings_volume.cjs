const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

const volumeSectionRegex = /<div>\s*<label className="block text-\[10px\] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Master Volume<\/label>[\s\S]*?<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*<div className="flex justify-end gap-3 items-center pt-2 mt-6">/g;

code = code.replace(volumeSectionRegex, '<div className="flex justify-end gap-3 items-center pt-2 mt-6">');

fs.writeFileSync('src/components/Settings.tsx', code);
