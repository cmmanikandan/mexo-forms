import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import { MexoAvatar } from '../../../components/common/MexoAvatar';
import { ACCOUNT_ITEMS } from '../../../components/account/AccountNavigation';
import { CheckCircle2, ChevronRight } from 'lucide-react';

export const OverviewView: React.FC = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const fullName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.username : '';

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
    <div className="space-y-6 max-w-4xl">
      {/* Central Identity Card */}
      <div className="bg-white rounded-2xl border border-app-border p-6 shadow-mexo-sm flex flex-col sm:flex-row items-center justify-between gap-5">
        <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
          <MexoAvatar
            name={fullName}
            src={profile?.avatar_url}
            size="xl"
            className="w-20 h-20 text-2xl shadow-mexo-md border-2 border-white shrink-0"
          />
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-app-heading">
              {fullName}
            </h2>
            <p className="text-sm font-mono text-[#7C3AED] mt-0.5 truncate">{profile?.primary_address}</p>
            <div className="flex items-center justify-center sm:justify-start mt-2 text-xs text-emerald-600 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> MEXO Account · Active
            </div>
          </div>
        </div>
        <button
          onClick={() => navigate('/account/personal-info')}
          className="px-5 py-2.5 rounded-xl border border-app-border bg-slate-50 text-app-heading font-extrabold text-xs hover:bg-slate-100 transition-colors shadow-2xs shrink-0 cursor-pointer"
        >
          Manage profile
        </button>
      </div>

      {/* Account Groups */}
      <div className="space-y-6">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-bold text-app-muted uppercase tracking-wider mb-2 px-1">
              {group.label}
            </p>
            <div className="bg-white rounded-2xl border border-app-border overflow-hidden shadow-mexo-sm">
              {group.items.map((item, idx) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-5 py-4 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors min-h-[68px] ${
                    idx < group.items.length - 1 ? 'border-b border-app-border' : ''
                  }`}
                >
                  <span className="text-[#7C3AED] mr-4 shrink-0">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-extrabold text-app-heading">{item.label}</p>
                    <p className="text-xs text-app-muted mt-0.5">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
