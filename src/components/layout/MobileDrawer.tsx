import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Home, FileText, Star, Share2, Layout, Trash2, Settings, Plus, LayoutGrid, User } from 'lucide-react';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const go = (path: string) => { onClose(); navigate(path); };
  const isActive = (path: string) => location.pathname.startsWith(path);

  const navItems = [
    { label: 'Home', icon: <Home className="w-4 h-4" />, path: '/home', id: 'drawer-home' },
    { label: 'My Forms', icon: <FileText className="w-4 h-4" />, path: '/forms', id: 'drawer-forms' },
    { label: 'Shared with me', icon: <Share2 className="w-4 h-4" />, path: '/shared', id: 'drawer-shared' },
    { label: 'Starred', icon: <Star className="w-4 h-4" />, path: '/starred', id: 'drawer-starred' },
    { label: 'Templates', icon: <Layout className="w-4 h-4" />, path: '/templates', id: 'drawer-templates' },
    { label: 'Trash', icon: <Trash2 className="w-4 h-4" />, path: '/trash', id: 'drawer-trash' },
  ];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <aside className="absolute left-0 top-0 bottom-0 w-72 bg-white flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-app-border">
          <div className="flex items-center space-x-2">
            <img src="/logo.png" alt="MEXO Forms" className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-base text-slate-900">
              MEXO <span className="bg-gradient-to-r from-[#7C3AED] to-[#0878e8] bg-clip-text text-transparent">Forms</span>
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-app-muted hover:bg-slate-100 transition-colors" aria-label="Close menu">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Create button */}
        <div className="p-3">
          <button
            id="drawer-create-form"
            onClick={() => go('/forms/new')}
            className="w-full flex items-center justify-center font-bold text-white bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] py-3 rounded-2xl shadow-md shadow-indigo-500/30 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Create Form
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
          {navItems.map(item => {
            const active = isActive(item.path) && !(item.path === '/forms' && location.pathname.startsWith('/forms/'));
            return (
              <button
                id={item.id}
                key={item.id}
                onClick={() => go(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs transition-colors ${
                  active
                    ? 'bg-indigo-50 text-[#7C3AED] font-extrabold'
                    : 'text-app-body hover:bg-slate-100 font-semibold'
                }`}
                aria-label={item.label}
              >
                <span className={active ? 'text-[#7C3AED]' : 'text-app-muted'}>{item.icon}</span>
                {item.label}
              </button>
            );
          })}

          <div className="my-3 border-t border-app-border" />
          <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider px-3 mb-1">MEXO Apps</p>
          <button
            id="drawer-mexo-mail"
            onClick={() => { onClose(); window.open((import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app', '_blank'); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-semibold text-app-body hover:bg-slate-100 transition-colors"
          >
            <LayoutGrid className="w-4 h-4 text-app-muted" />
            MEXO Mail
          </button>
        </nav>

        {/* Footer */}
        <div className="border-t border-app-border p-3 space-y-1">
          <button
            id="drawer-account"
            onClick={() => go('/account')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold text-app-body hover:bg-slate-100 transition-colors"
          >
            <User className="w-4 h-4 text-[#7C3AED]" /> MEXO Account
          </button>
          <button
            id="drawer-settings"
            onClick={() => go('/settings')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-2xl text-xs font-semibold text-app-body hover:bg-slate-100 transition-colors"
          >
            <Settings className="w-4 h-4 text-app-muted" /> Settings
          </button>
        </div>
      </aside>
    </div>
  );
};
