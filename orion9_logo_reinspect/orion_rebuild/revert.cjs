const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');
code = code.replace(/server: \{\s*middlewareMode: true,\s*hmr: process.env.DISABLE_HMR === 'true' \? false : undefined\s*\}/, "server: { middlewareMode: true }");
fs.writeFileSync('server.ts', code);
