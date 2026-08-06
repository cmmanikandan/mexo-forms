import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, FileText, Plus, ClipboardList, LayoutGrid } from 'lucide-react';
import { clsx } from 'clsx';

export const MobileBottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(path);
  };

  const NavItem = ({ icon, label, path, id }: { icon: React.ReactNode; label: string; path: string; id: string }) => {
    const active = isActive(path);
    return (
      <button
        id={id}
        onClick={() => navigate(path)}
        className={clsx(
          'flex flex-col items-center justify-center flex-1 py-1.5 text-[10px] font-semibold transition-colors gap-1',
          active ? 'text-[#7C3AED]' : 'text-app-muted'
        )}
        aria-label={label}
        aria-current={active ? 'page' : undefined}
      >
        <span className={active ? 'text-[#7C3AED]' : 'text-slate-400'}>{icon}</span>
        {label}
      </button>
    );
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-app-border flex items-center md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <NavItem id="mobile-nav-home" icon={<Home className="w-5 h-5" />} label="Home" path="/home" />
      <NavItem id="mobile-nav-forms" icon={<FileText className="w-5 h-5" />} label="Forms" path="/forms" />

      {/* Center Create Button */}
      <button
        id="mobile-nav-create"
        onClick={() => navigate('/forms/new')}
        className="flex flex-col items-center justify-center flex-1 py-1.5 group"
        aria-label="Create new form"
      >
        <div className="w-12 h-12 -mt-4 rounded-2xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] flex items-center justify-center shadow-lg shadow-indigo-500/40 group-active:scale-95 transition-transform">
          <Plus className="w-5 h-5 text-white stroke-[2.5]" />
        </div>
      </button>

      <NavItem id="mobile-nav-responses" icon={<ClipboardList className="w-5 h-5" />} label="Responses" path="/responses" />
      <NavItem id="mobile-nav-menu" icon={<LayoutGrid className="w-5 h-5" />} label="Menu" path="/settings" />
    </nav>
  );
};
