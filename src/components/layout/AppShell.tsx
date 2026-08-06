import React, { useState } from 'react';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleHamburger = () => {
    if (window.innerWidth < 768) {
      setDrawerOpen(true);
    } else {
      setSidebarExpanded(prev => !prev);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-app-bg overflow-hidden">
      <AppHeader onHamburger={handleHamburger} />
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <AppSidebar expanded={sidebarExpanded} />
        </div>

        {/* Main content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0"
          style={{ scrollbarWidth: 'thin' }}
        >
          {children}
        </main>
      </div>

      {/* Mobile */}
      <MobileBottomNav />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};
