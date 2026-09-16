const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsCurrencyConverter.tsx', 'utf8');

const swapButton = `
          <div className="flex items-center justify-center pt-6">
            <button
              onClick={() => {
                const temp = sourceCurrency;
                setSourceCurrency(targetCurrency);
                setTargetCurrency(temp);
                setConvertedAmount(null);
                setRateObj(null);
              }}
              className="p-2 bg-os-surface-hover rounded-full text-os-text-secondary hover:text-os-text-primary transition-colors mt-0 sm:mt-1"
              title="Swap Currencies"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M4 20L9 15M9 9l-5 5M20 4L4 20"/></svg>
            </button>
          </div>
`;

code = code.replace(/<div className="grid grid-cols-1 sm:grid-cols-3 gap-6">[\s\S]*?<\/div>\s*<\/div>/, `<div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_1fr] gap-4 sm:gap-6 items-start">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Amount</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">From</label>
            <SearchableDropdown value={sourceCurrency} options={currencyOptions} onChange={setSourceCurrency} />
          </div>
          <div className="flex items-center justify-center h-full pt-1 sm:pt-6">
            <button
              onClick={() => {
                setSourceCurrency(targetCurrency);
                setTargetCurrency(sourceCurrency);
                setConvertedAmount(null);
                setRateObj(null);
              }}
              className="p-2 bg-os-surface-hover border border-os-border rounded-full text-os-text-secondary hover:text-os-text-primary transition-colors"
              title="Swap Currencies"
            >
              <span className="sr-only">Swap</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m8 3 4 4-4 4"/><path d="M12 7H4"/><path d="m16 21-4-4 4-4"/><path d="M12 17h8"/></svg>
            </button>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">To</label>
            <SearchableDropdown value={targetCurrency} options={currencyOptions} onChange={setTargetCurrency} />
          </div>
        </div>`);

fs.writeFileSync('src/components/SettingsCurrencyConverter.tsx', code);
