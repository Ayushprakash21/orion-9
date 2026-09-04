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
    <div className="flex h-screen w-full bg-[#000000] text-[#A1A1A1] font-sans overflow-hidden relative selection:bg-[#2A2A2A] selection:text-white box-border">
      <div className="flex h-full w-full relative box-border">
        <Sidebar isOpen={sidebarOpen} closeSidebar={() => setSidebarOpen(false)} />
        
        <div className="flex flex-1 flex-col overflow-hidden min-w-0 bg-[#0A0A0A] box-border">
          <Header 
            toggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
          />
          
          <main className="relative flex-1 overflow-y-auto overflow-x-hidden bg-[#0A0A0A] text-[#F5F5F5] box-border">
            <Outlet context={{ searchQuery }} />
          </main>
        </div>
      </div>
      <EntityDrawer />
      <ConfirmModal />
    </div>
  );
};


