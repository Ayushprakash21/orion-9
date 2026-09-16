const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionPowerOnScreen.tsx', 'utf8');

code = code.replace(/className="fixed inset-0 w-full h-full z-\[10000\] bg-os-bg/g, 'className="fixed inset-0 w-full h-full z-[10000] bg-transparent');
// Remove background gradient and nodes drawing
code = code.replace(/<div className="absolute inset-0 bg-\[radial-gradient\(ellipse_at_center,transparent_20%,#000000_100%\)\] pointer-events-none z-10" \/>/, '');
code = code.replace(/<svg className="absolute inset-0 w-full h-full pointer-events-none z-0"[\s\S]*?<\/svg>/, '');

fs.writeFileSync('src/os/components/OrionPowerOnScreen.tsx', code);
