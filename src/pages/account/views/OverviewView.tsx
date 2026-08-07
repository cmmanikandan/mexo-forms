import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { MexoAvatar } from '../../../components/common/MexoAvatar';
import { ACCOUNT_ITEMS } from '../../../components/account/AccountNavigation';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export const OverviewView: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const fullName = profile
    ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username
    : 'MEXO User';

  const groups = [
    {
      label: 'ACCOUNT',
      items: ACCOUNT_ITEMS.filter((i) => ['personal', 'security', 'sessions'].includes(i.id)),
    },
    {
      label: 'ACCESS & RECOVERY',
      items: ACCOUNT_ITEMS.filter((i) => ['recovery', 'apps'].includes(i.id)),
    },
    {
      label: 'DATA & PRIVACY',
      items: ACCOUNT_ITEMS.filter((i) => ['privacy', 'storage'].includes(i.id)),
    },
  ];

  return (
    <div className="space-y-6 w-full max-w-3xl mx-auto">
      {/* Central Identity Card Header */}
      <div className="bg-white rounded-3xl border border-app-border p-6 shadow-mexo-sm flex flex-col items-center text-center space-y-4">
        <MexoAvatar
          name={fullName}
          src={profile?.avatar_url}
          size="xl"
          className="w-20 h-20 sm:w-24 sm:h-24 text-2xl sm:text-3xl shadow-mexo-md border-4 border-white shrink-0"
        />

        <div className="space-y-1 max-w-full px-2">
          <h2 className="text-xl sm:text-2xl font-extrabold text-app-heading break-words">
            {fullName}
          </h2>
          <p className="text-xs sm:text-sm font-mono text-[#7C3AED] font-semibold truncate max-w-full">
            {profile?.primary_address}
          </p>
          <div className="flex items-center justify-center mt-2 text-xs text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1 shrink-0" /> MEXO Account
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/account/personal')}
          className="px-6 py-2.5 rounded-xl border border-app-border bg-slate-50 text-app-heading font-extrabold text-xs hover:bg-slate-100 transition-colors shadow-2xs cursor-pointer mt-2"
        >
          Manage profile
        </button>
      </div>

      {/* Account Navigation Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-extrabold text-app-muted uppercase tracking-wider mb-2 px-1">
              {group.label}
            </p>
            <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-mexo-sm">
              {group.items.map((item, idx) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[76px] cursor-pointer ${
                    idx < group.items.length - 1 ? 'border-b border-app-border' : ''
                  }`}
                >
                  <span className="text-[#7C3AED] mr-4 shrink-0 p-2 rounded-xl bg-purple-50 border border-purple-100">
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-sm font-extrabold text-app-heading truncate">{item.label}</p>
                    <p className="text-xs text-app-muted mt-0.5 truncate">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-1" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
