import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form } from '../../types/forms';
import { getFormAvailability } from '../../utils/formLifecycle';
import { PublishModal } from './PublishModal';
import { ExtendDeadlineModal } from './ExtendDeadlineModal';
import { IncreaseCapacityModal } from './IncreaseCapacityModal';
import { ReopenFormModal } from './ReopenFormModal';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import {
  Share2, Eye, Pause, Play, StopCircle, Clock, Users, RefreshCw,
  Copy, BarChart2, Settings, ExternalLink, Calendar, CheckCircle2, AlertCircle
} from 'lucide-react';

interface QuickOwnerControlsProps {
  form: Form;
  onUpdateForm: (updates: Partial<Form>) => Promise<void>;
  onDuplicateForm?: () => Promise<void>;
  onShareForm?: () => void;
  className?: string;
}

export const QuickOwnerControls: React.FC<QuickOwnerControlsProps> = ({
  form,
  onUpdateForm,
  onDuplicateForm,
  onShareForm,
  className = '',
}) => {
  const navigate = useNavigate();
  const availability = getFormAvailability(form, form.response_count || 0);

  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [capacityModalOpen, setCapacityModalOpen] = useState(false);
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const handlePauseToggle = async () => {
    setActionLoading(true);
    try {
      if (form.paused_at) {
        // Resume
        await onUpdateForm({ paused_at: undefined });
      } else {
        // Pause
        await onUpdateForm({ paused_at: new Date().toISOString() });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleManualClose = async () => {
    setActionLoading(true);
    try {
      await onUpdateForm({
        accepting_responses: false,
        status: 'closed',
        manual_closed_at: new Date().toISOString(),
      });
      setConfirmCloseOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePublishNow = async () => {
    setActionLoading(true);
    try {
      await onUpdateForm({
        is_published: true,
        accepting_responses: true,
        status: 'published',
        starts_at: new Date().toISOString(),
        manual_closed_at: undefined,
        paused_at: undefined,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendDeadline = async (newEndsAt: string) => {
    await onUpdateForm({
      is_published: true,
      accepting_responses: true,
      status: 'published',
      ends_at: newEndsAt,
      manual_closed_at: undefined,
      paused_at: undefined,
    });
  };

  const handleIncreaseCapacity = async (newLimit: number) => {
    await onUpdateForm({
      is_published: true,
      accepting_responses: true,
      status: 'published',
      response_limit: newLimit,
      manual_closed_at: undefined,
      paused_at: undefined,
    });
  };

  const publicUrl = `/f/${form.slug}`;

  return (
    <div className={`bg-white border border-app-border rounded-2xl p-3.5 shadow-mexo-sm ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Lifecycle Status Chip */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${availability.badgeColorClass}`}>
            <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
            {availability.badgeLabel}
          </span>

          <div className="text-xs min-w-0">
            {availability.status === 'OPEN' && (
              <span className="font-bold text-emerald-700">Accepting responses</span>
            )}
            {availability.status === 'SCHEDULED' && (
              <span className="font-bold text-indigo-700">Opens {availability.formattedStartDate || form.starts_at}</span>
            )}
            {availability.status === 'PAUSED' && (
              <span className="font-bold text-amber-700">Responses paused</span>
            )}
            {availability.status === 'CLOSED' && (
              <span className="font-bold text-rose-700">Ended {availability.formattedEndDate || 'Closed'}</span>
            )}
            {availability.status === 'FULL' && (
              <span className="font-bold text-purple-700">Full: {form.response_count || 0} / {form.response_limit} responses</span>
            )}

            {availability.totalCapacity !== undefined && availability.status !== 'FULL' && (
              <span className="text-app-muted ml-2 font-medium">
                ({availability.currentResponseCount} / {availability.totalCapacity} • {availability.remainingCapacity} spots left)
              </span>
            )}
          </div>
        </div>

        {/* Right: Contextual Quick Owner Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* OPEN Form Actions */}
          {availability.status === 'OPEN' && (
            <>
              <button
                type="button"
                onClick={() => onShareForm ? onShareForm() : window.open(publicUrl, '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-[#7C3AED]" /> Share
              </button>

              <button
                type="button"
                onClick={() => window.open(publicUrl, '_blank')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-app-muted" /> Preview
              </button>

              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePauseToggle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-amber-200 bg-amber-50/60 text-xs font-bold text-amber-800 hover:bg-amber-100 transition-colors cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5" /> Pause
              </button>

              <button
                type="button"
                onClick={() => setConfirmCloseOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50/60 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5" /> End Form
              </button>
            </>
          )}

          {/* SCHEDULED Form Actions */}
          {availability.status === 'SCHEDULED' && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePublishNow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" /> Publish Now
              </button>

              <button
                type="button"
                onClick={() => setPublishModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Calendar className="w-3.5 h-3.5 text-[#7C3AED]" /> Change Schedule
              </button>
            </>
          )}

          {/* PAUSED Form Actions */}
          {availability.status === 'PAUSED' && (
            <>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handlePauseToggle}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors cursor-pointer shadow-xs"
              >
                <Play className="w-3.5 h-3.5" /> Resume Responses
              </button>

              <button
                type="button"
                onClick={() => setConfirmCloseOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-xs font-bold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <StopCircle className="w-3.5 h-3.5" /> End Form Permanently
              </button>
            </>
          )}

          {/* CLOSED Form Actions */}
          {availability.status === 'CLOSED' && (
            <>
              <button
                type="button"
                onClick={() => setExtendModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs font-bold text-[#7C3AED] hover:bg-indigo-100 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5" /> Extend Deadline
              </button>

              <button
                type="button"
                onClick={() => setReopenModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Reopen Form
              </button>
            </>
          )}

          {/* FULL Form Actions */}
          {availability.status === 'FULL' && (
            <>
              <button
                type="button"
                onClick={() => setCapacityModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-bold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-xs"
              >
                <Users className="w-3.5 h-3.5" /> Increase Capacity
              </button>

              <button
                type="button"
                onClick={() => setExtendModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-app-border text-xs font-bold text-app-heading hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <Clock className="w-3.5 h-3.5 text-app-muted" /> Extend Deadline
              </button>
            </>
          )}

          {/* Publishing Settings gear */}
          <button
            type="button"
            onClick={() => setPublishModalOpen(true)}
            className="p-1.5 rounded-xl border border-app-border hover:bg-slate-100 text-app-muted hover:text-app-heading transition-colors cursor-pointer"
            title="Publishing & Availability Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sub-modals */}
      <PublishModal
        open={publishModalOpen}
        onOpenChange={setPublishModalOpen}
        form={form}
        onSavePublishSettings={onUpdateForm}
      />

      <ExtendDeadlineModal
        open={extendModalOpen}
        onOpenChange={setExtendModalOpen}
        form={form}
        onSave={handleExtendDeadline}
      />

      <IncreaseCapacityModal
        open={capacityModalOpen}
        onOpenChange={setCapacityModalOpen}
        form={form}
        onSave={handleIncreaseCapacity}
      />

      <ReopenFormModal
        open={reopenModalOpen}
        onOpenChange={setReopenModalOpen}
        form={form}
        onReopen={onUpdateForm}
      />

      {/* Confirm Manual Close Modal */}
      <MexoModal open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen} title="End This Form?" maxWidth="max-w-md">
        <div className="space-y-4 py-1">
          <p className="text-xs text-app-body leading-relaxed">
            People will no longer be able to submit new responses to <span className="font-bold text-app-heading">{form.title}</span>. Existing responses, questions, and analytics will remain preserved intact.
          </p>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmCloseOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-app-body hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <MexoButton
              variant="danger"
              size="md"
              loading={actionLoading}
              onClick={handleManualClose}
            >
              End Form Now
            </MexoButton>
          </div>
        </div>
      </MexoModal>
    </div>
  );
};
