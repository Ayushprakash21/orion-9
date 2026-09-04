import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, Search, X } from 'lucide-react';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useNotifications } from '../../store/NotificationContext';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { NotificationCenter } from '../modals/NotificationCenter';
import { SystemStatusModal } from '../modals/SystemStatusModal';
import { brandingRepository } from '../../repositories/BrandingRepository';
import { BrandingConfig } from '../../types/auth';

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/inventory': 'Inventory',
  '/procurement': 'Procurement',
  '/suppliers': 'Suppliers',
  '/shipments': 'Shipments',
  '/exceptions': 'Exceptions',
  '/decisions': 'Decision Center',
  '/copilot': 'AI Copilot',
  '/integrations': 'Integrations',
  '/data': 'Data Center',
  '/reports': 'Reports',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/organization': 'Organization',
  '/inbound': 'Inbound',
  '/outbound': 'Outbound',
  '/predictions': 'Predictions',
  '/scenarios': 'Scenarios',
  '/sync': 'Sync Monitor',
  '/data-quality': 'Data Quality',
  '/about': 'About',
};

export const Header = ({ 
  toggleSidebar, 
  searchQuery, 
  setSearchQuery 
}: { 
  toggleSidebar: () => void, 
  searchQuery: string,  
  setSearchQuery: (q: string) => void
}) => {
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'Details';
  const [isSearchOpen, setIsSearchOpen] = React.useState(false);
  const { unreadCount } = useNotifications();
  const { openEntity } = useEntityDrawer();
  const { inventory, products, suppliers, purchaseOrders, shipments, exceptions, warehouses } = useSupplyChain();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [shakeBell, setShakeBell] = React.useState(false);
  const prevUnreadCount = React.useRef(unreadCount);
  
  const [branding, setBranding] = useState<BrandingConfig>(() => brandingRepository.getBrandingSync());

  useEffect(() => {
    const loadBranding = async () => {
      const config = await brandingRepository.getBranding();
      setBranding(config);
    };
    loadBranding();

    const handleBrandingUpdate = () => {
      loadBranding();
    };

    window.addEventListener('orion-branding-updated', handleBrandingUpdate);
    return () => window.removeEventListener('orion-branding-updated', handleBrandingUpdate);
  }, []);

  React.useEffect(() => {
    if (unreadCount > prevUnreadCount.current) {
      setShakeBell(true);
      const timer = setTimeout(() => setShakeBell(false), 500);
      return () => clearTimeout(timer);
    }
    prevUnreadCount.current = unreadCount;
  }, [unreadCount]);

  const notifRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchQuery.trim().toLowerCase();
    if (!q) return;

    // Search logic remains unchanged
    const foundInv = inventory.find(i => i.productId.toLowerCase() === q || i.id.toLowerCase() === q);
    if (foundInv) { openEntity('inventory', foundInv.productId); setSearchQuery(''); return; }
    const foundProd = products.find(p => p.id.toLowerCase() === q || p.name.toLowerCase().includes(q));
    if (foundProd) { openEntity('product', foundProd.id); setSearchQuery(''); return; }
    const foundSup = suppliers.find(s => s.id.toLowerCase() === q || s.name.toLowerCase().includes(q));
    if (foundSup) { openEntity('supplier', foundSup.id); setSearchQuery(''); return; }
    const foundPo = purchaseOrders.find(p => p.id.toLowerCase() === q);
    if (foundPo) { openEntity('po', foundPo.id); setSearchQuery(''); return; }
    const foundShp = shipments.find(s => s.id.toLowerCase() === q);
    if (foundShp) { openEntity('shipment', foundShp.id); setSearchQuery(''); return; }
    const foundExc = exceptions.find(e => e.id.toLowerCase() === q);
    if (foundExc) { openEntity('exception', foundExc.id); setSearchQuery(''); return; }

    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-[#2A2A2A] bg-[#0A0A0A] px-4 sm:px-6 md:px-8 box-border">
      {/* Left side: mobile hamburger + page title (NO duplicate brand logo/name) */}
      <div className="flex items-center gap-3 min-w-0">
        <button 
          type="button" 
          className="-m-2 p-2 text-[#A1A1A1] hover:text-[#F5F5F5] md:hidden rounded"
          onClick={toggleSidebar}
        >
          <span className="sr-only">Open navigation menu</span>
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>

        <div className="h-5 w-px bg-[#2A2A2A] md:hidden" aria-hidden="true" />

        <h1 className="text-base sm:text-lg font-medium text-[#F5F5F5] tracking-tight truncate">
          {title}
        </h1>
      </div>

      {/* Right side: search, notifications, operational status */}
      <div className="flex items-center gap-3 sm:gap-4 ml-4">
        {/* Search */}
        <div className={`relative flex items-center transition-all ${isSearchOpen ? 'w-full max-w-xs' : 'w-9 sm:w-72 md:w-80'}`}>
          {!isSearchOpen && (
            <button 
              className="sm:hidden p-2 text-[#A1A1A1] hover:text-[#F5F5F5]"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={18} />
            </button>
          )}
          
          <div className={`relative w-full ${isSearchOpen ? 'block' : 'hidden sm:block'}`}>
            <Search className="pointer-events-none absolute inset-y-0 left-3 h-full w-4 text-[#6F6F6F]" aria-hidden="true" />
            <form onSubmit={handleSearchSubmit} className="w-full">
              <input
                id="search-field"
                className="block h-9 w-full rounded-md border border-[#2A2A2A] bg-[#111111] py-1.5 pl-9 pr-9 text-xs text-[#F5F5F5] placeholder:text-[#6F6F6F] focus:border-[#6F6F6F] focus:outline-none focus:ring-1 focus:ring-[#6F6F6F]"
                placeholder={`Search or ask ${branding.appName} about your supply chain...`}
                type="search"
                name="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            {isSearchOpen && (
              <button 
                className="absolute inset-y-0 right-3 flex items-center text-[#A1A1A1] hover:text-[#F5F5F5] sm:hidden"
                onClick={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Notifications & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative" ref={notifRef}>
            <button 
              type="button" 
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="p-2 text-[#A1A1A1] hover:text-[#F5F5F5] relative transition-colors"
            >
              <span className="sr-only">View notifications</span>
              <Bell className={`h-4 w-4 ${shakeBell ? "transition-transform scale-125 -rotate-12 duration-200" : ""}`} aria-hidden="true" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[9px] font-mono font-medium text-black ">
                  {unreadCount}
                </span>
              )}
            </button>
            <NotificationCenter isOpen={isNotificationsOpen} onClose={() => setIsNotificationsOpen(false)} />
          </div>
          
          <div className="hidden md:block md:h-6 md:w-px md:bg-[#2A2A2A]" aria-hidden="true" />
          
          <div className="hidden md:flex md:items-center text-xs text-[#A1A1A1]">
            <button 
              onClick={() => setIsStatusModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#161616] border border-[#2A2A2A] hover:border-[#444] text-[#F5F5F5] transition-all cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operational
            </button>
          </div>
        </div>
      </div>

      <SystemStatusModal isOpen={isStatusModalOpen} onClose={() => setIsStatusModalOpen(false)} />
    </header>
  );
};
