const fs = require('fs');
let code = fs.readFileSync('src/components/SettingsCurrencyConverter.tsx', 'utf8');

const regexImport = /import \{ ArrowRight, AlertTriangle, RefreshCw \} from 'lucide-react';/;
code = code.replace(regexImport, "import { ArrowRight, ArrowDown, AlertTriangle, RefreshCw } from 'lucide-react';");

const regexResult = /\{convertedAmount !== null && \([\s\S]*?\)\}\s*<\/div>\s*<\/div>\s*\);\s*\};/;
const newResult = `{convertedAmount !== null && (
          <div className="mt-6 p-6 bg-os-input-bg border border-os-border rounded-xl shadow-sm">
            {!rateObj && sourceCurrency !== targetCurrency ? (
              <div className="flex flex-col items-center justify-center py-6">
                <AlertTriangle size={24} className="text-[#FF9F0A] mb-3" />
                <div className="text-sm font-bold text-os-text-primary">FX rate unavailable</div>
                <div className="text-xs text-os-text-secondary mt-1">Unable to retrieve the latest reference rate. Please try again.</div>
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-os-text-muted">Conversion Result</h4>
                
                <div className="flex flex-col items-start gap-2">
                  <div className="text-2xl font-mono font-bold text-os-text-secondary flex items-center">
                    {formatCurrency(amount, sourceCurrency)} <span className="ml-2 text-sm">{sourceCurrency}</span>
                  </div>
                  <div className="text-os-text-muted px-2">
                    <ArrowDown size={16} />
                  </div>
                  <div className="text-3xl font-mono font-bold text-[#00F2FE] flex items-center">
                    {formatCurrency(convertedAmount, targetCurrency)} <span className="ml-2 text-sm text-os-text-secondary">{targetCurrency}</span>
                  </div>
                </div>

                <div className="h-px bg-os-border w-full my-2"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-[10px] uppercase tracking-widest font-bold text-os-text-muted mb-1">Rate</h5>
                    <div className="text-xs font-mono text-os-text-primary">
                      1 {sourceCurrency} = {rateObj ? rateObj.rate : 1} {targetCurrency}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <h5 className="text-[10px] uppercase tracking-widest font-bold text-os-text-muted mb-1">
                      {sourceCurrency === targetCurrency ? 'Source' : 'Reference'}
                    </h5>
                    <div className="text-xs text-os-text-primary">
                      {sourceCurrency === targetCurrency ? 'Direct' : (rateObj?.source || 'Frankfurter')}
                    </div>
                    {sourceCurrency !== targetCurrency && rateObj && (
                       <div className="text-xs text-os-text-secondary mt-0.5">
                         Rate Date: {rateObj.date}
                       </div>
                    )}
                    {rateObj && Date.now() - rateObj.lastUpdated > 24 * 60 * 60 * 1000 && (
                      <div className="flex items-center sm:justify-end gap-1 text-[#FF9F0A] mt-1 text-xs">
                        <AlertTriangle size={12} /> Cached rate · {new Date(rateObj.lastUpdated).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
`;

code = code.replace(regexResult, newResult);
fs.writeFileSync('src/components/SettingsCurrencyConverter.tsx', code);
