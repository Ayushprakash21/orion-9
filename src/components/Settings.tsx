import React, { useState, useEffect } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useAuth } from '../store/AuthContext';
import { 
  Save, Shield, Globe, CheckCircle2, RotateCcw, Settings as SettingsIcon, 
  Sliders, Eye, Search, User, Building2, ShieldCheck, Activity, Database, Brush, Key, Lock, Unlock, Users, Clock, BrainCircuit,
  Target, Package, FileCheck, Truck, TrendingUp, BarChart2, Network, FileText, Brain, Smartphone
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
import { AdminControlCenter } from './admin/AdminControlCenter';
import { AdminUsers } from './admin/AdminUsers';
import { AdminOrganizations } from './admin/AdminOrganizations';
import { AdminRoles } from './admin/AdminRoles';
import { AdminBranding } from './admin/AdminBranding';
import { AdminAuditLogs } from './admin/AdminAuditLogs';
import { AdminDemoData } from './admin/AdminDemoData';
import { AdminSettings } from './admin/AdminSettings';
import { AdminDatabaseHealth } from './admin/AdminDatabaseHealth';
import { privilegedSessionManager } from '../kernel/security/privilegedSession';
import { authService } from '../services/authService';

type SettingsCategory = 
  // SYSTEM
  | 'operational' | 'appearance' | 'localization' | 'sound' | 'privacy'
  // CORE ADMINISTRATION CONSOLES
  | 'admin_overview' | 'admin_control_center' | 'admin_users' | 'admin_orgs' | 'admin_roles' | 'admin_branding' | 'admin_audit' | 'admin_demo' | 'admin_security' | 'admin_database'
  // 17 GOVERNED GOVERNANCE DOMAINS
  | 'admin_domain_users_rbac'
  | 'admin_domain_roles_capabilities'
  | 'admin_domain_orgs_tenants'
  | 'admin_domain_ai_governance'
  | 'admin_domain_workflows_approvals'
  | 'admin_domain_planning_engine'
  | 'admin_domain_inventory_optimization'
  | 'admin_domain_fulfillment_engine'
  | 'admin_domain_logistics_transport'
  | 'admin_domain_sop_demand'
  | 'admin_domain_multi_echelon'
  | 'admin_domain_distributed_ledger'
  | 'admin_domain_security_controls'
  | 'admin_domain_audit_compliance'
  | 'admin_domain_integrations_fabric'
  | 'admin_domain_simulation_scenarios'
  | 'admin_domain_mobile_edge';

export const Settings = ({ initialCategory }: { initialCategory?: SettingsCategory }) => {
  const { user, profile, hasRole } = useAuth();
  const isAdmin = hasRole(['platform_admin', 'organization_admin']) || 
                  profile?.role === 'platform_admin' || 
                  profile?.role === 'organization_admin';
  const { settings, updateSettings } = useSupplyChain();
  
  const [localSettings, setLocalSettings] = useState<SystemSettings>(() => normalizeSettings(settings));
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currencyOptions, setCurrencyOptions] = useState<{value: string, label: string}[]>([]);
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>(initialCategory || 'operational');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      if (e.detail?.category) {
        setActiveCategory(e.detail.category as SettingsCategory);
      }
    };
    window.addEventListener('orion-open-settings', handleCategoryEvent as EventListener);
    return () => window.removeEventListener('orion-open-settings', handleCategoryEvent as EventListener);
  }, []);

  // Privileged Session State
  const [privilegedUntil, setPrivilegedUntil] = useState<number | null>(() => {
    const s = privilegedSessionManager.getSession();
    return s ? new Date(s.expiresAt).getTime() : null;
  });
  const [unlockPassword, setUnlockPassword] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    return privilegedSessionManager.subscribe(session => {
      setPrivilegedUntil(session ? new Date(session.expiresAt).getTime() : null);
    });
  }, []);

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
          privilegedSessionManager.revoke('Privileged session timed out');
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
      if (!user?.id) throw new Error("No authenticated user identity found.");
      
      const privSession = await authService.requestAdminStepUp(user.id, unlockPassword);
      if (privSession) {
        setPrivilegedUntil(new Date(privSession.expiresAt).getTime());
        setUnlockPassword('');
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Authentication failed. Please check your administrator password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const lockNow = () => {
    privilegedSessionManager.revoke('Manually locked by administrator');
    setPrivilegedUntil(null);
  };

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
          {activeCategory === 'admin_control_center' && <AdminControlCenter />}
          {activeCategory === 'admin_users' && <AdminUsers />}
          {activeCategory === 'admin_orgs' && <AdminOrganizations />}
          {activeCategory === 'admin_roles' && <AdminRoles />}
          {activeCategory === 'admin_branding' && <AdminBranding />}
          {activeCategory === 'admin_audit' && <AdminAuditLogs />}
          {activeCategory === 'admin_demo' && <AdminDemoData />}
          {activeCategory === 'admin_security' && <AdminSettings />}
          {activeCategory === 'admin_database' && <AdminDatabaseHealth />}

          {/* Quick-switch Governed Domains */}
          {activeCategory === 'admin_domain_users_rbac' && <AdminControlCenter initialDomainId="users-rbac" />}
          {activeCategory === 'admin_domain_roles_capabilities' && <AdminControlCenter initialDomainId="users-rbac" initialCapabilityId="role-management" />}
          {activeCategory === 'admin_domain_orgs_tenants' && <AdminControlCenter initialDomainId="master-data" initialCapabilityId="supplier-master" />}
          {activeCategory === 'admin_domain_ai_governance' && <AdminControlCenter initialDomainId="ai-ml" initialCapabilityId="ai-policy" />}
          {activeCategory === 'admin_domain_workflows_approvals' && <AdminControlCenter initialDomainId="operations" initialCapabilityId="release-governance" />}
          {activeCategory === 'admin_domain_planning_engine' && <AdminControlCenter initialDomainId="forecasting" initialCapabilityId="demand-forecasting" />}
          {activeCategory === 'admin_domain_inventory_optimization' && <AdminControlCenter initialDomainId="inventory" initialCapabilityId="stock-reallocation" />}
          {activeCategory === 'admin_domain_fulfillment_engine' && <AdminControlCenter initialDomainId="order-management" initialCapabilityId="order-allocation" />}
          {activeCategory === 'admin_domain_logistics_transport' && <AdminControlCenter initialDomainId="transportation" initialCapabilityId="route-optimization" />}
          {activeCategory === 'admin_domain_sop_demand' && <AdminControlCenter initialDomainId="forecasting" initialCapabilityId="demand-sensing" />}
          {activeCategory === 'admin_domain_multi_echelon' && <AdminControlCenter initialDomainId="inventory" initialCapabilityId="replenishment" />}
          {activeCategory === 'admin_domain_distributed_ledger' && <AdminControlCenter initialDomainId="security" initialCapabilityId="security-policy" />}
          {activeCategory === 'admin_domain_security_controls' && <AdminControlCenter initialDomainId="security" initialCapabilityId="security-controls" />}
          {activeCategory === 'admin_domain_audit_compliance' && <AdminControlCenter initialDomainId="compliance" initialCapabilityId="compliance-rules" />}
          {activeCategory === 'admin_domain_integrations_fabric' && <AdminControlCenter initialDomainId="integrations" initialCapabilityId="integration-health" />}
          {activeCategory === 'admin_domain_simulation_scenarios' && <AdminControlCenter initialDomainId="analytics" initialCapabilityId="kpi-governance" />}
          {activeCategory === 'admin_domain_mobile_edge' && <AdminControlCenter initialDomainId="mobile" initialCapabilityId="device-policy" />}
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

  const adminCoreItems = [
    { id: 'admin_overview', label: 'Overview', icon: SettingsIcon, group: 'admin' },
    { id: 'admin_control_center', label: 'AI + Manual Control Center', icon: BrainCircuit, group: 'admin' },
    { id: 'admin_users', label: 'Users & RBAC', icon: Users, group: 'admin' },
    { id: 'admin_orgs', label: 'Organizations & Tenants', icon: Building2, group: 'admin' },
    { id: 'admin_roles', label: 'Roles & Capabilities', icon: Key, group: 'admin' },
    { id: 'admin_branding', label: 'Branding & Whitelabel', icon: Brush, group: 'admin' },
    { id: 'admin_security', label: 'Security & Policy Engine', icon: ShieldCheck, group: 'admin' },
    { id: 'admin_audit', label: 'Audit & Compliance Activity', icon: Clock, group: 'admin' },
    { id: 'admin_demo', label: 'Demo Data & Sandbox', icon: Database, group: 'admin' },
    { id: 'admin_database', label: 'Database Health & Storage', icon: Activity, group: 'admin' },
  ];

  const adminDomainItems = [
    { id: 'admin_domain_users_rbac', label: '1. Users & Access', icon: Users, group: 'domains' },
    { id: 'admin_domain_roles_capabilities', label: '2. Roles & Permissions', icon: Key, group: 'domains' },
    { id: 'admin_domain_orgs_tenants', label: '3. Organizations & Tenants', icon: Building2, group: 'domains' },
    { id: 'admin_domain_ai_governance', label: '4. AI Governance', icon: Brain, group: 'domains' },
    { id: 'admin_domain_workflows_approvals', label: '5. Workflows & Approvals', icon: FileCheck, group: 'domains' },
    { id: 'admin_domain_planning_engine', label: '6. Planning Engine', icon: Target, group: 'domains' },
    { id: 'admin_domain_inventory_optimization', label: '7. Inventory Optimization', icon: Package, group: 'domains' },
    { id: 'admin_domain_fulfillment_engine', label: '8. Fulfillment Engine', icon: TrendingUp, group: 'domains' },
    { id: 'admin_domain_logistics_transport', label: '9. Logistics & Transport', icon: Truck, group: 'domains' },
    { id: 'admin_domain_sop_demand', label: '10. S&OP Demand Consensus', icon: BarChart2, group: 'domains' },
    { id: 'admin_domain_multi_echelon', label: '11. Multi-Echelon Buffer', icon: Package, group: 'domains' },
    { id: 'admin_domain_distributed_ledger', label: '12. Distributed Ledger', icon: Shield, group: 'domains' },
    { id: 'admin_domain_security_controls', label: '13. Security & Access Controls', icon: ShieldCheck, group: 'domains' },
    { id: 'admin_domain_audit_compliance', label: '14. Audit & Compliance', icon: FileText, group: 'domains' },
    { id: 'admin_domain_integrations_fabric', label: '15. Integrations & API Fabric', icon: Network, group: 'domains' },
    { id: 'admin_domain_simulation_scenarios', label: '16. Simulation & Scenario Engine', icon: Sliders, group: 'domains' },
    { id: 'admin_domain_mobile_edge', label: '17. Mobile & Edge Nodes', icon: Smartphone, group: 'domains' },
  ];

  const filteredMenuItems = menuItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredAdminCoreItems = adminCoreItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredAdminDomainItems = adminDomainItems.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-[#0c0e11] text-os-text-primary overflow-hidden font-sans">
      <div className="w-full md:w-64 max-h-[35vh] md:max-h-full shrink-0 bg-[#12151a] border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col">
        {/* Search */}
        <div className="p-3.5 border-b border-white/[0.08] backdrop-blur-md sticky top-0 z-10">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input 
              type="text" 
              placeholder="Search Settings" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50 transition-colors"
            />
          </div>
        </div>

        {/* User Mini Profile */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center gap-3">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/[0.08]">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-white truncate">{profile?.fullName || profile?.displayName || 'User'}</div>
            <div className="text-[10px] text-slate-400 truncate uppercase tracking-wider">{profile?.role || 'Operator'}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
          {/* SYSTEM PREFERENCES */}
          {filteredMenuItems.length > 0 && (
            <div>
              <div className="px-2.5 mb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400">System Preferences</div>
              <div className="space-y-1">
                {filteredMenuItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id as SettingsCategory)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                      activeCategory === item.id 
                        ? "bg-sky-500/15 text-sky-400 border border-sky-500/25 font-semibold" 
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon size={15} className={activeCategory === item.id ? "text-sky-400" : "text-slate-400"} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ADMINISTRATION */}
          {isAdmin && filteredAdminCoreItems.length > 0 && (
            <div>
              <div className="px-2.5 mb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400">Administration</div>
              <div className="space-y-1">
                {filteredAdminCoreItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id as SettingsCategory)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                      activeCategory === item.id 
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-semibold" 
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon size={15} className={activeCategory === item.id ? "text-emerald-400" : "text-slate-400"} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* GOVERNED DOMAINS QUICK SWITCH */}
          {isAdmin && filteredAdminDomainItems.length > 0 && (
            <div>
              <div className="px-2.5 mb-2 text-[10px] font-semibold tracking-wider uppercase text-slate-400">Governed Domains (17)</div>
              <div className="space-y-0.5">
                {filteredAdminDomainItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveCategory(item.id as SettingsCategory)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all text-left cursor-pointer",
                      activeCategory === item.id 
                        ? "bg-sky-500/15 text-sky-300 font-semibold" 
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white"
                    )}
                  >
                    <item.icon size={13} className={activeCategory === item.id ? "text-sky-300" : "text-slate-400"} /> {item.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0c0e11]">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
          {isAdminTab ? renderCategoryContent() : (
            <div className="max-w-3xl mx-auto">
              {renderCategoryContent()}
            </div>
          )}
        </div>
        
        {!isAdminTab && (
          <div className="p-4 md:px-8 border-t border-white/[0.08] bg-[#12151a]/90 backdrop-blur-xl shrink-0">
            <div className="max-w-3xl mx-auto flex justify-end gap-3 items-center">
              {isSaved && (
                <span className="text-emerald-400 text-xs font-medium flex items-center gap-1.5 animate-in fade-in mr-2">
                  <CheckCircle2 size={14} /> Saved
                </span>
              )}
              <button 
                onClick={handleReset} 
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-300 border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw size={13} />
                Reset
              </button>
              <button 
                onClick={handleSave} 
                disabled={isSaving}
                type="button"
                className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-sky-600 hover:bg-sky-500 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
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
