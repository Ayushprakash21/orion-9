const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(
  /<div className="absolute top-\[12vh\] left-\[5vw\] pointer-events-none z-10 hidden md:block">/g,
  '<div className="absolute top-[12vh] left-[5vw] pointer-events-none z-10 hidden md:block animate-in fade-in duration-1000 delay-1000 fill-mode-both">'
);

code = code.replace(
  /<div className="absolute bottom-\[10vh\] left-\[5vw\] pointer-events-none z-10 hidden md:block opacity-50">/g,
  '<div className="absolute bottom-[10vh] left-[5vw] pointer-events-none z-10 hidden md:block opacity-50 animate-in fade-in duration-1000 delay-1000 fill-mode-both">'
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
