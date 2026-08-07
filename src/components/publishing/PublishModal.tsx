import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import {
  Globe, Calendar, Clock, CheckCircle2, Copy, Share2, ExternalLink,
  AlertTriangle, ShieldCheck, Check,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PublishModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  onSavePublishSettings: (updates: Partial<Form>) => Promise<void>;
}

export const PublishModal: React.FC<PublishModalProps> = ({
  open,
  onOpenChange,
  form,
  onSavePublishSettings,
}) => {
  const navigate = useNavigate();
  const [publishing, setPublishing] = useState(false);
  const [publishedSuccess, setPublishedSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const isScheduled = Boolean(form.starts_at && new Date(form.starts_at) > new Date());
  const publicUrl = `${window.location.origin}/f/${form.slug}`;

  const formatDateTime = (isoStr?: string) => {
    if (!isoStr) return '';
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(undefined, {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  const handleConfirmPublish = async () => {
    setValidationError(null);

    // Validation checks
    if (!form.title || !form.title.trim()) {
      setValidationError('Form title cannot be empty.');
      return;
    }

    if (form.starts_at && form.ends_at && new Date(form.ends_at) <= new Date(form.starts_at)) {
      setValidationError('End date must be after the start date.');
      return;
    }

    setPublishing(true);

    try {
      const updates: Partial<Form> = {
        is_published: true,
        status: 'published',
        accepting_responses: true,
        manual_closed_at: undefined,
        paused_at: undefined,
      };

      await onSavePublishSettings(updates);
      setPublishedSuccess(true);
    } catch (e: any) {
      setValidationError(e?.message || 'Publishing failed. Please try again.');
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseModal = () => {
    setPublishedSuccess(false);
    setValidationError(null);
    onOpenChange(false);
  };

  return (
    <MexoModal
      open={open}
      onOpenChange={(op) => { if (!op) handleCloseModal(); }}
      title={publishedSuccess ? (isScheduled ? '✓ Form Scheduled' : '✓ Form Published') : 'Publish Form?'}
      maxWidth="max-w-md"
    >
      {publishedSuccess ? (
        /* Post-Publish Success Screen */
        <div className="space-y-5 text-center py-2">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center mx-auto text-emerald-500 shadow-xs">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <h3 className="text-base font-extrabold text-app-heading">{form.title}</h3>
            <p className="text-xs text-app-muted mt-1">
              {isScheduled
                ? `Form scheduled to open on ${formatDateTime(form.starts_at)}`
                : 'Your form is now live and ready to accept responses.'}
            </p>
          </div>

          {/* Copy Link Box */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="flex-1 bg-transparent text-xs text-app-heading outline-none font-mono truncate"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 rounded-xl bg-purple-50 text-[#7C3AED] hover:bg-purple-100 text-xs font-bold transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={() => window.open(publicUrl, '_blank')}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity min-h-[44px] cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" /> View Public Form
            </button>
            <button
              onClick={() => {
                handleCloseModal();
                navigate(`/forms/${form.id}/share`);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold text-app-heading border border-app-border hover:bg-slate-50 transition-colors min-h-[44px] cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-[#7C3AED]" /> Share & QR Code
            </button>
            <button
              onClick={handleCloseModal}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-app-muted hover:text-app-heading transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        /* Small Pre-Publish Confirmation Screen */
        <div className="space-y-4 py-1">
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
            <h4 className="text-sm font-extrabold text-app-heading">{form.title}</h4>
            <div className="text-xs text-app-body space-y-1 font-semibold">
              <p className="flex items-center gap-1.5 text-slate-700">
                <Globe className="w-3.5 h-3.5 text-[#7C3AED]" />
                {isScheduled
                  ? `Scheduled to open: ${formatDateTime(form.starts_at)}`
                  : 'Form will start accepting responses immediately after publishing.'}
              </p>
              {form.ends_at && (
                <p className="flex items-center gap-1.5 text-amber-700">
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  Closes: {formatDateTime(form.ends_at)}
                </p>
              )}
              {form.response_limit && (
                <p className="flex items-center gap-1.5 text-purple-700">
                  Capacity limit: {form.response_limit} responses
                </p>
              )}
            </div>
          </div>

          <p className="text-[11px] text-app-muted leading-relaxed">
            You can change start dates, end dates, capacities, or pause responses anytime in <span className="font-bold text-app-heading">Form Settings</span>.
          </p>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleCloseModal}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-app-heading border border-app-border hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmPublish}
              disabled={publishing}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#7C3AED] to-[#0878e8] hover:opacity-90 transition-opacity flex items-center gap-1.5 disabled:opacity-50 min-h-[40px] cursor-pointer"
            >
              {publishing ? (
                'Publishing...'
              ) : isScheduled ? (
                <>
                  <Calendar className="w-3.5 h-3.5" /> Schedule Form
                </>
              ) : (
                <>
                  <Globe className="w-3.5 h-3.5" /> Publish Form
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </MexoModal>
  );
};
