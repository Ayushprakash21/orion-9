const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(
  /import \{ cn \} from '\.\.\/\.\.\/lib\/utils';/g,
  "import { cn } from '../../lib/utils';\nimport { BrandLogo } from '../../components/brand/BrandLogo';"
);

code = code.replace(
  /<img src=\{branding\.logoUrl \|\| branding\.logo\} alt="" className="h-16 w-auto object-contain drop-shadow-2xl" style=\{\{ filter: 'brightness\(1\.1\)' \}\} onError=\{\(e\) => e\.currentTarget\.style\.display = 'none'\} \/>/,
  `<div className="drop-shadow-2xl"><BrandLogo sizePreset="lg" variant="full" /></div>`
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
