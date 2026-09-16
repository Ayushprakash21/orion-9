const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionDesktop.tsx', 'utf8');

code = code.replace(/<div className="fixed inset-0 w-screen h-screen bg-os-bg/g, '<div className="fixed inset-0 w-screen h-screen bg-transparent');
code = code.replace(/<div className="absolute inset-0 z-0 pointer-events-none bg-os-bg">/g, '<div className="absolute inset-0 z-0 pointer-events-none">');

fs.writeFileSync('src/os/components/OrionDesktop.tsx', code);
