const fs = require('fs');
let code = fs.readFileSync('src/components/admin/AdminLayout.tsx', 'utf8');

const regex = /\{\/\* Top Right: Actions \*\/\}\s*<div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-end ml-auto">/;
const replacement = `{/* Top Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-end ml-auto">
          <button
            onClick={() => {
              window.location.href = '/login';
            }}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-os-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded border border-os-border hover:border-[#00F2FE]/50 transition-all cursor-pointer"
          >
            USER CONSOLE
          </button>`;

code = code.replace(regex, replacement);
fs.writeFileSync('src/components/admin/AdminLayout.tsx', code);
