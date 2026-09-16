const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(/return \(\n    <canvas/g, "return (\n    <>\n      <canvas");
code = code.replace(/<\/div>\n  \);\n\}/g, "</div>\n    </>\n  );\n}");

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
