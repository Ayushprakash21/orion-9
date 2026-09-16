const fs = require('fs');
let code = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');

// Replace Light Mode toggle and add Brightness
const replaceRegex = /<button \n            type="button"\n            onClick=\{\(e\) => \{\n              e\.stopPropagation\(\);\n              updateSettings\(\{ theme: settings\?\.theme === 'light' \? 'dark' : 'light' \}\);\n            \}\} \n            className="w-full text-left px-4 py-1\.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between"\n          >\n            <span className="flex items-center gap-2"><Sun size=\{14\} className="text-os-text-muted" \/> Light Mode<\/span>\n            <div className=\{`w-8 h-4 rounded-full transition-colors duration-200 flex items-center border border-os-border \$\{settings\?\.theme === 'light' \? 'bg-os-accent' : 'bg-os-surface-active'\}`\}>\n              <div className=\{`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm \$\{settings\?\.theme === 'light' \? 'translate-x-4' : 'translate-x-\[2px\]'\}`\} \/>\n            <\/div>\n          <\/button>/;

code = code.replace(replaceRegex, `
          <div className="px-4 py-1.5 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-os-text-primary"><Sun size={14} className="text-os-text-muted" /> Brightness</span>
              <span className="text-[10px] text-os-text-muted">{Math.round((settings?.brightness ?? 100))}</span>
            </div>
            <input 
              type="range" 
              min="20" max="100" 
              value={settings?.brightness ?? 100}
              onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
              className="w-full h-1 bg-os-surface-active rounded-lg appearance-none cursor-pointer focus:outline-none accent-os-accent"
            />
          </div>
`);

fs.writeFileSync('src/components/layout/AccountMenu.tsx', code);
