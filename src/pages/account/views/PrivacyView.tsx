import React from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Eye } from 'lucide-react';

export const PrivacyView: React.FC = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Eye className="w-5 h-5 text-purple-600 mr-2" /> Account Privacy
          </h2>
          <p className="text-xs text-app-muted mt-1">Manage your discovery controls across the MEXO ecosystem.</p>
        </div>

        <div className="flex items-center justify-between p-4 rounded-xl border border-app-border text-xs gap-3">
          <div>
            <h4 className="font-bold text-app-heading">MEXO Contact Discovery</h4>
            <p className="text-[11px] text-app-muted mt-0.5">
              Allow other MEXO users to search and collaborate with you via primary address ({profile?.primary_address}).
            </p>
          </div>
          <input type="checkbox" defaultChecked className="w-4 h-4 text-[#7C3AED] rounded shrink-0 cursor-pointer" />
        </div>
      </div>
    </div>
  );
};
