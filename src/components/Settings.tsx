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
  | 'time_region'
  | 'notifications'
  | 'privacy_security'
  | 'ai_automation'
  | 'network'
  | 'storage'
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

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const normalized = normalizeSettings(localSettings);
      await updateSettings(normalized);
      setIsSaved(true);
      showToast('System settings updated successfully', 'success');
      setTimeout(() => setIsSaved(false), 2500);
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetSettings = () => {
    setLocalSettings({ ...DEFAULT_SYSTEM_SETTINGS });
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

  // Main Sidebar Item List Definitions
  const navigationSections = [
    { id: 'account', label: 'My Account', icon: User, group: 'user' },
    { id: 'organization', label: 'Organization', icon: Building2, group: 'user' },
    { id: 'appearance', label: 'Appearance', icon: Eye, group: 'system' },
    { id: 'wallpaper_studio', label: 'Wallpaper Studio', icon: SparklesIcon, group: 'system' },
    { id: 'desktop', label: 'Desktop & Windows', icon: Monitor, group: 'system' },
    { id: 'time_region', label: 'Time & Region', icon: Clock, group: 'system' },
    { id: 'notifications', label: 'Notifications', icon: Volume2, group: 'system' },
    { id: 'privacy_security', label: 'Privacy & Security', icon: Shield, group: 'system' },
    { id: 'ai_automation', label: 'AI & Automation', icon: BrainCircuit, group: 'system' },
    { id: 'network', label: 'Network', icon: Wifi, group: 'system' },
    { id: 'storage', label: 'Storage', icon: HardDrive, group: 'system' },
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
          <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-8 shadow-2xl w-full flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-sky-500/10 rounded-2xl border border-sky-500/20 flex items-center justify-center mb-5">
              <Lock className="text-sky-400 w-7 h-7" />
            </div>
            <h3 className="text-base font-semibold text-white mb-2">Administrator Access Required</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">Enter your platform administrator password to unlock privileged settings and system control planes.</p>
            
            <form onSubmit={handleUnlockAdmin} className="w-full space-y-4">
              <div>
                <input 
                  type="password" 
                  autoFocus
                  placeholder="Administrator Password" 
                  value={unlockPassword}
                  onChange={e => setUnlockPassword(e.target.value)}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-sky-500/60 focus:ring-1 focus:ring-sky-500/60 transition-all font-mono"
                />
                {unlockError && <p className="text-rose-400 text-xs mt-2 text-left">{unlockError}</p>}
              </div>
              <button 
                type="submit" 
                disabled={isUnlocking || !unlockPassword}
                className="w-full bg-sky-500 hover:bg-sky-400 text-black font-semibold py-2.5 rounded-xl disabled:opacity-50 transition-all text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                {isUnlocking ? 'Verifying Identity...' : <>Unlock Administration <Unlock size={14} /></>}
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full space-y-4 p-4">
        <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <ShieldCheck className="text-emerald-400 w-4 h-4" />
            <div className="text-xs font-medium text-white flex items-center gap-2">
              Privileged Session Active 
              <span className="text-[11px] text-slate-400 font-mono">• Expires in {timeRemaining}</span>
            </div>
          </div>
          <button 
            onClick={lockAdminNow}
            className="px-3 py-1.5 text-xs font-medium bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] rounded-lg text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Lock size={12} /> Lock Session
          </button>
        </div>
        
        <div className="flex-1 bg-[#12151a] border border-white/[0.08] rounded-xl overflow-hidden relative">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between gap-4">
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
                        className="px-3.5 py-1.5 bg-sky-500 hover:bg-sky-400 text-black font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                {/* Profile Form Fields */}
                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl overflow-hidden divide-y divide-white/[0.06]">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3 font-mono text-xs">
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

                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-2">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between">
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

                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl overflow-hidden divide-y divide-white/[0.06] text-xs">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3 font-mono text-xs">
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
        return <UserWallpaperStudio />;

      case 'appearance':
        return (
          <OrionSettingsSplitLayout
            title="Appearance"
            subtitle="Theme, Font, Display Scale & Glass Translucency"
            badge="VISUAL SYSTEM"
            primary={
              <div className="space-y-4">
                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4 space-y-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Theme Mode</span>
                  <div className="grid grid-cols-3 gap-2.5">
                    {['light', 'dark', 'system'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => updateSettings({ theme: t as any })}
                        className={cn(
                          "p-2.5 rounded-xl border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                          (settings?.theme || 'dark') === t 
                            ? "bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-sm" 
                            : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white"
                        )}
                      >
                        {t === 'light' && <Sun size={14} />}
                        {t === 'dark' && <Moon size={14} />}
                        {t === 'system' && <Laptop size={14} />}
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-medium text-white">Reduced Motion</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Disables heavy CSS animations across OS windows.</div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => updateSettings({ reducedMotion: !settings?.reducedMotion })}
                      className={cn(
                        "px-3 py-1 rounded-lg border text-xs font-semibold transition-all cursor-pointer",
                        settings?.reducedMotion ? "bg-sky-500/20 border-sky-500/40 text-sky-400" : "bg-white/[0.05] border-white/10 text-slate-400"
                      )}
                    >
                      {settings?.reducedMotion ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>

                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4">
                  <DisplayPreferencesControls />
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono block">
                  REAL-TIME OS APPEARANCE PREVIEW
                </span>

                {/* Simulated Floating Orion Window Card showing theme/font/scale */}
                <div className="p-5 rounded-2xl border border-white/15 bg-[#0c0e11]/90 backdrop-blur-xl shadow-2xl space-y-3">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/80" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                      <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                      <span className="text-xs font-semibold text-white ml-2">Sample Window</span>
                    </div>
                    <span className="text-[10px] font-mono text-sky-400">Glass Backdrop</span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <p className="text-slate-300">
                      This preview reflects current theme mode <b className="text-sky-400">({settings?.theme || 'dark'})</b>, selected font family, text scaling, and backdrop translucency.
                    </p>
                    <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-300 font-mono text-[11px]">
                      Orion OS Glass & Depth Architecture
                    </div>
                  </div>
                </div>
              </div>
            }
          />
        );

      case 'desktop':
        return (
          <OrionSettingsSplitLayout
            title="Desktop & Windows"
            subtitle="Window Management, Spatial Grid & Shortcuts"
            badge="WORKSPACE"
            primary={
              <div className="space-y-4">
                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Desktop Grid Snap</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Align shortcuts to 80px spatial desktop grid.</div>
                    </div>
                    <span className="text-sky-400 font-mono font-semibold">ENABLED</span>
                  </div>
                </div>

                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4 space-y-3 text-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-white">Persist Window Geometry</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Saves position, size, and z-index across boots.</div>
                    </div>
                    <span className="text-emerald-400 font-mono font-semibold">ACTIVE</span>
                  </div>
                </div>
              </div>
            }
            secondary={
              <div className="space-y-4">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono block">
                  WINDOW MANAGER BEHAVIOR
                </span>

                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-3 font-mono text-xs">
                  <div className="flex justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] text-slate-400 uppercase">Titlebar Double Click</span>
                    <span className="text-sky-400 font-bold">Maximize / Restore</span>
                  </div>
                  <div className="flex justify-between border-b border-white/[0.06] pb-2">
                    <span className="text-[10px] text-slate-400 uppercase">Traffic Light Ordering</span>
                    <span className="text-slate-200">Red (Close) • Yellow (Min) • Green (Max)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-slate-400 uppercase">Window Shadows</span>
                    <span className="text-emerald-400">Soft Aurora Spatial Shadow</span>
                  </div>
                </div>
              </div>
            }
          />
        );

      case 'time_region':
        return (
          <OrionSettingsSplitLayout
            title="Time & Region"
            subtitle="Live Operating Clock, Localization & Global Matrix"
            badge="CHRONO"
            primary={
              <div className="space-y-4">
                {/* Live Clock Card */}
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Live Operating Clock</span>
                    <h3 className="text-xl font-mono font-bold text-sky-400 tracking-tight mt-0.5">{currentTimeStr || '12:00:00'}</h3>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">{localSettings.timezone || 'Asia/Kolkata'}</p>
                  </div>
                  <div className="text-right text-xs">
                    <span className="text-slate-300 font-medium">Locale</span>
                    <p className="text-slate-400 font-mono text-[11px] mt-0.5">{localSettings.locale || 'en-IN'}</p>
                  </div>
                </div>

                {/* Localization Form Controls */}
                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4 space-y-3.5">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Localization Parameters</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Currency</label>
                      <SearchableDropdown 
                        value={localSettings.currency || 'INR'} 
                        options={currencyOptions} 
                        onChange={(val) => setLocalSettings(prev => ({...prev, currency: val}))} 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Timezone</label>
                      <SearchableDropdown 
                        value={localSettings.timezone || 'Asia/Kolkata'} 
                        options={timezones} 
                        onChange={(val) => setLocalSettings(prev => ({...prev, timezone: val}))} 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Language & Locale</label>
                      <SearchableDropdown 
                        value={localSettings.locale || 'en-IN'} 
                        options={locales} 
                        onChange={(val) => setLocalSettings(prev => ({...prev, locale: val}))} 
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">Date Format</label>
                      <div className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-mono text-slate-300">
                        DD/MM/YYYY (26/09/2026)
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-white/[0.06]">
                    <SettingsCurrencyConverter currencyOptions={currencyOptions} defaultCurrency={localSettings.currency} />
                  </div>
                </div>
              </div>
            }
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
                <div className="bg-[#12151a] border border-white/[0.08] rounded-xl p-4 space-y-3 text-xs">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-2">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-2">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08]">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-2">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-1">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-2 font-mono">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] text-[11px] text-slate-400">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] space-y-2 font-mono">
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
                <div className="p-4 rounded-xl bg-[#12151a] border border-white/[0.08] text-[11px] text-slate-400">
                  VFS Tree Clean • Desktop Items Persisted
                </div>
              </div>
            }
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-full h-full bg-[#0c0e11] text-white overflow-hidden font-sans select-none">
      {/* ─── LEFT SIDEBAR ─── */}
      <div className="w-full md:w-[230px] max-h-[35vh] md:max-h-full shrink-0 bg-[#12151a] border-b md:border-b-0 md:border-r border-white/[0.08] flex flex-col">
        {/* Search */}
        <div className="p-3.5 border-b border-white/[0.08] backdrop-blur-md sticky top-0 z-10 bg-[#12151a]">
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

        {/* User Badge */}
        <div className="p-3.5 border-b border-white/[0.08] flex items-center gap-3 bg-white/[0.02]">
          <div className="w-9 h-9 rounded-full overflow-hidden bg-white/[0.06] flex items-center justify-center shrink-0 border border-white/[0.1]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={16} className="text-slate-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-white truncate">{profile?.fullName || 'Administrator'}</div>
            <div className="text-[10px] text-sky-400 font-mono truncate uppercase tracking-wider">{profile?.role?.replace('_', ' ') || 'Platform Admin'}</div>
          </div>
        </div>
        
        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4 custom-scrollbar">
          {/* USER & SYSTEM SECTIONS */}
          <div>
            <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400">System Preferences</div>
            <div className="space-y-0.5">
              {filteredNav.map(item => (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as SettingsSection)}
                  className={cn(
                    "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                    activeSection === item.id 
                      ? "bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold shadow-sm" 
                      : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                  )}
                >
                  <item.icon size={15} className={activeSection === item.id ? "text-sky-400" : "text-slate-400"} /> 
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ADMINISTRATION SECTIONS */}
          {isAdmin && filteredAdminNav.length > 0 && (
            <div>
              <div className="px-2.5 mb-1.5 text-[10px] font-semibold tracking-wider uppercase text-slate-400">Administration</div>
              <div className="space-y-0.5">
                {filteredAdminNav.map(item => (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id as SettingsSection)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer",
                      activeSection === item.id 
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shadow-sm" 
                        : "text-slate-400 hover:bg-white/[0.05] hover:text-white border border-transparent"
                    )}
                  >
                    <item.icon size={15} className={activeSection === item.id ? "text-emerald-400" : "text-slate-400"} /> 
                    <span className="truncate">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── MAIN CONTENT PANEL (FULL DESKTOP SPAN, TWO-PANE SPLIT) ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0c0e11] w-full min-w-0 h-full">
        <div className="flex-1 overflow-hidden relative flex flex-col">
          {renderSectionContent()}
        </div>
        
        {/* Compact Footer Action Bar for non-admin sections */}
        {!isAdminSection && (
          <div className="px-4 py-2.5 sm:px-6 sm:py-3 border-t border-white/[0.08] bg-[#12151a]/95 backdrop-blur-xl shrink-0 flex items-center justify-between z-20 text-xs">
            <span className="text-[11px] text-slate-400 font-mono">
              Environment: <strong className="text-slate-200">{dataMode === 'real' ? 'LIVE' : 'DEMO'}</strong>
            </span>
            <div className="flex items-center gap-2 sm:gap-3">
              {isSaved && (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1 mr-1 animate-in fade-in">
                  <CheckCircle2 size={13} /> Saved
                </span>
              )}
              <button 
                onClick={handleResetSettings}
                type="button"
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-300 border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw size={12} /> Reset
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                type="button"
                className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-black bg-sky-400 hover:bg-sky-300 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
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
