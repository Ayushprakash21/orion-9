const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsCurrencyConverter.tsx', 'utf8');

code = code.replace(/disabled=\{loading\}/g, "disabled={loading || !amount || amount <= 0 || isNaN(amount)}");

fs.writeFileSync('src/components/SettingsCurrencyConverter.tsx', code);
