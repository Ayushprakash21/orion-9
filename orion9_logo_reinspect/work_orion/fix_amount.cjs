const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsCurrencyConverter.tsx', 'utf8');

// replace amount handling
code = code.replace(/<input\s+type="number"\s+value=\{amount\}/, '<input\n              type="number"\n              value={amount}\n              min="0.01"');

code = code.replace(/disabled=\{loading \|\| !amount \|\| amount <= 0 \|\| isNaN\(amount\)\}/, 'disabled={loading}');

const msgRegex = /\{convertedAmount !== null && \(/;
const newMsg = `{!amount || amount <= 0 || isNaN(amount) ? (
          <div className="mt-4 text-xs text-[#FF9F0A] flex items-center gap-1"><AlertTriangle size={12} /> Please enter a valid amount.</div>
        ) : null}
        
        {convertedAmount !== null && amount > 0 && !isNaN(amount) && (`;

code = code.replace(msgRegex, newMsg);

// Also handle the early return
code = code.replace(/if \(amount <= 0\) return;/, 'if (!amount || amount <= 0 || isNaN(amount)) { setConvertedAmount(null); return; }');

fs.writeFileSync('src/components/SettingsCurrencyConverter.tsx', code);
