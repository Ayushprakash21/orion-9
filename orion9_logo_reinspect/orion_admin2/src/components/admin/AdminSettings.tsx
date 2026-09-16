import React, { useState, useEffect } from 'react';
import { Save, Loader2, Key, User } from 'lucide-react';
import { useToast } from '../../store/ToastContext';
import { useAuth } from '../../store/AuthContext';
import { Navigate } from 'react-router-dom';
import { userService } from '../../services/userService';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { DisplayPreferencesControls } from '../../os/DisplayPreferences';

export const AdminSettings = () => {
  const { hasRole, currentUser, signOut } = useAuth();
  const { showToast } = useToast();
  const { settings, updateSettings } = useSupplyChain();
  
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
      showToast(err.message || 'Failed to update credentials', 'error');
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-4xl h-full flex flex-col">
      <div>
        <h1 className="text-2xl font-light tracking-tight mb-2">Administrator Profile</h1>
        <p className="text-sm text-os-text-secondary">Manage administrator credentials and account security.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Navigation/TOC */}
        <div className="space-y-1 lg:col-span-1">
          {[
            { id: 'credentials', name: 'Admin Credentials', icon: Key },
            { id: 'profile', name: 'Profile Details', icon: User },
          ].map((item) => (
            <button
              key={item.id}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors text-left text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface"
            >
              <item.icon size={16} />
              {item.name}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-2 space-y-6">

          <section className="p-6 rounded-lg border border-os-border bg-os-bg">
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary">Display & Accessibility</h2>
              <p className="text-xs text-os-text-secondary mt-2">Configure the ORION interface for this administrator account. These controls behave like operating-system display settings and remain independent of business data.</p>
            </div>
            <DisplayPreferencesControls userId={currentUser?.id} compact={false} />
          </section>

          <form onSubmit={handleSave} className="p-6 rounded-lg border border-os-border bg-os-bg space-y-6">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-os-text-primary mb-4">Admin Credentials</h2>
              <p className="text-xs text-os-text-secondary mb-4">
                Updating your username or password will update your Supabase profile and require logging in again.
              </p>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">Admin Username</label>
                  <input 
                    type="text"
                    required
                    value={adminId}
                    onChange={(e) => setAdminId(e.target.value)}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-wider text-os-text-muted font-semibold">New Password (Leave blank to keep current)</label>
                  <input 
                    type="password"
                    placeholder="Enter new password (min. 8 characters)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-os-surface border border-os-border rounded p-2.5 text-sm text-os-text-primary focus:outline-none focus:border-os-border"
                  />
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-os-border flex justify-end">
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded font-medium text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save size={16} />}
                {isSaving ? 'Saving...' : 'Update & Log Out'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
