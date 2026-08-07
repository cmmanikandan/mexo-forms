import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  User,
  Shield,
  Monitor,
  KeyRound,
  Grid,
  Eye,
  HardDrive,
  ChevronRight,
} from 'lucide-react';

export type AccountSection =
  | 'personal'
  | 'security'
  | 'sessions'
  | 'recovery'
  | 'apps'
  | 'privacy'
  | 'storage';

export interface AccountItem {
  id: AccountSection;
  label: string;
  description: string;
  path: string;
  icon: React.ReactNode;
}

export const ACCOUNT_ITEMS: AccountItem[] = [
  {
    id: 'personal',
    label: 'Personal info',
    description: 'Name, photo and personal data',
    path: '/account/personal',
    icon: <User className="w-5 h-5" />,
  },
  {
    id: 'security',
    label: 'Security',
    description: 'Password and authentication',
    path: '/account/security',
    icon: <Shield className="w-5 h-5" />,
  },
  {
    id: 'sessions',
    label: 'Devices & sessions',
    description: 'Manage signed-in devices',
    path: '/account/devices',
    icon: <Monitor className="w-5 h-5" />,
  },
  {
    id: 'recovery',
    label: 'Recovery',
    description: 'Recovery email and options',
    path: '/account/recovery',
    icon: <KeyRound className="w-5 h-5" />,
  },
  {
    id: 'apps',
    label: 'Connected MEXO Apps',
    description: 'Apps connected to account',
    path: '/account/apps',
    icon: <Grid className="w-5 h-5" />,
  },
  {
    id: 'privacy',
    label: 'Privacy',
    description: 'Privacy controls and activity',
    path: '/account/privacy',
    icon: <Eye className="w-5 h-5" />,
  },
  {
    id: 'storage',
    label: 'Data & Storage',
    description: 'Storage usage and data',
    path: '/account/storage',
    icon: <HardDrive className="w-5 h-5" />,
  },
];

export const AccountNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname.toLowerCase();

  return (
    <nav className="space-y-1">
      {ACCOUNT_ITEMS.map((item) => {
        const isActive = currentPath.includes(item.id) || currentPath.startsWith(item.path);
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center space-x-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
              isActive
                ? 'bg-purple-50 text-[#7C3AED] font-extrabold border border-purple-100'
                : 'text-app-body hover:bg-slate-100'
            }`}
          >
            <span className={isActive ? 'text-[#7C3AED]' : 'text-app-muted'}>{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C3AED]' : 'text-app-muted'}`} />
          </button>
        );
      })}
    </nav>
  );
};
