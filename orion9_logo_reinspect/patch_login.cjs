const fs = require('fs');
let code = fs.readFileSync('src/components/auth/Login.tsx', 'utf8');

const regex = /\/\/ Automatically redirect if already authenticated[\s\S]*?}, \[isAuthenticated, isPostLoginInitializing, navigate, location\]\);/;
code = code.replace(regex, '');

fs.writeFileSync('src/components/auth/Login.tsx', code);
