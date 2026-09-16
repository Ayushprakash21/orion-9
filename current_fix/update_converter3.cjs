const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsCurrencyConverter.tsx', 'utf8');

const replacement = `        {convertedAmount !== null && (
          <div className="mt-6 p-4 bg-os-input-bg border border-os-border rounded-lg">
            {!rateObj && sourceCurrency !== targetCurrency ? (
              <div className="flex flex-col items-center justify-center py-4">
                <AlertTriangle size={24} className="text-[#FF9F0A] mb-2" />
                <div className="text-sm font-bold text-os-text-primary">FX rate unavailable</div>
                <div className="text-xs text-os-text-secondary mt-1">Unable to retrieve the latest reference rate. Please try again.</div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                <div>
                  <div className="text-2xl font-mono font-bold text-os-text-primary flex items-center gap-2 flex-wrap">
                    {formatCurrency(amount, sourceCurrency)} <ArrowRight size={20} className="text-os-text-muted" /> {formatCurrency(convertedAmount, targetCurrency)}
                  </div>
                  {rateObj && (
                    <div className="text-xs text-os-text-secondary font-mono mt-2 flex items-center gap-2">
                      Rate: 1 {sourceCurrency} = {rateObj.rate} {targetCurrency}
                    </div>
                  )}
                  {!rateObj && sourceCurrency === targetCurrency && (
                    <div className="text-xs text-os-text-secondary font-mono mt-2 flex items-center gap-2">
                      Rate: 1 {sourceCurrency} = 1 {targetCurrency}
                    </div>
                  )}
                </div>
                {(rateObj || sourceCurrency === targetCurrency) && (
                  <div className="text-right">
                    <div className="text-[10px] uppercase tracking-widest text-os-text-muted">
                      {sourceCurrency === targetCurrency ? 'Source' : 'Latest Reference Rate'}
                    </div>
                    <div className="text-xs text-os-text-secondary mt-1">
                      {sourceCurrency === targetCurrency ? 'Direct' : \`As of \${rateObj?.date}\`}
                    </div>
                    {rateObj && Date.now() - rateObj.lastUpdated > 24 * 60 * 60 * 1000 && (
                      <div className="flex items-center gap-1 text-[#FF9F0A] mt-1 text-xs justify-end">
                        <AlertTriangle size={12} /> Cached rate · {new Date(rateObj.lastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>`;

code = code.replace(/\{convertedAmount !== null && \([\s\S]*?\)\}\s*<\/div>/, replacement);
fs.writeFileSync('src/components/SettingsCurrencyConverter.tsx', code);
