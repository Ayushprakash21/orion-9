const fs = require('fs');
let code = fs.readFileSync('src/types/settings.ts', 'utf8');

code = code.replace(/theme\?: 'dark' \| 'light';/g, "theme?: 'dark';");
code = code.replace(/theme: raw\.theme === 'light' \? 'light' : 'dark',/g, "theme: 'dark', // Force dark theme");

fs.writeFileSync('src/types/settings.ts', code);
