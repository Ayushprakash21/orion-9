import React, { useState, useEffect } from 'react';
import { FXRateService, FXRate } from '../../services/FXRateService';
import { formatCurrency } from '../../lib/formatters';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { ArrowRight, Info, AlertTriangle } from 'lucide-react';

interface CurrencyConverterProps {
  amount: number;
  sourceCurrency: string;
  targetCurrency?: string; // defaults to global setting
  showDetails?: boolean;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({ 
  amount, 
  sourceCurrency, 
  targetCurrency,
  showDetails = true 
}) => {
  const { settings } = useSupplyChain();
  const displayCurrency = targetCurrency || settings.currency || 'USD';
  
  const [convertedAmount, setConvertedAmount] = useState<number>(amount);
  const [rateObj, setRateObj] = useState<FXRate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    const fetchRate = async () => {
      try {
        setLoading(true);
        if (sourceCurrency === displayCurrency) {
          if (mounted) {
            setConvertedAmount(amount);
            setRateObj(null);
            setLoading(false);
          }
          return;
        }
        
        const { converted, rateObj: fetchedRate } = await FXRateService.convertCurrency(amount, sourceCurrency, displayCurrency);
        
        if (mounted) {
          setConvertedAmount(converted);
          setRateObj(fetchedRate);
          setLoading(false);
        }
      } catch (err) {
        if (mounted) {
          setConvertedAmount(amount);
          setRateObj(null);
          setLoading(false);
        }
      }
    };
    
    fetchRate().catch(() => {});
    return () => { mounted = false; };
  }, [amount, sourceCurrency, displayCurrency]);

  if (sourceCurrency === displayCurrency) {
    return <span>{formatCurrency(amount, sourceCurrency, settings.locale)}</span>;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2 group relative">
        <span className="text-os-text-primary">
          {loading ? (
            <span className="animate-pulse bg-os-surface-active h-4 w-16 rounded inline-block"></span>
          ) : (
            `≈ ${formatCurrency(convertedAmount, displayCurrency, settings.locale)}`
          )}
        </span>
        
        {showDetails && rateObj && (
          <div className="hidden group-hover:flex absolute bottom-full mb-2 left-0 z-50 w-64 bg-os-surface-elevated border border-os-border shadow-xl rounded-lg p-3 flex-col gap-2 text-xs">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-os-text-muted border-b border-os-border pb-1">
              <span>LIVE FX REFERENCE RATE</span>
            </div>
            
            <div className="flex items-center justify-between font-mono">
              <span className="text-os-text-secondary">{formatCurrency(1, sourceCurrency, settings.locale)}</span>
              <ArrowRight size={12} className="text-os-text-muted" />
              <span className="text-os-text-primary">{formatCurrency(rateObj.rate, displayCurrency, settings.locale)}</span>
            </div>
            
            <div className="flex flex-col gap-1 text-[10px] text-os-text-muted mt-1">
              <div className="flex justify-between">
                <span>Source:</span>
                <span className="text-os-text-secondary">{rateObj.source}</span>
              </div>
              <div className="flex justify-between">
                <span>Rate Date:</span>
                <span className="text-os-text-secondary">{rateObj.date}</span>
              </div>
              {Date.now() - rateObj.lastUpdated > 24 * 60 * 60 * 1000 && (
                <div className="flex items-center gap-1 text-[#FF9F0A] mt-1 bg-[#FF9F0A]/10 p-1 rounded">
                  <AlertTriangle size={10} />
                  <span>CACHED RATE</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {showDetails && (
        <span className="text-[10px] text-os-text-muted">
          Original: {formatCurrency(amount, sourceCurrency, settings.locale)}
        </span>
      )}
    </div>
  );
};
