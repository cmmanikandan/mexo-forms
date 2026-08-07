import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { MobileDrawer } from './MobileDrawer';
import { ArrowLeft } from 'lucide-react';

interface AccountSettingsLayoutProps {
  title: string;
  subtitle?: string;
  sidebar: React.ReactNode;
  children: React.ReactNode;
  mobileBackPath?: string;
}

export const AccountSettingsLayout: React.FC<AccountSettingsLayoutProps> = ({
  title,
  subtitle,
  sidebar,
  children,
  mobileBackPath = '/settings',
}) => {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [desktopSidebarExpanded, setDesktopSidebarExpanded] = React.useState(false);

  const handleHamburger = () => {
    if (window.innerWidth < 768) {
      setDrawerOpen(true);
    } else {
      setDesktopSidebarExpanded(prev => !prev);
    }
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(mobileBackPath);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg flex flex-col font-sans text-app-heading overflow-x-hidden">
      <AppHeader onHamburger={handleHamburger} />

      <div className="flex-1 flex overflow-hidden w-full max-w-full">
        {/* Desktop Left App Sidebar - COMPLETELY HIDDEN ON MOBILE (< 768px) */}
        <div className="hidden md:block flex-shrink-0">
          <AppSidebar expanded={desktopSidebarExpanded} />
        </div>

        <main
          id="account-main-content"
          className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 md:p-8 pb-28 md:pb-12 w-full max-w-full"
          style={{ scrollbarWidth: 'thin' }}
        >
          <div className="max-w-5xl mx-auto w-full">
            {/* Top Navigation Back Header */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <button
                  type="button"
                  onClick={handleBack}
                  className="p-2 rounded-xl bg-white border border-app-border hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer shrink-0"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4 text-app-heading" />
                </button>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading tracking-tight truncate">{title}</h1>
                  {subtitle && <p className="text-xs text-app-muted font-medium mt-0.5 truncate">{subtitle}</p>}
                </div>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 w-full">
              {/* Account Sidebar Navigation - HIDDEN ON MOBILE (< 768px) TO ELIMINATE DUPLICATE MENU */}
              <div className="hidden md:block md:col-span-1 bg-white p-3 rounded-2xl border border-app-border shadow-mexo-sm h-fit sticky top-20">
                {sidebar}
              </div>

              {/* Active View Content - 100% width on mobile */}
              <div className="col-span-1 md:col-span-3 min-w-0 w-full">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Navigation & Drawer */}
      <MobileBottomNav onOpenDrawer={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </div>
  );
};
