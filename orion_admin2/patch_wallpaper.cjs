const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

const regex = /<div className="flex flex-col gap-4">\s*<div className="drop-shadow-2xl"><BrandLogo sizePreset="lg" variant="full" \/><\/div>\s*<div className="text-left">\s*<h2 className="font-mono text-xs tracking-\[0\.2em\] text-os-text-secondary uppercase mb-1">CONNECTED INTELLIGENCE<\/h2>\s*<h2 className="font-mono text-xs tracking-\[0\.2em\] text-os-text-secondary uppercase mb-1">FOR A MORE RESILIENT<\/h2>\s*<h2 className="font-mono text-xs tracking-\[0\.2em\] text-os-text-secondary uppercase">TOMORROW<\/h2>\s*<div className="w-8 h-0\.5 bg-os-accent mt-4 opacity-50" \/>\s*<\/div>\s*<\/div>/m;

const replacement = `<div className="flex flex-col gap-3">
        <div className="drop-shadow-2xl scale-125 origin-top-left mb-2"><BrandLogo sizePreset="xl" variant="mark" /></div>
        <div className="text-left">
          <h2 className="font-mono text-[10px] sm:text-xs tracking-[0.2em] text-os-text-secondary uppercase whitespace-nowrap">CONNECTED INTELLIGENCE FOR A MORE RESILIENT TOMORROW</h2>
          <div className="w-8 h-0.5 bg-os-accent mt-3 opacity-50" />
        </div>
      </div>`;

code = code.replace(regex, replacement);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
