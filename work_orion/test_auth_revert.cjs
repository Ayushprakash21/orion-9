const fs = require('fs');
const content = fs.readFileSync('src/store/AuthContext.tsx', 'utf8');
const patched = content.replace('isAuthenticated: true,', 'isAuthenticated: false,').replace('isAdmin: true,', 'isAdmin: false,').replace('isInitializing: false,', 'isInitializing: true,');
fs.writeFileSync('src/store/AuthContext.tsx', patched);
