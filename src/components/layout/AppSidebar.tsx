import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  Home, FileText, Star, Users, Layout, Trash2, Settings,
  Plus, LayoutGrid, Share2, ClipboardList,
} from 'lucide-react';
import { clsx } from 'clsx';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  id: string;
}

const mainNav: NavItem[] = [
  { label: 'Home', icon: <Home className="w-4 h-4" />, path: '/home', id: 'nav-home' },
  { label: 'My Forms', icon: <FileText className="w-4 h-4" />, path: '/forms', id: 'nav-forms' },
  { label: 'Shared with me', icon: <Share2 className="w-4 h-4" />, path: '/shared', id: 'nav-shared' },
  { label: 'Starred', icon: <Star className="w-4 h-4" />, path: '/starred', id: 'nav-starred' },
  { label: 'Templates', icon: <Layout className="w-4 h-4" />, path: '/templates', id: 'nav-templates' },
];

const bottomNav: NavItem[] = [
  { label: 'Responses', icon: <ClipboardList className="w-4 h-4" />, path: '/responses', id: 'nav-responses' },
  { label: 'Trash', icon: <Trash2 className="w-4 h-4" />, path: '/trash', id: 'nav-trash' },
];

interface AppSidebarProps {
  expanded: boolean;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({ expanded }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/home') return location.pathname === '/home';
    return location.pathname.startsWith(path.split('?')[0]);
  };

  const NavBtn = ({ item }: { item: NavItem }) => {
    const active = isActive(item.path);
    return (
      <button
        id={item.id}
        onClick={() => navigate(item.path)}
        className={clsx(
          'w-full flex items-center px-3 py-2.5 rounded-2xl text-xs transition-colors',
          expanded ? '' : 'justify-center px-0',
          active
            ? 'bg-indigo-50 text-[#7C3AED] font-extrabold shadow-sm'
            : 'text-app-body hover:bg-slate-100 font-semibold'
        )}
        title={!expanded ? item.label : undefined}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
      >
        <span className={active ? 'text-[#7C3AED]' : 'text-app-muted'}>{item.icon}</span>
        {expanded && <span className="ml-3">{item.label}</span>}
      </button>
    );
  };

  return (
    <aside
      className={clsx(
        'h-[calc(100vh-64px)] border-r border-app-border bg-gradient-to-b from-[#F8FAFD] via-[#F3F7FC] to-[#EEF4FD] flex flex-col justify-between transition-all duration-200 select-none z-20',
        expanded ? 'w-64' : 'w-20'
      )}
    >
      <div className="p-3 overflow-y-auto overflow-x-hidden flex-1">
        {/* Create Form button */}
        <div className="mb-4">
          <button
            id="sidebar-create-form"
            onClick={() => navigate('/forms/new')}
            className={clsx(
              'flex items-center justify-center font-bold text-white bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] hover:opacity-95 active:scale-95 rounded-2xl shadow-md shadow-indigo-500/30 border border-indigo-400/30 transition-all cursor-pointer',
              expanded ? 'w-full py-3 px-4 text-sm' : 'w-12 h-12 mx-auto'
            )}
            aria-label="Create new form"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            {expanded && <span className="ml-2.5">Create Form</span>}
          </button>
        </div>

        {/* Main nav */}
        <nav className="space-y-1" aria-label="Main navigation">
          {mainNav.map(item => <NavBtn key={item.id} item={item} />)}
        </nav>

        {/* Divider */}
        <div className="my-4 border-t border-app-border" />

        {/* Bottom nav */}
        <nav className="space-y-1" aria-label="Secondary navigation">
          {bottomNav.map(item => <NavBtn key={item.id} item={item} />)}
        </nav>

        {/* MEXO Apps section */}
        {expanded && (
          <div className="mt-4 pt-4 border-t border-app-border">
            <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider px-3 mb-2">MEXO Apps</p>
            <button
              id="sidebar-mexo-apps"
              onClick={() => window.open((import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app', '_blank')}
              className="w-full flex items-center px-3 py-2.5 rounded-2xl text-xs font-semibold text-app-body hover:bg-slate-100 transition-colors"
              aria-label="Open MEXO Mail"
            >
              <LayoutGrid className="w-4 h-4 text-app-muted" />
              <span className="ml-3">MEXO Mail</span>
            </button>
          </div>
        )}
      </div>

      {/* Settings footer */}
      <div className="p-3 border-t border-app-border">
        <button
          id="sidebar-settings"
          onClick={() => navigate('/settings')}
          className={clsx(
            'w-full flex items-center px-3 py-2.5 rounded-2xl text-xs font-semibold text-app-body hover:bg-slate-100 transition-colors',
            !expanded && 'justify-center px-0'
          )}
          aria-label="Settings"
        >
          <Settings className="w-4 h-4 text-app-muted" />
          {expanded && <span className="ml-3">Settings</span>}
        </button>
      </div>
    </aside>
  );
};
