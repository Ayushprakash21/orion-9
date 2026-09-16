const fs = require('fs');
const content = fs.readFileSync('src/store/AuthContext.tsx', 'utf8');
const patched = content.replace('isAuthenticated: false,', 'isAuthenticated: true,').replace('isAdmin: false,', 'isAdmin: true,').replace('isInitializing: true,', 'isInitializing: false,');
fs.writeFileSync('src/store/AuthContext.tsx', patched);
