import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Monitor, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';

export const DevicesView: React.FC = () => {
  const { session, profile } = useAuth();
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isMobile = /mobile/i.test(ua);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-extrabold text-app-heading flex items-center">
              <Monitor className="w-5 h-5 text-indigo-600 mr-2" /> Devices & Sessions
            </h2>
            <p className="text-xs text-app-muted mt-1">Devices currently signed into your MEXO Account.</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/50 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-xl text-indigo-600">
                {isMobile ? <Smartphone className="w-5 h-5" /> : <Laptop className="w-5 h-5" />}
              </div>
              <div>
                <h4 className="text-xs font-bold text-app-heading flex items-center gap-1.5">
                  Current Active Device
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </span>
                </h4>
                <p className="text-[11px] text-app-muted mt-0.5 font-mono">{profile?.primary_address || session?.user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
