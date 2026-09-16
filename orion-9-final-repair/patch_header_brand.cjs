const fs = require('fs');
let code = fs.readFileSync('src/components/layout/Header.tsx', 'utf8');

if (!code.includes("BrandLogo")) {
  code = code.replace("import { BrandingConfig } from '../../types/auth';", "import { BrandingConfig } from '../../types/auth';\nimport { BrandLogo } from '../brand/BrandLogo';");
  
  code = code.replace(
    /\{title\}\s*<\/h1>\s*<\/div>/,
    "{title}\n        </h1>\n      </div>\n      {/* Added BrandLogo to the left */}\n      <div className=\"hidden md:flex flex-1 justify-center px-4 overflow-hidden\">\n         {/* Center title area if needed, or leave empty if title is on left. Actually user says:\n           Left: Orion logo / OS name\n           Center/left: Current module title\n           Let's restructure slightly. */}\n      </div>"
  );
  
  code = code.replace(
    /<div className="flex items-center gap-3 min-w-0">/,
    `<div className="flex items-center gap-4 min-w-0 shrink-0">\n        {/* BrandLogo Left */}\n        <div className="hidden md:block w-48 shrink-0">\n          <BrandLogo size={24} variant="full" />\n        </div>\n        <div className="hidden md:block w-px h-5 bg-os-surface-active mx-2" aria-hidden="true" />`
  );

  fs.writeFileSync('src/components/layout/Header.tsx', code);
}
