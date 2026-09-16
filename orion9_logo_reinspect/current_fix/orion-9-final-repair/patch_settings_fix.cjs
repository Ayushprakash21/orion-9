const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(/<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">\n\s*<\/div>/, '<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">');

fs.writeFileSync('src/components/Settings.tsx', code);
