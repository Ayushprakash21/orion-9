const fs = require('fs');
let code = fs.readFileSync('src/store/AuthContext.tsx', 'utf8');
code = code.replace(/const startup = async \(\) => {/, "const startup = async () => {\n      console.log('DEBUG: AuthContext startup');");
code = code.replace(/setIsInitializing\(false\);/, "console.log('DEBUG: setIsInitializing(false)'); setIsInitializing(false);");
fs.writeFileSync('src/store/AuthContext.tsx', code);
