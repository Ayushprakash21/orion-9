const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

code = code.replace(/onClick=\{\(\) => setLocalSettings\(prev => \(\{\.\.\.prev, theme: 'dark'\}\)\)\}/g, "onClick={() => { setLocalSettings(prev => ({...prev, theme: 'dark'})); updateSettings({ theme: 'dark' }); }}");
code = code.replace(/onClick=\{\(\) => setLocalSettings\(prev => \(\{\.\.\.prev, theme: 'light'\}\)\)\}/g, "onClick={() => { setLocalSettings(prev => ({...prev, theme: 'light'})); updateSettings({ theme: 'light' }); }}");

fs.writeFileSync('src/components/Settings.tsx', code);
