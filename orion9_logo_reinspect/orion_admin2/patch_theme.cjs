const fs = require('fs');
// 1. Remove from settings
let settingsType = fs.readFileSync('src/types/settings.ts', 'utf8');
settingsType = settingsType.replace(/theme: 'light' \| 'dark';/, '');
fs.writeFileSync('src/types/settings.ts', settingsType);

let sysCtx = fs.readFileSync('src/store/SupplyChainContext.tsx', 'utf8');
sysCtx = sysCtx.replace(/theme: 'dark',/g, '');
fs.writeFileSync('src/store/SupplyChainContext.tsx', sysCtx);

// 2. Remove light mode toggle from User Profile / Admin Profile / AccountMenu
let accMenu = fs.readFileSync('src/components/layout/AccountMenu.tsx', 'utf8');
accMenu = accMenu.replace(/<button onClick=\{\(\) => updateSettings\(\{ theme: settings\?\.theme === 'dark' \? 'light' : 'dark' \}\)\} className="[^"]*">\s*<span className="flex items-center gap-2"><Moon size=\{14\} className="text-os-text-muted" \/> Dark Mode<\/span>\s*<div className=\{`w-8 h-4[^`]*`\}>\s*<div className=\{`w-3 h-3[^`]*`\} \/>\s*<\/div>\s*<\/button>/g, '');
fs.writeFileSync('src/components/layout/AccountMenu.tsx', accMenu);
