import React, { useState } from 'react';
import { Database, RotateCcw, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useToast } from '../../store/ToastContext';

export const AdminDemoData = () => {
  const { dataMode, switchToDemoData, switchToRealData } = useSupplyChain();
  const { showToast } = useToast();
  const [isSwitching, setIsSwitching] = useState(false);

  const handleSwitchToDemo = async () => {
    if (confirm('This will load the enterprise supply chain demo dataset. Any custom mock data in "Real" mode will be preserved but hidden until you switch back.')) {
      setIsSwitching(true);
      try {
        await switchToDemoData();
        showToast('Demo data loaded successfully', 'success');
      } catch (err) {
        showToast('Failed to load demo data', 'error');
      } finally {
        setIsSwitching(false);
      }
    }
  };

  const handleSwitchToReal = async () => {
    if (confirm('This will switch to your custom real data (local storage). The demo data will be hidden.')) {
      setIsSwitching(true);
      try {
        await switchToRealData();
        showToast('Switched to Real data mode', 'success');
      } catch (err) {
        showToast('Failed to switch data mode', 'error');
      } finally {
        setIsSwitching(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-3xl">
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-2">Demo Data Management</h1>
        <p className="text-sm text-os-text-secondary">Toggle between Enterprise Demo dataset and local persistent data.</p>
      </div>
      
      <div className="p-6 rounded-lg border border-os-border bg-os-bg space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-2 flex items-center gap-2">
              <Database size={16} /> Current Data Mode
            </h2>
            <div className="flex items-center gap-3 mt-4">
              <span className="text-sm text-os-text-secondary">Active Mode:</span>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                dataMode === 'demo' 
                  ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                  : 'bg-green-500/10 text-green-400 border-green-500/20'
              }`}>
                {dataMode === 'demo' ? 'Enterprise Demo' : 'Local Persistent'}
              </span>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-os-border">
          <div className="flex flex-col gap-4">
            <div className="flex items-start justify-between p-4 border border-os-border rounded-lg bg-os-surface">
              <div className="space-y-1">
                <h3 className="font-medium text-os-text-primary">Load Enterprise Demo Data</h3>
                <p className="text-xs text-os-text-secondary max-w-md">
                  Populates the application with a realistic supply chain dataset including global suppliers, inventory across multiple warehouses, purchase orders, shipments, and simulated AI exceptions.
                </p>
              </div>
              <button 
                onClick={handleSwitchToDemo}
                disabled={dataMode === 'demo' || isSwitching}
                className="flex items-center gap-2 px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-primary rounded text-sm font-medium hover:bg-os-surface-active transition-colors disabled:opacity-50"
              >
                {isSwitching && dataMode !== 'demo' ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                {dataMode === 'demo' ? 'Active' : 'Load Demo'}
              </button>
            </div>

            <div className="flex items-start justify-between p-4 border border-os-border rounded-lg bg-os-surface">
              <div className="space-y-1">
                <h3 className="font-medium text-os-text-primary">Use Local Persistent Data (Empty Base)</h3>
                <p className="text-xs text-os-text-secondary max-w-md">
                  Switches to a clean slate stored in your browser's local storage. Use this if you want to test data entry manually without the demo dataset getting in the way.
                </p>
              </div>
              <button 
                onClick={handleSwitchToReal}
                disabled={dataMode === 'real' || isSwitching}
                className="flex items-center gap-2 px-4 py-2 bg-os-surface-elevated border border-os-border text-os-text-primary rounded text-sm font-medium hover:bg-os-surface-active transition-colors disabled:opacity-50"
              >
                {isSwitching && dataMode === 'demo' ? <Loader2 size={16} className="animate-spin" /> : <Database size={16} />}
                {dataMode === 'real' ? 'Active' : 'Switch to Local'}
              </button>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-os-border">
          <div className="flex items-center gap-3 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
            <AlertTriangle size={20} className="shrink-0" />
            <p className="text-xs">
              <strong>Note:</strong> Since this is a frontend-only demo, data modifications in Demo mode will not be persisted across full browser reloads, while modifications in Local mode will be saved to your browser's IndexedDB/localStorage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
