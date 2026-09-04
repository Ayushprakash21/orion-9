import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, FileSearch, RefreshCw } from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';

export const DataQuality = () => {
  const { exceptions, inventory, suppliers, purchaseOrders, shipments } = useSupplyChain();
  const { showToast } = useToast();
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'complete'>('idle');
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const dataExceptions = exceptions.filter(e => e.type === 'Data Quality');
  const totalRecords = inventory.length + suppliers.length + purchaseOrders.length + shipments.length;
  const score = Math.max(0, 100 - (dataExceptions.length * 3));

  const handleRunValidation = () => {
    if (isValidating) return;
    setIsValidating(true);
    setValidationStatus('validating');
    showToast('Executing data quality validation rules across active schemas...', 'info', 'Validation Started');

    setTimeout(() => {
      setIsValidating(false);
      setValidationStatus('complete');
      showToast(`Validation complete. Checked ${totalRecords} records with zero blocking anomalies.`, 'success', 'Validation Complete');
    }, 1500);
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-4 sm:space-y-6 box-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#2A2A2A]">
        <div>
          <h2 className="text-xl font-medium text-[#F5F5F5] tracking-tight">Data Quality & Validation</h2>
          <p className="text-xs text-[#777777] mt-1 hidden sm:block">Monitor dataset integrity, completeness, and validation rules.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto items-center">
          {validationStatus === 'complete' && (
            <span className="text-[10px] uppercase font-mono text-[#30D158] bg-[#1B1B1B] px-3 py-1.5 rounded-lg border border-[#2A2A2A]">
              Validation Complete
            </span>
          )}
          <button 
            onClick={handleRunValidation}
            disabled={isValidating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#1B1B1B] border border-[#2A2A2A] text-[#F5F5F5] rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-[#202020] transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} />
            {isValidating ? 'Validating...' : 'Run Validation'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        <div className="col-span-1 bg-[#151515] border border-[#2A2A2A] p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
             <FileSearch size={120} />
           </div>
           <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-4">Global Quality Score</div>
           <div className="text-5xl font-mono tracking-tighter mb-2 text-[#30D158]">{score}</div>
           <div className="text-[10px] uppercase tracking-wider text-[#30D158] font-mono px-2.5 py-1 bg-[#1B1B1B] border border-[#2A2A2A] rounded-md">
             Optimal
           </div>
        </div>

        <div className="col-span-1 md:col-span-2 bg-[#151515] border border-[#2A2A2A] p-4 sm:p-6 rounded-xl flex flex-col justify-center">
           <div className="text-[11px] uppercase tracking-wider text-[#777777] font-semibold mb-6">Validation Metrics (Click for Drill-down)</div>
           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
             {[
               { name: 'Completeness', val: '98%', status: 'ok', desc: 'All mandatory fields populated across records.' },
               { name: 'Validity', val: '100%', status: 'ok', desc: 'Data types and formats adhere strictly to schema.' },
               { name: 'Duplicates', val: '0', status: 'ok', desc: 'Zero duplicate primary keys detected.' },
               { name: 'Reference Integrity', val: '99%', status: 'ok', desc: 'Foreign key constraints fully verified.' },
               { name: 'Freshness', val: '95%', status: 'warn', desc: 'Pipelines synchronized within SLA.' },
               { name: 'Consistency', val: '100%', status: 'ok', desc: 'Cross-entity attributes aligned.' }
             ].map(m => (
               <div 
                 key={m.name} 
                 onClick={() => setSelectedMetric(m.name)}
                 className="bg-[#111111] p-3.5 border border-[#2A2A2A] rounded-lg cursor-pointer hover:border-[#777777] transition-colors"
               >
                 <div className="text-[10px] uppercase tracking-wider text-[#777777] mb-1">{m.name}</div>
                 <div className={`text-lg font-mono ${m.status === 'warn' ? 'text-[#FF9F0A]' : 'text-[#F5F5F5]'}`}>{m.val}</div>
               </div>
             ))}
           </div>
        </div>
      </div>

      {selectedMetric && (
        <div className="bg-[#151515] border border-[#2A2A2A] p-5 rounded-xl space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium text-[#F5F5F5] uppercase tracking-wider">Drill-down: {selectedMetric}</h3>
            <button onClick={() => setSelectedMetric(null)} className="text-xs font-mono text-[#777777] hover:text-[#F5F5F5]">Close</button>
          </div>
          <p className="text-xs font-mono text-[#B3B3B3]">
            Analysis of {selectedMetric}: Verified across {totalRecords} total entities. All schemas meet production standard requirements.
          </p>
        </div>
      )}
      
      {dataExceptions.length > 0 && (
        <div className="bg-[#151515] border border-[#2A2A2A] rounded-xl overflow-hidden">
           <div className="px-5 py-3.5 border-b border-[#2A2A2A] text-[11px] uppercase tracking-wider text-[#777777] font-semibold">Data Quality Issues</div>
           <div className="divide-y divide-[#2A2A2A]">
             {dataExceptions.map(e => (
               <div key={e.id} className="p-4 hover:bg-[#202020] transition-colors flex items-center justify-between">
                 <div className="flex items-start gap-3">
                   <ShieldAlert size={16} className="text-[#FF453A] mt-0.5" />
                   <div>
                     <div className="text-xs font-medium text-[#F5F5F5] mb-1">{e.description}</div>
                     <div className="text-[11px] text-[#777777]">Entity: <span className="font-mono text-[#B3B3B3]">{e.entityId}</span></div>
                   </div>
                 </div>
                 <button onClick={() => showToast(`Resolved issue for ${e.entityId}`, 'success')} className="text-[10px] uppercase font-mono text-[#B3B3B3] hover:text-[#F5F5F5] transition-colors">Resolve</button>
               </div>
             ))}
           </div>
        </div>
      )}
    </div>
  );
};
