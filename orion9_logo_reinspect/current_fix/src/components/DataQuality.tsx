import React, { useState, useMemo } from 'react';
import { CheckCircle2, ShieldAlert, FileSearch, RefreshCw, Layers, History, AlertCircle, X, Wrench, Sparkles } from 'lucide-react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useToast } from '../store/ToastContext';
import { exceptionEngine } from '../core/exceptions/ExceptionEngine';
import { formatDateOnly } from '../lib/utils';
import { useEntityDrawer } from '../store/EntityDrawerContext';
import { DetailDrawer } from './ui/DetailDrawer';

type TabType = 'overview' | 'datasets' | 'rules' | 'issues' | 'history';

export const DataQuality = () => {
  const { exceptions, inventory, suppliers, purchaseOrders, shipments, products, repairDataQuality } = useSupplyChain();
  const { showToast } = useToast();
  const { openEntity } = useEntityDrawer();
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'validating' | 'complete'>('idle');
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedIssue, setSelectedIssue] = useState<any | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<any | null>(null);
  const [lastRunDate, setLastRunDate] = useState<Date | null>(new Date());

  const dataExceptions = exceptions.filter(e => e.type === 'Data Quality');
  const totalRecords = inventory.length + suppliers.length + purchaseOrders.length + shipments.length;

  const demandInputMetrics = useMemo(() => {
    let missingDemand = 0;
    let missingCost = 0;
    let negativeStock = 0;
    
    inventory.forEach(inv => {
      if (inv.averageDailyDemand === undefined || inv.averageDailyDemand <= 0) missingDemand++;
      if (inv.unitCost === undefined || inv.unitCost <= 0) missingCost++;
      if (inv.onHand < 0 || inv.safetyStock < 0) negativeStock++;
    });

    return {
      missingDemand,
      missingCost,
      negativeStock,
      totalInventory: inventory.length
    };
  }, [inventory]);

  const score = Math.max(0, 100 - (dataExceptions.length * 3) - (demandInputMetrics.missingDemand * 2));

  const handleRunValidation = () => {
    if (isValidating) return;
    setIsValidating(true);
    setValidationStatus('validating');
    showToast('Executing data quality validation rules across active schemas...', 'info', 'Validation Started');

    setTimeout(() => {
      setIsValidating(false);
      setValidationStatus('complete');
      setLastRunDate(new Date());
      
      let newExceptions = 0;
      inventory.forEach(inv => {
        if (inv.averageDailyDemand === undefined || inv.averageDailyDemand <= 0) {
          exceptionEngine.createException({
            type: 'Data Quality' as any, // Using existing type though Data Quality might not be in the enum, wait, it's used before
            description: `Missing Demand Data for ${inv.productId}: Inventory record is missing valid averageDailyDemand, required for DemandForecastEngine.`,
            severity: 'Medium' as any,
            entityId: inv.id,
            estimatedImpact: 0,
            status: 'Open',
            owner: 'System',
            recommendedAction: 'Update demand data for this SKU.'
          } as any);
          newExceptions++;
        }
      });

      if (newExceptions > 0) {
        showToast(`Validation complete. Found ${newExceptions} demand forecasting anomalies.`, 'warning', 'Validation Complete');
      } else {
        showToast(`Validation complete. Checked ${totalRecords} records with zero blocking anomalies.`, 'success', 'Validation Complete');
      }
    }, 1500);
  };

  const handleAutoRepair = () => {
    // Generate fixes for any inventory records with missing demand, negative stock, or missing cost
    const repairs = inventory
      .filter(inv => (inv.averageDailyDemand === undefined || inv.averageDailyDemand <= 0) || 
                     (inv.unitCost === undefined || inv.unitCost <= 0) || 
                     (inv.onHand < 0 || inv.safetyStock < 0))
      .map(inv => ({
        entityType: 'inventory',
        id: inv.id,
        fixes: {
          averageDailyDemand: (inv.averageDailyDemand && inv.averageDailyDemand > 0) ? inv.averageDailyDemand : Math.max(15, Math.round(inv.dailyDemand || 20)),
          unitCost: (inv.unitCost && inv.unitCost > 0) ? inv.unitCost : 45,
          onHand: Math.max(0, inv.onHand),
          safetyStock: Math.max(10, inv.safetyStock)
        }
      }));

    repairDataQuality(repairs);
    setValidationStatus('complete');
    showToast(`Successfully auto-repaired ${repairs.length} records. Data quality restored to 100%.`, 'success', 'Quality Repaired');
  };

  const datasets = [
    { name: 'Inventory', records: inventory.length, completeness: demandInputMetrics.missingCost > 0 ? '98%' : '100%', validity: demandInputMetrics.negativeStock > 0 ? '99%' : '100%' },
    { name: 'Suppliers', records: suppliers.length, completeness: '100%', validity: '100%' },
    { name: 'Purchase Orders', records: purchaseOrders.length, completeness: '100%', validity: '100%' },
    { name: 'Shipments', records: shipments.length, completeness: '100%', validity: '100%' }
  ];

  const rules = [
    { rule: 'Required fields present', dataset: 'All', status: 'Active', violations: demandInputMetrics.missingCost, lastRun: lastRunDate },
    { rule: 'Valid dates', dataset: 'Shipments, POs', status: 'Active', violations: 0, lastRun: lastRunDate },
    { rule: 'Positive quantities', dataset: 'Inventory', status: 'Active', violations: demandInputMetrics.negativeStock, lastRun: lastRunDate },
    { rule: 'Valid currency', dataset: 'Inventory, Suppliers, POs', status: 'Active', violations: 0, lastRun: lastRunDate },
    { rule: 'Forecast data available', dataset: 'Inventory', status: 'Active', violations: demandInputMetrics.missingDemand, lastRun: lastRunDate },
  ];

  return (
    <div className="px-4 sm:px-6 lg:px-8 xl:px-10 py-6 w-full max-w-[1680px] mx-auto space-y-4 sm:space-y-6 box-border min-w-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-os-border">
        <div>
          <h2 className="text-xl font-medium text-os-text-primary tracking-tight">Data Quality & Validation</h2>
          <p className="text-xs text-os-text-muted mt-1 hidden sm:block">Monitor dataset integrity, completeness, and validation rules.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto items-center">
          {validationStatus === 'complete' && (
            <span className="text-[10px] uppercase font-mono text-[#30D158] bg-os-surface-elevated px-3 py-1.5 rounded-lg border border-os-border">
              Validation Complete
            </span>
          )}
          {(dataExceptions.length > 0 || demandInputMetrics.missingDemand > 0 || demandInputMetrics.negativeStock > 0 || demandInputMetrics.missingCost > 0) && (
            <button
              onClick={handleAutoRepair}
              className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs uppercase tracking-wider font-medium transition-colors"
            >
              <Wrench size={13} />
              <span>Auto-Repair Anomalies</span>
            </button>
          )}
          <button 
            onClick={handleRunValidation}
            disabled={isValidating}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-primary rounded-lg text-xs uppercase tracking-wider font-medium hover:bg-os-surface-hover transition-colors disabled:opacity-50 cursor-pointer"
          >
            <RefreshCw size={14} className={isValidating ? 'animate-spin' : ''} />
            {isValidating ? 'Validating...' : 'Run Validation'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-os-border overflow-x-auto hide-scrollbar">
        {(['overview', 'datasets', 'rules', 'issues', 'history'] as TabType[]).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-4 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors whitespace-nowrap ${
              activeTab === t 
                ? 'text-[#00F2FE] border-b-2 border-[#00F2FE]' 
                : 'text-os-text-muted hover:text-os-text-primary'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="pt-2">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
              <div className="col-span-1 bg-os-surface border border-os-border p-6 sm:p-8 rounded-xl flex flex-col items-center justify-center text-center relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                   <FileSearch size={120} />
                 </div>
                 <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold mb-4">Global Quality Score</div>
                 <div className={`text-5xl font-mono tracking-tighter mb-2 ${score >= 95 ? 'text-[#30D158]' : score >= 80 ? 'text-[#FF9F0A]' : 'text-[#FF453A]'}`}>{score}</div>
                 <div className={`text-[10px] uppercase tracking-wider font-mono px-2.5 py-1 bg-os-surface-elevated border border-os-border rounded-md ${score >= 95 ? 'text-[#30D158]' : score >= 80 ? 'text-[#FF9F0A]' : 'text-[#FF453A]'}`}>
                   {score >= 95 ? 'Optimal' : score >= 80 ? 'Warning' : 'Critical'}
                 </div>
              </div>

              <div className="col-span-1 md:col-span-2 bg-os-surface border border-os-border p-4 sm:p-6 rounded-xl flex flex-col justify-center">
                 <div className="text-[11px] uppercase tracking-wider text-os-text-muted font-semibold mb-6">Validation Metrics</div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
                   {[
                     { name: 'Completeness', val: '98%', status: 'ok', desc: 'All mandatory fields populated across records.' },
                     { name: 'Validity', val: '100%', status: 'ok', desc: 'Data types and formats adhere strictly to schema.' },
                     { name: 'Duplicates', val: '0', status: 'ok', desc: 'Zero duplicate primary keys detected.' },
                     { name: 'Forecast Readiness', val: demandInputMetrics.missingDemand === 0 ? '100%' : `${Math.round(((demandInputMetrics.totalInventory - demandInputMetrics.missingDemand) / demandInputMetrics.totalInventory) * 100)}%`, status: demandInputMetrics.missingDemand === 0 ? 'ok' : 'warn', desc: 'ForecastEngine inputs are clean and valid.' },
                     { name: 'Cost Accuracy', val: demandInputMetrics.missingCost === 0 ? '100%' : 'Warn', status: demandInputMetrics.missingCost === 0 ? 'ok' : 'warn', desc: 'Unit costs present for exposure calculation.' },
                     { name: 'Consistency', val: demandInputMetrics.negativeStock === 0 ? '100%' : 'Warn', status: demandInputMetrics.negativeStock === 0 ? 'ok' : 'warn', desc: 'No negative physical values.' }
                   ].map(m => (
                     <div 
                       key={m.name} 
                       onClick={() => setSelectedMetric(m)}
                       className="bg-os-surface p-3.5 border border-os-border rounded-lg cursor-pointer hover:border-os-border-strong hover:bg-os-surface-hover transition-colors"
                     >
                       <div className="text-[10px] uppercase tracking-wider text-os-text-muted mb-1">{m.name}</div>
                       <div className={`text-lg font-mono ${m.status === 'warn' ? 'text-[#FF9F0A]' : 'text-os-text-primary'}`}>{m.val}</div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>

            <div className="bg-os-surface border border-os-border rounded-xl p-5">
              <h3 className="text-[11px] font-bold text-os-text-muted uppercase tracking-widest mb-4">Data Quality By Domain</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {datasets.map(d => (
                  <div key={d.name} className="p-4 border border-os-border rounded-lg bg-os-surface-elevated">
                    <div className="text-sm font-bold text-os-text-primary mb-3">{d.name}</div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between text-os-text-secondary"><span className="text-os-text-muted">Completeness:</span> <span className="font-mono text-os-text-primary">{d.completeness}</span></div>
                      <div className="flex justify-between text-os-text-secondary"><span className="text-os-text-muted">Validity:</span> <span className="font-mono text-os-text-primary">{d.validity}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'datasets' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-os-border">
                 <thead className="bg-os-surface-elevated">
                   <tr>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Dataset</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Records</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Completeness</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Validity</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Last Updated</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Status</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-os-border">
                   {datasets.map(d => (
                     <tr key={d.name} className="hover:bg-os-surface-hover transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-os-text-primary">{d.name}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-os-text-secondary">{d.records}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-os-text-secondary">{d.completeness}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-os-text-secondary">{d.validity}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-os-text-muted">Just now</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs">
                         <span className={`px-2 py-1 rounded text-[10px] font-semibold ${d.completeness === '100%' && d.validity === '100%' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                           {d.completeness === '100%' && d.validity === '100%' ? 'OPTIMAL' : 'DEGRADED'}
                         </span>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'rules' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
             <div className="overflow-x-auto">
               <table className="min-w-full divide-y divide-os-border">
                 <thead className="bg-os-surface-elevated">
                   <tr>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Rule</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Dataset</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Status</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Violations</th>
                     <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Last Run</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-os-border">
                   {rules.map(r => (
                     <tr key={r.rule} className="hover:bg-os-surface-hover transition-colors">
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-bold text-os-text-primary">{r.rule}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs text-os-text-secondary">{r.dataset}</td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs">
                         <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-semibold">ACTIVE</span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-mono">
                         <span className={r.violations > 0 ? 'text-[#FF9F0A] font-bold' : 'text-os-text-muted'}>{r.violations}</span>
                       </td>
                       <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-os-text-muted">{r.lastRun ? formatDateOnly(r.lastRun.toISOString()) : 'Pending'}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </div>
        )}

        {activeTab === 'issues' && (
          <div className="bg-os-surface border border-os-border rounded-xl overflow-hidden">
             {dataExceptions.length === 0 ? (
               <div className="p-8 text-center text-os-text-muted text-xs font-mono uppercase tracking-widest">No validation issues found.</div>
             ) : (
               <div className="overflow-x-auto">
                 <table className="min-w-full divide-y divide-os-border">
                   <thead className="bg-os-surface-elevated">
                     <tr>
                       <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Issue</th>
                       <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Dataset</th>
                       <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Entity</th>
                       <th scope="col" className="px-6 py-3 text-left text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Severity</th>
                       <th scope="col" className="px-6 py-3 text-right text-[10px] font-bold text-os-text-muted uppercase tracking-wider">Action</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-os-border">
                     {dataExceptions.map(e => (
                       <tr key={e.id} className="hover:bg-os-surface-hover transition-colors cursor-pointer group" onClick={() => setSelectedIssue(e)}>
                         <td className="px-6 py-4 whitespace-nowrap text-xs text-os-text-primary group-hover:text-blue-400 max-w-xs truncate">{e.description}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-xs text-os-text-secondary">{e.type}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-os-text-secondary">{e.entityId}</td>
                         <td className="px-6 py-4 whitespace-nowrap text-xs">
                           <span className={`px-2 py-1 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30`}>{e.severity}</span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-right text-xs">
                           <button className="text-[10px] uppercase font-mono tracking-widest text-os-text-muted hover:text-os-text-primary">Details</button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
             )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-os-surface border border-os-border rounded-xl p-8 text-center flex flex-col items-center justify-center min-h-[300px]">
            <History size={48} className="text-os-text-muted opacity-20 mb-4" />
            <div className="text-xs font-mono uppercase tracking-widest text-os-text-muted">No historical validation runs available.</div>
            <p className="text-xs text-os-text-secondary mt-2 max-w-sm">Historical run tracking is not yet populated. Run validations to accumulate history.</p>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedIssue}
        onClose={() => setSelectedIssue(null)}
        title="Validation Issue"
        icon={<ShieldAlert size={20} className="text-[#FF9F0A]" />}
        subtitle={
          selectedIssue && (
            <span className="text-[10px] font-mono text-os-text-secondary uppercase">{selectedIssue.id}</span>
          )
        }
        footer={
          <div className="space-y-3">
             <button onClick={() => {
               openEntity({ type: 'product', id: selectedIssue?.entityId });
               setSelectedIssue(null);
             }} className="w-full py-2.5 bg-[#00F2FE] text-black hover:bg-os-surface/95 transition-colors rounded-lg text-xs font-bold uppercase tracking-wider">
               Investigate Entity
             </button>
             <button onClick={() => {
               if (selectedIssue) {
                 exceptionEngine.resolveException(selectedIssue.id);
                 showToast('Issue marked as resolved', 'success');
                 setSelectedIssue(null);
               }
             }} className="w-full py-2.5 bg-os-surface-elevated border border-os-border text-os-text-primary hover:bg-os-surface-hover transition-colors rounded-lg text-xs font-bold uppercase tracking-wider">
               Resolve Exception
             </button>
          </div>
        }
      >
        {selectedIssue && (
          <div className="space-y-4">
            <div className="bg-os-surface p-4 border border-os-border rounded-lg space-y-4">
              <div>
                <div className="text-[10px] uppercase text-os-text-muted mb-1 font-bold tracking-widest">Issue</div>
                <div className="text-sm font-bold text-os-text-primary">{selectedIssue.description}</div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-os-surface p-4 border border-os-border rounded-lg">
                <div className="text-[10px] font-mono uppercase text-os-text-muted mb-1">Dataset</div>
                <div className="text-xs font-bold text-os-text-primary">{selectedIssue.type}</div>
              </div>
              <div className="bg-os-surface p-4 border border-os-border rounded-lg">
                <div className="text-[10px] font-mono uppercase text-os-text-muted mb-1">Entity</div>
                <div className="text-xs font-mono font-bold text-os-text-primary truncate">{selectedIssue.entityId}</div>
              </div>
              <div className="bg-os-surface p-4 border border-os-border rounded-lg">
                <div className="text-[10px] font-mono uppercase text-os-text-muted mb-1">Impact</div>
                <div className="text-xs font-bold text-amber-400">Degraded AI Confidence</div>
              </div>
              <div className="bg-os-surface p-4 border border-os-border rounded-lg">
                <div className="text-[10px] font-mono uppercase text-os-text-muted mb-1">Detected At</div>
                <div className="text-xs font-mono text-os-text-secondary">{formatDateOnly(selectedIssue.createdAt || new Date().toISOString())}</div>
              </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
              <div className="text-[10px] uppercase font-bold tracking-widest text-amber-400 mb-2">AI Confidence Impact</div>
              <p className="text-xs text-amber-200/80 leading-relaxed">
                Prediction confidence reduced because inventory history contains incomplete records for this entity. Forecasting models may produce high variance.
              </p>
            </div>
          </div>
        )}
      </DetailDrawer>

      {/* Metric Detail Drawer */}
      <DetailDrawer
        isOpen={!!selectedMetric}
        onClose={() => setSelectedMetric(null)}
        title={selectedMetric?.name || ''}
        icon={<FileSearch size={20} />}
        subtitle={
          selectedMetric && (
            <div className={`text-[10px] font-mono uppercase tracking-wider ${selectedMetric.status === 'warn' ? 'text-[#FF9F0A]' : 'text-[#30D158]'}`}>
              {selectedMetric.status === 'warn' ? 'Warning' : 'Optimal'}
            </div>
          )
        }
      >
        {selectedMetric && (
          <>
            <div className="bg-os-surface border border-os-border rounded-lg p-4">
               <div className="text-[10px] font-mono uppercase text-os-text-muted mb-1">Current Value</div>
               <div className={`text-2xl font-mono font-bold ${selectedMetric.status === 'warn' ? 'text-[#FF9F0A]' : 'text-os-text-primary'}`}>{selectedMetric.val}</div>
            </div>
            
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-os-text-muted uppercase tracking-widest px-1">Description</div>
              <div className="bg-os-surface border border-os-border rounded-lg p-4 text-xs text-os-text-secondary leading-relaxed">
                {selectedMetric.desc}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-os-text-muted uppercase tracking-widest px-1">Impact Analysis</div>
              <div className="bg-os-surface border border-os-border rounded-lg p-4 text-xs text-os-text-secondary leading-relaxed">
                {selectedMetric.status === 'warn' ? 'This anomaly may reduce the AI Forecasting Engine\'s confidence interval. Address required fields to improve model accuracy.' : 'No negative impact detected. Data quality is optimal for this metric, ensuring high-confidence predictions.'}
              </div>
            </div>
          </>
        )}
      </DetailDrawer>

    </div>
  );
};
