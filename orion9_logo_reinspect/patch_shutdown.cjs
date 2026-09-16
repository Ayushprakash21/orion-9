const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionShutdownScreen.tsx', 'utf8');

code = code.replace(/className="fixed inset-0 bg-os-bg/g, 'className="fixed inset-0 bg-transparent');
code = code.replace(/<div \n        className=\{`absolute inset-0 bg-\[url\('\/noise.png'\)\] mix-blend-overlay transition-opacity duration-1000 \n          \$\{phase === 'terminated' \|\| phase === 'final' \? 'opacity-0' : 'opacity-\[0.03\]'\}`\}\n      \/>/, '');
code = code.replace(/<div className="absolute inset-0 bg-\[radial-gradient\(ellipse_at_center,rgba\(0,242,254,0.05\)_0%,transparent_70%\)\]" \/>/, '');

fs.writeFileSync('src/os/components/OrionShutdownScreen.tsx', code);
