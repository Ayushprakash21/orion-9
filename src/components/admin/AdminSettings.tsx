import React, { useState, useEffect } from 'react';
import { Save, Loader2, Key, User, Database, Sparkles, Monitor } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { Navigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { DisplayPreferencesControls } from '../../os/DisplayPreferences';
import { DatabaseControlCenter } from './DatabaseControlCenter';
import { AdminDemoData } from './AdminDemoData';
import { cn } from '../../lib/utils';

export const AdminSettings: React.FC = () => {
  const { hasRole, currentUser, signOut } = useAuth();
  const { showToast } = useToast();
  const { settings, updateSettings } = useSupplyChain();
  
  const [activeTab, setActiveTab] = useState<'credentials' | 'database' | 'synthetic' | 'display'>('credentials');
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    { id: 'database' as const, name: 'Database & Environment', icon: Database },
    { id: 'synthetic' as const, name: 'Synthetic Data Engine', icon: Sparkles },
    { id: 'display' as const, name: 'Display & Preferences', icon: Monitor },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-6xl h-full flex flex-col p-4 md:p-6 overflow-y-auto">
      <div>
        <h1 className="text-2xl font-bold font-mono tracking-tight text-white mb-1">
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
                    ? "bg-os-surface text-cyan-400 border border-os-border font-bold shadow-xs"
                    : "text-os-text-secondary hover:text-white hover:bg-os-surface/50"
                )}
              >
                <Icon size={16} className={cn(isActive ? "text-cyan-400" : "text-os-text-muted")} />
                {item.name}
              </button>
            );
          })}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'credentials' && (
            <form onSubmit={handleSave} className="p-6 rounded-xl border border-os-border bg-os-surface/40 space-y-6">
              <div>
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white mb-2">
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
                      className="w-full bg-os-surface border border-os-border rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
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
                      className="w-full bg-os-surface border border-os-border rounded-lg p-2.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 border-t border-os-border flex justify-end">
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2 bg-cyan-600 text-white rounded-lg font-mono text-xs font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50 cursor-pointer shadow-md shadow-cyan-950"
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
            <section className="p-6 rounded-xl border border-os-border bg-os-surface/40 space-y-4">
              <div className="mb-4">
                <h2 className="text-sm font-mono font-bold uppercase tracking-wider text-white">
                  Display & Accessibility Preferences
                </h2>
                <p className="text-xs text-os-text-secondary mt-1">
                  Configure visual densities, scaling, high-contrast themes, and motion reductions for your administrator session.
                </p>
              </div>
              <DisplayPreferencesControls userId={currentUser?.id} compact={false} />
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
