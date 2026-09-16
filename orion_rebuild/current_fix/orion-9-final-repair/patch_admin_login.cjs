const fs = require('fs');
let code = fs.readFileSync('src/components/auth/AdminLogin.tsx', 'utf8');

// Remove the top right "BACK TO USER" link
code = code.replace(
  /<div className="w-full p-4 sm:p-6 lg:p-8 flex items-center justify-end shrink-0">[\s\S]*?<\/div>/,
  ''
);

// Insert it in the bottom left of the left panel!
// Let's find the left panel first.
code = code.replace(
  /<\/div>\s*\{?\/\* Right Side: Login Form \*\/\}/,
  `  <div className="absolute bottom-6 sm:bottom-8 left-6 sm:left-8 z-20">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-mono font-bold tracking-widest uppercase text-os-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded-lg border border-os-border hover:border-[#00F2FE]/50 transition-all cursor-pointer shadow-lg"
            >
              USER CONSOLE
            </Link>
          </div>
        </div>
      {/* Right Side: Login Form */}`
);

fs.writeFileSync('src/components/auth/AdminLogin.tsx', code);
