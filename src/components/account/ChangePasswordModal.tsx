import React, { useState } from 'react';
import { MexoModal } from '../common/MexoModal';
import { useAuth } from '../../contexts/AuthContext';
import { Lock, Eye, EyeOff, Check, X } from 'lucide-react';

export interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { updatePassword } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isMatching = confirmPassword.length > 0 && newPassword === confirmPassword;
  const isMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const handleResetForm = () => {
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (newPassword.trim().length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      setError('New passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await updatePassword(newPassword.trim());

      if (res.success) {
        setSuccessMsg('Your MEXO Account password has been updated!');
        if (onSuccess) onSuccess();
        setTimeout(() => handleClose(), 1500);
      } else {
        setError(res.error || 'Failed to update password.');
      }
    } catch (err: any) {
      setError(err?.message || 'Password update failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <MexoModal open={isOpen} onOpenChange={open => !open && handleClose()} title="Change Account Password" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        <p className="text-xs text-app-muted">
          Update your central MEXO Account password. Changes apply across MEXO Mail, MEXO Forms, and all connected services.
        </p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700">
            {successMsg}
          </div>
        )}

        {/* New Password */}
        <div>
          <label className="block text-xs font-bold text-app-heading mb-1">
            New Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showNew ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Enter new password (min. 6 chars)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-app-border bg-white text-sm text-app-heading placeholder-app-muted outline-none focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100 pr-10"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowNew(!showNew)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-heading"
              tabIndex={-1}
            >
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Confirm New Password */}
        <div>
          <label className="block text-xs font-bold text-app-heading mb-1">
            Confirm New Password <span className="text-rose-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={`w-full px-3.5 py-2.5 rounded-xl border bg-white text-sm text-app-heading placeholder-app-muted outline-none transition-colors pr-10 ${
                isMatching
                  ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-100'
                  : isMismatch
                  ? 'border-rose-500 focus:ring-2 focus:ring-rose-100'
                  : 'border-app-border focus:border-[#7C3AED] focus:ring-2 focus:ring-purple-100'
              }`}
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-app-muted hover:text-app-heading"
              tabIndex={-1}
            >
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {confirmPassword.length > 0 && (
            <div className="mt-1.5 text-xs font-semibold flex items-center space-x-1.5">
              {isMatching ? (
                <div className="flex items-center text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <Check className="w-3.5 h-3.5 mr-1 text-emerald-500 flex-shrink-0" />
                  <span>Passwords match</span>
                </div>
              ) : (
                <div className="flex items-center text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200">
                  <X className="w-3.5 h-3.5 mr-1 text-rose-500 flex-shrink-0" />
                  <span>Passwords do not match</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-app-border">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-gradient-to-tr from-[#7C3AED] via-[#6366F1] to-[#0878e8] text-white text-xs font-extrabold shadow-md hover:opacity-95 disabled:opacity-50 flex items-center cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 mr-1.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Lock className="w-3.5 h-3.5 mr-1.5" /> Save Password
              </>
            )}
          </button>
        </div>
      </form>
    </MexoModal>
  );
};
