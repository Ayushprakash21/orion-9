const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regex = /if \(theme === 'light'\) \{[\s\S]*?\} else \{[\s\S]*?\}/;
code = code.replace(regex, `document.documentElement.classList.remove('light');
    document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = 'dark';`);

fs.writeFileSync('src/App.tsx', code);
