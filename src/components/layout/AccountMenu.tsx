import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../store/AuthContext';
import { User, Settings, Building2, Shield, LogOut, ChevronUp } from 'lucide-react';

export const AccountMenu = ({ closeSidebar }: { closeSidebar?: () => void }) => {
  const { profile, organization, hasRole, signOut, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAdmin = hasRole(['platform_admin']) || profile?.role === 'platform_admin' || user?.id === 'admin';

  const handleAction = (path: string) => {
    setIsOpen(false);
    if (closeSidebar && window.innerWidth < 1024) closeSidebar();
    navigate(path);
  };

  const handleSignOut = async () => {
    const wasAdmin = user?.id === 'admin';
    await signOut();
    if (wasAdmin) {
      navigate('/admin/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 border-t border-[#2A2A2A] shrink-0 bg-[#0A0A0A] hover:bg-[#111111] transition-colors cursor-pointer outline-none"
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-full bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center shrink-0 overflow-hidden">
            {profile?.avatarUrl ? (
              <img src={profile.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-medium text-[#F5F5F5]">
                {profile?.displayName ? profile.displayName.substring(0,2).toUpperCase() : <User size={14} className="text-[#6F6F6F]" />}
              </span>
            )}
          </div>
          <div className="overflow-hidden flex-1 text-left">
            <p className="text-xs font-medium text-[#F5F5F5] truncate">{profile?.displayName || 'User Profile'}</p>
            <p className="text-[10px] uppercase tracking-wider text-[#6F6F6F] truncate">{organization?.name || profile?.role || 'Unassigned'}</p>
          </div>
        </div>
        <ChevronUp size={16} className={`text-[#6F6F6F] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 w-full mb-1 p-2 bg-[#111111] border border-[#2A2A2A] rounded-lg shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
          <div className="px-3 py-2 mb-2 border-b border-[#2A2A2A]">
            <p className="text-xs text-[#F5F5F5] font-medium truncate">{profile?.fullName}</p>
            <p className="text-[10px] text-[#A0A0A0] truncate">{profile?.email}</p>
          </div>
          
          <div className="space-y-0.5">
            <button onClick={() => handleAction('/profile')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] rounded-md transition-colors text-left">
              <User size={14} /> Profile
            </button>
            <button onClick={() => handleAction('/organization')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] rounded-md transition-colors text-left">
              <Building2 size={14} /> Organization
            </button>
            <button onClick={() => handleAction('/settings')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#1C1C1C] rounded-md transition-colors text-left">
              <Settings size={14} /> Settings
            </button>
          </div>

          {isAdmin && (
            <>
              <div className="my-2 border-t border-[#2A2A2A]" />
              <button onClick={() => handleAction('/admin')} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-400 hover:bg-[#1C1C1C] rounded-md transition-colors text-left">
                <Shield size={14} /> Admin Console
              </button>
            </>
          )}

          <div className="my-2 border-t border-[#2A2A2A]" />
          <button onClick={handleSignOut} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-[#1C1C1C] rounded-md transition-colors text-left">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      )}
    </div>
  );
};
