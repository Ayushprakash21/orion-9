import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AppLogo } from '../brand/AppLogo';
import { OrionIcon, IconType } from '../brand/OrionIcons';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { User, X } from 'lucide-react';
import { AccountMenu } from './AccountMenu';

const menuGroups: { title: string; items: { name: string; path: string; icon: IconType }[] }[] = [
  {
    title: 'COMMAND CENTER',
    items: [
      { name: 'Dashboard', path: '/', icon: 'dashboard' }
    ]
  },
  {
    title: 'OPERATIONS',
    items: [
      { name: 'Inventory', path: '/inventory', icon: 'inventory' },
      { name: 'Inbound', path: '/inbound', icon: 'inbound' },
      { name: 'Procurement', path: '/procurement', icon: 'procurement' },
      { name: 'Suppliers', path: '/suppliers', icon: 'suppliers' },
      { name: 'Shipments', path: '/shipments', icon: 'shipments' },
      { name: 'Outbound', path: '/outbound', icon: 'outbound' }
    ]
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { name: 'Exceptions', path: '/exceptions', icon: 'exceptions' },
      { name: 'Decision Engine', path: '/decisions', icon: 'decisions' },
      { name: 'Predictions', path: '/predictions', icon: 'predictions' },
      { name: 'Scenarios', path: '/scenarios', icon: 'scenarios' },
      { name: 'AI Copilot', path: '/copilot', icon: 'ai' }
    ]
  },
  {
    title: 'INTEGRATION',
    items: [
      { name: 'Integration Hub', path: '/integrations', icon: 'integrations' },
      { name: 'Data Center', path: '/data', icon: 'datacenter' },
      { name: 'Data Quality', path: '/data-quality', icon: 'quality' },
      { name: 'Sync Monitor', path: '/sync', icon: 'sync' }
    ]
  },
  
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Reports', path: '/reports', icon: 'reports' },
      { name: 'Settings', path: '/settings', icon: 'settings' },
      { name: 'About Orion SCM OS', path: '/about', icon: 'about' }
    ]
  }
];

import { cn } from '../../lib/utils';

export const Sidebar = ({ isOpen, closeSidebar }: { isOpen: boolean, closeSidebar: () => void }) => {
  const { userProfile } = useSupplyChain();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 md:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-[#2A2A2A] text-[#A1A1A1] transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col shrink-0 h-full box-border",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Top Left Brand Header */}
        <div className="flex h-16 w-full items-center justify-between px-4 border-b border-[#2A2A2A] shrink-0 box-border bg-[#111111]">
          <div className="flex items-center min-w-0 overflow-hidden flex-1">
            <AppLogo size={28} variant="full-descriptor" />
          </div>
          <button 
            type="button"
            onClick={closeSidebar} 
            className="md:hidden p-1.5 -mr-1 text-[#A1A1A1] hover:text-[#F5F5F5] hover:bg-[#1A1A1A] rounded transition-colors shrink-0" 
            title="Close navigation"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
          {menuGroups.map((group, idx) => (
            <div key={idx}>
              <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.15em] text-[#6F6F6F] font-semibold">
                {group.title}
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  return (
                    <NavLink
                      key={item.name}
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 768) closeSidebar();
                      }}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-colors",
                        isActive 
                          ? "bg-[#222222] text-[#F5F5F5]" 
                          : "hover:bg-[#161616] hover:text-[#F5F5F5] text-[#A1A1A1]"
                      )}
                    >
                      {({ isActive }) => (
                        <>
                          <OrionIcon name={item.icon} size={16} className={isActive ? 'text-[#F5F5F5]' : 'text-[#A0A0A0]'} />
                          <span>{item.name}</span>
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <AccountMenu closeSidebar={closeSidebar} />
      </aside>
    </>
  );
};

