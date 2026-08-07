import React from 'react';
import { Grid, ExternalLink, CheckCircle2 } from 'lucide-react';

export const ConnectedAppsView: React.FC = () => {
  const mailUrl = (import.meta as any).env?.VITE_MEXO_MAIL_URL || 'https://mexo-mail.vercel.app';

  const apps = [
    {
      id: 'mexo-mail',
      name: 'MEXO Mail',
      description: 'Mail, messaging, attachments & communication',
      status: 'Connected',
      icon: '/logo.png',
      url: mailUrl,
      isCurrent: false,
    },
    {
      id: 'mexo-forms',
      name: 'MEXO Forms',
      description: 'Forms, surveys, quizzes, analytics & response management',
      status: 'Connected',
      icon: '/logo.png',
      url: window.location.origin,
      isCurrent: true,
    },
  ];

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Grid className="w-5 h-5 text-[#7C3AED] mr-2" /> Connected MEXO Apps
          </h2>
          <p className="text-xs text-app-muted mt-1">
            Applications connected to your central MEXO Account identity and Supabase authentication session.
          </p>
        </div>

        <div className="space-y-3">
          {apps.map((app) => (
            <div key={app.id} className="p-4 rounded-2xl border border-app-border bg-slate-50/50 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 p-2 shrink-0 shadow-2xs">
                  <img src={app.icon} alt={app.name} className="w-full h-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-app-heading truncate">{app.name}</h4>
                    {app.isCurrent && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 text-[#7C3AED]">
                        This App
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-app-muted truncate mt-0.5">{app.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Connected
                </span>

                {!app.isCurrent && (
                  <a
                    href={app.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-xl border border-app-border bg-white text-app-heading hover:bg-slate-100 transition-colors"
                    title={`Open ${app.name}`}
                  >
                    <ExternalLink className="w-4 h-4 text-[#7C3AED]" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
