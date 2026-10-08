import React, { useState, useEffect, useRef } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { 
  User, Building2, Eye, Shield, Globe, Clock, Volume2, Monitor, 
  BrainCircuit, Wifi, HardDrive, Sliders, Lock, Unlock, ShieldCheck, 
  Save, RotateCcw, CheckCircle2, Search, ExternalLink, Mail, Phone, 
  Camera, X, Key, Brush, Activity, Database, Users, Sun, Moon, Laptop,
  FolderOpen, AlertTriangle, Play, Pause, FileText, Check
} from 'lucide-react';
import { SearchableDropdown } from './ui/SearchableDropdown';
import { FXRateService } from '../services/FXRateService';
import { timezones, locales } from '../lib/timezones';
import { SystemSettings, normalizeSettings, DEFAULT_SYSTEM_SETTINGS } from '../types';
import { SettingsCurrencyConverter } from "./SettingsCurrencyConverter";
import { DisplayPreferencesControls } from '../os/DisplayPreferences';
import { cn } from '../lib/utils';
import { userRepository } from '../repositories/UserRepository';
import { AvatarEditorModal } from './ui/AvatarEditorModal';
import { useOptionalWindowManager } from '../os/WindowManagerContext';
import { OrionSettingsSplitLayout } from './settings/OrionSettingsSplitLayout';
import { GlobalNetworkTimeMatrix } from './time/GlobalNetworkTimeMatrix';
import { useI18n } from '../store/LanguageContext';
import { LanguageSettingsPanel } from './settings/LanguageSettingsPanel';
import { TimeDateSettingsPanel } from './settings/TimeDateSettingsPanel';
import { AppearanceSettingsPanel } from './settings/AppearanceSettingsPanel';
import { PersonalizationSettingsPanel } from './settings/PersonalizationSettingsPanel';
import { AccessibilitySettingsPanel } from './settings/AccessibilitySettingsPanel';
import { EnvironmentSettingsPanel } from './settings/EnvironmentSettingsPanel';
import { DEFAULT_PERSONALIZATION_SETTINGS } from '../theme/themePresets';
import { useOSGeometry } from '../os/dock/DockGeometry';
import { loadPreferences } from '../os/theme/OrionThemeStorage';
import { PersonalizationSettings } from '../theme/themeTypes';

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
import { UserWallpaperStudio } from './wallpaper/UserWallpaperStudio';
import { AdminWallpaperStudio } from './admin/AdminWallpaperStudio';
import { Sparkles as SparklesIcon } from 'lucide-react';

export type SettingsSection = 
  | 'account'
  | 'organization'
  | 'appearance'
  | 'wallpaper_studio'
  | 'desktop'
  | 'accessibility'
  | 'language_region'
  | 'time_date'
  | 'time_region'
  | 'notifications'
  | 'privacy_security'
  | 'ai_automation'
  | 'network'
  | 'storage'
  | 'environment'
  // Admin Sections
  | 'admin'
  | 'admin_overview'
  | 'admin_control_center'
  | 'admin_users'
  | 'admin_orgs'
  | 'admin_roles'
  | 'admin_branding'
  | 'admin_wallpaper'
  | 'admin_audit'
  | 'admin_demo'
  | 'admin_security'
  | 'admin_database';

export const Settings: React.FC<{ initialSection?: SettingsSection }> = ({ initialSection = 'account' }) => {
  const { user, profile, organization, hasRole, refreshSession } = useAuth();
  const { showToast } = useToast();
  const { settings, updateSettings, dataMode } = useSupplyChain();
  const wm = useOptionalWindowManager();

  const isAdmin = hasRole(['platform_admin', 'organization_admin']) || 
                  profile?.role === 'platform_admin' || 
                  profile?.role === 'organization_admin';

  const [activeSection, setActiveSection] = useState<SettingsSection>(initialSection);
  const [localSettings, setLocalSettings] = useState<SystemSettings>(() => normalizeSettings(settings));
  const { previewSettings } = useOSGeometry();
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currencyOptions, setCurrencyOptions] = useState<{value: string, label: string}[]>([]);
  
  // Current Live Clock for Time & Region
  const [currentTimeStr, setCurrentTimeStr] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTimeStr(d.toLocaleTimeString('en-US', { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen for custom open events
  useEffect(() => {
    const handleCategoryEvent = (e: any) => {
      if (e.detail?.category) {
        setActiveSection(e.detail.category as SettingsSection);
      } else if (e.detail?.section) {
        setActiveSection(e.detail.section as SettingsSection);
      }
    };
    window.addEventListener('orion-open-settings', handleCategoryEvent as EventListener);
    return () => window.removeEventListener('orion-open-settings', handleCategoryEvent as EventListener);
  }, []);

  useEffect(() => {
    setLocalSettings(normalizeSettings(settings));
  }, [settings]);

  useEffect(() => {
    let mounted = true;
    FXRateService.getSupportedCurrencies()
      .then(res => {
        if (mounted && Array.isArray(res)) {
          setCurrencyOptions(res.map(c => ({ 
            value: c.code, 
            label: `${c.flag || ''} ${c.code} — ${c.name}`, 
            subLabel: c.symbol, 
            searchStr: `${c.code} ${c.name} ${c.symbol}` 
          })));
        }
      })
      .catch(err => console.warn('Failed to load supported currencies:', err));
    return () => { mounted = false; };
  }, []);

  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl || null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.fullName || '');
      setDisplayName(profile.displayName || '');
      setJobTitle(profile.jobTitle || '');
      setDepartment(profile.department || '');
      setPhone(profile.phone || '');
      setAvatarUrl(profile.avatarUrl || null);
    }
  }, [profile]);

  // Privileged Admin Session State
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

  const [saveError, setSaveError] = useState<string | null>(null);

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveError(null);
    setIsSaved(false);
    try {
      const normalized = normalizeSettings(localSettings);
      await updateSettings(normalized);
      // Persisted: clear temporary preview overrides so engine adheres to persistent state
      previewSettings(null);
      setIsSaved(true);
      showToast('System settings updated successfully', 'success');
      setTimeout(() => setIsSaved(false), 2500);
    } catch (error: any) {
      console.error('Error saving settings:', error);
      const msg = error?.message || 'Failed to save settings';
      setSaveError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    const defaults = { ...DEFAULT_SYSTEM_SETTINGS };
    setLocalSettings(defaults);
    // Reset preview to defaults immediately
    previewSettings(defaults.personalization);
    showToast('Settings reset to system defaults', 'info');
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Profile picture must be 5 MB or smaller.', 'error');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const saveProfileData = async () => {
    if (!profile) return;
    try {
      const updates: any = {
        fullName: fullName.trim(),
        displayName: displayName.trim(),
        jobTitle: jobTitle.trim(),
        department: department.trim(),
        phone: phone.trim(),
        avatarUrl
      };
      await userRepository.updateProfile(profile.id, updates);
      await refreshSession();
      showToast('Profile updated successfully', 'success');
      setIsEditingProfile(false);
    } catch (e) {
      showToast('Failed to update profile', 'error');
    }
  };

  const handleUnlockAdmin = async (e: React.FormEvent) => {
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
      setUnlockError(err.message || 'Authentication failed. Invalid administrator password.');
    } finally {
      setIsUnlocking(false);
    }
  };

  const lockAdminNow = () => {
    privilegedSessionManager.revoke('Manually locked by administrator');
    setPrivilegedUntil(null);
  };

  const { locale, setLocale, setUserPreferredLanguage, t, languages, dir, installedLanguages } = useI18n();

  // Main Sidebar Item List Definitions
  const navigationSections = [
    { id: 'account', label: t('navigation.myAccount'), icon: User, group: 'user' },
    { id: 'organization', label: t('navigation.organization'), icon: Building2, group: 'user' },
    { id: 'appearance', label: t('navigation.appearance'), icon: Eye, group: 'system' },
    { id: 'wallpaper_studio', label: t('navigation.wallpaperStudio'), icon: SparklesIcon, group: 'system' },
    { id: 'desktop', label: t('navigation.desktopWindows'), icon: Monitor, group: 'system' },
    { id: 'accessibility', label: 'Accessibility & Display', icon: Eye, group: 'system' },
    { id: 'language_region', label: 'Language & Region', icon: Globe, group: 'system' },
    { id: 'time_date', label: 'Time & Date', icon: Clock, group: 'system' },
    { id: 'notifications', label: t('navigation.notifications'), icon: Volume2, group: 'system' },
    { id: 'privacy_security', label: t('navigation.privacySecurity'), icon: Shield, group: 'system' },
    { id: 'ai_automation', label: t('navigation.aiAutomation'), icon: BrainCircuit, group: 'system' },
    { id: 'network', label: t('navigation.network'), icon: Wifi, group: 'system' },
    { id: 'storage', label: t('navigation.storage'), icon: HardDrive, group: 'system' },
    { id: 'environment', label: 'System Environment', icon: Database, group: 'system' },
  ];

  const adminSections = [
    { id: 'admin', label: 'Administration Overview', icon: Sliders, group: 'admin' },
    { id: 'admin_control_center', label: 'AI + Manual Control Center', icon: BrainCircuit, group: 'admin' },
    { id: 'admin_users', label: 'Users & RBAC', icon: Users, group: 'admin' },
    { id: 'admin_orgs', label: 'Organizations & Tenants', icon: Building2, group: 'admin' },
    { id: 'admin_roles', label: 'Roles & Capabilities', icon: Key, group: 'admin' },
    { id: 'admin_branding', label: 'Branding & Whitelabel', icon: Brush, group: 'admin' },
    { id: 'admin_wallpaper', label: 'Wallpaper Studio (Admin)', icon: SparklesIcon, group: 'admin' },
    { id: 'admin_security', label: 'Security & Policy Engine', icon: ShieldCheck, group: 'admin' },
    { id: 'admin_audit', label: 'Audit & Compliance Activity', icon: Clock, group: 'admin' },
    { id: 'admin_demo', label: 'Demo Data & Sandbox', icon: Database, group: 'admin' },
    { id: 'admin_database', label: 'Database Health & Storage', icon: Activity, group: 'admin' },
  ];

  const filteredNav = navigationSections.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredAdminNav = adminSections.filter(item => 
    item.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isAdminSection = activeSection.startsWith('admin');

  // Render Admin Consoles with Step-Up Lock Screen Guard
  const renderAdminConsoles = () => {
    if (!privilegedUntil) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center h-full max-w-md mx-auto p-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] rounded-2xl p-8 shadow-2xl w-full flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-[var(--orion-accent-soft)] rounded-2xl border border-[var(--orion-border-strong)] flex items-center justify-center mb-5">
              <Lock className="text-[var(--orion-accent)] w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-[var(--orion-text-primary)] mb-2">Administrator Access Required</h3>
            <p className="text-xs text-[var(--orion-text-muted)] mb-6 leading-relaxed">Enter your platform administrator password to unlock privileged settings and system control planes.</p>
            
            <form onSubmit={handleUnlockAdmin} className="w-full space-y-4">
              <div>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Administrator Password" 
                  value={unlockPassword}
                  onChange={e => setUnlockPassword(e.target.value)}
                  className="w-full bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-xl px-4 py-2.5 text-xs text-[var(--orion-text-primary)] placeholder:text-[var(--orion-text-muted)] focus:outline-none focus:border-[var(--orion-accent)] focus:ring-1 focus:ring-[var(--orion-accent)] transition-all font-mono"
                />
                {unlockError && <p className="text-rose-400 text-xs mt-2 text-left">{unlockError}</p>}
              </div>
              <button 
                type="submit" 
                disabled={isUnlocking || !unlockPassword}
                className="w-full bg-[var(--orion-accent,#D8DDE3)] hover:opacity-90 text-[var(--orion-bg,#0B0D0F)] font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isUnlocking ? 'Verifying Identity...' : <>Unlock Administration <Unlock size={14} /></>}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full min-h-0 w-full min-w-0 space-y-4 p-4">
        <div className="bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] rounded-xl p-3 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-400 w-4 h-4" />
            <div className="text-xs font-medium text-[var(--orion-text-primary)] flex items-center gap-2">
              Privileged Session Active 
              <span className="text-[11px] text-[var(--orion-text-muted)] font-mono">• Expires in {timeRemaining}</span>
            </div>
          </div>
          <button 
            onClick={lockAdminNow}
            className="px-3 py-1.5 text-xs font-medium bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] rounded-lg text-[var(--orion-text-secondary)] hover:text-[var(--orion-text-primary)] transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={12} /> Lock Session
          </button>
        </div>
        
        <div className="flex-1 min-h-0 w-full min-w-0 overflow-y-auto overflow-x-hidden custom-scrollbar bg-[#12151a] bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] rounded-xl relative p-4 sm:p-6">
          {(activeSection === 'admin' || activeSection === 'admin_overview') && <AdminOverview />}
          {activeSection === 'admin_control_center' && <AdminControlCenter />}
          {activeSection === 'admin_users' && <AdminUsers />}
          {activeSection === 'admin_orgs' && <AdminOrganizations />}
          {activeSection === 'admin_roles' && <AdminRoles />}
          {activeSection === 'admin_branding' && <AdminBranding />}
          {activeSection === 'admin_wallpaper' && <AdminWallpaperStudio />}
          {activeSection === 'admin_audit' && <AdminAuditLogs />}
          {activeSection === 'admin_demo' && <AdminDemoData />}
          {activeSection === 'admin_security' && <AdminSettings />}
          {activeSection === 'admin_database' && <AdminDatabaseHealth />}
        </div>
      </div>
    );
  };

  // Render Core Section Content with OrionSettingsSplitLayout
  const renderSectionContent = () => {
    if (isAdminSection) return renderAdminConsoles();

    switch (activeSection) {
      case 'account':
        return (
          <OrionSettingsSplitLayout
            title="My Account"
            subtitle="Operator Identity & Security Clearance"
            badge="AUTHENTICATED"
            primary={
              <div className="space-y-4">
                {/* Avatar & Header Card */}
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="relative group shrink-0">
                      <div className="w-14 h-14 rounded-full bg-white/[0.06] border border-white/[0.1] overflow-hidden flex items-center justify-center">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User size={24} className="text-slate-400" />
                        )}
                      </div>
                      {isEditingProfile && (
                        <button 
                          onClick={() => avatarInputRef.current?.click()}
                          className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                        >
                          <Camera size={16} className="text-white" />
                        </button>
                      )}
                      <input 
                        type="file" 
                        ref={avatarInputRef} 
                        onChange={handleAvatarUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                        {profile?.fullName || 'Orion Administrator'}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">@{profile?.username || 'admin'}</p>
                    </div>
                  </div>

                  {!isEditingProfile ? (
                    <button 
                      onClick={() => setIsEditingProfile(true)}
                      className="px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-xs font-medium text-white transition-colors cursor-pointer"
                    >
                      Edit Profile
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditingProfile(false)}
                        className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={saveProfileData}
                        className="px-3.5 py-1.5 bg-[var(--orion-accent,#D8DDE3)] hover:opacity-90 text-[var(--orion-bg,#0B0D0F)] font-semibold rounded-xl text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Form Fields */}
                <div className="bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] rounded-xl overflow-hidden divide-y divide-white/[0.06]">
                  <div className="px-4 py-2.5 bg-white/[0.02] flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Account Details</span>
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Display Name</span>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 w-52"
                      />
                    ) : (
                      <span className="text-xs text-white font-medium">{profile?.displayName || profile?.fullName || '-'}</span>
                    )}
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Job Title</span>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={jobTitle}
                        onChange={e => setJobTitle(e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 w-52"
                      />
                    ) : (
                      <span className="text-xs text-white">{profile?.jobTitle || 'Platform Administrator'}</span>
                    )}
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Department</span>
                    {isEditingProfile ? (
                      <input 
                        type="text" 
                        value={department}
                        onChange={e => setDepartment(e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 w-52"
                      />
                    ) : (
                      <span className="text-xs text-white">{profile?.department || 'Executive Operations'}</span>
                    )}
                  </div>

                  <div className="px-4 py-3 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-400">Phone Number</span>
                    {isEditingProfile ? (
                      <input 
                        type="tel" 
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1 text-xs text-white focus:outline-none focus:border-sky-500/50 w-52"
                      />
                    ) : (
                      <span className="text-xs text-white font-mono">{profile?.phone || '+1 (555) 019-2831'}</span>
                    )}
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Security Clearance</span>
                    <span className="text-sky-400 font-semibold uppercase">{profile?.role?.replace('_', ' ') || 'Platform Admin'}</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Auth Authority</span>
                      <span className="text-emerald-400 font-bold">Firebase Auth</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Email Address</span>
                      <span className="text-slate-200">{profile?.email || 'admin@orion.network'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[11px]">
                      <span className="text-slate-400">Organization</span>
                      <span className="text-slate-200">{organization?.name || profile?.organizationName || 'ORION_PLATFORM'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">Role Capabilities</h4>
                  <ul className="text-[11px] text-slate-400 space-y-1 font-mono">
                    <li className="flex items-center gap-2 text-emerald-400">✓ Full OS & Kernel Access</li>
                    <li className="flex items-center gap-2 text-emerald-400">✓ Autopilot & Policy Engine Governance</li>
                    <li className="flex items-center gap-2 text-emerald-400">✓ Digital Twin State Reconstruction</li>
                    <li className="flex items-center gap-2 text-emerald-400">✓ Step-Up Privileged Administration</li>
                  </ul>
                </div>
              </div>
            }
          />
        );

      case 'organization':
        return (
          <OrionSettingsSplitLayout
            title="Organization"
            subtitle="Enterprise Workspace & Tenant Metadata"
            badge="ACTIVE TENANT"
            primary={
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                      <Building2 size={20} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{organization?.name || 'ORION_PLATFORM'}</h3>
                      <p className="text-[11px] text-slate-400">{organization?.industry || 'Supply Chain Enterprise'}</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    OPERATIONAL
                  </span>
                </div>

                <div className="bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] rounded-xl overflow-hidden divide-y divide-white/[0.06] text-xs">
                  <div className="px-4 py-2.5 bg-white/[0.02]">
                    <span className="font-semibold text-slate-300 uppercase tracking-wider">Tenant Attributes</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-slate-400">Tenant ID</span>
                    <span className="text-slate-300 font-mono">{organization?.id || 'ORION_PLATFORM'}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-slate-400">Country / Region</span>
                    <span className="text-slate-300">{organization?.country || 'Global Enterprise'}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-slate-400">Base Currency</span>
                    <span className="text-sky-400 font-mono font-semibold">{organization?.currency || 'USD ($)'}</span>
                  </div>
                  <div className="px-4 py-3 flex justify-between">
                    <span className="text-slate-400">System Timezone</span>
                    <span className="text-slate-300 font-mono">{organization?.timezone || 'Asia/Kolkata'}</span>
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider">Tenant Isolation Guarantee</span>
                    <span className="text-emerald-400 font-bold">STRICT FIRESTORE SEPARATION</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Data models and VFS trees are strictly isolated to tenantId: <b className="text-slate-200">{organization?.id || 'ORION_PLATFORM'}</b> with zero cross-tenant leakage.
                  </p>
                </div>
              </div>
            }
          />
        );

      case 'wallpaper_studio':
        return <UserWallpaperStudio initialTarget="desktop" />;

      case 'appearance': {
        return <AppearanceSettingsPanel />;
      }

      case 'desktop': {
        const activePrefs = loadPreferences();
        const currentPers: PersonalizationSettings = {
          ...DEFAULT_PERSONALIZATION_SETTINGS,
          ...(localSettings.personalization || {}),
          themeId: activePrefs.themeId,
          dockPosition: (activePrefs.dockPosition as any) || localSettings.personalization?.dockPosition || 'bottom',
          dockAutoHide: activePrefs.dockAutoHide !== undefined ? activePrefs.dockAutoHide : (localSettings.personalization?.dockAutoHide ?? true),
          dockMagnification: activePrefs.dockMagnification !== undefined ? activePrefs.dockMagnification : (localSettings.personalization?.dockMagnification ?? true),
          dockTransparency: activePrefs.transparencyIntensity !== undefined ? activePrefs.transparencyIntensity : (localSettings.personalization?.dockTransparency ?? 85),
          windowControlPosition: activePrefs.windowControlPosition || localSettings.personalization?.windowControlPosition || 'left',
        };
        return (
          <PersonalizationSettingsPanel
            settings={currentPers}
            onChange={(updated) => {
              const newPers = { ...currentPers, ...updated, themeId: activePrefs.themeId };
              const newSettings = { ...localSettings, personalization: newPers };
              setLocalSettings(newSettings);
              updateSettings(newSettings);
            }}
          />
        );
      }

      case 'accessibility': {
        const currentPers = localSettings.personalization || DEFAULT_PERSONALIZATION_SETTINGS;
        return (
          <AccessibilitySettingsPanel
            settings={currentPers}
            onChange={(updated) => {
              const newPers = { ...currentPers, ...updated };
              const newSettings = { ...localSettings, personalization: newPers };
              setLocalSettings(newSettings);
              updateSettings(newSettings);
            }}
          />
        );
      }

      case 'language_region':
        return (
          <OrionSettingsSplitLayout
            title="Language & Region"
            subtitle="Configure Orion-9's interface language, regional formats, and language packages."
            badge="LOCALIZATION"
            primary={<LanguageSettingsPanel />}
            secondary={
              <div className="space-y-4 text-xs font-sans">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  SYSTEM LOCALIZATION
                </span>
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-3">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Active BCP-47</span>
                    <span className="text-sky-400 font-bold font-mono">{locale}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Text Direction</span>
                    <span className="text-emerald-400 font-bold uppercase font-mono">{dir}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Installed Packs</span>
                    <span className="text-white font-bold font-mono">{installedLanguages.length} Cached</span>
                  </div>
                </div>
              </div>
            }
          />
        );

      case 'time_date':
      case 'time_region':
        return (
          <OrionSettingsSplitLayout
            title="Time & Date"
            subtitle="Configure Orion-9's clock, timezone and date/time preferences."
            badge="CHRONO"
            primary={<TimeDateSettingsPanel />}
            secondary={<GlobalNetworkTimeMatrix />}
          />
        );

      case 'notifications':
        return (
          <OrionSettingsSplitLayout
            title="Notifications"
            subtitle="Audio Feedback & System Alerts"
            badge="ALERTS"
            primary={
              <div className="space-y-4">
                <div className="bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Master Audio Sounds</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Acoustic feedback for actions and alerts.</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const next = !localSettings.soundEnabled;
                        setLocalSettings(prev => ({ ...prev, soundEnabled: next }));
                        updateSettings({ soundEnabled: next });
                      }}
                      className={cn(
                        "px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                        localSettings.soundEnabled ? "bg-sky-500/20 border-sky-500/40 text-sky-400" : "bg-white/[0.05] border-white/10 text-slate-400"
                      )}
                    >
                      {localSettings.soundEnabled ? 'ON' : 'OFF'}
                    </button>
                  </div>

                  <div className="pt-2 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-slate-300 font-medium">Volume</span>
                      <span className="font-mono text-sky-400">{localSettings.soundVolume ?? 75}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={localSettings.soundVolume ?? 75}
                      onChange={(e) => setLocalSettings(prev => ({...prev, soundVolume: parseInt(e.target.value)}))}
                      onMouseUp={(e) => updateSettings({ soundVolume: parseInt((e.target as HTMLInputElement).value) })}
                      className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-sky-400"
                    />
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4 font-mono text-xs">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  PRIORITY RULES
                </span>
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-2">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Stockout Warnings</span>
                    <span className="text-emerald-400 font-bold">HIGH PRIORITY</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Autopilot Proposals</span>
                    <span className="text-purple-400 font-bold">GOVERNED</span>
                  </div>
                </div>
              </div>
            }
          />
        );

      case 'privacy_security':
        return (
          <OrionSettingsSplitLayout
            title="Privacy & Security"
            subtitle="Authentication Level & Audit Controls"
            badge="SECURITY"
            primary={
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Auth Engine</span>
                    <span className="text-emerald-400 font-bold">Firebase Auth</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Security Clearance</span>
                    <span className="text-sky-400 font-bold uppercase">{profile?.role || 'Platform Admin'}</span>
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4 font-mono text-xs">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  PRIVILEGED SESSION
                </span>
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)]">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Environment</span>
                    <span className="text-sky-400 font-bold">{dataMode === 'real' ? 'LIVE' : 'DEMO'}</span>
                  </div>
                </div>
              </div>
            }
          />
        );

      case 'ai_automation':
        return (
          <OrionSettingsSplitLayout
            title="AI & Automation"
            subtitle="Autopilot Policy & LLM Parameters"
            badge="GEMINI AI"
            primary={
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Operating Mode</span>
                    <span className="text-purple-400 font-bold">Level 2 — Recommend</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approval Limit</span>
                    <span className="text-white font-mono">$10,000 USD</span>
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4 font-mono text-xs">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  WORKFORCE CAPABILITIES
                </span>
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-1">
                  <div className="text-emerald-400">✓ Planning Agent</div>
                  <div className="text-emerald-400">✓ Procurement Agent</div>
                  <div className="text-emerald-400">✓ Risk Radar Agent</div>
                </div>
              </div>
            }
          />
        );

      case 'network':
        return (
          <OrionSettingsSplitLayout
            title="Network"
            subtitle="Edge Worker Target & Live Telemetry"
            badge="LATENCY"
            primary={
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status</span>
                    <span className="text-emerald-400 font-bold">CONNECTED</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Latency</span>
                    <span className="text-sky-400">14ms</span>
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4 font-mono text-xs">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  GATEWAY DIAGNOSTICS
                </span>
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] text-[11px] text-slate-400">
                  WebSocket Relays Active • 0 Loss
                </div>
              </div>
            }
          />
        );

      case 'storage':
        return (
          <OrionSettingsSplitLayout
            title="Storage"
            subtitle="Firestore VFS & Persistence Limits"
            badge="VFS ENGINE"
            primary={
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] space-y-2 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Provider</span>
                    <span className="text-slate-200">Cloud Firestore VFS</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Root</span>
                    <span className="text-sky-400">vfs://orion/workspace</span>
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4 font-mono text-xs">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">
                  USAGE BREAKDOWN
                </span>
                <div className="p-4 rounded-xl bg-[var(--orion-surface-elevated)] border border-[var(--orion-border)] text-[11px] text-slate-400">
                  VFS Tree Clean • Desktop Items Persisted
                </div>
              </div>
            }
          />
        );

      case 'environment':
        return <EnvironmentSettingsPanel />;

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-[var(--orion-bg,#0c0e11)] text-[var(--orion-text-primary,#fff)] overflow-hidden font-sans select-none">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-full md:w-[230px] max-h-[35vh] md:max-h-full shrink-0 bg-[var(--orion-surface-elevated)] border-b md:border-b-0 md:border-r border-[var(--orion-border)] flex flex-col">
        {/* Search */}
        <div className="p-3 border-b border-[var(--orion-border)] sticky top-0 z-10 bg-[var(--orion-surface-elevated)]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2 text-[var(--orion-text-muted)]" size={14} />
            <input 
              type="text" 
              placeholder="Search Settings" 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--orion-surface)] border border-[var(--orion-border)] rounded-md pl-7.5 pr-2.5 py-1 text-[12px] text-[var(--orion-text-primary)] placeholder:text-[var(--orion-text-muted)] focus:outline-none focus:border-[var(--orion-accent)] transition-colors"
            />
          </div>
        </div>

        {/* User Badge */}
        <div className="p-3 border-b border-[var(--orion-border)] flex items-center gap-2.5 bg-[var(--orion-surface-hover)]">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--orion-surface)] flex items-center justify-center shrink-0 border border-[var(--orion-border)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={15} className="text-[var(--orion-text-secondary)]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-medium text-[var(--orion-text-primary)] truncate">{profile?.fullName || 'Administrator'}</div>
            <div className="text-[10px] text-[var(--orion-accent)] font-mono truncate uppercase tracking-wider">{profile?.role?.replace('_', ' ') || 'Platform Admin'}</div>
          </div>
        </div>
        
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-3 custom-scrollbar">
          {/* USER & SYSTEM SECTIONS */}
          <div>
            <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--orion-text-muted)]">System Preferences</div>
            <div className="space-y-0.5">
              {filteredNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md text-[13px] font-medium transition-colors text-left cursor-pointer",
                    activeSection === item.id 
                      ? "bg-[var(--orion-accent-soft)] text-[var(--orion-text-primary)] font-medium border border-[var(--orion-border-strong)]" 
                      : "text-[var(--orion-text-secondary)] hover:bg-[var(--orion-surface-hover)] hover:text-[var(--orion-text-primary)] border border-transparent"
                  )}
                >
                  <item.icon size={15} className={activeSection === item.id ? "text-[var(--orion-accent)]" : "text-[var(--orion-text-muted)]"} /> 
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ADMINISTRATION SECTIONS */}
          {isAdmin && filteredAdminNav.length > 0 && (
            <div>
              <div className="px-2 mb-1 text-[10px] font-semibold tracking-wider uppercase text-[var(--orion-text-muted)]">Administration</div>
              <div className="space-y-0.5">
                {filteredAdminNav.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as SettingsSection)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-2.5 h-[32px] rounded-md text-[13px] font-medium transition-colors text-left cursor-pointer",
                      activeSection === item.id 
                        ? "bg-[var(--orion-accent-soft)] text-[var(--orion-text-primary)] font-medium border border-[var(--orion-border-strong)]" 
                        : "text-[var(--orion-text-secondary)] hover:bg-[var(--orion-surface-hover)] hover:text-[var(--orion-text-primary)] border border-transparent"
                    )}
                  >
                    <item.icon size={15} className={activeSection === item.id ? "text-emerald-400" : "text-[var(--orion-text-muted)]"} /> 
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT PANEL (FULL DESKTOP SPAN, TWO-PANE SPLIT) ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[var(--orion-bg,#0c0e11)] w-full min-w-0 h-full">
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col min-h-0 custom-scrollbar pb-16 sm:pb-20">
          {renderSectionContent()}
        </div>
        
        {/* Compact Footer Action Bar for non-admin sections */}
        {!isAdminSection && (
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-t border-[var(--orion-border,rgba(255,255,255,0.08))] bg-[var(--orion-surface,#12151a)]/95 backdrop-blur-xl shrink-0 flex items-center justify-between z-20 text-xs">
            <span className="text-[11px] text-[var(--orion-text-muted,#94a3b8)] font-mono">
              Environment: <strong className="text-[var(--orion-text-primary,#e2e8f0)]">{dataMode === 'real' ? 'LIVE' : 'DEMO'}</strong>
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              {saveError && (
                <span className="text-rose-400 text-xs font-semibold flex items-center gap-1 mr-1 animate-in fade-in">
                  Failed to save
                </span>
              )}
              {isSaved && !saveError && (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 mr-1 animate-in fade-in">
                  <CheckCircle2 size={13} /> Saved
                </span>
              )}
              <button 
                onClick={handleResetSettings}
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[var(--orion-text-secondary,#cbd5e1)] border border-[var(--orion-border,rgba(255,255,255,0.08))] rounded-xl hover:bg-[var(--orion-surface-hover,rgba(255,255,255,0.06))] hover:text-[var(--orion-text-primary,#ffffff)] transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-[var(--orion-bg,#0B0D0F)] bg-[var(--orion-accent,#D8DDE3)] hover:opacity-90 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                <Save size={13} />
                {isSaving ? 'Saving...' : 'Apply Changes'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Centered Avatar Editor Modal */}
      <AvatarEditorModal
        isOpen={Boolean(selectedImage)}
        imageSrc={selectedImage}
        onClose={() => setSelectedImage(null)}
        onApply={(croppedImage) => {
          setAvatarUrl(croppedImage);
          setSelectedImage(null);
        }}
        title="Adjust Profile Avatar"
        applyButtonText="Save Picture"
      />
    </div>
  );
};
