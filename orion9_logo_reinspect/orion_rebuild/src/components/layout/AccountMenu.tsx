import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { User, Settings, Building2, Shield, LogOut, ChevronDown, Sun, Moon } from 'lucide-react';
import { useOptionalWindowManager } from '../../os/WindowManagerContext';

export const AccountMenu = ({ closeSidebar }: { closeSidebar?: () => void }) => {
  const { profile, organization, hasRole, signOut, user } = useAuth();
  const { settings, updateSettings } = useSupplyChain();
  const navigate = useNavigate();
  const wm = useOptionalWindowManager();
  const openApplication = wm ? wm.openApplication : (id: string) => navigate(`/${id === 'settings' ? 'settings' : 'profile'}`);

  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = hasRole(['platform_admin']) || profile?.role === 'platform_admin' || user?.id === 'admin' || user?.id === 'local-admin';

  const handleAction = (path: string, appId?: string) => {
    setIsOpen(false);
    if (closeSidebar && window.innerWidth < 1024) closeSidebar();
    
    if (appId) {
      openApplication(appId);
    } else {
      navigate(path);
    }
  };

  const handleSignOut = async () => {
    const wasAdmin = isAdmin;
    try {
      await signOut();
    } catch (err) {
      console.warn('Sign out warning:', err);
    }
    if (wasAdmin) {
      navigate('/admin-login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  return (
    <div className="relative h-full flex items-center" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 h-full px-2 rounded-sm transition-colors cursor-pointer outline-none border border-transparent ${isOpen ? 'bg-os-surface-active' : 'hover:bg-os-surface-hover'}`}
      >
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded overflow-hidden shrink-0">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#00F2FE]/20 to-[#8B5CF6]/20 flex items-center justify-center border border-os-border">
                <span className="text-[10px] font-medium text-os-text-primary">
                  {profile?.displayName ? profile.displayName.substring(0,2).toUpperCase() : <User size={10} className="text-os-text-primary/60" />}
                </span>
              </div>
            )}
          </div>
          <span className="text-[12px] font-medium text-os-text-secondary hidden sm:block">{profile?.displayName || 'User'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="absolute top-8 right-0 w-64 bg-os-surface/95 backdrop-blur-2xl border border-os-border rounded-xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.02)] py-1.5 text-[13px] font-sans overflow-hidden origin-top-right animate-in fade-in slide-in-from-top-2 duration-200 z-[150]">
          <div className="px-4 py-2 border-b border-os-border mb-1.5">
            <p className="text-[13px] text-os-text-primary font-medium truncate">{profile?.fullName}</p>
            <p className="text-[11px] text-os-text-muted truncate">{profile?.email}</p>
          </div>
          
          <button onClick={() => handleAction('/profile', 'profile')} className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center gap-2">
            <User size={14} className="text-os-text-muted" /> Profile
          </button>
          
          {!isAdmin && (
            <button onClick={() => handleAction('/organization', 'settings')} className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center gap-2">
              <Building2 size={14} className="text-os-text-muted" /> Organization
            </button>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={() => { setIsOpen(false); navigate('/admin'); }}
              className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-accent text-os-text-primary transition-colors flex items-center gap-2 uppercase"
            >
              <Shield size={14} className="text-os-text-muted" /> Admin Panel
            </button>
          )}
          
          <div className="h-px bg-os-border my-1.5 mx-2" />
          
          
          <div className="px-4 py-1.5 flex flex-col gap-1.5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-os-text-primary"><Sun size={14} className="text-os-text-muted" /> Brightness</span>
              <span className="text-[10px] text-os-text-muted">{Math.round((settings?.brightness ?? 100))}</span>
            </div>
            <input 
              type="range" 
              min="20" max="100" 
              value={settings?.brightness ?? 100}
              onChange={(e) => updateSettings({ brightness: parseInt(e.target.value) })}
              className="w-full h-1 bg-os-surface-active rounded-lg appearance-none cursor-pointer focus:outline-none accent-os-accent"
            />
          </div>


          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              updateSettings({ trueTone: !settings?.trueTone });
            }} 
            className="w-full text-left px-4 py-1.5 hover:bg-os-surface-hover hover:text-os-text-primary text-os-text-primary transition-colors flex items-center justify-between"
          >
            <span className="flex items-center gap-2"><Sun size={14} className="text-os-text-muted" /> True Tone</span>
            <div className={`w-8 h-4 rounded-full transition-colors duration-200 flex items-center border border-os-border ${settings?.trueTone ? 'bg-os-accent' : 'bg-os-surface-active'}`}>
              <div className={`w-3 h-3 rounded-full bg-white transition-transform duration-200 shadow-sm ${settings?.trueTone ? 'translate-x-4' : 'translate-x-[2px]'}`} />
            </div>
          </button>

          <div className="h-px bg-os-border my-1.5 mx-2" />
          <div className="h-px bg-os-border my-1.5 mx-2" />
          
          <button onClick={handleSignOut} className="w-full text-left px-4 py-1.5 hover:bg-red-500/20 hover:text-red-400 text-os-text-primary transition-colors flex items-center gap-2">
            <LogOut size={14} className="text-os-text-muted group-hover:text-red-400" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
};
