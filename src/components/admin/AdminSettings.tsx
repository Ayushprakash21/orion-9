import React, { useState, useEffect } from 'react';
import { Save, Loader2, Key, User, Database, Sparkles, Monitor, Globe, ShieldCheck, Lock } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { Navigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { DisplayPreferencesControls } from '../../os/DisplayPreferences';
import { DatabaseControlCenter } from './DatabaseControlCenter';
import { AdminDemoData } from './AdminDemoData';
import { cn } from '../../lib/utils';
import { useI18n } from '../../store/LanguageContext';
import { dbManager } from '../../core/database/DatabaseConnectionManager';
import {
  userPersistenceService,
  OrganizationSettingsPolicy,
} from '../../services/userPersistenceService';
import {
  DISPLAY_SCALE_VALUES,
  DOCK_POSITION_VALUES,
  FONT_FAMILY_VALUES,
  TEXT_SIZE_VALUES,
} from '../../services/preferences/PreferenceResolutionEngine';

export const AdminSettings: React.FC = () => {
  const { hasRole, currentUser, signOut } = useAuth();
  const { showToast } = useToast();
  const { settings, updateSettings } = useSupplyChain();
  const { locale, setOrganizationDefaultLanguage, languages } = useI18n();
  
  const [activeTab, setActiveTab] = useState<'credentials' | 'database' | 'synthetic' | 'display' | 'localization'>('credentials');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const orgId = currentUser?.organizationId || 'ORION_PLATFORM';
  const activeEnv = dbManager.getEnvironment();
  const [orgPolicy, setOrgPolicy] = useState<OrganizationSettingsPolicy>(() =>
    userPersistenceService.getOrganizationPolicyLocalSync(orgId, activeEnv) || {
      organizationId: orgId,
      tenantId: orgId,
      schemaVersion: 3,
      revision: 0,
      updatedAt: new Date().toISOString(),
      defaultTheme: 'system',
      defaultFontFamily: 'ROBOTO',
      defaultDisplayScale: 100,
      defaultTextSize: 100,
      defaultDockPosition: 'bottom',
      defaultLanguage: locale || 'en',
      enforceTheme: false,
      enforceFont: false,
      enforceScale: false,
      enforceDock: false,
      enforceLanguage: false,
    }
  );
  const [orgPolicyStatus, setOrgPolicyStatus] = useState<string>('');

  useEffect(() => {
    let mounted = true;
    userPersistenceService.getOrganizationPolicy(orgId, activeEnv, { forceCloud: activeEnv !== 'DEMO' }).then((pol) => {
      if (mounted && pol) setOrgPolicy(pol);
    }).catch(() => {});
    const unsub = userPersistenceService.onOrganizationPolicyChange((pol) => {
      if (pol.organizationId === orgId) setOrgPolicy(pol);
    });
    return () => {
      mounted = false;
      unsub();
    };
  }, [orgId, activeEnv]);

  const handleSaveOrgPolicy = async (patch: Partial<OrganizationSettingsPolicy>) => {
    setOrgPolicyStatus('Saving organization policy...');
    const saved = await userPersistenceService.saveOrganizationPolicy(
      orgId,
      { ...patch, updatedBy: currentUser?.id || 'admin' },
      activeEnv
    );
    setOrgPolicy(saved);
    setOrgPolicyStatus(
      saved.cloudSynced
        ? `Organization policy synced to cloud (${orgId})`
        : saved.syncStatus === 'FAILED'
          ? `Saved locally — cloud sync failed: ${saved.syncError || 'Check permissions'}`
          : `Saved to ${orgId} (${activeEnv} mode)`
    );
  };

  useEffect(() => {
    if (currentUser) {
      setAdminId(currentUser.username || '');
    }
  }, [currentUser]);

  // Strictly enforce platform_admin or organization_admin access
  if (!hasRole(['platform_admin', 'organization_admin'])) {
    return <Navigate to="/admin" replace />;
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminId.trim()) {
      showToast('Admin ID (Username) is required', 'error');
      return;
    }

    if (!currentUser?.id) {
      showToast('Admin user session is not available', 'error');
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update username
      await userService.updateUser(currentUser.id, {
        username: adminId.trim(),
      });

      // 2. If new password provided, reset password
      if (password.trim()) {
        if (password.trim().length < 8) {
          showToast('Password must be at least 8 characters long', 'error');
          setIsSaving(false);
          return;
        }
        await userService.resetPassword(currentUser.id, password.trim());
      }

      showToast('Administrator credentials updated successfully. Please log in again.', 'success');
      
      setTimeout(async () => {
        try {
          await signOut();
        } catch (err) {
          console.warn('Signout warning:', err);
        }
      }, 1500);
      
    } catch (err: any) {
      showToast(err?.message || 'Failed to update credentials', 'error');
      setIsSaving(false);
    }
  };

  const navItems = [
    { id: 'credentials' as const, name: 'Admin Credentials', icon: Key },
    { id: 'localization' as const, name: 'Organization Localization', icon: Globe },
    { id: 'database' as const, name: 'Database & Environment', icon: Database },
    { id: 'synthetic' as const, name: 'Synthetic Data Engine', icon: Sparkles },
    { id: 'display' as const, name: 'Display & Preferences', icon: Monitor },
  ];

  return (
    <div className="w-full max-w-[1440px] mx-auto space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-os-text-primary mb-1">
          Administration Settings & Environment
        </h1>
        <p className="text-xs text-os-text-secondary">
          Manage administrator credentials, database operating environments, synthetic simulation engines, and system preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation/TOC */}
        <div className="space-y-1 lg:col-span-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 text-xs font-mono font-medium rounded-lg transition-colors text-left cursor-pointer",
                  isActive
                    ? "bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] border border-[var(--orion-border-strong)] font-bold shadow-xs"
                    : "text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover"
                )}
              >
                <Icon size={16} className={cn(isActive ? "text-current" : "text-os-text-muted")} />
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'credentials' && (
            <form onSubmit={handleSave} className="p-6 rounded-xl border border-os-border bg-os-surface space-y-6">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-os-text-primary mb-2">
                  Admin Account Credentials
                </h2>
                <p className="text-xs text-os-text-secondary mb-4">
                  Updating your username or password will update your Firebase Auth profile and require re-authenticating.
                </p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-os-text-muted font-semibold">
                      Admin Username
                    </label>
                    <input 
                      type="text"
                      required
                      value={adminId}
                      onChange={(e) => setAdminId(e.target.value)}
                      className="w-full bg-os-input-bg border border-os-border rounded-lg p-2.5 text-xs font-mono text-os-text-primary focus:outline-none focus:border-[var(--orion-focus-ring)]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-mono tracking-wider text-os-text-muted font-semibold">
                      New Password (Leave blank to keep current)
                    </label>
                    <input 
                      type="password"
                      placeholder="Enter new password (min. 8 characters)"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-os-input-bg border border-os-border rounded-lg p-2.5 text-xs font-mono text-os-text-primary focus:outline-none focus:border-[var(--orion-focus-ring)]"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-os-border flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] border border-[var(--orion-border-strong)] rounded-lg font-mono text-xs font-bold hover:bg-[var(--orion-accent-hover)] transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Saving...' : 'Update & Log Out'}
                </button>
              </div>
            </form>
          )}

          {activeTab === 'database' && (
            <div className="rounded-xl border border-os-border bg-os-surface/20 p-2">
              <DatabaseControlCenter />
            </div>
          )}

          {activeTab === 'synthetic' && (
            <div className="rounded-xl border border-os-border bg-os-surface/20 p-2">
              <AdminDemoData />
            </div>
          )}

          {activeTab === 'display' && (
            <div className="space-y-6">
              <section className="p-6 rounded-xl border border-os-border bg-os-surface space-y-4">
                <div className="mb-4">
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-os-text-primary">
                    Personal Administrator Display & Accessibility Preferences
                  </h2>
                  <p className="text-xs text-os-text-secondary mt-1">
                    Stored on your user account (`user_preferences/{currentUser?.id || 'guest'}`) — follows your login across browsers and devices without affecting other users.
                  </p>
                </div>
                <DisplayPreferencesControls userId={currentUser?.id} compact={false} />
              </section>

              <section className="p-6 rounded-xl border border-os-border bg-os-surface space-y-5" data-testid="org-policy-defaults-section">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-os-text-primary flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[var(--orion-accent)]" />
                      Organization Display Defaults & Enforced Policies ({orgId})
                    </h2>
                    <p className="text-xs text-os-text-secondary mt-1">
                      Applies as organization defaults when users have not set a personal override. Checking Enforce locks the policy across all accounts in {orgId}.
                    </p>
                  </div>
                  {orgPolicyStatus && (
                    <span data-testid="org-policy-sync-status" className="text-[11px] font-mono px-2.5 py-1 rounded-md bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-[var(--orion-text-primary)]">
                      {orgPolicyStatus}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  {/* Org Default Theme + Enforce */}
                  <div className="p-4 rounded-xl bg-os-surface-elevated border border-os-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-os-text-primary">Default Org Theme</span>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--orion-warning)] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid="org-enforce-theme"
                          checked={Boolean(orgPolicy.enforceTheme)}
                          onChange={(e) => void handleSaveOrgPolicy({ enforceTheme: e.target.checked })}
                          className="accent-amber-400"
                        />
                        <Lock className="w-3 h-3" />
                        Enforce
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {(['light', 'dark', 'system'] as const).map((t) => (
                        <button
                          key={t}
                          type="button"
                          data-testid={`org-default-theme-${t}`}
                          onClick={() =>
                            void handleSaveOrgPolicy({
                              defaultTheme: t,
                              defaultAppearanceMode: t === 'light' ? 'light' : t === 'dark' ? 'dark' : 'auto',
                              defaultThemeId: t === 'light' ? 'silver' : 'graphite',
                            })
                          }
                          className={cn(
                            'py-2 rounded-lg border capitalize cursor-pointer',
                            orgPolicy.defaultTheme === t
                              ? 'border-[var(--orion-border-strong)] bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] font-semibold'
                              : 'border-os-border bg-os-surface text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Org Default Font + Enforce */}
                  <div className="p-4 rounded-xl bg-os-surface-elevated border border-os-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-os-text-primary">Default Org Font</span>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--orion-warning)] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid="org-enforce-font"
                          checked={Boolean(orgPolicy.enforceFont)}
                          onChange={(e) => void handleSaveOrgPolicy({ enforceFont: e.target.checked })}
                          className="accent-amber-400"
                        />
                        <Lock className="w-3 h-3" />
                        Enforce
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {FONT_FAMILY_VALUES.map((f) => (
                        <button
                          key={f}
                          type="button"
                          data-testid={`org-default-font-${f}`}
                          onClick={() => void handleSaveOrgPolicy({ defaultFontFamily: f })}
                          className={cn(
                            'py-2 rounded-lg border cursor-pointer',
                            orgPolicy.defaultFontFamily === f
                              ? 'border-[var(--orion-border-strong)] bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] font-semibold'
                              : 'border-os-border bg-os-surface text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
                          )}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Org Default Display Scale & Text Size + Enforce */}
                  <div className="p-4 rounded-xl bg-os-surface-elevated border border-os-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-os-text-primary">Default Org Display Scale</span>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--orion-warning)] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid="org-enforce-scale"
                          checked={Boolean(orgPolicy.enforceScale)}
                          onChange={(e) => void handleSaveOrgPolicy({ enforceScale: e.target.checked })}
                          className="accent-amber-400"
                        />
                        <Lock className="w-3 h-3" />
                        Enforce
                      </label>
                    </div>
                    <div className="grid grid-cols-5 gap-1.5">
                      {DISPLAY_SCALE_VALUES.map((sc) => (
                        <button
                          key={sc}
                          type="button"
                          data-testid={`org-default-scale-${sc}`}
                          onClick={() => void handleSaveOrgPolicy({ defaultDisplayScale: sc })}
                          className={cn(
                            'py-1.5 rounded-lg border cursor-pointer',
                            orgPolicy.defaultDisplayScale === sc
                              ? 'border-[var(--orion-border-strong)] bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] font-semibold'
                              : 'border-os-border bg-os-surface text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
                          )}
                        >
                          {sc}%
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-os-text-muted">Default Text Size</span>
                      <select
                        aria-label="Default Organization Text Size"
                        value={orgPolicy.defaultTextSize ?? 100}
                        onChange={(e) => void handleSaveOrgPolicy({ defaultTextSize: Number(e.target.value) as any })}
                        className="bg-os-surface border border-os-border rounded px-2 py-1 text-os-text-primary"
                      >
                        {TEXT_SIZE_VALUES.map((ts) => (
                          <option key={ts} value={ts}>{ts}%</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Org Default Dock + Enforce */}
                  <div className="p-4 rounded-xl bg-os-surface-elevated border border-os-border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-os-text-primary">Default Org Dock Position</span>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[var(--orion-warning)] font-semibold cursor-pointer">
                        <input
                          type="checkbox"
                          data-testid="org-enforce-dock"
                          checked={Boolean(orgPolicy.enforceDock)}
                          onChange={(e) => void handleSaveOrgPolicy({ enforceDock: e.target.checked })}
                          className="accent-amber-400"
                        />
                        <Lock className="w-3 h-3" />
                        Enforce
                      </label>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {DOCK_POSITION_VALUES.map((pos) => (
                        <button
                          key={pos}
                          type="button"
                          data-testid={`org-default-dock-${pos}`}
                          onClick={() => void handleSaveOrgPolicy({ defaultDockPosition: pos })}
                          className={cn(
                            'py-2 rounded-lg border capitalize cursor-pointer',
                            orgPolicy.defaultDockPosition === pos
                              ? 'border-[var(--orion-border-strong)] bg-[var(--orion-accent)] text-[var(--orion-on-accent,var(--os-text-primary-inverse))] font-semibold'
                              : 'border-os-border bg-os-surface text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface-hover'
                          )}
                        >
                          {pos}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'localization' && (
            <div className="p-6 rounded-xl border border-os-border bg-os-surface space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-os-text-primary">
                    Organization Default Language ({orgId})
                  </h2>
                  <label className="inline-flex items-center gap-1.5 text-xs text-[var(--orion-warning)] font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(orgPolicy.enforceLanguage)}
                      onChange={(e) => void handleSaveOrgPolicy({ enforceLanguage: e.target.checked })}
                      className="accent-[var(--orion-accent)]"
                    />
                    <Lock className="w-3.5 h-3.5" />
                    Enforce across organization
                  </label>
                </div>
                <p className="text-xs text-os-text-secondary mb-4">
                  Persisted to Firestore policy (`policies/org_os_policy_{orgId}`). Operators without an explicit personal language override inherit this default across sessions.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      type="button"
                      onClick={async () => {
                        setOrganizationDefaultLanguage(lang.code);
                        await handleSaveOrgPolicy({ defaultLanguage: lang.code });
                        showToast(`Default organization language set to ${lang.name} (${lang.nativeName}).`, 'success');
                      }}
                      className={cn(
                        "p-4 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer",
                        locale === lang.code
                          ? "bg-[var(--orion-accent-soft)] border-[var(--orion-accent)] text-os-text-primary"
                          : "bg-os-surface-elevated border-os-border text-os-text-secondary hover:text-os-text-primary hover:border-os-border-strong"
                      )}
                    >
                      <div>
                        <div className="font-semibold text-sm text-os-text-primary">{lang.nativeName}</div>
                        <div className="text-xs text-os-text-muted mt-0.5">{lang.name}</div>
                      </div>
                      <span className="text-xs font-mono uppercase px-2 py-0.5 rounded bg-[var(--orion-surface-hover)] border border-[var(--orion-border)] text-os-text-primary font-semibold">
                        {lang.code}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
