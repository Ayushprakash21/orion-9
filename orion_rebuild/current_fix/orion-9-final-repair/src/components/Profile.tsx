import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../store/AuthContext';
import { useToast } from '../store/ToastContext';
import { userRepository } from '../repositories/UserRepository';
import { 
  User, Building2, Shield, Mail, Phone, Calendar, 
  Globe, Clock, DollarSign, CheckCircle2, ArrowRight, ExternalLink,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';

export const Profile = ({ initialTab = 'profile' }: { initialTab?: 'profile' | 'organization' | 'preferences' | 'security' }) => {
  const { profile, organization, hasRole, refreshSession } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'organization' | 'preferences' | 'security'>(initialTab);
  
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);
  
  // Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [fullName, setFullName] = useState(profile?.fullName || '');
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [jobTitle, setJobTitle] = useState(profile?.jobTitle || '');
  const [department, setDepartment] = useState(profile?.department || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatarUrl || null);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const isAdmin = hasRole(['platform_admin']) || profile?.role === 'platform_admin';

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;
    try {
      await userRepository.updateProfile(profile.id, {
        fullName,
        displayName,
        jobTitle,
        department,
        phone,
        avatarUrl
      });
      await refreshSession();
      showToast('Profile updated successfully', 'success');
      setIsEditingProfile(false);
    } catch (e) {
      showToast('Failed to update profile', 'error');
    }
  };

  if (!profile) {
    return <div className="p-8 text-os-text-secondary">Loading profile...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-os-bg text-os-text-primary">
      <div className="shrink-0 px-4 sm:px-6 lg:px-8 xl:px-10 py-6 border-b border-os-border box-border w-full max-w-[1400px] mx-auto">
        <h1 className="text-2xl font-light tracking-tight mb-6">Account & Settings</h1>
        
        <div className="flex space-x-6 border-b border-os-border/40">
          <button 
            id="tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'profile' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Profile
            {activeTab === 'profile' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            id="tab-organization"
            onClick={() => setActiveTab('organization')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'organization' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Organization
            {activeTab === 'organization' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            id="tab-preferences"
            onClick={() => setActiveTab('preferences')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'preferences' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Preferences
            {activeTab === 'preferences' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
          <button 
            id="tab-security"
            onClick={() => setActiveTab('security')}
            className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === 'security' ? 'text-os-text-primary font-semibold' : 'text-os-text-secondary hover:text-os-text-primary'}`}
          >
            Security
            {activeTab === 'security' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t" />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 box-border w-full max-w-[1400px] mx-auto">
        <div className="max-w-4xl">
          {/* TAB 1: PROFILE */}
          {activeTab === 'profile' && (
            <div className="animate-in fade-in duration-300">
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-xl font-medium mb-1">Personal Profile</h2>
                  <p className="text-sm text-os-text-secondary">Manage your personal identification and contact details.</p>
                </div>
                {!isEditingProfile ? (
                  <button 
                    id="btn-edit-profile"
                    onClick={() => setIsEditingProfile(true)} 
                    className="px-4 py-2 bg-os-surface text-os-text-primary rounded text-sm font-medium hover:bg-os-surface-active transition-colors border border-os-border"
                  >
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button 
                      onClick={() => setIsEditingProfile(false)} 
                      className="px-4 py-2 text-os-text-secondary text-sm hover:text-os-text-primary transition-colors"
                    >
                      Cancel
                    </button>
                    <button 
                      id="btn-save-profile"
                      onClick={saveProfile} 
                      className="px-4 py-2 bg-os-border-inverse text-os-text-primary-inverse rounded text-sm font-medium hover:opacity-90 transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>

              {/* Avatar Section */}
              <div className="flex items-center gap-6 mb-8 p-6 bg-os-bg border border-os-border rounded-xl">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full bg-os-surface-elevated border border-os-border overflow-hidden flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <User size={32} className="text-os-text-muted" />
                    )}
                  </div>
                  {isEditingProfile && (
                    <button 
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Camera size={20} className="text-white" />
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
                  <h3 className="text-lg font-medium">{profile.fullName}</h3>
                  <p className="text-sm text-os-text-secondary">@{profile.username} · {profile.role}</p>
                  <p className="text-xs text-os-text-muted mt-1">
                    Assigned Organization: <span className="text-blue-400 font-medium">{organization?.name || profile.organizationName || 'None'}</span>
                  </p>
                </div>
              </div>

              {/* Personal Details Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-os-bg border border-os-border rounded-xl p-6">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Full Name</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={fullName} 
                      onChange={e => setFullName(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.fullName || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Username (Login ID)</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-secondary font-mono">
                    {profile.username}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Display Name</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={e => setDisplayName(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.displayName || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Email Address</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-secondary flex items-center gap-2">
                    <Mail size={14} className="text-os-text-muted" />
                    {profile.email || '-'}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Job Title</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={jobTitle} 
                      onChange={e => setJobTitle(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.jobTitle || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Department</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={department} 
                      onChange={e => setDepartment(e.target.value)} 
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary">{profile.department || '-'}</div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Phone Number</label>
                  {isEditingProfile ? (
                    <input 
                      type="text" 
                      value={phone} 
                      onChange={e => setPhone(e.target.value)} 
                      placeholder="+1 (555) 000-0000"
                      className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border" 
                    />
                  ) : (
                    <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary flex items-center gap-2">
                      <Phone size={14} className="text-os-text-muted" />
                      {profile.phone || '-'}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Role</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-blue-400 font-medium capitalize flex items-center gap-2">
                    <Shield size={14} />
                    {profile.role.replace('_', ' ')}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Assigned Organization</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded text-os-text-primary font-medium flex items-center justify-between">
                    <div className="flex items-center gap-2 truncate">
                      <Building2 size={14} className="text-os-text-muted shrink-0" />
                      <span className="truncate">{organization?.name || profile.organizationName || 'Unassigned'}</span>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setActiveTab('organization')} 
                      className="text-xs text-blue-400 hover:text-blue-300 ml-2 shrink-0 cursor-pointer"
                    >
                      View Workspace →
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Account Status</label>
                  <div className="p-2.5 text-sm bg-os-surface border border-os-border rounded flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${profile.status === 'inactive' ? 'bg-neutral-500' : 'bg-emerald-400'}`} />
                    <span className={`capitalize font-medium ${profile.status === 'inactive' ? 'text-neutral-400' : 'text-emerald-400'}`}>
                      {profile.status || 'Active'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORGANIZATION (READ-ONLY ASSIGNED BY ADMIN) */}
          {activeTab === 'organization' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-medium mb-1">Organization Profile</h2>
                  <p className="text-sm text-os-text-secondary">Organization workspace assigned by the system administrator.</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-os-text-secondary px-3 py-1.5 border border-os-border bg-os-bg rounded-md flex items-center gap-1.5 font-medium">
                    <Shield size={12} className="text-blue-400" /> Managed by Platform Admin (Read-Only)
                  </div>
                  {isAdmin && (
                    <Link
                      to="/admin/organizations"
                      className="text-xs text-blue-400 hover:text-blue-300 px-3 py-1.5 border border-blue-900/40 bg-blue-950/20 rounded-md flex items-center gap-1.5 transition-colors"
                    >
                      <ExternalLink size={12} /> Admin Console
                    </Link>
                  )}
                </div>
              </div>

              {!organization ? (
                <div className="p-12 border border-os-border rounded-xl bg-os-bg flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-full bg-os-surface border border-os-border flex items-center justify-center mb-4">
                    <Building2 size={24} className="text-os-text-muted" />
                  </div>
                  <h3 className="text-lg font-medium text-os-text-primary mb-2">No organization assigned</h3>
                  <p className="text-os-text-secondary text-sm max-w-sm">
                    You are not currently assigned to any organization. Please contact your platform administrator to be assigned to an enterprise workspace.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Organization Card Banner */}
                  <div className="p-6 bg-os-bg border border-os-border rounded-xl flex flex-col sm:flex-row items-start sm:items-center gap-6">
                    {/* Organization Logo Container */}
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#1A1A1A] to-[#0D0D0D] border border-os-border overflow-hidden flex items-center justify-center shadow-lg">
                        {organization.logoUrl || organization.logo ? (
                          <img 
                            src={organization.logoUrl || organization.logo || ''} 
                            alt={organization.name} 
                            className="w-full h-full object-contain p-2" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center text-center">
                            <Building2 size={28} className="text-blue-400 mb-1" />
                            <span className="text-[9px] uppercase tracking-wider font-semibold text-os-text-muted">
                              {organization.name.substring(0, 3).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-3 mb-1">
                        <h3 className="text-2xl font-light tracking-tight text-os-text-primary truncate">{organization.name}</h3>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {organization.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="text-sm text-os-text-secondary mb-2">{organization.industry || 'Supply Chain / Logistics'}</p>
                      <p className="text-xs text-os-text-muted flex items-center gap-2">
                        <span>Workspace ID: <span className="font-mono text-os-text-muted">{organization.id}</span></span>
                      </p>
                    </div>
                  </div>

                  {/* Read-Only Parameters Grid */}
                  <div className="bg-os-bg border border-os-border rounded-xl p-6">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-os-text-muted mb-4">Workspace Details</h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">
                          Organization Name
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary font-medium">
                          {organization.name}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">
                          Industry
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary">
                          {organization.industry || 'Supply Chain / Logistics'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <Globe size={12} className="text-os-text-muted" /> Country
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary">
                          {organization.country || 'Global'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <DollarSign size={12} className="text-os-text-muted" /> Currency
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary font-mono">
                          {organization.currency || 'USD'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <Clock size={12} className="text-os-text-muted" /> Timezone
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-os-text-primary font-mono">
                          {organization.timezone || 'UTC'}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold flex items-center gap-1.5">
                          <CheckCircle2 size={12} className="text-os-text-muted" /> Status
                        </label>
                        <div className="p-3 text-sm bg-os-surface border border-os-border rounded-md text-emerald-400 capitalize font-medium">
                          {organization.status === 'active' ? 'Active' : 'Inactive'}
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-os-border flex items-center justify-between text-xs text-os-text-muted">
                      <span>Assigned to user: <strong className="text-os-text-secondary">{profile.fullName}</strong> (@{profile.username})</span>
                      <span className="italic">Changes must be requested through your Platform Administrator</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-1">Preferences</h2>
                <p className="text-sm text-os-text-secondary">Manage display, telemetry, and notification settings.</p>
              </div>

              <div className="bg-os-bg border border-os-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Interface Theme</h4>
                    <p className="text-xs text-os-text-secondary">Orion SCM OS Enterprise Dark (Fixed)</p>
                  </div>
                  <span className="px-3 py-1 bg-os-surface border border-os-border rounded text-xs text-os-text-secondary">Dark Standard</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Real-time Telemetry Updates</h4>
                    <p className="text-xs text-os-text-secondary">Live inventory updates and alert pushes</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-medium">Enabled</span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Data Density</h4>
                    <p className="text-xs text-os-text-secondary">High-density tabular mode for operational dashboards</p>
                  </div>
                  <span className="px-3 py-1 bg-os-surface border border-os-border rounded text-xs text-os-text-secondary">Compact</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SECURITY */}
          {activeTab === 'security' && (
            <div className="animate-in fade-in duration-300 space-y-6">
              <div>
                <h2 className="text-xl font-medium mb-1">Account Security</h2>
                <p className="text-sm text-os-text-secondary">Credentials, authentication sessions, and identity policies.</p>
              </div>

              <div className="bg-os-bg border border-os-border rounded-xl p-6 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Password</h4>
                    <p className="text-xs text-os-text-secondary">Managed locally for demo session</p>
                  </div>
                  <span className="text-xs text-blue-400 font-mono">••••••••</span>
                </div>

                <div className="flex items-center justify-between pb-4 border-b border-os-border">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Authentication Level</h4>
                    <p className="text-xs text-os-text-secondary">Role-based Access Control (RBAC)</p>
                  </div>
                  <span className="px-3 py-1 bg-blue-950/20 border border-blue-900/30 rounded text-xs text-blue-400 font-medium capitalize">
                    {profile.role.replace('_', ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-os-text-primary">Active Workspace Assignment</h4>
                    <p className="text-xs text-os-text-secondary">Scoped to {organization?.name || 'No Organization'}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-mono">Verified</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
