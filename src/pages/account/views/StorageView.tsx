import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { HardDrive, Info } from 'lucide-react';

export const StorageView: React.FC = () => {
  const { profile } = useAuth();

  const hasStorageData = typeof (profile as any)?.storage_used_bytes === 'number';
  const storageLimitGB = (profile as any)?.storage_limit_gb || 15;
  const storageUsedMB = hasStorageData ? Math.round(((profile as any).storage_used_bytes / (1024 * 1024))) : 0;
  const percent = hasStorageData ? Math.min(100, Math.round((storageUsedMB / (storageLimitGB * 1024)) * 100)) : 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <HardDrive className="w-5 h-5 text-sky-600 mr-2" /> Data & Storage
          </h2>
          <p className="text-xs text-app-muted mt-1">Shared account storage usage across MEXO services.</p>
        </div>

        {hasStorageData ? (
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
        ) : (
          <div className="p-5 rounded-2xl bg-slate-50 border border-app-border text-center space-y-2">
            <div className="p-3 bg-white rounded-full w-10 h-10 mx-auto flex items-center justify-center border border-slate-200 text-app-muted">
              <Info className="w-5 h-5" />
            </div>
            <p className="text-sm font-extrabold text-app-heading">Storage information unavailable</p>
            <p className="text-xs text-app-muted max-w-sm mx-auto">
              Shared MEXO storage calculation will be displayed here once active storage sync is enabled.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
