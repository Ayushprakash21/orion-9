const fs = require('fs');

let desktop = fs.readFileSync('src/os/components/OrionDesktop.tsx', 'utf8');
desktop = desktop.replace(
  /<div className="absolute top-8 left-0 right-0 bottom-0 z-10 overflow-hidden w-full pointer-events-none">/,
  '<div className="absolute top-[48px] left-0 right-0 bottom-[80px] z-10 overflow-hidden w-full pointer-events-none">'
);
fs.writeFileSync('src/os/components/OrionDesktop.tsx', desktop);

let windowCode = fs.readFileSync('src/os/components/OrionWindow.tsx', 'utf8');
const regexTransitionEnd = /\s*transitionEnd: \{\n\s*display: isMinimized \? "none" : "flex"\n\s*\}/g;
windowCode = windowCode.replace(regexTransitionEnd, '');
fs.writeFileSync('src/os/components/OrionWindow.tsx', windowCode);

