const fs = require('fs');
let code = fs.readFileSync('src/components/Settings.tsx', 'utf8');

// Update currency options mapping
code = code.replace(
  /setCurrencyOptions\(res\.map\(c => \(\{ value: c\.code, label: `\$\{c\.code\} - \$\{c\.name\}` \}\)\)\);/,
  "setCurrencyOptions(res.map(c => ({ value: c.code, label: `${c.flag || ''} ${c.code} — ${c.name}`, subLabel: c.symbol, searchStr: `${c.code} ${c.name} ${c.symbol}` })));"
);

fs.writeFileSync('src/components/Settings.tsx', code);
