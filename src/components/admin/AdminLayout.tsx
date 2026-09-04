import React, { useState } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { BrandLogo } from '../brand/BrandLogo';
import { 
  Users, Activity, Settings, 
  Palette, LayoutDashboard, ArrowLeft, Menu, X,
  Building2, Shield
} from 'lucide-react';
import { AccountMenu } from '../layout/AccountMenu';
import { cn } from '../../lib/utils';
import { useAuth } from '../../store/AuthContext';

interface MenuItem {
  name: string;
  path: string;
  icon: React.ElementType;
  exact?: boolean;
}

export const AdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, user, hasRole } = useAuth();

  // Redirect non-admins away from this layout entirely
  const isPlatformAdmin = profile?.role === 'platform_admin' || hasRole(['platform_admin']);
  const isOrgAdmin = profile?.role === 'organization_admin' || hasRole(['organization_admin']);
  if (!isPlatformAdmin && !isOrgAdmin) {
    return <Navigate to="/" replace />;
  }

  const menuItems: MenuItem[] = [
    { name: 'Overview', path: '/admin', icon: LayoutDashboard, exact: true },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Organizations', path: '/admin/organizations', icon: Building2 },
    { name: 'Roles & Access', path: '/admin/roles', icon: Shield },
    { name: 'Branding', path: '/admin/branding', icon: Palette },
    { name: 'Settings', path: '/admin/settings', icon: Settings, exact: true },
    { name: 'Audit Activity', path: '/admin/audit-logs', icon: Activity },
  ];

  return (
    <div className="flex h-screen w-full bg-[#000000] text-[#A1A1A1] font-sans overflow-hidden box-border">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Admin Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#0A0A0A] border-r border-[#2A2A2A] text-[#A1A1A1] transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col shrink-0 h-full box-border",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Left Brand Header */}
        <div className="flex h-16 w-full items-center justify-between px-4 border-b border-[#2A2A2A] shrink-0 box-border bg-[#0A0A0A]">
          <div className="flex items-center min-w-0 overflow-hidden flex-1">
            <BrandLogo size={28} variant="full-descriptor" adminBadge={true} />
          </div>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-1.5 -mr-1 text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#161616] rounded transition-colors shrink-0"
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4">
          <NavLink 
            to="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#111111] rounded-md transition-colors border border-transparent hover:border-[#2A2A2A]"
          >
            <ArrowLeft size={16} />
            Back to App
          </NavLink>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 pt-0 space-y-1">
          <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-[#6F6F6F] mb-2 mt-4">Platform Administration</p>
          
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
                  : "text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#111111] border border-transparent"
              )}
            >
              <item.icon size={16} className={cn("transition-colors")} />
              {item.name}
            </NavLink>
          ))}
        </nav>

        {/* Profile Menu at bottom of sidebar */}
        <AccountMenu closeSidebar={() => setSidebarOpen(false)} />
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-[#000000] box-border">
        {/* Top Header */}
        <header className="flex items-center justify-between h-16 px-4 sm:px-6 md:px-8 bg-[#0A0A0A] border-b border-[#2A2A2A] shrink-0 box-border">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 text-[#A0A0A0] hover:text-[#F5F5F5] transition-colors md:hidden rounded"
              title="Toggle navigation"
            >
              <Menu size={20} />
            </button>
            <h1 className="text-base sm:text-lg font-medium text-[#F5F5F5] tracking-tight">Admin Console</h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-900/30 text-blue-400 border border-blue-900/50 uppercase">
              PLATFORM ADMIN
            </span>
          </div>

          <div className="flex items-center gap-3">
            <NavLink 
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-[#F5F5F5] bg-[#111111] hover:bg-[#161616] rounded-md transition-colors border border-[#2A2A2A]"
            >
              <ArrowLeft size={14} />
              <span className="hidden sm:inline">Back to App</span>
              <span className="sm:hidden">App</span>
            </NavLink>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-[#050505] box-border">
          <div className="px-4 sm:px-6 md:px-8 py-6 w-full h-full box-border">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
