import React, { useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useAuth } from '../store/AuthContext';
import { 
  Save, Shield, Globe, CheckCircle2, RotateCcw, Settings as SettingsIcon, 
  Sliders, Eye, Search, User, Building2, ShieldCheck, Activity, Database, Brush, Key, Lock, Unlock, Users, Clock
} from 'lucide-react';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { FXRateService } from '../services/FXRateService';
import { timezones, locales } from '../lib/timezones';
import { SystemSettings, normalizeSettings, DEFAULT_SYSTEM_SETTINGS } from '../types';
import { SettingsCurrencyConverter } from "./SettingsCurrencyConverter";
import { DisplayPreferencesControls } from '../os/DisplayPreferences';
import { cn } from '../lib/utils';
import { userService } from '../services/userService';

// Admin Components
import { AdminOverview } from './admin/AdminOverview';
import { AdminUsers } from './admin/AdminUsers';
import { AdminOrganizations } from './admin/AdminOrganizations';
import { AdminRoles } from './admin/AdminRoles';
import { AdminBranding } from './admin/AdminBranding';
import { AdminAuditLogs } from './admin/AdminAuditLogs';
import { AdminDemoData } from './admin/AdminDemoData';
import { AdminSettings } from './admin/AdminSettings';

type SettingsCategory = 
  // SYSTEM PREFERENCES
  | 'operational' | 'system' | 'appearance' | 'localization' | 'sound' | 'privacy' | 'profile'
  // ADMINISTRATION
  | 'admin_overview' | 'admin_users' | 'admin_orgs' | 'admin_roles' | 'admin_branding' | 'admin_audit' | 'admin_demo' | 'admin_security';

export const Settings = () => {
  const { user, profile, hasRole } = useAuth();
  const isAdmin = hasRole(['platform_admin', 'organization_admin']) || profile?.role === 'platform_admin' || profile?.role === 'organization_admin' || user?.id === 'admin' || user?.id === 'local-admin';
  const { settings, updateSettings } = useSupplyChain();
  
  const [localSettings, setLocalSettings] = useState<SystemSettings>(() => normalizeSettings(settings));
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<{value: string, label: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('operational');
  const [searchQuery, setSearchQuery] = useState('');

  // Privileged Session State
  const [privilegedUntil, setPrivilegedUntil] = useState<number | null>(null);
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

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

  // Privileged Session Timer
  useEffect(() => {
    let interval: any;
    if (privilegedUntil) {
      interval = setInterval(() => {
        const now = Date.now();
        if (now > privilegedUntil) {
          setPrivilegedUntil(null);
        } else {
          const diff = Math.ceil((privilegedUntil - now) / 1000);
          const mins = Math.floor(diff / 60);
          const secs = diff % 60;
          setTimeRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [privilegedUntil]);

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

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUnlocking(true);
    setUnlockError('');
    try {
      if (!user) throw new Error("No user");
      // Use existing admin passwords or check against getRawUsers
      const rawUsers = userService.getRawUsers ? userService.getRawUsers() : [];
      const u = rawUsers.find((u: any) => u.id === user.id);
      
      let isValid = false;
      if (user.id === 'admin' && unlockPassword === 'admin') isValid = true;
      else if (u && u.password === unlockPassword) isValid = true;
      else if (unlockPassword === 'admin') isValid = true; // Fallback for demo
      
      if (isValid) {
        setPrivilegedUntil(Date.now() + 30 * 60 * 1000); // 30 minutes
        setUnlockPassword('');
      } else {
        setUnlockError('Incorrect password');
      }
    } catch (err) {
      setUnlockError('Authentication failed');
    } finally {
      setIsUnlocking(false);
    }
  };

  const lockNow = () => setPrivilegedUntil(null);

  const isAdminTab = activeCategory.startsWith('admin_');

  const renderAdminTab = () => {
    if (!privilegedUntil) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-md mx-auto animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-os-surface border border-os-border rounded-2xl p-8 shadow-2xl w-full flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-os-accent/10 rounded-full flex items-center justify-center mb-6">
              <Lock className="text-os-accent w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-os-text-primary mb-2">Administrator Authentication Required</h3>
            <p className="text-sm text-os-text-muted mb-8">Enter your administrator password to unlock privileged settings.</p>
            
            <form onSubmit={handleUnlock} className="w-full">
              <div className="mb-4">
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Password" 
                  value={unlockPassword}
                  onChange={e => setUnlockPassword(e.target.value)}
                  className="w-full bg-os-input-bg border border-os-border rounded-lg px-4 py-3 text-os-text-primary focus:outline-none focus:border-os-accent focus:ring-1 focus:ring-os-accent transition-all"
                />
                {unlockError && <p className="text-red-400 text-xs mt-2 text-left">{unlockError}</p>}
              </div>
              <button 
                type="submit" 
                disabled={isUnlocking || !unlockPassword}
                className="w-full bg-os-accent text-black font-medium py-3 rounded-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {isUnlocking ? 'Verifying...' : <>Unlock <Unlock size={16} /></>}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
        <div className="bg-os-surface/80 border border-os-border rounded-lg p-3 mb-6 flex items-center justify-between shadow-sm backdrop-blur-md">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-400 w-5 h-5" />
            <div>
              <div className="text-sm font-medium text-os-text-primary flex items-center gap-2">
                Privileged Session Active 
                <span className="text-xs text-os-text-muted font-normal">• Expires in {timeRemaining}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={lockNow}
            className="px-3 py-1.5 text-xs font-medium bg-os-surface-hover hover:bg-os-border border border-os-border rounded-md text-os-text-primary transition-colors flex items-center gap-2"
          >
            <Lock size={12} /> Lock Now
          </button>
        </div>
        
        <div className="flex-1 bg-os-surface border border-os-border rounded-xl overflow-hidden relative">
          {activeCategory === 'admin_overview' && <AdminOverview />}
          {activeCategory === 'admin_users' && <AdminUsers />}
          {activeCategory === 'admin_orgs' && <AdminOrganizations />}
          {activeCategory === 'admin_roles' && <AdminRoles />}
          {activeCategory === 'admin_branding' && <AdminBranding />}
          {activeCategory === 'admin_audit' && <AdminAuditLogs />}
          {activeCategory === 'admin_demo' && <AdminDemoData />}
          {activeCategory === 'admin_security' && <AdminSettings />}
        </div>
      </div>
    );
  };

  const renderCategoryContent = () => {
    if (isAdminTab) return renderAdminTab();

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
              
              <DisplayPreferencesControls />

              <div className="space-y-6 pt-2 border-t border-os-border">
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

  const menuItems = [
    { id: 'operational', label: 'General', icon: Sliders, group: 'system' },
    { id: 'appearance', label: 'Appearance', icon: Eye, group: 'system' },
    { id: 'localization', label: 'Localization', icon: Globe, group: 'system' },
    { id: 'sound', label: 'Sound', icon: Activity, group: 'system' },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield, group: 'system' },
  ];

  const adminItems = [
    { id: 'admin_overview', label: 'Overview', icon: SettingsIcon, group: 'admin' },
    { id: 'admin_users', label: 'Users', icon: Users, group: 'admin' },
    { id: 'admin_orgs', label: 'Organizations', icon: Building2, group: 'admin' },
    { id: 'admin_roles', label: 'Roles', icon: Key, group: 'admin' },
    { id: 'admin_branding', label: 'Branding', icon: Brush, group: 'admin' },
    { id: 'admin_audit', label: 'Audit Activity', icon: Clock, group: 'admin' },
    { id: 'admin_demo', label: 'Demo Data', icon: Database, group: 'admin' },
    { id: 'admin_security', label: 'Security', icon: ShieldCheck, group: 'admin' },
  ];

  const filteredMenuItems = menuItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredAdminItems = adminItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-os-bg text-os-text-primary overflow-hidden font-sans">
      <div className="w-full md:w-64 shrink-0 bg-os-surface/50 border-r border-os-border flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-os-border backdrop-blur-md sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-os-text-muted" size={14} />
            <input 
              type="text" 
              placeholder="Search Settings" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-os-input-bg border border-os-border rounded-md pl-8 pr-3 py-1.5 text-sm text-os-text-primary focus:outline-none focus:border-os-accent transition-colors"
            />
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="p-4 border-b border-os-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-os-surface-hover flex items-center justify-center shrink-0 border border-os-border">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-os-text-muted" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium text-os-text-primary truncate">{profile?.fullName || profile?.displayName || 'User'}</div>
            <div className="text-[10px] text-os-text-muted truncate uppercase tracking-widest">{profile?.role || 'Operator'}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-6 custom-scrollbar">
          {/* SYSTEM PREFERENCES */}
          {filteredMenuItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-mono tracking-widest uppercase text-os-text-secondary">System Preferences</div>
              <div className="space-y-0.5">
                {filteredMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id as SettingsCategory)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      activeCategory === item.id ? "bg-os-accent/10 text-os-accent" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
                    )}
                  >
                    <item.icon size={16} className={activeCategory === item.id ? "text-os-accent" : "text-os-text-muted"} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADMINISTRATION */}
          {isAdmin && filteredAdminItems.length > 0 && (
            <div>
              <div className="px-3 mb-2 text-[10px] font-mono tracking-widest uppercase text-os-text-secondary">Administration</div>
              <div className="space-y-0.5">
                {filteredAdminItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id as SettingsCategory)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left",
                      activeCategory === item.id ? "bg-emerald-500/10 text-emerald-400" : "text-os-text-secondary hover:bg-os-surface-hover hover:text-os-text-primary"
                    )}
                  >
                    <item.icon size={16} className={activeCategory === item.id ? "text-emerald-400" : "text-os-text-muted"} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative bg-os-bg">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar relative">
          {isAdminTab ? renderCategoryContent() : (
            <div className="max-w-3xl mx-auto">
              {renderCategoryContent()}
            </div>
          )}
        </div>
        
        {!isAdminTab && (
          <div className="p-4 md:px-10 border-t border-os-border bg-os-surface/80 backdrop-blur-md shrink-0">
            <div className="max-w-3xl mx-auto flex justify-end gap-3 items-center">
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
        )}
      </div>
    </div>
  );
};
