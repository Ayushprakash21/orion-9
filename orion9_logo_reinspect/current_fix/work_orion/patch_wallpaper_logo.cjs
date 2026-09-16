const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

// Insert BrandLogo Component
code = code.replace(
  /<canvas \n      ref=\{canvasRef\} \n      className="absolute inset-0 w-full h-full pointer-events-none z-0"\n    \/>/g,
  `<canvas 
      ref={canvasRef} 
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
    />
    <div className="absolute top-[12vh] left-[5vw] pointer-events-none z-10 hidden md:block">
      <div className="flex flex-col gap-4">
        <img src={branding.logoUrl || branding.logo} alt="" className="h-16 w-auto object-contain drop-shadow-2xl" style={{ filter: 'brightness(1.1)' }} onError={(e) => e.currentTarget.style.display = 'none'} />
        <div className="text-left">
          <h2 className="font-mono text-xs tracking-[0.2em] text-os-text-secondary uppercase mb-1">CONNECTED INTELLIGENCE</h2>
          <h2 className="font-mono text-xs tracking-[0.2em] text-os-text-secondary uppercase mb-1">FOR A MORE RESILIENT</h2>
          <h2 className="font-mono text-xs tracking-[0.2em] text-os-text-secondary uppercase">TOMORROW</h2>
          <div className="w-8 h-0.5 bg-os-accent mt-4 opacity-50" />
        </div>
      </div>
    </div>`
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
