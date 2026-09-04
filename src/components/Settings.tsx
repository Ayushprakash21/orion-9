import React, { useState } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { Save, Shield, Activity, Globe } from 'lucide-react';

export const Settings = () => {
  const { settings, updateSettings } = useSupplyChain();
  const [localSettings, setLocalSettings] = useState(settings);
  const [isSaved, setIsSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: e.target.type === 'number' ? Number(value) : value
    }));
  };

  const handleSave = () => {
    updateSettings(localSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="px-4 sm:px-6 md:px-8 py-6 w-full space-y-6 animate-in fade-in duration-500 max-w-4xl h-full flex flex-col box-border">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div>
          <h2 className="text-xl font-light tracking-wide text-[#F5F5F5] mb-1">OPERATIONAL PARAMS</h2>
          <p className="text-sm text-[#777777]">Configure operational thresholds, rules, and logic for your user account.</p>
        </div>
      </div>
      
      <div className="bg-[#151515] rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#2A2A2A] overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-[#2A2A2A] bg-black/40">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#F5F5F5] flex items-center gap-2">
            <Shield size={14} className="text-[#B3B3B3]" /> Operational Thresholds
          </h3>
          <p className="text-xs text-[#777777] mt-1">Determine when alerts and statuses are triggered. Changing these recalculates your KPIs.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Critical Stock-Out (Days of Supply)</label>
              <input name="criticalStockOutDays" value={localSettings.criticalStockOutDays} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Low Stock (Days of Supply)</label>
              <input name="lowStockDays" value={localSettings.lowStockDays} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Excess Inventory (Days of Supply)</label>
              <input name="excessInventoryDays" value={localSettings.excessInventoryDays} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Supplier Low Risk (OTIF %)</label>
              <input name="supplierLowRiskThreshold" value={localSettings.supplierLowRiskThreshold} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Supplier High Risk (OTIF %)</label>
              <input name="supplierHighRiskThreshold" value={localSettings.supplierHighRiskThreshold} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Shipment Delay Alert (Days)</label>
              <input name="shipmentDelayAlertDays" value={localSettings.shipmentDelayAlertDays} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#151515] rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#2A2A2A] overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-[#2A2A2A] bg-black/40">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#F5F5F5] flex items-center gap-2">
            <Activity size={14} className="text-[#B3B3B3]" /> Health Scoring Weights
          </h3>
          <p className="text-xs text-[#777777] mt-1">Determine how much each component contributes to overall system health.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Inventory Weight (%)</label>
              <input name="healthWeightInventory" value={localSettings.healthWeightInventory} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Supplier Weight (%)</label>
              <input name="healthWeightSuppliers" value={localSettings.healthWeightSuppliers} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Shipment Weight (%)</label>
              <input name="healthWeightShipments" value={localSettings.healthWeightShipments} onChange={handleChange} type="number" className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-[#151515] rounded-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-[#2A2A2A] overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-[#2A2A2A] bg-black/40">
          <h3 className="text-[10px] uppercase tracking-widest font-bold text-[#F5F5F5] flex items-center gap-2">
            <Globe size={14} className="text-[#B3B3B3]" /> Localization
          </h3>
          <p className="text-xs text-[#777777] mt-1">Configure currency and regional formats.</p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] mb-2">Currency</label>
              <select name="currency" value={localSettings.currency} onChange={handleChange} className="w-full rounded-sm border border-[#2A2A2A] bg-black/20 px-3 py-2 text-sm font-mono text-[#F5F5F5] focus:outline-none focus:border-[#777777] shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                <option value="INR">INR (₹)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end gap-3 items-center">
        {isSaved && <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest">Saved!</span>}
        <button onClick={() => setLocalSettings(settings)} className="px-4 py-2 text-[10px] uppercase tracking-widest font-medium text-[#B3B3B3] bg-black/40 border border-[#2A2A2A] rounded-sm shadow-sm hover:bg-[#151515] transition-colors">
          Reset
        </button>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 text-[10px] uppercase tracking-widest font-medium text-[#F5F5F5] bg-[#1B1B1B] border border-[#2A2A2A] rounded-sm shadow-none hover:bg-[#202020] transition-colors">
          <Save size={14} />
          Save Changes
        </button>
      </div>
    </div>
  );
};
