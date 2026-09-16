const fs = require('fs');
let content = fs.readFileSync('src/os/components/OrionSystemBar.tsx', 'utf8');

content = content.replace(
  /<header className="fixed top-0 left-0 right-0 h-10 sm:h-12 md:h-\[50px\] z-\[100\]/g,
  '<header className="fixed top-0 left-0 right-0 h-12 md:h-[48px] z-[100]'
);

content = content.replace(
  /<BrandLogo sizePreset="sm" variant="mark" \/>\s*<span className="font-mono font-bold text-\[10px\] sm:text-xs tracking-wider uppercase hidden sm:inline-block ml-0\.5 shrink-0 whitespace-nowrap">\s*\{branding\.osName \|\| branding\.applicationName \|\| branding\.appName \|\| 'ORION SCM OS'\}\s*<\/span>/,
  `<BrandLogo sizePreset="sm" variant="mark" />
          <span className="font-mono font-bold text-[13px] md:text-[14px] tracking-wider uppercase hidden sm:inline-block ml-1 shrink-0 whitespace-nowrap text-os-text-primary">
            {branding.osName || branding.applicationName || branding.appName || 'ORION SCM OS'}
          </span>`
);

fs.writeFileSync('src/os/components/OrionSystemBar.tsx', content);
