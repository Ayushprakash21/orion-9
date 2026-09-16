const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionLiveWallpaper.tsx', 'utf8');

code = code.replace(
  /<\/div>\n    <\/div>`/g,
  `</div>\n    </div>\n    <div className="absolute bottom-[10vh] left-[5vw] pointer-events-none z-10 hidden md:block opacity-50">\n      <h3 className="font-mono text-[10px] tracking-widest text-os-text-primary uppercase mb-2">SUPPLY CHAIN OPERATING SYSTEM</h3>\n      <p className="font-mono text-[9px] tracking-widest text-os-text-muted">PEOPLE • DATA • INTELLIGENCE • IMPACT</p>\n    </div>`
);

fs.writeFileSync('src/os/components/OrionLiveWallpaper.tsx', code);
