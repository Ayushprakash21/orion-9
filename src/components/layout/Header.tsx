import React, { useState, useRef, useEffect } from 'react';
import { Menu, Search, Bell, X } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEntityDrawer } from '../../store/EntityDrawerContext';
import { useSupplyChain } from '../../store/SupplyChainContext';
import { useNotifications } from '../../store/NotificationContext';
import { NotificationCenter } from '../modals/NotificationCenter';
import { SystemStatusModal } from '../modals/SystemStatusModal';

const pageTitles: Record<string, string> = {
  '/': 'Command Center',
  '/inventory': 'Inventory Systems',
  '/procurement': 'Procurement Logs',
  '/suppliers': 'Supplier Network',
  '/shipments': 'Logistics Tracking',
  '/exceptions': 'System Exceptions',
  '/copilot': 'AI Diagnostics',
  '/integrations': 'Integration Hub',
  '/data': 'Data Center',
  '/reports': 'Mission Reports',
  '/settings': 'System Params',
  '/inbound': 'Inbound Command',
  '/outbound': 'Outbound Command',
  '/predictions': 'Predictive Intelligence',
  '/scenarios': 'Scenario Engine',
  '/data-quality': 'Data Quality',
  '/sync': 'Sync Monitor',
  '/about': 'About ORION-9',
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
  const { inventory, products, suppliers, purchaseOrders, shipments, exceptions } = useSupplyChain();
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [shakeBell, setShakeBell] = React.useState(false);
  const prevUnreadCount = React.useRef(unreadCount);
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

    // Check if query matches any entity ID directly
    const foundInv = inventory.find(i => i.productId.toLowerCase() === q || i.id.toLowerCase() === q);
    if (foundInv) {
      openEntity('inventory', foundInv.productId);
      setSearchQuery('');
      return;
    }

    const foundProd = products.find(p => p.id.toLowerCase() === q || p.name.toLowerCase().includes(q));
    if (foundProd) {
      openEntity('product', foundProd.id);
      setSearchQuery('');
      return;
    }

    const foundSup = suppliers.find(s => s.id.toLowerCase() === q || s.name.toLowerCase().includes(q));
    if (foundSup) {
      openEntity('supplier', foundSup.id);
      setSearchQuery('');
      return;
    }

    const foundPo = purchaseOrders.find(p => p.id.toLowerCase() === q);
    if (foundPo) {
      openEntity('po', foundPo.id);
      setSearchQuery('');
      return;
    }

    const foundShp = shipments.find(s => s.id.toLowerCase() === q);
    if (foundShp) {
      openEntity('shipment', foundShp.id);
      setSearchQuery('');
      return;
    }

    const foundExc = exceptions.find(e => e.id.toLowerCase() === q);
    if (foundExc) {
      openEntity('exception', foundExc.id);
      setSearchQuery('');
      return;
    }

    if (q.includes('critical inventory')) {
      alert('Command parsed: Filter Inventory -> Critical');
    } else if (q.includes('delayed shipments')) {
      alert('Command parsed: Filter Shipments -> Delayed');
    } else if (q.includes('overdue purchase orders') || q.includes('overdue pos')) {
      alert('Command parsed: Filter Procurement -> Overdue');
    } else if (q.includes('highest risk')) {
      alert('Command parsed: Filter Suppliers -> High Risk');
    } else {
      alert(`Search "${searchQuery}" executed across supply chain records. No direct entity match found.`);
    }
    setSearchQuery('');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-x-4 border-b border-[#2A2A2A] bg-[#0A0A0A] px-4 sm:gap-x-6 sm:px-6 lg:px-8">
      <button 
        type="button" 
        className="-m-2.5 p-2.5 text-[#A1A1A1] hover:text-[#F5F5F5] lg:hidden"
        onClick={toggleSidebar}
      >
        <span className="sr-only">Open sidebar</span>
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-[#2A2A2A] lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1 items-center">
          <div className="hidden sm:block">
            <h1 className="text-[10px] uppercase tracking-[0.2em] text-[#6F6F6F] font-semibold mb-0.5" title="AI Supply Chain Operating System">ORION-9</h1>
            <p className="text-base font-medium text-[#F5F5F5]">{title}</p>
          </div>
          <div className="sm:hidden flex-1" />
          
          <div className="flex-1 flex justify-end">
            <div className={`relative flex items-center transition-all ${isSearchOpen ? 'w-full max-w-md' : 'w-10 sm:w-80'}`}>
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
                  placeholder="Search or ask ORION about your supply chain..."
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
          </div>
        </div>
        
        <div className="flex items-center gap-x-4 lg:gap-x-6">
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
          
          {/* Separator */}
          <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-[#2A2A2A]" aria-hidden="true" />

          <div className="hidden lg:flex lg:items-center text-xs text-[#A1A1A1]">
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


