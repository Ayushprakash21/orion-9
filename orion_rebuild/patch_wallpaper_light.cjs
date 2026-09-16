const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(/const isLightMode = \(\) => document\.documentElement\.classList\.contains\('light'\);\n/g, "");
code = code.replace(/const light = document\.documentElement\.classList\.contains\('light'\);/g, "const light = false;");

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
