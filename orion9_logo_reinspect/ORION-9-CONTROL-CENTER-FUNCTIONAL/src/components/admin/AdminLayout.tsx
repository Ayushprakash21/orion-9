import React, { useState } from 'react';
import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { BrandingConfig } from '../../types/auth';
import { 
  Users, Activity, Settings, 
  Palette, LayoutDashboard, Menu, X,
  Building2, Shield, BrainCircuit, SlidersHorizontal
} from 'lucide-react';
import { AccountMenu } from '../layout/AccountMenu';
import { cn } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';
import { ErrorBoundary } from '../ErrorBoundary';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  exact?: boolean;
}

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, user, hasRole } = useAuth();

  const navigate = useNavigate();
  
  const [branding, setBranding] = React.useState<BrandingConfig>(() => brandingRepository.getBrandingSync());

  React.useEffect(() => {
    const loadBranding = async () => {
      try {
        const config = await brandingRepository.getBranding();
        setBranding(config);
      } catch (err) {
        console.warn('Admin branding load warning:', err);
      }
    };
    loadBranding().catch(() => {});
    const handleBrandingUpdate = () => {
      loadBranding().catch(() => {});
    };
    window.addEventListener('orion-branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('orion-branding-updated', handleBrandingUpdate);
  }, []);

  // Redirect non-admins away from this layout entirely
  const isPlatformAdmin = profile?.role === 'platform_admin' || hasRole(['platform_admin']);
  const isOrgAdmin = profile?.role === 'organization_admin' || hasRole(['organization_admin']);
  if (!isPlatformAdmin && !isOrgAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems: MenuItem[] = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'AI + Manual Control Center', path: '/admin/control-center', icon: SlidersHorizontal },
    { name: 'Platform Intelligence', path: '/admin/platform-intelligence', icon: BrainCircuit },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { name: 'Roles & Access', path: '/admin/roles', icon: Shield },
    { name: 'Branding', path: '/admin/branding', icon: Palette },
    { name: 'Settings', path: '/admin/settings', icon: Settings, exact: true },
    { name: 'Audit Activity', path: '/admin/audit-logs', icon: Activity },
  ];

  return (
    <div className="orion-admin-shell flex flex-col h-screen w-full bg-os-bg text-os-text-secondary font-sans overflow-hidden box-border">
      {/* Global shell chrome: fixed 48px lane; admin content is always below it. */}
      <header className="orion-global-topbar flex items-center justify-between h-[48px] min-h-[48px] max-h-[48px] px-3 md:px-4 bg-os-bg border-b border-os-border shrink-0 box-border w-full z-[10000] relative">
        <div className="flex items-center gap-4 sm:gap-6 shrink-0 justify-start">
          <button 
            type="button"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 -ml-1 text-os-text-secondary hover:text-os-text-primary transition-colors md:hidden rounded"
            title="Toggle navigation"
          >
            <Menu size={20} />
          </button>
          
          <div 
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group hover:opacity-90 transition-all"
            title="Orion Home / User Desktop"
          >
            <BrandLogo sizePreset="sm" variant="mark" />
            <span className="font-mono font-bold text-[13px] tracking-wider uppercase text-os-text-primary group-hover:text-white group-hover:drop-shadow-[0_0_8px_rgba(0,242,254,0.6)] transition-all whitespace-nowrap">
              ORION
            </span>
            <span className="text-white/20 font-mono text-[10px] select-none mx-1">|</span>
            <span className="text-[11px] font-mono tracking-widest text-os-text-muted uppercase whitespace-nowrap">
              PLATFORM CONTROL PLANE
            </span>
          </div>
        </div>
        
        {/* Top Right: Actions */}
        <div className="flex items-center gap-3 sm:gap-4 shrink-0 justify-end ml-auto">
          <button
            type="button"
            onClick={() => navigate('/')}
            title="Return to Orion Home Screen"
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-[10px] font-mono font-bold tracking-widest uppercase text-os-text-secondary hover:text-white bg-white/5 hover:bg-white/10 rounded border border-os-border hover:border-[#00F2FE]/50 transition-all cursor-pointer"
          >
            HOME SCREEN
          </button>
          <AccountMenu />
        </div>
      </header>

      {/* Main Layout Area below Header */}
      <div className="flex flex-1 overflow-hidden min-h-0 w-full relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div 
            className="absolute inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
        
        {/* Admin Sidebar */}
        <aside 
          className={cn(
            "absolute inset-y-0 left-0 z-50 w-[280px] bg-os-bg border-r border-os-border text-os-text-secondary transition-transform duration-300 ease-in-out md:relative flex flex-col shrink-0 h-full box-border",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          {/* Mobile close button for sidebar */}
          <div className="flex h-14 md:hidden w-full items-center justify-end px-4 border-b border-os-border shrink-0 bg-os-bg">
            <button 
              type="button"
              onClick={() => setSidebarOpen(false)}
              className="p-1.5 text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          
          <nav className="flex-1 overflow-y-auto p-4 pt-4 md:pt-6 space-y-1">
            <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-os-text-muted mb-2">Platform Administration</p>
            
            {menuItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.path}
                end={item.exact}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors group",
                  isActive 
                    ? "bg-blue-600/10 text-blue-400 border border-blue-900/30" 
                    : "text-os-text-secondary hover:text-os-text-primary hover:bg-os-surface border border-transparent"
                )}
              >
                <item.icon size={16} className={cn("transition-colors")} />
                {item.name}
              </NavLink>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-os-bg box-border w-full min-w-0">
          <div className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 box-border min-h-full">
            <ErrorBoundary fallbackTitle="ADMIN MODULE FAULT RECOVERED">
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
