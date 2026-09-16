import React, { useState, useEffect } from "react";
import { FXRateService, FXRate } from "../services/FXRateService";
import { formatCurrency } from "../lib/formatters";
import { SearchableDropdown } from "./ui/SearchableDropdown";
import { ArrowRight, ArrowDown, AlertTriangle, RefreshCw } from "lucide-react";

interface SettingsCurrencyConverterProps {
  defaultCurrency?: string;
  currencyOptions: { value: string; label: string }[];
}

export const SettingsCurrencyConverter: React.FC<
  SettingsCurrencyConverterProps
> = ({ currencyOptions, defaultCurrency = "INR" }) => {
  const [amount, setAmount] = useState<number>(1000);

  const [sourceCurrency, setSourceCurrency] = useState<string>(defaultCurrency);
  useEffect(() => {
    if (
      defaultCurrency &&
      sourceCurrency === "INR" &&
      defaultCurrency !== "INR"
    ) {
      setSourceCurrency(defaultCurrency);
    }
  }, [defaultCurrency]);

  const [targetCurrency, setTargetCurrency] = useState<string>("USD");

  const [convertedAmount, setConvertedAmount] = useState<number | null>(null);
  const [rateObj, setRateObj] = useState<FXRate | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const handleConvert = async () => {
    if (!amount || amount <= 0 || isNaN(amount)) {
      setConvertedAmount(null);
      return;
    }

    setLoading(true);
    try {
      const { converted, rateObj: fetchedRate } =
        await FXRateService.convertCurrency(
          amount,
          sourceCurrency,
          targetCurrency,
        );
      setConvertedAmount(converted);
      setRateObj(fetchedRate);
    } catch (err) {
      console.warn('Failed to convert currency:', err);
      setConvertedAmount(amount);
      setRateObj(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-os-surface rounded-xl border border-os-border shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-os-border">
        <h3 className="text-[10px] uppercase tracking-widest font-bold text-os-text-primary flex items-center gap-2">
          <RefreshCw size={14} className="text-os-text-secondary" /> Currency
          Converter
        </h3>
        <p className="text-xs text-os-text-muted mt-1">
          Test real-time conversion rates across available currencies.
        </p>
      </div>

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto_1fr] gap-4 sm:gap-6 items-start">
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              min="0.01"
              onChange={(e) => setAmount(Number(e.target.value))}
              className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors"
            />
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">
              From
            </label>
            <SearchableDropdown
              value={sourceCurrency}
              options={currencyOptions}
              onChange={setSourceCurrency}
            />
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
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m8 3 4 4-4 4" />
                <path d="M12 7H4" />
                <path d="m16 21-4-4 4-4" />
                <path d="M12 17h8" />
              </svg>
            </button>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">
              To
            </label>
            <SearchableDropdown
              value={targetCurrency}
              options={currencyOptions}
              onChange={setTargetCurrency}
            />
          </div>
        </div>

        <div className="flex justify-start">
          <button
            onClick={handleConvert}
            disabled={loading}
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-black bg-[#00F2FE] hover:bg-os-surface/95 transition-colors rounded-sm disabled:opacity-50"
          >
            {loading ? "Converting..." : "Convert"}
          </button>
        </div>

        {!amount || amount <= 0 || isNaN(amount) ? (
          <div className="mt-4 text-xs text-[#FF9F0A] flex items-center gap-1">
            <AlertTriangle size={12} /> Please enter a valid amount.
          </div>
        ) : null}

        {convertedAmount !== null && amount > 0 && !isNaN(amount) && (
          <div className="mt-6 p-6 bg-os-input-bg border border-os-border rounded-xl shadow-sm">
            {!rateObj && sourceCurrency !== targetCurrency ? (
              <div className="flex flex-col items-center justify-center py-6">
                <AlertTriangle size={24} className="text-[#FF9F0A] mb-3" />
                <div className="text-sm font-bold text-os-text-primary">
                  FX rate unavailable
                </div>
                <div className="text-xs text-os-text-secondary mt-1">
                  Unable to retrieve the latest reference rate. Please try
                  again.
                </div>
              </div>
            ) : (
              <div className="flex flex-col space-y-6">
                <h4 className="text-[10px] uppercase tracking-widest font-bold text-os-text-muted">
                  Conversion Result
                </h4>

                <div className="flex flex-col items-start gap-2">
                  <div className="text-2xl font-mono font-bold text-os-text-secondary flex items-center">
                    {formatCurrency(amount, sourceCurrency)}{" "}
                    <span className="ml-2 text-sm">{sourceCurrency}</span>
                  </div>
                  <div className="text-os-text-muted px-2">
                    <ArrowDown size={16} />
                  </div>
                  <div className="text-3xl font-mono font-bold text-[#00F2FE] flex items-center">
                    {formatCurrency(convertedAmount, targetCurrency)}{" "}
                    <span className="ml-2 text-sm text-os-text-secondary">
                      {targetCurrency}
                    </span>
                  </div>
                </div>

                <div className="h-px bg-os-border w-full my-2"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h5 className="text-[10px] uppercase tracking-widest font-bold text-os-text-muted mb-1">
                      Rate
                    </h5>
                    <div className="text-xs font-mono text-os-text-primary">
                      1 {sourceCurrency} = {rateObj ? rateObj.rate : 1}{" "}
                      {targetCurrency}
                    </div>
                  </div>
                  <div className="sm:text-right">
                    <h5 className="text-[10px] uppercase tracking-widest font-bold text-os-text-muted mb-1">
                      {sourceCurrency === targetCurrency
                        ? "Source"
                        : "Reference"}
                    </h5>
                    <div className="text-xs text-os-text-primary">
                      {sourceCurrency === targetCurrency
                        ? "Direct"
                        : rateObj?.source || "Frankfurter"}
                    </div>
                    {sourceCurrency !== targetCurrency && rateObj && (
                      <div className="text-xs text-os-text-secondary mt-0.5">
                        Rate Date: {rateObj.date}
                      </div>
                    )}
                    {rateObj &&
                      Date.now() - rateObj.lastUpdated >
                        24 * 60 * 60 * 1000 && (
                        <div className="flex items-center sm:justify-end gap-1 text-[#FF9F0A] mt-1 text-xs">
                          <AlertTriangle size={12} /> Cached rate ·{" "}
                          {new Date(rateObj.lastUpdated).toLocaleDateString()}
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
