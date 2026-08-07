import React, { useState } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { KeyRound, ShieldCheck } from 'lucide-react';

export const RecoveryView: React.FC = () => {
  const { profile, updateProfile } = useAuth();
  const [recoveryEmail, setRecoveryEmail] = useState(profile?.recovery_email || '');
  const [isEditing, setIsEditing] = useState(false);
  const [msg, setMsg] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({ recovery_email: recoveryEmail.trim() || undefined });
    setIsEditing(false);
    setMsg('Recovery email updated successfully.');
    setTimeout(() => setMsg(''), 4000);
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="bg-white rounded-2xl border border-app-border p-5 md:p-6 shadow-mexo-sm space-y-5">
        <div>
          <h2 className="text-lg font-extrabold text-app-heading flex items-center">
            <KeyRound className="w-5 h-5 text-amber-500 mr-2" /> Account Recovery
          </h2>
          <p className="text-xs text-app-muted mt-1">Configure options to recover access to your MEXO Account if lost.</p>
        </div>

        {msg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{msg}</span>
          </div>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-app-heading mb-1">Recovery Email</label>
              <input
                type="email"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                placeholder="recovery@example.com"
                className="w-full h-11 px-3.5 rounded-xl border border-app-border bg-white text-xs font-bold outline-none focus:border-[#7C3AED]"
              />
            </div>
            <div className="flex items-center space-x-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] to-[#0878e8] text-white font-bold text-xs shadow-xs"
              >
                Save Recovery Email
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl border border-app-border bg-slate-100 text-app-heading font-bold text-xs hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="p-4 rounded-xl border border-app-border flex items-center justify-between text-xs gap-3">
            <div>
              <h4 className="font-bold text-app-heading">Recovery Email</h4>
              <p className="text-[11px] text-app-muted mt-0.5">{profile?.recovery_email || 'No recovery email set'}</p>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="px-3.5 py-1.5 rounded-xl border border-app-border bg-white font-bold text-xs text-app-heading hover:bg-slate-50"
            >
              Update
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
