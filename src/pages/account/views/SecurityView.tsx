import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { ChangePasswordModal } from '../../../components/account/ChangePasswordModal';
import { Lock, ShieldCheck, KeyRound } from 'lucide-react';

export const SecurityView: React.FC = () => {
  const { profile } = useAuth();
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-6">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <Lock className="w-5 h-5 text-[#7C3AED] mr-2" /> Security Dashboard
          </h2>
          <p className="text-xs text-app-muted mt-1">Manage your MEXO Account password, authentication, and security settings.</p>
        </div>

        <div className="space-y-3 text-xs">
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h4 className="font-bold text-app-heading flex items-center">
                MEXO Password
              </h4>
              <p className="text-[11px] text-app-muted mt-0.5">
                Protected by central Supabase Auth. Changing password updates credentials for Mail and Forms.
              </p>
            </div>
            <button
              onClick={() => setIsChangeModalOpen(true)}
              className="px-4 py-2 rounded-xl border border-app-border bg-white text-app-heading font-extrabold text-xs hover:bg-slate-100 transition-colors shrink-0"
            >
              Change Password
            </button>
          </div>

          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between gap-3">
            <div>
              <h4 className="font-bold text-app-heading">Two-Step Verification (2FA)</h4>
              <p className="text-[11px] text-app-muted mt-0.5">Add an extra authentication security layer to your MEXO identity.</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 flex-shrink-0">
              Off
            </span>
          </div>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isChangeModalOpen}
        onClose={() => setIsChangeModalOpen(false)}
      />
    </div>
  );
};
