import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { MexoAvatar } from '../common/MexoAvatar';
import { MexoAppsLauncher } from './MexoAppsLauncher';
import { PWAInstallButton } from '../common/PWAInstallButton';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Menu, Search, LogOut, Settings, User, ChevronRight,
} from 'lucide-react';

interface AppHeaderProps {
  onHamburger: () => void;
  onSearch?: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({ onHamburger, onSearch }) => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchValue, setSearchValue] = useState('');

  const displayName = profile ? `${profile.first_name} ${profile.last_name}`.trim() || profile.username : 'MEXO User';

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      navigate(`/forms?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  return (
    <header className="h-16 border-b border-app-border bg-white px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shadow-mexo-sm select-none">
      {/* Left: Hamburger + Brand */}
      <div className="flex items-center space-x-2.5 sm:space-x-3">
        <button
          id="hamburger-menu"
          onClick={onHamburger}
          className="p-2 rounded-xl text-app-body hover:bg-slate-100 transition-colors"
          title="Toggle menu"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div
          onClick={() => navigate('/home')}
          className="flex items-center space-x-2 cursor-pointer select-none"
          role="link"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && navigate('/home')}
          aria-label="MEXO Forms Home"
        >
          <img src="/logo.png" alt="MEXO Forms" className="w-7 h-7 sm:w-8 sm:h-8 object-contain" />
          <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight flex items-center">
            MEXO <span className="bg-gradient-to-r from-[#7C3AED] via-[#6366F1] to-[#0878e8] bg-clip-text text-transparent font-extrabold text-base sm:text-lg ml-1">Forms</span>
          </span>
        </div>
      </div>

      {/* Center: Desktop Search */}
      <div className="hidden md:block flex-1 max-w-xl px-4">
        <form onSubmit={handleSearch} className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-app-muted pointer-events-none" />
          <input
            id="forms-search"
            type="text"
            value={searchValue}
            onChange={e => setSearchValue(e.target.value)}
            placeholder="Search forms..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#EEF3F9] text-sm text-app-heading placeholder-app-muted border border-transparent focus:border-[#7C3AED] focus:bg-white focus:ring-2 focus:ring-purple-100 transition-all outline-none"
          />
        </form>
      </div>

      {/* Right: Search (mobile), PWA Install, Apps, Avatar */}
      <div className="flex items-center space-x-1.5 sm:space-x-2">
        <button
          onClick={() => onSearch ? onSearch() : navigate('/forms?search=1')}
          className="p-2 rounded-full text-slate-700 hover:bg-slate-100 transition-colors md:hidden"
          title="Search"
          aria-label="Search forms"
        >
          <Search className="w-5 h-5" />
        </button>

        <div className="hidden sm:block">
          <PWAInstallButton variant="ghost" size="sm" />
        </div>

        <MexoAppsLauncher />

        {/* Avatar + dropdown */}
        <DropdownMenu.Root>
          <DropdownMenu.Trigger asChild>
            <button
              id="profile-menu"
              className="flex items-center justify-center p-0.5 rounded-full border-2 border-transparent hover:border-[#7C3AED] transition-all focus:outline-none"
              aria-label="Profile menu"
            >
              <MexoAvatar name={displayName} src={profile?.avatar_url} size="sm" className="w-8 h-8 text-xs font-bold" />
            </button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className="w-72 bg-white rounded-2xl shadow-mexo-popover border border-app-border z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden"
              align="end"
              sideOffset={8}
            >
              {/* Identity header */}
              <div className="flex flex-col items-center text-center px-5 py-5 border-b border-app-border bg-slate-50/50">
                <MexoAvatar name={displayName} src={profile?.avatar_url} size="lg" className="w-14 h-14 text-xl mb-3 border-2 border-white shadow-mexo-md" />
                <p className="font-bold text-sm text-app-heading">{displayName}</p>
                <p className="text-xs text-app-primary font-mono mt-0.5 truncate max-w-full">{profile?.primary_address}</p>
                <button
                  onClick={() => navigate('/settings')}
                  className="mt-3 px-4 py-1.5 rounded-full border border-app-border text-xs font-semibold text-app-heading hover:bg-slate-100 transition-colors"
                >
                  MEXO Account Settings
                </button>
              </div>

              <div className="p-2 space-y-0.5">
                <DropdownMenu.Item
                  onClick={() => navigate('/settings')}
                  className="flex items-center px-3 py-2.5 text-xs font-semibold text-app-body rounded-xl hover:bg-slate-100 cursor-pointer outline-none"
                >
                  <Settings className="w-4 h-4 mr-2.5 text-app-muted" />
                  Settings
                </DropdownMenu.Item>
              </div>

              <div className="border-t border-app-border p-2">
                <DropdownMenu.Item
                  onClick={async () => { await signOut(); navigate('/signin'); }}
                  className="flex items-center px-3 py-2.5 text-xs font-semibold text-rose-600 rounded-xl hover:bg-rose-50 cursor-pointer outline-none"
                >
                  <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                  Sign out of MEXO
                </DropdownMenu.Item>
              </div>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </div>
    </header>
  );
};
