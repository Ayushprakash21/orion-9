import React, { useState, useEffect, useRef } from 'react';
import { useSupplyChain } from '../store/SupplyChainContext';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { 
  User, Building2, Eye, Shield, Globe, Clock, Volume2, Monitor, 
  BrainCircuit, Wifi, HardDrive, Sliders, Lock, Unlock, ShieldCheck, 
  Save, RotateCcw, CheckCircle2, Search, ExternalLink, Mail, Phone, 
  Camera, X, Key, Brush, Activity, Database, Users, Sun, Moon, Laptop,
  FolderOpen, AlertTriangle, Play, FileText, Check
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
import { TimeWorldPanel } from './TimeWorld';
import { useOptionalWindowManager } from '../os/WindowManagerContext';

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
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
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
      <div className="flex flex-col h-full space-y-4">
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

  // Render Core Section Content
  const renderSectionContent = () => {
    if (isAdminSection) return renderAdminConsoles();

    switch (activeSection) {
      case 'account':
        return (
          <div className="space-y-6">
            {/* Header / Avatar Card */}
            <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className="relative group shrink-0">
                  <div className="w-16 h-16 rounded-full bg-white/[0.06] border border-white/[0.1] overflow-hidden flex items-center justify-center shadow-inner">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={28} className="text-slate-400" />
                    )}
                  </div>
                  {isEditingProfile && (
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={18} className="text-white" />
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
                  <h2 className="text-base font-semibold text-white flex items-center gap-2">
                    {profile?.fullName || 'Orion Administrator'}
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                      {profile?.role?.replace('_', ' ') || 'Platform Admin'}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">@{profile?.username || 'admin'} · {profile?.email || 'admin@orion.network'}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Organization: <span className="text-slate-300 font-medium">{organization?.name || profile?.organizationName || 'ORION_PLATFORM'}</span>
                  </p>
                </div>
              </div>
              <div>
                {!isEditingProfile ? (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.1] rounded-xl text-xs font-medium text-white transition-colors cursor-pointer"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={saveProfileData}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-semibold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Save Profile
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Account Info Rows */}
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Account Information</span>
                <span className="text-[10px] text-slate-500 font-mono">Firebase Authentication Authoritative</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Display Name</span>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50 w-64"
                  />
                ) : (
                  <span className="text-xs text-white font-medium">{profile?.displayName || profile?.fullName || '-'}</span>
                )}
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Username (Login ID)</span>
                <span className="text-xs text-slate-300 font-mono">{profile?.username || 'admin'}</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Email Address</span>
                <span className="text-xs text-slate-300 font-mono flex items-center gap-2">
                  <Mail size={13} className="text-slate-500" />
                  {profile?.email || 'admin@orion.network'}
                </span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Job Title</span>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={jobTitle}
                    onChange={e => setJobTitle(e.target.value)}
                    className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50 w-64"
                  />
                ) : (
                  <span className="text-xs text-white">{profile?.jobTitle || 'Platform Administrator'}</span>
                )}
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Department</span>
                {isEditingProfile ? (
                  <input 
                    type="text" 
                    value={department}
                    onChange={e => setDepartment(e.target.value)}
                    className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50 w-64"
                  />
                ) : (
                  <span className="text-xs text-white">{profile?.department || 'Executive Operations'}</span>
                )}
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Phone Number</span>
                {isEditingProfile ? (
                  <input 
                    type="tel" 
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="bg-white/[0.05] border border-white/[0.1] rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500/50 w-64"
                  />
                ) : (
                  <span className="text-xs text-white font-mono">{profile?.phone || '+1 (555) 019-2831'}</span>
                )}
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Role & Security Clearance</span>
                <span className="text-xs text-sky-400 font-mono capitalize font-semibold">{profile?.role?.replace('_', ' ') || 'Platform Admin'}</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Assigned Organization</span>
                <span className="text-xs text-white font-medium">{organization?.name || profile?.organizationName || 'ORION_PLATFORM'}</span>
              </div>
            </div>
          </div>
        );

      case 'organization':
        return (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-600/20 border border-sky-500/30 flex items-center justify-center">
                  <Building2 size={24} className="text-sky-400" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-white">{organization?.name || 'ORION_PLATFORM'}</h2>
                  <p className="text-xs text-slate-400">{organization?.industry || 'Global Supply Chain & Enterprise Intelligence'}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Active Enterprise Workspace
                </span>
                <p className="text-[10px] text-slate-500 mt-1 font-mono">Managed by Platform Administration</p>
              </div>
            </div>

            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Organization Details</span>
                {isAdmin && (
                  <button 
                    onClick={() => setActiveSection('admin_orgs')}
                    className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    Open Administration →
                  </button>
                )}
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Organization ID</span>
                <span className="text-xs text-slate-300 font-mono">{organization?.id || 'ORION_PLATFORM'}</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Industry</span>
                <span className="text-xs text-white">{organization?.industry || 'Supply Chain / Logistics'}</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Country / Region</span>
                <span className="text-xs text-white flex items-center gap-1.5">
                  <Globe size={13} className="text-slate-500" />
                  {organization?.country || 'Global Enterprise'}
                </span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Base Currency</span>
                <span className="text-xs text-sky-400 font-mono font-semibold">{organization?.currency || 'USD ($)'}</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">System Timezone</span>
                <span className="text-xs text-slate-300 font-mono">{organization?.timezone || 'Asia/Kolkata (GMT+05:30)'}</span>
              </div>

              <div className="px-5 py-3 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Workspace Status</span>
                <span className="text-xs text-emerald-400 font-semibold uppercase tracking-wider">● Operational</span>
              </div>
            </div>
          </div>
        );

      case 'wallpaper_studio':
        return <UserWallpaperStudio />;

      case 'appearance':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Interface Theme & Controls</span>
              </div>

              {/* Theme Selection */}
              <div className="p-5 flex flex-col gap-3">
                <span className="text-xs font-medium text-slate-300">Theme Preference</span>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'system'].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => updateSettings({ theme: t as any })}
                      className={cn(
                        "p-3 rounded-xl border text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                        (settings?.theme || 'dark') === t 
                          ? "bg-sky-500/15 border-sky-500/40 text-sky-400 shadow-sm" 
                          : "bg-white/[0.03] border-white/[0.08] text-slate-400 hover:text-white hover:bg-white/[0.06]"
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

              {/* Reduced Motion Toggle */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Reduced Motion</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Disables heavy CSS animations and motion transitions across OS windows.</div>
                </div>
                <div className="flex bg-white/[0.05] border border-white/[0.08] rounded-lg p-1 gap-1 w-36 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => updateSettings({ reducedMotion: false })}
                    className={cn(
                      "flex-1 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer",
                      !settings?.reducedMotion ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                  >
                    OFF
                  </button>
                  <button 
                    type="button" 
                    onClick={() => updateSettings({ reducedMotion: true })}
                    className={cn(
                      "flex-1 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer",
                      settings?.reducedMotion ? "bg-sky-500/20 text-sky-400 shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                  >
                    ON
                  </button>
                </div>
              </div>

              {/* Brightness Slider */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">Software Brightness Overlay</span>
                  <span className="text-xs font-mono text-sky-400">{localSettings.brightness ?? 100}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={localSettings.brightness ?? 100}
                  onChange={(e) => setLocalSettings(prev => ({...prev, brightness: parseInt(e.target.value)}))}
                  onMouseUp={(e) => updateSettings({ brightness: parseInt((e.target as HTMLInputElement).value) })}
                  className="w-full h-1.5 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-sky-400"
                />
              </div>

              {/* Display Preferences Controls Component */}
              <div className="p-5">
                <DisplayPreferencesControls />
              </div>

              {/* Wallpaper Studio Quick Link */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white flex items-center gap-1.5">
                    <SparklesIcon size={14} className="text-sky-400" />
                    <span>Orion Wallpaper Studio</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Customize, generate with AI, and configure live desktop motion engine.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveSection('wallpaper_studio')}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-400 text-xs font-semibold transition-all cursor-pointer"
                >
                  Open Studio →
                </button>
              </div>
            </div>
          </div>
        );

      case 'desktop':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Desktop & Dock Behavior</span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Desktop Grid Snap</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Automatically align desktop shortcuts and VFS items to grid cells.</div>
                </div>
                <span className="text-xs text-sky-400 font-mono font-semibold">ON (80px Grid)</span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Orion Dock Magnification</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Enlarges dock icons smoothly when hovering over the bottom dock bar.</div>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-semibold">ENABLED</span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Remember Window Positions</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Persists window geometry, size, and maximized states across sessions.</div>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-semibold">ENABLED</span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Default Workspace Workspace</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Primary workspace opened upon initial system boot.</div>
                </div>
                <span className="text-xs text-slate-300 font-mono">Control Tower (Operations)</span>
              </div>
            </div>
          </div>
        );

      case 'time_region':
        return (
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-[#12151a] border border-white/[0.08] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-mono tracking-widest text-slate-500">Live Operating Clock</span>
                <h2 className="text-2xl font-mono font-bold text-sky-400 tracking-tight mt-1">{currentTimeStr || '12:00:00'}</h2>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{localSettings.timezone || 'Asia/Kolkata'} · IST (GMT+05:30)</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-300 font-medium">Regional Locale</span>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{localSettings.locale || 'en-IN'} (India)</p>
              </div>
            </div>

            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Localization Parameters</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1.5">Currency</label>
                  <SearchableDropdown 
                    value={localSettings.currency || 'INR'} 
                    options={currencyOptions} 
                    onChange={(val) => setLocalSettings(prev => ({...prev, currency: val}))} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1.5">Timezone</label>
                  <SearchableDropdown 
                    value={localSettings.timezone || 'Asia/Kolkata'} 
                    options={timezones} 
                    onChange={(val) => setLocalSettings(prev => ({...prev, timezone: val}))} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1.5">Language & Locale</label>
                  <SearchableDropdown 
                    value={localSettings.locale || 'en-IN'} 
                    options={locales} 
                    onChange={(val) => setLocalSettings(prev => ({...prev, locale: val}))} 
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1.5">Date Format</label>
                  <div className="p-2.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-xs font-mono text-slate-300">
                    DD/MM/YYYY (25/09/2026)
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.06]">
                <SettingsCurrencyConverter currencyOptions={currencyOptions} defaultCurrency={localSettings.currency} />
              </div>
            </div>

            {/* Embedded World Clock Panel */}
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden p-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Global Network Time Matrix</h3>
              <div className="h-[380px] rounded-xl overflow-hidden border border-white/[0.06]">
                <TimeWorldPanel />
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Audio & System Notifications</span>
              </div>

              {/* Master UI Sound */}
              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Master Interface Sounds</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Plays subtle acoustic feedback for window actions, alerts, and notifications.</div>
                </div>
                <div className="flex bg-white/[0.05] border border-white/[0.08] rounded-lg p-1 gap-1 w-36 shrink-0">
                  <button 
                    type="button" 
                    onClick={() => { setLocalSettings(prev => ({...prev, soundEnabled: false})); updateSettings({ soundEnabled: false }); }}
                    className={cn(
                      "flex-1 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer",
                      !localSettings.soundEnabled ? "bg-white/10 text-white shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                  >
                    OFF
                  </button>
                  <button 
                    type="button" 
                    onClick={() => { setLocalSettings(prev => ({...prev, soundEnabled: true})); updateSettings({ soundEnabled: true }); }}
                    className={cn(
                      "flex-1 py-1 text-[11px] font-semibold rounded transition-colors cursor-pointer",
                      localSettings.soundEnabled ? "bg-sky-500/20 text-sky-400 shadow-sm" : "text-slate-400 hover:text-white"
                    )}
                  >
                    ON
                  </button>
                </div>
              </div>

              {/* Volume Slider */}
              <div className="p-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-white">System Volume Level</span>
                  <span className="text-xs font-mono text-sky-400">{localSettings.soundVolume ?? 75}%</span>
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

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Critical Inventory & PO Banners</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">High-priority toasts when stockouts or procurement exceptions trigger.</div>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-semibold">ALWAYS ON</span>
              </div>
            </div>
          </div>
        );

      case 'privacy_security':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Authentication & Identity Governance</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Authentication Engine</span>
                <span className="text-xs text-emerald-400 font-semibold font-mono flex items-center gap-1.5">
                  <CheckCircle2 size={13} /> Firebase Authentication (Authoritative)
                </span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Active Security Role</span>
                <span className="text-xs text-sky-400 font-mono font-semibold uppercase">{profile?.role || 'Platform Admin'}</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Database Authority</span>
                <span className="text-xs text-slate-300 font-mono">Cloud Firestore (Tenant Isolated)</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Active Environment</span>
                <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${dataMode === 'real' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/10 text-amber-400 border-amber-500/30'}`}>
                  {dataMode === 'real' ? 'LIVE PRODUCTION' : 'DEMO SANDBOX'}
                </span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Diagnostic Telemetry</span>
                <span className="text-xs text-slate-400 font-mono">Mandatory System Audit Active</span>
              </div>
            </div>
          </div>
        );

      case 'ai_automation':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">ORION AI & Autopilot Policies</span>
                <span className="text-[10px] text-purple-400 font-mono">Gemini LLM Active</span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">AI Operating Mode</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Determines whether AI provides suggestions, prepares drafts, or executes within policy.</div>
                </div>
                <span className="text-xs font-mono font-semibold text-purple-400 px-2.5 py-1 rounded bg-purple-500/15 border border-purple-500/30">
                  Level 2 — Recommend
                </span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Human Approval Threshold</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Consequential actions above this limit require explicit human authorization.</div>
                </div>
                <span className="text-xs font-mono text-slate-200 font-semibold">$10,000 USD</span>
              </div>

              <div className="px-5 py-4 flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-white">Vector Memory Retention</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Indexes operational decisions and outcomes into vector memory for continuous learning.</div>
                </div>
                <span className="text-xs text-emerald-400 font-mono font-semibold">ACTIVE</span>
              </div>
            </div>
          </div>
        );

      case 'network':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02]">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Enterprise Network & Edge Connectivity</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Edge Worker Target</span>
                <span className="text-xs text-sky-400 font-mono font-semibold">orion-9.ayushprakash0021.workers.dev</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Connection Status</span>
                <span className="text-xs text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  CONNECTED (Latency: 14ms)
                </span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Protocol & Transport</span>
                <span className="text-xs text-slate-300 font-mono">WebSockets LIVE / HTTP 2.0 SPA</span>
              </div>
            </div>
          </div>
        );

      case 'storage':
        return (
          <div className="space-y-6">
            <div className="bg-[#12151a] border border-white/[0.08] rounded-2xl overflow-hidden divide-y divide-white/[0.06]">
              <div className="px-5 py-3.5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Virtual File System & Cloud Storage</span>
                <button 
                  onClick={() => wm?.openApplication('file-manager')}
                  className="text-xs text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 cursor-pointer"
                >
                  Open File Explorer →
                </button>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Storage Provider</span>
                <span className="text-xs text-slate-300 font-mono">Cloud Firestore VFS + Cloud Storage</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Root Directory</span>
                <span className="text-xs text-slate-300 font-mono">vfs://orion/workspace</span>
              </div>

              <div className="px-5 py-3.5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">Desktop Items Collection</span>
                <span className="text-xs text-emerald-400 font-mono font-semibold">desktop_items (Persisted)</span>
              </div>
            </div>
          </div>
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

      {/* ─── MAIN CONTENT PANEL ─── */}
      <div className="flex-1 flex flex-col overflow-hidden relative bg-[#0c0e11] max-w-[800px] mx-auto px-4">
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar relative">
          {renderSectionContent()}
        </div>
        
        {/* Footer Action Bar for non-admin sections */}
        {!isAdminSection && (
          <div className="p-4 px-6 border-t border-white/[0.08] bg-[#12151a]/90 backdrop-blur-xl shrink-0 flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">
              Environment: <strong className="text-slate-200">{dataMode === 'real' ? 'LIVE' : 'DEMO'}</strong>
            </span>
            <div className="flex items-center gap-3">
              {isSaved && (
                <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1.5 mr-2 animate-in fade-in">
                  <CheckCircle2 size={14} /> Saved
                </span>
              )}
              <button 
                onClick={handleResetSettings}
                type="button"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-300 border border-white/[0.08] rounded-xl hover:bg-white/[0.06] hover:text-white transition-colors cursor-pointer"
              >
                <RotateCcw size={13} /> Reset
              </button>
              <button 
                onClick={handleSaveSettings}
                disabled={isSaving}
                type="button"
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-black bg-sky-400 hover:bg-sky-300 rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-sm"
              >
                <Save size={14} />
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
