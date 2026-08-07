import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';
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
  mobileBackPath = '/home',
}) => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-app-bg flex flex-col font-sans text-app-heading">
      <AppHeader onHamburger={() => setSidebarOpen(prev => !prev)} />

      <div className="flex-1 flex overflow-hidden">
        <AppSidebar expanded={sidebarOpen} />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            {/* Top Navigation Back Button */}
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate(mobileBackPath)}
                  className="p-2 rounded-xl bg-white border border-app-border hover:bg-slate-50 transition-colors shadow-2xs"
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4 text-app-heading" />
                </button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-app-heading tracking-tight">{title}</h1>
                  {subtitle && <p className="text-xs text-app-muted font-medium mt-0.5">{subtitle}</p>}
                </div>
              </div>
            </div>

            {/* Layout Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Account Sidebar Navigation */}
              <div className="md:col-span-1 bg-white p-3 rounded-2xl border border-app-border shadow-mexo-sm h-fit sticky top-20">
                {sidebar}
              </div>

              {/* View Content */}
              <div className="md:col-span-3">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
