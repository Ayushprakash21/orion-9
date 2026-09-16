import React, { useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useAuth } from '../store/AuthContext';
import { Save, Shield, Globe, CheckCircle2, RotateCcw, Settings as SettingsIcon, Sliders, Eye } from 'lucide-react';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { FXRateService } from '../services/FXRateService';
import { timezones, locales } from '../lib/timezones';
import { SystemSettings, normalizeSettings, DEFAULT_SYSTEM_SETTINGS } from '../types';
import { SettingsCurrencyConverter } from "./SettingsCurrencyConverter";
import { cn } from '../lib/utils';

type SettingsCategory = 'operational' | 'system' | 'appearance' | 'localization' | 'sound' | 'privacy';

export const Settings = () => {
  const { user, profile, hasRole } = useAuth();
  const isAdmin = hasRole(['platform_admin']) || profile?.role === 'platform_admin' || user?.id === 'admin' || user?.id === 'local-admin';
  const { settings, updateSettings} = useSupplyChain();
  
  const [localSettings, setLocalSettings] = useState<SystemSettings>(() => normalizeSettings(settings));
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<{value: string, label: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('operational');

  useEffect(() => {
    let mounted = true;
    FXRateService.getSupportedCurrencies()
      .then(res => {
        if (mounted && Array.isArray(res)) {
          setCurrencyOptions(res.map(c => ({ value: c.code, label: `${c.flag || ''} ${c.code} — ${c.name}`, subLabel: c.symbol, searchStr: `${c.code} ${c.name} ${c.symbol}` })));
        }
      })
      .catch(err => console.warn('Failed to load supported currencies:', err));
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    setLocalSettings(normalizeSettings(settings));
  }, [settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type} = e.target;
    setLocalSettings(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const normalized = normalizeSettings(localSettings);
      await updateSettings(normalized);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2500);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalSettings({ ...DEFAULT_SYSTEM_SETTINGS });
  };

  const renderCategoryContent = () => {
    switch (activeCategory) {
      case 'operational':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-sm font-medium text-os-text-primary mb-1">Operational Thresholds</h3>
              <p className="text-xs text-os-text-muted mb-6">Determine when alerts and statuses are triggered.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Critical Stock-Out (Days)</label>
                  <input name="criticalStockOutDays" value={localSettings.criticalStockOutDays ?? ''} onChange={handleChange} type="number" min="1" max="90" className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Low Stock (Days)</label>
                  <input name="lowStockDays" value={localSettings.lowStockDays ?? ''} onChange={handleChange} type="number" min="1" max="180" className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Excess Inventory (Days)</label>
                  <input name="excessInventoryDays" value={localSettings.excessInventoryDays ?? ''} onChange={handleChange} type="number" min="1" max="10000" className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Shipment Delay Alert (Days)</label>
                  <input name="shipmentDelayAlertDays" value={localSettings.shipmentDelayAlertDays ?? ''} onChange={handleChange} type="number" min="0" max="720" className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Supplier High Risk Threshold</label>
                  <input name="supplierHighRiskThreshold" value={localSettings.supplierHighRiskThreshold ?? ''} onChange={handleChange} type="number" min="0" max="100" className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors" />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Healthy Shipments (%)</label>
                  <input name="healthWeightShipments" value={localSettings.healthWeightShipments ?? ''} onChange={handleChange} type="number" min="0" max="100" className="w-full rounded-lg border border-os-border-strong bg-os-input-bg px-3 py-2 text-sm font-mono text-os-text-primary focus:outline-none focus:border-os-text-muted transition-colors" />
                </div>
              </div>
            </div>
          </div>
        );
      case 'localization':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-sm font-medium text-os-text-primary mb-1">Localization</h3>
              <p className="text-xs text-os-text-muted mb-6">Configure currency, timezone, and regional settings.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Currency</label>
                  <SearchableDropdown value={localSettings.currency || 'INR'} options={currencyOptions} onChange={(val) => setLocalSettings(prev => ({...prev, currency: val}))} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Timezone</label>
                  <SearchableDropdown value={localSettings.timezone || 'Asia/Kolkata'} options={timezones} onChange={(val) => setLocalSettings(prev => ({...prev, timezone: val}))} />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-medium text-os-text-secondary mb-2">Language</label>
                  <SearchableDropdown value={localSettings.locale || 'en-IN'} options={locales} onChange={(val) => setLocalSettings(prev => ({...prev, locale: val}))} />
                </div>
              </div>

              <div className="pt-6 border-t border-os-border">
                <SettingsCurrencyConverter currencyOptions={currencyOptions} defaultCurrency={localSettings.currency} />
              </div>
            </div>
          </div>
        );
      case 'appearance':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-sm font-medium text-os-text-primary mb-1">Appearance & Display</h3>
              <p className="text-xs text-os-text-muted mb-6">Configure visual and accessibility preferences.</p>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">True Tone</div>
                    <div className="text-xs text-os-text-muted mt-1">Warms and softens the interface for a comfortable visual experience.</div>
                  </div>
                  <div className="flex bg-os-surface border border-os-border rounded-sm p-1 gap-1 mt-3 sm:mt-0 w-full sm:w-48 shrink-0">
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, trueTone: false})); updateSettings({ trueTone: false }); }} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors ${!localSettings.trueTone ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}`}>OFF</button>
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, trueTone: true})); updateSettings({ trueTone: true }); }} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors ${localSettings.trueTone ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}`}>ON</button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">Reduced Motion</div>
                    <div className="text-xs text-os-text-muted mt-1">Disables heavy animations and transitions for performance or accessibility.</div>
                  </div>
                  <div className="flex bg-os-surface border border-os-border rounded-sm p-1 gap-1 mt-3 sm:mt-0 w-full sm:w-48 shrink-0">
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, reducedMotion: false})); updateSettings({ reducedMotion: false }); }} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors ${!localSettings.reducedMotion ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}`}>OFF</button>
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, reducedMotion: true})); updateSettings({ reducedMotion: true }); }} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors ${localSettings.reducedMotion ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}`}>ON</button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div className="mb-3 sm:mb-0">
                    <div className="text-sm font-medium text-os-text-primary">Brightness Overlay</div>
                    <div className="text-xs text-os-text-muted mt-1">Adjust software brightness (does not control hardware display).</div>
                  </div>
                  <div className="w-full sm:w-64 shrink-0">
                    <input
                      type="range" min="20" max="100" value={localSettings.brightness ?? 100}
                      onChange={(e) => { const val = parseInt(e.target.value); setLocalSettings(prev => ({...prev, brightness: val})); }}
                      onMouseUp={(e) => updateSettings({ brightness: parseInt((e.target as HTMLInputElement).value) })}
                      onTouchEnd={(e) => updateSettings({ brightness: parseInt((e.target as HTMLInputElement).value) })}
                      className="w-full h-2 bg-os-surface-active rounded-lg appearance-none cursor-pointer accent-os-accent"
                    />
                    <div className="flex justify-between mt-1 text-[9px] text-os-text-muted font-mono">
                      <span>20%</span>
                      <span>{localSettings.brightness ?? 100}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
            case 'sound':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-sm font-medium text-os-text-primary mb-1">Sound Preferences</h3>
              <p className="text-xs text-os-text-muted mb-6">Manage system audio and volume.</p>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">Master UI Sound</div>
                    <div className="text-xs text-os-text-muted mt-1">Enable or disable all interface sounds.</div>
                  </div>
                  <div className="flex bg-os-surface border border-os-border rounded-sm p-1 gap-1 mt-3 sm:mt-0 w-full sm:w-48 shrink-0">
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, soundEnabled: false})); updateSettings({ soundEnabled: false }); }} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors ${!localSettings.soundEnabled ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}`}>OFF</button>
                    <button type="button" onClick={() => { setLocalSettings(prev => ({...prev, soundEnabled: true})); updateSettings({ soundEnabled: true }); }} className={`flex-1 py-1.5 text-xs font-medium uppercase tracking-widest rounded-sm transition-colors ${localSettings.soundEnabled ? 'bg-os-surface-hover text-os-text-primary shadow-sm' : 'text-os-text-muted hover:text-os-text-primary'}`}>ON</button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border">
                  <div className="mb-3 sm:mb-0">
                    <div className="text-sm font-medium text-os-text-primary">Volume</div>
                    <div className="text-xs text-os-text-muted mt-1">Adjust system volume levels.</div>
                  </div>
                  <div className="w-full sm:w-64 shrink-0">
                    <input
                      type="range" min="0" max="100" value={localSettings.soundVolume ?? 75}
                      onChange={(e) => { const val = parseInt(e.target.value); setLocalSettings(prev => ({...prev, soundVolume: val})); }}
                      onMouseUp={(e) => updateSettings({ soundVolume: parseInt((e.target as HTMLInputElement).value) })}
                      onTouchEnd={(e) => updateSettings({ soundVolume: parseInt((e.target as HTMLInputElement).value) })}
                      className="w-full h-2 bg-os-surface-active rounded-lg appearance-none cursor-pointer accent-os-accent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'privacy':
        return (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <div>
              <h3 className="text-sm font-medium text-os-text-primary mb-1">Privacy & Security</h3>
              <p className="text-xs text-os-text-muted mb-6">Manage data sharing and telemetry settings.</p>
              
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border opacity-60 pointer-events-none">
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">Diagnostic Telemetry</div>
                    <div className="text-xs text-os-text-muted mt-1">Automatically send diagnostic data to improve ORION OS. (Enforced by Admin)</div>
                  </div>
                  <div className="mt-3 sm:mt-0 text-[10px] font-mono tracking-widest text-os-text-secondary uppercase">
                    Mandatory
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center p-4 rounded-lg bg-os-input-bg border border-os-border opacity-60 pointer-events-none">
                  <div>
                    <div className="text-sm font-medium text-os-text-primary">Supply Chain Analytics</div>
                    <div className="text-xs text-os-text-muted mt-1">Anonymize supply chain intelligence data for aggregate insights.</div>
                  </div>
                  <div className="mt-3 sm:mt-0 text-[10px] font-mono tracking-widest text-os-text-secondary uppercase">
                    Enabled
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-os-bg text-os-text-primary overflow-hidden font-sans">
      <div className="w-full md:w-64 shrink-0 bg-os-surface border-r border-os-border flex flex-col">
        <div className="p-6 border-b border-os-border">
          <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-os-text-primary flex items-center gap-2">
            <SettingsIcon size={16} className="text-os-text-muted" /> System Settings
          </h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar">
          <button
            onClick={() => setActiveCategory('operational')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeCategory === 'operational' ? "bg-os-accent/10 text-os-accent border border-os-accent/20" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
            )}
          >
            <Sliders size={16} /> Operational Params
          </button>
          
          <button
            onClick={() => setActiveCategory('localization')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeCategory === 'localization' ? "bg-os-accent/10 text-os-accent border border-os-accent/20" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
            )}
          >
            <Globe size={16} /> Localization
          </button>
          
          <button
            onClick={() => setActiveCategory('appearance')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeCategory === 'appearance' ? "bg-os-accent/10 text-os-accent border border-os-accent/20" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
            )}
          >
            <Eye size={16} /> Appearance
          </button>
          
          
          <button
            onClick={() => setActiveCategory('sound')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeCategory === 'sound' ? "bg-os-accent/10 text-os-accent border border-os-accent/20" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
            )}
          >
            <Sliders size={16} /> Sound
          </button>

          <button
            onClick={() => setActiveCategory('privacy')}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
              activeCategory === 'privacy' ? "bg-os-accent/10 text-os-accent border border-os-accent/20" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
            )}
          >
            <Shield size={16} /> Privacy
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative bg-os-bg">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          <div className="max-w-4xl mx-auto">
            {renderCategoryContent()}
          </div>
        </div>
        
        <div className="p-4 md:px-10 border-t border-os-border bg-os-surface/80 backdrop-blur-md shrink-0">
          <div className="max-w-4xl mx-auto flex justify-end gap-3 items-center">
            {isSaved && (
              <span className="text-emerald-400 text-xs font-mono uppercase tracking-widest flex items-center gap-1.5 animate-in fade-in mr-2">
                <CheckCircle2 size={14} /> Saved
              </span>
            )}
            <button 
              onClick={handleReset} 
              type="button"
              className="flex items-center gap-1.5 px-4 py-2 text-[10px] uppercase tracking-widest font-medium text-os-text-secondary border border-os-border rounded-sm shadow-sm hover:bg-os-surface-hover transition-colors"
            >
              <RotateCcw size={12} />
              Reset
            </button>
            <button 
              onClick={handleSave} 
              disabled={isSaving}
              type="button"
              className="flex items-center gap-2 px-6 py-2 text-[10px] uppercase tracking-widest font-medium text-black bg-os-accent border border-os-accent rounded-sm hover:brightness-110 disabled:opacity-50 transition-all font-bold shadow-[0_0_15px_rgba(0,242,254,0.3)]"
            >
              <Save size={14} />
              {isSaving ? 'Saving...' : 'Apply Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
