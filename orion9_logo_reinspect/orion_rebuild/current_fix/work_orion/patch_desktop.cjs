const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionDesktop.tsx', 'utf8');

code = code.replace(/<OrionLiveWallpaper \/>/g, '{/* OrionLiveWallpaper is now hoisted to App.tsx */}');

fs.writeFileSync('src/os/components/OrionDesktop.tsx', code);
