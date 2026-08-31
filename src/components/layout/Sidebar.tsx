import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { OrionLogo } from '../brand/OrionLogo';
import { OrionIcon, IconType } from '../brand/OrionIcons';

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
      { name: 'Settings', path: '/settings', icon: 'settings' }
    ]
  }
];

import { cn } from '../../lib/utils';

export const Sidebar = ({ isOpen, closeSidebar }: { isOpen: boolean, closeSidebar: () => void }) => {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 lg:hidden backdrop-blur-sm"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-[#2A2A2A] text-[#A1A1A1] transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 flex flex-col",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center px-6 border-b border-[#2A2A2A] shrink-0">
          <OrionLogo size={26} variant="full-descriptor" />
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
                        if (window.innerWidth < 1024) closeSidebar();
                      }}
                      className={({ isActive }) => cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-xs font-medium transition-all",
                        isActive 
                          ? "bg-[#1C1C1C] text-[#F5F5F5] border-l-2 border-[#F5F5F5]" 
                          : "hover:bg-[#161616] hover:text-[#F5F5F5] text-[#A1A1A1] border-l-2 border-transparent"
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

        <div className="p-4 border-t border-[#2A2A2A] shrink-0 bg-[#0A0A0A]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#1C1C1C] border border-[#2A2A2A] flex items-center justify-center shrink-0">
              <span className="text-xs font-mono text-[#F5F5F5]">AM</span>
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-medium text-[#F5F5F5] truncate">AYUSH_P</p>
              <p className="text-[10px] uppercase tracking-wider text-[#6F6F6F] truncate">SYS_ADMIN</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

