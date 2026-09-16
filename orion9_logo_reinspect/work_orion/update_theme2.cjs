const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');

const newButton = `            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                updateSettings({ theme: settings?.theme === 'light' ? 'dark' : 'light' });
              }} 
              className="w-full flex items-center justify-between px-3 py-2 text-xs text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover rounded-md transition-colors text-left group"
              aria-label={settings?.theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              <span>Theme</span>
              <div 
                className={\`relative w-[48px] h-[26px] rounded-full border transition-colors duration-200 flex items-center shrink-0 \${
                  settings?.theme === 'light' 
                    ? 'bg-[#E1E4E2] border-[#D7DBD8]' 
                    : 'bg-[#111214] border-[#3F4449]'
                }\`}
              >
                <div className="absolute inset-0 flex justify-between items-center px-1.5 pointer-events-none">
                  <Moon size={11} className={\`text-[#00F2FE] transition-opacity duration-200 \${settings?.theme === 'light' ? 'opacity-0' : 'opacity-100'}\`} />
                  <Sun size={11} className={\`text-amber-500 transition-opacity duration-200 \${settings?.theme === 'light' ? 'opacity-100' : 'opacity-0'}\`} />
                </div>
                <div 
                  className={\`absolute w-[18px] h-[18px] rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.3)] transform transition-transform duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-center \${
                    settings?.theme === 'light' ? 'translate-x-[3px] bg-white' : 'translate-x-[25px] bg-[#292C2F]'
                  }\`}
                />
              </div>
            </button>`;

code = code.replace(/<button\s+type="button"\s+onClick=\{\(e\) => \{[\s\S]*?\} \s+className="w-full flex items-center justify-between px-3 py-2 text-xs text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover rounded-md transition-colors text-left group"[\s\S]*?<\/button>/, newButton);

fs.writeFileSync('src/components/layout/AccountMenu.tsx', code);
