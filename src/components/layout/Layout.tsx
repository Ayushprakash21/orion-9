import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { Outlet } from 'react-router-dom';
import { EntityDrawer } from '../drawers/EntityDrawer';
import { ConfirmModal } from '../drawers/ConfirmModal';

export const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex h-screen w-full bg-[#000000] text-[#A1A1A1] font-sans overflow-hidden relative selection:bg-[#2A2A2A] selection:text-white">
      <div className="flex h-full w-full z-10 relative">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
        
        <div className="flex flex-1 flex-col overflow-hidden bg-[#0A0A0A]">
          <Header 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <main className="relative flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8 bg-[#0A0A0A] text-[#F5F5F5]">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>
      <EntityDrawer />
      <ConfirmModal />
    </div>
  );
};


