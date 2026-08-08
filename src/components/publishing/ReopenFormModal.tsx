import React, { useState } from 'react';
import { Form } from '../../types/forms';
import { MexoModal } from '../common/MexoModal';
import { MexoButton } from '../common/MexoButton';
import { MexoToggle } from '../common/MexoToggle';
import { RefreshCw, Play, Calendar, Clock } from 'lucide-react';

interface ReopenFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: Form;
  onReopen: (updates: Partial<Form>) => Promise<void>;
}

export const ReopenFormModal: React.FC<ReopenFormModalProps> = ({
  open,
  onOpenChange,
  form,
  onReopen,
}) => {
  const [reopenMode, setReopenMode] = useState<'now' | 'schedule'>('now');
  const [hasNewEndDate, setHasNewEndDate] = useState<boolean>(false);

  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState<string>('09:00');

  const [endDate, setEndDate] = useState<string>(new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10));
  const [endTime, setEndTime] = useState<string>('17:00');

  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let finalStartsAt: string | null = null;
      if (reopenMode === 'schedule' && startDate && startTime) {
        finalStartsAt = new Date(`${startDate}T${startTime}:00`).toISOString();
      } else {
        finalStartsAt = new Date().toISOString();
      }

      let finalEndsAt: string | null = null;
      if (hasNewEndDate && endDate && endTime) {
        finalEndsAt = new Date(`${endDate}T${endTime}:00`).toISOString();
      } else if (form.ends_at && new Date(form.ends_at) <= new Date()) {
        // Clear expired end date so reopening actually opens the form
        finalEndsAt = null;
      } else {
        finalEndsAt = form.ends_at || null;
      }

      const updates: Partial<Form> = {
        is_published: true,
        accepting_responses: true,
        status: 'published',
        manual_closed_at: null as any,
        paused_at: null as any,
        starts_at: finalStartsAt,
        ends_at: finalEndsAt,
      };

      await onReopen(updates);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <MexoModal open={open} onOpenChange={onOpenChange} title="Reopen Closed Form" maxWidth="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4 py-1">
        <p className="text-xs text-app-muted leading-relaxed">
          Reopening this form will allow new responses to be submitted using the same form URL. All existing responses remain saved intact.
        </p>

        <div className="space-y-2">
          <label className="block text-xs font-bold text-app-heading">Reopening Schedule</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setReopenMode('now')}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                reopenMode === 'now' ? 'border-[#7C3AED] bg-indigo-50 text-[#7C3AED]' : 'border-app-border bg-white text-app-heading'
              }`}
            >
              Open Immediately
            </button>
            <button
              type="button"
              onClick={() => setReopenMode('schedule')}
              className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                reopenMode === 'schedule' ? 'border-[#7C3AED] bg-indigo-50 text-[#7C3AED]' : 'border-app-border bg-white text-app-heading'
              }`}
            >
              Schedule Reopening
            </button>
          </div>
        </div>

        {reopenMode === 'schedule' && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-app-muted mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold bg-white"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-app-muted mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold bg-white"
                required
              />
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-app-heading">Set new deadline</span>
            <MexoToggle id="toggle-reopen-end-date" checked={hasNewEndDate} onCheckedChange={setHasNewEndDate} />
          </div>

          {hasNewEndDate && (
            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-1">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold bg-white"
                  required={hasNewEndDate}
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-app-muted mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                  className="w-full rounded-xl border border-app-border px-3 py-2 text-xs font-semibold bg-white"
                  required={hasNewEndDate}
                />
              </div>
            </div>
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="px-4 py-2 rounded-xl text-xs font-bold text-app-body hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <MexoButton type="submit" variant="primary" size="md" loading={saving}>
            Reopen Form
          </MexoButton>
        </div>
      </form>
    </MexoModal>
  );
};
