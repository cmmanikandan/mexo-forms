import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form } from '../../types/forms';
import { useAuth } from '../../contexts/AuthContext';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { AboutMexoFormsModal } from './AboutMexoFormsModal';
import {
  MoreVertical, Share2, Copy, Bookmark, Trash2, Info, Flag,
  HelpCircle, Edit3, BarChart2, Settings, Check, ShieldCheck, Calendar, Clock, Users
} from 'lucide-react';

interface FormActionsMenuProps {
  form: Form;
  answersCount: number;
  totalQuestionsCount: number;
  onClearAnswers?: () => void;
  onSaveProgress?: () => void;
}

export const FormActionsMenu: React.FC<FormActionsMenuProps> = ({
  form,
  answersCount,
  totalQuestionsCount,
  onClearAnswers,
  onSaveProgress,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const [copied, setCopied] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isOwner = !!(user?.id && form.owner_id && user.id === form.owner_id);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShare = async () => {
    setMenuOpen(false);
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${form.title} — MEXO Forms`,
          text: form.description || `Fill out ${form.title} on MEXO Forms`,
          url,
        });
        return;
      } catch (e) {}
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      showToast('✓ Link copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {}
  };

  const handleSaveProgressAction = () => {
    setMenuOpen(false);
    onSaveProgress?.();
    showToast('✓ Progress saved — You can continue later');
  };

  const handleClearAction = () => {
    setMenuOpen(false);
    setConfirmClearOpen(true);
  };

  return (
    <>
      {/* 44x44px Touch Target Three-Dot Button */}
      <button
        type="button"
        id="form-actions-menu-btn"
        onClick={() => setMenuOpen(true)}
        className="w-11 h-11 rounded-full flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200 transition-colors shrink-0 cursor-pointer"
        title="Form Options"
        aria-label="Form Options Menu"
      >
        <MoreVertical className="w-5 h-5" />
      </button>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-extrabold shadow-mexo-lg animate-in fade-in slide-in-from-bottom-3 duration-200">
          {toastMessage}
        </div>
      )}

      {/* Mobile Bottom Sheet / Modal */}
      <MexoModal
        open={menuOpen}
        onOpenChange={setMenuOpen}
        title="Form Options"
        maxWidth="max-w-sm"
      >
        <div className="py-1 space-y-1">
          {/* Share & Copy Link */}
          <button
            type="button"
            onClick={handleShare}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 text-xs font-bold text-slate-800 transition-colors text-left cursor-pointer min-h-[44px]"
          >
            <Share2 className="w-4 h-4 text-[#7C3AED]" />
            <span>{copied ? 'Link Copied ✓' : 'Share or Copy Form Link'}</span>
          </button>

          {/* Form Information */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setInfoOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 text-xs font-bold text-slate-800 transition-colors text-left cursor-pointer min-h-[44px]"
          >
            <Info className="w-4 h-4 text-indigo-600" />
            <span>Form Information & Details</span>
          </button>

          {/* Save Progress (if answers started) */}
          {answersCount > 0 && (
            <button
              type="button"
              onClick={handleSaveProgressAction}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-purple-50 text-xs font-bold text-[#7C3AED] transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <Bookmark className="w-4 h-4 text-[#7C3AED]" />
              <span>Save Progress ({answersCount} of {totalQuestionsCount} answered)</span>
            </button>
          )}

          {/* Clear Answers (if answers started) */}
          {answersCount > 0 && (
            <button
              type="button"
              onClick={handleClearAction}
              className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-rose-50 text-xs font-bold text-rose-600 transition-colors text-left cursor-pointer min-h-[44px]"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Clear My Answers</span>
            </button>
          )}

          {/* Report Form */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setReportOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer min-h-[44px]"
          >
            <Flag className="w-4 h-4 text-slate-400" />
            <span>Report Form</span>
          </button>

          {/* About MEXO Forms */}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setAboutOpen(true);
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-2xl hover:bg-slate-50 active:bg-slate-100 text-xs font-bold text-slate-700 transition-colors text-left cursor-pointer min-h-[44px]"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>About MEXO Forms</span>
          </button>

          {/* OWNER CONTROLS (Only visible to form creator/owner) */}
          {isOwner && (
            <div className="pt-2 mt-2 border-t border-slate-100 space-y-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider text-purple-700 px-3 py-1">
                Owner Administration
              </p>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/forms/${form.id}/edit`);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-indigo-50 text-xs font-bold text-[#7C3AED] transition-colors text-left cursor-pointer min-h-[44px]"
              >
                <Edit3 className="w-4 h-4" /> Edit Form in Builder
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/forms/${form.id}/responses`);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-indigo-50 text-xs font-bold text-[#7C3AED] transition-colors text-left cursor-pointer min-h-[44px]"
              >
                <BarChart2 className="w-4 h-4" /> View Responses Dashboard
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  navigate(`/forms/${form.id}/settings`);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl hover:bg-indigo-50 text-xs font-bold text-[#7C3AED] transition-colors text-left cursor-pointer min-h-[44px]"
              >
                <Settings className="w-4 h-4" /> Form Settings
              </button>
            </div>
          )}
        </div>
      </MexoModal>

      {/* Form Info Bottom Sheet */}
      <MexoModal open={infoOpen} onOpenChange={setInfoOpen} title="Form Details" maxWidth="max-w-sm">
        <div className="space-y-4 py-1 text-xs">
          <div>
            <h4 className="font-extrabold text-slate-900 text-sm">{form.title}</h4>
            {form.description && <p className="text-slate-500 mt-0.5 leading-relaxed">{form.description}</p>}
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Status</span>
              <span className="font-extrabold text-emerald-600 flex items-center gap-1">
                ● Accepting responses
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Deadline</span>
              <span className="font-bold text-slate-900">
                {form.ends_at ? new Date(form.ends_at).toLocaleString() : 'No deadline'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Responses Rule</span>
              <span className="font-bold text-slate-900">
                {form.one_response_per_user ? '1 response per account' : 'Unlimited responses'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-500">Sign-in</span>
              <span className="font-bold text-[#7C3AED] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> MEXO Account Required
              </span>
            </div>
          </div>
        </div>
      </MexoModal>

      {/* Clear Answers Confirmation */}
      <MexoModal open={confirmClearOpen} onOpenChange={setConfirmClearOpen} title="Clear All Answers?" maxWidth="max-w-xs">
        <div className="space-y-4 text-center py-2">
          <p className="text-xs text-slate-600 leading-relaxed">
            Your current unsubmitted answers to this form will be removed. This action cannot be undone.
          </p>
          <div className="flex gap-2 justify-center pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setConfirmClearOpen(false)}
              className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setConfirmClearOpen(false);
                onClearAnswers?.();
                showToast('Answers cleared');
              }}
              className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </MexoModal>

      {/* Report Modal */}
      <MexoModal open={reportOpen} onOpenChange={setReportOpen} title="Report Form" maxWidth="max-w-xs">
        <div className="space-y-3 py-1 text-xs text-center">
          <p className="text-slate-600 leading-relaxed">
            If you believe this form violates MEXO policies or contains harmful content, you can report it to MEXO Safety.
          </p>
          <MexoButton
            variant="danger"
            size="sm"
            className="w-full mt-2"
            onClick={() => {
              setReportOpen(false);
              showToast('Thank you. Form reported to MEXO Safety.');
            }}
          >
            Submit Report
          </MexoButton>
        </div>
      </MexoModal>

      {/* About Modal */}
      <AboutMexoFormsModal open={aboutOpen} onOpenChange={setAboutOpen} />
    </>
  );
};
