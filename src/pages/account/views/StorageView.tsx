import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { HardDrive } from 'lucide-react';

export const StorageView: React.FC = () => {
  const { profile } = useAuth();
  const storageLimitGB = 15;
  const storageUsedMB = 120; // 120 MB
  const percent = Math.min(100, Math.round((storageUsedMB / (storageLimitGB * 1024)) * 100));

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <HardDrive className="w-5 h-5 text-sky-600 mr-2" /> Data & Storage
          </h2>
          <p className="text-xs text-app-muted mt-1">Shared account storage usage across MEXO services.</p>
        </div>

        <div className="p-5 rounded-2xl bg-slate-50 border border-app-border space-y-4 text-xs">
          <div className="flex justify-between items-center font-bold">
            <span className="text-app-heading">Account Storage</span>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-blue-100 text-[#0878e8]">
                {percent}%
              </span>
              <span className="text-[#0878e8] font-bold">{storageUsedMB} MB of {storageLimitGB} GB used</span>
            </div>
          </div>

          <div className="w-full h-3 rounded-full bg-slate-200 overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0878e8] via-[#0668cc] to-[#0052b3] shadow-md transition-all duration-500"
              style={{ width: `${Math.max(percent, 3)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
