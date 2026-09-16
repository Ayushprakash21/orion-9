const fs = require('fs');
let code = fs.readFileSync('src/os/components/OrionApplicationLauncher.tsx', 'utf8');

code = code.replace(
  /<div className="absolute inset-0 bg-os-surface-active backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" \/>/,
  '<div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in" />'
);

code = code.replace(
  /className="relative w-full max-w-3xl max-h-\[85vh\] mb-20 flex flex-col bg-os-surface\/95 backdrop-blur-2xl rounded-2xl border border-os-border shadow-2xl animate-in fade-in slide-in-from-bottom-8 duration-200"/,
  'className="relative w-full max-w-3xl max-h-[85vh] mb-20 flex flex-col bg-black/60 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_35px_60px_-15px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.06)] animate-in fade-in slide-in-from-bottom-8 duration-200"'
);

fs.writeFileSync('src/os/components/OrionApplicationLauncher.tsx', code);
